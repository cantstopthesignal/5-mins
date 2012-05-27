// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.util');

goog.require('goog.date.Date');
goog.require('goog.date.Interval');


fivemins.util.round = function(number) {
  return Math.round(number + 0.0001);
};

fivemins.util.hourToMs = function(hour) {
  return hour * 3600000;
};

fivemins.util.msToHourFloat = function(ms) {
  return ms / 3600000;
};

fivemins.util.secToMs = function(sec) {
  return sec * 1000;
};

fivemins.util.msToSec = function(ms) {
  return fivemins.util.round(ms / 1000);
};

fivemins.util.msToMin = function(ms) {
  return fivemins.util.round(ms / 1000 / 60);
};

fivemins.util.hourFloor = function(date) {
  var hourFloor = date.clone();
  hourFloor.setMinutes(0);
  hourFloor.setSeconds(0);
  hourFloor.setMilliseconds(0);
  return hourFloor;
}

fivemins.util.hourCeil = function(date) {
  var hourCeil = fivemins.util.hourFloor(date);
  if (goog.date.Date.compare(date, hourCeil) > 0) {
    hourCeil.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
  }
  return hourCeil;
}

/**
 * Call fn for each hour range surrounding startTime and endTime.
 * fn is called with arguments (hour, nextHour, isLast).
 */
fivemins.util.forEachHourRangeWrap = function(startTime, endTime, fn,
    opt_scope) {
  fivemins.util.forEachHourWrapInternal_(startTime, endTime, fn, false,
      opt_scope);
};

/**
 * Call fn for each hour surrounding startTime and endTime.
 * fn is called with arguments (hour, nextHour, isLast).
 */
fivemins.util.forEachHourWrap = function(startTime, endTime, fn, opt_scope) {
  fivemins.util.forEachHourWrapInternal_(startTime, endTime, fn, true,
      opt_scope);
};

fivemins.util.forEachHourWrapInternal_ = function(startTime, endTime, fn,
    callWithFinal, opt_scope) {
  goog.asserts.assert(startTime instanceof goog.date.DateTime);
  goog.asserts.assert(endTime instanceof goog.date.DateTime);
  var hourIter = fivemins.util.hourFloor(startTime);
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
