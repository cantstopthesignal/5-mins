// Copyright cantstopthesignals@gmail.com

goog.provide('five.AndroidAppApi');

goog.require('five.Service');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');


/**
 * Android app api wrapper.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {five.Service}
 */
five.AndroidAppApi = function() {
  goog.base(this);
};
goog.inherits(five.AndroidAppApi, goog.events.EventTarget);

five.AndroidAppApi.SERVICE_ID = 's' + goog.getUid(five.AndroidAppApi);

/** @enum {string} */
five.AndroidAppApi.ButtonId = {
  REFRESH: 'refresh',
  SAVE: 'save',
  NOW: 'now',
  PROPOSE: 'propose'
};

/** @type {Object} */
five.AndroidAppApi.prototype.interface_;

/**
 * @param {!five.AppContext} appContext
 * @return {!five.AndroidAppApi}
 */
five.AndroidAppApi.get = function(appContext) {
  return /** @type {!five.AndroidAppApi} */ (goog.asserts.assertObject(
      appContext.get(five.AndroidAppApi.SERVICE_ID)));
};

/** @type {goog.log.Logger} */
five.AndroidAppApi.prototype.logger_ = goog.log.getLogger(
    'five.AndroidAppApi');

/** @param {!five.AppContext} appContext */
five.AndroidAppApi.prototype.register = function(appContext) {
  appContext.register(five.AndroidAppApi.SERVICE_ID, this);
};

/**
 * @param {string} buttonId
 * @param {!Function} callback
 */
five.AndroidAppApi.prototype.addButton = function(buttonId, callback) {
  var callbackName = 'callback_' + goog.getUid(callback);
  goog.exportSymbol(callbackName, callback);
  var errback = function(error) {
    this.logger_.severe('Error adding button: ' + error, error);
  };
  this.callApi_('addButton', buttonId, callbackName).
      addErrback(errback, this);
};

/**
 * @param {string} buttonId
 * @param {boolean} isVisible
 */
five.AndroidAppApi.prototype.setButtonVisible = function(buttonId, isVisible) {
  var errback = function(error) {
    this.logger_.severe('Error adding button: ' + error, error);
  };
  this.callApi_('setButtonVisible', buttonId, isVisible).
      addErrback(errback, this);
};

/**
 * @param {string} methodName
 * @param {...*} var_args
 * @return {goog.async.Deferred}
 */
five.AndroidAppApi.prototype.callApi_ = function(methodName, var_args) {
  var params = Array.prototype.slice.call(arguments, 1);
  var d = new goog.async.Deferred();
  try {
    var resp = this.getInterface_()[methodName].apply(this.getInterface_(), params);
    if (resp !== undefined) {
      this.logger_.info('Response from [' + methodName + '] is ' + resp);
    }
    d.callback(resp);
  } catch (e) {
    d.errback(e);
  }
  return d;
};

five.AndroidAppApi.prototype.getInterface_ = function() {
  if (!this.interface_) {
    this.interface_ = goog.getObjectByName('Android');
  }
  return this.interface_;
}