// Copyright cantstopthesignals@gmail.com

goog.provide('five.layout.Calc');

goog.require('five.layout.AvlTree');
goog.require('five.layout.Event');
goog.require('five.layout.Params');
goog.require('five.layout.TimeMap');
goog.require('five.layout.TimePoint');
goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.log');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @param {five.layout.Params} params
 * @constructor
 * @extends {goog.Disposable}
 */
five.layout.Calc = function(params) {
  /** @type {!Array.<!five.layout.Event>} */
  this.events_ = [];

  /** @type {!Array.<!five.layout.HorzSplit>} */
  this.horzSplits_ = [];

  /** @type {!Array.<!five.layout.Event>} */
  this.eventsByDuration_ = [];

  this.copyParams_(params);
};
goog.inherits(five.layout.Calc, goog.Disposable);

/** @type {goog.log.Logger} */
five.layout.Calc.prototype.logger_ = goog.log.getLogger(
    'five.layout.Calc');

/** @type {Array.<five.layout.TimePoint>} */
five.layout.Calc.prototype.timePoints_;

/** @type {five.layout.TimeMap} */
five.layout.Calc.prototype.timeMap_;

/** @type {five.layout.TimeMap} */
five.layout.Calc.prototype.linearTimeMap_;

/** @type {five.layout.TimeMap} */
five.layout.Calc.prototype.condenseRestrictTimeMap_;

/** @type {number} (see Params) */
five.layout.Calc.prototype.distancePerHour;

/** @type {number} (see Params) */
five.layout.Calc.prototype.minDistancePerHour;

/** @type {number} (see Params) */
five.layout.Calc.prototype.minTimePointSpacing;

/** @type {number} (see Params) */
five.layout.Calc.prototype.minEventHeight;

/** @type {number} (see Params) */
five.layout.Calc.prototype.layoutWidth;

/** @type {number} (see Params) */
five.layout.Calc.prototype.timeAxisPatchWidth;

/** @type {number} (see Params) */
five.layout.Calc.prototype.patchMinYPosDiff;

/** @type {!goog.date.DateTime} (see Params) */
five.layout.Calc.prototype.minTime;

/** @type {!goog.date.DateTime} (see Params) */
five.layout.Calc.prototype.maxTime;

/** @param {!Array.<!five.layout.Event>} events */
five.layout.Calc.prototype.setEvents = function(events) {
  this.events_ = events;
  goog.array.stableSort(this.events_, function(a, b) {
    return goog.date.Date.compare(a.startTime, b.startTime);
  });
  this.eventsByDuration_ = goog.array.clone(this.events_);
  goog.array.stableSort(this.eventsByDuration_, function(a, b) {
    var aDuration = a.endTime.getTime() - a.startTime.getTime();
    var bDuration = b.endTime.getTime() - b.startTime.getTime();
    return bDuration - aDuration;
  });
};

/** @param {!Array.<!five.layout.HorzSplit>} horzSplits */
five.layout.Calc.prototype.setHorzSplits = function(horzSplits) {
  this.horzSplits_ = horzSplits;
};

/**
 * Set a time map which will be used to restrict condensing of the layout
 * smaller than this map.
 * @param {!five.layout.TimeMap} timeMap
 */
five.layout.Calc.prototype.setCondensingRestriction = function(timeMap) {
  this.condenseRestrictTimeMap_ = timeMap;
};

five.layout.Calc.prototype.calc = function() {
  goog.asserts.assert(this.events_);
  var startTime = +new Date();
  this.calcTimeRange_();
  this.calcTimePoints_();
  this.assignEventsToColumns_();
  this.calcColumnCounts_();
  this.calcColumnSpans_();
  this.positionTimePoints_();
  this.calcInitialTimePointConstraints_();
  this.enforceHorzSplitHeights_();
  this.enforceMinEventHeight_();
  this.enforceCondenseRestriction_();
  this.resolveTimePointConstraints_();
  this.calcTimeMap_();
  this.calcLinearTimes_();
  this.calcLinearTimeMap_();
  this.calcTimeAxisPatches_();
  this.positionEvents_();
  var calcTimeMs = +new Date() - startTime;
  if (calcTimeMs > 30) {
    this.logger_.info('calc() finished in ' + calcTimeMs + 'ms');
  }
};

/** @return {five.layout.TimeMap} */
five.layout.Calc.prototype.getTimeMap = function() {
  return this.timeMap_;
};

/** @return {five.layout.TimeMap} */
five.layout.Calc.prototype.getLinearTimeMap = function() {
  return this.linearTimeMap_;
};

/** @override */
five.layout.Calc.prototype.disposeInternal = function() {
  goog.array.forEach(this.events_, function(event) {
    delete event.startTimePoint;
    delete event.endTimePoint;
    event.timePoints = [];
  })
  delete this.events_;
  delete this.timePoints_;
  goog.array.forEach(this.horzSplits_, function(horzSplit) {
    delete horzSplit.startTimePoint;
    delete horzSplit.endTimePoint;
  })
  delete this.horzSplits_;
  goog.base(this, 'disposeInternal');
};

