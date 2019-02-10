// Copyright cantstopthesignals@gmail.com

goog.provide('five.AndroidCalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.Service');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');

/**
 * Android calendar api wrapper.
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
five.AndroidCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.AndroidCalendarApi');

/** @param {!five.AppContext} appContext */
five.AndroidCalendarApi.prototype.register = function(appContext) {
  appContext.register(five.AndroidCalendarApi.SERVICE_ID, this);
};

/** @return {goog.async.Deferred} */
five.AndroidCalendarApi.prototype.loadCalendarData = function() {
  var callback = function(respJson) {
    return JSON.parse(respJson);
  };
  var errback = function(error) {
    this.logger_.severe('Error loading calendar data: ' + error, error);
  };
  return this.callApi_('loadCalendarData').
      addCallbacks(callback, errback, this);
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
  var errback = function(error) {
    this.logger_.severe('Error loading events: ' + error, error);
    d.errback(error);
  }
  this.callApi_(
    'loadEvents', calendarId, startDate.getTime(), endDate.getTime(), callbackName).
    addErrback(errback, this);
  return d;
};

/**
 * @param {!Function} callback
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.registerEventsListener = function(callback) {
  var callbackName = 'callback_' + goog.getUid(callback);
  goog.exportSymbol(callbackName, callback);
  var errback = function(error) {
    this.logger_.severe('Error registering events listener: ' + error, error);
  };
  return this.callApi_('registerEventsListener', callbackName).
      addErrback(errback, this);
};

/**
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.requestSync = function() {
  var errback = function(error) {
    this.logger_.severe('Error requesting sync: ' + error, error);
  };
  return this.callApi_('requestSync').
      addErrback(errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.createEvent = function(calendarId, eventData) {
  this.assertValidCreateData_(eventData);
  var callback = function(respJson) {
    var resp = JSON.parse(respJson);
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event created');
    return resp;
  };
  var errback = function(error) {
    this.logger_.severe('Error creating event: ' + error, error);
  };
  return this.callApi_('createEvent', calendarId, JSON.stringify(eventData)).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.saveEvent = function(calendarId, eventData,
    eventPatchData) {
  this.assertValidSaveData_(eventData, eventPatchData);
  var callback = function(respJson) {
    var resp = JSON.parse(respJson);
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event saved');
    return resp;
  };
  var errback = function(error) {
    this.logger_.severe('Error saving event: ' + error, error);
  };
  return this.callApi_('saveEvent', calendarId, eventData['id'], JSON.stringify(eventPatchData)).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.deleteEvent = function(calendarId, eventDeleteData) {
  this.assertValidDeleteData_(eventDeleteData);
  var callback = function(resp) {
    this.logger_.info('Event deleted');
  };
  var errback = function(error) {
    this.logger_.severe('Error deleting event: ' + error, error);
  };
  return this.callApi_('deleteEvent', calendarId, eventDeleteData['id']).
      addCallbacks(callback, errback, this);
};


/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.openEventEditor = function(calendarId, eventData) {
  goog.asserts.assert(eventData['id']);
  var callback = function(resp) {
    this.logger_.info('Event editor opened');
  };
  var errback = function(error) {
    this.logger_.severe('Error opening event editor: ' + error, error);
  };
  return this.callApi_('openEventEditor', calendarId, eventData['id']).
      addCallbacks(callback, errback, this);
};


/**
 * @param {string} methodName
 * @param {...*} var_args
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.callApi_ = function(methodName, var_args) {
  var params = Array.prototype.slice.call(arguments, 1);
  this.logger_.info(methodName);
  var d = new goog.async.Deferred();
  try {
    var resp = this.getInterface_()[methodName].apply(this.getInterface_(), params);
    this.logger_.info('Response is ' + resp);
    d.callback(resp);
  } catch (e) {
    d.errback(e);
  }
  return d;
};

five.AndroidCalendarApi.prototype.getInterface_ = function() {
  if (!this.interface_) {
    this.interface_ = goog.getObjectByName('Android');
  }
  this.logger_.info('interface=' + this.interface_);
  return this.interface_;
}