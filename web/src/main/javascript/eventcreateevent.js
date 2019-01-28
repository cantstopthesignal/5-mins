// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventCreateEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!goog.date.DateTime} startTime
 * @param {!goog.date.DateTime} endTime
 * @extends {goog.events.Event}
 */
five.EventCreateEvent = function(startTime, endTime) {
  goog.base(this, five.EventCreateEvent.EventType.CREATE);

  /** @type {!goog.date.DateTime} */
  this.startTime = startTime;

  /** @type {!goog.date.DateTime} */
  this.endTime = endTime;
};
goog.inherits(five.EventCreateEvent, goog.events.Event);

/** @enum {string} */
five.EventCreateEvent.EventType = {
  CREATE: goog.events.getUniqueId('create')
};
