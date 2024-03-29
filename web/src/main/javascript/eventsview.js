// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsView');

goog.require('five.Button');
goog.require('five.Component');
goog.require('five.DayBanner');
goog.require('five.DurationKeyMonitor');
goog.require('five.EditEventDialog');
goog.require('five.Event');
goog.require('five.EventCreateEvent');
goog.require('five.EventMutation');
goog.require('five.EventSelectNeighborEvent');
goog.require('five.EventsSplitter');
goog.require('five.EventsSummaryDialog');
goog.require('five.EventsTimeline');
goog.require('five.FloatingActionButton');
goog.require('five.TimeMarker');
goog.require('five.TimeMarkerTheme');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.fx.Animation');
goog.require('goog.fx.easing');


/**
 * @param {!five.AppContext} appContext
 * @param {five.CalendarManager} calendarManager
 * @param {five.AppBar} appBar
 * @constructor
 * @extends {five.Component}
 */
five.EventsView = function(appContext, calendarManager, appBar) {
  goog.base(this);

  /** @type {!five.AppContext} */
  this.appContext_ = appContext;

  /** @type {five.CalendarManager} */
  this.calendarManager_ = calendarManager;

  /** @type {!five.CalendarManager.EventLoadingLock} */
  this.eventEditorEventLoadingLock_ = this.calendarManager_.createEventLoadingLock();
  this.registerDisposable(this.eventEditorEventLoadingLock_);

  /** @type {five.AppBar} */
  this.appBar_ = appBar;

  /** @type {!Array.<!five.EventsView.Column>} */
  this.columns_ = [];

  /** @type {!Array.<!five.Event>} */
  this.selectedEvents_ = [];

  /** @type {!Array.<!five.Event>} */
  this.proposedEvents_ = [];

  /** @type {!five.DurationKeyMonitor} */
  this.durationKeyMonitor_ = new five.DurationKeyMonitor();
  this.registerDisposable(this.durationKeyMonitor_);

  this.initDefaultViewDate_();
  this.updateViewDate_();

  this.registerListenersForCalendarManager_();
};
goog.inherits(five.EventsView, five.Component);

/** @enum {string} */
five.EventsView.DragEventsType = {
  BOTH: 'both',
  START: 'start',
  END: 'end'
};

/** @type {number} */
five.EventsView.NOW_TRACKER_INTERVAL_MS_ = 15 * 1000;

/** @type {number} */
five.EventsView.SCROLL_ANIMATION_DURATION_MS = 250;

/** @type {number} */
five.EventsView.DEFAULT_TIMELINE_Y_OFFSET = 500;

/** @type {string} */
five.EventsView.EVENTS_MIME_TYPE_ = 'application/vnd.5-mins.events+json';

/** @type {number} */
five.EventsView.MAX_ENTERED_DURATION_MINUTES_ = 720;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.viewDate_;

/** @type {Array.<!five.Event>} */
five.EventsView.prototype.events_;

/** @type {Element} */
five.EventsView.prototype.scrollEl_;

/** @type {five.Button} */
five.EventsView.prototype.saveButton_;

/** @type {!five.TimeMarker} */
five.EventsView.prototype.nowMarker_;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.nowTrackerLastTickTime_;

/** @type {number} */
five.EventsView.prototype.nowTrackerIntervalId_;

/** @type {five.Spinner.Entry} */
five.EventsView.prototype.calendarManagerSpinEntry_;

/** @type {five.EventsTimeline} */
five.EventsView.prototype.scrollAnchorTimeline_;

/** @type {Object} */
five.EventsView.prototype.scrollAnchorData_;

/** @type {five.Event} */
five.EventsView.prototype.dragCreateEvent_;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.dragEventsStartTime_;

/** @type {Array.<goog.date.DateTime>} */
five.EventsView.prototype.dragEventsLastUpdateTimes_;

/** @type {five.EventsView.DragEventsType} */
five.EventsView.prototype.dragEventsType_;

/** @type {goog.fx.Animation} */
five.EventsView.prototype.scrollAnimation_;

five.EventsView.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'events-view');

  this.scrollEl_ = document.createElement('div');
  goog.dom.classlist.add(this.scrollEl_, 'events-view-scroll');
  this.el.appendChild(this.scrollEl_);

  var refreshButton = new five.Button('Refresh');
  this.appBar_.getButtonBar().addButton(refreshButton);
  this.eventHandler.listen(refreshButton.el, goog.events.EventType.CLICK,
      this.handleRefreshClick_);

  var nowButton = new five.Button('Now');
  this.appBar_.getButtonBar().addButton(nowButton);
  this.eventHandler.listen(nowButton.el, goog.events.EventType.CLICK,
      this.handleNowClick_);

  if (five.device.isMobile()) {
    var proposeButton = new five.FloatingActionButton('propose-button');
    proposeButton.render(this.el);
    this.eventHandler.listen(proposeButton.el, goog.events.EventType.CLICK,
        this.handleProposeClick_);
  }

  this.saveButton_ = new five.Button('Save');
  this.appBar_.getButtonBar().addButton(this.saveButton_);
  this.eventHandler.listen(this.saveButton_.el, goog.events.EventType.CLICK,
      this.handleSaveClick_);
  goog.style.setElementShown(this.saveButton_.el, false);

  this.nowMarker_ = new five.TimeMarker(new goog.date.DateTime(),
      five.TimeMarkerTheme.NOW);

  this.eventHandler.
      listen(this.scrollEl_, goog.events.EventType.SCROLL, this.handleScroll_).
      listen(this.el, goog.events.EventType.KEYDOWN, this.handleKeyDown_).
      listen(this.durationKeyMonitor_, five.DurationKeyMonitor.EventType.DURATION_ENTERED,
          this.handleDurationEntered_);
};

five.EventsView.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  this.createDom();

  parentEl.appendChild(this.el);

  if (!this.events_) {
    this.reloadEvents_().addCallback(this.handleInitialEventsLoad_, this);
  }

  if (!this.nowTrackerTimeoutId_) {
    this.handleNowTrackerTick_();
  }
};

five.EventsView.prototype.resize = function(opt_width, opt_height) {
  var width = opt_width || this.el.parentNode.offsetWidth;
  var height = opt_height || this.el.parentNode.offsetHeight;
  goog.style.setBorderBoxSize(this.scrollEl_,
      new goog.math.Size(width, height));
  var timelinesWidth = width - goog.style.getScrollbarWidth();
  this.updateAndResizeTimelines_(timelinesWidth, height);
  this.updateVisibleRegion_();
};

