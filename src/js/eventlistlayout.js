// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayout');
goog.provide('fivemins.EventListLayout.Event');
goog.provide('fivemins.EventListLayout.TimeMap');

goog.require('fivemins.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @param {fivemins.EventListLayout.Params} params
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout = function(params) {
  /** @type {Array.<fivemins.EventListLayout.Event>} */
  this.events_ = [];

  /** @type {Array.<fivemins.EventListLayout.Event>} */
  this.eventsByDuration_ = [];

  /** @type {fivemins.EventListLayout.Params} */
  this.params_ = params;
  this.params_.copyTo(this);
};
goog.inherits(fivemins.EventListLayout, goog.Disposable);

/**
 * Layout parameters object.
 * @constructor
 */
fivemins.EventListLayout.Params = function() {
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

  /** @type {goog.date.DateTime} */
  this.minTime = null;

  /** @type {goog.date.DateTime} */
  this.maxTime = null;

  this.lockFields_();
};

fivemins.EventListLayout.Params.prototype.copyTo = function(dest) {
  for (var f in this) {
    if (this.hasOwnProperty(f)) {
      goog.asserts.assert(this.fields_[f], 'Unexpected param ' + f);
      dest[f] = this[f];
    }
  }
};

fivemins.EventListLayout.Params.prototype.lockFields_ = function() {
  this.fields_ = {};
  for (var f in this) {
    if (this.hasOwnProperty(f)) {
      this.fields_[f] = true;
    }
  }
};

/** @type {goog.debug.Logger} */
fivemins.EventListLayout.prototype.logger_ = goog.debug.Logger.getLogger(
    'fivemins.EventListLayout');

/** @type {Array.<fivemins.EventListLayout.TimePoint_>} */
fivemins.EventListLayout.prototype.timePoints_;

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.timeMap_;

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.linearTimeMap_;

/** @type {goog.date.DateTime} */
fivemins.EventListLayout.prototype.minEventTime_;

/** @type {goog.date.DateTime} */
fivemins.EventListLayout.prototype.maxEventTime_;

/** @type {number} (see Params) */
fivemins.EventListLayout.prototype.distancePerHour;

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
  this.calcInitialTimePointConstraints_();
  this.enforceMinEventHeight_();
  this.resolveTimePointConstraints_();
  this.calcTimeMap_();
  this.calcLinearTimes_();
  this.calcLinearTimeMap_();
  this.calcTimeAxisPatches_();
  this.positionEvents_();
  this.logger_.info('calc() finished in ' + (+new Date() - startTime) + 'ms');
};

