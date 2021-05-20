// Copyright cantstopthesignals@gmail.com

goog.provide('five.Auth');

goog.require('five.BaseAuth');
goog.require('five.Dialog');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');


/**
 * Handle authorization.
 * @constructor
 * @extends {five.BaseAuth}
 */
five.Auth = function() {
  goog.base(this);

  /** @type {!goog.async.Deferred} */
  this.authDeferred_ = new goog.async.Deferred();

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.Auth, five.BaseAuth);

five.Auth.GAPI_CLIENT_ID = '446611198518.apps.googleusercontent.com';
five.Auth.GAPI_SCOPES = 'https://www.googleapis.com/auth/calendar';

/** @type {number} */
five.Auth.GAPI_INIT_TIMEOUT_ = 10000;

/** @type {goog.debug.Logger} */
five.Auth.prototype.logger_ = goog.log.getLogger('five.Auth');

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

/** @override */
five.Auth.prototype.restart = function() {
  if (!this.authDeferred_.hasFired()) {
    // Re-auth already in progress.
    return;
  }
  this.authDeferred_ = new goog.async.Deferred();
  this.checkAuth_(true);
  goog.asserts.assert(!this.authDeferred_.hasFired());
};

/** @override */
five.Auth.prototype.isTokenValid = function() {
  var token = goog.getObjectByName('gapi.auth.getToken')();
  return token && ('access_token' in token);
};

/** @override */
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
      goog.getObjectByName('gapi.auth2')) {
    this.logger_.info('loadGapiJavascriptClientAndAuth_ already present');
    this.handleGapiClientLoad_();
    return;
  }
  var callbackName = 'callback_' + goog.getUid(this);
  goog.exportSymbol(callbackName,
      goog.bind(this.handleGapiClientLoad_, this));
  var scriptEl = document.createElement("script");
  scriptEl.async = true;
  scriptEl.defer = true;
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/api.js?onload=" +
      encodeURIComponent(callbackName);
  this.eventHandler_.
      listen(scriptEl, goog.events.EventType.ERROR, this.handleLoadGapiJavascriptClientError_);

  document.body.appendChild(scriptEl);
};

five.Auth.prototype.handleGapiClientLoad_ = function() {
  this.logger_.info('handleGapiClientLoad_');
  goog.getObjectByName('gapi.load')('client:auth2',
      goog.bind(this.handleGapiLoad_, this));
};

five.Auth.prototype.handleGapiLoad_ = function() {
  this.logger_.info('handleGapiLoad_');
  var initParams = {
    'client_id': five.Auth.GAPI_CLIENT_ID,
    'scope': five.Auth.GAPI_SCOPES
  };
  var timeoutId = self.setTimeout(() => {
    this.logger_.severe('Timed out initializing google api client');
    goog.asserts.assert(!this.authDeferred_.hasFired());
    this.authDeferred_.errback(Error('Timed out initializing google api client'));
  }, five.Auth.GAPI_INIT_TIMEOUT_);
  goog.getObjectByName('gapi.auth2.init')(initParams)
    .then(() => {
      self.clearTimeout(timeoutId);
      this.checkAuth_(false);
    })
    .catch(err => {
      self.clearTimeout(timeoutId);
      this.logger_.severe('Error initializing google api client: ' + err, err);
    });
};

five.Auth.prototype.handleLoadGapiJavascriptClientError_ = function(err) {
  this.logger_.severe('Error loading gapi javascript client: ' + err, err);
  goog.asserts.assert(!this.authDeferred_.hasFired());
  this.authDeferred_.errback(err);
};

five.Auth.prototype.checkAuth_ = function(refresh) {
  this.logger_.info('checkAuth_ refresh=' + refresh);
  var authInstance = goog.getObjectByName('gapi.auth2.getAuthInstance')();
  if (authInstance['isSignedIn']['get']()) {
    if (refresh) {
      authInstance['currentUser']['get']()['reloadAuthResponse']()
        .then(this.handleAuthResult_.bind(this))
        .catch(function(err) {
          this.logger_.severe('Error reloading auth: ' + err, err);
        }.bind(this));
    } else {
      this.handleAuthResult_();
    }
  } else {
    this.fullAuth_();
  }
};

five.Auth.prototype.fullAuth_ = function() {
  this.logger_.info('fullAuth_');
  if (!this.connectDialog_) {
    this.connectDialog_ = new five.Auth.ConnectDialog_(
        this.handleAuthResult_.bind(this));
    this.registerDisposable(this.connectDialog_);
  }
  this.connectDialog_.show();
};

