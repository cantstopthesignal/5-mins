// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.CalendarApi');

goog.require('goog.debug.Logger');


/** @constructor */
fivemins.CalendarApi = function() {
};

/** @type {goog.debug.Logger} */
fivemins.CalendarApi.prototype.logger_ = goog.debug.Logger.getLogger(
    'fivemins.CalendarApi');

/** @return {goog.async.Deferred} */
fivemins.CalendarApi.prototype.loadCalendarList = function() {
  var d = new goog.async.Deferred();
  var request = goog.getObjectByName('gapi.client.request')({
    path: '/calendar/v3/users/me/calendarList',
    params: {}
  });
  request['execute'](function(resp) {
    d.callback(resp);
  });
  return d;
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
fivemins.CalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate) {
  var d = new goog.async.Deferred();
  var request = goog.getObjectByName('gapi.client.request')({
    path: '/calendar/v3/calendars/' + calendarId + '/events',
    params: {
      orderBy: 'startTime',
      singleEvents: true,
      timeMin: new Date(startDate.valueOf()).toISOString(),
      timeMax: new Date(endDate.valueOf()).toISOString()
    }
  });
  request['execute'](function(resp) {
    d.callback(resp);
  });
  return d;
};
