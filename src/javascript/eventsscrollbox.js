// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsScrollBox');

goog.require('five.Component');
goog.require('five.EventCard');
goog.require('five.EventListLayout');
goog.require('five.InlineEventsEditor');
goog.require('five.TimeAxis');
goog.require('five.TimeAxisPatch');
goog.require('five.TimeAxisPatchCanvas');
goog.require('five.TimeAxisPatchMarker');
goog.require('five.TimeMarker');
goog.require('five.TimeMarkerTheme');
goog.require('five.deviceParams');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.KeyCodes');
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
  EVENTS_MOVE: goog.events.getUniqueId('events_move'),
  EVENTS_DUPLICATE: goog.events.getUniqueId('events_duplicate')
};

/** @type {number} */
five.EventsScrollBox.PATCH_MIN_YPOS_DIFF = 2;

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

/** @type {five.TimeAxis} */
five.EventsScrollBox.prototype.timeAxis_;

/** @type {five.TimeAxisPatchCanvas} */
five.EventsScrollBox.prototype.timeAxisPatchCanvas_;

/** @type {five.InlineEventsEditor} */
five.EventsScrollBox.prototype.inlineEventsEditor_;

/** @type {five.TimeMarker} */
five.EventsScrollBox.prototype.cursorMarker_;

/** @type {five.EventListLayout.TimeMap} */
five.EventsScrollBox.prototype.timeMap_;

/** @type {five.EventListLayout.TimeMap} */
five.EventsScrollBox.prototype.linearTimeMap_;

/** @type {number} */
five.EventsScrollBox.prototype.scale_ = 1.0;

/** @type {number} */
five.EventsScrollBox.prototype.eventAreaWidth_;

/** @type {number} */
five.EventsScrollBox.prototype.batchUpdateDepth_ = 0;

/** @type {boolean} */
five.EventsScrollBox.prototype.layoutNeeded_ = false;

five.EventsScrollBox.prototype.createDom = function() {
  goog.base(this, 'createDom');
  this.el.tabIndex = 0;
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

  this.timeAxis_ = new five.TimeAxis();
  this.registerDisposable(this.timeAxis_);
  this.timeAxis_.setDateRange(this.startDate_, this.endDate_);
  this.timeAxis_.setOwner(this);
  this.timeAxis_.render(this.timeAxisLayer_);

  this.timeAxisPatchCanvas_ = new five.TimeAxisPatchCanvas(
      five.deviceParams.getTimeAxisPatchWidth());
  this.registerDisposable(this.timeAxisPatchCanvas_);
  this.timeAxisPatchCanvas_.render(this.timeAxisPatchLayer_);

  this.inlineEventsEditor_ = new five.InlineEventsEditor();
  this.registerDisposable(this.inlineEventsEditor_);
  this.inlineEventsEditor_.setOwner(this);
  this.inlineEventsEditor_.render(this.inlineEventsEditorLayer_);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.KEYDOWN, this.handleKeyDown_).
      listen(this.el, goog.events.EventType.MOUSEOUT, this.handleMouseOut_).
      listen(this.el, goog.events.EventType.BLUR, this.handleBlur_).
      listen(this.el, goog.events.EventType.SCROLL, this.handleScroll_).
      listen(this.inlineEventsEditor_, five.Event.EventType.MOVE,
          this.handleEventsEditorMove_);

  if (five.deviceParams.getEnableCursorTimeMarker()) {
    this.eventHandler.
        listen(this.el, goog.events.EventType.MOUSEMOVE, this.handleMouseMove_);
  }
};

five.EventsScrollBox.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.createDom();

  parentEl.appendChild(this.el);

  this.eventAreaWidth_ = goog.style.getContentBoxSize(this.el).width -
      five.deviceParams.getTimeAxisWidth() -
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
  this.updateVisibleRegion_();
};

five.EventsScrollBox.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  if (this.timeAxis_) {
    this.timeAxis_.setDateRange(this.startDate_, this.endDate_);
  }
  if (this.el) {
    this.layout_();
  }
};

/** @param {!Array.<!five.Event>} events */
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

