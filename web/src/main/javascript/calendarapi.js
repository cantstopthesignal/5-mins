// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('goog.Uri');
goog.require('goog.async.DeferredList');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');


/**
 * Calendar api wrapper.
 *
 * Api descriptor: https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
 *
 * @constructor
 * @param {!five.BaseAuth} auth
 * @extends {five.BaseCalendarApi}
 */
five.CalendarApi = function(auth) {
  goog.base(this);

  /** @type {five.BaseAuth} */
  this.auth_ = auth;
};
goog.inherits(five.CalendarApi, five.BaseCalendarApi);

/** @type {goog.date.DateTime} */
five.CalendarApi.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.CalendarApi.prototype.endDate_;

/** @type {string} */
five.CalendarApi.prototype.nextSyncToken_;

/** @type {Object} */
five.CalendarApi.prototype.eventsData_;

/** @type {goog.log.Logger} */
five.CalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.CalendarApi');

/**
 * @return {!goog.async.Deferred}
 * @override
 */
five.CalendarApi.prototype.loadCalendarList = function() {
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#calendarList');
    this.logger_.info('Loaded ' + (resp['items'] || []).length + ' calendars');
  };
  var errback = function(error) {
    this.logger_.severe('Error loading calendars: ' + goog.json.serialize(error), error);
  };
  return this.callApi_(['users', 'me', 'calendarList'], 'GET').
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {!goog.async.Deferred}
 * @override
 */
five.CalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate, opt_prevResp) {
  if (!this.startDate_ || !startDate.equals(this.startDate_) ||
      !this.endDate_ || !endDate.equals(this.endDate_)) {
    delete this.nextSyncToken_;
    delete this.eventsData_;
    this.startDate_ = startDate;
    this.endDate_ = endDate;
  }
  var params = {
    'singleEvents': true,
    'maxResults': 240  // set to be under 250 where the api stops reporting properly
  };
  if (this.nextSyncToken_) {
    params['syncToken'] = this.nextSyncToken_;
  } else {
    params['timeMin'] = new Date(startDate.valueOf()).toISOString();
    params['timeMax'] = new Date(endDate.valueOf()).toISOString();
  }
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
    this.nextSyncToken_ = resp['nextSyncToken'];
    var changedEventsCount = (resp['items'] || []).length;
    this.mergeEventsData_(resp);
    var finalEventsCount = (this.eventsData_['items'] || []).length;
    if (changedEventsCount != finalEventsCount) {
      this.logger_.info('Loaded ' + changedEventsCount + ' changed events (' +
          finalEventsCount + ' total events)');
    } else {
      this.logger_.info('Loaded ' + finalEventsCount + ' events');
    }
    return this.eventsData_;
  };
  var errback = function(error) {
    if (error && error['code'] == 410) {
      delete this.nextSyncToken_;
      delete this.eventsData_;
      return this.loadEvents(calendarId, startDate, endDate);
    }
    this.logger_.severe('Error loading events: ' + goog.json.serialize(error), error);
  };
  return this.callApi_(['calendars', calendarId, 'events'], 'GET', params).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {!goog.async.Deferred}
 * @override
 */
five.CalendarApi.prototype.createEvent = function(calendarId, eventData) {
  goog.asserts.assert(!eventData['id']);
  goog.asserts.assert(!eventData['etag']);
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event created');
  };
  var errback = function(error) {
    this.logger_.severe('Error creating event: ' + goog.json.serialize(error), error);
  };
  return this.callApi_(['calendars', calendarId, 'events'], 'POST', {}, eventData)
      .addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {!goog.async.Deferred}
 * @override
 */
five.CalendarApi.prototype.saveEvent = function(calendarId, eventData,
    eventPatchData) {
  goog.asserts.assert(eventData['id']);
  goog.asserts.assert(eventPatchData['etag']);
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event saved');
  };
  var errback = function(error) {
    this.logger_.severe('Error saving event: ' + goog.json.serialize(error), error);
  };
  return this.callApi_(['calendars', calendarId, 'events', eventData['id']], 'PATCH', {},
      eventPatchData)
      .addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {!goog.async.Deferred}
 * @override
 */
