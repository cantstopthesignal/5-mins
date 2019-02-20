// Copyright cantstopthesignals@gmail.com

goog.provide('five.DurationKeyMonitor');

goog.require('goog.date.DateTime');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.DurationKeyMonitor = function() {
  goog.base(this);
};
goog.inherits(five.DurationKeyMonitor, goog.events.EventTarget);

/** @type {number} */
five.DurationKeyMonitor.NUMBER_ENTRY_TIMEOUT_MS_ = 600;

/** @type {number} */
five.DurationKeyMonitor.COLON_ENTRY_TIMEOUT_MS_ = 1000;

/** @type {number} */
five.DurationKeyMonitor.prototype.hours_ = 0;

/** @type {string} */
five.DurationKeyMonitor.prototype.digits_ = '';

/** @type {number} */
five.DurationKeyMonitor.prototype.entryTimeoutId_;

/** @enum {string} */
five.DurationKeyMonitor.EventType = {
  DURATION_ENTERED: goog.events.getUniqueId('duration_entered')
};

/**
 * @constructor
 * @param {number} minutes
 * @extends {goog.events.Event}
 */
five.DurationKeyMonitor.DurationEnteredEvent = function(minutes) {
  goog.base(this, five.DurationKeyMonitor.EventType.DURATION_ENTERED);

  /** @type {number} */
  this.minutes = minutes;
};
goog.inherits(five.DurationKeyMonitor.DurationEnteredEvent, goog.events.Event);

/** @param {number} digit */
five.DurationKeyMonitor.prototype.handleNumberKey = function(digit) {
  this.digits_ += String(digit);
  this.durationChanged_(false);
};

five.DurationKeyMonitor.prototype.handleColonKey = function() {
  this.hours_ = +this.digits_;
  this.digits_ = '';
  this.durationChanged_(true);
};

five.DurationKeyMonitor.prototype.handleEntryTimeout_ = function() {
  delete this.entryTimeoutId_;
  this.hours_ = 0;
  this.digits_ = '';
};

/** @param {boolean} wasColon */
five.DurationKeyMonitor.prototype.durationChanged_ = function(wasColon) {
  if (this.entryTimeoutId_) {
    window.clearTimeout(this.entryTimeoutId_);
  }
  this.entryTimeoutId_ = window.setTimeout(goog.bind(this.handleEntryTimeout_, this),
      wasColon ? five.DurationKeyMonitor.COLON_ENTRY_TIMEOUT_MS_ :
      five.DurationKeyMonitor.NUMBER_ENTRY_TIMEOUT_MS_);
  var minutes = this.hours_ * 60 + Number(this.digits_);
  if (minutes > 0) {
    this.dispatchEvent(new five.DurationKeyMonitor.DurationEnteredEvent(minutes));
  }
};

/** @override */
five.DurationKeyMonitor.prototype.disposeInternal = function() {
  if (this.entryTimeoutId_) {
    window.clearTimeout(this.entryTimeoutId_);
    delete this.entryTimeoutId_;
  }
  goog.base(this, 'disposeInternal');
};
