// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayoutDemo');

goog.require('fivemins.Component');
goog.require('fivemins.EventListLayout');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.events.EventHandler');
goog.require('goog.math.Coordinate');
goog.require('goog.style');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.EventListLayoutDemo = function() {
  goog.base(this);

  this.events_ = [];

  this.el_ = document.createElement('div');
  this.el_.className = 'event-area';
  document.body.appendChild(this.el_);

  this.eventContainerEl_ = document.createElement('div');
  this.eventContainerEl_.className = 'event-container';
  this.el_.appendChild(this.eventContainerEl_);

  this.cursorPopup_ = new fivemins.EventListLayoutDemo.CursorPopup_();
  this.registerDisposable(this.cursorPopup_);

  this.now_ = new goog.date.DateTime();

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(fivemins.EventListLayoutDemo, goog.events.EventTarget);

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayoutDemo.prototype.timeMap_;

fivemins.EventListLayoutDemo.prototype.start = function() {
  this.createSomeEvents_();
  this.eventHandler_.listen(this.el_, goog.events.EventType.MOUSEMOVE,
      this.handleMouseMoveEventArea_);
  this.eventHandler_.listen(this.el_, goog.events.EventType.MOUSEOUT,
      this.handleMouseOutEventArea_);
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
  this.timeMap_ = layout.getTimeMap();

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

fivemins.EventListLayoutDemo.prototype.handleMouseMoveEventArea_ = function(e) {
  if (!this.timeMap_) {
    return;
  }
  var eventAreaClientPos = goog.style.getClientPosition(this.el_);
  var eventAreaPagePos = goog.style.getPageOffset(this.el_);
  var eventAreaPaddingBox = goog.style.getPaddingBox(this.el_);
  var yPos = e.clientY - eventAreaClientPos.y - eventAreaPaddingBox.top;

  var cursorTime = this.timeMap_.yPosToTime(yPos);
  this.cursorPopup_.setMessageText(cursorTime.toUsTimeString(
      undefined, true, true));

  var cursorPopupPos = new goog.math.Coordinate(
      e.clientX + (eventAreaPagePos.x - eventAreaClientPos.x) + 30,
      e.clientY + (eventAreaPagePos.y - eventAreaClientPos.y) + 15);
  this.cursorPopup_.showAt(cursorPopupPos);
};

fivemins.EventListLayoutDemo.prototype.handleMouseOutEventArea_ = function(e) {
  this.cursorPopup_.hide()
};

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.EventListLayoutDemo.Event = function(name, startTime, endTime) {
  goog.base(this);
  this.name = name;
  this.startTime = startTime;
  this.endTime = endTime;
};
goog.inherits(fivemins.EventListLayoutDemo.Event, fivemins.Component);

fivemins.EventListLayoutDemo.Event.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'event');

  var titleEl = document.createElement('span');
  goog.dom.classes.add(titleEl, 'title');
  titleEl.appendChild(document.createTextNode(name));
  this.el.appendChild(titleEl);

  var timeStr = this.startTime.toUsTimeString(undefined, true, true) + ' - ' +
      this.endTime.toUsTimeString(undefined, true, true);
  this.el.appendChild(document.createTextNode(timeStr));
};

fivemins.EventListLayoutDemo.Event.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  parentEl.appendChild(this.el);
};

/** @param {goog.math.Rect} rect */
fivemins.EventListLayoutDemo.Event.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.EventListLayoutDemo.CursorPopup_ = function() {
  goog.base(this);
};
goog.inherits(fivemins.EventListLayoutDemo.CursorPopup_, fivemins.Component);

fivemins.EventListLayoutDemo.CursorPopup_.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'cursor-popup');
  goog.style.showElement(this.el, false);
};

/** @param {string} text */
fivemins.EventListLayoutDemo.CursorPopup_.prototype.setMessageText = function(
    text) {
  if (!this.el) {
    this.createDom();
  }
  goog.dom.removeChildren(this.el);
  this.el.appendChild(document.createTextNode(text));
};

/** @param {goog.math.Coordinate} pos */
fivemins.EventListLayoutDemo.CursorPopup_.prototype.showAt = function(pos) {
  if (!this.el) {
    this.createDom();
  }
  if (!this.el.parentNode) {
    document.body.appendChild(this.el);
  }
  goog.style.setPosition(this.el, pos);
  goog.style.showElement(this.el, true);
};

fivemins.EventListLayoutDemo.CursorPopup_.prototype.hide = function() {
  goog.style.showElement(this.el, false);
};
