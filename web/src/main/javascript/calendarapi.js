// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.Service');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');
goog.require('goog.json');


/**
 * Calendar api wrapper.
 *
 * Api descriptor: https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
 *
 * @constructor
 * @param {five.Auth} auth
 * @extends {five.BaseCalendarApi}
 * @implements {five.Service}
 */
five.CalendarApi = function(auth) {
  goog.base(this);

  /** @type {five.Auth} */
  this.auth_ = auth;
};
goog.inherits(five.CalendarApi, five.BaseCalendarApi);

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
  return this.callApi_(['users', 'me', 'calendarList'], 'GET').
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate, opt_prevResp) {
  var params = {
    'orderBy': 'startTime',
    'singleEvents': true,
    'timeMin': new Date(startDate.valueOf()).toISOString(),
    'timeMax': new Date(endDate.valueOf()).toISOString(),
    'maxResults': 240  // set to be under 250 where the api stops reporting properly
  };
  if (opt_prevResp) {
    goog.asserts.assert(opt_prevResp['nextPageToken']);
    params['pageToken'] = opt_prevResp['nextPageToken'];
  }
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#events');
    if (opt_prevResp) {
      resp['items'] = goog.array.concat(opt_prevResp['items'], resp['items']);
    }
    if (resp['nextPageToken']) {
      return this.loadEvents(calendarId, startDate, endDate, resp);
    }
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' events');
  };
  var errback = function(error) {
    this.logger_.severe('Error loading events: ' + error, error);
  };
  return this.callApi_(['calendars', calendarId, 'events'], 'GET', params).
      addCallbacks(callback, errback, this);
};

/**
 * @param {!Function} callback
 */
five.CalendarApi.prototype.registerEventsListener = function(callback) {
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.createEvent = function(calendarId, eventData) {
  this.assertValidCreateData_(eventData);
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event created');
  };
  var errback = function(error) {
    this.logger_.severe('Error creating event: ' + error, error);
  };
  return this.callApi_(['calendars', calendarId, 'events'], 'POST', {}, eventData).
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
  this.assertValidSaveData_(eventData, eventPatchData);
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event saved');
  };
  var errback = function(error) {
    this.logger_.severe('Error saving event: ' + error, error);
  };
  return this.callApi_(['calendars', calendarId, 'events', eventData['id']], 'PATCH', {},
      eventPatchData).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.deleteEvent = function(calendarId, eventDeleteData) {
  this.assertValidDeleteData_(eventDeleteData);
  var callback = function(resp) {
    this.logger_.info('Event deleted');
  };
  var errback = function(error) {
    this.logger_.severe('Error deleting event: ' + error, error);
  };
  return this.callApi_(['calendars', calendarId, 'events', eventDeleteData['id']], 'DELETE',
      {}, {}, true).
      addCallbacks(callback, errback, this);
};

/**
 * @param {!Array.<!string>} pathParts
 * @param {string} httpMethod
 * @param {Object=} opt_params
 * @param {Object=} opt_body
 * @param {boolean=} opt_expectEmptyResponse
 */
five.CalendarApi.prototype.callApi_ = function(pathParts, httpMethod, opt_params, opt_body,
    opt_expectEmptyResponse) {
  var d = new goog.async.Deferred();
  var path = 'https://www.googleapis.com/calendar/v3/' + this.joinPath_(pathParts);
  this.logger_.info(path);
  var retryOnAuthFailure = true;
  var doRequest = goog.bind(function() {
    var request = goog.getObjectByName('gapi.client.request')({
      'path': path,
      'method': httpMethod,
      'params': opt_params,
      'body': opt_body
    });
    request['execute'](goog.bind(function(resp) {
      if (!resp) {
        if (opt_expectEmptyResponse) {
          d.callback(null);
        } else {
          d.errback('Empty response');
        }
      } else if (resp['error']) {
        var error = resp ? resp['error'] : null;
        if (error && this.isLikelyAuthFailure_(error)) {
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

/**
 * @param {!Array.<!string>} pathParts
 */
five.CalendarApi.prototype.joinPath_ = function(pathParts) {
  var path = '';
  for (var i = 0; i < pathParts.length; i++) {
    if (i > 0) {
      path += '/';
    }
    path += encodeURIComponent(pathParts[i]);
  }
  return path;
}

/**
 * @param {Object} error Error response object
 * @return {boolean}
 */
five.CalendarApi.prototype.isLikelyAuthFailure_ = function(error) {
  if (error['code'] == 401) {
    return true;
  }
  // Due to a bug in google apis, a 404 can be returned instead of a 401
  // sometimes.
  if (error['code'] == 404 && !this.auth_.isTokenValid()) {
    return true;
  }
  return false;
};