five.EventsView.prototype.focus = function() {
  if (this.columns_.length) {
    this.columns_[0].timeline.focus();
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleDefaultCopy = function(e) {
  if (!this.selectedEvents_.length) {
    return;
  }
  e.preventDefault();
  var clipboardData = e.getBrowserEvent().clipboardData;
  clipboardData.setData('text/plain', this.selectedEvents_[0].getSummary());
  clipboardData.setData(five.EventsView.EVENTS_MIME_TYPE_,
      this.serializeEventsJson_(this.selectedEvents_));
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleDefaultPaste = function(e) {
  e.preventDefault();
  var clipboardData = e.getBrowserEvent().clipboardData;
  var eventsJson = this.parseEventsJson_(
      clipboardData.getData(five.EventsView.EVENTS_MIME_TYPE_));
  var clipboardText = clipboardData.getData('text').trim();
  if (!this.selectedEvents_.length && eventsJson) {
    var cursorTime;
    for (var i = 0; i < this.columns_.length; i++) {
      cursorTime = this.columns_[i].timeline.getCursorTime();
      if (cursorTime) {
        break;
      }
    }
    if (!cursorTime) {
      return;
    }
    this.startBatchRenderUpdate_();
    var minStartTime;
    goog.array.forEach(eventsJson, function(eventJson) {
      var startTime = new goog.date.DateTime(new Date(eventJson['startTime']));
      if (!minStartTime || startTime < minStartTime) {
        minStartTime = startTime;
      }
    });
    var startTimeOffset = cursorTime.getTime() - minStartTime;
    var newEvents = goog.array.map(eventsJson, function(eventJson) {
      var startTime = new goog.date.DateTime(new Date(eventJson['startTime']+ startTimeOffset));
      var endTime = new goog.date.DateTime(new Date(eventJson['endTime'] + startTimeOffset));
      var newEvent = five.Event.createNew(startTime, endTime, eventJson['summary']);
      this.addEvent_(newEvent);
      return newEvent;
    }, this);
    this.finishBatchRenderUpdate_();
    this.replaceSelectedEvents_(newEvents);
    return;
  } else if (this.selectedEvents_.length && clipboardText.length) {
    goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
      selectedEvent.addMutation(new five.EventMutation.ChangeSummary(clipboardText));
    });
    goog.array.forEach(this.columns_, function(column) {
      column.timeline.eventsChanged(this.selectedEvents_);
    }, this);
    return;
  }
};

five.EventsView.prototype.serializeEventsJson_ = function(events) {
  var json = goog.array.map(events, function(event) {
    return {
      'summary': event.getSummary(),
      'startTime': event.getStartTime().getTime(),
      'endTime': event.getEndTime().getTime()
    };
  });
  return JSON.stringify(json);
};

five.EventsView.prototype.parseEventsJson_ = function(jsonString) {
  if (!jsonString || !jsonString.length) {
    return null;
  }
  var json;
  try {
    json = JSON.parse(jsonString);
  } catch (ex) {
    return null;
  }
  if (!goog.isArray(json)) {
    return null;
  }
  var isEventJsonValid = function(eventJson) {
    return goog.isString(eventJson['summary']) &&
        goog.isNumber(eventJson['startTime']) &&
        goog.isNumber(eventJson['endTime']);
  };
  if (!goog.array.every(json, isEventJsonValid)) {
    return null;
  }
  return json;
};

/** @override */
five.EventsView.prototype.disposeInternal = function() {
  if (this.nowTrackerTimeoutId_) {
    window.clearTimeout(this.nowTrackerTimeoutId_);
    delete this.nowTrackerTimeoutId_;
  }
  goog.disposeAll(this.events_);
  goog.disposeAll(this.columns_);
  goog.base(this, 'disposeInternal');
};

/** @param {boolean=} opt_confirmMutations */
five.EventsView.prototype.reloadEvents_ = function(opt_confirmMutations) {
  if (opt_confirmMutations) {
    if (this.calendarManager_.hasMutations() && !window.confirm(
        'Some events have been modified, are you sure you want to refresh?')) {
      return null;
    }
  }
  this.replaceSelectedEvents_([]);
  this.calendarManager_.cancelMutations();
  var startDate = this.viewDate_.clone();
  startDate.add(new goog.date.Interval(goog.date.Interval.DAYS, -10));
  var endDate = this.viewDate_.clone();
  endDate.add(new goog.date.Interval(goog.date.Interval.DAYS, 10));
  return this.calendarManager_.loadEvents(startDate, endDate);
};

five.EventsView.prototype.displayEvents_ = function() {
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.setEvents(goog.asserts.assertArray(this.events_));
  }, this);
};

/** @param {!Array.<!five.Event>} newSelectedEvents */
five.EventsView.prototype.replaceSelectedEvents_ = function(newSelectedEvents) {
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.setSelected(false);
  });
  goog.array.forEach(newSelectedEvents, function(selectedEvent) {
    selectedEvent.setSelected(true);
  });
  this.selectedEvents_ = newSelectedEvents;
  this.selectedEventsChanged_();
};

five.EventsView.prototype.selectedEventsChanged_ = function() {
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.setSelectedEvents(this.selectedEvents_);
  }, this);
};

/** @param {!Array.<!five.Event>} newProposedEvents */
five.EventsView.prototype.replaceProposedEvents_ = function(newProposedEvents) {
  goog.array.forEach(this.proposedEvents_, function(proposedEvent) {
    if (proposedEvent.isProposed()) {
      this.removeEvent_(proposedEvent);
    }
  }, this);
  this.proposedEvents_ = newProposedEvents;
};

/** @param {five.Event} event */
five.EventsView.prototype.registerListenersForEvent_ = function(event) {
  var EventType = five.Event.EventType;
  this.eventHandler.
      listen(event, [EventType.SELECT, EventType.DESELECT],
          this.handleEventToggleSelect_).
      listen(event, [EventType.EDIT],
          this.handleEventEdit_).
      listen(event, [EventType.MOVE],
          this.handleMoveSelectedEventsCommand_).
      listen(event, [EventType.DATA_CHANGED],
          this.handleEventDataChanged_);
};

five.EventsView.prototype.startBatchRenderUpdate_ = function() {
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.startBatchUpdate();
  });
};

five.EventsView.prototype.finishBatchRenderUpdate_ = function() {
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.finishBatchUpdate();
  });
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleEventToggleSelect_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  var event = /** @type {!five.Event} */ (e.target);
  goog.asserts.assert(this.events_.indexOf(event) >= 0);
  this.startBatchRenderUpdate_();
  var upgradedFromProposed = this.maybeUpgradeFromProposed_(event);
  if (e.shiftKey) {
    var existingIndex = this.selectedEvents_.indexOf(event);
    if (e.type == five.Event.EventType.SELECT) {
      goog.asserts.assert(existingIndex < 0);
      event.setSelected(true);
      this.selectedEvents_.push(event);
    } else if (e.type == five.Event.EventType.DESELECT) {
      goog.asserts.assert(existingIndex >= 0);
      event.setSelected(false);
      this.selectedEvents_.splice(existingIndex, 1);
    } else {
      goog.asserts.fail('Type unexpected: ' + e.type);
    }
    this.selectedEventsChanged_();
  } else {
    var newSelectedEvents = [];
    if (e.type == five.Event.EventType.SELECT) {
      newSelectedEvents.push(event);
    }
    this.replaceSelectedEvents_(newSelectedEvents);
  }
  this.finishBatchRenderUpdate_();
  if (upgradedFromProposed) {
    this.openEditEventDialogForCreate_(event);
  }
};

