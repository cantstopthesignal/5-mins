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

  /** @type {goog.date.DateTime} */
  this.startTime_ = five.Event.parseEventDataDate_(this.eventData_['start']);

  /** @type {goog.date.DateTime} */
  this.endTime_ = five.Event.parseEventDataDate_(this.eventData_['end']);

  /** @type {Array.<five.EventCard>} */
  this.eventDisplays_ = [];
};
goog.inherits(five.Event, goog.events.EventTarget);

/** @return {goog.date.DateTime} */
five.Event.parseEventDataDate_ = function(dateData) {
  if ('dateTime' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['dateTime']);
    return new goog.date.DateTime(new Date(dateStr));
  } else if ('date' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['date']);
    return new goog.date.DateTime(new Date(dateStr));
  }
  goog.asserts.fail('Unexpected date data');
  return null;
};

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

