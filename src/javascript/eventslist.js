// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsList');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('five.EventsScrollBox');
goog.require('five.Spinner');
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
five.EventsList = function(calendarManager) {
  goog.base(this);

  /** @type {five.CalendarManager} */
  this.calendarManager_ = calendarManager;

  /** @type {five.EventsScrollBox} */
  this.eventsScrollBox_ = new five.EventsScrollBox();
  this.registerDisposable(this.eventsScrollBox_);

  /** @type {five.Spinner} */
  this.spinner_ = new five.Spinner();
  this.registerDisposable(this.spinner_);

  /** @type {!Array.<!five.Event>} */
  this.selectedEvents_ = [];

  this.initDefaultDateRange_();

  this.registerListenersForCalendarManager_();
};
goog.inherits(five.EventsList, five.Component);

/** @type {number} */
five.EventsList.NOW_TRACKER_INTERVAL_ = 15 * 1000;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.endDate_;

/** @type {Array.<!five.Event>} */
five.EventsList.prototype.events_;

/** @type {Element} */
five.EventsList.prototype.headerEl_;

/** @type {Element} */
five.EventsList.prototype.saveEl_;

/** @type {five.TimeMarker} */
five.EventsList.prototype.nowMarker_;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.nowTrackerLastTickTime_;

/** @type {number} */
five.EventsList.prototype.nowTrackerIntervalId_;

/** @type {five.Spinner.Entry} */
five.EventsList.prototype.calendarManagerSpinEntry_;

five.EventsList.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'events-list');

  this.headerEl_ = document.createElement('div');
  this.headerEl_.className = 'header';
  this.el.appendChild(this.headerEl_);

  var refreshEl = document.createElement('div');
  refreshEl.className = 'button';
  refreshEl.appendChild(document.createTextNode('Refresh'));
  this.eventHandler.listen(refreshEl, goog.events.EventType.CLICK,
      this.handleRefreshClick_);
  this.headerEl_.appendChild(refreshEl);

  var nowEl = document.createElement('div');
  nowEl.className = 'button';
  nowEl.appendChild(document.createTextNode('Now'));
  this.eventHandler.listen(nowEl, goog.events.EventType.CLICK,
      this.handleNowClick_);
  this.headerEl_.appendChild(nowEl);

  this.saveEl_ = document.createElement('div');
  this.saveEl_.className = 'button';
  goog.style.showElement(this.saveEl_, false);
  this.saveEl_.appendChild(document.createTextNode('Save'));
  this.eventHandler.listen(this.saveEl_, goog.events.EventType.CLICK,
      this.handleSaveClick_);
  this.headerEl_.appendChild(this.saveEl_);

  this.spinner_.render(this.headerEl_);

  var titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.appendChild(document.createTextNode(
      'Calendar ' + this.calendarManager_.getCalendarSummary()));
  this.headerEl_.appendChild(titleEl);

  this.registerListenersForScrollBox_();
};

five.EventsList.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  this.createDom();

  parentEl.appendChild(this.el);

  this.eventsScrollBox_.setDateRange(this.startDate_, this.endDate_);
  this.eventsScrollBox_.render(this.el);

  this.nowMarker_ = new five.TimeMarker(new goog.date.DateTime(),
      five.TimeMarkerTheme.NOW);
  this.eventsScrollBox_.addTimeMarker(this.nowMarker_);

  if (!this.events_) {
    this.loadEvents_().addCallback(function() {this.scrollToNow_(); }, this);
  }

  if (!this.nowTrackerIntervalId_) {
    this.nowTrackerIntervalId_ = window.setInterval(goog.bind(
        this.handleNowTrackerTick_, this),
        five.EventsList.NOW_TRACKER_INTERVAL_);
  }
};

five.EventsList.prototype.resize = function(opt_width, opt_height) {
  var height = opt_height || this.el.parentNode.offsetHeight;
  var headerHeight = this.headerEl_.offsetHeight;

  this.eventsScrollBox_.resize(undefined, Math.max(50, height - headerHeight));
};

/** @override */
five.EventsList.prototype.disposeInternal = function() {
  if (this.nowTrackerIntervalId_) {
    window.clearInterval(this.nowTrackerIntervalId_);
    delete this.nowTrackerIntervalId_;
  }
  goog.disposeAll(this.events_);
  goog.base(this, 'disposeInternal');
};

five.EventsList.prototype.loadEvents_ = function() {
  return this.calendarManager_.loadEvents(this.startDate_, this.endDate_);
};

five.EventsList.prototype.displayEvents_ = function() {
  this.eventsScrollBox_.setEvents(goog.asserts.assertArray(this.events_));
};

five.EventsList.prototype.selectedEventsChanged_ = function() {
  this.eventsScrollBox_.setSelectedEvents(this.selectedEvents_);
};

