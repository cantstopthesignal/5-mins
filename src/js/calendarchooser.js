// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.CalendarChooser');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.net.Cookies');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.CalendarChooser = function(listResp) {
  this.listResp_ = listResp;

  /** @type {goog.net.Cookies} */
  this.cookies_ = new goog.net.Cookies(document);

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);

  /** @type {goog.async.Deferred} */
  this.choiceDeferred_ = new goog.async.Deferred();
};
goog.inherits(fivemins.CalendarChooser, goog.events.EventTarget);

fivemins.CalendarChooser.FIVEMINS_CALENDAR_COOKIE = "FIVEMINS_CALENDAR";

fivemins.CalendarChooser.FIVEMINS_CALENDAR_COOKIE_MAX_AGE = -1;

/** @type {Element} */
fivemins.CalendarChooser.prototype.el_;

/** @type {string} */
fivemins.CalendarChooser.prototype.calendarId_;

fivemins.CalendarChooser.prototype.chooseCalendar = function() {
  if (!this.choiceDeferred_.hasFired()) {
    this.maybeChooseCalendarFromCookie_();
  }
  if (!this.choiceDeferred_.hasFired()) {
    this.showChooserUi_();
  }
  return this.choiceDeferred_;
};

fivemins.CalendarChooser.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el_);
  delete this.el_;
  goog.dispose(this.eventHandler_);
  goog.base(this, 'disposeInternal');
};

fivemins.CalendarChooser.prototype.fireCalendarChoice_ = function(calendarId) {
  goog.asserts.assert(!this.choiceDeferred_.hasFired());
  var calendar = this.getCalendarById_(calendarId);
  goog.asserts.assert(calendar);
  this.choiceDeferred_.callback(calendar);
}

fivemins.CalendarChooser.prototype.showChooserUi_ = function() {
  goog.asserts.assert(!this.el_);
  this.el_ = document.createElement('div');
  this.el_.className = 'calendar-chooser';
  var headerEl = document.createElement('div');
  headerEl.className = 'title';
  headerEl.appendChild(document.createTextNode('Choose a calendar'));
  this.el_.appendChild(headerEl);
  var ownedCalendars = this.getOwnedCalendars_();
  for (var i = 0; i < ownedCalendars.length; i++) {
    var ownedCalendar = ownedCalendars[i];
    var calendarEl = document.createElement('div');
    calendarEl.className = 'calendar-entry';
    this.eventHandler_.listen(calendarEl, goog.events.EventType.CLICK,
        goog.partial(this.handleCalendarClick_, ownedCalendar['id']));
    var calendarNameEl = document.createTextNode(ownedCalendar['summary']);
    calendarEl.appendChild(calendarNameEl);
    this.el_.appendChild(calendarEl);
  }
  document.body.appendChild(this.el_);
};

fivemins.CalendarChooser.prototype.handleCalendarClick_ = function(calendarId) {
  this.setCalendarChoiceCookie_(calendarId);
  this.fireCalendarChoice_(calendarId);
};

fivemins.CalendarChooser.prototype.setCalendarChoiceCookie_ = function(
    calendarId) {
  goog.asserts.assert(calendarId);
  var secure = (window.location.protocol != 'http:');
  this.cookies_.set(fivemins.CalendarChooser.FIVEMINS_CALENDAR_COOKIE,
      encodeURIComponent(calendarId),
      fivemins.CalendarChooser.FIVEMINS_CALENDAR_COOKIE_MAX_AGE,
      /* opt_path */ undefined, /* opt_domain */ undefined,
      /* opt_secure */ secure);
};

fivemins.CalendarChooser.prototype.maybeChooseCalendarFromCookie_ = function() {
  var calendarIdFromCookie = this.cookies_.get(
      fivemins.CalendarChooser.FIVEMINS_CALENDAR_COOKIE);
  if (calendarIdFromCookie) {
    calendarIdFromCookie = decodeURIComponent(calendarIdFromCookie);
    var ownedCalendars = this.getOwnedCalendars_();
    for (var i = 0; i < ownedCalendars.length; i++) {
      var ownedCalendar = ownedCalendars[i];
      if (ownedCalendar['id'] == calendarIdFromCookie) {
        this.fireCalendarChoice_(calendarIdFromCookie)
      }
    }
  }
};

fivemins.CalendarChooser.prototype.getOwnedCalendars_ = function() {
  var calendars = [];
  for (var i = 0; i < this.listResp_['items'].length; i++) {
    var calendar = this.listResp_['items'][i];
    if (calendar['accessRole'] == 'owner') {
      calendars.push(calendar);
    }
  }
  return calendars;
};

fivemins.CalendarChooser.prototype.getCalendarById_ = function(calendarId) {
  for (var i = 0; i < this.listResp_['items'].length; i++) {
    var calendar = this.listResp_['items'][i];
    if (calendar['id'] == calendarId) {
      return calendar;
    }
  }
};