five.EventsView.prototype.maybeUpgradeFromProposed_ = function(event) {
  var upgrade = event.isProposed();
  if (upgrade) {
    var proposedIndex = this.proposedEvents_.indexOf(event);
    goog.asserts.assert(proposedIndex >= 0);
    this.proposedEvents_.splice(proposedIndex, 1);
    event.setProposed(false);
  }
  this.replaceProposedEvents_([]);
  return upgrade;
};

five.EventsView.prototype.updateAndResizeTimelines_ = function(timelinesWidth,
    timelinesHeight) {
  var numTimelines = Math.max(1, Math.floor(
      document.body.offsetWidth / five.deviceParams.getTimelineMinWidth()));
  var widthPerTimeline = Math.min(five.deviceParams.getTimelineMaxWidth(),
      Math.floor(timelinesWidth / numTimelines));

  while (this.columns_.length > numTimelines) {
    var deletedColumn = this.columns_.pop();
    goog.dispose(deletedColumn);
  }
  while (this.columns_.length < numTimelines) {
    var newColumn = new five.EventsView.Column();
    newColumn.timeline = new five.EventsTimeline();
    newColumn.timeline.setOwner(this);
    var columnIndex = this.columns_.length;
    var startDate = this.viewDate_.clone();
    startDate.add(new goog.date.Interval(goog.date.Interval.DAYS,
        columnIndex - 1));
    var endDate = startDate.clone();
    endDate.add(new goog.date.Interval(goog.date.Interval.DAYS, 3));
    newColumn.timeline.setDateRange(startDate, endDate);
    newColumn.timeline.render(this.scrollEl_);
    newColumn.timeline.startBatchUpdate();
    if (this.events_) {
      newColumn.timeline.setEvents(this.events_);
    }
    newColumn.timeline.setSelectedEvents(this.selectedEvents_);
    newColumn.timeline.addTimeMarker(this.nowMarker_);
    this.registerListenersForTimeline_(newColumn.timeline);
    var dayBannerDate = startDate.clone();
    dayBannerDate.add(new goog.date.Interval(goog.date.Interval.DAYS, 1));
    newColumn.dayBanner = new five.DayBanner(dayBannerDate);
    newColumn.dayBanner.render(this.el);
    this.registerListenersForDayBanner_(newColumn.dayBanner);
    this.columns_.push(newColumn);
    newColumn.timeline.finishBatchUpdate();
  }

  var xPos = 0;
  goog.array.forEach(this.columns_, function(column, index) {
    var timeline = column.timeline;
    var dayBanner = column.dayBanner;
    var timelineWidth = widthPerTimeline;
    if (index == this.columns_.length - 1) {
      timelineWidth = timelinesWidth - xPos;
    }
    var rect = new goog.math.Rect(xPos, column.yOffset, timelineWidth,
        Math.max(50, timelinesHeight));
    timeline.setRect(rect);
    dayBanner.setRect(new goog.math.Rect(xPos, 0, timelineWidth, 0));
    xPos += widthPerTimeline;
  }, this);
};

five.EventsView.prototype.registerListenersForTimeline_ = function(timeline) {
  var EventType = five.EventsTimeline.EventType;
  this.eventHandler.
      listen(timeline, EventType.DESELECT,
          this.handleEventsTimelineDeselect_).
      listen(timeline, EventType.EVENT_CREATE,
          this.handleEventsTimelineEventCreate_).
      listen(timeline, EventType.EVENT_SELECT_NEIGHBOR,
          this.handleEventsTimelineEventSelectNeighborEvent_).
      listen(timeline, EventType.EVENTS_DELETE,
          this.handleEventsTimelineEventsDelete_).
      listen(timeline, EventType.EVENTS_DUPLICATE,
          this.handleEventsTimelineEventsDuplicate_).
      listen(timeline, EventType.EVENTS_EDIT,
          this.handleEventsTimelineEventsEdit_).
      listen(timeline, EventType.EVENTS_ESCAPE,
          this.handleEventsTimelineEventsEscape_).
      listen(timeline, EventType.EVENTS_MOVE,
          this.handleEventsTimelineEventsMove_).
      listen(timeline, EventType.EVENTS_PROPOSE,
          this.handleEventsTimelineEventsPropose_).
      listen(timeline, EventType.EVENTS_REFRESH,
          this.handleEventsTimelineEventsRefresh_).
      listen(timeline, EventType.EVENTS_SAVE,
          this.handleEventsTimelineEventsSave_).
      listen(timeline, EventType.EVENTS_SNAP_TO,
          this.handleEventsTimelineEventsSnapTo_).
      listen(timeline, EventType.EVENTS_SPLIT,
          this.handleEventsTimelineEventsSplit_).
      listen(timeline, EventType.EVENTS_TOGGLE_TODO,
          this.handleEventsTimelineEventsToggleTodo_).
      listen(timeline, EventType.EVENTS_TOGGLE_IS_ESTIMATE,
          this.handleEventsTimelineEventsToggleIsEstimate_);
};

five.EventsView.prototype.handleEventsTimelineDeselect_ = function() {
  this.replaceSelectedEvents_([]);
  this.replaceProposedEvents_([]);
};

/** @param {five.EventCreateEvent} e */
five.EventsView.prototype.handleEventsTimelineEventCreate_ = function(e) {
  var newEvent = five.Event.createNew(e.startTime, e.endTime, '<new>');
  this.addEvent_(newEvent);
  this.replaceSelectedEvents_([newEvent]);
  this.openEditEventDialogForCreate_(newEvent);
};

/** @param {five.EventSelectNeighborEvent} e */
five.EventsView.prototype.handleEventsTimelineEventSelectNeighborEvent_ = function(e) {
  var existingTime;
  var existingEvent;
  if (this.selectedEvents_.length) {
    existingEvent = this.selectedEvents_[0];
  } else {
    existingTime = new goog.date.DateTime();
  }
  var normCompare = function(compareResult) { return compareResult; };
  if (e.dir == five.EventSelectNeighborEvent.Dir.PREVIOUS) {
    normCompare = function(compareResult) { return -compareResult; }
  }
  /**
   * @param {five.Event} a
   * @param {five.Event} b
   */
  var compareEvents = function(a, b) {
    var res = goog.date.Date.compare(a.getStartTime(), b.getStartTime());
    if (res != 0) {
      return res;
    }
    return b.getDuration() - a.getDuration();
  };
  var bestEvent = null;
  goog.array.forEach(this.events_, function(event) {
    if (existingEvent) {
      if (normCompare(compareEvents(existingEvent, event)) >= 0) {
        return;
      }
    } else {
      if (normCompare(goog.date.Date.compare(existingTime, event.getStartTime())) > 0) {
        return;
      }
    }
    if (bestEvent == null || normCompare(compareEvents(bestEvent, event)) > 0) {
      bestEvent = event;
    }
  });
  if (bestEvent) {
    this.replaceSelectedEvents_([bestEvent]);
  }
};

