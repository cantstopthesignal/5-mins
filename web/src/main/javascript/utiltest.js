// Copyright cantstopthesignals@gmail.com

goog.provide('five.UtilTest');

goog.require('five.util');
goog.require('goog.array');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.testing.jsunit');


function testForEachHourRangeWrap_oneInstant() {
  var date = goog.date.DateTime.fromIsoString('20120526T110000');
  var expected = [
      [date,
       goog.date.DateTime.fromIsoString('20120526T120000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(date,
      date));

  date = goog.date.DateTime.fromIsoString('20120526T111000');
  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(date,
      date));
}

function testForEachHourWrap_oneInstant() {
  var date = goog.date.DateTime.fromIsoString('20120526T110000');
  var expected = [
      [date,
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       null,
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));

  date = goog.date.DateTime.fromIsoString('20120526T111000');
  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       null,
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));
}

function testForEachHourRangeWrap_oneHour() {
  var startDate = goog.date.DateTime.fromIsoString('20120526T110000');
  var endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
      endDate));

  startDate = goog.date.DateTime.fromIsoString('20120526T113000');
  endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       goog.date.DateTime.fromIsoString('20120526T130000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
      endDate));
}

function testForEachHourWrap_oneHour() {
  var startDate = goog.date.DateTime.fromIsoString('20120526T110000');
  var endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       null,
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate,
      endDate));

  startDate = goog.date.DateTime.fromIsoString('20120526T113000');
  endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       goog.date.DateTime.fromIsoString('20120526T130000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T130000'),
       null,
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate,
      endDate));
}

function testForEachHourRangeWrap_aFewHours() {
  var startDate = goog.date.DateTime.fromIsoString('20120526T110000');
  var endDate = startDate.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.HOURS, 3));

  expected = [
      [goog.date.DateTime.fromIsoString('20120526T110000'),
       goog.date.DateTime.fromIsoString('20120526T120000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T120000'),
       goog.date.DateTime.fromIsoString('20120526T130000'),
       false],
      [goog.date.DateTime.fromIsoString('20120526T130000'),
       goog.date.DateTime.fromIsoString('20120526T140000'),
       true]];
  assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
      endDate));
}

function doForEachHourRangeWrap(startDate, endDate) {
  var output = [];
  five.util.forEachHourRangeWrap(startDate, endDate, function(
      hour, nextHour, isLast) {
    output.push([hour, nextHour, isLast]);
  });
  return output;
}

function doForEachHourWrap(startDate, endDate) {
  var output = [];
  five.util.forEachHourWrap(startDate, endDate, function(
      hour, nextHour, isLast) {
    output.push([hour, nextHour, isLast]);
  });
  return output;
}

function assertForEachHourWrapOutput(expected, actual) {
  assertEquals("Output and actual array lengths don't match",
      expected.length, actual.length);
  for (var i = 0; i < expected.length; i++) {
    assertTimesEqualOrNull("Hour " + expected[i][0] + " doesn't match " +
        actual[i][0] + "; iter " + i, expected[i][0], actual[i][0]);
    assertTimesEqualOrNull("Hour " + expected[i][1] + " doesn't match " +
        actual[i][1] + "; iter " + i, expected[i][1], actual[i][1]);
    assertEquals("isLast status does not match",
        expected[i][2], actual[i][2]);
  }
}

function testRoundToFiveMinutes() {
  function doTest(expected, input) {
    assertEquals(goog.date.DateTime.fromIsoString(expected).toIsoString(),
        five.util.roundToFiveMinutes(goog.date.DateTime.fromIsoString(input)).
        toIsoString());
  }
  doTest('20120526T110000', '20120526T110000');
  doTest('20120526T110000', '20120526T110001');
  doTest('20120526T110000', '20120526T110045');
  doTest('20120526T110000', '20120526T110229');
  doTest('20120526T110500', '20120526T110230');
  doTest('20120526T111000', '20120526T110900');
  doTest('20120526T114500', '20120526T114455');
  doTest('20120526T115500', '20120526T115729');
  doTest('20120526T120000', '20120526T115730');
  doTest('20120526T120000', '20120526T115930');
}

function testHourFloor() {
  function doTest(expected, input) {
    assertEquals(goog.date.DateTime.fromIsoString(expected).toIsoString(),
        five.util.hourFloor(goog.date.DateTime.fromIsoString(input)).
        toIsoString());
  }
  doTest('20120526T110000', '20120526T110000');
  doTest('20120526T110000', '20120526T110001');
  doTest('20120526T110000', '20120526T110900');
  doTest('20120526T110000', '20120526T115930');
  doTest('20120526T120000', '20120526T120000');
}

function testDayFloor() {
  function doTest(expected, input) {
    assertEquals(goog.date.DateTime.fromIsoString(expected).toIsoString(),
        five.util.dayFloor(goog.date.DateTime.fromIsoString(input)).
        toIsoString());
  }
  doTest('20120526T000000', '20120526T110000');
  doTest('20120526T000000', '20120526T110001');
  doTest('20120526T000000', '20120526T165930');
  doTest('20120527T000000', '20120527T120000');
}

function testHourAddSafe() {
  var start = goog.date.DateTime.fromIsoString('20120526T110000');
  var expected = start.clone();
  expected.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
  assertTimesEqualOrNull('Should be equal', expected,
      five.util.hourAddSafe(start));
}

function assertTimesEqualOrNull(msg, time1, time2) {
  assertEquals(msg, time1 === null, time2 === null);
  if (time1 !== null) {
    assertEquals(msg, time1.getTime(), time2.getTime());
  }
}

function testIntervalToIsoStringSafe() {
  var interval = new goog.date.Interval(0, 0, 0, 0, 0, 0);
  assertEquals('PT0S', interval.toIsoString());
  var interval = new goog.date.Interval(0, 0, 2, 2, 3, 40);
  assertEquals('P2DT2H3M40S', interval.toIsoString());
  var interval = new goog.date.Interval(0, 0, 2, 2, 3, 40);
  assertEquals('-P2DT2H3M40S', interval.getInverse().toIsoString());
  var interval = new goog.date.Interval(0, 0, 0, 0, -1, 30);
  assertEquals(-30, interval.getTotalSeconds());
  assertEquals(null, interval.toIsoString());
  var isoString = five.util.intervalToIsoStringSafe(interval);
  assertEquals('-PT30S', isoString);
  assertEquals(-30, goog.date.Interval.fromIsoString(isoString).getTotalSeconds());
}
