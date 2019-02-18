// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsSplitter');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');


/**
 * @param {!Array.<!five.Event>} events
 * @param {boolean} dedup
 * @constructor
 */
five.EventsSplitter = function(events, dedup) {
  /** @type {!Array.<!five.Event>} */
  this.inputEvents_ = events;

  /** @type {boolean} */
  this.dedup_ = dedup;

  /** @type {!Array.<!five.Event>} */
  this.newEvents_ = [];
};

five.EventsSplitter.prototype.split = function() {
  var splitTimesMap = {};
  goog.array.forEach(this.inputEvents_, function(event) {
    if (!(event.getStartTime() in splitTimesMap)) {
      splitTimesMap[event.getStartTime()] = {
        time: event.getStartTime(),
        numEvents: 0
      };
    }
    if (!(event.getEndTime() in splitTimesMap)) {
      splitTimesMap[event.getEndTime()] = {
        time: event.getEndTime(),
        numEvents: 0
      };
    }
  }, this);
  var splitTimes = goog.object.getValues(splitTimesMap);
  splitTimes.sort(function(a, b) {
    return goog.date.Date.compare(a.time, b.time);
  });
  goog.array.forEach(this.inputEvents_, function(event) {
    var startTime = event.getStartTime();
    var endTime = event.getEndTime();
    goog.array.forEach(splitTimes, function(splitTime) {
      if (goog.date.Date.compare(splitTime.time, startTime) < 0 ||
          goog.date.Date.compare(splitTime.time, endTime) >= 0) {
        return;
      }
      splitTime.numEvents += 1;
    });
  });
  if (this.dedup_) {
    goog.array.forEach(this.inputEvents_, function(event) {
      var lastStartTime = event.getStartTime();
      var endTime = event.getEndTime();
      var lastSplitEvent = event;
      var lastWasGap = false;
      goog.array.forEach(splitTimes, function(splitTime) {
        if (goog.date.Date.compare(splitTime.time, lastStartTime) <= 0 ||
            goog.date.Date.compare(splitTime.time, endTime) >= 0) {
          return;
        }
        if (splitTime.numEvents == 1) {
          if (lastWasGap) {
            var splitEvent = event.duplicate();
            splitEvent.addMutation(new five.EventMutation.SetTimeRange(splitTime.time,
                endTime));
            this.newEvents_.push(splitEvent);
            lastSplitEvent = splitEvent;
            lastWasGap = false;
          } else {
            lastWasGap = true;
          }
        } else {
          if (lastSplitEvent) {
            lastSplitEvent.addMutation(new five.EventMutation.SetTimeRange(
                lastStartTime, splitTime.time));
            lastSplitEvent = null;
          }
          lastWasGap = true;
        }
        lastStartTime = splitTime.time;
      }, this);
    }, this);
  } else {
    goog.array.forEach(this.inputEvents_, function(event) {
      var lastStartTime = event.getStartTime();
      var endTime = event.getEndTime();
      var lastSplitEvent = event;
      goog.array.forEach(splitTimes, function(splitTime) {
        if (goog.date.Date.compare(splitTime.time, lastStartTime) <= 0 ||
            goog.date.Date.compare(splitTime.time, endTime) >= 0) {
          return;
        }
        lastSplitEvent.addMutation(new five.EventMutation.SetTimeRange(
            lastStartTime, splitTime.time));
        var splitEvent = event.duplicate();
        splitEvent.addMutation(new five.EventMutation.SetTimeRange(splitTime.time,
            endTime));
        this.newEvents_.push(splitEvent);
        lastSplitEvent = splitEvent;
        lastStartTime = splitTime.time;
      }, this);
    }, this);
  }
};

/** @return {!Array.<!five.Event>} */
five.EventsSplitter.prototype.getNewEvents = function() {
  return this.newEvents_;
};

/** @return {!Array.<!five.Event>} */
five.EventsSplitter.prototype.getAllEvents = function() {
  return goog.array.concat(this.inputEvents_, this.newEvents_);
};