/** @param {five.EventMoveEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsMove_ = function(e) {
  this.handleMoveSelectedEventsCommand_(e);
};

five.EventsView.prototype.handleEventsTimelineEventsDuplicate_ = function() {
  if (!this.selectedEvents_.length) {
    return;
  }
  this.startBatchRenderUpdate_();
  var duplicatedEvents = [];
  goog.array.forEach(this.selectedEvents_, function(event) {
    var newEvent = event.duplicate();
    this.addEvent_(newEvent);
    duplicatedEvents.push(newEvent);
  }, this);
  this.finishBatchRenderUpdate_();
  this.replaceSelectedEvents_(duplicatedEvents);
};

five.EventsView.prototype.handleEventsTimelineEventsEdit_ = function() {
  if (this.selectedEvents_.length != 1) {
    return;
  }
  var event = this.selectedEvents_[0];
  this.maybeUpgradeFromProposed_(event);
  this.openEditEventDialog_(event);
};

five.EventsView.prototype.handleEventsTimelineEventsDelete_ = function() {
  if (!this.selectedEvents_.length) {
    return;
  }
  this.startBatchRenderUpdate_();
  goog.array.forEach(this.selectedEvents_, function(event) {
    this.removeEvent_(event);
  }, this);
  this.selectedEvents_ = [];
  this.selectedEventsChanged_();
  this.finishBatchRenderUpdate_();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsSplit_ = function(e) {
  if (this.selectedEvents_.length <= 1) {
    return;
  }
  this.startBatchRenderUpdate_();
  var eventSplitter = new five.EventsSplitter(this.selectedEvents_, e.shiftKey);
  eventSplitter.split();
  goog.array.forEach(eventSplitter.getNewEvents(), function(newEvent) {
    this.addEvent_(newEvent);
  }, this);
  var newSelectedEvents = eventSplitter.getAllEvents();
  this.finishBatchRenderUpdate_();
  this.replaceSelectedEvents_(newSelectedEvents);
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsToggleTodo_ = function(e) {
  if (!this.selectedEvents_.length) {
    return;
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    var summaryInfo = five.Event.SummaryInfo.fromSummary(selectedEvent.getSummary());
    var newSummaryInfo = five.Event.SummaryInfo.toggleTodo(summaryInfo);
    var newSummary = newSummaryInfo.getSummary();
    selectedEvent.addMutation(new five.EventMutation.ChangeSummary(newSummary));
  });
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(this.selectedEvents_);
  }, this);
  e.preventDefault();
}

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsToggleIsEstimate_ = function(e) {
  if (!this.selectedEvents_.length) {
    return;
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    var summaryInfo = five.Event.SummaryInfo.fromSummary(selectedEvent.getSummary());
    var newSummaryInfo = five.Event.SummaryInfo.toggleIsEstimate(summaryInfo);
    var newSummary = newSummaryInfo.getSummary();
    selectedEvent.addMutation(new five.EventMutation.ChangeSummary(newSummary));
  });
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(this.selectedEvents_);
  }, this);
  e.preventDefault();
}

five.EventsView.prototype.handleEventsTimelineEventsEscape_ = function() {
  this.replaceSelectedEvents_([]);
  this.replaceProposedEvents_([]);
}

five.EventsView.prototype.handleEventsTimelineEventsSave_ = function() {
  this.calendarManager_.saveMutations();
};

/** @param {five.EventSnapToEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsSnapTo_ = function(e) {
  if (!this.selectedEvents_.length) {
    return;
  }
  if (e.dir == five.EventSnapToEvent.Dir.NOW) {
    var snapTime = five.util.roundToFiveMinutes(new goog.date.DateTime());
    goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
      var startTime = selectedEvent.getStartTime();
      var endTime = selectedEvent.getEndTime();
      if (goog.date.Date.compare(startTime, snapTime) >= 0 ||
          e.anchor == five.EventSnapToEvent.Anchor.START) {
        selectedEvent.addMutation(new five.EventMutation.SetTimeRange(snapTime, endTime));
      } else {
        selectedEvent.addMutation(new five.EventMutation.SetTimeRange(startTime, snapTime));
      }
    });
    goog.array.forEach(this.columns_, function(column) {
      column.timeline.eventsChanged(this.selectedEvents_);
    }, this);
  } else if (e.dir == five.EventSnapToEvent.Dir.PREVIOUS ||
      e.dir == five.EventSnapToEvent.Dir.NEXT) {
    this.snapEvents_(this.selectedEvents_,
        e.dir == five.EventSnapToEvent.Dir.PREVIOUS,
        e.anchor == five.EventSnapToEvent.Anchor.START);
  }
};

/**
 * @param {!Array.<!five.Event>} snapEvents
 * @param {boolean} toPrevious
 * @param {boolean} anchorStart
 * @return {boolean}
 */
five.EventsView.prototype.snapEvents_ = function(snapEvents, toPrevious, anchorStart) {
  /**
   * @param {goog.date.DateTime} a
   * @param {goog.date.DateTime} b
   */
  var compareTime = function(a, b) {
    return goog.date.Date.compare(goog.asserts.assertObject(a), goog.asserts.assertObject(b));
  };
  var inDirection = toPrevious ?
      function(value) { return value < 0; } :
      function(value) { return value > 0; };
  var eventsChanged = false;
  goog.array.forEach(snapEvents, function(snapEvent) {
    var snapEventTime = anchorStart ? snapEvent.getStartTime() : snapEvent.getEndTime();
    var bestEvent = null;
    /** @type {goog.date.DateTime} */
    var bestEventTime = null;
    goog.array.forEach(this.events_, function(event) {
      var eventTime = anchorStart ? event.getEndTime() : event.getStartTime();
      var timeDifference = eventTime.getTime() - snapEventTime.getTime();
      if (!inDirection(timeDifference) || Math.abs(five.util.msToMin(timeDifference)) > 12 * 60) {
        return;
      }
      if (bestEvent == null || inDirection(compareTime(bestEventTime, eventTime))) {
        bestEvent = event;
        bestEventTime = eventTime;
      }
    });
    if (bestEvent) {
      if (anchorStart) {
        snapEvent.addMutation(new five.EventMutation.SetTimeRange(
            goog.asserts.assertObject(bestEventTime),
            snapEvent.getEndTime()));
      } else {
        snapEvent.addMutation(new five.EventMutation.SetTimeRange(
            snapEvent.getStartTime(),
            goog.asserts.assertObject(bestEventTime)));
      }
      eventsChanged = true;
    }
  }, this);
  if (!eventsChanged) {
    return false;
  }
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(snapEvents);
  });
  return true;
};

