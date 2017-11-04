// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMoveEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.EventMoveEvent.Anchor} anchor
 * @param {five.EventMoveEvent.Dir=} opt_dir
 * @extends {goog.events.Event}
 */
five.EventMoveEvent = function(anchor, opt_dir) {
  goog.base(this, five.EventMoveEvent.EventType.MOVE);

  /** @type {!five.EventMoveEvent.Anchor} */
  this.anchor = anchor;

  /** @type {?five.EventMoveEvent.Dir} */
  this.dir = opt_dir || null;
};
goog.inherits(five.EventMoveEvent, goog.events.Event);

five.EventMoveEvent.bothEarlier = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.BOTH,
      five.EventMoveEvent.Dir.EARLIER);
};

five.EventMoveEvent.bothLater = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.BOTH,
      five.EventMoveEvent.Dir.LATER);
};

five.EventMoveEvent.startEarlier = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.START,
      five.EventMoveEvent.Dir.EARLIER);
};

five.EventMoveEvent.startLater = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.START,
      five.EventMoveEvent.Dir.LATER);
};

five.EventMoveEvent.endEarlier = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.END,
      five.EventMoveEvent.Dir.EARLIER);
};

five.EventMoveEvent.endLater = function() {
  return new five.EventMoveEvent(five.EventMoveEvent.Anchor.END,
      five.EventMoveEvent.Dir.LATER);
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
