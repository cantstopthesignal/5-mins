// Copyright cantstopthesignals@gmail.com

goog.provide('five.Auth');

goog.require('five.CalendarApi');
goog.require('five.CalendarChooser');
goog.require('five.EventsList');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * Handle authorization.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.Auth = function() {
  this.authDeferred_ = new goog.async.Deferred();
};
goog.inherits(five.Auth, goog.events.EventTarget);

five.Auth.GAPI_API_KEY = 'AIzaSyDh5fbf_pmhJko-6SBua7ptbjnrNl9Jer4';
five.Auth.GAPI_CLIENT_ID = '446611198518.apps.googleusercontent.com';
five.Auth.GAPI_SCOPES = ['https://www.googleapis.com/auth/calendar'];

five.Auth.GAPI_FULL_AUTH_TIMEOUT = 5000;

/** @type {goog.debug.Logger} */
five.Auth.prototype.logger_ = goog.debug.Logger.getLogger('five.Auth');

/** @type {five.Auth.ConnectDialog_} */
five.Auth.prototype.connectDialog_;

/** @type {number} */
five.Auth.prototype.gapiFullAuthTimeoutId_;

five.Auth.prototype.start = function() {
  this.loadGapiJavascriptClientAndAuth_();
};

/**
 * Restart auth in the case where an api has detected an authorization failure.
 */
five.Auth.prototype.restart = function() {
  if (!this.authDeferred_.hasFired()) {
    // Re-auth already in progress.
    return;
  }
  this.authDeferred_ = new goog.async.Deferred();
  this.startAuth_();
  goog.asserts.assert(!this.authDeferred_.hasFired());
};

/** @return {goog.async.Deferred} */
five.Auth.prototype.getAuthDeferred = function() {
  return this.authDeferred_;
};

five.Auth.prototype.loadGapiJavascriptClientAndAuth_ = function() {
  if (goog.getObjectByName('gapi.client') &&
      goog.getObjectByName('gapi.auth')) {
    this.logger_.info('loadGapiJavascriptClientAndAuth_ already present');
    this.handleGapiClientLoad_();
    return;
  }
  var callbackName = 'callback_' + goog.getUid(this);
  goog.exportSymbol(callbackName,
      goog.bind(this.handleGapiClientLoad_, this));
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/client.js?onload=" +
      encodeURIComponent(callbackName);
  document.body.appendChild(scriptEl);
};

five.Auth.prototype.handleGapiClientLoad_ = function() {
  this.logger_.info('handleGapiClientLoad_');
  goog.getObjectByName('gapi.client.setApiKey')(five.Auth.GAPI_API_KEY);
  goog.getObjectByName('gapi.auth.init')(
      goog.bind(this.handleGapiAuthInit_, this));
};

five.Auth.prototype.handleGapiAuthInit_ = function() {
  this.logger_.info('handleGapiAuthInit_');
  this.startAuth_();
};

five.Auth.prototype.startAuth_ = function() {
  this.logger_.info('startAuth_');
  window.setTimeout(goog.bind(this.checkAuth_, this), 1);
  this.gapiFullAuthTimeoutId_ = window.setTimeout(
      goog.bind(this.fullAuth_, this), five.Auth.GAPI_FULL_AUTH_TIMEOUT);
};

five.Auth.prototype.checkAuth_ = function() {
  this.logger_.info('checkAuth_');
  goog.getObjectByName('gapi.auth.authorize')({
    'client_id': five.Auth.GAPI_CLIENT_ID,
    'scope': five.Auth.GAPI_SCOPES,
    'immediate': true
  }, goog.bind(this.handleAuthResult_, this));
};

five.Auth.prototype.fullAuth_ = function() {
  this.logger_.info('fullAuth_');
  this.clearFullAuthTimer_();
  if (!this.connectDialog_) {
    this.connectDialog_ = new five.Auth.ConnectDialog_(
        goog.bind(this.handleAuthResult_, this));
    this.registerDisposable(this.connectDialog_);
  }
  this.connectDialog_.show();
};

five.Auth.prototype.clearFullAuthTimer_ = function() {
  if (this.gapiFullAuthTimeoutId_) {
    window.clearTimeout(this.gapiFullAuthTimeoutId_);
    delete this.gapiFullAuthTimeoutId_;
  }
};

five.Auth.prototype.handleAuthResult_ = function(authResult) {
  if (authResult) {
    this.logger_.info('handleAuthResult_: authorized ');
  } else {
    this.logger_.info('handleAuthResult_: no result');
  }
  if (this.authDeferred_.hasFired()) {
    return;
  }
  if (!authResult) {
    // An empty auth result can happen if the user previously authorized
    // this service but then de-authorized.  Go immediately to full auth
    // in this case.
    this.fullAuth_();
    return;
  }
  this.clearFullAuthTimer_();
  if (this.connectDialog_) {
    this.connectDialog_.hide();
  }
  this.authDeferred_.callback(null);
};

/**
 * @constructor
 * @extends {five.Dialog}
 */
five.Auth.ConnectDialog_ = function(authResultCallback) {
  goog.base(this);

  this.authResultCallback_ = authResultCallback;
};
goog.inherits(five.Auth.ConnectDialog_, five.Dialog);

five.Auth.ConnectDialog_.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var headerEl = document.createElement('div');
  goog.dom.classes.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode(
      '5 mins needs your authorization to read your calendar'));
  this.el.appendChild(headerEl);

  var connectButtonEl = document.createElement('div');
  goog.dom.classes.add(connectButtonEl, 'button');
  this.eventHandler.listen(connectButtonEl, goog.events.EventType.CLICK,
      this.handleConnectClick_);
  connectButtonEl.appendChild(document.createTextNode('Connect'));
  this.el.appendChild(connectButtonEl);
};

five.Auth.ConnectDialog_.prototype.handleConnectClick_ = function() {
  goog.getObjectByName('gapi.auth.authorize')({
    'client_id': five.Auth.GAPI_CLIENT_ID,
    'scope': five.Auth.GAPI_SCOPES,
    'immediate': false
  }, this.authResultCallback_);
};