/** @return {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.getTimeMap = function() {
  return this.timeMap_;
};

/** @return {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayout.prototype.getLinearTimeMap = function() {
  return this.linearTimeMap_;
};

fivemins.EventListLayout.prototype.disposeInternal = function() {
  delete this.events_;
  delete this.timePoints_;
  goog.base(this, 'disposeInternal');
};

fivemins.EventListLayout.prototype.calcTimeRange_ = function() {
  goog.array.forEach(this.events_, function(event) {
    if (!this.minEventTime_ || goog.date.Date.compare(
        this.minEventTime_, event.startTime) > 0) {
      this.minEventTime_ = event.startTime.clone();
    }
    if (!this.maxEventTime_ || goog.date.Date.compare(
        this.maxEventTime_, event.endTime) < 0) {
      this.maxEventTime_ = event.endTime.clone();
    }
  }, this);
  if (this.minEventTime_ && this.maxEventTime_) {
    if (!this.minTime || goog.date.Date.compare(
        this.minTime, this.minEventTime_) > 0) {
      this.minTime = this.minEventTime_.clone();
    }
    if (!this.maxTime || goog.date.Date.compare(
        this.maxTime, this.minEventTime_) < 0) {
      this.maxTime = this.maxEventTime_.clone();
    }
  }
};

fivemins.EventListLayout.prototype.calcTimePoints_ = function() {
  var timePointMap = {};

  if (this.minTime) {
    var minTimePoint = new fivemins.EventListLayout.TimePoint_(this.minTime);
    this.registerDisposable(minTimePoint);
    timePointMap[minTimePoint] = minTimePoint;
  }
  if (this.maxTime) {
    var maxTimePoint = new fivemins.EventListLayout.TimePoint_(this.maxTime);
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
  // WARNING: non-linear performance
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
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.yPos = fivemins.util.round(fivemins.util.msToHourFloat(
        timePoint.getTime() - this.minTime.getTime()) * this.distancePerHour);
  }, this);
};

fivemins.EventListLayout.prototype.calcInitialTimePointConstraints_ =
    function() {
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.minHeight = this.minTimePointSpacing;
    if (timePoint.next) {
      var timeBasedMinHeight = Math.ceil(fivemins.util.msToHourFloat(
          timePoint.next.time.getTime() - timePoint.time.getTime()) *
          this.minDistancePerHour);
      timePoint.minHeight = Math.max(timePoint.minHeight, timeBasedMinHeight);
    }
  }, this);
};

fivemins.EventListLayout.prototype.enforceMinEventHeight_ = function() {
  // Apply minimum height constraints to time points such that once resolved
  // each event will have minimum sizing obeyed.
  goog.array.forEach(this.events_, function(event) {
    // Heuristic: find the time point in [start and end) that has the largest
    // time gap and make it the victim of the constraint.
    var maxTimeGapTimePoint = null;
    var maxTimeGap = 0;
    var totalMinHeights = 0;
    var timePointIter = event.startTimePoint;
    while (timePointIter != event.endTimePoint) {
      var timeGap = timePointIter.next.getTime() - timePointIter.getTime();
      if (timeGap > maxTimeGap || maxTimeGapTimePoint === null) {
        maxTimeGap = timeGap;
        maxTimeGapTimePoint = timePointIter;
      }
      totalMinHeights += timePointIter.minHeight;
      timePointIter = timePointIter.next;
    }
    if (this.minEventHeight > totalMinHeights) {
      maxTimeGapTimePoint.minHeight += this.minEventHeight - totalMinHeights;
    }
  }, this);
};

fivemins.EventListLayout.prototype.resolveTimePointConstraints_ = function() {
  goog.array.forEach(this.timePoints_, function(timePoint) {
    var nextTimePoint = timePoint.next;
    if (!timePoint.next || !timePoint.minHeight) {
      return;
    }
    nextTimePoint.yPos = Math.max(nextTimePoint.yPos,
        timePoint.yPos + timePoint.minHeight);
  }, this);
};

fivemins.EventListLayout.prototype.calcTimeMap_ = function() {
  var timeList = [];
  var yPosList = [];
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timeList.push(timePoint.time);
    yPosList.push(timePoint.yPos);
  }, this);
  this.timeMap_ = new fivemins.EventListLayout.TimeMap(timeList, yPosList,
      this.distancePerHour);
};

fivemins.EventListLayout.prototype.calcLinearTimes_ = function() {
  if (!this.timePoints_.length) {
    return;
  }
  // Map all time points to linear hour time.
  var hourIter = fivemins.util.hourFloor(this.minTime);
  var timePointIdx = 0;
  while (timePointIdx < this.timePoints_.length) {
    var timePoint = this.timePoints_[timePointIdx];
    var nextHour = hourIter.clone();
    nextHour.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
    if (goog.date.Date.compare(timePoint.time, hourIter) < 0) {
      timePoint.linearTimeYPos = timePoint.yPos;
      timePointIdx++;
      continue;
    } else if (goog.date.Date.compare(timePoint.time, nextHour) >= 0) {
      hourIter = nextHour;
      continue;
    }
    var hourIterYPos = this.timeMap_.timeToYPos(hourIter);
    var hourHeight = this.timeMap_.timeToYPos(nextHour) - hourIterYPos;
    var linearTimeYPos = hourHeight * fivemins.util.msToHourFloat(
        timePoint.time.getTime() - hourIter.getTime()) + hourIterYPos;
    if (Math.abs(timePoint.yPos - linearTimeYPos) > 1.0) {
      timePoint.linearTimeYPos = fivemins.util.round(linearTimeYPos);
    } else {
      timePoint.linearTimeYPos = timePoint.yPos;
    }
    timePointIdx++;
  }
};

fivemins.EventListLayout.prototype.calcLinearTimeMap_ = function() {
  // Add all relevant hours with direct maps to non-linear yPos to enforce
  // matching at each hour.
  var timeAndYPosList = [];
  var hourTimeSet = {};
  if (this.minEventTime_ && this.maxEventTime_) {
    fivemins.util.forEachHourWrap(this.minEventTime_, this.maxEventTime_,
        function(hour) {
      var yPos = this.timeMap_.timeToYPos(hour);
      timeAndYPosList.push([hour, yPos]);
      hourTimeSet[hour.toString()] = true;
    }, this);
  }

  // Stitch in linear time yPos from time points.
  goog.array.forEach(this.timePoints_, function(timePoint) {
    if (!goog.object.containsKey(hourTimeSet, timePoint.time.toString())) {
      timeAndYPosList.push([timePoint.time, timePoint.linearTimeYPos]);
    }
  }, this);

  timeAndYPosList.sort(function(a, b) {
    return goog.date.Date.compare(a[0], b[0]);
  });

  var timeList = [];
  var yPosList = [];
  goog.array.forEach(timeAndYPosList, function(entry) {
    timeList.push(entry[0]);
    yPosList.push(entry[1]);
  }, this);
  this.linearTimeMap_ = new fivemins.EventListLayout.TimeMap(timeList, yPosList,
      this.distancePerHour);
};

/** Calculate whether time axis patches are needed for any events */
fivemins.EventListLayout.prototype.calcTimeAxisPatches_ = function() {
  goog.array.forEach(this.events_, function(event) {
    // An event needs a patch if its start or end time point needs a patch
    // line.
    if (event.startTimePoint.linearTimeYPos != event.startTimePoint.yPos ||
        event.endTimePoint.linearTimeYPos != event.endTimePoint.yPos) {
      event.hasTimeAxisPatch = true;
      event.attachedToTimeAxisPatch = event.column == 0 &&
          event.timePoints.length == 1;
    }
  });
  // If an event is neighbors with an event that has a time axis patch, or
  // neighbors of a neighbor, it becomes a neighbor.
  // WARNING: non-linear performance
  var done = false;
  while (!done) {
    done = true;
    goog.array.forEach(this.timePoints_, function(timePoint) {
      var matchingNeighbor = goog.array.some(timePoint.openEvents,
          function(event) {
        return event.hasTimeAxisPatch || event.neighborHasTimeAxisPatch;
      });
      if (!matchingNeighbor) {
        return;
      }
      goog.array.forEach(timePoint.openEvents, function(event) {
        if (!event.neighborHasTimeAxisPatch && !event.hasTimeAxisPatch) {
          event.neighborHasTimeAxisPatch = true;
          done = false;
        }
      });
    });
  }
};

