// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMoveEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.EventMoveEvent.Anchor} anchor
 * @param {!five.EventMoveEvent.Dir} dir
 * @param {number=} opt_minutes
 * @extends {goog.events.Event}
 */
five.EventMoveEvent = function(anchor, dir, opt_minutes) {
  goog.base(this, five.EventMoveEvent.EventType.MOVE);

  /** @type {!five.EventMoveEvent.Anchor} */
  this.anchor = anchor;

  /** @type {!five.EventMoveEvent.Dir} */
  this.dir = dir;

  /** @type {number} */
  this.minutes = opt_minutes || 5;
};
goog.inherits(five.EventMoveEvent, goog.events.Event);

/** @param {number=} opt_minutes */
five.EventMoveEvent.bothEarlier = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.BOTH,
      five.EventMoveEvent.Dir.EARLIER, opt_minutes);
};

/** @param {number=} opt_minutes */
five.EventMoveEvent.bothLater = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.BOTH,
      five.EventMoveEvent.Dir.LATER, opt_minutes);
};

/** @param {number=} opt_minutes */
five.EventMoveEvent.startEarlier = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.START,
      five.EventMoveEvent.Dir.EARLIER, opt_minutes);
};

/** @param {number=} opt_minutes */
five.EventMoveEvent.startLater = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.START,
      five.EventMoveEvent.Dir.LATER, opt_minutes);
};

/** @param {number=} opt_minutes */
five.EventMoveEvent.endEarlier = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.END,
      five.EventMoveEvent.Dir.EARLIER, opt_minutes);
};

/** @param {number=} opt_minutes */
five.EventMoveEvent.endLater = function(opt_minutes) {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.END,
      five.EventMoveEvent.Dir.LATER, opt_minutes);
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

/** @enum {string} */
five.EventMoveEvent.Dir = {
  EARLIER: 'earlier',
  LATER: 'later'
};
