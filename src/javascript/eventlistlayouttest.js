// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventListLayoutTest');

goog.require('five.EventListLayout');
goog.require('goog.array');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('goog.testing.jsunit');


var layout;
var baseTime;

function setUp() {
  var params = new five.EventListLayout.Params();
  params.timeAxisPatchWidth = 0;
  params.layoutWidth = 300;
  layout = new five.EventListLayout(params);
  baseTime = new goog.date.DateTime(new goog.date.Date());
}

function tearDown() {
  goog.dispose(layout);
  delete layout;
}

function testNoEvents() {
  layout.calc();
}

function testSingleEvent() {
  var event = createEvent(60, 30, 'event1');
  layout.setEvents([event]);
  layout.calc();
  assertEventColumn(event, 0, 1);
  assertRectEquals(event.rect, 0, 0, 300, 25);
  assertTimePoint(60, event.startTimePoint);
  assertTimePoint(60 + 30, event.endTimePoint);
  assertTimePoints(event.timePoints, 60);
  assertTimePoints(layout.timePoints_, 60, 60 + 30);
  assertEvents(layout.timePoints_[0].openEvents, event);
  assertEvents(layout.timePoints_[1].openEvents);
}

function testTwoEventsNonOverlapping() {
  var event1 = createEvent(60, 30, 'event1');
  var event2 = createEvent(120, 30, 'event2');
  var events = [event1, event2];
  layout.setEvents(events);
  layout.calc();

  assertEventColumn(event1, 0, 1);
  assertRectEquals(event1.rect, 0, 0, 300, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 0, 1);
  assertRectEquals(event2.rect, 0, 50, 300, 25);
  assertTimePoints(event2.timePoints, 120);

  assertTimePoints(layout.timePoints_, 60, 60+30, 120, 120+30);
  assertEvents(layout.timePoints_[0].openEvents, event1);
  assertEvents(layout.timePoints_[1].openEvents);
  assertEvents(layout.timePoints_[2].openEvents, event2);
  assertEvents(layout.timePoints_[3].openEvents);

  assertEventRectsDoNotOverlap(events);
}

function testTwoEventsTouching() {
  var event1 = createEvent(60, 30, 'event1');
  var event2 = createEvent(90, 30, 'event2');
  var events = [event1, event2];
  layout.setEvents(events);
  layout.calc();

  assertEventColumn(event1, 0, 1);
  assertRectEquals(event1.rect, 0, 0, 300, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 0, 1);
  assertRectEquals(event2.rect, 0, 25, 300, 25);
  assertTimePoints(event2.timePoints, 90);

  assertTimePoints(layout.timePoints_, 60, 90, 90+30);
  assertEvents(layout.timePoints_[0].openEvents, event1);
  assertEvents(layout.timePoints_[1].openEvents, event2);
  assertEvents(layout.timePoints_[2].openEvents);

  assertEventRectsDoNotOverlap(events);
}

function testTwoEventsSameTime() {
  var event1 = createEvent(60, 30, 'event1');
  var event2 = createEvent(60, 30, 'event2');
  var events = [event1, event2];
  layout.setEvents(events);
  layout.calc();

  assertEventColumn(event1, 0, 2);
  assertRectEquals(event1.rect, 0, 0, 150, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 1, 2);
  assertRectEquals(event2.rect, 150, 0, 150, 25);
  assertTimePoints(event2.timePoints, 60);

  assertTimePoints(layout.timePoints_, 60, 60+30);
  assertEvents(layout.timePoints_[0].openEvents, event1, event2);
  assertEvents(layout.timePoints_[1].openEvents);

  assertEventRectsDoNotOverlap(events);
}

function testLongEventWithTwoOverlaps() {
  var events = [
    createEvent(0, 180, 'event1'),
    createEvent(0, 60, 'event2'),
    createEvent(120, 60, 'event3')
  ];
  layout.setEvents(events);
  layout.calc();

  assertEventColumn(events[0], 0, 2);
  assertRectEquals(events[0].rect, 0, 0, 150, 150);
  assertTimePoints(events[0].timePoints, 0, 60, 120);

  assertEventColumn(events[1], 1, 2);
  assertRectEquals(events[1].rect, 150, 0, 150, 50);
  assertTimePoints(events[1].timePoints, 0);

  assertEventColumn(events[2], 1, 2);
  assertRectEquals(events[2].rect, 150, 100, 150, 50);
  assertTimePoints(events[2].timePoints, 120);

  assertTimePoints(layout.timePoints_, 0, 60, 120, 180);
  assertEvents(layout.timePoints_[0].openEvents, events[0], events[1]);
  assertEvents(layout.timePoints_[1].openEvents, events[0]);
  assertEvents(layout.timePoints_[2].openEvents, events[0], events[2]);
  assertEvents(layout.timePoints_[3].openEvents);

  assertEventRectsDoNotOverlap(events);
}

