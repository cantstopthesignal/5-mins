// Copyright cantstopthesignals@gmail.com

goog.provide('five.PointerDownMoveControlEvent');

goog.require('goog.events');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {!five.PointerDownMoveControlEvent.ControlType} controlType
 * @extends {goog.events.Event}
 */
five.PointerDownMoveControlEvent = function(controlType) {
  goog.base(this, five.PointerDownMoveControlEvent.EventType.POINTER_DOWN);

  /** @type {!five.PointerDownMoveControlEvent.ControlType} */
  this.controlType = controlType;
};
goog.inherits(five.PointerDownMoveControlEvent, goog.events.Event);

five.PointerDownMoveControlEvent.both = function() {
  return new five.PointerDownMoveControlEvent(
      five.PointerDownMoveControlEvent.ControlType.BOTH);
};

five.PointerDownMoveControlEvent.start = function() {
  return new five.PointerDownMoveControlEvent(
      five.PointerDownMoveControlEvent.ControlType.START);
};

five.PointerDownMoveControlEvent.end = function() {
  return new five.PointerDownMoveControlEvent(
      five.PointerDownMoveControlEvent.ControlType.END);
};

/** @enum {string} */
five.PointerDownMoveControlEvent.EventType = {
  POINTER_DOWN: goog.events.getUniqueId('pointer_down')
};

/** @enum {string} */
five.PointerDownMoveControlEvent.ControlType = {
  START: 'start',
  END: 'end',
  BOTH: 'both'
};
