// Copyright cantstopthesignals@gmail.com

goog.provide('five.Spinner');

goog.require('five.Component');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.Spinner = function() {
  /** @type {Array.<five.Spinner.Entry>} */
  this.entries_ = [];
};
goog.inherits(five.Spinner, five.Component);

/** @type {number} */
five.Spinner.prototype.checkTimeoutId_;

five.Spinner.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'spinner');
  this.checkVisibility_();
};

/**
 * @param {number=} opt_delay Optional delay in milliseconds before spinning.
 */
five.Spinner.prototype.spin = function(opt_delay) {
  var entry = new five.Spinner.Entry(this,
      goog.now() + (opt_delay || 0));
  this.entries_.push(entry);
  this.checkVisibility_();
  return entry;
};

five.Spinner.prototype.releaseEntry = function(entry) {
  var index = this.entries_.indexOf(entry);
  goog.asserts.assert(index >= 0);
  this.entries_.splice(index, 1);
  this.checkVisibility_();
};

five.Spinner.prototype.disposeInternal = function() {
  this.clearCheckTimer_();
  goog.base(this, 'disposeInternal');
};

five.Spinner.prototype.checkVisibility_ = function() {
  var minTimestamp;
  goog.array.forEach(this.entries_, function(entry) {
    if (!minTimestamp || minTimestamp > entry.getShowTimestamp()) {
      minTimestamp = entry.getShowTimestamp();
    }
  }, this);

  var now = goog.now();
  var triggered = now >= minTimestamp;
  this.clearCheckTimer_();
  if (!triggered && minTimestamp) {
    this.checkTimeoutId_ = window.setTimeout(
        goog.bind(this.handleCheckTimeout_, this), minTimestamp - now);
  }
  goog.style.showElement(this.el, triggered);
};

five.Spinner.prototype.handleCheckTimeout_ = function() {
  this.checkVisibility_();
};

five.Spinner.prototype.clearCheckTimer_ = function() {
  if (this.checkTimeoutId_) {
    window.clearTimeout(this.checkTimeoutId_);
    delete this.checkTimeoutId_;
  }
};

/**
 * @constructor
 * @param {five.Spinner} spinner
 */
five.Spinner.Entry = function(spinner, showTimestamp) {
  this.spinner_ = spinner;
  this.showTimestamp_ = showTimestamp;
};

five.Spinner.Entry.prototype.getShowTimestamp = function() {
  return this.showTimestamp_;
};

five.Spinner.Entry.prototype.release = function() {
  goog.asserts.assert(this.spinner_);
  this.spinner_.releaseEntry(this);
  delete this.spinner_;
};