function testManyShortEventsInSeries() {
  var events = [
    createEvent(0, 5, 'event1'),
    createEvent(5, 5, 'event2'),
    createEvent(10, 10, 'event3'),
    createEvent(20, 10, 'event4'),
    createEvent(30, 15, 'event5'),
    createEvent(45, 60, 'event6')
  ];
  layout.distancePerHour = 50;
  layout.minDistancePerHour = 30;
  layout.minEventHeight = 15;
  layout.setEvents(events);
  layout.calc();

  assertTimePoints(layout.timePoints_, 0, 5, 10, 20, 30, 45, 60+45);

  assertEventColumn(events[0], 0, 1);
  assertRectEquals(events[0].rect, 0, 0, 300, 15);
  assertEventColumn(events[1], 0, 1);
  assertRectEquals(events[1].rect, 0, 15, 300, 15);
  assertEventColumn(events[2], 0, 1);
  assertRectEquals(events[2].rect, 0, 30, 300, 15);
  assertEventColumn(events[3], 0, 1);
  assertRectEquals(events[3].rect, 0, 45, 300, 15);
  assertEventColumn(events[4], 0, 1);
  assertRectEquals(events[4].rect, 0, 60, 300, 15);
  assertEventColumn(events[5], 0, 1);
  assertRectEquals(events[5].rect, 0, 75, 300, 30);

  assertEventRectsDoNotOverlap(events);

  assertTimeMapsHoursYPos(layout, 0, 83, 118);
}

function testComplexGolden1() {
  var events = [
    createEvent(-15, 60, 'event1'),
    createEvent(55, 2*60 + 5, 'event2'),
    createEvent(3*60, 8*60, 'event3'),
    createEvent(3*60 + 15, 5*60 + 45, 'event4'),
    createEvent(3*60 + 15, 10*60 + 5, 'event5'),
    createEvent(9*60 + 50, 10, 'event6')
  ];
  layout.distancePerHour = 50;
  layout.minDistancePerHour = 30;
  layout.minEventHeight = 15;
  layout.setEvents(events);
  layout.calc();

  assertTimePoints(layout.timePoints_, -15, 45, 55, 180, 195, 540, 590, 600,
      660,800);

  assertEventColumn(events[0], 0, 1);
  assertRectEquals(events[0].rect, 0, 0, 300, 50);
  assertEventColumn(events[1], 0, 1);
  assertRectEquals(events[1].rect, 0, 58, 300, 105);
  assertEventColumn(events[2], 0, 3);
  assertRectEquals(events[2].rect, 0, 163, 100, 400);
  assertEventColumn(events[3], 1, 3);
  assertRectEquals(events[3].rect, 100, 175, 100, 288);
  assertEventColumn(events[4], 2, 3);
  assertRectEquals(events[4].rect, 200, 175, 100, 504);
  assertEventColumn(events[5], 1, 3);
  assertRectEquals(events[5].rect, 100, 504, 100, 15);

  assertEventRectsDoNotOverlap(events);

  assertTimeMapsHoursYPos(layout, -37, 13, 62, 113, 163, 213, 263, 313, 363,
      413, 463, 519, 563, 613, 662, 712);
}

function createEvent(startMinute, duration, name) {
  var startTime = baseTime.clone();
  startTime.add(new goog.date.Interval(goog.date.Interval.MINUTES,
      startMinute));
  var endTime = startTime.clone();
  endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES,
      duration));
  var event = new five.EventListLayout.Event(startTime, endTime);
  event.toString = function() {
    return 'Event<' + startMinute + ' for ' + duration + ' "' + name + '">';
  };
  event.name = name;
  return event;
}

function assertRectEquals(rect, x, y, width, height) {
  var expectedRect = new goog.math.Rect(x, y, width, height);
  if (!goog.math.Rect.equals(rect, expectedRect)) {
    throw Error('Rects are not equal, expected ' + expectedRect.toString() +
        ' but was ' + rect.toString());
  }
}

function assertEventColumn(event, column, columnCount) {
  assertEquals(column, event.column);
  assertEquals(columnCount, event.columnCount);
  assertEquals(true, event.columnAssigned);
}

