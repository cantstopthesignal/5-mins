// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsView');

goog.require('five.Button');
goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('five.EventsTimeline');
goog.require('five.TimeMarker');
goog.require('five.TimeMarkerTheme');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');


/**
 * @param calendarManager {five.CalendarManager}
 * @constructor
 * @extends {five.Component}
 */
five.EventsView = function(calendarManager, appBar) {
  goog.base(this);

  /** @type {five.CalendarManager} */
  this.calendarManager_ = calendarManager;

  /** @type {five.AppBar} */
  this.appBar_ = appBar;

  /** @type {five.EventsTimeline} */
  this.eventsTimeline_ = new five.EventsTimeline();
  this.registerDisposable(this.eventsTimeline_);

  /** @type {!Array.<!five.Event>} */
  this.selectedEvents_ = [];

  this.initDefaultDateRange_();

  this.registerListenersForCalendarManager_();
};
goog.inherits(five.EventsView, five.Component);

/** @type {number} */
five.EventsView.NOW_TRACKER_INTERVAL_ = 15 * 1000;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.endDate_;

/** @type {Array.<!five.Event>} */
five.EventsView.prototype.events_;

/** @type {five.Button} */
five.EventsView.prototype.saveButton_;

/** @type {five.TimeMarker} */
five.EventsView.prototype.nowMarker_;

/** @type {goog.date.DateTime} */
five.EventsView.prototype.nowTrackerLastTickTime_;

/** @type {number} */
five.EventsView.prototype.nowTrackerIntervalId_;

/** @type {five.Spinner.Entry} */
five.EventsView.prototype.calendarManagerSpinEntry_;

five.EventsView.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'events-view');

  var refreshButton = new five.Button('Refresh');
  this.appBar_.getButtonBar().addButton(refreshButton);
  this.eventHandler.listen(refreshButton.el, goog.events.EventType.CLICK,
      this.handleRefreshClick_);

  var nowButton = new five.Button('Now');
  this.appBar_.getButtonBar().addButton(nowButton);
  this.eventHandler.listen(nowButton.el, goog.events.EventType.CLICK,
      this.handleNowClick_);

  this.saveButton_ = new five.Button('Save');
  this.appBar_.getButtonBar().addButton(this.saveButton_);
  this.eventHandler.listen(this.saveButton_.el, goog.events.EventType.CLICK,
      this.handleSaveClick_);
  goog.style.showElement(this.saveButton_.el, false);

  this.registerListenersForTimeline_();
};

five.EventsView.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  this.createDom();

  parentEl.appendChild(this.el);

  this.eventsTimeline_.setDateRange(this.startDate_, this.endDate_);
  this.eventsTimeline_.render(this.el);

  this.nowMarker_ = new five.TimeMarker(new goog.date.DateTime(),
      five.TimeMarkerTheme.NOW);
  this.eventsTimeline_.addTimeMarker(this.nowMarker_);

  if (!this.events_) {
    this.loadEvents_().addCallback(function() {this.scrollToNow_(); }, this);
  }

  if (!this.nowTrackerIntervalId_) {
    this.nowTrackerIntervalId_ = window.setInterval(goog.bind(
        this.handleNowTrackerTick_, this),
        five.EventsView.NOW_TRACKER_INTERVAL_);
  }
};

five.EventsView.prototype.resize = function(opt_width, opt_height) {
  var height = opt_height || this.el.parentNode.offsetHeight;
  this.eventsTimeline_.resize(undefined, Math.max(50, height));
};

/** @override */
five.EventsView.prototype.disposeInternal = function() {
  if (this.nowTrackerIntervalId_) {
    window.clearInterval(this.nowTrackerIntervalId_);
    delete this.nowTrackerIntervalId_;
  }
  goog.disposeAll(this.events_);
  goog.base(this, 'disposeInternal');
};

five.EventsView.prototype.loadEvents_ = function() {
  return this.calendarManager_.loadEvents(this.startDate_, this.endDate_);
};

five.EventsView.prototype.displayEvents_ = function() {
  this.eventsTimeline_.setEvents(goog.asserts.assertArray(this.events_));
};