/** @param {!five.Event} event */
five.EventsScrollBox.prototype.addEvent = function(event) {
  var eventCard = new five.EventCard(event);
  this.eventCards_.push(eventCard);
  if (this.el) {
    this.layout_();
    eventCard.render(this.eventCardsLayer_);
  }
};

/** @param {!Array.<!five.Event>} changedEvents */
five.EventsScrollBox.prototype.eventsChanged = function(changedEvents) {
  this.startBatchUpdate();
  this.layout_();
  this.finishBatchUpdate();
};

/** @param {!Array.<!five.Event>} selectedEvents */
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

five.EventsScrollBox.prototype.layoutTimeMarker = function(timeMarker) {
  var time = timeMarker.getTime();
  var yPos = this.timeMap_.timeToYPos(time);
  var linearTimeYPos = this.linearTimeMap_.timeToYPos(time);

  var hasTimeAxisPatchMarker = Math.abs(yPos - linearTimeYPos) >=
      five.EventsScrollBox.PATCH_MIN_YPOS_DIFF;
  if (hasTimeAxisPatchMarker) {
    var patchMarker = timeMarker.getTimeAxisPatchMarker();
    if (!patchMarker) {
      patchMarker = new five.TimeAxisPatchMarker();
      timeMarker.setTimeAxisPatchMarker(patchMarker);
    }
    patchMarker.setParams(linearTimeYPos, yPos);
    if (!patchMarker.getOwner()) {
      this.timeAxisPatchCanvas_.addMarker(patchMarker);
    }
  } else {
    timeMarker.setTimeAxisPatchMarker(null);
  }

  var rect = new goog.math.Rect(0, yPos, this.eventAreaWidth_, 0);
  if (hasTimeAxisPatchMarker) {
    rect.left += five.deviceParams.getTimeAxisPatchWidth();
    rect.width -= five.deviceParams.getTimeAxisPatchWidth();
  }
  if (rect.left > 0) {
    rect.left -= 1;
    rect.width += 1;
  }
  rect.left += five.deviceParams.getTimeAxisWidth();

  timeMarker.setRect(rect);
  timeMarker.setLabelRect(new goog.math.Rect(0, yPos - 7,
      five.deviceParams.getTimeAxisWidth() - 1, 14));
};

/** @param {!five.TimeAxis.Entry} timeAxisEntry */
five.EventsScrollBox.prototype.layoutTimeAxisEntry = function(timeAxisEntry) {
  var yPosTop = this.timeMap_.timeToYPos(timeAxisEntry.getHour());
  var yPosBottom = this.timeMap_.timeToYPos(timeAxisEntry.getNextHour());
  var rect = new goog.math.Rect(0, yPosTop,
      five.deviceParams.getTimeAxisWidth(), yPosBottom - yPosTop);
  timeAxisEntry.setTimeBoxRect(rect);
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
    yPos -= Math.max(100, this.el.offsetHeight / 4);
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
  this.batchUpdateDepth_++;
  if (this.timeAxisPatchCanvas_) {
    this.timeAxisPatchCanvas_.startBatchUpdate();
  }
};

