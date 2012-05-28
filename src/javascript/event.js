// Copyright cantstopthesignals@gmail.com

goog.provide('five.Event');

goog.require('goog.array');
goog.require('goog.date.DateTime');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @param {Object} eventData
 * @extends {goog.events.EventTarget}
 */
five.Event = function(eventData) {
  /** @type {Object} */
  this.eventData_ = eventData;

  var startDateStr = this.eventData_['start']['dateTime'];
  goog.asserts.assertString(startDateStr);
  /** @type {goog.date.DateTime} */
  this.startTime_ = new goog.date.DateTime(new Date(startDateStr));

  var endDateStr = this.eventData_['end']['dateTime'];
  goog.asserts.assertString(endDateStr);
  /** @type {goog.date.DateTime} */
  this.endTime_ = new goog.date.DateTime(new Date(endDateStr));

  /** @type {Array.<five.EventCard>} */
  this.eventDisplays_ = [];
};
goog.inherits(five.Event, goog.events.EventTarget);

/** @return {goog.date.DateTime} */
five.Event.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {goog.date.DateTime} */
five.Event.prototype.getEndTime = function() {
  return this.endTime_;
};

/** @return {string} */
five.Event.prototype.getSummary = function() {
  return this.eventData_['summary'] || '';
};

/** @param {five.EventCard} display */
five.Event.prototype.attachDisplay = function(display) {
  this.eventDisplays_.push(display);
};

/** @param {five.EventCard} display */
five.Event.prototype.detachDisplay = function(display) {
  if (this.isDisposed()) {
    return;
  }
  goog.array.removeIf(this.eventDisplays_, function(existingDisplay) {
    return existingDisplay === display;
  });
};

/** @override */
five.Event.prototype.disposeInternal = function() {
  delete this.eventDisplays_;
  goog.base(this, 'disposeInternal');
};

