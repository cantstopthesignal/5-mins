// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventsList');

goog.require('fivemins.Component');
goog.require('fivemins.EventsScrollBox');
goog.require('fivemins.Spinner');
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

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.startDate_;

/** @type {goog.date.DateTime} */
fivemins.EventsList.prototype.endDate_;

/** @type {Element} */
fivemins.EventsList.prototype.headerEl_;

/** @type {Array.<Object>} */
fivemins.EventsList.prototype.events_;

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

  if (!this.events_) {
    this.loadEvents_().addCallback(this.scrollToNow_, this);
  }
};

fivemins.EventsList.prototype.resize = function(opt_width, opt_height) {
  var height = opt_height || this.el.parentNode.offsetHeight;
  var headerHeight = this.headerEl_.offsetHeight;

  this.eventsScrollBox_.resize(undefined, Math.max(50, height - headerHeight));
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
