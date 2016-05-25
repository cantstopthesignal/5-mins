// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsTimeline');

goog.require('five.Component');
goog.require('five.EdgeEventsEditor');
goog.require('five.EventCard');
goog.require('five.EventsEditor');
goog.require('five.InlineEventsEditor');
goog.require('five.TimeAxis');
goog.require('five.TimeAxisPatch');
goog.require('five.TimeAxisPatchCanvas');
goog.require('five.TimeAxisPatchMarker');
goog.require('five.TimeMarker');
goog.require('five.TimeMarkerTheme');
goog.require('five.deviceParams');
goog.require('five.layout.Calc');
goog.require('five.layout.Event');
goog.require('five.layout.HorzSplit');
goog.require('five.layout.Manager');
goog.require('five.layout.TimeMap');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.style');


/**
 * @constructor
 * @extends {five.Component}
 */
five.EventsTimeline = function() {
  goog.base(this);

  /** @type {Array.<five.EventCard>} */
  this.eventCards_ = [];

  /** @type {Array.<five.TimeMarker.Component>} */
  this.timeMarkers_ = [];
};
goog.inherits(five.EventsTimeline, five.Component);

/** @enum {string} */
five.EventsTimeline.EventType = {
  DESELECT: goog.events.getUniqueId('deselect'),
  EVENT_CREATE: goog.events.getUniqueId('event_create'),
  EVENTS_MOVE: goog.events.getUniqueId('events_move'),
  EVENTS_DUPLICATE: goog.events.getUniqueId('events_duplicate'),
  EVENTS_DELETE: goog.events.getUniqueId('events_delete'),
  EVENTS_EDIT: goog.events.getUniqueId('events_edit'),
  EVENTS_SPLIT: goog.events.getUniqueId('events_split'),
  EVENTS_SAVE: goog.events.getUniqueId('events_save')
};

/** @type {number} */
five.EventsTimeline.PATCH_MIN_YPOS_DIFF = 2;

/** @type {goog.date.DateTime} */
five.EventsTimeline.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.EventsTimeline.prototype.endDate_;

/** @type {Element} */
five.EventsTimeline.prototype.eventCardsLayer_;

/** @type {Element} */
five.EventsTimeline.prototype.timeAxisLayer_;

/** @type {Element} */
five.EventsTimeline.prototype.timeAxisPatchLayer_;

/** @type {Element} */
five.EventsTimeline.prototype.timeMarkersLayer_;

/** @type {Element} */
five.EventsTimeline.prototype.inlineEventsEditorLayer_;

/** @type {five.TimeAxis} */
five.EventsTimeline.prototype.timeAxis_;

/** @type {five.TimeAxisPatchCanvas} */
five.EventsTimeline.prototype.timeAxisPatchCanvas_;

/** @type {five.EventsEditor} */
five.EventsTimeline.prototype.eventsEditor_;

/** @type {five.TimeMarker} */
five.EventsTimeline.prototype.cursorMarker_;

/** @type {five.layout.Manager} */
five.EventsTimeline.prototype.layoutManager_;

/** @type {five.layout.TimeMap} */
five.EventsTimeline.prototype.timeMap_;

/** @type {five.layout.TimeMap} */
five.EventsTimeline.prototype.linearTimeMap_;

/** @type {goog.date.DateTime} */
five.EventsTimeline.prototype.mouseDownTime_;

/** @type {boolean} */
five.EventsTimeline.prototype.mouseDownShiftKey_;

/** @type {five.EventCard} */
five.EventsTimeline.prototype.mouseDownCard_;

/** @type {boolean} */
five.EventsTimeline.prototype.mouseDownMoveControl_;

/** @type {boolean} */
five.EventsTimeline.prototype.mouseDownMoveControlForStart_;

/** @type {boolean} */
five.EventsTimeline.prototype.draggingEvents_;

/** @type {boolean} */
five.EventsTimeline.prototype.dragCreatingEvent_;

/** @type {boolean} */
five.EventsTimeline.prototype.draggingMoveControls_;

/** @type {?goog.events.Key} */
five.EventsTimeline.prototype.globalMouseUpListenerKey_;

/** @type {?goog.events.Key} */
five.EventsTimeline.prototype.globalClickCancelListenerKey_;

