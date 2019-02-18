// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsProposeEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!goog.date.DateTime} time
 * @extends {goog.events.Event}
 */
five.EventsProposeEvent = function(time) {
  goog.base(this, five.EventsProposeEvent.EventType.PROPOSE);

  /** @type {!goog.date.DateTime} */
  this.time = time;
};
goog.inherits(five.EventsProposeEvent, goog.events.Event);

/** @enum {string} */
five.EventsProposeEvent.EventType = {
  PROPOSE: goog.events.getUniqueId('propose')
};
