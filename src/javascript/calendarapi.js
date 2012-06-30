// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarApi');

goog.require('five.Service');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');
goog.require('goog.json');


/**
 * @constructor
 * @param {five.Auth} auth
 * @extends {goog.events.EventTarget}
 * @implements {five.Service}
 */
five.CalendarApi = function(auth) {
  goog.base(this);

  /** @type {five.Auth} */
  this.auth_ = auth;
};
goog.inherits(five.CalendarApi, goog.events.EventTarget);

five.CalendarApi.SERVICE_ID = 's' + goog.getUid(five.CalendarApi);

/**
 * @param {!five.AppContext} appContext
 * @return {!five.CalendarApi}
 */
five.CalendarApi.get = function(appContext) {
  return /** @type {!five.CalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.CalendarApi.SERVICE_ID)));
};

/** @type {goog.debug.Logger} */
five.CalendarApi.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.CalendarApi');

/** @param {!five.AppContext} appContext */
five.CalendarApi.prototype.register = function(appContext) {
  appContext.register(five.CalendarApi.SERVICE_ID, this);
};

/** @return {goog.async.Deferred} */
five.CalendarApi.prototype.loadCalendarList = function() {
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#calendarList');
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' calendars');
  };
  var errback = function(error) {
    this.logger_.severe('Error loading calendars: ' + error, error);
  };
  return this.callApi_('calendar.calendarList.list', 'v3', {}).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate) {
  var params = {
    'calendarId': calendarId,
    'orderBy': 'startTime',
    'singleEvents': true,
    'timeMin': new Date(startDate.valueOf()).toISOString(),
    'timeMax': new Date(endDate.valueOf()).toISOString()
  };
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#events');
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' events');
  };
  var errback = function(error) {
    this.logger_.severe('Error loading events: ' + error, error);
  };
  return this.callApi_('calendar.events.list', 'v3', params).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.createEvent = function(calendarId, eventData) {
  goog.asserts.assert(!eventData['id']);
  goog.asserts.assert(!eventData['etag']);
  var params = {
    'calendarId': calendarId,
    'resource': eventData
  };
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event created');
  };
  var errback = function(error) {
    this.logger_.severe('Error creating event: ' + error, error);
  };
  return this.callApi_('calendar.events.insert', 'v3', params).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.saveEvent = function(calendarId, eventData,
    eventPatchData) {
  goog.asserts.assert(eventData['id']);
  goog.asserts.assert(eventPatchData['etag']);
  var params = {
    'calendarId': calendarId,
    'eventId': eventData['id'],
    'resource': eventPatchData
  };
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event saved');
  };
  var errback = function(error) {
    this.logger_.severe('Error saving event: ' + error, error);
  };
  return this.callApi_('calendar.events.patch', 'v3', params).
      addCallbacks(callback, errback, this);
};

five.CalendarApi.prototype.callApi_ = function(name, version, params) {
  var d = new goog.async.Deferred();
  this.logger_.info(name);
  var retryOnAuthFailure = true;
  var doRequest = goog.bind(function() {
    var request = goog.getObjectByName('gapi.client.rpcRequest')(
        name, version, params);
    request['execute'](goog.bind(function(resp) {
      if (!resp) {
        d.errback('Empty response');
      } else if (resp['error']) {
        var error = resp ? resp['error'] : null;
        if (error && error['code'] == 401) {
          // Authorization failure.
          if (!retryOnAuthFailure) {
            d.errback('Authorization failed');
            return;
          }
          retryOnAuthFailure = false;
          this.auth_.restart();
          this.auth_.getAuthDeferred().branch().addCallbacks(doRequest,
              goog.bind(d.errback, d));
        } else {
          d.errback('Request error: ' + goog.json.serialize(error));
        }
      } else {
        d.callback(resp);
      }
    }, this));
  }, this);
  doRequest();
  return d;
};