fivemins.EventListLayout.prototype.positionEvents_ = function() {
  goog.array.forEach(this.events_, function(event) {
    var layoutWidth = this.layoutWidth;
    var shiftForTimeAxisPatch = event.hasTimeAxisPatch ||
        event.neighborHasTimeAxisPatch;
    if (shiftForTimeAxisPatch) {
      layoutWidth -= this.timeAxisPatchWidth;
    }
    var columnWidth = fivemins.util.round(
        layoutWidth / event.columnCount);
    var x = columnWidth * event.column;
    if (shiftForTimeAxisPatch) {
      x += this.timeAxisPatchWidth;
    }
    var width = columnWidth;
    if (event.column == event.columnCount - 1) {
      width = layoutWidth - (columnWidth * (event.columnCount - 1));
    }
    var height = event.endTimePoint.yPos - event.startTimePoint.yPos;
    event.rect = new goog.math.Rect(x, event.startTimePoint.yPos,
        width, height);
  }, this);
};

/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.Event = function(startTime, endTime) {
  this.startTime = startTime;
  this.endTime = endTime;

  this.timePoints = [];
  this.startTimePoint = null;
  this.endTimePoint = null;

  this.column = null;
  this.columnAssigned = false;
  this.columnCount = null;

  this.hasTimeAxisPatch = false;
  this.neighborHasTimeAxisPatch = false;
  this.attachedToTimeAxisPatch = false;

  this.rect = null;
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
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.TimeMap = function(timeList, yPosList,
    defaultDistancePerHour) {
  this.timeList_ = timeList;
  this.yPosList_ = yPosList;
  this.msPerDist_ = 60 * 60 * 1000 / defaultDistancePerHour;
  this.checkLists_();
};
goog.inherits(fivemins.EventListLayout.TimeMap, goog.Disposable);

/** @param {goog.date.DateTime} time */
fivemins.EventListLayout.TimeMap.prototype.timeToYPos = function(time) {
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
    var yPos = fivemins.util.round((timestamp - anchorTimestamp)
        / this.msPerDist_) + anchorYPos;
    return yPos;
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var yPos = fivemins.util.round((timestamp - beforeTimestamp) *
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
    var timestamp = fivemins.util.round((yPos - anchorYPos) * this.msPerDist_) +
        anchorTimestamp;
    return new goog.date.DateTime(new Date(timestamp));
  }
  var beforeYPos = this.yPosList_[beforeIndex];
  var afterYPos = this.yPosList_[afterIndex];
  var beforeTimestamp = this.timeList_[beforeIndex].getTime();
  var afterTimestamp = this.timeList_[afterIndex].getTime();
  var timestamp = fivemins.util.round((yPos - beforeYPos) *
      (afterTimestamp - beforeTimestamp) /
      (Math.max(1, afterYPos - beforeYPos))) + beforeTimestamp;
  return new goog.date.DateTime(new Date(timestamp));
};

fivemins.EventListLayout.TimeMap.prototype.checkLists_ = function() {
  goog.asserts.assert(this.timeList_.length == this.yPosList_.length);
  for (var i = 0; i < this.timeList_.length; i++) {
    goog.asserts.assert(this.timeList_[i] instanceof goog.date.DateTime);
    goog.asserts.assertNumber(this.yPosList_[i]);
  }
};

/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.TimePoint_ = function(time) {
  this.time = time;
  this.next = null;
  this.yPos = null;
  this.linearTimeYPos = null;
  this.minHeight = null;
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
