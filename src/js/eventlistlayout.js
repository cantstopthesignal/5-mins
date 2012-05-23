// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayout');
goog.provide('fivemins.EventListLayout.Event');
goog.provide('fivemins.EventListLayout.TimeMap');

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
fivemins.EventListLayout = function() {
  /** @type {Array.<fivemins.EventListLayout.Event>} */
  this.events_ = [];

  /** @type {Array.<fivemins.EventListLayout.Event>} */
  this.eventsByDuration_ = [];
};
goog.inherits(fivemins.EventListLayout, goog.Disposable);

/** @type {goog.debug.Logger} */
fivemins.EventListLayout.prototype.logger_ = goog.debug.Logger.getLogger(
    'fivemins.EventListLayout');

/** @type {Array.<fivemins.EventListLayout.TimePoint_>} */
fivemins.EventListLayout.prototype.timePoints_;

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.timeMap_;

/** @type {number} */
fivemins.EventListLayout.prototype.distancePerHour_ = 50;

/** @type {number} */
fivemins.EventListLayout.prototype.minEventHeight_ = 10;

/** @type {number} */
fivemins.EventListLayout.prototype.layoutWidth_ = 100;

/** @type {goog.date.DateTime} */
fivemins.EventListLayout.prototype.minTime_;

/** @type {goog.date.DateTime} */
fivemins.EventListLayout.prototype.maxTime_;

/** @param {number} width */
fivemins.EventListLayout.prototype.setLayoutWidth = function(width) {
  this.layoutWidth_ = width;
};

/** @param {number} width */
fivemins.EventListLayout.prototype.setMinEventHeight = function(height) {
  this.minEventHeight_ = height;
};

/** @param {number} width */
fivemins.EventListLayout.prototype.setDistancePerHour = function(distance) {
  this.distancePerHour_ = distance;
};

/** @param {goog.date.DateTime} minTime */
fivemins.EventListLayout.prototype.setMinTime = function(minTime) {
  this.minTime_ = minTime ? minTime.clone() : null;
};

/** @param {goog.date.DateTime} maxTime */
fivemins.EventListLayout.prototype.setMaxTime = function(maxTime) {
  this.maxTime_ = maxTime ? maxTime.clone() : null;
};

/** @param {Array.<fivemins.EventListLayout.Event>} events */
fivemins.EventListLayout.prototype.setEvents = function(events) {
  this.events_ = events;
  goog.array.forEach(this.events_, function(event) {
    this.registerDisposable(event);
  }, this);
  this.events_.sort(function(a, b) {
    return goog.date.Date.compare(a.startTime, b.startTime);
  });
  this.eventsByDuration_ = goog.array.clone(this.events_);
  this.eventsByDuration_.sort(function(a, b) {
    var aDuration = a.endTime.getTime() - a.startTime.getTime();
    var bDuration = b.endTime.getTime() - b.startTime.getTime();
    return a - b;
  });
};

fivemins.EventListLayout.prototype.calc = function() {
  goog.asserts.assert(this.events_);
  var startTime = +new Date();
  this.calcTimeRange_();
  this.calcTimePoints_();
  this.assignEventsToColumns_();
  this.calcColumnCounts_();
  this.positionTimePoints_();
  this.enforceMinEventHeight_();
  this.positionEvents_();
  this.calcTimeMap_();
  this.logger_.info('calc() finished in ' + (+new Date() - startTime) + 'ms');
};

