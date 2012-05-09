// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventsList');

goog.require('fivemins.EventsScrollBox');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');

/**
 * @param calendarApi {fivemins.CalendarApi}
 * @param calendar {Object}
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.EventsList = function(calendarApi, calendar) {
  /** @type {fivemins.CalendarApi} */
  this.calendarApi_ = calendarApi;

  /** @type {Object} */
  this.calendar_ = calendar;

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);

  /** @type {fivemins.EventsScrollBox} */
  this.eventsScrollBox_ = new fivemins.EventsScrollBox();

  this.initDefaultDateRange_();
};
goog.inherits(fivemins.EventsList, goog.events.EventTarget);

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.startDate_;

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.endDate_;

/** @type {Element} */
fivemins.EventsList.prototype.el_;

/** @type {Array.<Object>} */
fivemins.EventsList.prototype.events_;

fivemins.EventsList.prototype.render = function() {
  goog.asserts.assert(!this.el_);
  this.el_ = document.createElement('div');
  this.el_.className = 'events-list';
  var headerEl = document.createElement('div');
  headerEl.className = 'title';
  headerEl.appendChild(document.createTextNode(
      'Calendar ' + this.calendar_['summary']));
  this.el_.appendChild(headerEl);
  this.eventsScrollBox_.setDateRange(this.startDate_, this.endDate_);
  this.eventsScrollBox_.render(this.el_);
  document.body.appendChild(this.el_);

  if (!this.events_) {
    this.loadEvents_();
  }
};

fivemins.EventsList.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el_);
  delete this.el_;
  goog.dispose(this.eventsScrollBox_);
  goog.dispose(this.eventHandler_);
  goog.base(this, 'disposeInternal');
};

fivemins.EventsList.prototype.loadEvents_ = function() {
  this.calendarApi_.loadEvents(this.calendar_['id'], this.startDate_,
      this.endDate_).
      addCallback(function(resp) {
        this.events_ = resp['items'];
        this.displayEvents_();
      }, this);
};

fivemins.EventsList.prototype.displayEvents_ = function() {
  this.eventsScrollBox_.setEvents(this.events_);
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