/** @type {number} */
five.EventsTimeline.prototype.scale_ = 1.0;

/** @type {number} */
five.EventsTimeline.prototype.eventAreaWidth_;

/** @type {number} */
five.EventsTimeline.prototype.batchUpdateDepth_ = 0;

/** @type {boolean} */
five.EventsTimeline.prototype.layoutNeeded_ = false;

/** @type {five.EventsView} */
five.EventsTimeline.prototype.owner_;

/** @param {five.EventsView} owner */
five.EventsTimeline.prototype.setOwner = function(owner) {
  this.owner_ = owner;
};

five.EventsTimeline.prototype.createDom = function() {
  goog.base(this, 'createDom');
  this.el.tabIndex = 0;
  goog.dom.classes.add(this.el, 'events-timeline');

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

  if (five.deviceParams.getEnableInlineEventsEditor()) {
    this.eventsEditor_ = new five.InlineEventsEditor();
  } else {
    this.eventsEditor_ = new five.EdgeEventsEditor();
  }
  this.registerDisposable(this.eventsEditor_);
  this.eventsEditor_.setOwner(this);
  this.eventsEditor_.render(this.inlineEventsEditorLayer_);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.KEYDOWN, this.handleKeyDown_).
      listen(this.el, goog.events.EventType.MOUSEOUT, this.handleMouseOut_).
      listen(this.el, goog.events.EventType.MOUSEDOWN, this.handleMouseDown_).
      listen(this.eventsEditor_, [five.EventsEditor.EventType.SHOW,
          five.EventsEditor.EventType.HIDE],
          this.handleEventsEditorVisibilityChanged_).
      listen(this.eventsEditor_, [
          five.EventsEditor.EventType.MOUSEDOWN_MOVE_START_CONTROL,
          five.EventsEditor.EventType.MOUSEDOWN_MOVE_END_CONTROL],
          this.handleEventsEditorMouseDownMoveControl_).
      listen(this.eventsEditor_, five.Event.EventType.MOVE,
          this.handleEventsEditorMove_).
      listen(this.eventsEditor_, five.Event.EventType.DUPLICATE,
          this.handleEventsEditorDuplicate_);

  if (five.deviceParams.getEnableCursorTimeMarker() ||
      five.deviceParams.getEnableDragCreateEvent() ||
      five.deviceParams.getEnableDragEvents()) {
    this.eventHandler.listen(this.el, goog.events.EventType.MOUSEMOVE,
        this.handleMouseMove_);
  }

  var params = new five.layout.Params();
  params.minEventHeight = five.deviceParams.getMinEventHeight();
  params.distancePerHour = five.deviceParams.getDefaultHourHeight();
  params.minDistancePerHour = five.deviceParams.getDefaultHourHeight();
  params.timeAxisPatchWidth = five.deviceParams.getTimeAxisPatchWidth();
  params.patchMinYPosDiff = five.EventsTimeline.PATCH_MIN_YPOS_DIFF;
  this.layoutManager_ = new five.layout.Manager(params);
};

five.EventsTimeline.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.createDom();

  parentEl.appendChild(this.el);

  this.calcEventAreaWidth_();
  this.layout_();
  this.renderEvents_();
};

five.EventsTimeline.prototype.focus = function() {
  this.el.focus();
};

/** @override */
five.EventsTimeline.prototype.disposeInternal = function() {
  goog.disposeAll(this.eventCards_);
  delete this.owner_;
  if (this.globalMouseUpListenerKey_) {
    goog.events.unlistenByKey(this.globalMouseUpListenerKey_);
    delete this.globalMouseUpListenerKey_;
  }
  goog.base(this, 'disposeInternal');
};

/**
 * @param {!goog.math.Rect} rect
 */
five.EventsTimeline.prototype.setRect = function(rect) {
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setWidth(this.el, rect.width);
  this.calcEventAreaWidth_();
  this.layout_();
};

/**
 * @param {number=} opt_width
 * @param {number=} opt_height
 */
five.EventsTimeline.prototype.resize = function(opt_width, opt_height) {
  var width = opt_width || this.el.parentNode.offsetWidth;
  var height = opt_height || this.el.parentNode.offsetHeight;
  goog.style.setBorderBoxSize(this.el, new goog.math.Size(width, height));
  this.calcEventAreaWidth_();
  this.layout_();
};

