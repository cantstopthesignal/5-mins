// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarApi');

goog.require('goog.debug.Logger');


/**
 * @constructor
 * @param {five.Auth} auth
 */
five.CalendarApi = function(auth) {
  /** @type {five.Auth} */
  this.auth_ = auth;
};

/** @type {goog.debug.Logger} */
five.CalendarApi.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.CalendarApi');

/** @return {goog.async.Deferred} */
five.CalendarApi.prototype.loadCalendarList = function() {
  var requestParams = {
    path: '/calendar/v3/users/me/calendarList',
    params: {}
  };
  return this.callApiWithAuthRetry_(requestParams).addCallback(function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#calendarList');
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' calendars');
  }, this).addErrback(function(error) {
    this.logger_.severe('Error loading calendars: ' + error, error);
  }, this);
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate) {
  var requestParams = {
    path: '/calendar/v3/calendars/' + calendarId + '/events',
    params: {
      orderBy: 'startTime',
      singleEvents: true,
      timeMin: new Date(startDate.valueOf()).toISOString(),
      timeMax: new Date(endDate.valueOf()).toISOString()
    }
  };
  return this.callApiWithAuthRetry_(requestParams).addCallback(function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#events');
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' events');
  }, this).addErrback(function(error) {
    this.logger_.severe('Error loading events: ' + error, error);
  }, this);
};

/** Call an api but retry auth on auth failure. */
five.CalendarApi.prototype.callApiWithAuthRetry_ = function(requestParams) {
  var d = new goog.async.Deferred();
  var attempts = 0;
  var doRequest = goog.bind(function () {
    this.logger_.info(requestParams.path);
    var request = goog.getObjectByName('gapi.client.request')(requestParams);
    request['execute'](goog.bind(function(resp) {
      if (resp['error'] && resp['error']['code'] == 401) {
        // Authorization failure.
        if (attempts > 0) {
          d.errback('Auth failed twice');
          return;
        }
        attempts++;
        this.auth_.restart();
        this.auth_.getAuthDeferred().branch().addCallbacks(doRequest,
            goog.bind(d.errback, d));
      } else {
        d.callback(resp);
      }
    }, this));
  }, this);
  doRequest();
  return d;
};
