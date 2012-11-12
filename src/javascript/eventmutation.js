//Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMutation');
goog.provide('five.EventMutation.MoveBy');

goog.require('goog.asserts');
goog.require('goog.Disposable');


/**
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {goog.Disposable}
 */
five.EventMutation = function(opt_locked) {
  goog.base(this);

  /** @type {boolean} */
  this.locked_ = opt_locked || false;
};
goog.inherits(five.EventMutation, goog.Disposable);

/** @enum {number} */
five.EventMutation.SortIndex = {
  REPLACE_TEXT: 0,
  DEFAULT: 1
};

/** @param {boolean} locked */
five.EventMutation.prototype.setLocked = function(locked) {
  this.locked_ = locked;
};

/** @return {boolean} */
five.EventMutation.prototype.isLocked = function() {
  return this.locked_;
};

/** @return {number} */
five.EventMutation.prototype.getSortIndex = function() {
  return five.EventMutation.SortIndex.DEFAULT;
};

/** @return {!five.EventMutation} */
five.EventMutation.prototype.clone = goog.abstractMethod;

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.IntervalMutation = function(interval, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {goog.date.Interval} */
  this.interval_ = interval;
};
goog.inherits(five.EventMutation.IntervalMutation, five.EventMutation);

/** @return {goog.date.Interval} */
five.EventMutation.IntervalMutation.prototype.getInterval = function() {
  return this.interval_;
};

/**
 * @param {string} text
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.ReplaceTextMutation_ = function(text, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {string} */
  this.text_ = text;
};
goog.inherits(five.EventMutation.ReplaceTextMutation_, five.EventMutation);

/** @return {string} */
five.EventMutation.ReplaceTextMutation_.prototype.getText = function() {
  return this.text_;
};

/** @override */
five.EventMutation.ReplaceTextMutation_.prototype.getSortIndex = function() {
  return five.EventMutation.SortIndex.REPLACE_TEXT;
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation}
 */
five.EventMutation.MoveBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveBy, five.EventMutation.IntervalMutation);

/** @override */
five.EventMutation.MoveBy.prototype.clone = function() {
  return new five.EventMutation.MoveBy(this.getInterval().clone(),
      this.isLocked());
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation}
 */
five.EventMutation.MoveStartBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveStartBy,
    five.EventMutation.IntervalMutation);

/** @override */
five.EventMutation.MoveStartBy.prototype.clone = function() {
  return new five.EventMutation.MoveStartBy(this.getInterval().clone(),
      this.isLocked());
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation}
 */
five.EventMutation.MoveEndBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveEndBy,
    five.EventMutation.IntervalMutation);

/** @override */
five.EventMutation.MoveEndBy.prototype.clone = function() {
  return new five.EventMutation.MoveEndBy(this.getInterval().clone(),
      this.isLocked());
};

/**
 * @param {!goog.date.DateTime} startTime
 * @param {!goog.date.DateTime} endTime
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.SetTimeRange = function(startTime, endTime, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {!goog.date.DateTime} */
  this.startTime_ = startTime;

  /** @type {!goog.date.DateTime} */
  this.endTime_ = endTime;
};
goog.inherits(five.EventMutation.SetTimeRange, five.EventMutation);

/** @return {!goog.date.DateTime} */
five.EventMutation.SetTimeRange.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {!goog.date.DateTime} */
five.EventMutation.SetTimeRange.prototype.getEndTime = function() {
  return this.endTime_;
};

/**
 * @param {string} text
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.ReplaceTextMutation_}
 */
five.EventMutation.ChangeSummary = function(text, opt_locked) {
  goog.base(this, text, opt_locked);
};
goog.inherits(five.EventMutation.ChangeSummary,
    five.EventMutation.ReplaceTextMutation_);

/** @override */
five.EventMutation.ChangeSummary.prototype.clone = function() {
  return new five.EventMutation.ChangeSummary(this.getText(),
      this.isLocked());
};
