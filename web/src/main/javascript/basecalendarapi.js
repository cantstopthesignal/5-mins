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

/**
 * @constructor
 * @param {!five.BaseCalendarApi.EventOperation.Type} type
 */
five.BaseCalendarApi.EventOperation = function(type) {
  /** @type {!five.BaseCalendarApi.EventOperation.Type} */
  this.type_ = type;

  /** @type {!goog.async.Deferred} */
  this.deferred_ = new goog.async.Deferred();
};

/**
 * @enum {string}
 */
five.BaseCalendarApi.EventOperation.Type = {
  CREATE: 'create',
  SAVE: 'save',
  DELETE: 'delete'
};

/**
 * @return {!five.BaseCalendarApi.EventOperation.Type}
 */
five.BaseCalendarApi.EventOperation.prototype.getType = function() {
  return this.type_;
};

five.BaseCalendarApi.EventOperation.prototype.getDeferred = function() {
  return this.deferred_;
};

/**
 * @constructor
 * @param {Object} eventData
 * @extends {five.BaseCalendarApi.EventOperation}
 */
five.BaseCalendarApi.CreateEventOperation = function(eventData) {
  goog.base(this, five.BaseCalendarApi.EventOperation.Type.CREATE);

  /** @type {Object} */
  this.eventData = eventData;
};
goog.inherits(five.BaseCalendarApi.CreateEventOperation, five.BaseCalendarApi.EventOperation);

/**
 * @constructor
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @extends {five.BaseCalendarApi.EventOperation}
 */
five.BaseCalendarApi.SaveEventOperation = function(eventData, eventPatchData) {
  goog.base(this, five.BaseCalendarApi.EventOperation.Type.SAVE);

  /** @type {Object} */
  this.eventData = eventData;

  /** @type {Object} */
  this.eventPatchData = eventPatchData;
};
goog.inherits(five.BaseCalendarApi.SaveEventOperation, five.BaseCalendarApi.EventOperation);

/**
 * @constructor
 * @param {Object} eventDeleteData
 * @extends {five.BaseCalendarApi.EventOperation}
 */
five.BaseCalendarApi.DeleteEventOperation = function(eventDeleteData) {
  goog.base(this, five.BaseCalendarApi.EventOperation.Type.DELETE);

  /** @type {Object} */
  this.eventDeleteData = eventDeleteData;
};
goog.inherits(five.BaseCalendarApi.DeleteEventOperation, five.BaseCalendarApi.EventOperation);

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
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.requestSync = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {!Array.<!five.BaseCalendarApi.EventOperation>} eventOperations
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.applyEventOperations = goog.abstractMethod;

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.BaseCalendarApi.prototype.openEventEditor = goog.abstractMethod;
