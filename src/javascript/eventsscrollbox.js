// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsScrollBox');

goog.require('five.Component');
goog.require('five.EventCard');
goog.require('five.EventListLayout');
goog.require('five.InlineEventsEditor');
goog.require('five.TimeAxisPatch');
goog.require('five.TimeAxisPatchCanvas');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.fx.Animation');
goog.require('goog.fx.easing');
goog.require('goog.math.Coordinate');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.EventsScrollBox = function() {
  goog.base(this);

  /** @type {Array.<five.EventCard>} */
  this.eventCards_ = [];

  /** @type {Array.<five.TimeMarker>} */
  this.timeMarkers_ = [];
};
goog.inherits(five.EventsScrollBox, five.Component);

/** @enum {string} */
five.EventsScrollBox.EventType = {
  DESELECT: goog.events.getUniqueId('deselect'),
  EVENTS_MOVE: goog.events.getUniqueId('events_move')
};

/** @type {number} */
five.EventsScrollBox.MIN_EVENT_HEIGHT = 17;

/** @type {number} */
five.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT = 45;

/** @type {number} */
five.EventsScrollBox.TIME_AXIS_WIDTH = 40;

/** @type {number} */
five.EventsScrollBox.TIME_AXIS_PATCH_WIDTH = 15;

/** @type {number} */
five.EventsScrollBox.SCROLL_ANIMATION_DURATION_MS = 500;

/** @type {goog.date.DateTime} */
five.EventsScrollBox.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.EventsScrollBox.prototype.endDate_;

/** @type {Element} */
five.EventsScrollBox.prototype.eventCardsLayer_;

/** @type {Element} */
five.EventsScrollBox.prototype.timeAxisLayer_;

/** @type {Element} */
five.EventsScrollBox.prototype.timeAxisPatchLayer_;

/** @type {Element} */
five.EventsScrollBox.prototype.timeMarkersLayer_;

/** @type {Element} */
five.EventsScrollBox.prototype.inlineEventsEditorLayer_;

/** @type {five.TimeAxisPatchCanvas} */
five.EventsScrollBox.prototype.timeAxisPatchCanvas_;

/** @type {five.InlineEventsEditor} */
five.EventsScrollBox.prototype.inlineEventsEditor_;

/** @type {five.EventListLayout.TimeMap} */
five.EventsScrollBox.prototype.timeMap_;

/** @type {number} */
five.EventsScrollBox.prototype.scale_ = 1.0;

/** @type {number} */
five.EventsScrollBox.prototype.eventAreaWidth_;

five.EventsScrollBox.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'events-scroll-box');

  this.timeAxisLayer_ = document.createElement('div');
  this.el.appendChild(this.timeAxisLayer_);

  this.timeAxisPatchLayer_ = document.createElement('div');
  this.el.appendChild(this.timeAxisPatchLayer_);

  this.eventCardsLayer_ = document.createElement('div');
  this.el.appendChild(this.eventCardsLayer_);

  this.timeMarkersLayer_ = document.createElement('div');
  this.el.appendChild(this.timeMarkersLayer_);

  this.inlineEventsEditorLayer_ = document.createElement('div');
  this.el.appendChild(this.inlineEventsEditorLayer_);

  this.timeAxisPatchCanvas_ = new five.TimeAxisPatchCanvas(
      five.EventsScrollBox.TIME_AXIS_PATCH_WIDTH);
  this.registerDisposable(this.timeAxisPatchCanvas_);
  this.timeAxisPatchCanvas_.render(this.timeAxisPatchLayer_);

  this.inlineEventsEditor_ = new five.InlineEventsEditor();
  this.inlineEventsEditor_.setOwner(this);
  this.inlineEventsEditor_.render(this.inlineEventsEditorLayer_);
  this.registerDisposable(this.inlineEventsEditor_);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.inlineEventsEditor_, five.Event.EventType.MOVE,
          this.handleEventsEditorMove_);
};

five.EventsScrollBox.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.createDom();

  parentEl.appendChild(this.el);
  this.resize();  // Switch to border box sizing.

  this.eventAreaWidth_ = goog.style.getContentBoxSize(this.el).width -
      five.EventsScrollBox.TIME_AXIS_WIDTH -
      goog.style.getScrollbarWidth();

  this.layout_();
  this.renderEvents_();
};

/**
 * @param {number=} opt_width
 * @param {number=} opt_height
 */
five.EventsScrollBox.prototype.resize = function(opt_width, opt_height) {
  var width = opt_width || this.el.parentNode.offsetWidth;
  var height = opt_height || this.el.parentNode.offsetHeight;
  goog.style.setBorderBoxSize(this.el, new goog.math.Size(width, height));
};