five.layout.Calc.prototype.copyParams_ = function(params) {
  this.distancePerHour = params.distancePerHour;
  this.minDistancePerHour = params.minDistancePerHour;
  this.minTimePointSpacing = params.minTimePointSpacing;
  this.minEventHeight = params.minEventHeight;
  this.layoutWidth = params.layoutWidth;
  this.timeAxisPatchWidth = params.timeAxisPatchWidth;
  this.patchMinYPosDiff = params.patchMinYPosDiff;
  this.minTime = params.minTime;
  this.maxTime = params.maxTime;
};

five.layout.Calc.prototype.calcTimeRange_ = function() {
  if (!this.minTime) {
    goog.array.forEach(this.events_, function(event) {
      if (!this.minTime || goog.date.Date.compare(
          this.minTime, event.startTime) > 0) {
        this.minTime = event.startTime.clone();
      }
    }, this);
  }
  if (!this.maxTime) {
    goog.array.forEach(this.events_, function(event) {
      if (!this.maxTime || goog.date.Date.compare(
          this.maxTime, event.endTime) < 0) {
        this.maxTime = event.endTime.clone();
      }
    }, this);
  }
  goog.asserts.assert(this.minTime);
  goog.asserts.assert(this.maxTime);
};

five.layout.Calc.prototype.calcTimePoints_ = function() {
  var timePointTree = new five.layout.AvlTree(five.layout.TimePoint.comparator);

  if (this.minTime) {
    var minTimePoint = new five.layout.TimePoint(this.minTime);
    timePointTree.add(minTimePoint);
  }
  if (this.maxTime) {
    var maxTimePoint = new five.layout.TimePoint(this.maxTime);
    timePointTree.add(maxTimePoint);
  }

  // Create time points for all horz splits
  goog.array.forEach(this.horzSplits_, function(horzSplit) {
    var startPoint = new five.layout.TimePoint(horzSplit.getTime(), true);
    startPoint = timePointTree.add(startPoint);
    startPoint.linearTimeAnchor = true;
    horzSplit.startTimePoint = startPoint;
    var endPoint = new five.layout.TimePoint(horzSplit.getTime());
    endPoint = timePointTree.add(endPoint);
    endPoint.linearTimeAnchor = true;
    horzSplit.endTimePoint = endPoint;
  }, this);

  // Create all relevant time points for the start and end times of all events.
  goog.array.forEach(this.events_, function(event) {
    var startPoint = new five.layout.TimePoint(event.startTime);
    startPoint = timePointTree.add(startPoint);
    event.startTimePoint = startPoint;
    var endPoint = timePointTree.find(new five.layout.TimePoint(event.endTime, true));
    if (!endPoint) {
      endPoint = new five.layout.TimePoint(event.endTime);
      endPoint = timePointTree.add(endPoint);
    }
    event.endTimePoint = endPoint;
  }, this);

  this.timePoints_ = timePointTree.getValues();

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

five.layout.Calc.prototype.assignEventsToColumns_ = function() {
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

five.layout.Calc.prototype.calcColumnCounts_ = function() {
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

five.layout.Calc.prototype.calcColumnSpans_ = function() {
  goog.array.forEach(this.eventsByDuration_, function(event) {
    var usedColumns = {};
    goog.array.forEach(event.timePoints, function(timePoint) {
      goog.array.forEach(timePoint.openEvents, function(neighborEvent) {
        usedColumns[neighborEvent.column] = true;
      });
    });
    event.columnSpan = 1;
    while (event.column + event.columnSpan < event.columnCount
        && !usedColumns[event.column + event.columnSpan]) {
      event.columnSpan += 1;
    }
  });
}

five.layout.Calc.prototype.positionTimePoints_ = function() {
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.yPos = five.util.round(five.util.msToHourFloat(
        timePoint.getTime() - this.minTime.getTime()) * this.distancePerHour);
  }, this);
};

five.layout.Calc.prototype.calcInitialTimePointConstraints_ =
    function() {
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timePoint.minHeight = this.minTimePointSpacing;
    if (timePoint.next) {
      var timeBasedMinHeight = Math.ceil(five.util.msToHourFloat(
          timePoint.next.time.getTime() - timePoint.time.getTime()) *
          this.minDistancePerHour);
      timePoint.minHeight = Math.max(timePoint.minHeight, timeBasedMinHeight);
    }
  }, this);
};

five.layout.Calc.prototype.enforceHorzSplitHeights_ = function() {
  goog.array.forEach(this.horzSplits_, function(horzSplit) {
    horzSplit.startTimePoint.minHeight = Math.max(
        horzSplit.startTimePoint.minHeight, horzSplit.getHeight());
  });
};