five.EventsTimeline.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate.clone();
  this.endDate_ = endDate.clone();
  if (this.timeAxis_) {
    this.timeAxis_.setDateRange(this.startDate_, this.endDate_);
  }
  if (this.el) {
    this.layout_();
  }
};

/** @param {!Array.<!five.Event>} events */
five.EventsTimeline.prototype.setEvents = function(events) {
  this.startBatchUpdate();
  goog.disposeAll(this.eventCards_);
  this.eventCards_ = goog.array.map(events, function(event) {
    var eventCard = new five.EventCard(event);
    this.registerListenersForEventCard_(eventCard);
    return eventCard;
  }, this);
  if (this.el) {
    this.layout_();
    this.renderEvents_();
  }
  this.finishBatchUpdate();
};

/** @param {!five.Event} event */
five.EventsTimeline.prototype.addEvent = function(event) {
  var eventCard = new five.EventCard(event);
  this.registerListenersForEventCard_(eventCard);
  var insertAfterEvent = event.getInsertAfter();
  var insertAfterIndex = -1;
  if (insertAfterEvent) {
    insertAfterIndex = goog.array.findIndex(this.eventCards_, function(
        eventCard) {
      return eventCard.getEvent() == insertAfterEvent;
    });
  }
  if (insertAfterIndex >= 0) {
    this.eventCards_.splice(insertAfterIndex + 1, 0, eventCard);
  } else {
    this.eventCards_.push(eventCard);
  }
  if (this.el) {
    this.layout_();
    eventCard.render(this.eventCardsLayer_);
  }
};

/** @param {!five.Event} event */
five.EventsTimeline.prototype.removeEvent = function(event) {
  var index = goog.array.findIndex(this.eventCards_, function(eventCard) {
    return (eventCard.getEvent() === event);
  }, this);
  goog.asserts.assert(index >= 0);
  goog.dispose(this.eventCards_[index]);
  this.eventCards_.splice(index, 1);
  if (this.el) {
    this.layout_();
  }
};

/** @param {!Array.<!five.Event>} changedEvents */
five.EventsTimeline.prototype.eventsChanged = function(changedEvents) {
  this.startBatchUpdate();
  this.layout_();
  this.finishBatchUpdate();
};

/** @param {!Array.<!five.Event>} selectedEvents */
five.EventsTimeline.prototype.setSelectedEvents = function(selectedEvents) {
  var selectedEventCards = this.getEventCardsForEvents_(selectedEvents);
  this.eventsEditor_.setEvents(selectedEventCards);
  this.layout_();
};

/** @param {!five.TimeMarker} timeMarker */
five.EventsTimeline.prototype.addTimeMarker = function(timeMarker) {
  var timeMarkerComponent = timeMarker.createComponent();
  timeMarkerComponent.setOwner(this);
  this.registerDisposable(timeMarkerComponent);
  timeMarkerComponent.render(this.timeMarkersLayer_);
  this.timeMarkers_.push(timeMarkerComponent);
};

