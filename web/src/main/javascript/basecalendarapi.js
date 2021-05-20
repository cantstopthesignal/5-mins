// Copyright cantstopthesignals@gmail.com

goog.provide('five.BaseCalendarApi');

goog.require('five.Service');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');


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

/** @type {!string} */
five.BaseCalendarApi.CACHED_RESPONSE_KEY = 'cachedResponse';

/** @return {!goog.async.Deferred} */
five.BaseCalendarApi.prototype.loadCalendarList = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.loadEvents = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.createEvent = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.saveEvent = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.deleteEvent = goog.abstractMethod;

/**
 * @param {Object} pendingMutationsData
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.savePendingMutations = goog.abstractMethod;

/**
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.loadPendingMutations = goog.abstractMethod;

/**
 * @param {!string} currentCalendarId
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.saveCurrentCalendarId = goog.abstractMethod;

/**
 * @return {!goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.loadCurrentCalendarId = goog.abstractMethod;