/** @param {!five.EventsProposeEvent} e */
five.EventsView.prototype.handleEventsTimelineEventsPropose_ = function(e) {
  this.proposeEvents_(e.time);
};

five.EventsView.prototype.handleEventsTimelineEventsRefresh_ = function() {
  this.reloadEvents_(true /* opt_confirmMutations */);
};

five.EventsView.prototype.registerListenersForDayBanner_ = function(dayBanner) {
  var EventType = five.DayBanner.EventType;
  this.eventHandler.
      listen(dayBanner, EventType.CLICK,
          this.handleDayBannerClick_);
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleDayBannerClick_ = function(e) {
  var dayStart;
  var dayEnd;
  var title;
  if (e.shiftKey) {
    dayEnd = five.util.dayFloor(e.target.getDate());
    dayStart = dayEnd.clone();
    dayStart.add(new goog.date.Interval(goog.date.Interval.DAYS, -7));
    title = 'Week up to ' + five.DayBanner.DATE_FORMAT.format(dayEnd);
  } else {
    dayStart = five.util.dayFloor(e.target.getDate());
    dayEnd = dayStart.clone();
    dayEnd.add(new goog.date.Interval(goog.date.Interval.DAYS, 1));
    title = five.DayBanner.DATE_FORMAT.format(dayStart);
  }

  var dialog = new five.EventsSummaryDialog(this.appContext_, title, this.events_ || [],
      dayStart, dayEnd);
  dialog.show();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleScroll_ = function(e) {
  this.updateViewDate_();
  this.updateAdditionalTimelineAlignments_();
  this.updateVisibleRegion_();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsView.prototype.handleKeyDown_ = function(e) {
  if (e.keyCode >= goog.events.KeyCodes.ZERO && e.keyCode <= goog.events.KeyCodes.NINE) {
    this.durationKeyMonitor_.handleNumberKey(e.keyCode - goog.events.KeyCodes.ZERO);
  } else if (e.keyCode == goog.events.KeyCodes.SEMICOLON) {
    this.durationKeyMonitor_.handleColonKey();
  } else if (e.keyCode == goog.events.KeyCodes.A) {
    this.proposeRelativeToSelection_(true);
  } else if (e.keyCode == goog.events.KeyCodes.B) {
    this.proposeRelativeToSelection_(false);
  } else {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
};

/** @param {!five.DurationKeyMonitor.DurationEnteredEvent} e */
five.EventsView.prototype.handleDurationEntered_ = function(e) {
  if (e.minutes <= 0 || e.minutes % 5 != 0 || !this.selectedEvents_.length ||
      e.minutes > five.EventsView.MAX_ENTERED_DURATION_MINUTES_) {
    return;
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    var startTime = selectedEvent.getStartTime();
    var endTime = startTime.clone();
    endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, e.minutes));
    selectedEvent.addMutation(new five.EventMutation.SetTimeRange(startTime, endTime));
  });
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(this.selectedEvents_);
  }, this);
};

five.EventsView.prototype.updateAdditionalTimelineAlignments_ = function() {
  if (this.columns_.length <= 1) {
    return;
  }
  var scrollDate = this.yPosToTime_(this.scrollEl_.scrollTop);
  for (var i = 1; i < this.columns_.length; i++) {
    var column = this.columns_[i];
    var timelineDate = scrollDate.clone();
    timelineDate.add(new goog.date.Interval(goog.date.Interval.DAYS, i));
    var topOffset = this.scrollEl_.scrollTop - this.timeToYPos_(timelineDate, i) +
        column.yOffset - five.EventsView.DEFAULT_TIMELINE_Y_OFFSET;
    column.yOffset = five.EventsView.DEFAULT_TIMELINE_Y_OFFSET + topOffset;
    column.timeline.setTop(column.yOffset);
  }
}

five.EventsView.prototype.updateVisibleRegion_ = function() {
  goog.array.forEach(this.columns_, function(column) {
    var visibleRect = new goog.math.Rect(this.scrollEl_.scrollLeft,
        this.scrollEl_.scrollTop - column.yOffset + column.dayBanner.getHeight(),
        this.scrollEl_.offsetWidth, this.scrollEl_.offsetHeight);
    column.timeline.updateVisibleRegion(visibleRect);
  }, this);
};

/** @param {!five.Event} newEvent */
five.EventsView.prototype.addEvent_ = function(newEvent) {
  this.calendarManager_.addEvent(newEvent);
  this.events_.push(newEvent);
  this.registerListenersForEvent_(newEvent);
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.addEvent(newEvent);
  });
};

/**
 * Remove an event.
 * Note: Does not check if the event was in selected events.
 * @param {!five.Event} event
 */
five.EventsView.prototype.removeEvent_ = function(event) {
  this.calendarManager_.removeEvent(event);
  var index = this.events_.indexOf(event);
  goog.asserts.assert(index >= 0);
  this.events_.splice(index, 1);
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.removeEvent(event);
  });
};

/**
 * @param {!goog.date.DateTime} time1
 * @param {!goog.date.DateTime} time2
 * @param {boolean} shiftKey
 * @return {!five.Event}
 */
five.EventsView.prototype.createOrUpdateDragCreateEvent = function(
    time1, time2, shiftKey) {
  if (shiftKey) {
    time2 = five.util.roundDurationToThirtyMinutes(time1, time2);
  }
  var timeCompare = goog.date.Date.compare(time1, time2);
  var startTime = timeCompare < 0 ? time1 : time2;
  var endTime = timeCompare < 0 ? time2 : time1;
  if (!this.dragCreateEvent_) {
    this.dragCreateEvent_ = five.Event.createNew(startTime, endTime, '<new>');
    this.addEvent_(this.dragCreateEvent_);
    this.replaceSelectedEvents_([this.dragCreateEvent_]);
  } else {
    this.dragCreateEvent_.addMutation(new five.EventMutation.SetTimeRange(
        startTime, endTime));
    goog.array.forEach(this.columns_, function(column) {
      column.timeline.eventsChanged([this.dragCreateEvent_]);
    }, this);
  }
  return this.dragCreateEvent_;
};

/** @return {boolean} Whether a drag create event was cleared. */
five.EventsView.prototype.cancelDragCreateEvent = function() {
  if (this.dragCreateEvent_) {
    this.replaceSelectedEvents_([]);
    this.removeEvent_(this.dragCreateEvent_);
    delete this.dragCreateEvent_;
    return true;
  }
  return false;
};

five.EventsView.prototype.commitDragCreateEvent = function() {
  if (this.dragCreateEvent_) {
    var event = this.dragCreateEvent_;
    this.openEditEventDialogForCreate_(this.dragCreateEvent_);
    delete this.dragCreateEvent_;
  }
};