five.EventsView.prototype.selectedEventsChanged_ = function() {
  this.eventsTimeline_.setSelectedEvents(this.selectedEvents_);
};

/** @param {five.Event} event */
five.EventsView.prototype.registerListenersForEvent_ = function(event) {
  var EventType = five.Event.EventType;
  this.eventHandler.
      listen(event, [EventType.SELECT, EventType.DESELECT],
          this.handleEventToggleSelect_).
      listen(event, [EventType.EDIT_SUMMARY],
          this.handleEventEditSummary_).
      listen(event, [EventType.MOVE],
          this.handleMoveSelectedEventsCommand_).
      listen(event, [EventType.DATA_CHANGED],
          this.handleEventDataChanged_);
};

five.EventsView.prototype.startBatchRenderUpdate_ = function() {
  this.eventsTimeline_.startBatchUpdate();
};

five.EventsView.prototype.finishBatchRenderUpdate_ = function() {
  this.eventsTimeline_.finishBatchUpdate();
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleEventToggleSelect_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  this.startBatchRenderUpdate_();
  if (e.shiftKey) {
    var existingIndex = this.selectedEvents_.indexOf(e.target);
    if (e.type == five.Event.EventType.SELECT) {
      goog.asserts.assert(existingIndex < 0);
      e.target.setSelected(true);
      this.selectedEvents_.push(e.target);
    } else if (e.type == five.Event.EventType.DESELECT) {
      goog.asserts.assert(existingIndex >= 0);
      e.target.setSelected(false);
      this.selectedEvents_.splice(existingIndex, 1);
    } else {
      goog.asserts.fail('Type unexpected: ' + e.type);
    }
  } else {
    goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
      selectedEvent.setSelected(false);
    });
    this.selectedEvents_ = [];
    if (e.type == five.Event.EventType.SELECT) {
      e.target.setSelected(true);
      this.selectedEvents_ = [e.target];
    }
  }
  this.selectedEventsChanged_();
  this.finishBatchRenderUpdate_();
};

five.EventsView.prototype.registerListenersForTimeline_ = function() {
  var EventType = five.EventsTimeline.EventType;
  this.eventHandler.
      listen(this.eventsTimeline_, EventType.DESELECT,
          this.handleEventsTimelineDeselect_).
      listen(this.eventsTimeline_, EventType.EVENTS_MOVE,
          this.handleEventsTimelineEventsMove_).
      listen(this.eventsTimeline_, EventType.EVENTS_DUPLICATE,
          this.handleEventsTimelineEventsDuplicate_);
};

five.EventsView.prototype.handleEventsTimelineDeselect_ = function() {
  this.startBatchRenderUpdate_();
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.setSelected(false);
  });
  this.selectedEvents_ = [];
  this.selectedEventsChanged_();
  this.finishBatchRenderUpdate_();
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
  goog.array.forEach(this.selectedEvents_, function(event) {
    var newEvent = event.duplicate();
    this.addEvent_(newEvent);
  }, this);
  this.finishBatchRenderUpdate_();
};

/** @param {!five.Event} newEvent */
five.EventsView.prototype.addEvent_ = function(newEvent) {
  this.calendarManager_.addEvent(newEvent);
  this.events_.push(newEvent);
  this.registerListenersForEvent_(newEvent);
  this.eventsTimeline_.addEvent(newEvent);
};


/** @param {goog.events.Event} e */
five.EventsView.prototype.handleEventDataChanged_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  this.eventsTimeline_.eventsChanged([e.target]);
};

