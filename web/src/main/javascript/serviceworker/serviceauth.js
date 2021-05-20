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
};
goog.inherits(five.ServiceAuth, five.BaseAuth);

/** @type {!string} */
five.ServiceAuth.RPC_NAME_KEY = 'rpcName';

/** @type {!string} */
five.ServiceAuth.RPC_REQUEST_KEY = 'rpcRequest';

/** @type {!string} */
five.ServiceAuth.RPC_AUTHORIZATION_CHANGED = 'authorizationChanged';

/** @type {goog.log.Logger} */
five.ServiceAuth.prototype.logger_ = goog.log.getLogger(
    'five.ServiceAuth');

/** @param {!goog.events.BrowserEvent} e */
five.ServiceAuth.prototype.handleMessage = function(e) {
  var event = e.getBrowserEvent();
  if (event.data[five.ServiceAuth.RPC_NAME_KEY] == five.ServiceAuth.RPC_AUTHORIZATION_CHANGED) {
    this.authorizationHeaderValue_ = event.data[five.ServiceAuth.RPC_REQUEST_KEY];
  } else {
    throw Error('Unexpected message ' + event);
  }
};

/** @override */
five.ServiceAuth.prototype.restart = function() {
  this.logger_.severe('TODO restart not implemented');
};

/** @override */
five.ServiceAuth.prototype.isTokenValid = function() {
  this.logger_.severe('TODO isTokenValid not implemented');
  return false;
};

/** @override */
five.ServiceAuth.prototype.getAuthDeferred = function() {
  this.logger_.severe('TODO getAuthDeferred not implemented');
  return goog.async.Deferred.succeed(null);
};

/** @override */
five.ServiceAuth.prototype.getAuthorizationHeaderValue = function() {
  return this.authorizationHeaderValue_;
};