/**
 * @param {!goog.date.DateTime} dragStartTime
 * @param {!goog.date.DateTime} dragEndTime
 * @param {!five.EventsView.DragEventsType} dragType
 * @param {boolean} shiftKey
 */
five.EventsView.prototype.startOrUpdateDragEvents = function(
    dragStartTime, dragEndTime, dragType, shiftKey) {
  if (!this.dragEventsStartTime_) {
    this.dragEventsStartTime_ = dragStartTime;
    this.dragEventsLastUpdateTimes_ = goog.array.map(this.selectedEvents_, function(selectedEvent) {
      return dragStartTime;
    });
    this.dragEventsType_ = dragType;
  }
  var mutationConstructor;
  if (this.dragEventsType_ == five.EventsView.DragEventsType.BOTH) {
    mutationConstructor = five.EventMutation.MoveBy;
  } else if (this.dragEventsType_ == five.EventsView.DragEventsType.START) {
    mutationConstructor = five.EventMutation.MoveStartBy;
  } else if (this.dragEventsType_ == five.EventsView.DragEventsType.END) {
    mutationConstructor = five.EventMutation.MoveEndBy;
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent, index) {
    var dragEventsLastUpdateTime = this.dragEventsLastUpdateTimes_[index];
    var eventDragEndTime = dragEndTime;
    if (shiftKey) {
      var dragRelativeTime = new goog.date.DateTime(new Date(
          dragEndTime.getTime() - this.dragEventsStartTime_.getTime()));
      dragRelativeTime = five.util.roundDurationToThirtyMinutes(
          selectedEvent.getStartTime(), dragRelativeTime);
      eventDragEndTime = new goog.date.DateTime(new Date(
          dragRelativeTime.getTime() + this.dragEventsStartTime_.getTime()));
    }
    var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
        five.util.msToSec(eventDragEndTime.getTime() -
            dragEventsLastUpdateTime.getTime()));
    selectedEvent.addMutation(new mutationConstructor(interval));
    this.dragEventsLastUpdateTimes_[index] = eventDragEndTime;
  }, this);
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(this.selectedEvents_);
  }, this);
};

/** @return {boolean} Whether dragging events state was cleared. */
five.EventsView.prototype.cancelDragEvents = function() {
  if (this.dragEventsStartTime_) {
    var mutationConstructor;
    if (this.dragEventsType_ == five.EventsView.DragEventsType.BOTH) {
      mutationConstructor = five.EventMutation.MoveBy;
    } else if (this.dragEventsType_ == five.EventsView.DragEventsType.START) {
      mutationConstructor = five.EventMutation.MoveStartBy;
    } else if (this.dragEventsType_ == five.EventsView.DragEventsType.END) {
      mutationConstructor = five.EventMutation.MoveEndBy;
    }
    goog.array.forEach(this.selectedEvents_, function(selectedEvent, index) {
      var dragEventsLastUpdateTime = this.dragEventsLastUpdateTimes_[index];
      var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
          five.util.msToSec(this.dragEventsStartTime_.getTime() -
          dragEventsLastUpdateTime.getTime()));
      selectedEvent.addMutation(new mutationConstructor(interval));
    }, this);
    goog.array.forEach(this.columns_, function(column) {
      column.timeline.eventsChanged(this.selectedEvents_);
    }, this);
    delete this.dragEventsStartTime_;
    delete this.dragEventsLastUpdateTimes_;
    return true;
  }
  return false;
};

five.EventsView.prototype.commitDragEvents = function() {
  delete this.dragEventsStartTime_;
  delete this.dragEventsLastUpdateTimes_;
};

/** @return {!five.CalendarManager.EventLoadingLock} */
five.EventsView.prototype.createEventLoadingLock = function() {
  return this.calendarManager_.createEventLoadingLock();
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleEventDataChanged_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged([e.target]);
  });
};

/** @param {five.EventMoveEvent} e */
five.EventsView.prototype.handleMoveSelectedEventsCommand_ = function(e) {
  goog.asserts.assertInstanceof(e, five.EventMoveEvent);
  if (!this.selectedEvents_.length) {
    return;
  }
  this.scrollAnchorPreCheck_();
  var mutation;
  if (e.anchor == five.EventMoveEvent.Anchor.BOTH) {
    mutation = new five.EventMutation.MoveBy(
        new goog.date.Interval(goog.date.Interval.MINUTES, e.minutes));
  } else if (e.anchor == five.EventMoveEvent.Anchor.START) {
    mutation = new five.EventMutation.MoveStartBy(
        new goog.date.Interval(goog.date.Interval.MINUTES, e.minutes));
  } else if (e.anchor == five.EventMoveEvent.Anchor.END) {
    mutation = new five.EventMutation.MoveEndBy(
        new goog.date.Interval(goog.date.Interval.MINUTES, e.minutes));
  } else {
    goog.asserts.fail('Unexpected anchor: ' + e.anchor);
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.addMutation(mutation.clone());
  });
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged(this.selectedEvents_);
  }, this);
  this.scrollAnchorPostCheck_();
};

/** @param {five.EventEditEvent} e */
five.EventsView.prototype.handleEventEdit_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  var event = /** @type {!five.Event} */ (e.target);
  if (this.maybeUpgradeFromProposed_(event)) {
    this.openEditEventDialogForCreate_(event);
    return;
  }

  this.openEditEventDialog_(event);
};

/**
 * @param {!five.Event} newEvent
 */
five.EventsView.prototype.openEditEventDialogForCreate_ = function(newEvent) {
  var dialog = this.openEditEventDialog_(newEvent, true);
  this.eventHandler.listen(dialog, five.EditEventDialog.EventType.CANCEL,
      function() {
        this.replaceSelectedEvents_([]);
        this.removeEvent_(newEvent);
      });
};

/**
 * @param {!five.Event} event
 * @param {boolean=} opt_newCreate Whether the editor should indicate that
 *     this is a newly created event.
 * @return {!five.EditEventDialog}
 */
five.EventsView.prototype.openEditEventDialog_ = function(event, opt_newCreate) {
  goog.asserts.assert(this.events_.indexOf(event) >= 0);
  var dialog = new five.EditEventDialog(this.appContext_, event, !!opt_newCreate);
  this.eventEditorEventLoadingLock_.setLocked(true);
  this.eventHandler.
      listen(dialog, five.EditEventDialog.EventType.EVENT_CHANGED,
          this.handleEditEventDialogEventChanged_.bind(this, event)).
      listenOnce(dialog, five.EditEventDialog.EventType.DONE,
          this.handleEditEventDialogDone_.bind(this, event)).
      listenOnce(dialog, five.EditEventDialog.EventType.CANCEL,
          this.handleEditEventDialogCancel_, this);
  dialog.show();
  return dialog;
};

/** @param {!five.Event} event */
five.EventsView.prototype.handleEditEventDialogEventChanged_ = function(event) {
  goog.array.forEach(this.columns_, function(column) {
    column.timeline.eventsChanged([event]);
  });
};

