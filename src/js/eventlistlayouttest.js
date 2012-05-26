// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayoutTest');

goog.require('fivemins.EventListLayout');
goog.require('goog.array');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.math.Rect');
goog.require('goog.testing.jsunit');


var layout;
var baseTime;

function setUp() {
  var params = new fivemins.EventListLayout.Params();
  params.timeAxisPatchWidth = 0;
  layout = new fivemins.EventListLayout(params);
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
  assertRectsEqual(event.rect, 0, 0, 100, 25);
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
  assertRectsEqual(event1.rect, 0, 0, 100, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 0, 1);
  assertRectsEqual(event2.rect, 0, 50, 100, 25);
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
  assertRectsEqual(event1.rect, 0, 0, 100, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 0, 1);
  assertRectsEqual(event2.rect, 0, 25, 100, 25);
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
  assertRectsEqual(event1.rect, 0, 0, 50, 25);
  assertTimePoints(event1.timePoints, 60);

  assertEventColumn(event2, 1, 2);
  assertRectsEqual(event2.rect, 50, 0, 50, 25);
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
  assertRectsEqual(events[0].rect, 0, 0, 50, 150);
  assertTimePoints(events[0].timePoints, 0, 60, 120);

  assertEventColumn(events[1], 1, 2);
  assertRectsEqual(events[1].rect, 50, 0, 50, 50);
  assertTimePoints(events[1].timePoints, 0);

  assertEventColumn(events[2], 1, 2);
  assertRectsEqual(events[2].rect, 50, 100, 50, 50);
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
    createEvent(45, 30, 'event6')
  ];
  layout.setEvents(events);
  layout.calc();

  assertEventColumn(events[0], 0, 1);
  assertRectsEqual(events[0].rect, 0, 0, 100, 10);
  assertEventColumn(events[1], 0, 1);
  assertRectsEqual(events[1].rect, 0, 10, 100, 10);
  assertEventColumn(events[2], 0, 1);
  assertRectsEqual(events[2].rect, 0, 20, 100, 10);
  assertEventColumn(events[3], 0, 1);
  assertRectsEqual(events[3].rect, 0, 30, 100, 10);
  assertEventColumn(events[4], 0, 1);
  assertRectsEqual(events[4].rect, 0, 40, 100, 13);
  assertEventColumn(events[5], 0, 1);
  assertRectsEqual(events[5].rect, 0, 53, 100, 25);

  assertEventRectsDoNotOverlap(events);
}

function createEvent(startMinute, duration, name) {
  var startTime = baseTime.clone();
  startTime.add(new goog.date.Interval(goog.date.Interval.MINUTES,
      startMinute));
  var endTime = startTime.clone();
  endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES,
      duration));
  var event = new fivemins.EventListLayout.Event(startTime, endTime);
  event.toString = function() {
    return 'Event<' + startMinute + ' for ' + duration + ' "' + name + '">';
  };
  event.name = name;
  return event;
}

function assertRectsEqual(rect, x, y, width, height) {
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