/** @param {five.Event} event */
five.EventsList.prototype.registerListenersForEvent_ = function(event) {
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

five.EventsList.prototype.startBatchRenderUpdate_ = function() {
  this.eventsScrollBox_.startBatchUpdate();
};

five.EventsList.prototype.finishBatchRenderUpdate_ = function() {
  this.eventsScrollBox_.finishBatchUpdate();
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleEventToggleSelect_ = function(e) {
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

five.EventsList.prototype.registerListenersForScrollBox_ = function() {
  var EventType = five.EventsScrollBox.EventType;
  this.eventHandler.
      listen(this.eventsScrollBox_, EventType.DESELECT,
          this.handleEventsScrollBoxDeselect_).
      listen(this.eventsScrollBox_, EventType.EVENTS_MOVE,
          this.handleEventsScrollBoxEventsMove_).
      listen(this.eventsScrollBox_, EventType.EVENTS_DUPLICATE,
          this.handleEventsScrollBoxEventsDuplicate_);
};

five.EventsList.prototype.handleEventsScrollBoxDeselect_ = function() {
  this.startBatchRenderUpdate_();
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.setSelected(false);
  });
  this.selectedEvents_ = [];
  this.selectedEventsChanged_();
  this.finishBatchRenderUpdate_();
};

/** @param {five.EventMoveEvent} e */
five.EventsList.prototype.handleEventsScrollBoxEventsMove_ = function(e) {
  this.handleMoveSelectedEventsCommand_(e);
};

five.EventsList.prototype.handleEventsScrollBoxEventsDuplicate_ = function() {
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
five.EventsList.prototype.addEvent_ = function(newEvent) {
  this.calendarManager_.addEvent(newEvent);
  this.events_.push(newEvent);
  this.registerListenersForEvent_(newEvent);
  this.eventsScrollBox_.addEvent(newEvent);
};


/** @param {goog.events.Event} e */
five.EventsList.prototype.handleEventDataChanged_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  this.eventsScrollBox_.eventsChanged([e.target]);
};

/** @param {five.EventMoveEvent} e */
five.EventsList.prototype.handleMoveSelectedEventsCommand_ = function(e) {
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
  this.eventsScrollBox_.eventsChanged(this.selectedEvents_);
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleEventEditSummary_ = function(e) {
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
  this.eventsScrollBox_.eventsChanged([event]);
}

five.EventsList.prototype.registerListenersForCalendarManager_ = function() {
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
five.EventsList.prototype.handleCalendarManagerEventsChange_ = function(e) {
  this.events_ = goog.array.clone(this.calendarManager_.getEvents());
  this.selectedEvents_ = [];
  goog.array.forEach(this.events_, function(event) {
    this.registerListenersForEvent_(event);
  }, this);
  this.selectedEventsChanged_();
  this.displayEvents_();
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleCalendarManagerMutationsStateChange_ =
    function(e) {
  goog.style.showElement(this.saveEl_, this.calendarManager_.hasMutations());
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleCalendarManagerRequestsStateChange_ =
    function(e) {
  if (this.calendarManager_.hasRequestsInProgress()) {
    goog.asserts.assert(!this.calendarManagerSpinEntry_);
    this.calendarManagerSpinEntry_ = this.spinner_.spin(150);
  } else {
    if (this.calendarManagerSpinEntry_) {
      this.calendarManagerSpinEntry_.release();
      delete this.calendarManagerSpinEntry_;
    }
  }
};

five.EventsList.prototype.scrollToNow_ = function(opt_animate) {
  this.eventsScrollBox_.scrollToTime(new goog.date.DateTime(), true,
      opt_animate);
};

five.EventsList.prototype.handleNowTrackerTick_ = function() {
  var now = new goog.date.DateTime();
  this.nowMarker_.setTime(now);
  if (this.eventsScrollBox_.isTimeInView(now)) {
    if (this.nowTrackerLastTickTime_) {
      var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
          five.util.msToSec(now.getTime() -
              this.nowTrackerLastTickTime_.getTime()));
      this.eventsScrollBox_.scrollByTime(
          this.nowTrackerLastTickTime_, interval, true);
      this.nowTrackerLastTickTime_.add(interval);
    } else {
      this.nowTrackerLastTickTime_ = now;
    }
  } else {
    delete this.nowTrackerLastTickTime_;
  }
};

five.EventsList.prototype.initDefaultDateRange_ = function() {
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
five.EventsList.prototype.handleRefreshClick_ = function(e) {
  e.preventDefault();
  this.loadEvents_();
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleNowClick_ = function(e) {
  e.preventDefault();
  this.scrollToNow_(true);
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleSaveClick_ = function(e) {
  e.preventDefault();
  this.calendarManager_.saveMutations();
};