/** @param {!five.Event} event */
five.EventsView.prototype.handleEditEventDialogDone_ = function(event) {
  this.handleEditEventDialogEventChanged_(event);
  this.eventEditorEventLoadingLock_.setLocked(false);
};

five.EventsView.prototype.handleEditEventDialogCancel_ = function() {
  this.eventEditorEventLoadingLock_.setLocked(false);
};

five.EventsView.prototype.registerListenersForCalendarManager_ = function() {
  this.eventHandler.
      listen(this.calendarManager_,
          five.CalendarManager.EventType.MUTATIONS_STATE_CHANGED,
          this.handleCalendarManagerMutationsStateChange_).
      listen(this.calendarManager_,
          five.CalendarManager.EventType.REQUESTS_STATE_CHANGED,
          this.handleCalendarManagerRequestsStateChange_).
      listen(this.calendarManager_,
          five.CalendarManager.EventType.EVENTS_CHANGED,
          this.handleCalendarManagerEventsChange_);
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleCalendarManagerEventsChange_ = function(e) {
  this.events_ = goog.array.clone(this.calendarManager_.getEvents());
  this.proposedEvents_ = [];
  this.selectedEvents_ = [];
  delete this.dragCreateEvent_;
  delete this.dragEventsStartTime_;
  goog.array.forEach(this.events_, function(event) {
    this.registerListenersForEvent_(event);
  }, this);
  this.selectedEventsChanged_();
  this.displayEvents_();
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleCalendarManagerMutationsStateChange_ =
    function(e) {
  var show = this.calendarManager_.hasMutations();
  goog.style.setElementShown(this.saveButton_.el, show);
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleCalendarManagerRequestsStateChange_ =
    function(e) {
  if (this.calendarManager_.hasRequestsInProgress()) {
    goog.asserts.assert(!this.calendarManagerSpinEntry_);
    this.calendarManagerSpinEntry_ = this.appBar_.getSpinner().spin(150);
  } else {
    if (this.calendarManagerSpinEntry_) {
      this.calendarManagerSpinEntry_.release();
      delete this.calendarManagerSpinEntry_;
    }
  }
};

five.EventsView.prototype.handleInitialEventsLoad_ = function() {
  this.scrollToNow_(true);
  this.updateViewDate_();
  this.updateAdditionalTimelineAlignments_();
};

/**
 * @param {number=} opt_index
 * @return {five.EventsView.Column}
 */
five.EventsView.prototype.getColumn_ = function(opt_index) {
  var index = opt_index || 0;
  goog.asserts.assert(index < this.columns_.length);
  return this.columns_[index];
};

/**
 * @param {number} yPos
 * @param {number=} opt_index Optional index of the timeline to use.
 * @return {!goog.date.DateTime}
 */
five.EventsView.prototype.yPosToTime_ = function(yPos, opt_index) {
  var column = this.getColumn_(opt_index);
  return column.timeline.getTimeMap().yPosToTime(yPos - column.yOffset);
};

/**
 * @param {goog.date.DateTime} time
 * @param {number=} opt_index Optional index of the timeline to use.
 * @return {number}
 */
five.EventsView.prototype.timeToYPos_ = function(time, opt_index) {
  var column = this.getColumn_(opt_index);
  return column.timeline.getTimeMap().timeToYPos(time) + column.yOffset;
};

/** @param {boolean=} opt_animate */
five.EventsView.prototype.scrollToNow_ = function(opt_animate) {
  this.scrollToTime(new goog.date.DateTime(), true, opt_animate);
};

/**
 * Scroll to a specified time.  Optionally show context before the time
 * instead of starting exactly at the specified time.
 * @param {goog.date.DateTime} date
 * @param {boolean=} opt_showContext
 * @param {boolean=} opt_animate
 */
five.EventsView.prototype.scrollToTime = function(date,
    opt_showContext, opt_animate) {
  if (!this.columns_.length) {
    return;
  }
  if (opt_showContext) {
    date = this.yPosToTime_(this.timeToYPos_(date) -
        Math.max(100, this.scrollEl_.offsetHeight / 4));
  }

  if (opt_animate) {
    var lastScrollDate = this.yPosToTime_(this.scrollEl_.scrollTop);
    if (this.scrollAnimation_) {
      goog.dispose(this.scrollAnimation_);
    }
    this.scrollAnimation_ = new goog.fx.Animation([lastScrollDate.getTime()],
        [date.getTime()], five.EventsView.SCROLL_ANIMATION_DURATION_MS,
        goog.fx.easing.easeOut);
    var EventType = goog.fx.Transition.EventType;
    this.scrollAnimation_.registerDisposable(new goog.events.EventHandler(this).
        listen(this.scrollAnimation_,
            [goog.fx.Transition.EventType.END, goog.fx.Animation.EventType.ANIMATE],
            function(e) {
      var curTime = new goog.date.DateTime(new Date(Math.round(e.coords[0])));
      this.scrollToTime(curTime);
      lastScrollDate = this.yPosToTime_(this.scrollEl_.scrollTop);
      if (e.type == EventType.END) {
        goog.dispose(this.scrollAnimation_);
        delete this.scrollAnimation_;
      }
    }));
    this.scrollAnimation_.play();
  } else {
    this.scrollEl_.scrollTop = this.timeToYPos_(date);
  }
};

/**
 * Scroll by a specified time interval, relative to a given time.
 * @param {boolean} opt_hideScrollAction Make sure auto-show scroll
 *     bars do not show during this scroll action.
 */
five.EventsView.prototype.scrollByTime = function(relativeToTime,
    interval, opt_hideScrollAction) {
  if (!this.columns_.length) {
    return;
  }
  var toTime = relativeToTime.clone();
  toTime.add(interval);
  var startYPos = this.timeToYPos_(relativeToTime);
  var endYPos = this.timeToYPos_(toTime);

  if (opt_hideScrollAction) {
    // Disable overflow for the scroll event to avoid auto-show scroll bars
    // on some platforms from activating.
    this.scrollEl_.style.overflow = 'hidden';
  }

  this.scrollEl_.scrollTop = this.scrollEl_.scrollTop + (endYPos - startYPos);

  if (opt_hideScrollAction) {
    this.scrollEl_.style.overflow = '';
  }
};

/**
 * Return whether a specified time is within the visible area.
 */
five.EventsView.prototype.isTimeInView = function(date) {
  if (!this.columns_.length) {
    return;
  }
  var yPos = this.timeToYPos_(date);
  if (yPos < this.scrollEl_.scrollTop) {
    return false;
  } else if (yPos > this.scrollEl_.scrollTop + this.scrollEl_.offsetHeight) {
    return false;
  }
  return true;
};

five.EventsView.prototype.handleNowTrackerTick_ = function() {
  var INTERVAL_MS = five.EventsView.NOW_TRACKER_INTERVAL_MS_;
  var now = new goog.date.DateTime();
  this.nowMarker_.setTime(now);
  if (this.isTimeInView(now)) {
    if (this.nowTrackerLastTickTime_) {
      var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
          five.util.msToSec(now.getTime() -
              this.nowTrackerLastTickTime_.getTime()));
      this.scrollByTime(this.nowTrackerLastTickTime_, interval, true);
      this.nowTrackerLastTickTime_.add(interval);
    } else {
      this.nowTrackerLastTickTime_ = now;
    }
  } else {
    delete this.nowTrackerLastTickTime_;
  }

  var nowMs = now.getSeconds() * 1000 + now.getMilliseconds();
  var msUntilTick = (Math.floor(nowMs / INTERVAL_MS)+1) * INTERVAL_MS - nowMs;

  this.nowTrackerTimeoutId_ = window.setTimeout(goog.bind(
      this.handleNowTrackerTick_, this),
      msUntilTick);
};

five.EventsView.prototype.initDefaultViewDate_ = function() {
  this.viewDate_ = new goog.date.DateTime();
  this.viewDate_.setTime(new goog.date.Date().getTime());
};

five.EventsView.prototype.updateViewDate_ = function() {
  if (!this.columns_.length) {
    return;
  }
  var scrollDate = this.yPosToTime_(this.scrollEl_.scrollTop);
  var newViewDate = five.util.dayFloor(scrollDate);
  if (this.viewDate_ && !goog.date.Date.compare(newViewDate, this.viewDate_)) {
    return;
  }
  this.viewDate_ = newViewDate;
  var timelineDate = this.viewDate_.clone();
  goog.array.forEach(this.columns_, function(column) {
    var timelineStartDate = timelineDate.clone();
    timelineStartDate.add(new goog.date.Interval(goog.date.Interval.DAYS, -1));
    var timelineEndDate = timelineStartDate.clone();
    timelineEndDate.add(new goog.date.Interval(goog.date.Interval.DAYS, 3));
    column.timeline.setDateRange(timelineStartDate, timelineEndDate);
    column.dayBanner.setDate(timelineDate);
    timelineDate.add(new goog.date.Interval(goog.date.Interval.DAYS, 1));
  }, this);
  if (!this.scrollAnimation_) {
    this.scrollToTime(scrollDate);
  }
};

/** @param {goog.events.Event=} opt_e */
five.EventsView.prototype.handleRefreshClick_ = function(opt_e) {
  if (opt_e) {
    opt_e.preventDefault();
  }
  this.reloadEvents_(true /* opt_confirmMutations */);
};

/** @param {goog.events.Event=} opt_e */
five.EventsView.prototype.handleNowClick_ = function(opt_e) {
  if (opt_e) {
    opt_e.preventDefault();
  }
  this.scrollToNow_(true);
};

/** @param {goog.events.Event=} opt_e */
five.EventsView.prototype.handleProposeClick_ = function(opt_e) {
  if (opt_e) {
    opt_e.preventDefault();
  }

  var time = five.util.roundToFiveMinutes(new goog.date.DateTime());
  this.proposeEvents_(time);
}

/** @param {!goog.date.DateTime} time */
five.EventsView.prototype.proposeEvents_ = function(time) {
  var selectedEvent = this.selectedEvents_.length == 1 && this.selectedEvents_[0];
  this.replaceSelectedEvents_([]);

  var newProposedEvents = [];

  for (var i = 0; i < 4; i++) {
    var startTime = time.clone();
    var endTime = startTime.clone();
    if (i == 0) {
      endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
    } else if (i == 1 || i == 2) {
      startTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, -5));
    } else if (i == 3) {
      endTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, 60));
    }
    var summary = selectedEvent ? selectedEvent.getSummary() : '<new>';
    var proposedEvent = five.Event.createNew(startTime, endTime, summary);
    if (i == 2) {
      if (!this.snapEvents_([proposedEvent], true, true)) {
        startTime.add(new goog.date.Interval(goog.date.Interval.MINUTES, -55));
        proposedEvent.addMutation(new five.EventMutation.SetTimeRange(
            goog.asserts.assertObject(startTime),
            goog.asserts.assertObject(endTime)));
      }
    }
    proposedEvent.setProposed(true);
    this.addEvent_(proposedEvent);
    newProposedEvents.push(proposedEvent);
  }

  this.replaceProposedEvents_(newProposedEvents);
};

