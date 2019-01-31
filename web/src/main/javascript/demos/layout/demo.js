// Copyright cantstopthesignals@gmail.com

goog.provide('five.demos.layout.Demo');

goog.require('five.Component');
goog.require('five.layout.Calc');
goog.require('five.layout.Event');
goog.require('five.layout.TimeMap');
goog.require('five.util');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.events.EventHandler');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('goog.testing.jsunit');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.demos.layout.Demo = function() {
  goog.base(this);

  this.events_ = [];

  this.el = document.createElement('div');
  this.el.className = 'event-area';
  document.body.appendChild(this.el);

  this.eventContainerEl_ = document.createElement('div');
  this.eventContainerEl_.className = 'event-container';
  this.el.appendChild(this.eventContainerEl_);

  this.timeAxisPatchLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.timeAxisPatchLayer_);

  this.timeAxisLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.timeAxisLayer_);

  this.eventsLayer_ = document.createElement('div');
  this.eventContainerEl_.appendChild(this.eventsLayer_);

  this.cursorPopup_ = new five.demos.layout.Demo.CursorPopup_();
  this.registerDisposable(this.cursorPopup_);

  this.now_ = new goog.date.DateTime(new goog.date.Date());

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.demos.layout.Demo, goog.events.EventTarget);

/** @type {number} */
five.demos.layout.Demo.TIME_AXIS_WIDTH = 40;

/** @type {number} */
five.demos.layout.Demo.TIME_AXIS_PATCH_WIDTH = 20;

/** @type {five.layout.TimeMap} */
five.demos.layout.Demo.prototype.timeMap_;

/** @type {five.layout.TimeMap} */
five.demos.layout.Demo.prototype.linearTimeMap_;

five.demos.layout.Demo.prototype.start = function() {
  this.createSomeEvents_();
  this.eventHandler_.listen(this.el, goog.events.EventType.MOUSEMOVE,
      this.handleMouseMoveEventArea_);
  this.eventHandler_.listen(this.el, goog.events.EventType.MOUSEOUT,
      this.handleMouseOutEventArea_);
};

