// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarChooser');

goog.require('five.Dialog')
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.net.Cookies');

/**
 * @constructor
 * @extends {five.Dialog}
 */
five.CalendarChooser = function(listResp) {
  goog.base(this);

  this.listResp_ = listResp;

  /** @type {Array.<Object>} */
  this.calendars_ = this.listResp_['items'] || [];

  /** @type {goog.net.Cookies} */
  this.cookies_ = new goog.net.Cookies(document);

  /** @type {goog.async.Deferred} */
  this.choiceDeferred_ = new goog.async.Deferred();
};
goog.inherits(five.CalendarChooser, five.Dialog);

five.CalendarChooser.FIVEMINS_CALENDAR_COOKIE = "FIVEMINS_CALENDAR";

five.CalendarChooser.FIVEMINS_CALENDAR_COOKIE_MAX_AGE = -1;

/** @type {Element} */
five.CalendarChooser.prototype.containerEl_;

/** @type {string} */
five.CalendarChooser.prototype.calendarId_;

five.CalendarChooser.prototype.chooseCalendar = function() {
  if (!this.choiceDeferred_.hasFired()) {
    this.maybeChooseCalendarFromCookie_();
  }
  if (!this.choiceDeferred_.hasFired()) {
    this.maybeChooseOnlyCalendar_();
  }
  if (!this.choiceDeferred_.hasFired()) {
    this.showChooserUi_();
  }
  return this.choiceDeferred_.branch();
};

five.CalendarChooser.prototype.fireCalendarChoice_ = function(calendarId) {
  goog.asserts.assert(!this.choiceDeferred_.hasFired());
  var calendar = this.getCalendarById_(calendarId);
  goog.asserts.assert(calendar);
  this.choiceDeferred_.callback(calendar);
}

five.CalendarChooser.prototype.showChooserUi_ = function() {
  this.createDom();
  this.containerEl_ = document.createElement('div');
  goog.dom.classlist.add(this.containerEl_, 'calendar-chooser');
  var headerEl = document.createElement('div');
  goog.dom.classlist.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode('Choose a calendar to use'));
  this.containerEl_.appendChild(headerEl);
  var ownedCalendars = this.getOwnedCalendars_();
  for (var i = 0; i < ownedCalendars.length; i++) {
    var ownedCalendar = ownedCalendars[i];
    var calendarEl = document.createElement('div');
    goog.dom.classlist.add(calendarEl, 'button');
    goog.dom.classlist.add(calendarEl, 'calendar-entry');
    this.eventHandler.listen(calendarEl, goog.events.EventType.CLICK,
        goog.partial(this.handleCalendarClick_, ownedCalendar['id']));
    var calendarNameEl = document.createTextNode(ownedCalendar['summary']);
    calendarEl.appendChild(calendarNameEl);
    this.containerEl_.appendChild(calendarEl);
  }
  this.getContentEl().appendChild(this.containerEl_);
  this.show();
};

five.CalendarChooser.prototype.handleCalendarClick_ = function(calendarId) {
  this.setCalendarChoiceCookie_(calendarId);
  this.fireCalendarChoice_(calendarId);
};

five.CalendarChooser.prototype.setCalendarChoiceCookie_ = function(
    calendarId) {
  goog.asserts.assert(calendarId);
  var secure = (window.location.protocol != 'http:');
  this.cookies_.set(five.CalendarChooser.FIVEMINS_CALENDAR_COOKIE,
      encodeURIComponent(calendarId),
      five.CalendarChooser.FIVEMINS_CALENDAR_COOKIE_MAX_AGE,
      /* opt_path */ undefined, /* opt_domain */ undefined,
      /* opt_secure */ secure);
};

five.CalendarChooser.prototype.maybeChooseOnlyCalendar_ = function() {
  var ownedCalendars = this.getOwnedCalendars_();
  if (ownedCalendars.length == 1) {
    this.fireCalendarChoice_(ownedCalendars[0]['id']);
  }
};

five.CalendarChooser.prototype.maybeChooseCalendarFromCookie_ = function() {
  var calendarIdFromCookie = this.cookies_.get(
      five.CalendarChooser.FIVEMINS_CALENDAR_COOKIE);
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

five.CalendarChooser.prototype.getOwnedCalendars_ = function() {
  var calendars = [];
  for (var i = 0; i < this.calendars_.length; i++) {
    var calendar = this.calendars_[i];
    if (calendar['accessRole'] == 'owner') {
      calendars.push(calendar);
    }
  }
  return calendars;
};

five.CalendarChooser.prototype.getCalendarById_ = function(calendarId) {
  for (var i = 0; i < this.calendars_.length; i++) {
    var calendar = this.calendars_[i];
    if (calendar['id'] == calendarId) {
      return calendar;
    }
  }
};