five.EventsScrollBox.prototype.finishBatchUpdate = function() {
  this.batchUpdateDepth_--;
  goog.asserts.assert(this.batchUpdateDepth_ >= 0);
  if (!this.batchUpdateDepth_ && this.layoutNeeded_) {
    this.doLayout_();
  }
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

five.EventsScrollBox.prototype.renderEvents_ = function() {
  goog.array.forEach(this.eventCards_, function(eventCard) {
    eventCard.render(this.eventCardsLayer_);
  }, this);
};

five.EventsScrollBox.prototype.layout_ = function() {
  if (this.batchUpdateDepth_) {
    this.layoutNeeded_ = true;
  } else {
    this.doLayout_();
  }
};

five.EventsScrollBox.prototype.doLayout_ = function() {
  this.layoutNeeded_ = false;
  var layoutEvents = goog.array.map(this.eventCards_, function(eventCard) {
    var layoutEvent = new five.EventListLayout.Event(
        eventCard.getStartTime(), eventCard.getEndTime());
    layoutEvent.eventCard = eventCard;
    return layoutEvent;
  }, this);
  var params = new five.EventListLayout.Params();
  params.minEventHeight = five.deviceParams.getMinEventHeight();
  params.distancePerHour = five.deviceParams.getDefaultHourHeight();
  params.minDistancePerHour = five.deviceParams.getDefaultHourHeight();
  params.layoutWidth = this.eventAreaWidth_;
  params.timeAxisPatchWidth = five.deviceParams.getTimeAxisPatchWidth();
  params.patchMinYPosDiff = five.EventsScrollBox.PATCH_MIN_YPOS_DIFF;
  if (this.startDate_) {
    params.minTime = this.startDate_;
  }
  var layout = new five.EventListLayout(params);
  layout.setEvents(layoutEvents);
  layout.calc();
  this.timeMap_ = layout.getTimeMap();
  this.linearTimeMap_ = layout.getLinearTimeMap();

  this.timeAxisPatchCanvas_.startBatchUpdate();

  this.layoutEvents_(layoutEvents);
  this.layoutTimeAxisPatches_(layoutEvents);
  goog.dispose(layout);

  this.timeAxis_.layout();
  this.layoutTimeMarkers_();
  this.inlineEventsEditor_.layout();
  this.timeAxisPatchCanvas_.finishBatchUpdate();
  goog.asserts.assert(!this.layoutNeeded_);
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
    rect.left += five.deviceParams.getTimeAxisWidth();
    eventCard.setRect(rect);
  }, this);
};

five.EventsScrollBox.prototype.layoutTimeAxisPatches_ = function(
    layoutEvents) {
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
      five.deviceParams.getTimeAxisWidth(), 0));
};

five.EventsScrollBox.prototype.layoutTimeMarkers_ = function() {
  goog.array.forEach(this.timeMarkers_, function(timeMarker) {
    this.layoutTimeMarker(timeMarker);
  }, this);
};

five.EventsScrollBox.prototype.updateVisibleRegion_ = function() {
  var visibleRect = new goog.math.Rect(this.el.scrollLeft, this.el.scrollTop,
      this.el.offsetWidth, this.el.offsetHeight);
  this.timeAxis_.updateVisibleRegion(visibleRect);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleClick_ = function(e) {
  var event = new goog.events.Event(five.EventsScrollBox.EventType.DESELECT);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};


/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleKeyDown_ = function(e) {
  var event;
  if (e.keyCode == goog.events.KeyCodes.UP) {
    event = five.EventMoveEvent.bothEarlier();
    event.type = five.EventsScrollBox.EventType.EVENTS_MOVE;
  } else if (e.keyCode == goog.events.KeyCodes.DOWN) {
    event = five.EventMoveEvent.bothLater();
    event.type = five.EventsScrollBox.EventType.EVENTS_MOVE;
  } else if (e.keyCode == goog.events.KeyCodes.D) {
    event = five.EventsScrollBox.EventType.EVENTS_DUPLICATE;
  }
  if (event && this.dispatchEvent(event)) {
    e.preventDefault();
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleMouseMove_ = function(e) {
  if (!this.timeMap_) {
    return;
  }
  if (five.deviceParams.getEnableCursorTimeMarker()) {
    var el = e.target;
    var yPos = e.offsetY;
    while (el && el != this.el) {
      yPos += el.offsetTop;
      el = el.parentNode;
    }
    var time = this.timeMap_.yPosToTime(yPos);
    time = five.util.roundToFiveMinutes(time);
    if (!this.cursorMarker_) {
      this.cursorMarker_ = new five.TimeMarker(time,
          five.TimeMarkerTheme.CURSOR);
      this.addTimeMarker(this.cursorMarker_);
    } else {
      this.cursorMarker_.setTime(time);
      this.cursorMarker_.setVisible(true);
    }
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleMouseOut_ = function(e) {
  if (this.cursorMarker_) {
    this.cursorMarker_.setVisible(false);
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleBlur_ = function(e) {
  var event = new goog.events.Event(five.EventsScrollBox.EventType.DESELECT);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsScrollBox.prototype.handleScroll_ = function(e) {
  this.updateVisibleRegion_();
};

/** @param {five.EventMoveEvent} e */
five.EventsScrollBox.prototype.handleEventsEditorMove_ = function(e) {
  e.type = five.EventsScrollBox.EventType.EVENTS_MOVE;
  this.dispatchEvent(e);
};
