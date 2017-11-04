// Copyright cantstopthesignals@gmail.com

goog.provide('five.Auth');

goog.require('five.Dialog');
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

/** @type {goog.debug.Logger} */
five.Auth.prototype.logger_ = goog.debug.Logger.getLogger('five.Auth');

/** @type {five.Auth.ConnectDialog_} */
five.Auth.prototype.connectDialog_;

/** @type {number} */
five.Auth.prototype.authRefreshTimeoutId_;

five.Auth.prototype.start = function() {
  this.loadGapiJavascriptClientAndAuth_();

  if (goog.DEBUG) {
    goog.exportSymbol('five.auth.invalidateToken',
        goog.bind(this.invalidateToken_, this));
  }
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
  this.checkAuth_();
  goog.asserts.assert(!this.authDeferred_.hasFired());
};

/**
 * Check if the current auth token seems to be valid.
 * @return {boolean}
 */
five.Auth.prototype.isTokenValid = function() {
  var token = goog.getObjectByName('gapi.auth.getToken')();
  return token && ('access_token' in token);
};

/** @return {goog.async.Deferred} */
five.Auth.prototype.getAuthDeferred = function() {
  return this.authDeferred_;
};

/** @override */
five.Auth.prototype.disposeInternal = function() {
  this.clearAuthRefreshTimer_();
  goog.base(this, 'disposeInternal');
}

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
  scriptEl.async = true;
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
  window.setTimeout(goog.bind(this.checkAuth_, this), 1);
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
  if (!this.connectDialog_) {
    this.connectDialog_ = new five.Auth.ConnectDialog_(
        goog.bind(this.handleAuthResult_, this));
    this.registerDisposable(this.connectDialog_);
  }
  this.connectDialog_.show();
};

five.Auth.prototype.handleAuthResult_ = function(authResult) {
  var authorized = authResult && 'access_token' in authResult;
  if (authorized) {
    this.logger_.info('handleAuthResult_: authorized');
    this.setAuthRefreshTimer_(parseInt(authResult['expires_in'], 10));
  } else {
    this.logger_.info('handleAuthResult_: not authorized or no result');
  }
  if (this.authDeferred_.hasFired()) {
    return;
  }
  if (!authorized) {
    this.fullAuth_();
    return;
  }
  if (this.connectDialog_) {
    this.connectDialog_.hide();
  }
  this.authDeferred_.callback(null);
};

five.Auth.prototype.clearAuthRefreshTimer_ = function() {
  if (this.authRefreshTimeoutId_) {
    window.clearTimeout(this.authRefreshTimeoutId_);
    delete this.authRefreshTimeoutId_;
  }
};

five.Auth.prototype.setAuthRefreshTimer_ = function(expireTimeSecs) {
  goog.asserts.assert(goog.math.isFiniteNumber(expireTimeSecs));
  this.clearAuthRefreshTimer_();
  var refreshDelaySecs = Math.max(5 * 60, expireTimeSecs - 5 * 60);
  this.authRefreshTimeoutId_ = window.setTimeout(
      goog.bind(this.checkAuth_, this), refreshDelaySecs * 1000);
};

five.Auth.prototype.invalidateToken_ = function() {
  this.logger_.info('invalidateToken_');
  var token = goog.getObjectByName('gapi.auth.getToken')();
  var accessToken = goog.asserts.assertString(token['access_token']);
  token['access_token'] = 'invalid';
  goog.getObjectByName('gapi.auth.setToken')(token);
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

  var contentEl = this.getContentEl();

  var headerEl = document.createElement('div');
  goog.dom.classes.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode(
      '5 mins needs your authorization to read your calendar'));
  contentEl.appendChild(headerEl);

  var connectButtonEl = document.createElement('div');
  goog.dom.classes.add(connectButtonEl, 'button');
  this.eventHandler.listen(connectButtonEl, goog.events.EventType.CLICK,
      this.handleConnectClick_);
  connectButtonEl.appendChild(document.createTextNode('Connect'));
  contentEl.appendChild(connectButtonEl);
};

five.Auth.ConnectDialog_.prototype.handleConnectClick_ = function() {
  goog.getObjectByName('gapi.auth.authorize')({
    'client_id': five.Auth.GAPI_CLIENT_ID,
    'scope': five.Auth.GAPI_SCOPES,
    'immediate': false
  }, this.authResultCallback_);
};