/** @param {five.EventMoveEvent} e */
five.EventsView.prototype.handleMoveSelectedEventsCommand_ = function(e) {
  goog.asserts.assertInstanceof(e, five.EventMoveEvent);
  if (!this.selectedEvents_.length) {
    return;
  }
  var mutation;
  if (e.anchor == five.EventMoveEvent.Anchor.BOTH) {
    goog.asserts.assert(e.dir);
    if (e.dir == five.EventMoveEvent.Dir.EARLIER) {
      mutation = new five.EventMutation.MoveBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, -5));
    } else if (e.dir == five.EventMoveEvent.Dir.LATER) {
      mutation = new five.EventMutation.MoveBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, 5));
    } else {
      goog.asserts.fail('Unexpected dir: ' + e.dir);
    }
  } else if (e.anchor == five.EventMoveEvent.Anchor.START) {
    goog.asserts.assert(e.dir);
    if (e.dir == five.EventMoveEvent.Dir.EARLIER) {
      mutation = new five.EventMutation.MoveStartBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, -5));
    } else if (e.dir == five.EventMoveEvent.Dir.LATER) {
      mutation = new five.EventMutation.MoveStartBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, 5));
    } else {
      goog.asserts.fail('Unexpected dir: ' + e.dir);
    }
  } else if (e.anchor == five.EventMoveEvent.Anchor.END) {
    goog.asserts.assert(e.dir);
    if (e.dir == five.EventMoveEvent.Dir.EARLIER) {
      mutation = new five.EventMutation.MoveEndBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, -5));
    } else if (e.dir == five.EventMoveEvent.Dir.LATER) {
      mutation = new five.EventMutation.MoveEndBy(
          new goog.date.Interval(goog.date.Interval.MINUTES, 5));
    } else {
      goog.asserts.fail('Unexpected dir: ' + e.dir);
    }
  } else {
    goog.asserts.fail('Unexpected anchor: ' + e.anchor);
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.addMutation(mutation.clone());
  });
  this.eventsTimeline_.eventsChanged(this.selectedEvents_);
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleEventEditSummary_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  var event = /** @type {!five.Event} */ (e.target);
  var newSummary = window.prompt("Choose a new title for event '" +
      event.getSummary() + "'", event.getSummary());
  newSummary ? newSummary.trim() : null;
  if (!newSummary) {
    return;
  }
  event.addMutation(new five.EventMutation.ChangeSummary(newSummary));
  this.eventsTimeline_.eventsChanged([event]);
}

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
  this.selectedEvents_ = [];
  goog.array.forEach(this.events_, function(event) {
    this.registerListenersForEvent_(event);
  }, this);
  this.selectedEventsChanged_();
  this.displayEvents_();
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleCalendarManagerMutationsStateChange_ =
    function(e) {
  goog.style.showElement(this.saveButton_.el,
      this.calendarManager_.hasMutations());
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

five.EventsView.prototype.scrollToNow_ = function(opt_animate) {
  this.eventsTimeline_.scrollToTime(new goog.date.DateTime(), true,
      opt_animate);
};

five.EventsView.prototype.handleNowTrackerTick_ = function() {
  var now = new goog.date.DateTime();
  this.nowMarker_.setTime(now);
  if (this.eventsTimeline_.isTimeInView(now)) {
    if (this.nowTrackerLastTickTime_) {
      var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
          five.util.msToSec(now.getTime() -
              this.nowTrackerLastTickTime_.getTime()));
      this.eventsTimeline_.scrollByTime(
          this.nowTrackerLastTickTime_, interval, true);
      this.nowTrackerLastTickTime_.add(interval);
    } else {
      this.nowTrackerLastTickTime_ = now;
    }
  } else {
    delete this.nowTrackerLastTickTime_;
  }
};

five.EventsView.prototype.initDefaultDateRange_ = function() {
  var yesterday = new goog.date.Date();
  yesterday.add(new goog.date.Interval(goog.date.Interval.DAYS, -1));
  this.startDate_ = new goog.date.DateTime();
  this.startDate_.setTime(yesterday.getTime());

  var fourDaysPast = yesterday.clone();
  fourDaysPast.add(new goog.date.Interval(goog.date.Interval.DAYS, 5));
  this.endDate_ = new goog.date.DateTime();
  this.endDate_.setTime(fourDaysPast.getTime());
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleRefreshClick_ = function(e) {
  e.preventDefault();
  this.loadEvents_();
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleNowClick_ = function(e) {
  e.preventDefault();
  this.scrollToNow_(true);
};

/** @param {goog.events.Event} e */
five.EventsView.prototype.handleSaveClick_ = function(e) {
  e.preventDefault();
  this.calendarManager_.saveMutations();
};
