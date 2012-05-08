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