five.EventsScrollBox.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  if (this.el) {
    this.layout_();
  }
};

/** @param {Array.<five.Event>} events */
five.EventsScrollBox.prototype.setEvents = function(events) {
  this.startBatchUpdate();
  goog.disposeAll(this.eventCards_);
  this.eventCards_ = goog.array.map(events, function(event) {
    return new five.EventCard(event);
  }, this);
  if (this.el) {
    this.layout_();
    this.renderEvents_();
  }
  this.finishBatchUpdate();
};

/** @param {Array.<five.Event>} changedEvents */
five.EventsScrollBox.prototype.eventsChanged = function(changedEvents) {
  this.startBatchUpdate();
  this.layout_();
  this.finishBatchUpdate();
};

/** @param {Array.<five.Event>} selectedEvents */
five.EventsScrollBox.prototype.setSelectedEvents = function(selectedEvents) {
  var selectedEventCards = this.getEventCardsForEvents_(selectedEvents);
  this.inlineEventsEditor_.setEvents(selectedEventCards);
};

five.EventsScrollBox.prototype.addTimeMarker = function(timeMarker) {
  timeMarker.setOwner(this);
  this.registerDisposable(timeMarker);
  timeMarker.render(this.timeMarkersLayer_);
  this.timeMarkers_.push(timeMarker);
};

five.EventsScrollBox.prototype.getTimeMarkerRect = function(time) {
  var yPos = this.timeMap_.timeToYPos(time);
  return new goog.math.Rect(five.EventsScrollBox.TIME_AXIS_WIDTH, yPos,
      this.eventAreaWidth_, 0);
};

/**
 * Scroll to a specified time.  Optionally show context before the time
 * instead of starting exactly at the specified time.
 */
five.EventsScrollBox.prototype.scrollToTime = function(date,
    opt_showContext, opt_animate) {
  if (!this.timeMap_) {
    return;
  }
  var yPos = this.timeMap_.timeToYPos(date);
  if (opt_showContext) {
    yPos -= Math.min(100, this.el.offsetHeight / 4);
  }

  if (opt_animate) {
    var lastScrollTop = this.el.scrollTop || 0;
    var animation = new goog.fx.Animation([lastScrollTop], [yPos],
        five.EventsScrollBox.SCROLL_ANIMATION_DURATION_MS,
        goog.fx.easing.easeOut);
    var EventType = goog.fx.Animation.EventType;
    animation.registerDisposable(new goog.events.EventHandler(this).
        listen(animation, [EventType.END, EventType.ANIMATE], function(e) {
      if (this.el.scrollTop != lastScrollTop) {
        // Detect user intervention.
        goog.dispose(animation);
        return;
      }
      this.el.scrollTop = lastScrollTop = Math.round(e.coords[0]);
      if (e.type == EventType.END) {
        goog.dispose(animation);
      }
    }));
    animation.play();
  } else {
    this.el.scrollTop = yPos;
  }
};

/**
 * Scroll by a specified time interval, relative to a given time.
 * @param {boolean} opt_hideScrollAction Make sure auto-show scroll
 *     bars do not show during this scroll action.
 */
five.EventsScrollBox.prototype.scrollByTime = function(relativeToTime,
    interval, opt_hideScrollAction) {
  var toTime = relativeToTime.clone();
  toTime.add(interval);
  var startYPos = this.timeMap_.timeToYPos(relativeToTime);
  var endYPos = this.timeMap_.timeToYPos(toTime);

  if (opt_hideScrollAction) {
    // Disable overflow for the scroll event to avoid auto-show scroll bars
    // on some platforms from activating.
    this.el.style.overflow = 'hidden';
  }

  this.el.scrollTop = this.el.scrollTop + (endYPos - startYPos);

  if (opt_hideScrollAction) {
    this.el.style.overflow = '';
  }
};

/**
 * Return whether a specified time is within the visible area.
 */
five.EventsScrollBox.prototype.isTimeInView = function(date) {
  var yPos = this.timeMap_.timeToYPos(date);
  if (yPos < this.el.scrollTop) {
    return false;
  } else if (yPos > this.el.scrollTop + this.el.offsetHeight) {
    return false;
  }
  return true;
};

five.EventsScrollBox.prototype.startBatchUpdate = function() {
  if (this.timeAxisPatchCanvas_) {
    this.timeAxisPatchCanvas_.startBatchUpdate();
  }
};

five.EventsScrollBox.prototype.finishBatchUpdate = function() {
  if (this.timeAxisPatchCanvas_) {
    this.timeAxisPatchCanvas_.finishBatchUpdate();
  }
};

