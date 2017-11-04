// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.TimePoint');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.object');


/**
 * @param {!goog.date.DateTime} time
 * @param {boolean=} opt_startsSplit
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.TimePoint = function(time, opt_startsSplit) {
  /** @type {!goog.date.DateTime} */
  this.time = time;

  /** @type {five.layout.TimePoint} */
  this.next = null;

  /** @type {?number} */
  this.yPos = null;

  /** @type {?number} */
  this.linearTimeYPos = null;

  /** @type {boolean} */
  this.linearTimeAnchor = false;

  /** @type {?number} */
  this.minHeight = null;

  /** @type {!Array.<!five.layout.Event>} */
  this.openEvents = [];

  /** @type {?number} */
  this.columnCount = null;

  /** @type {boolean} */
  this.startsSplit = opt_startsSplit || false;

  /** @type {string} */
  this.key_ = five.layout.TimePoint.getKey(this.time, this.startsSplit);
};
goog.inherits(five.layout.TimePoint, goog.Disposable);

/**
 * @param {!goog.date.DateTime} time
 * @param {?boolean=} opt_startsSplit
 * @return {string}
 */
five.layout.TimePoint.getKey = function(time, opt_startsSplit) {
  return time.toString() + (opt_startsSplit ? '_1' : '_2');
};

/** @override */
five.layout.TimePoint.prototype.disposeInternal =
    function() {
  delete this.openEvents;
  delete this.next;
  goog.base(this, 'disposeInternal');
};

five.layout.TimePoint.prototype.toString = function() {
  return this.key_;
};

/** @return {number} */
five.layout.TimePoint.prototype.getTime = function() {
  return this.time.getTime();
};