five.demos.layout.Demo.prototype.createSomeEvents_ = function() {
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

five.demos.layout.Demo.prototype.layout_ = function() {
  var layoutEvents = goog.array.map(this.events_, function(event) {
    var layoutEvent = new five.layout.Event(
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
  maxTime = five.util.hourCeil(maxTime);
  minTime.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));

  var params = new five.layout.Params();
  params.minEventHeight = 25;
  params.distancePerHour = 50;
  params.minDistancePerHour = 50;
  params.layoutWidth = 500 - five.demos.layout.Demo.TIME_AXIS_WIDTH;
  params.timeAxisPatchWidth = five.demos.layout.Demo.
      TIME_AXIS_PATCH_WIDTH;
  params.minTime = minTime;
  params.maxTime = maxTime;
  var calc = new five.layout.Calc(params);
  calc.setEvents(layoutEvents);
  calc.calc();
  this.timeMap_ = calc.getTimeMap();
  this.linearTimeMap_ = calc.getLinearTimeMap();

  goog.array.forEach(calc.timePoints_, function(timePoint) {
    window.console.log('TimePoint', timePoint.time.toUsTimeString(),
        'minHeight', timePoint.minHeight, 'height',
        timePoint.next ? (timePoint.next.yPos - timePoint.yPos) : 0);
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
    rect.left += five.demos.layout.Demo.TIME_AXIS_WIDTH;
    event.setRect(rect);
    event.setAttachedToTimeAxisPatch(layoutEvent.attachedToTimeAxisPatch);
  }, this);

  this.renderTimeAxis_(minTime, maxTime);
  this.renderTimeAxisPatch_(layoutEvents);

  goog.dispose(calc);

  var eventContainerHeight = 0;
  goog.array.forEach(this.timeAxisLayer_.childNodes, function(childNode) {
    var bounds = goog.style.getBounds(childNode);
    eventContainerHeight = Math.max(eventContainerHeight,
        bounds.top + bounds.height);
  });

  goog.style.setHeight(this.eventContainerEl_, eventContainerHeight);
};

five.demos.layout.Demo.prototype.renderTimeAxis_ = function(minTime,
    maxTime) {
  five.util.forEachHourRangeWrap(minTime, maxTime, function(hour,
      nextHour) {
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

five.demos.layout.Demo.prototype.renderTimeAxisPatch_ = function(
    layoutEvents) {
  var canvasEl = document.createElement('canvas');
  canvasEl.style.left = five.demos.layout.Demo.TIME_AXIS_WIDTH + "px";
  canvasEl.setAttribute('width', five.demos.layout.Demo.
      TIME_AXIS_PATCH_WIDTH - 1);
  canvasEl.setAttribute('height', 700);
  goog.dom.classlist.add(canvasEl, 'time-axis-patch-canvas');
  this.timeAxisPatchLayer_.appendChild(canvasEl);

  var ctx = canvasEl.getContext('2d');
  ctx.strokeStyle = '#88f';
  ctx.fillStyle = '#d2d2fe';
  ctx.lineCap = 'square';

  function startPoint(timePoint) {
    return new goog.math.Coordinate(0, timePoint.linearTimeYPos);
  }

  function endPoint(timePoint) {
    return new goog.math.Coordinate(five.demos.layout.Demo.
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

five.demos.layout.Demo.prototype.createEvent_ = function(
    name, startOffsetMins, durationMins) {
  var startTime = this.now_.clone();
  var startOffsetSeconds = five.util.round(startOffsetMins * 60);
  startTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      startOffsetSeconds));
  var endTime = startTime.clone();
  var durationSeconds = five.util.round(durationMins * 60);
  endTime.add(new goog.date.Interval(goog.date.Interval.SECONDS,
      durationSeconds));
  return new five.demos.layout.Demo.Event(name, startTime, endTime);
};

five.demos.layout.Demo.prototype.handleMouseMoveEventArea_ =
    function(e) {
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

five.demos.layout.Demo.prototype.handleMouseOutEventArea_ =
    function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
  this.cursorPopup_.hide()
};

/**
 * @constructor
 * @extends {five.Component}
 */
five.demos.layout.Demo.Event = function(name, startTime, endTime) {
  goog.base(this);
  this.name = name;
  this.startTime = startTime;
  this.endTime = endTime;
};
goog.inherits(five.demos.layout.Demo.Event, five.Component);

five.demos.layout.Demo.Event.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'event');

  var titleEl = document.createElement('span');
  goog.dom.classlist.add(titleEl, 'title');
  titleEl.appendChild(document.createTextNode(this.name));
  this.el.appendChild(titleEl);

  var timeStr = this.startTime.toUsTimeString(undefined, true, true) + ' - ' +
      this.endTime.toUsTimeString(undefined, true, true);
  this.el.appendChild(document.createTextNode(timeStr));
};

/** @param {goog.math.Rect} rect */
five.demos.layout.Demo.Event.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

five.demos.layout.Demo.Event.prototype.setAttachedToTimeAxisPatch =
    function(attached) {
  this.el.style.borderLeftWidth = attached ? 0 : '';
};

/**
 * @constructor
 * @extends {five.Component}
 */
five.demos.layout.Demo.CursorPopup_ = function() {
  goog.base(this);
};
goog.inherits(five.demos.layout.Demo.CursorPopup_, five.Component);

five.demos.layout.Demo.CursorPopup_.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'cursor-popup');
  goog.style.setElementShown(this.el, false);
};

/** @param {string} text */
five.demos.layout.Demo.CursorPopup_.prototype.setMessageText = function(
    text) {
  if (!this.el) {
    this.createDom();
  }
  goog.dom.removeChildren(this.el);
  this.el.appendChild(document.createTextNode(text));
};

/** @param {goog.math.Coordinate} pos */
five.demos.layout.Demo.CursorPopup_.prototype.showAt = function(pos) {
  if (!this.el) {
    this.createDom();
  }
  if (!this.el.parentNode) {
    document.body.appendChild(this.el);
  }
  var pos = goog.math.Coordinate.sum(pos, new goog.math.Coordinate(30, 15));
  goog.style.setPosition(this.el, pos);
  goog.style.setElementShown(this.el, true);
};

five.demos.layout.Demo.CursorPopup_.prototype.hide = function() {
  if (!this.el) {
    return;
  }
  goog.style.setElementShown(this.el, false);
};

function testLoad() {
  // Ensure the demo loads without javascript errors.
}
