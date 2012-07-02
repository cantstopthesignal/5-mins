// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.TimePoint');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.object');


/**
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.TimePoint = function(time) {
  this.time = time;
  this.next = null;
  this.yPos = null;
  this.linearTimeYPos = null;
  this.minHeight = null;
  this.openEvents = [];
  this.columnCount = null;
};
goog.inherits(five.layout.TimePoint, goog.Disposable);

/** @override */
five.layout.TimePoint.prototype.disposeInternal =
    function() {
  delete this.openEvents;
  delete this.next;
  goog.base(this, 'disposeInternal');
};

five.layout.TimePoint.prototype.toString = function() {
  return this.time.toString();
};

five.layout.TimePoint.prototype.getTime = function() {
  return this.time.getTime();
};
