// Copyright cantstopthesignals@gmail.com

goog.provide('five.util');

goog.require('goog.date.Date');
goog.require('goog.date.Interval');


five.util.round = function(number) {
  return Math.round(number + 0.0001);
};

five.util.hourToMs = function(hour) {
  return hour * 3600000;
};

five.util.msToHourFloat = function(ms) {
  return ms / 3600000;
};

five.util.secToMs = function(sec) {
  return sec * 1000;
};

five.util.msToSec = function(ms) {
  return five.util.round(ms / 1000);
};

five.util.msToMin = function(ms) {
  return five.util.round(ms / 1000 / 60);
};

five.util.hourFloor = function(date) {
  var hourFloor = date.clone();
  hourFloor.setMinutes(0);
  hourFloor.setSeconds(0);
  hourFloor.setMilliseconds(0);
  return hourFloor;
}

five.util.hourCeil = function(date) {
  var hourCeil = five.util.hourFloor(date);
  if (goog.date.Date.compare(date, hourCeil) > 0) {
    hourCeil.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
  }
  return hourCeil;
}

/**
 * Call fn for each hour range surrounding startTime and endTime.
 * fn is called with arguments (hour, nextHour, isLast).
 */
five.util.forEachHourRangeWrap = function(startTime, endTime, fn,
    opt_scope) {
  five.util.forEachHourWrapInternal_(startTime, endTime, fn, false,
      opt_scope);
};

/**
 * Call fn for each hour surrounding startTime and endTime.
 * fn is called with arguments (hour, nextHour, isLast).
 */
five.util.forEachHourWrap = function(startTime, endTime, fn, opt_scope) {
  five.util.forEachHourWrapInternal_(startTime, endTime, fn, true,
      opt_scope);
};

five.util.forEachHourWrapInternal_ = function(startTime, endTime, fn,
    callWithFinal, opt_scope) {
  goog.asserts.assert(startTime instanceof goog.date.DateTime);
  goog.asserts.assert(endTime instanceof goog.date.DateTime);
  var hourIter = five.util.hourFloor(startTime);
  var maxTime = endTime.getTime();
  var firstIter = true;
  while (hourIter.getTime() < maxTime || firstIter) {
    var nextHour = hourIter.clone();
    nextHour.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
    var isLast = nextHour.getTime() >= maxTime && !callWithFinal;
    fn.call(opt_scope, hourIter, nextHour, isLast);
    firstIter = false;
    hourIter = nextHour;
  }
  if (callWithFinal) {
    fn.call(opt_scope, hourIter, null, true);
  }
};
