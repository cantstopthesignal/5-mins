// Copyright cantstopthesignals@gmail.com

goog.provide('five.testing.FakeAuth');
goog.provide('five.testing.FakeAuth.RequestHandler');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * Fake server authorization for tests.
 * @param {goog.dom.DomHelper} domHelper
 * @param {five.testing.FakeAuth.RequestHandler} requestHandler
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.testing.FakeAuth = function(domHelper, requestHandler) {
  goog.base(this);

  /** @type {goog.dom.DomHelper} */
  this.domHelper_ = domHelper;

  /** @type {!five.testing.FakeAuth.RequestHandler} */
  this.requestHandler_ = requestHandler;
};
goog.inherits(five.testing.FakeAuth, goog.events.EventTarget);

/** @constructor */
five.testing.FakeAuth.RequestHandler = function() {};

/**
 * @param {string} name
 * @param {string} version
 * @param {Object} params
 * @return {Object} result
 */
five.testing.FakeAuth.RequestHandler.prototype.handleRpcRequest =
    goog.abstractMethod;

/** @type {goog.debug.Logger} */
five.testing.FakeAuth.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.testing.FakeAuth');

/** @type {string} */
five.testing.FakeAuth.prototype.apiKey;

/** @type {boolean} */
five.testing.FakeAuth.prototype.registered_ = false;

/** @type {object} */
five.testing.FakeAuth.prototype.originalGapi_;

/** @type {string} */
five.testing.FakeAuth.prototype.authComplete_ = false;

five.testing.FakeAuth.prototype.register = function() {
  goog.asserts.assert(!this.registered_, 'Should not already be registered');
  this.originalGapi_ = goog.getObjectByName('gapi',
      this.domHelper_.getWindow());

  var gapi = {
    'auth': {
      'authorize': goog.bind(this.receiveAuthAuthorize_, this),
      'init': goog.bind(this.receiveAuthInit_, this)
    },
    'client': {
      'rpcRequest': goog.bind(this.receiveRpcRequest_, this),
      'setApiKey': goog.bind(this.receiveClientSetApiKey_, this)
    }
  };

  goog.exportSymbol('gapi', gapi, this.domHelper_.getWindow());
  this.registered_ = true;
};

five.testing.FakeAuth.prototype.unregister = function() {
  goog.asserts.assert(this.registered_, 'Should have been registered');

  goog.exportSymbol('gapi', this.originalGapi_, this.domHelper_.getWindow());

  this.registered_ = false;
};

five.testing.FakeAuth.prototype.authCompleted = function() {
  return this.authComplete_;
};

/** @override */
five.testing.FakeAuth.prototype.disposeInternal = function() {
  if (this.registered_) {
    this.unregister();
  }
  goog.base(this, 'disposeInternal');
};

/** @param {string} apiKey */
five.testing.FakeAuth.prototype.receiveClientSetApiKey_ = function(apiKey) {
  goog.asserts.assert(!this.apiKey, 'Api key should not have been set yet');
  this.apiKey = apiKey;
};

/**
 * @param {string} name
 * @param {string} version
 * @param {Object} params
 * @return {Object}
 */
five.testing.FakeAuth.prototype.receiveRpcRequest_ = function(
    name, version, params) {
  goog.asserts.assertString(name, 'Rpc name expected');
  goog.asserts.assertString(version, 'Rpc version expected');
  goog.asserts.assertObject(params, 'Rpc params expected');

  var execute = goog.bind(function(callback) {
    var result = this.requestHandler_.handleRpcRequest(name, version, params);
    goog.asserts.assertObject(result);
    window.setTimeout(function() { callback(result); }, 0);
  }, this);

  return {
    'execute': execute
  };
};

/**
 * @param {Object} params
 * @param {Function} callback
 */
five.testing.FakeAuth.prototype.receiveAuthAuthorize_ = function(params,
    callback) {
  goog.asserts.assertString(this.apiKey, 'ApiKey was not set');
  goog.asserts.assertString(params['client_id'],
      "Expected 'client_id' field to be set");
  goog.asserts.assert(params['scope'].length,
      "expected 'scope' field to be set");
  goog.asserts.assert(params['immediate'] === true,
      "Expected 'immediate' to be true");
  this.authComplete_ = true;
  var token = {
    'access_token': 'valid_fake',
    'expires_in': '3600'
  };
  window.setTimeout(goog.partial(callback, token), 0);
};

/** @param {Function} callback */
five.testing.FakeAuth.prototype.receiveAuthInit_ = function(callback) {
  window.setTimeout(callback, 0);
};