/** @return {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.getTimeMap = function() {
  return this.timeMap_;
};

fivemins.EventListLayout.prototype.disposeInternal = function() {
  delete this.events_;
  delete this.timePoints_;
  goog.base(this, 'disposeInternal');
};

fivemins.EventListLayout.prototype.calcTimeRange_ = function() {
  goog.array.forEach(this.events_, function(event) {
    if (!this.minTime_ || goog.date.Date.compare(
        this.minTime_, event.startTime) > 0) {
      this.minTime_ = event.startTime.clone();
    }
    if (!this.maxTime_ || goog.date.Date.compare(
        this.maxTime_, event.endTime) < 0) {
      this.maxTime_ = event.endTime.clone();
    }
  }, this);
};

fivemins.EventListLayout.prototype.calcTimePoints_ = function() {
  var timePointMap = {};

  if (this.minTime_) {
    var minTimePoint = new fivemins.EventListLayout.TimePoint_(this.minTime_);
    this.registerDisposable(minTimePoint);
    timePointMap[minTimePoint] = minTimePoint;
  }
  if (this.maxTime_) {
    var maxTimePoint = new fivemins.EventListLayout.TimePoint_(this.maxTime_);
    this.registerDisposable(maxTimePoint);
    timePointMap[maxTimePoint] = maxTimePoint;
  }

  // Create all relevant time points for the start and end times of all events.
  goog.array.forEach(this.events_, function(event) {
    var startPoint = timePointMap[event.startTime];
    if (!startPoint) {
      startPoint = new fivemins.EventListLayout.TimePoint_(
          event.startTime);
      this.registerDisposable(startPoint);
      timePointMap[startPoint] = startPoint;
    }
    event.startTimePoint = startPoint;
    var endPoint = timePointMap[event.endTime];
    if (!endPoint) {
      endPoint = new fivemins.EventListLayout.TimePoint_(
          event.endTime);
      this.registerDisposable(endPoint);
      timePointMap[endPoint] = endPoint;
    }
    event.endTimePoint = endPoint;
  }, this);

  this.timePoints_ = goog.object.getValues(timePointMap);
  this.timePoints_.sort(function(a, b) {
    return goog.date.Date.compare(a.time, b.time);
  });

  var lastTimePoint = null;
  goog.array.forEach(this.timePoints_, function(timePoint) {
    if (lastTimePoint) {
      lastTimePoint.next = timePoint;
    }
    lastTimePoint = timePoint;
  });

  // Populate openEvents with events that span this time point.
  var minEventIdx = 0;
  for (var i = 0; i < this.timePoints_.length; i++) {
    var timePoint = this.timePoints_[i];
    for (var j = minEventIdx; j < this.events_.length; j++) {
      var event = this.events_[j];
      if (goog.date.Date.compare(event.endTime, timePoint.time) <= 0) {
        // Event ended before this time point, do not revisit it again,
        // but make sure to not skip over any continuing events, so only
        // increment.
        if (minEventIdx == j) {
          minEventIdx++;
        }
      } else if (goog.date.Date.compare(event.startTime, timePoint.time) > 0) {
        // Event started after this time point, we are done working with this
        // time point.
        break;
      } else {
        // Event started at or before this time point, and ended after this
        // time point.
        timePoint.openEvents.push(event);
        event.timePoints.push(timePoint);
      }
    }
    if (minEventIdx >= this.events_.length) {
      // All events have been passed.
      break;
    }
  }
};

fivemins.EventListLayout.prototype.assignEventsToColumns_ = function() {
  goog.array.forEach(this.eventsByDuration_, function(event) {
    var usedColumns = {};
    goog.array.forEach(event.timePoints, function(timePoint) {
      goog.array.forEach(timePoint.openEvents, function(neighborEvent) {
        if (neighborEvent.columnAssigned) {
          var column = neighborEvent.column;
          usedColumns[column] = (usedColumns[column] || 0) + 1;
        }
      });
    });
    var column = 0;
    while (usedColumns[column]) {
      column++;
    }
    event.column = column;
    event.columnAssigned = true;
  });
};

fivemins.EventListLayout.prototype.calcColumnCounts_ = function() {
  goog.array.forEach(this.events_, function(event) {
    event.columnCount = event.column + 1;
  });
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.columnCount = 0;
  });
  var done = false;
  while (!done) {
    done = true;
    goog.array.forEach(this.events_, function(event) {
      goog.array.forEach(event.timePoints, function(timePoint) {
        var columnCount = Math.max(event.columnCount,
            timePoint.columnCount);
        if (columnCount != event.columnCount ||
            columnCount != timePoint.columnCount) {
          event.columnCount = timePoint.columnCount = columnCount;
          done = false;
        }
      });
    });
  }
};

fivemins.EventListLayout.prototype.positionTimePoints_ = function() {
  var yPos = 0;
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.yPos = yPos;
    if (!timePoint.next) {
      return;
    }
    var timeInterval = timePoint.next.getTime() - timePoint.getTime();
    var yInterval = Math.ceil(this.distancePerHour_ *
        (timeInterval / 1000 / 60 / 60));
    yPos += yInterval;
  }, this);
};

fivemins.EventListLayout.prototype.enforceMinEventHeight_ = function() {
  function expandTimePointRangeBy(startTimePoint, endTimePoint, height) {
    // Get all time points between startTimePoint and endTimePoint.
    var timePointsBetween = [];
    var timePointIter = startTimePoint.next;
    while (timePointIter && timePointIter != endTimePoint) {
      timePointsBetween.push(timePointIter);
      timePointIter = timePointIter.next;
    }
    // If time points were found between, shift each partially.
    if (timePointsBetween.length) {
      var expandPerPoint = Math.ceil(height / (timePointsBetween.length + 1));
      var expand = expandPerPoint;
      goog.array.forEach(timePointsBetween, function(timePoint) {
        timePoint.yPos += expand;
        expand += expandPerPoint;
      });
    }
    // Shift all remaining time points including endTimePoint by height.
    while (timePointIter) {
      timePointIter.yPos += height;
      timePointIter = timePointIter.next;
    }
  }
  goog.array.forEach(this.eventsByDuration_, function(event) {
    var height = event.endTimePoint.yPos - event.startTimePoint.yPos;
    if (height < this.minEventHeight_) {
      expandTimePointRangeBy(event.startTimePoint, event.endTimePoint,
          this.minEventHeight_ - height);
    }
  }, this);
};

fivemins.EventListLayout.prototype.positionEvents_ = function() {
  goog.array.forEach(this.events_, function(event) {
    var columnWidth = Math.ceil(this.layoutWidth_ / event.columnCount);
    var x = columnWidth * event.column;
    var width = columnWidth;
    if (event.column == event.columnCount - 1) {
      width = this.layoutWidth_ - (columnWidth * (event.columnCount - 1));
    }
    var height = event.endTimePoint.yPos - event.startTimePoint.yPos;
    event.rect = new goog.math.Rect(x, event.startTimePoint.yPos,
        width, height);
  }, this);
};

fivemins.EventListLayout.prototype.calcTimeMap_ = function() {
  this.timeMap_ = new fivemins.EventListLayout.TimeMap(this.timePoints_,
      this.distancePerHour_);
};

/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.Event = function(startTime, endTime) {
  this.startTime = startTime;
  this.endTime = endTime;
  this.column = null;
  this.columnAssigned = false;
  this.columnCount = null;
  this.rect = null;
  this.timePoints = [];
  this.startTimePoint = null;
  this.endTimePoint = null;
};
goog.inherits(fivemins.EventListLayout.Event, goog.Disposable);

fivemins.EventListLayout.Event.prototype.disposeInternal = function() {
  delete this.timePoints;
  delete this.startTimePoint;
  delete this.endTimePoint;
  goog.base(this, 'disposeInternal');
};

/**
 * Helper object to provide a map from times to pixels.
 * @constructor
 */
