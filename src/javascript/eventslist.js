// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsList');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('five.EventsScrollBox');
goog.require('five.Spinner');
goog.require('five.TimeMarker');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');


/**
 * @param calendarApi {five.CalendarApi}
 * @param calendar {Object}
 * @constructor
 * @extends {five.Component}
 */
five.EventsList = function(calendarApi, calendar) {
  goog.base(this);

  /** @type {five.CalendarApi} */
  this.calendarApi_ = calendarApi;

  /** @type {Object} */
  this.calendar_ = calendar;

  /** @type {five.EventsScrollBox} */
  this.eventsScrollBox_ = new five.EventsScrollBox();
  this.registerDisposable(this.eventsScrollBox_);

  /** @type {five.Spinner} */
  this.spinner_ = new five.Spinner();
  this.registerDisposable(this.spinner_);

  /** @type {Array.<five.Event>} */
  this.selectedEvents_ = [];

  this.initDefaultDateRange_();
};
goog.inherits(five.EventsList, five.Component);

/** @type {number} */
five.EventsList.NOW_TRACKER_INTERVAL_ = 15 * 1000;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.endDate_;

/** @type {Element} */
five.EventsList.prototype.headerEl_;

/** @type {Array.<five.Event>} */
five.EventsList.prototype.events_;

/** @type {five.TimeMarker} */
five.EventsList.prototype.nowMarker_;

/** @type {goog.date.DateTime} */
five.EventsList.prototype.nowTrackerLastTickTime_;

/** @type {number} */
five.EventsList.prototype.nowTrackerIntervalId_;

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

  this.spinner_.render(this.headerEl_);

  var titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.appendChild(document.createTextNode(
      'Calendar ' + this.calendar_['summary']));
  this.headerEl_.appendChild(titleEl);
};

five.EventsList.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  this.createDom();

  parentEl.appendChild(this.el);

  this.eventsScrollBox_.setDateRange(this.startDate_, this.endDate_);
  this.eventsScrollBox_.render(this.el);

  this.nowMarker_ = new five.TimeMarker(new goog.date.DateTime());
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
  var spinEntry = this.spinner_.spin(150);
  return this.calendarApi_.loadEvents(this.calendar_['id'], this.startDate_,
      this.endDate_).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#events');
        this.updateEventsData_(resp['items'] || []);
        spinEntry.release();
      }, this);
};

/** @param {Array.<Object>} eventsData */
five.EventsList.prototype.updateEventsData_ = function(eventsData) {
  goog.disposeAll(this.events_);
  this.selectedEvents_ = [];
  this.events_ = goog.array.map(eventsData, function(eventData) {
    var event = new five.Event(eventData);
    this.registerListenersForEvent_(event);
    return event;
  }, this);
  this.displayEvents_();
};

five.EventsList.prototype.displayEvents_ = function() {
  this.eventsScrollBox_.setEvents(this.events_);
};

/** @param {five.Event} event */
five.EventsList.prototype.registerListenersForEvent_ = function(event) {
  var EventType = five.Event.EventType;
  this.eventHandler.listen(event, [EventType.SELECT, EventType.DESELECT],
      this.handleEventToggleSelect_);
  this.eventHandler.listen(event, [EventType.MOVE_UP, EventType.MOVE_DOWN],
      this.handleMoveSelectedEventsCommand_);
};

five.EventsList.prototype.clearSelectedEvents_ = function() {
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.setSelected(false);
  });
  this.selectedEvents_ = [];
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleEventToggleSelect_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
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
    this.clearSelectedEvents_();
    if (e.type == five.Event.EventType.SELECT) {
      e.target.setSelected(true);
      this.selectedEvents_ = [e.target];
    }
  }
};

/** @param {goog.events.Event} e */
five.EventsList.prototype.handleMoveSelectedEventsCommand_ = function(e) {
  goog.asserts.assertInstanceof(e.target, five.Event);
  goog.asserts.assert(this.events_.indexOf(e.target) >= 0);
  goog.asserts.assert(this.selectedEvents_.length);
  var mutation;
  if (e.type == five.Event.EventType.MOVE_DOWN) {
    mutation = new five.EventMutation.MoveBy(
        new goog.date.Interval(goog.date.Interval.MINUTES, 5));
  } else if (e.type == five.Event.EventType.MOVE_UP) {
    mutation = new five.EventMutation.MoveBy(
        new goog.date.Interval(goog.date.Interval.MINUTES, -5));
  } else {
    goog.asserts.fail('Unexpected type: ' + e.type);
  }
  goog.array.forEach(this.selectedEvents_, function(selectedEvent) {
    selectedEvent.addMutation(mutation);
  });
  this.eventsScrollBox_.eventsChanged(this.selectedEvents_);
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
