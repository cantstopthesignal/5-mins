// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventEditEvent');

goog.require('goog.date.DateTime');
goog.require('goog.events');
goog.require('goog.events.Event');

/**
 * @constructor
 * @param {boolean=} opt_doubleClick
 * @extends {goog.events.Event}
 */
five.EventEditEvent = function(opt_doubleClick) {
  goog.base(this, five.EventEditEvent.EventType.EDIT);

  /** @type {boolean} */
  this.doubleClick = !!opt_doubleClick;
};
goog.inherits(five.EventEditEvent, goog.events.Event);

/** @enum {string} */
five.EventEditEvent.EventType = {
  EDIT: goog.events.getUniqueId('edit')
};
