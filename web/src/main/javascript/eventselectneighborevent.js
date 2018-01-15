// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventSelectNeighborEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.EventSelectNeighborEvent.Dir} dir
 * @extends {goog.events.Event}
 */
five.EventSelectNeighborEvent = function(dir) {
  goog.base(this, five.EventSelectNeighborEvent.EventType.SELECT_NEIGHBOR);

  /** @type {!five.EventSelectNeighborEvent.Dir} */
  this.dir = dir;
};
goog.inherits(five.EventSelectNeighborEvent, goog.events.Event);

five.EventSelectNeighborEvent.previous = function() {
  return new five.EventSelectNeighborEvent(five.EventSelectNeighborEvent.Dir.PREVIOUS);
};

five.EventSelectNeighborEvent.next = function() {
  return new five.EventSelectNeighborEvent(five.EventSelectNeighborEvent.Dir.NEXT);
};

/** @enum {string} */
five.EventSelectNeighborEvent.EventType = {
  SELECT_NEIGHBOR: goog.events.getUniqueId('select_neighbor')
};

/** @enum {string} */
five.EventSelectNeighborEvent.Dir = {
  PREVIOUS: 'previous',
  NEXT: 'next'
};
