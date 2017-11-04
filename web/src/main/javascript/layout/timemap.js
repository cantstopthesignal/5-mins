// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.TimeMap');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.object');


/**
 * Helper object to provide a map from times to pixels.
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.TimeMap = function(timeList, yPosList,
    defaultDistancePerHour) {
  this.timeList_ = timeList;
  this.yPosList_ = yPosList;
  this.msPerDist_ = 60 * 60 * 1000 / defaultDistancePerHour;
  this.checkLists_();
};
goog.inherits(five.layout.TimeMap, goog.Disposable);

/** @param {goog.date.DateTime} time */
five.layout.TimeMap.prototype.timeToYPos = function(time) {
  var timestamp = time.getTime();
  var beforeIndex = -goog.array.binarySelect(this.timeList_,
      function(candidateTime) {
    return goog.date.Date.compare(goog.asserts.assertObject(time),
        candidateTime) || 1;
  }) - 2;
  var afterIndex = beforeIndex + 1;
  if (beforeIndex < 0 || afterIndex >= this.timeList_.length) {
    goog.asserts.assert(beforeIndex == -1 ||
        afterIndex == this.timeList_.length);
    if (beforeIndex < 0) {
      // Timestamp is before first timestamp.
      var anchorYPos = this.yPosList_[0];
      var anchorTimestamp = this.timeList_[0].getTime();
    } else {
      // Timestamp is after first timestamp.
      var anchorYPos = this.yPosList_[this.yPosList_.length - 1];
      var anchorTimestamp = this.timeList_[this.timeList_.length - 1].getTime();
    }
    var yPos = five.util.round((timestamp - anchorTimestamp)
        / this.msPerDist_) + anchorYPos;
    return yPos;
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var yPos = five.util.round((timestamp - beforeTimestamp) *
      (afterYPos - beforeYPos) /
      (Math.max(1, afterTimestamp - beforeTimestamp))) + beforeYPos;
  return yPos;
};

/** @param {number} yPos */
five.layout.TimeMap.prototype.yPosToTime = function(yPos) {
  var beforeIndex = -goog.array.binarySelect(this.yPosList_,
      function(candidateYPos) {
    return (yPos - candidateYPos) || 1;
  }) - 2;
  var afterIndex = beforeIndex + 1;
  if (beforeIndex < 0 || afterIndex >= this.yPosList_.length) {
    goog.asserts.assert(beforeIndex == -1 ||
        afterIndex == this.yPosList_.length);
    if (beforeIndex < 0) {
      // Position is before first position.
      var anchorYPos = this.yPosList_[0];
      var anchorTimestamp = this.timeList_[0].getTime();
    } else {
      // Position is after last position.
      var anchorYPos = this.yPosList_[this.yPosList_.length - 1];
      var anchorTimestamp = this.timeList_[this.timeList_.length - 1].getTime();
    }
    var timestamp = five.util.round((yPos - anchorYPos) * this.msPerDist_) +
        anchorTimestamp;
    return new goog.date.DateTime(new Date(timestamp));
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var timestamp = five.util.round((yPos - beforeYPos) *
      (afterTimestamp - beforeTimestamp) /
      (Math.max(1, afterYPos - beforeYPos))) + beforeTimestamp;
  return new goog.date.DateTime(new Date(timestamp));
};

five.layout.TimeMap.prototype.checkLists_ = function() {
  goog.asserts.assert(this.timeList_.length == this.yPosList_.length);
  for (var i = 0; i < this.timeList_.length; i++) {
    goog.asserts.assert(this.timeList_[i] instanceof goog.date.DateTime);
    goog.asserts.assertNumber(this.yPosList_[i]);
  }
};
