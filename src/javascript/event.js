// Copyright cantstopthesignals@gmail.com

goog.provide('five.Event');
goog.provide('five.Event.EventType');

goog.require('goog.array');
goog.require('goog.date.DateTime');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @param {Object} eventData
 * @extends {goog.events.EventTarget}
 */
five.Event = function(eventData) {
  goog.base(this);

  /** @type {Object} */
  this.eventData_ = eventData;

  /** @type {goog.date.DateTime} */
  this.startTime_ = five.Event.parseEventDataDate_(this.eventData_['start']);

  /** @type {goog.date.DateTime} */
  this.endTime_ = five.Event.parseEventDataDate_(this.eventData_['end']);

  /** @type {Array.<five.EventCard>} */
  this.displays_ = [];

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.Event, goog.events.EventTarget);

/** @enum {string} */
five.Event.EventType = {
  SELECT: goog.events.getUniqueId('select'),
  DESELECT: goog.events.getUniqueId('deselect'),
  MOVE_UP: goog.events.getUniqueId('move_up'),
  MOVE_DOWN: goog.events.getUniqueId('move_down')
};

/** @type {boolean} */
five.Event.prototype.selected_ = false;

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
  this.displays_.push(display);
  display.setSelected(this.selected_);
  var Event = five.Event.EventType;
  this.eventHandler_.
      listen(display, [Event.MOVE_UP, Event.MOVE_DOWN, Event.SELECT,
          Event.DESELECT], this.dispatchDisplayEvent_);
};

/** @param {five.EventCard} display */
five.Event.prototype.detachDisplay = function(display) {
  if (this.isDisposed()) {
    return;
  }
  goog.array.removeIf(this.displays_, function(existingDisplay) {
    return existingDisplay === display;
  });
};

/** @override */
five.Event.prototype.disposeInternal = function() {
  delete this.displays_;
  goog.base(this, 'disposeInternal');
};

/** @return {boolean} */
five.Event.prototype.isSelected = function() {
  return this.selected_;
};

/** @param {boolean} selected */
five.Event.prototype.setSelected = function(selected) {
  this.selected_ = selected;
  goog.array.forEach(this.displays_, function(display) {
    display.setSelected(this.selected_);
  }, this);
};

/** @param {goog.events.Event} e */
five.Event.prototype.dispatchDisplayEvent_ = function(e) {
  e.target = this;
  if (!this.dispatchEvent(e)) {
    e.preventDefault();
  }
};
