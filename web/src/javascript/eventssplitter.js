// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsSplitter');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');


/**
 * @param {!Array.<!five.Event>} events
 * @constructor
 */
five.EventsSplitter = function(events) {
  /** @type {!Array.<!five.Event>} */
  this.inputEvents_ = events;

  this.newEvents_ = [];
};

five.EventsSplitter.prototype.split = function() {
  var splitTimesMap = {};
  goog.array.forEach(this.inputEvents_, function(event) {
    if (!(event.getStartTime() in splitTimesMap)) {
      splitTimesMap[event.getStartTime()] = event.getStartTime();
    }
    if (!(event.getEndTime() in splitTimesMap)) {
      splitTimesMap[event.getEndTime()] = event.getEndTime();
    }
  }, this);
  var splitTimes = goog.object.getValues(splitTimesMap);
  splitTimes.sort(function(a, b) {
    a = a.toString();
    b = b.toString();
    return a < b ? -1 : (a > b ? 1 : 0);
  });
  goog.array.forEach(this.inputEvents_, function(event) {
    var lastStartTime = event.getStartTime();
    var endTime = goog.asserts.assertObject(event.getEndTime());
    var lastSplitEvent = event;
    goog.array.forEach(splitTimes, function(splitTime) {
      if (goog.date.Date.compare(splitTime, lastStartTime) <= 0 ||
          goog.date.Date.compare(splitTime, endTime) >= 0) {
        return;
      }
      lastSplitEvent.addMutation(new five.EventMutation.SetTimeRange(
          lastStartTime, splitTime));
      var splitEvent = event.duplicate();
      splitEvent.addMutation(new five.EventMutation.SetTimeRange(splitTime,
          endTime));
      this.newEvents_.push(splitEvent);
      lastStartTime = splitTime;
      lastSplitEvent = splitEvent;
    }, this);
  }, this);
};

/** @return {!Array.<!five.Event>} */
five.EventsSplitter.prototype.getNewEvents = function() {
  return this.newEvents_;
};

/** @return {!Array.<!five.Event>} */
five.EventsSplitter.prototype.getAllEvents = function() {
  return goog.array.concat(this.inputEvents_, this.newEvents_);
};