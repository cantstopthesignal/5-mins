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

  this.el = document.createElement('div');
  this.el.className = 'event-area';
  document.body.appendChild(this.el);

  this.eventContainerEl_ = document.createElement('div');
  this.eventContainerEl_.className = 'event-container';
  this.el.appendChild(this.eventContainerEl_);

  this.cursorPopup_ = new fivemins.EventListLayoutDemo.CursorPopup_();
  this.registerDisposable(this.cursorPopup_);

  this.now_ = new goog.date.DateTime(new goog.date.Date());

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(fivemins.EventListLayoutDemo, goog.events.EventTarget);

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayoutDemo.prototype.timeMap_;

fivemins.EventListLayoutDemo.prototype.start = function() {
  this.createSomeEvents_();
  this.eventHandler_.listen(this.el, goog.events.EventType.MOUSEMOVE,
      this.handleMouseMoveEventArea_);
  this.eventHandler_.listen(this.el, goog.events.EventType.MOUSEOUT,
      this.handleMouseOutEventArea_);
};

fivemins.EventListLayoutDemo.prototype.createSomeEvents_ = function() {
  this.events_.push(this.createEvent_('Event 1', 0, 60));
  this.events_.push(this.createEvent_('Event 2', 3 * 60 + 15, 60));
  this.events_.push(this.createEvent_('Event 3', 60 + 10, 2 * 60));
  this.events_.push(this.createEvent_('Event 4', 60 + 10, 5 * 60));
  this.events_.push(this.createEvent_('Event 5', 5 * 60, 1.5 * 60));

  this.events_.push(this.createEvent_('Event 6', 7 * 60, 5));
  this.events_.push(this.createEvent_('Event 7', 7 * 60 + 5, 5));
  this.events_.push(this.createEvent_('Event 8', 7 * 60 + 10, 10));
  this.events_.push(this.createEvent_('Event 9', 7 * 60 + 20, 15));
  this.events_.push(this.createEvent_('Event 10', 7 * 60 + 35, 10));

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
  minTime.add(new goog.date.Interval(goog.date.Interval.HOURS, -1));

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
    name, startOffsetMins, durationMins) {
  var startTime = this.now_.clone();
  var startOffsetSeconds = Math.round(startOffsetMins * 60);
  startTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      startOffsetSeconds));
  var endTime = startTime.clone();
  var durationSeconds = Math.round(durationMins * 60);
  endTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      durationSeconds));
  return new fivemins.EventListLayoutDemo.Event(name, startTime, endTime);
};

fivemins.EventListLayoutDemo.prototype.handleMouseMoveEventArea_ = function(e) {
  if (!this.timeMap_) {
    return;
  }
  var eventAreaClientPos = goog.style.getClientPosition(this.el);
  var eventAreaPagePos = goog.style.getPageOffset(this.el);
  var eventAreaPaddingBox = goog.style.getPaddingBox(this.el);
  var yPos = e.clientY - eventAreaClientPos.y - eventAreaPaddingBox.top;

  var cursorTime = this.timeMap_.yPosToTime(yPos);
  goog.asserts.assert(cursorTime);
  var roundtripYPos = this.timeMap_.timeToYPos(cursorTime);
  goog.asserts.assert(yPos == roundtripYPos);
  this.cursorPopup_.setMessageText(cursorTime.toUsTimeString(
      undefined, true, true));

  var cursorPopupPos = new goog.math.Coordinate(
      e.clientX + (eventAreaPagePos.x - eventAreaClientPos.x),
      e.clientY + (eventAreaPagePos.y - eventAreaClientPos.y));
  this.cursorPopup_.showAt(cursorPopupPos);
};

fivemins.EventListLayoutDemo.prototype.handleMouseOutEventArea_ = function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
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
  titleEl.appendChild(document.createTextNode(this.name));
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
  var pos = goog.math.Coordinate.sum(pos, new goog.math.Coordinate(30, 15));
  goog.style.setPosition(this.el, pos);
  goog.style.showElement(this.el, true);
};

fivemins.EventListLayoutDemo.CursorPopup_.prototype.hide = function() {
  if (!this.el) {
    return;
  }
  goog.style.showElement(this.el, false);
};
