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
 * Call fn for each hour surrounding startTime and ending at or past endTime.
 * The arguments to fn are (hour, nextHour, isLast).
 */
fivemins.util.forEachHourWrap = function(startTime, endTime, fn,
    opt_scope) {
  var hourIter = fivemins.util.hourFloor(startTime);
  var maxTime = endTime.getTime();
  while (hourIter.getTime() <= maxTime) {
    var nextHour = hourIter.clone();
    nextHour.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
    var isLast = nextHour.getTime() > maxTime;
    fn.call(opt_scope, hourIter, nextHour, isLast);
    hourIter = nextHour;
  }
};
