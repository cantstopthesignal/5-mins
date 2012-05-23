// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.Auth');

goog.require('fivemins.CalendarApi');
goog.require('fivemins.CalendarChooser');
goog.require('fivemins.EventsList');
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
fivemins.Auth = function() {
  this.authDeferred_ = new goog.async.Deferred();
};
goog.inherits(fivemins.Auth, goog.events.EventTarget);

fivemins.Auth.GAPI_API_KEY = 'AIzaSyDh5fbf_pmhJko-6SBua7ptbjnrNl9Jer4';
fivemins.Auth.GAPI_CLIENT_ID = '446611198518.apps.googleusercontent.com';
fivemins.Auth.GAPI_SCOPES = ['https://www.googleapis.com/auth/calendar'];

fivemins.Auth.GAPI_FULL_AUTH_TIMEOUT = 5000;

fivemins.Auth.GAPI_CHECK_AUTH_INTERVAL = 5000;

/** @type {goog.debug.Logger} */
fivemins.Auth.prototype.logger_ = goog.debug.Logger.getLogger('fivemins.Auth');

/** @type {number} */
fivemins.Auth.prototype.gapiFullAuthTimeoutId_;

/** @type {number} */
fivemins.Auth.prototype.gapiCheckAuthPollIntervalId_;

fivemins.Auth.prototype.start = function() {
  this.loadGapiJavascriptClientAndAuth_();
};

/**
 * Restart auth in the case where an api has detected an authorization failure.
 */
fivemins.Auth.prototype.restart = function() {
  if (!this.authDeferred_.hasFired()) {
    // Re-auth already in progress.
    return;
  }
  this.authDeferred_ = new goog.async.Deferred();
  this.startAuth_();
  goog.asserts.assert(!this.authDeferred_.hasFired());
};

/** @return {goog.async.Deferred} */
fivemins.Auth.prototype.getAuthDeferred = function() {
  return this.authDeferred_;
};

fivemins.Auth.prototype.loadGapiJavascriptClientAndAuth_ = function() {
  var callbackName = 'callback_' + goog.getUid(this);
  goog.exportSymbol(callbackName,
      goog.bind(this.handleGapiClientLoad_, this));
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/client.js?onload=" +
      encodeURIComponent(callbackName);
  document.body.appendChild(scriptEl);
};

fivemins.Auth.prototype.handleGapiClientLoad_ = function() {
  this.logger_.info('handleGapiClientLoad_');
  goog.getObjectByName('gapi.client.setApiKey')(fivemins.Auth.GAPI_API_KEY);
  goog.getObjectByName('gapi.auth.init')(
      goog.bind(this.handleGapiAuthInit_, this));
};

fivemins.Auth.prototype.handleGapiAuthInit_ = function() {
  this.logger_.info('handleGapiAuthInit_');
  this.startAuth_();
};

fivemins.Auth.prototype.startAuth_ = function() {
  this.logger_.info('startAuth_');
  window.setTimeout(goog.bind(this.checkAuth_, this), 1);
  this.gapiFullAuthTimeoutId_ = window.setTimeout(
      goog.bind(this.fullAuth_, this), fivemins.Auth.GAPI_FULL_AUTH_TIMEOUT);
};

fivemins.Auth.prototype.checkAuth_ = function() {
  this.logger_.info('checkAuth_');
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: fivemins.Auth.GAPI_CLIENT_ID,
    scope: fivemins.Auth.GAPI_SCOPES,
    immediate: true
  }, goog.bind(this.handleAuthResult_, this));
};

fivemins.Auth.prototype.fullAuth_ = function() {
  this.logger_.info('fullAuth_');
  this.clearFullAuthTimer_();
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: fivemins.Auth.GAPI_CLIENT_ID,
    scope: fivemins.Auth.GAPI_SCOPES,
    immediate: false
  }, goog.bind(this.handleAuthResult_, this));
  this.gapiCheckAuthPollIntervalId_ = window.setInterval(
      goog.bind(this.checkAuth_, this),
      fivemins.Auth.GAPI_CHECK_AUTH_INTERVAL);
};

fivemins.Auth.prototype.clearFullAuthTimer_ = function() {
  if (this.gapiFullAuthTimeoutId_) {
    window.clearTimeout(this.gapiFullAuthTimeoutId_);
    delete this.gapiFullAuthTimeoutId_;
  }
};

fivemins.Auth.prototype.clearCheckAuthPoller_ = function() {
  if (this.gapiCheckAuthPollIntervalId_) {
    window.clearInterval(this.gapiCheckAuthPollIntervalId_);
    delete this.gapiCheckAuthPollIntervalId_;
  }
};

fivemins.Auth.prototype.handleAuthResult_ = function(authResult) {
  if (authResult) {
    this.logger_.info('handleAuthResult_: authorized ');
  } else {
    this.logger_.info('handleAuthResult_: no result');
  }
  if (this.authDeferred_.hasFired()) {
    return;
  }
  if (!authResult) {
    if (!this.gapiCheckAuthPollIntervalId_) {
      // An empty auth result can happen if the user previously authorized
      // this service but then de-authorized.  Go immediately to full auth
      // in this case.
      this.fullAuth_();
    }
    return;
  }
  this.clearFullAuthTimer_();
  this.clearCheckAuthPoller_();
  this.authDeferred_.callback(null);
};