function assertTimePoint(expectedMinute, timePoint) {
  assertEquals(expectedMinute, (timePoint.getTime() - baseTime.getTime()) /
      (1000 * 60));
}

function assertTimePoints(timePoints, var_arg) {
  var expectedMinutes = Array.prototype.slice.call(arguments, 1);
  var actualMinutes = goog.array.map(timePoints, function(timePoint) {
    return (timePoint.getTime() - baseTime.getTime()) / (1000 * 60);
  });
  assertArrayEquals(expectedMinutes, actualMinutes);
}

function assertEvents(events, var_arg) {
  var expectedEvents = Array.prototype.slice.call(arguments, 1);
  assertArrayEquals(expectedEvents, events);
}

function assertEventRectsDoNotOverlap(events) {
  for (var i = 0; i < events.length; i++) {
    var event1 = events[i];
    for (var j = i + 1; j < events.length; j++) {
      var event2 = events[j];
      var intersect = goog.math.Rect.intersection(event1.rect, event2.rect);
      if (intersect && intersect.width && intersect.height) {
        throw Error("Event rects overlap: " + event1.rect.toString() + ", " +
            event2.rect.toString() + '; overlap: ' + intersect.toString());
      }
    }
  }
}

function assertTimeMapsHoursYPos(layout, var_arg) {
  expectedYPosList = Array.prototype.slice.call(arguments, 1);
  assertTimeMapHoursYPos(layout.getTimeMap(), layout.minTime, layout.maxTime,
      expectedYPosList);
  assertTimeMapHoursYPos(layout.getLinearTimeMap(), layout.minTime,
      layout.maxTime, expectedYPosList);
}

function assertTimeMapHoursYPos(timeMap, minTime, maxTime, expectedYPosList) {
  var actualYPosList = [];
  five.util.forEachHourWrap(minTime, maxTime, function(hour) {
    actualYPosList.push(timeMap.timeToYPos(hour));
  });
  assertEquals(expectedYPosList.toString(), actualYPosList.toString());
}

function show(events, layout) {
  var el = document.createElement('div');
  el.style.position = 'relative';
  document.body.appendChild(el);

  var scale = 2;

  five.util.forEachHourWrap(layout.minTime, layout.maxTime, function(hour) {
    var timeEl = document.createElement('div');
    el.appendChild(timeEl);
    timeEl.style.position = 'absolute';
    timeEl.style.borderTop = five.util.round(1 * scale) + 'px solid red';
    timeEl.style.overflow = 'hidden';
    timeEl.style.font = five.util.round(10 * scale) + 'px Arial';
    timeEl.appendChild(document.createTextNode(hour.toUsTimeString()));
    goog.style.setPosition(timeEl, 0, layout.getTimeMap().timeToYPos(hour) *
        scale);
    goog.style.setBorderBoxSize(timeEl, new goog.math.Size(50 * scale, 15 *
        scale));
  });

  goog.array.forEach(events, function(event) {
    var patchEl = document.createElement('div');
    el.appendChild(patchEl);
    patchEl.style.position = 'absolute';
    patchEl.style.backgroundColor = 'rgba(200, 255, 200, 0.5)';
    patchEl.style.border = five.util.round(1 * scale) +
        'px solid rgba(0, 128, 0, 0.5)';
    var top = event.startTimePoint.linearTimeYPos;
    var height = event.endTimePoint.linearTimeYPos - top;
    goog.style.setPosition(patchEl, (event.rect.left + 50) * scale, top *
        scale);
    goog.style.setBorderBoxSize(patchEl, new goog.math.Size(
        10 * scale, height * scale));
  });

  goog.array.forEach(events, function(event) {
    var eventEl = document.createElement('div');
    el.appendChild(eventEl);
    eventEl.style.position = 'absolute';
    eventEl.style.border = five.util.round(1 * scale) + 'px solid black';
    eventEl.style.overflow = 'hidden';
    eventEl.style.font = five.util.round(10 * scale) + 'px Arial';
    var duration = five.util.msToMin(event.endTime.getTime() -
        event.startTime.getTime());
    eventEl.appendChild(document.createTextNode(
        event.startTime.toUsTimeString() + ' - ' +
        event.endTime.toUsTimeString() + ' (' + duration + ')'));
    goog.style.setPosition(eventEl, (event.rect.left + 60) * scale,
        event.rect.top * scale);
    goog.style.setBorderBoxSize(eventEl, new goog.math.Size(event.rect.width *
        scale, event.rect.height * scale));
  });
}