five.EventsView.prototype.proposeRelativeToSelection_ = function(after) {
  if (this.selectedEvents_.length != 1) {
    return;
  }
  var time = after ? this.selectedEvents_[0].getEndTime() :
      this.selectedEvents_[0].getStartTime();
  this.proposeEvents_(time);
};

/** @param {goog.events.Event=} opt_e */
five.EventsView.prototype.handleSaveClick_ = function(opt_e) {
  if (opt_e) {
    opt_e.preventDefault();
  }
  this.replaceSelectedEvents_([]);
  this.calendarManager_.saveMutations();
};

/** @return {boolean} */
five.EventsView.prototype.hasUnsavedChanges = function() {
  return this.calendarManager_.hasMutations();
};

/**
 * Before a display shift that could cause a scroll anchor to move,
 * record current state.
 */
five.EventsView.prototype.scrollAnchorPreCheck_ = function() {
  this.scrollAnchorTimeline_ = null;
  this.scrollAnchorData_ = null;
  for (var i = 0; i < this.columns_.length; i++) {
    var column = this.columns_[i];
    var data = column.timeline.getScrollAnchorData();
    if (data) {
      this.scrollAnchorTimeline_ = column.timeline;
      this.scrollAnchorData_ = data;
      break;
    }
  }
};

/**
 * After a possible display shift, check if any scroll anchors were set.
 */
five.EventsView.prototype.scrollAnchorPostCheck_ = function() {
  if (!this.scrollAnchorTimeline_) {
    return;
  }
  var deltaY = this.scrollAnchorTimeline_.getScrollAnchorDeltaY(
      this.scrollAnchorData_);
  this.scrollEl_.scrollTop = this.scrollEl_.scrollTop + deltaY;
};

/** @return {?string} */
five.EventsView.prototype.getUnloadWarning = function() {
  if (this.calendarManager_.hasMutations()) {
    return 'Some events have not been saved.';
  }
  return null;
};

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.EventsView.Column = function() {
  /** @type {five.EventsTimeline} */
  this.timeline;

  /** @type {number} */
  this.yOffset = five.EventsView.DEFAULT_TIMELINE_Y_OFFSET;

  /** @type {five.DayBanner} */
  this.dayBanner;
};
goog.inherits(five.EventsView.Column, goog.events.EventTarget);

/** @override */
five.EventsView.Column.prototype.disposeInternal = function() {
  goog.dispose(this.timeline);
  goog.dispose(this.dayBanner);
  goog.base(this, 'disposeInternal');
};
