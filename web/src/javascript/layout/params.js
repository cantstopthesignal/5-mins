// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.Params');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.object');


/**
 * Layout parameters object.
 * @constructor
 */
five.layout.Params = function() {
  /** @type {number} */
  this.distancePerHour = 50;

  /** @type {number} */
  this.minDistancePerHour = 20;

  /** @type {number} */
  this.minTimePointSpacing = 2;

  /** @type {number} */
  this.minEventHeight = 10;

  /** @type {number} */
  this.layoutWidth = 100;

  /** @type {number} */
  this.timeAxisPatchWidth = 10;

  /** @type {number} */
  this.patchMinYPosDiff = 2;

  /** @type {goog.date.DateTime} */
  this.minTime = null;

  /** @type {goog.date.DateTime} */
  this.maxTime = null;

  this.lockFields_();
};

five.layout.Params.prototype.copyTo = function(dest) {
  for (var f in this) {
    if (this.hasOwnProperty(f)) {
      goog.asserts.assert(this.fields_[f], 'Unexpected param ' + f);
      dest[f] = this[f];
    }
  }
};

five.layout.Params.prototype.lockFields_ = function() {
  this.fields_ = {};
  for (var f in this) {
    if (this.hasOwnProperty(f)) {
      this.fields_[f] = true;
    }
  }
};
