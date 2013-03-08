// Copyright cantstopthesignals@gmail.com

goog.provide('five.util');

goog.require('goog.date.Date');


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

/**
 * @param {!goog.date.DateTime} date
 * @return {!goog.date.DateTime}
 */
five.util.hourFloor = function(date) {
  var hourFloor = date.clone();
  hourFloor.setMinutes(0);
  hourFloor.setSeconds(0);
  hourFloor.setMilliseconds(0);
  return hourFloor;
};

/**
 * @param {!goog.date.DateTime} date
 * @return {!goog.date.DateTime}
 */
five.util.hourCeil = function(date) {
  var hourCeil = five.util.hourFloor(date);
  if (goog.date.Date.compare(date, hourCeil) > 0) {
    hourCeil = five.util.hourAddSafe(hourCeil);
  }
  return hourCeil;
};

/**
 * Safely add an hour to a date without the risk of daylight savings issues.
 * @param {!goog.date.DateTime} date
 * @param {number=} opt_hours
 * @return {!goog.date.DateTime}
 */
five.util.hourAddSafe = function(date, opt_hours) {
  var hours = goog.isDefAndNotNull(opt_hours) ? opt_hours : 1;
  var newDate = new goog.date.DateTime();
  newDate.setTime(date.getTime() + hours * 3600 * 1000);
  return newDate;
};

/**
 * @param {!goog.date.DateTime} date
 * @return {!goog.date.DateTime}
 */
five.util.dayFloor = function(date) {
  var dayFloor = date.clone();
  dayFloor.setHours(0);
  dayFloor.setMinutes(0);
  dayFloor.setSeconds(0);
  dayFloor.setMilliseconds(0);
  return dayFloor;
};

/**
 * @param {!goog.date.DateTime} date
 * @return {!goog.date.DateTime}
 */
five.util.roundToFiveMinutes = function(date) {
  var hourBase = five.util.hourAddSafe(five.util.hourFloor(date), -1);
  var factor = 1000 * 60 * 5;
  var newTime = five.util.round((date.getTime() - hourBase.getTime()) /
      factor) * factor + hourBase.getTime();
  return new goog.date.DateTime(new Date(newTime));
};

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
    var nextHour = five.util.hourAddSafe(hourIter);
    var isLast = nextHour.getTime() >= maxTime && !callWithFinal;
    fn.call(opt_scope, hourIter, nextHour, isLast);
    firstIter = false;
    hourIter = nextHour;
  }
  if (callWithFinal) {
    fn.call(opt_scope, hourIter, null, true);
  }
};
