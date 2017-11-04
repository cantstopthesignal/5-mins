// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.Event');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.Event = function(startTime, endTime) {
  this.startTime = startTime;
  this.endTime = endTime;

  this.timePoints = [];
  this.startTimePoint = null;
  this.endTimePoint = null;

  this.column = null;
  this.columnAssigned = false;
  this.columnCount = null;
  this.columnSpan = null;

  this.hasTimeAxisPatch = false;
  this.neighborHasTimeAxisPatch = false;
  this.attachedToTimeAxisPatch = false;

  this.rect = null;
};
goog.inherits(five.layout.Event, goog.Disposable);

/** @override */
five.layout.Event.prototype.disposeInternal = function() {
  delete this.timePoints;
  delete this.startTimePoint;
  delete this.endTimePoint;
  goog.base(this, 'disposeInternal');
};