five.layout.Calc.prototype.enforceMinEventHeight_ = function() {
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
    var minEventHeight = Math.max(this.minEventHeight, event.minEventHeight);
    if (minEventHeight > totalMinHeights) {
      maxTimeGapTimePoint.minHeight += minEventHeight - totalMinHeights;
    }
  }, this);
};

five.layout.Calc.prototype.enforceCondenseRestriction_ = function() {
  // If a condensing restriction is in place, make sure the layout
  // does not condense below the provided time map.
  if (!this.condenseRestrictTimeMap_) {
    return;
  }
  goog.array.forEach(this.timePoints_, function(timePoint) {
    if (timePoint.next) {
      var yPosStart = this.condenseRestrictTimeMap_.timeToYPos(
          timePoint.time);
      var yPosEnd = this.condenseRestrictTimeMap_.timeToYPos(
          timePoint.next.time);
      timePoint.minHeight = Math.max(timePoint.minHeight,
          yPosEnd - yPosStart);
    }
  }, this);
};

five.layout.Calc.prototype.resolveTimePointConstraints_ = function() {
  goog.array.forEach(this.timePoints_, function(timePoint) {
    var nextTimePoint = timePoint.next;
    if (!timePoint.next || !timePoint.minHeight || timePoint.yPos < 0) {
      return;
    }
    nextTimePoint.yPos = Math.max(nextTimePoint.yPos,
        timePoint.yPos + timePoint.minHeight);
  }, this);
};

five.layout.Calc.prototype.calcTimeMap_ = function() {
  var timeList = [];
  var yPosList = [];
  goog.array.forEach(this.timePoints_, function(timePoint) {
    timeList.push(timePoint.time);
    yPosList.push(timePoint.yPos);
  }, this);
  this.timeMap_ = new five.layout.TimeMap(timeList, yPosList,
      this.distancePerHour);
};

five.layout.Calc.prototype.calcLinearTimes_ = function() {
  if (!this.timePoints_.length) {
    return;
  }
  // Map all time points to linear hour time.
  var hourIter = five.util.hourFloor(this.minTime);
  var timePointIdx = 0;
  while (timePointIdx < this.timePoints_.length) {
    var timePoint = this.timePoints_[timePointIdx];
    var nextHour = five.util.hourAddSafe(hourIter);
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
    var linearTimeYPos = hourHeight * five.util.msToHourFloat(
        timePoint.time.getTime() - hourIter.getTime()) + hourIterYPos;
    if (!timePoint.linearTimeAnchor && Math.abs(timePoint.yPos - linearTimeYPos)
        >= this.patchMinYPosDiff) {
      timePoint.linearTimeYPos = five.util.round(linearTimeYPos);
    } else {
      timePoint.linearTimeYPos = timePoint.yPos;
    }
    timePointIdx++;
  }
};

five.layout.Calc.prototype.calcLinearTimeMap_ = function() {
  // Add all relevant hours with direct maps to non-linear yPos to enforce
  // matching at each hour.
  var timeAndYPosList = [];
  var hourTimeSet = {};
  five.util.forEachHourWrap(this.minTime, this.maxTime, function(hour) {
    var yPos = this.timeMap_.timeToYPos(hour);
    timeAndYPosList.push([hour, yPos]);
    hourTimeSet[hour.getTime()] = true;
  }, this);

  // Stitch in linear time yPos from time points.
  goog.array.forEach(this.timePoints_, function(timePoint) {
    if (!goog.object.containsKey(hourTimeSet, timePoint.time.getTime())) {
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
  this.linearTimeMap_ = new five.layout.TimeMap(timeList, yPosList,
      this.distancePerHour);
};

/** Calculate whether time axis patches are needed for any events */
five.layout.Calc.prototype.calcTimeAxisPatches_ = function() {
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

five.layout.Calc.prototype.positionEvents_ = function() {
  goog.array.forEach(this.events_, function(event) {
    var layoutWidth = this.layoutWidth;
    var shiftForTimeAxisPatch = event.hasTimeAxisPatch ||
        event.neighborHasTimeAxisPatch;
    if (shiftForTimeAxisPatch) {
      layoutWidth -= this.timeAxisPatchWidth;
    }
    var columnWidth = five.util.round(
        layoutWidth / event.columnCount);
    var x = columnWidth * event.column;
    if (shiftForTimeAxisPatch) {
      x += this.timeAxisPatchWidth;
    }
    var width = columnWidth * event.columnSpan;
    if (event.column + event.columnSpan == event.columnCount) {
      width = layoutWidth - (columnWidth * event.column);
    }
    var height = event.endTimePoint.yPos - event.startTimePoint.yPos;
    event.rect = new goog.math.Rect(x, event.startTimePoint.yPos,
        width, height);
  }, this);
};

