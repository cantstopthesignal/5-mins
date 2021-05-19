// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarChooser');

goog.require('five.Dialog')
goog.require('five.OfflineCalendarApi')
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');

/**
 * @constructor
 * @param {!five.OfflineCalendarApi} calendarApi
 * @param {!Object} listResp
 * @extends {five.Dialog}
 */
five.CalendarChooser = function(calendarApi, listResp) {
  goog.base(this);

  /** @type {!five.OfflineCalendarApi} */
  this.calendarApi_ = calendarApi;

  /** @type {!Object} */
  this.listResp_ = listResp;

  /** @type {Array.<Object>} */
  this.calendars_ = this.listResp_['items'] || [];

  /** @type {goog.async.Deferred} */
  this.choiceDeferred_;
};
goog.inherits(five.CalendarChooser, five.Dialog);

/** @type {goog.log.Logger} */
five.CalendarChooser.prototype.logger_ = goog.log.getLogger(
    'five.CalendarChooser');

/** @type {Element} */
five.CalendarChooser.prototype.containerEl_;

/** @type {string} */
five.CalendarChooser.prototype.calendarId_;

five.CalendarChooser.prototype.chooseCalendar = function() {
  if (this.choiceDeferred_) {
    return this.choiceDeferred_.branch();
  }

  this.choiceDeferred_ = this.maybeChooseOnlyCalendar_()
      .addCallback(function(calendarId) {
        if (calendarId) {
          return calendarId;
        }
        return this.calendarApi_.loadCurrentCalendarId();
      }, this)
      .addCallback(function(calendarId) {
        if (calendarId) {
          return calendarId;
        }
        return this.showChooserUi_();
      }, this)
      .addCallback(function(calendarId) {
        var calendar = this.getCalendarById_(calendarId);
        goog.asserts.assert(calendar);
        return calendar;
      }, this);
  return this.choiceDeferred_.branch();
};

five.CalendarChooser.prototype.showChooserUi_ = function() {
  var deferred = new goog.async.Deferred();
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
        goog.partial(this.handleCalendarClick_, deferred, ownedCalendar['id']));
    var calendarNameEl = document.createTextNode(ownedCalendar['summary']);
    calendarEl.appendChild(calendarNameEl);
    this.containerEl_.appendChild(calendarEl);
  }
  this.getContentEl().appendChild(this.containerEl_);
  this.show();
  return deferred;
};

five.CalendarChooser.prototype.handleCalendarClick_ = function(deferred, calendarId) {
  goog.asserts.assert(calendarId);
  this.calendarApi_.saveCurrentCalendarId(calendarId)
      .addCallback(function() {
        return calendarId;
      }, this)
      .chainDeferred(deferred);
};

five.CalendarChooser.prototype.maybeChooseOnlyCalendar_ = function() {
  var ownedCalendars = this.getOwnedCalendars_();
  if (ownedCalendars.length == 1) {
    var calendarId = ownedCalendars[0]['id'];
    goog.asserts.assert(calendarId);
    return this.calendarApi_.saveCurrentCalendarId(calendarId)
        .addCallback(function() {
          return calendarId;
        }, this);
  }
  return goog.async.Deferred.succeed(null);
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
