// Copyright cantstopthesignals@gmail.com

goog.provide('five.BaseCalendarApi');

goog.require('five.Service');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');
goog.require('goog.json');


/**
 * Base Calendar api.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.BaseCalendarApi = function() {
  goog.base(this);
};
goog.inherits(five.BaseCalendarApi, goog.events.EventTarget);

/** @return {goog.async.Deferred} */
five.BaseCalendarApi.prototype.loadCalendarList = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.loadEvents = goog.abstractMethod;

/**
 * @param {!Function} callback
 */
five.BaseCalendarApi.prototype.registerEventsListener = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.createEvent = goog.abstractMethod;

/**
 * @param {Object} eventData
 */
five.BaseCalendarApi.prototype.assertValidCreateData_ = function(eventData) {
  goog.asserts.assert(!eventData['id']);
  goog.asserts.assert(!eventData['etag']);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.saveEvent = goog.abstractMethod;

/**
 * @param {Object} eventData
 * @param {Object} eventPatchData
 */
five.BaseCalendarApi.prototype.assertValidSaveData_ = function(eventData, eventPatchData) {
  goog.asserts.assert(eventData['id']);
  if (!five.device.isWebView()) {
    goog.asserts.assert(eventPatchData['etag']);
  }
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.deleteEvent = goog.abstractMethod;

/**
 * @param {Object} eventDeleteData
 */
five.BaseCalendarApi.prototype.assertValidDeleteData_ = function(eventDeleteData) {
  goog.asserts.assert(eventDeleteData['id']);
  if (!five.device.isWebView()) {
    goog.asserts.assert(eventDeleteData['etag']);
  }
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.openEventEditor = goog.abstractMethod;
