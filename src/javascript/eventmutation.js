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

/** @param {boolean} locked */
five.EventMutation.prototype.setLocked = function(locked) {
  this.locked_ = locked;
}

/** @return {boolean} */
five.EventMutation.prototype.isLocked = function() {
  return this.locked_;
}

/** @return {!five.EventMutation} */
five.EventMutation.prototype.clone = goog.abstractMethod;

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.IntervalMutation_ = function(interval, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {goog.date.Interval} */
  this.interval_ = interval;
};
goog.inherits(five.EventMutation.IntervalMutation_, five.EventMutation);

/** @return {goog.date.Interval} */
five.EventMutation.IntervalMutation_.prototype.getInterval = function() {
  return this.interval_;
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveBy, five.EventMutation.IntervalMutation_);

/** @override */
five.EventMutation.MoveBy.prototype.clone = function() {
  return new five.EventMutation.MoveBy(this.getInterval().clone(),
      this.isLocked());
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveStartBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveStartBy,
    five.EventMutation.IntervalMutation_);

/** @override */
five.EventMutation.MoveStartBy.prototype.clone = function() {
  return new five.EventMutation.MoveStartBy(this.getInterval().clone(),
      this.isLocked());
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveEndBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveEndBy,
    five.EventMutation.IntervalMutation_);

/** @override */
five.EventMutation.MoveEndBy.prototype.clone = function() {
  return new five.EventMutation.MoveEndBy(this.getInterval().clone(),
      this.isLocked());
};
