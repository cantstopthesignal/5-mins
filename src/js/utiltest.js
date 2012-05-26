// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.UtilTest');

goog.require('fivemins.util');
goog.require('goog.array');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.testing.jsunit');


function testForEachHourSurround_oneInstant() {
  var date = goog.date.fromIsoString('20120526T110000');
  var expected = [
      [date,
       goog.date.fromIsoString('20120526T120000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));

  date = goog.date.fromIsoString('20120526T111000');
  expected = [
      [goog.date.fromIsoString('20120526T110000'),
       goog.date.fromIsoString('20120526T120000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));
}

function testForEachHourSurround_oneHour() {
  var startDate = goog.date.fromIsoString('20120526T110000');
  var endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.fromIsoString('20120526T110000'),
       goog.date.fromIsoString('20120526T120000'),
       false],
      [goog.date.fromIsoString('20120526T120000'),
       goog.date.fromIsoString('20120526T130000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate, endDate));

  startDate = goog.date.fromIsoString('20120526T113000');
  endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.fromIsoString('20120526T110000'),
       goog.date.fromIsoString('20120526T120000'),
       false],
      [goog.date.fromIsoString('20120526T120000'),
       goog.date.fromIsoString('20120526T130000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate, endDate));
}

function testForEachHourSurround_aFewHours() {
  var startDate = goog.date.fromIsoString('20120526T110000');
  var endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 3));

  expected = [
      [goog.date.fromIsoString('20120526T110000'),
       goog.date.fromIsoString('20120526T120000'),
       false],
      [goog.date.fromIsoString('20120526T120000'),
       goog.date.fromIsoString('20120526T130000'),
       false],
      [goog.date.fromIsoString('20120526T130000'),
       goog.date.fromIsoString('20120526T140000'),
       false],
      [goog.date.fromIsoString('20120526T140000'),
       goog.date.fromIsoString('20120526T150000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate, endDate));
}

function doForEachHourWrap(startDate, endDate) {
  var output = [];
  fivemins.util.forEachHourWrap(startDate, endDate, function(
      hour, nextHour, isLast) {
    output.push([hour, nextHour, isLast]);
  });
  return output;
}

function assertForEachHourWrapOutput(expected, actual) {
  assertEquals("Output and actual array lengths don't match",
      expected.length, actual.length);
  for (var i = 0; i < expected.length; i++) {
    assertEquals("Hour " + expected[i][0] + " doesn't match " +
        actual[i][0] + "; iter " + i,
        expected[i][0].getTime(), actual[i][0].getTime());
    assertEquals("Hour " + expected[i][1] + " doesn't match " +
        actual[i][1] + "; iter " + i,
        expected[i][1].getTime(), actual[i][1].getTime());
    assertEquals("isLast status does not match",
        expected[i][2], actual[i][2]);
  }
}
