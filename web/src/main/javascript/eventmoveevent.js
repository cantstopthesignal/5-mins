// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMoveEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.EventMoveEvent.Anchor} anchor
 * @param {number} minutes
 * @extends {goog.events.Event}
 */
five.EventMoveEvent = function(anchor, minutes) {
  goog.base(this, five.EventMoveEvent.EventType.MOVE);

  /** @type {!five.EventMoveEvent.Anchor} */
  this.anchor = anchor;

  /** @type {number} */
  this.minutes = minutes;

  /** @type {boolean} */
  this.shiftKey = false;
};
goog.inherits(five.EventMoveEvent, goog.events.Event);

/** @param {number} minutes */
five.EventMoveEvent.both = function(minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.BOTH, minutes);
};

/** @param {number} minutes */
five.EventMoveEvent.start = function(minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.START, minutes);
};

/** @param {number} minutes */
five.EventMoveEvent.end = function(minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.END, minutes);
};

/** @enum {string} */
five.EventMoveEvent.EventType = {
  MOVE: goog.events.getUniqueId('move')
};

/** @enum {string} */
five.EventMoveEvent.Anchor = {
  START: 'start',
  END: 'end',
  BOTH: 'both'
};