five.EventsScrollBox.prototype.getEventCardsForEvents_ = function(events) {
  if (!events.length || !this.eventCards_.length) {
    return [];
  }
  var eventCardsByUid = {};
  goog.array.forEach(this.eventCards_, function(eventCard) {
    eventCardsByUid[goog.getUid(eventCard.getEvent())] = eventCard;
  });
  var eventCards = [];
  goog.array.forEach(events, function(event) {
    var eventCard = eventCardsByUid[goog.getUid(event)];
    if (eventCard) {
      eventCards.push(eventCard);
    }
  });
  return eventCards;
}

five.EventsScrollBox.prototype.renderTimeAxis_ = function() {
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  goog.asserts.assert(this.timeMap_);
  goog.dom.removeChildren(this.timeAxisLayer_);
  five.util.forEachHourRangeWrap(this.startDate_, this.endDate_, function(
      hour, nextHour) {
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

five.EventsScrollBox.prototype.renderEvents_ = function() {
  goog.array.forEach(this.eventCards_, function(eventCard) {
    eventCard.render(this.eventCardsLayer_);
  }, this);
};

five.EventsScrollBox.prototype.layout_ = function() {
  var layoutEvents = goog.array.map(this.eventCards_, function(eventCard) {
    var layoutEvent = new five.EventListLayout.Event(
        eventCard.getStartTime(), eventCard.getEndTime());
    layoutEvent.eventCard = eventCard;
    return layoutEvent;
  }, this);
  var params = new five.EventListLayout.Params();
  params.minEventHeight = five.EventsScrollBox.MIN_EVENT_HEIGHT;
  params.distancePerHour = five.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT;
  params.minDistancePerHour = five.EventsScrollBox.
      DEFAULT_HOUR_PIXEL_HEIGHT;
  params.layoutWidth = this.eventAreaWidth_;
  params.timeAxisPatchWidth = five.EventsScrollBox.TIME_AXIS_PATCH_WIDTH;
  if (this.startDate_) {
    params.minTime = this.startDate_;
  }
  var layout = new five.EventListLayout(params);
  layout.setEvents(layoutEvents);
  layout.calc();
  this.timeMap_ = layout.getTimeMap();
  this.layoutEvents_(layoutEvents);
  this.layoutTimeAxisPatches_(layoutEvents);
  goog.dispose(layout);

  this.renderTimeAxis_();
  goog.array.forEach(this.timeMarkers_, function(timeMarker) {
    timeMarker.layout();
  });
  this.inlineEventsEditor_.layout();
};

five.EventsScrollBox.prototype.layoutEvents_ = function(layoutEvents) {
  goog.array.forEach(layoutEvents, function(layoutEvent) {
    var eventCard = layoutEvent.eventCard;
    var rect = layoutEvent.rect.clone();
    if (rect.left > 0) {
      rect.left -= 1;
      rect.width += 1;
    }
    rect.height += 1;
    rect.left += five.EventsScrollBox.TIME_AXIS_WIDTH;
    eventCard.setRect(rect);
  }, this);
};

five.EventsScrollBox.prototype.layoutTimeAxisPatches_ = function(
    layoutEvents) {
  this.timeAxisPatchCanvas_.startBatchUpdate();
  goog.array.forEach(layoutEvents, function(layoutEvent) {
    var eventCard = layoutEvent.eventCard;
    if (layoutEvent.hasTimeAxisPatch) {
      var patch = eventCard.getTimeAxisPatch();
      if (!patch) {
        patch = new five.TimeAxisPatch();
        eventCard.setTimeAxisPatch(patch);
      }
      patch.setParams(layoutEvent.startTimePoint.linearTimeYPos,
          layoutEvent.endTimePoint.linearTimeYPos,
          layoutEvent.startTimePoint.yPos,
          layoutEvent.endTimePoint.yPos,
          layoutEvent.attachedToTimeAxisPatch);
      if (!patch.getOwner()) {
        this.timeAxisPatchCanvas_.addPatch(patch);
      }
      eventCard.timeAxisPatchUpdated();
    } else {
      eventCard.setTimeAxisPatch(null);
    }
  }, this);
  this.timeAxisPatchCanvas_.setPosition(new goog.math.Coordinate(
      five.EventsScrollBox.TIME_AXIS_WIDTH, 0));
  this.timeAxisPatchCanvas_.finishBatchUpdate();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleClick_ = function(e) {
  var event = new goog.events.Event(five.EventsScrollBox.EventType.DESELECT);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};

/** @param {five.EventMoveEvent} e */
five.EventsScrollBox.prototype.handleEventsEditorMove_ = function(e) {
  e.type = five.EventsScrollBox.EventType.EVENTS_MOVE;
  this.dispatchEvent(e);
};
