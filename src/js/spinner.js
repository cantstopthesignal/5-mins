// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.Spinner');

goog.require('fivemins.Component');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.Spinner = function() {
  /** @type {Array.<fivemins.Spinner.Entry>} */
  this.entries_ = [];
};
goog.inherits(fivemins.Spinner, fivemins.Component);

/** @type {number} */
fivemins.Spinner.prototype.checkTimeoutId_;

fivemins.Spinner.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'spinner');
  this.checkVisibility_();
};

/**
 * @param {number=} opt_delay Optional delay in milliseconds before spinning.
 */
fivemins.Spinner.prototype.spin = function(opt_delay) {
  var entry = new fivemins.Spinner.Entry(this,
      goog.now() + (opt_delay || 0));
  this.entries_.push(entry);
  this.checkVisibility_();
  return entry;
};

fivemins.Spinner.prototype.releaseEntry = function(entry) {
  var index = this.entries_.indexOf(entry);
  goog.asserts.assert(index >= 0);
  this.entries_.splice(index, 1);
  this.checkVisibility_();
};

fivemins.Spinner.prototype.disposeInternal = function() {
  this.clearCheckTimer_();
  goog.base(this, 'disposeInternal');
};

fivemins.Spinner.prototype.checkVisibility_ = function() {
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

fivemins.Spinner.prototype.handleCheckTimeout_ = function() {
  this.checkVisibility_();
};

fivemins.Spinner.prototype.clearCheckTimer_ = function() {
  if (this.checkTimeoutId_) {
    window.clearTimeout(this.checkTimeoutId_);
    delete this.checkTimeoutId_;
  }
};

/**
 * @constructor
 * @param {fivemins.Spinner} spinner
 */
fivemins.Spinner.Entry = function(spinner, showTimestamp) {
  this.spinner_ = spinner;
  this.showTimestamp_ = showTimestamp;
};

fivemins.Spinner.Entry.prototype.getShowTimestamp = function() {
  return this.showTimestamp_;
};

fivemins.Spinner.Entry.prototype.release = function() {
  goog.asserts.assert(this.spinner_);
  this.spinner_.releaseEntry(this);
  delete this.spinner_;
};