five.CalendarApi.prototype.deleteEvent = function(calendarId, eventDeleteData) {
  goog.asserts.assert(eventDeleteData['id']);
  goog.asserts.assert(eventDeleteData['etag']);
  var callback = function(resp) {
    this.logger_.info('Event deleted');
  };
  var errback = function(error) {
    this.logger_.severe('Error deleting event: ' + goog.json.serialize(error), error);
  };
  return this.callApi_(['calendars', calendarId, 'events', eventDeleteData['id']], 'DELETE',
      {}, undefined, true).
      addCallbacks(callback, errback, this);
};

/**
 * @param {!Array.<!string>} pathParts
 * @param {string} httpMethod
 * @param {Object=} opt_params
 * @param {Object=} opt_body
 * @param {boolean=} opt_expectEmptyResponse
 * @return {!goog.async.Deferred}
 */
five.CalendarApi.prototype.callApi_ = function(pathParts, httpMethod, opt_params, opt_body,
    opt_expectEmptyResponse) {
  var d = new goog.async.Deferred();
  var baseUrl = 'https://www.googleapis.com/calendar/v3/' + this.joinPath_(pathParts);
  this.logger_.info(baseUrl);
  var retryOnAuthFailure = true;
  var doRequest = () => {
    var uri = goog.Uri.parse(baseUrl);
    for (var k in opt_params) {
      uri.setParameterValue(k, opt_params[k]);
    }
    var fetchInit = {
      'method': httpMethod,
      'cache': 'no-cache',
      'headers': {
        'authorization': this.auth_.getAuthorizationHeaderValue(),
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    }
    if (opt_body) {
      fetchInit['body'] = goog.json.serialize(opt_body);
    }
    self.fetch(uri.toString(), fetchInit)
      .then(resp => {
        if (resp.status == 200) {
          resp.json()
            .then(respData => {
              if (!respData) {
                if (opt_expectEmptyResponse) {
                  d.callback(null);
                } else {
                  d.errback(Error('Empty response'));
                }
              } else {
                d.callback(respData);
              }
            })
            .catch(err => {
              this.logger_.severe('Json parse error ' + err, /** @type {Error} */ (err));
              d.errback(err);
            });
        } else if (resp.status == 204) {
          if (opt_expectEmptyResponse) {
            d.callback(null);
          } else {
            d.errback(Error('Empty response'));
          }
        } else if (this.isLikelyAuthFailure_(resp)) {
          if (!retryOnAuthFailure) {
            d.errback(Error('Authorization failed'));
            return;
          }
          retryOnAuthFailure = false;
          this.auth_.restart();
          this.auth_.getAuthDeferred().branch().addCallbacks(doRequest,
              goog.bind(d.errback, d));
        } else {
          d.errback(Error('Unexpected response: ' + resp, resp));
        }
      })
      .catch(err => {
        d.errback(err);
      });
  };
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
 * @param {Response} resp Response object
 * @return {boolean}
 */
five.CalendarApi.prototype.isLikelyAuthFailure_ = function(resp) {
  if (resp.status == 401 || resp.status == 403) {
    return true;
  }
  // Due to a bug in google apis, a 404 can be returned instead of a 401
  // sometimes.
  if (resp.status == 404 && !this.auth_.isTokenValid()) {
    return true;
  }
  return false;
};

five.CalendarApi.prototype.mergeEventsData_ = function(resp) {
  if (!this.eventsData_) {
    this.eventsData_ = resp;
    return;
  }

  var eventsMap = {};
  for (var eventData of this.eventsData_['items']) {
    eventsMap[eventData['id']] = eventData;
  }
  for (var eventData of (resp['items'] || [])) {
    eventsMap[eventData['id']] = eventData;
  }

  var items = [];
  goog.object.forEach(eventsMap, function(eventData) {
    if (eventData['status'] != 'cancelled') {
      items.push(eventData);
    }
  });

  this.eventsData_ = resp;
  this.eventsData_['items'] = items;
};