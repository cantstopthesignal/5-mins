// Copyright cantstopthesignals@gmail.com

goog.provide('five.AndroidCalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.Service');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');
goog.require('goog.json');


/**
 * Android api wrapper.
 *
 * @constructor
 * @extends {five.BaseCalendarApi}
 * @implements {five.Service}
 */
five.AndroidCalendarApi = function() {
  goog.base(this);
};
goog.inherits(five.AndroidCalendarApi, five.BaseCalendarApi);

five.AndroidCalendarApi.SERVICE_ID = 's' + goog.getUid(five.AndroidCalendarApi);

/** @type {Object} */
five.AndroidCalendarApi.prototype.interface_;

/**
 * @param {!five.AppContext} appContext
 * @return {!five.AndroidCalendarApi}
 */
five.AndroidCalendarApi.get = function(appContext) {
  return /** @type {!five.AndroidCalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.AndroidCalendarApi.SERVICE_ID)));
};

/** @type {goog.debug.Logger} */
five.AndroidCalendarApi.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.AndroidCalendarApi');

/** @param {!five.AppContext} appContext */
five.AndroidCalendarApi.prototype.register = function(appContext) {
  appContext.register(five.AndroidCalendarApi.SERVICE_ID, this);
};

/** @return {goog.async.Deferred} */
five.AndroidCalendarApi.prototype.loadCalendarData = function() {
  var d = new goog.async.Deferred();
  var resultJson = this.callApi_('loadCalendarData');
  d.callback(JSON.parse(resultJson));
  return d;
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.loadEvents = function(calendarId, startDate, endDate) {
  var d = new goog.async.Deferred();
  var callbackName = 'callback_' + goog.getUid(d);
  var callback = function(resp) {
    delete goog.global[callbackName];
    d.callback(resp);
  }
  goog.exportSymbol(callbackName, goog.bind(callback, this));
  var resultJson = this.callApi_(
    'loadEvents', calendarId, startDate.getTime(), endDate.getTime(), callbackName);
  var result = JSON.parse(resultJson);
  if (!result['success']) {
    d.errback(JSON.parse(resultJson));
  }
  return d;
};

/**
 * @param {string} methodName
 * @param {...*} var_args
 */
five.AndroidCalendarApi.prototype.callApi_ = function(methodName, var_args) {
  var params = Array.prototype.slice.call(arguments, 1);
  this.logger_.info(methodName);

  var result = this.getInterface_()[methodName].apply(this.getInterface_(), params);
  this.logger_.info('Result is ' + result);
  return result;
};

five.AndroidCalendarApi.prototype.getInterface_ = function() {
  if (!this.interface_) {
    this.interface_ = goog.getObjectByName('Android');
  }
  this.logger_.info('interface=' + this.interface_);
  return this.interface_;
}