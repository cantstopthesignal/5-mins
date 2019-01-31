// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.Manager');

goog.require('five.layout.Event');
goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @param {!five.layout.Params} params
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.Manager = function(params) {
  /** @type {!five.layout.Params} */
  this.params_ = params;

  /** @type {!Array.<!five.layout.Event>} */
  this.events_ = [];

  /** @type {!Array.<!five.layout.HorzSplit>} */
  this.horzSplits_ = [];
};
goog.inherits(five.layout.Manager, goog.Disposable);

/** @type {boolean} */
five.layout.Manager.prototype.allowCondensing_ = true;

/** @type {five.layout.TimeMap} */
five.layout.Manager.prototype.timeMap_;

/** @type {five.layout.TimeMap} */
five.layout.Manager.prototype.linearTimeMap_;

/** @override */
five.layout.Manager.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};

/** @param {!Array.<!five.layout.Event>} events */
five.layout.Manager.prototype.updateEvents = function(events) {
  this.events_ = events;
}

/** @return {!five.layout.Params} */
five.layout.Manager.prototype.getParams = function() {
  return this.params_;
};

/** @param {!five.layout.Params} params */
five.layout.Manager.prototype.updateParams = function(params) {
  this.params_ = params;
};

/** @param {!five.layout.HorzSplit} horzSplit */
five.layout.Manager.prototype.addHorzSplit = function(horzSplit) {
  this.horzSplits_.push(horzSplit);
};

/** @param {!five.layout.HorzSplit} horzSplit */
five.layout.Manager.prototype.removeHorzSplit = function(horzSplit) {
  var index = this.horzSplits_.indexOf(horzSplit);
  goog.asserts.assert(index >= 0);
  this.horzSplits_.splice(index, 1);
};

five.layout.Manager.prototype.allowLayoutCondensing = function(
    allowCondensing) {
  this.allowCondensing_ = allowCondensing;
};

five.layout.Manager.prototype.calc = function() {
  var calc = new five.layout.Calc(this.params_);
  calc.setEvents(this.events_);
  calc.setHorzSplits(this.horzSplits_);
  if (!this.allowCondensing_ && this.timeMap_) {
    calc.setCondensingRestriction(this.timeMap_);
  }
  calc.calc();
  this.timeMap_ = calc.getTimeMap();
  this.linearTimeMap_ = calc.getLinearTimeMap();
};

/** @return {five.layout.TimeMap} */
five.layout.Manager.prototype.getTimeMap = function() {
  return this.timeMap_;
};

/** @return {five.layout.TimeMap} */
five.layout.Manager.prototype.getLinearTimeMap = function() {
  return this.linearTimeMap_;
};
