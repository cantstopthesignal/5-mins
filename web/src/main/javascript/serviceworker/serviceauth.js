// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceAuth');

goog.require('five.BaseAuth');
goog.require('goog.log');


/**
 * Service calendar api wrapper. Communicates with the service worker client
 * @constructor
 * @extends {five.BaseAuth}
 */
five.ServiceAuth = function() {
  goog.base(this);

  /** @type {!string} */
  this.authorizationHeaderValue_ = '';

  /** @type {!goog.async.Deferred} */
  this.authDeferred_ = new goog.async.Deferred();

  /** @type {MessagePort} */
  this.clientPort_;
};
goog.inherits(five.ServiceAuth, five.BaseAuth);

/** @type {!string} */
five.ServiceAuth.RPC_NAME_KEY = 'rpcName';

/** @type {!string} */
five.ServiceAuth.RPC_REQUEST_KEY = 'rpcRequest';

/** @type {!string} */
five.ServiceAuth.RPC_REGISTER = 'register';

/** @type {!string} */
five.ServiceAuth.RPC_AUTHORIZATION_CHANGED = 'authorizationChanged';

/** @type {!string} */
five.ServiceAuth.RPC_RESTART = 'restart';

/** @type {goog.log.Logger} */
five.ServiceAuth.prototype.logger_ = goog.log.getLogger(
    'five.ServiceAuth');

/** @param {!goog.events.BrowserEvent} e */
five.ServiceAuth.prototype.handleMessage = function(e) {
  var event = e.getBrowserEvent();
  var rpcName = event.data[five.ServiceAuth.RPC_NAME_KEY];
  if (rpcName == five.ServiceAuth.RPC_AUTHORIZATION_CHANGED) {
    this.authorizationHeaderValue_ = event.data[five.ServiceAuth.RPC_REQUEST_KEY];
    if (!this.authDeferred_.hasFired()) {
      this.authDeferred_.callback(null);
    }
  } else if (rpcName == five.ServiceAuth.RPC_REGISTER) {
    this.clientPort_ = event.ports[0];
  } else {
    throw Error('Unexpected message ' + event);
  }
};

/** @override */
five.ServiceAuth.prototype.restart = function() {
  if (!this.clientPort_) {
    this.logger_.severe('Cannot restart auth: no client registered');
    return;
  }

  if (!this.authDeferred_.hasFired()) {
    return;
  }
  this.authDeferred_ = new goog.async.Deferred();
  var message = {};
  message[five.ServiceAuth.RPC_NAME_KEY] = five.ServiceAuth.RPC_RESTART;
  this.clientPort_.postMessage(message);
};

/** @override */
five.ServiceAuth.prototype.isTokenValid = function() {
  return true;
};

/** @override */
five.ServiceAuth.prototype.getAuthDeferred = function() {
  return this.authDeferred_.branch();
};

/** @override */
five.ServiceAuth.prototype.getAuthorizationHeaderValue = function() {
  return this.authorizationHeaderValue_;
};