//Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMutation');
goog.provide('five.EventMutation.MoveBy');

goog.require('goog.asserts');
goog.require('goog.Disposable');


/**
 * @constructor
 * @extends {goog.Disposable}
 */
five.EventMutation = function() {
  goog.base(this);
};
goog.inherits(five.EventMutation, goog.Disposable);

/**
 * @param {goog.date.Interval} interval
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.MoveBy = function(interval) {
  goog.base(this);

  /** @type {goog.date.Interval} */
  this.interval_ = interval;
};
goog.inherits(five.EventMutation.MoveBy, five.EventMutation);

/** @return {goog.date.Interval} */
five.EventMutation.MoveBy.prototype.getInterval = function() {
  return this.interval_;
};