five.EventsTimeline.prototype.layoutTimeMarker = function(timeMarker) {
  var time = timeMarker.getTime();
  var yPos = this.timeMap_.timeToYPos(time);
  var linearTimeYPos = this.linearTimeMap_.timeToYPos(time);

  var hasTimeAxisPatchMarker = Math.abs(yPos - linearTimeYPos) >=
      five.EventsTimeline.PATCH_MIN_YPOS_DIFF;
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

/** @param {five.layout.HorzSplit} horzSplit */
five.EventsTimeline.prototype.addHorzSplit = function(horzSplit) {
  this.layoutManager_.addHorzSplit(horzSplit);
};

/** @param {five.layout.HorzSplit} horzSplit */
five.EventsTimeline.prototype.removeHorzSplit = function(horzSplit) {
  this.layoutManager_.removeHorzSplit(horzSplit);
};

/** @param {!five.TimeAxis.Entry} timeAxisEntry */
five.EventsTimeline.prototype.layoutTimeAxisEntry = function(timeAxisEntry) {
  var yPosTop = this.timeMap_.timeToYPos(timeAxisEntry.getHour());
  var yPosBottom = this.timeMap_.timeToYPos(timeAxisEntry.getNextHour());
  var rect = new goog.math.Rect(0, yPosTop,
      five.deviceParams.getTimeAxisWidth(), yPosBottom - yPosTop);
  timeAxisEntry.setTimeBoxRect(rect);
};

five.EventsTimeline.prototype.startBatchUpdate = function() {
  this.batchUpdateDepth_++;
  if (this.timeAxisPatchCanvas_) {
    this.timeAxisPatchCanvas_.startBatchUpdate();
  }
};

five.EventsTimeline.prototype.finishBatchUpdate = function() {
  this.batchUpdateDepth_--;
  goog.asserts.assert(this.batchUpdateDepth_ >= 0);
  if (!this.batchUpdateDepth_ && this.layoutNeeded_) {
    this.doLayout_();
  }
  if (this.timeAxisPatchCanvas_) {
    this.timeAxisPatchCanvas_.finishBatchUpdate();
  }
};

five.EventsTimeline.prototype.getTimeMap = function() {
  return this.timeMap_;
};

five.EventsTimeline.prototype.getEventCardsForEvents_ = function(events) {
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

five.EventsTimeline.prototype.renderEvents_ = function() {
  goog.array.forEach(this.eventCards_, function(eventCard) {
    eventCard.render(this.eventCardsLayer_);
  }, this);
};

five.EventsTimeline.prototype.layout_ = function() {
  if (this.batchUpdateDepth_) {
    this.layoutNeeded_ = true;
  } else {
    this.doLayout_();
  }
};

five.EventsTimeline.prototype.calcEventAreaWidth_ = function() {
  this.eventAreaWidth_ = goog.style.getContentBoxSize(this.el).width -
      five.deviceParams.getTimeAxisWidth() -
      five.deviceParams.getTimelineRightGutterWidth();
};

five.EventsTimeline.prototype.doLayout_ = function() {
  this.layoutNeeded_ = false;
  var layoutEvents = goog.array.map(this.eventCards_, function(eventCard) {
    var layoutEvent = new five.layout.Event(
        eventCard.getStartTime(), eventCard.getEndTime());
    layoutEvent.eventCard = eventCard;
    return layoutEvent;
  }, this);
  this.layoutManager_.updateEvents(layoutEvents);
  var params = this.layoutManager_.getParams();
  params.layoutWidth = this.eventAreaWidth_;
  params.minTime = this.startDate_;
  params.maxTime = this.endDate_;
  this.layoutManager_.updateParams(params);
  this.layoutManager_.calc();
  this.timeMap_ = this.layoutManager_.getTimeMap();
  this.linearTimeMap_ = this.layoutManager_.getLinearTimeMap();

  this.timeAxisPatchCanvas_.startBatchUpdate();
  this.layoutEvents_(layoutEvents);
  this.layoutTimeAxisPatches_(layoutEvents);
  this.timeAxis_.layout();
  this.layoutTimeMarkers_();
  this.eventsEditor_.layout();
  this.timeAxisPatchCanvas_.finishBatchUpdate();

  goog.style.setHeight(this.el, this.timeMap_.timeToYPos(this.endDate_));
  goog.asserts.assert(!this.layoutNeeded_);
};

five.EventsTimeline.prototype.layoutEvents_ = function(layoutEvents) {
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

five.EventsTimeline.prototype.layoutTimeAxisPatches_ = function(
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

five.EventsTimeline.prototype.layoutTimeMarkers_ = function() {
  goog.array.forEach(this.timeMarkers_, function(timeMarker) {
    this.layoutTimeMarker(timeMarker);
  }, this);
};

five.EventsTimeline.prototype.updateVisibleRegion = function(visibleRect) {
  this.timeAxis_.updateVisibleRegion(visibleRect);
};

/** @return {?Object} */
five.EventsTimeline.prototype.getScrollAnchorData = function() {
  return this.eventsEditor_.getScrollAnchorData();
};

/**
 * @param {Object} data
 * @return {number}
 */
five.EventsTimeline.prototype.getScrollAnchorDeltaY = function(data) {
  return this.eventsEditor_.getScrollAnchorDeltaY(data);
};

/** @param {five.EventCard} eventCard */
five.EventsTimeline.prototype.registerListenersForEventCard_ =
    function(eventCard) {
  this.eventHandler.
      listen(eventCard, five.EventCard.EventType.MOUSEDOWN_INSIDE,
          this.handleEventCardMouseDownInside_);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleClick_ = function(e) {
  var event = new goog.events.Event(five.EventsTimeline.EventType.DESELECT);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleKeyDown_ = function(e) {
  var event;
  if (e.keyCode == goog.events.KeyCodes.UP) {
    if (e.shiftKey) {
      event = five.EventMoveEvent.startEarlier();
    } else if (e.metaKey) {
      event = five.EventMoveEvent.endEarlier();
    } else {
      event = five.EventMoveEvent.bothEarlier();
    }
    event.type = five.EventsTimeline.EventType.EVENTS_MOVE;
  } else if (e.keyCode == goog.events.KeyCodes.DOWN) {
    if (e.shiftKey) {
      event = five.EventMoveEvent.startLater();
    } else if (e.metaKey) {
      event = five.EventMoveEvent.endLater();
    } else {
      event = five.EventMoveEvent.bothLater();
    }
    event.type = five.EventsTimeline.EventType.EVENTS_MOVE;
  } else if (e.keyCode == goog.events.KeyCodes.C) {
    event = five.EventsTimeline.EventType.EVENT_CREATE;
  } else if (e.keyCode == goog.events.KeyCodes.D) {
    event = five.EventsTimeline.EventType.EVENTS_DUPLICATE;
  } else if (e.keyCode == goog.events.KeyCodes.E) {
    event = five.EventsTimeline.EventType.EVENTS_EDIT;
  } else if (e.keyCode == goog.events.KeyCodes.S) {
    if (e.ctrlKey) {
      event = five.EventsTimeline.EventType.EVENTS_SAVE;
    } else {
      event = five.EventsTimeline.EventType.EVENTS_SPLIT;
    }
  } else if (e.keyCode == goog.events.KeyCodes.BACKSPACE ||
      e.keyCode == goog.events.KeyCodes.DELETE) {
    event = five.EventsTimeline.EventType.EVENTS_DELETE;
  } else if (e.keyCode == goog.events.KeyCodes.ESC) {
    this.clearMouseDown_();
    this.cancelDragCreateEvent_();
    this.cancelDragEvents_();
    this.cancelDragMoveControls_();
  }
  if (event && this.dispatchEvent(event)) {
    e.preventDefault();
    e.stopPropagation();
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleMouseDown_ = function(e) {
  if (!this.timeMap_) {
    this.clearMouseDown_();
    return;
  }
  this.clearMouseDown_(true);
  this.clearGlobalClickCancel_();
  this.mouseDownTime_ = this.getMouseEventTime_(e);
  this.mouseDownShiftKey_ = e.shiftKey;
  this.globalMouseUpListenerKey_ = goog.events.listen(window,
      goog.events.EventType.MOUSEUP, this.handleGlobalMouseUp_, false, this);
};

/** @param {goog.events.Event} e */
five.EventsTimeline.prototype.handleEventCardMouseDownInside_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.EventCard);
  this.clearMouseDown_();
  this.mouseDownCard_ = e.target;
};

/** @param {goog.events.Event} e */
five.EventsTimeline.prototype.handleEventsEditorMouseDownMoveControl_ =
    function(e) {
  goog.asserts.assertInstanceof(e.target, five.EventsEditor);
  this.clearMouseDown_();
  this.mouseDownMoveControl_ = true;
  this.mouseDownMoveControlForStart_ = (e.type ==
      five.EventsEditor.EventType.MOUSEDOWN_MOVE_START_CONTROL);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleGlobalMouseUp_ = function(e) {
  if (!this.timeMap_) {
    this.clearMouseDown_();
    return;
  }
  if (goog.dom.contains(this.el, e.target)) {
    var mouseUpTime = this.getMouseEventTime_(e);
    if (this.dragCreatingEvent_) {
      this.updateDragCreateEventTimeRange_(this.mouseDownTime_, mouseUpTime);
      this.commitDragCreateEvent_();
    }
    if (this.draggingEvents_) {
      this.updateDragEventsTimeRange_(this.mouseDownTime_, mouseUpTime);
      this.commitDragEvents_();
    }
    if (this.draggingMoveControls_) {
      this.updateDragMoveControlsTimeRange_(this.mouseDownTime_, mouseUpTime);
      this.commitDragMoveControls_();
    }
  } else {
    this.cancelDragCreateEvent_();
    this.cancelDragEvents_();
    this.cancelDragMoveControls_();
  }
  this.clearMouseDown_();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleMouseMove_ = function(e) {
  if (!this.timeMap_) {
    return;
  }
  if (five.deviceParams.getEnableCursorTimeMarker()) {
    var time = this.getMouseEventTime_(e);
    if (!this.cursorMarker_) {
      this.cursorMarker_ = new five.TimeMarker(time,
          five.TimeMarkerTheme.CURSOR);
      this.registerDisposable(this.cursorMarker_);
      this.addTimeMarker(this.cursorMarker_);
    } else {
      this.cursorMarker_.setTime(time);
      this.cursorMarker_.setVisible(true);
    }
  }
  if (this.mouseDownTime_) {
    var time = this.getMouseEventTime_(e);
    if (goog.date.Date.compare(this.mouseDownTime_, time)) {
      if (this.mouseDownMoveControl_) {
        this.draggingMoveControls_ = five.deviceParams.
            getEnableDragMoveControls();
      } else if (this.mouseDownCard_) {
        this.draggingEvents_ = five.deviceParams.getEnableDragEvents();
      } else {
        this.dragCreatingEvent_ = five.deviceParams.getEnableDragCreateEvent();
      }
      if (this.dragCreatingEvent_) {
        this.updateDragCreateEventTimeRange_(this.mouseDownTime_, time);
      }
      if (this.draggingEvents_) {
        this.updateDragEventsTimeRange_(this.mouseDownTime_, time);
      }
      if (this.draggingMoveControls_) {
        this.updateDragMoveControlsTimeRange_(this.mouseDownTime_, time);
      }
    }
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleMouseOut_ = function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
  if (this.cursorMarker_) {
    this.cursorMarker_.setVisible(false);
  }
};

/** @param {boolean=} opt_forNewMouseDown */
five.EventsTimeline.prototype.clearMouseDown_ = function(opt_forNewMouseDown) {
  delete this.mouseDownTime_;
  delete this.mouseDownShiftKey_;
  if (!opt_forNewMouseDown) {
    delete this.mouseDownCard_;
    delete this.mouseDownMoveControl_;
    delete this.mouseDownMoveControlForStart_;
  }
  this.clearGlobalMouseUp_();
};

five.EventsTimeline.prototype.clearGlobalMouseUp_ = function() {
  if (this.globalMouseUpListenerKey_) {
    goog.events.unlistenByKey(this.globalMouseUpListenerKey_);
    delete this.globalMouseUpListenerKey_;
  }
};

five.EventsTimeline.prototype.registerGlobalClickCancel_ = function() {
  if (this.globalClickCancelListenerKey_) {
    return;
  }
  this.globalClickCancelListenerKey_ = goog.events.listen(window,
      goog.events.EventType.CLICK, this.handleGlobalClickCancel_, true, this);
};

five.EventsTimeline.prototype.clearGlobalClickCancel_ = function() {
  if (this.globalClickCancelListenerKey_) {
    goog.events.unlistenByKey(this.globalClickCancelListenerKey_);
    delete this.globalClickCancelListenerKey_;
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsTimeline.prototype.handleGlobalClickCancel_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.clearGlobalClickCancel_();
};

five.EventsTimeline.prototype.commitDragCreateEvent_ = function() {
  this.dragCreatingEvent_ = false;
  this.owner_.commitDragCreateEvent();
  this.layoutManager_.allowLayoutCondensing(true);
  this.layout_();
};

five.EventsTimeline.prototype.cancelDragCreateEvent_ = function() {
  this.dragCreatingEvent_ = false;
  if (this.owner_.cancelDragCreateEvent()) {
    this.layoutManager_.allowLayoutCondensing(true);
    this.layout_();
  }
};

five.EventsTimeline.prototype.updateDragCreateEventTimeRange_ = function(time1,
    time2) {
  goog.asserts.assert(this.dragCreatingEvent_);
  var timeCompare = goog.date.Date.compare(time1, time2); 
  if (!timeCompare) {
    return;
  }
  this.registerGlobalClickCancel_();
  this.layoutManager_.allowLayoutCondensing(false);
  var startTime = timeCompare < 0 ? time1 : time2;
  var endTime = timeCompare < 0 ? time2 : time1;
  this.owner_.createOrUpdateDragCreateEvent(startTime, endTime);
};

five.EventsTimeline.prototype.commitDragEvents_ = function() {
  this.draggingEvents_ = false;
  this.owner_.commitDragEvents();
  this.layout_();
};

five.EventsTimeline.prototype.cancelDragEvents_ = function() {
  this.draggingEvents_ = false;
  if (this.owner_.cancelDragEvents()) {
    this.layout_();
  }
};

five.EventsTimeline.prototype.updateDragEventsTimeRange_ = function(
    dragStartTime, dragEndTime) {
  goog.asserts.assert(this.draggingEvents_);
  var timeCompare = goog.date.Date.compare(dragStartTime, dragEndTime); 
  if (timeCompare && !this.mouseDownCard_.getEvent().isSelected()) {
    this.mouseDownCard_.dispatchSelectionEvent(true,
        this.mouseDownShiftKey_);
  }
  if (timeCompare) {
    this.registerGlobalClickCancel_();
  }
  this.owner_.startOrUpdateDragEvents(dragStartTime, dragEndTime,
      five.EventsView.DragEventsType.BOTH);
};

five.EventsTimeline.prototype.commitDragMoveControls_ = function() {
  this.draggingMoveControls_ = false;
  this.owner_.commitDragEvents();
  this.layoutManager_.allowLayoutCondensing(true);
  this.layout_();
};

five.EventsTimeline.prototype.cancelDragMoveControls_ = function() {
  this.draggingMoveControls_ = false;
  if (this.owner_.cancelDragEvents()) {
    this.layoutManager_.allowLayoutCondensing(true);
    this.layout_();
  }
};

five.EventsTimeline.prototype.updateDragMoveControlsTimeRange_ = function(
    dragStartTime, dragEndTime) {
  goog.asserts.assert(this.draggingMoveControls_);
  var timeCompare = goog.date.Date.compare(dragStartTime, dragEndTime); 
  if (timeCompare) {
    this.registerGlobalClickCancel_();
    this.layoutManager_.allowLayoutCondensing(false);
  }
  this.owner_.startOrUpdateDragEvents(dragStartTime, dragEndTime,
      this.mouseDownMoveControlForStart_ ?
      five.EventsView.DragEventsType.START :
      five.EventsView.DragEventsType.END);
};

/**
 * @param {goog.events.BrowserEvent} e
 * @return {!goog.date.DateTime}
 */
five.EventsTimeline.prototype.getMouseEventTime_ = function(e) {
  var yPos = this.getMouseEventYPos_(e);
  var xPos = e.offsetX;
  for (var el = e.target; el && el != this.el; el = el.parentNode) {
    xPos += el.offsetLeft;
  }
  var time;
  if (xPos <= five.deviceParams.getTimeAxisWidth()) {
    time = this.linearTimeMap_.yPosToTime(yPos);
  } else {
    time = this.timeMap_.yPosToTime(yPos);
  }
  return five.util.roundToFiveMinutes(time); 
};

/**
 * @param {goog.events.BrowserEvent} e
 * @return {number}
 */
five.EventsTimeline.prototype.getMouseEventYPos_ = function(e) {
  var yPos = e.offsetY;
  for (var el = e.target; el && el != this.el; el = el.parentNode) {
    yPos += el.offsetTop;
  }
  return yPos;
};

/** @param {five.EventMoveEvent} e */
five.EventsTimeline.prototype.handleEventsEditorVisibilityChanged_ =
    function(e) {
  goog.asserts.assert(this.owner_);
};

/** @param {five.EventMoveEvent} e */
five.EventsTimeline.prototype.handleEventsEditorMove_ = function(e) {
  e.type = five.EventsTimeline.EventType.EVENTS_MOVE;
  this.dispatchEvent(e);
};

/** @param {goog.events.Event} e */
five.EventsTimeline.prototype.handleEventsEditorDuplicate_ = function(e) {
  this.dispatchEvent(five.EventsTimeline.EventType.EVENTS_DUPLICATE);
};
