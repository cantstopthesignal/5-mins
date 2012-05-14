// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayoutDemo');

goog.require('fivemins.EventListLayout');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 */
fivemins.EventListLayoutDemo = function() {
  this.events_ = [];

  this.el_ = document.createElement('div');
  this.el_.className = 'event-area';
  document.body.appendChild(this.el_);

  this.eventContainerEl_ = document.createElement('div');
  this.eventContainerEl_.className = 'event-container';
  this.el_.appendChild(this.eventContainerEl_);

  this.now_ = new goog.date.DateTime();
};

fivemins.EventListLayoutDemo.prototype.start = function() {
  this.createSomeEvents_();
};

fivemins.EventListLayoutDemo.prototype.createSomeEvents_ = function() {
  this.events_.push(this.createEvent_('Event 1', 0, 1));
  this.events_.push(this.createEvent_('Event 2', 3.2, 1));
  this.events_.push(this.createEvent_('Event 3', 1.1, 2));
  this.events_.push(this.createEvent_('Event 4', 1.1, 8));
  this.events_.push(this.createEvent_('Event 5', 5, 3));

  goog.array.forEach(this.events_, function(event) {
    event.render(this.eventContainerEl_);
  }, this);

  this.layout_();
};

fivemins.EventListLayoutDemo.prototype.layout_ = function() {
  var layoutEvents = goog.array.map(this.events_, function(event) {
    var layoutEvent = new fivemins.EventListLayout.Event(
        event.startTime, event.endTime);
    layoutEvent.demoEvent = event;
    return layoutEvent;
  }, this);

  var minTime = new goog.date.DateTime();
  minTime.add(new goog.date.Interval(goog.date.Interval.HOURS, -2));

  var layout = new fivemins.EventListLayout();
  layout.setLayoutWidth(500);
  layout.setMinTime(minTime);
  layout.setEvents(layoutEvents);
  layout.calc();

  var eventContainerHeight = 0;
  goog.array.forEach(layoutEvents, function(layoutEvent) {
    var event = layoutEvent.demoEvent;
    window.console.log(event.name, 'column', layoutEvent.column, 'columnCount',
        layoutEvent.columnCount, 'rect', layoutEvent.rect.toString());
    event.setRect(layoutEvent.rect);
    eventContainerHeight = Math.max(layoutEvent.rect.top +
        layoutEvent.rect.height, eventContainerHeight);
  }, this);
  goog.dispose(layout);
  goog.style.setHeight(this.eventContainerEl_, eventContainerHeight);
};

fivemins.EventListLayoutDemo.prototype.createEvent_ = function(
    name, startOffsetHours, durationHours) {
  var startTime = this.now_.clone();
  var startOffsetSeconds = Math.round(startOffsetHours * 60 * 60);
  startTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      startOffsetSeconds));
  var endTime = startTime.clone();
  var durationSeconds = Math.round(durationHours * 60 * 60);
  endTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      durationSeconds));
  return new fivemins.EventListLayoutDemo.Event(name, startTime, endTime);
};


/** @constructor */
fivemins.EventListLayoutDemo.Event = function(name, startTime, endTime) {
  this.name = name;
  this.startTime = startTime;
  this.endTime = endTime;
  this.el_ = document.createElement('div');
  this.el_.className = 'event';
  this.el_.appendChild(document.createTextNode(name));
};

fivemins.EventListLayoutDemo.Event.prototype.render = function(parentEl) {
  parentEl.appendChild(this.el_);
};

/** @param {goog.math.Rect} rect */
fivemins.EventListLayoutDemo.Event.prototype.setRect = function(rect) {
  goog.style.setPosition(this.el_, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el_, rect.getSize());
};
