// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsSplitterTest');

goog.require('goog.date.DateTime');
goog.require('five.Event');
goog.require('five.EventsSplitter');
goog.require('goog.testing.jsunit');

var baseTime = goog.date.DateTime.fromIsoString('2019-01-01T110000');

function testEmpty() {
  var events = [];
  var splitter = new five.EventsSplitter(events, false);
  splitter.split();
  assertEvents(events);
  assertEvents(splitter.getNewEvents());
}

function testSimple() {
  var E = createEvent;
  var events = [E(0, 60, 'A')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, false);
  splitter.split();
  assertEvents(events, originalEvents);
  assertEvents(splitter.getNewEvents());
}

function testSimple_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, originalEvents);
  assertEvents(splitter.getNewEvents());
}

function testNoOverlap() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(60, 60, 'B')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, false);
  splitter.split();
  assertEvents(events, originalEvents);
  assertEvents(splitter.getNewEvents());
}

function testNoOverlap_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(60, 60, 'B')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, originalEvents);
  assertEvents(splitter.getNewEvents());
}

function testOverlap() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(35, 100, 'B')];
  var splitter = new five.EventsSplitter(events, false);
  splitter.split();
  assertEvents(events, E(0, 35, 'A'), E(35, 25, 'B'));
  assertEvents(splitter.getNewEvents(), E(35, 25, 'A'), E(60, 75, 'B'));
}

function testOverlap_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(35, 100, 'B')];
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, E(0, 35, 'A'), E(35, 100, 'B'));
  assertEvents(splitter.getNewEvents());
}

function testInside() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(30, 5, 'B')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, false);
  splitter.split();
  assertEvents(events, E(0, 30, 'A'), E(30, 5, 'B'));
  assertEvents(splitter.getNewEvents(), E(30, 5, 'A'), E(35, 25, 'A'));
}

function testInside_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(30, 5, 'B')];
  var originalEvents = cloneEvents(events);
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, E(0, 30, 'A'), E(30, 5, 'B'));
  assertEvents(splitter.getNewEvents(), E(35, 25, 'A'));
}

function testComplex_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(30, 5, 'B'), E(40, 5, 'C'), E(50, 25, 'D')];
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, [E(0, 30, 'A'), E(30, 5, 'B'), E(40, 5, 'C'), E(50, 25, 'D')]);
  assertEvents(splitter.getNewEvents(), E(35, 5, 'A'), E(45, 5, 'A'));
}

function testComplex2_dedup() {
  var E = createEvent;
  var events = [E(0, 60, 'A'), E(30, 10, 'B'), E(35, 10, 'C')];
  var splitter = new five.EventsSplitter(events, true);
  splitter.split();
  assertEvents(events, [E(0, 30, 'A'), E(30, 5, 'B'), E(35, 10, 'C')]);
  assertEvents(splitter.getNewEvents(), E(45, 15, 'A'));
}

function createEvent(startMinutesOffset, durationMinutes, summary) {
  var startTime = baseTime.clone();
  startTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, startMinutesOffset));
  endTime = startTime.clone();
  endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, durationMinutes));
  return five.Event.createNew(startTime, endTime, summary);
}

function cloneEvents(events) {
  return goog.array.map(events, function(event) {
    return five.Event.createNew(event.getStartTime(), event.getEndTime(), event.getSummary());
  });
}

function assertEvents(events, var_arg) {
  var expectedEvents = Array.prototype.slice.call(arguments, 1);
  if (expectedEvents.length && !(expectedEvents[0] instanceof five.Event)) {
    expectedEvents = expectedEvents[0];
  }
  assertEquals(eventsToString(expectedEvents), eventsToString(events));
}

function eventsToString(events) {
  events = goog.array.clone(events);
  events.sort(compareEvents);
  var str = '\n[\n';
  goog.array.forEach(events, function(event) {
    var startOffset = (event.getStartTime().getTime() - baseTime.getTime()) / 1000 / 60;
    var duration = event.getDuration() / 1000 / 60;
    str += '  Event(' + startOffset + ', ' + duration + ', "' + event.getSummary() + '"),\n';
  });
  str += ']\n';
  return str;
}

function compareEvents(a, b) {
  var cmp = goog.date.Date.compare(a.getStartTime(), b.getStartTime());
  if (cmp != 0) {
    return cmp;
  }
  cmp = goog.date.Date.compare(a.getEndTime(), b.getEndTime());
  if (cmp != 0) {
    return cmp;
  }
  if (a.getSummary() < b.getSummary()) {
    return -1;
  } else if (a.getSummary() > b.getSummary()) {
    return 1;
  } else {
    return -1;
  }
}