fivemins.EventListLayout.TimeMap = function(timePoints,
    defaultDistancePerHour) {
  this.timeList_ = [];
  this.yPosList_ = [];
  this.msPerDist_ = 60 * 60 * 1000 / defaultDistancePerHour;
  this.buildLists_(timePoints);
};
goog.inherits(fivemins.EventListLayout.TimeMap, goog.Disposable);

/** @param {goog.date.DateTime} time */
fivemins.EventListLayout.TimeMap.prototype.timeToYPos = function(time) {
  var timestamp = time.getTime();
  var beforeIndex = -goog.array.binarySelect(this.timeList_,
      function(candidateTime) {
    return goog.date.Date.compare(time, candidateTime) || 1;
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
    var yPos = Math.round((timestamp - anchorTimestamp) / this.msPerDist_) +
        anchorYPos;
    return yPos;
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var yPos = Math.round((timestamp - beforeTimestamp) *
      (afterYPos - beforeYPos) /
      (Math.max(1, afterTimestamp - beforeTimestamp))) + beforeYPos;
  return yPos;
};

/** @param {number} yPos */
fivemins.EventListLayout.TimeMap.prototype.yPosToTime = function(yPos) {
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
    var timestamp = Math.round((yPos - anchorYPos) * this.msPerDist_) +
        anchorTimestamp;
    return new goog.date.DateTime(new Date(timestamp));
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var timestamp = Math.round((yPos - beforeYPos) *
      (afterTimestamp - beforeTimestamp) /
      (Math.max(1, afterYPos - beforeYPos))) + beforeTimestamp;
  return new goog.date.DateTime(new Date(timestamp));
};

fivemins.EventListLayout.TimeMap.prototype.buildLists_ = function(timePoints) {
  goog.array.forEach(timePoints, function(timePoint) {
    goog.asserts.assert(timePoint.time);
    goog.asserts.assertNumber(timePoint.yPos);
    this.timeList_.push(timePoint.time);
    this.yPosList_.push(timePoint.yPos);
  }, this);
};

/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.TimePoint_ = function(time) {
  this.time = time;
  this.next = null;
  this.yPos = null;
  this.openEvents = [];
  this.columnCount = null;
};
goog.inherits(fivemins.EventListLayout.TimePoint_, goog.Disposable);

fivemins.EventListLayout.TimePoint_.prototype.disposeInternal =
    function() {
  delete this.openEvents;
  delete this.next;
  goog.base(this, 'disposeInternal');
};

fivemins.EventListLayout.TimePoint_.prototype.toString = function() {
  return this.time.toString();
};

fivemins.EventListLayout.TimePoint_.prototype.getTime = function() {
  return this.time.getTime();
};
