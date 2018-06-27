// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventSnapToEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.EventSnapToEvent.Anchor} anchor
 * @param {!five.EventSnapToEvent.Dir} dir
 * @extends {goog.events.Event}
 */
five.EventSnapToEvent = function(anchor, dir) {
  goog.base(this, five.EventSnapToEvent.EventType.SNAP_TO);

  /** @type {!five.EventSnapToEvent.Anchor} */
  this.anchor = anchor;

  /** @type {!five.EventSnapToEvent.Dir} */
  this.dir = dir;
};
goog.inherits(five.EventSnapToEvent, goog.events.Event);

/** @param {!five.EventSnapToEvent.Dir} dir */
five.EventSnapToEvent.start = function(dir) {
  return new five.EventSnapToEvent(five.EventSnapToEvent.Anchor.START, dir);
};

/** @param {!five.EventSnapToEvent.Dir} dir */
five.EventSnapToEvent.end = function(dir) {
  return new five.EventSnapToEvent(five.EventSnapToEvent.Anchor.END, dir);
};

/** @param {!five.EventSnapToEvent.Anchor} anchor */
five.EventSnapToEvent.now = function(anchor) {
  return new five.EventSnapToEvent(anchor, five.EventSnapToEvent.Dir.NOW);
};

/** @enum {string} */
five.EventSnapToEvent.EventType = {
  SNAP_TO: goog.events.getUniqueId('snap_to')
};

/** @enum {string} */
five.EventSnapToEvent.Anchor = {
  START: 'start',
  END: 'end',
  AUTO: 'auto'
};

/** @enum {string} */
five.EventSnapToEvent.Dir = {
  PREVIOUS: 'previous',
  NEXT: 'next',
  NOW: 'now'
};