five.Auth.prototype.handleAuthResult_ = function() {
  var authInstance = goog.getObjectByName('gapi.auth2.getAuthInstance')();
  var authorized = authInstance['isSignedIn']['get']();
  if (authorized) {
    this.logger_.info('handleAuthResult_: authorized');
    var authResponse = authInstance['currentUser']['get']()['getAuthResponse']();
    this.setAuthRefreshTimer_(parseInt(authResponse['expires_in'], 10));
    this.updateServiceAuth_(authResponse);
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
    self.clearTimeout(this.authRefreshTimeoutId_);
    delete this.authRefreshTimeoutId_;
  }
};

five.Auth.prototype.setAuthRefreshTimer_ = function(expireTimeSecs) {
  goog.asserts.assert(isFinite(expireTimeSecs));
  this.clearAuthRefreshTimer_();
  var refreshDelaySecs = Math.max(5 * 60, expireTimeSecs - 5 * 60);
  this.authRefreshTimeoutId_ = self.setTimeout(
      this.checkAuth_.bind(this, true), refreshDelaySecs * 1000);
};

five.Auth.prototype.invalidateToken_ = function() {
  this.logger_.info('invalidateToken_');
  var token = goog.getObjectByName('gapi.auth.getToken')();
  var accessToken = goog.asserts.assertString(token['access_token']);
  token['access_token'] = 'invalid';
  goog.getObjectByName('gapi.auth.setToken')(token);
  this.updateServiceAuth_(token);
};

five.Auth.prototype.updateServiceAuth_ = function(authResponse) {
  var authorizationHeader = 'Bearer ' + authResponse['access_token'];
  navigator.serviceWorker.ready
    .then(() => {
      if (navigator.serviceWorker.controller) {
        var message = {};
        message[five.ServiceWorkerApi.MESSAGE_COMMAND_KEY] =
            five.ServiceWorkerApi.COMMAND_AUTH_RPC;
        message[five.ServiceAuth.RPC_NAME_KEY] = five.ServiceAuth.RPC_AUTHORIZATION_CHANGED;
        message[five.ServiceAuth.RPC_REQUEST_KEY] = authorizationHeader;
        navigator.serviceWorker.controller.postMessage(message);
      } else {
        this.logger_.severe('ServiceWorker controller not set');
        throw Error('ServiceWorker controller not set');
      }
    });
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

/** @type {goog.debug.Logger} */
five.Auth.ConnectDialog_.prototype.logger_ = goog.log.getLogger('five.Auth.ConnectDialog_');

five.Auth.ConnectDialog_.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var contentEl = this.getContentEl();
  goog.dom.classlist.add(contentEl, 'connect-dialog');

  var appTitleEl = document.createElement('div');
  goog.dom.classlist.add(appTitleEl, 'app-title');

  var iconEl = document.createElement('span');
  goog.dom.classlist.add(iconEl, 'icon');
  appTitleEl.appendChild(iconEl);

  appTitleEl.appendChild(document.createTextNode('5 mins'));
  contentEl.appendChild(appTitleEl);

  var appDescriptionEl = document.createElement('p');
  appDescriptionEl.appendChild(document.createTextNode(
      'This application helps manage your schedule to a precision of five minutes. ' +
      'You can drag and drop, duplicate, and add future events with ease.'));
  contentEl.appendChild(appDescriptionEl);

  var connectNoteEl = document.createElement('p');
  connectNoteEl.appendChild(document.createTextNode(
      'To get started, 5 mins will need access your calendar. Press Connect to continue ' +
      'with authorization.'));
  contentEl.appendChild(connectNoteEl);

  var connectButtonEl = document.createElement('div');
  goog.dom.classlist.add(connectButtonEl, 'button');
  this.eventHandler.listen(connectButtonEl, goog.events.EventType.CLICK,
      this.handleConnectClick_);
  connectButtonEl.appendChild(document.createTextNode('Connect'));
  contentEl.appendChild(connectButtonEl);
};

five.Auth.ConnectDialog_.prototype.handleConnectClick_ = function() {
  var authInstance = goog.getObjectByName('gapi.auth2.getAuthInstance')();
  authInstance['signIn']()
    .then(this.authResultCallback_.bind(this))
    .catch(function(err) {
      this.logger_.severe('Error requesting google auth sign in: ' + err, err);
    }.bind(this));
};
