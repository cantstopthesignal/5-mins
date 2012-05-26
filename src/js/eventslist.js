// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventsList');

goog.require('fivemins.Component');
goog.require('fivemins.EventsScrollBox');
goog.require('fivemins.Spinner');
goog.require('fivemins.TimeMarker');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * @param calendarApi {fivemins.CalendarApi}
 * @param calendar {Object}
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.EventsList = function(calendarApi, calendar) {
  goog.base(this);

  /** @type {fivemins.CalendarApi} */
  this.calendarApi_ = calendarApi;

  /** @type {Object} */
  this.calendar_ = calendar;

  /** @type {fivemins.EventsScrollBox} */
  this.eventsScrollBox_ = new fivemins.EventsScrollBox();
  this.registerDisposable(this.eventsScrollBox_);

  /** @type {fivemins.Spinner} */
  this.spinner_ = new fivemins.Spinner();
  this.registerDisposable(this.spinner_);

  this.initDefaultDateRange_();
};
goog.inherits(fivemins.EventsList, fivemins.Component);

/** @type {number} */
fivemins.EventsList.NOW_TRACKER_INTERVAL_ = 15 * 1000;

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.startDate_;

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.endDate_;

/** @type {Element} */
fivemins.EventsList.prototype.headerEl_;

/** @type {Array.<Object>} */
fivemins.EventsList.prototype.events_;

/** @type {fivemins.TimeMarker} */
fivemins.EventsList.prototype.nowMarker_;

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.nowTrackerLastTickTime_;

/** @type {number} */
fivemins.EventsList.prototype.nowTrackerIntervalId_;

fivemins.EventsList.prototype.createDom = function() {
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

  this.spinner_.render(this.headerEl_);

  var titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.appendChild(document.createTextNode(
      'Calendar ' + this.calendar_['summary']));
  this.headerEl_.appendChild(titleEl);
};

fivemins.EventsList.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  this.createDom();

  parentEl.appendChild(this.el);

  this.eventsScrollBox_.setDateRange(this.startDate_, this.endDate_);
  this.eventsScrollBox_.render(this.el);

  this.nowMarker_ = new fivemins.TimeMarker(new goog.date.DateTime());
  this.eventsScrollBox_.addTimeMarker(this.nowMarker_);

  if (!this.events_) {
    this.loadEvents_().addCallback(this.scrollToNow_, this);
  }

  if (!this.nowTrackerIntervalId_) {
    this.nowTrackerIntervalId_ = window.setInterval(goog.bind(
        this.handleNowTrackerTick_, this),
        fivemins.EventsList.NOW_TRACKER_INTERVAL_);
  }
};

fivemins.EventsList.prototype.resize = function(opt_width, opt_height) {
  var height = opt_height || this.el.parentNode.offsetHeight;
  var headerHeight = this.headerEl_.offsetHeight;

  this.eventsScrollBox_.resize(undefined, Math.max(50, height - headerHeight));
};

fivemins.EventsList.prototype.disposeInternal = function() {
  if (this.nowTrackerIntervalId_) {
    window.clearInterval(this.nowTrackerIntervalId_);
    delete this.nowTrackerIntervalId_;
  }
  goog.base(this, 'disposeInternal');
};

fivemins.EventsList.prototype.loadEvents_ = function() {
  var spinEntry = this.spinner_.spin(150);
  return this.calendarApi_.loadEvents(this.calendar_['id'], this.startDate_,
      this.endDate_).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#events');
        this.events_ = resp['items'] || [];
        this.displayEvents_();
        spinEntry.release();
      }, this);
};

fivemins.EventsList.prototype.displayEvents_ = function() {
  this.eventsScrollBox_.setEvents(this.events_);
};

fivemins.EventsList.prototype.scrollToNow_ = function() {
  this.eventsScrollBox_.scrollToTime(new goog.date.DateTime(), true);
};

fivemins.EventsList.prototype.handleNowTrackerTick_ = function() {
  var now = new goog.date.DateTime();
  this.nowMarker_.setTime(now);
  if (this.eventsScrollBox_.isTimeInView(now)) {
    if (this.nowTrackerLastTickTime_) {
      var interval = new goog.date.Interval(goog.date.Interval.SECONDS,
          fivemins.util.msToSec(now.getTime() -
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

fivemins.EventsList.prototype.initDefaultDateRange_ = function() {
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
fivemins.EventsList.prototype.handleRefreshClick_ = function(e) {
  e.preventDefault();
  this.loadEvents_();
};
