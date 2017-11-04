// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.HorzSplit');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @param {!goog.date.DateTime} time
 * @param {number} height
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.HorzSplit = function(time, height) {
  /** @type {!goog.date.DateTime} */
  this.time_ = time;

  /** @type {number} */
  this.height_ = height;

  /** @type {five.layout.TimePoint} */
  this.startTimePoint = null;

  /** @type {five.layout.TimePoint} */
  this.endTimePoint = null;
};
goog.inherits(five.layout.HorzSplit, goog.Disposable);

/** @override */
five.layout.HorzSplit.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};

/** @return {!goog.date.DateTime} */
five.layout.HorzSplit.prototype.getTime = function() {
  return this.time_;
};

/** @return {number} */
five.layout.HorzSplit.prototype.getHeight = function() {
  return this.height_;
};
