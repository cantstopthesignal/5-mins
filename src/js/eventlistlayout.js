// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayout');
goog.provide('fivemins.EventListLayout.Event')

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.object');


/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout = function() {
};
goog.inherits(fivemins.EventListLayout, goog.Disposable);

/** @type {Array.<fivemins.EventListLayout.Event>} */
fivemins.EventListLayout.prototype.events_;

/** @type {Array.<fivemins.EventListLayout.TimePoint>} */
fivemins.EventListLayout.prototype.timePoints_;

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
};

fivemins.EventListLayout.prototype.calc = function() {
  goog.asserts.assert(this.events_);

  this.calcTimeRange_();
  this.calcTimePoints_();
  this.assignEventsToColumns_();
  this.calcColumnCounts_();
  this.positionEvents_();
};

fivemins.EventListLayout.prototype.disposeInternal =
    function() {
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
    var minTimePoint = new fivemins.EventListLayout.TimePoint(this.minTime_);
    this.registerDisposable(minTimePoint);
    timePointMap[minTimePoint] = minTimePoint;
  }
  if (this.maxTime_) {
    var maxTimePoint = new fivemins.EventListLayout.TimePoint(this.maxTime_);
    this.registerDisposable(maxTimePoint);
    timePointMap[maxTimePoint] = maxTimePoint;
  }

  // Create all relevant time points for the start and end times of all events.
  goog.array.forEach(this.events_, function(event) {
    var startPoint = timePointMap[event.startTime];
    if (!startPoint) {
      startPoint = new fivemins.EventListLayout.TimePoint(
          event.startTime);
      this.registerDisposable(startPoint);
      timePointMap[startPoint] = startPoint;
    }
    startPoint.openEvents.push(event);
    event.timePoints.push(startPoint);
    event.startTimePoint = startPoint;
    var endPoint = timePointMap[event.endTime];
    if (!endPoint) {
      endPoint = new fivemins.EventListLayout.TimePoint(
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
  var timePointIdx = 0;
  var eventIdx = 0;
  while (eventIdx < this.events_.length &&
      timePointIdx < this.timePoints_.length) {
    var event = this.events_[eventIdx];
    var timePoint = this.timePoints_[timePointIdx];
    if (goog.date.Date.compare(event.startTime, timePoint.time) >= 0) {
      timePointIdx += 1;
    } else if (goog.date.Date.compare(event.endTime, timePoint.time) < 0) {
      eventIdx += 1;
    } else {
      timePoint.openEvents.push(event);
      event.timePoints.push(timePoint);
      eventIdx += 1;
    }
  }
};

fivemins.EventListLayout.prototype.assignEventsToColumns_ =
    function() {
  var eventsByDuration = goog.array.clone(this.events_);
  eventsByDuration.sort(function(a, b) {
    var aDuration = a.endTime.getTime() - a.startTime.getTime();
    var bDuration = b.endTime.getTime() - b.startTime.getTime();
    return a - b;
  });
  goog.array.forEach(eventsByDuration, function(event) {
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

fivemins.EventListLayout.prototype.calcColumnCounts_ =
    function() {
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

fivemins.EventListLayout.prototype.positionEvents_ =
    function() {
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
  goog.array.forEach(this.events_, function(event) {
    var columnWidth = Math.ceil(this.layoutWidth_ / event.columnCount);
    var x = columnWidth * event.column;
    var height = event.endTimePoint.yPos - event.startTimePoint.yPos;
    event.rect = new goog.math.Rect(x, event.startTimePoint.yPos,
        columnWidth, height);
  }, this);
};

/**
 * @constructor
 * @extends {goog.Disposable}
 */
fivemins.EventListLayout.TimePoint = function(time) {
  this.time = time;
  this.next = null;
  this.yPos = null;
  this.openEvents = [];
  this.columnCount = null;
};
goog.inherits(fivemins.EventListLayout.TimePoint, goog.Disposable);

fivemins.EventListLayout.TimePoint.prototype.disposeInternal =
    function() {
  delete this.openEvents;
  delete this.next;
  goog.base(this, 'disposeInternal');
};

fivemins.EventListLayout.TimePoint.prototype.toString = function() {
  return this.time.toString();
};

fivemins.EventListLayout.TimePoint.prototype.getTime = function() {
  return this.time.getTime();
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

fivemins.EventListLayout.Event.prototype.disposeInternal =
    function() {
  delete this.timePoints;
  delete this.startTimePoint;
  delete this.endTimePoint;
  goog.base(this, 'disposeInternal');
};
