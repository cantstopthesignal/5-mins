// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventListLayoutDemo');

goog.require('fivemins.Component');
goog.require('fivemins.EventListLayout');
goog.require('fivemins.util');
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

  this.timeAxisLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.timeAxisLayer_);

  this.timeAxisPatchLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.timeAxisPatchLayer_);

  this.eventsLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.eventsLayer_);

  this.cursorPopup_ = new fivemins.EventListLayoutDemo.CursorPopup_();
  this.registerDisposable(this.cursorPopup_);

  this.now_ = new goog.date.DateTime(new goog.date.Date());

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(fivemins.EventListLayoutDemo, goog.events.EventTarget);

/** @type {number} */
fivemins.EventListLayoutDemo.TIME_AXIS_WIDTH = 40;

/** @type {number} */
fivemins.EventListLayoutDemo.TIME_AXIS_PATCH_WIDTH = 20;

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayoutDemo.prototype.timeMap_;

/** @type {fivemins.EventListLayout.TimeMap} */
fivemins.EventListLayoutDemo.prototype.linearTimeMap_;

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
  this.events_.push(this.createEvent_('Event 6b', 7 * 60 + 5, 5));
  this.events_.push(this.createEvent_('Event 7b', 7 * 60 + 10, 5));
  this.events_.push(this.createEvent_('Event 8b', 7 * 60 + 15, 10));

  goog.array.forEach(this.events_, function(event) {
    event.render(this.eventsLayer_);
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

  var minTime = this.now_.clone();
  minTime.add(new goog.date.Interval(goog.date.Interval.HOURS, -1));

  var maxTime = null;
  goog.array.forEach(this.events_, function(event) {
    if (!maxTime || goog.date.Date.compare(event.endTime, maxTime) > 0) {
      maxTime = event.endTime.clone();
    }
  }, this);
  maxTime.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  var params = new fivemins.EventListLayout.Params();
  params.minEventHeight = 25;
  params.layoutWidth = 500 - fivemins.EventListLayoutDemo.TIME_AXIS_WIDTH;
  params.timeAxisPatchWidth = fivemins.EventListLayoutDemo.
      TIME_AXIS_PATCH_WIDTH;
  params.minTime = minTime;
  params.maxTime = maxTime;
  var layout = new fivemins.EventListLayout(params);
  layout.setEvents(layoutEvents);
  layout.calc();
  this.timeMap_ = layout.getTimeMap();
  this.linearTimeMap_ = layout.getLinearTimeMap();

  goog.array.forEach(layout.timePoints_, function(timePoint) {
    window.console.log('TimePoint ' + timePoint.time.toUsTimeString());
    goog.array.forEach(timePoint.openEvents, function(event) {
      window.console.log('  ' + event.startTime.toUsTimeString());
    });
  });

  goog.array.forEach(layoutEvents, function(layoutEvent) {
    var event = layoutEvent.demoEvent;
    window.console.log(event.name, 'column', layoutEvent.column, 'columnCount',
        layoutEvent.columnCount, 'rect', layoutEvent.rect.toString(),
        'timeAxisPatch', layoutEvent.hasTimeAxisPatch);
    var rect = layoutEvent.rect.clone();
    if (rect.left > 0) {
      rect.left -= 1;
      rect.width += 1;
    }
    rect.height += 1;
    rect.left += fivemins.EventListLayoutDemo.TIME_AXIS_WIDTH;
    event.setRect(rect);
    event.setAttachedToTimeAxisPatch(layoutEvent.attachedToTimeAxisPatch);
  }, this);

  this.renderTimeAxis_(minTime, maxTime);
  this.renderTimeAxisPatch_(layoutEvents);

  goog.dispose(layout);

  var eventContainerHeight = 0;
  goog.array.forEach(this.timeAxisLayer_.childNodes, function(childNode) {
    var bounds = goog.style.getBounds(childNode);
    eventContainerHeight = Math.max(eventContainerHeight,
        bounds.top + bounds.height);
  });

  goog.style.setHeight(this.eventContainerEl_, eventContainerHeight);
};

fivemins.EventListLayoutDemo.prototype.renderTimeAxis_ = function(minTime,
    maxTime) {
  fivemins.util.forEachHourWrap(minTime, maxTime, function(hour, nextHour) {
    var timeStr = hour.toUsTimeString(false, true, true);
    var timeEl = document.createElement('div');
    timeEl.className = 'time-axis';
    var timeBoxEl = document.createElement('div');
    timeBoxEl.className = 'time-box';
    timeBoxEl.appendChild(document.createTextNode(timeStr));
    timeEl.appendChild(timeBoxEl);
    var topPos = this.timeMap_.timeToYPos(hour);
    timeEl.style.top = topPos + 'px';
    var bottomPos = this.timeMap_.timeToYPos(nextHour);
    timeEl.style.height = (bottomPos - topPos) + 'px';
    this.timeAxisLayer_.appendChild(timeEl);
  }, this);
};

fivemins.EventListLayoutDemo.prototype.renderTimeAxisPatch_ = function(
    layoutEvents) {
  var canvasEl = document.createElement('canvas');
  canvasEl.style.left = (fivemins.EventListLayoutDemo.TIME_AXIS_WIDTH + 1) +
      "px";
  canvasEl.setAttribute('width', fivemins.EventListLayoutDemo.
      TIME_AXIS_PATCH_WIDTH - 1);
  canvasEl.setAttribute('height', 700);
  goog.dom.classes.add(canvasEl, 'time-axis-patch-canvas');
  this.timeAxisPatchLayer_.appendChild(canvasEl);

  var ctx = canvasEl.getContext('2d');
  ctx.strokeStyle = '#88f';
  ctx.fillStyle = '#d2d2fe';
  ctx.lineCap = 'square';

  function startPoint(timePoint) {
    return new goog.math.Coordinate(0,
        timePoint.linearTimeYPos);
  }

  function endPoint(timePoint) {
    return new goog.math.Coordinate(fivemins.EventListLayoutDemo.
        TIME_AXIS_PATCH_WIDTH, timePoint.yPos);
  }

  function fillPatch(timePoint1, timePoint2) {
    var pt1 = startPoint(timePoint1);
    var pt2 = endPoint(timePoint1);
    var pt3 = endPoint(timePoint2);
    var pt4 = startPoint(timePoint2);
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x + 1, pt2.y);
    ctx.lineTo(pt3.x + 1, pt3.y + 1);
    ctx.lineTo(pt4.x, pt4.y + 1);
    ctx.closePath();
    ctx.fill();
  }

  function drawPatchLine(timePoint) {
    var start = startPoint(timePoint);
    var end = endPoint(timePoint);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y + 0.5);
    ctx.lineTo(start.x + 1, start.y + 0.5);
    ctx.lineTo(end.x - 2, end.y + 0.5);
    ctx.lineTo(end.x, end.y + 0.5);
    ctx.stroke();
  }

  goog.array.forEach(layoutEvents, function(layoutEvent) {
    if (layoutEvent.attachedToTimeAxisPatch) {
      fillPatch(layoutEvent.startTimePoint, layoutEvent.endTimePoint);
    }
  });
  goog.array.forEach(layoutEvents, function(layoutEvent) {
    if (layoutEvent.hasTimeAxisPatch) {
      drawPatchLine(layoutEvent.startTimePoint);
      drawPatchLine(layoutEvent.endTimePoint);
    }
  });
};

fivemins.EventListLayoutDemo.prototype.createEvent_ = function(
    name, startOffsetMins, durationMins) {
  var startTime = this.now_.clone();
  var startOffsetSeconds = fivemins.util.round(startOffsetMins * 60);
  startTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      startOffsetSeconds));
  var endTime = startTime.clone();
  var durationSeconds = fivemins.util.round(durationMins * 60);
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
  var cursorLinearTime = this.linearTimeMap_.yPosToTime(yPos);
  this.cursorPopup_.setMessageText(cursorTime.toUsTimeString(
      undefined, true, true) + ' (linear: ' + cursorLinearTime.toUsTimeString(
      undefined, true, true) + ')');

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

fivemins.EventListLayoutDemo.Event.prototype.setAttachedToTimeAxisPatch =
    function(attached) {
  this.el.style.borderLeftWidth = attached ? 0 : '';
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
