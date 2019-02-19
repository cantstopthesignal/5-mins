// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.Service');
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

/** @type {goog.date.DateTime} */
five.CalendarApi.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.CalendarApi.prototype.endDate_;

/** @type {string} */
five.CalendarApi.prototype.nextSyncToken_;

/** @type {Object} */
five.CalendarApi.prototype.eventsData_;

/**
 * @param {!five.AppContext} appContext
 * @return {!five.CalendarApi}
 */
five.CalendarApi.get = function(appContext) {
  return /** @type {!five.CalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.CalendarApi.SERVICE_ID)));
};

/** @type {goog.log.Logger} */
five.CalendarApi.prototype.logger_ = goog.log.getLogger(
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
 * @return {goog.async.Deferred}
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
 * @param {!Function} callback
 */
five.CalendarApi.prototype.registerEventsListener = function(callback) {
};

five.CalendarApi.prototype.requestSync = function() {
};

/**
 * @param {string} calendarId
 * @param {!Array.<!five.BaseCalendarApi.EventOperation>} eventOperations
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.applyEventOperations = function(calendarId, eventOperations) {
  if (!eventOperations.length) {
    return goog.async.Deferred.succeed();
  }
  var deferreds = goog.array.map(eventOperations, function(operation) {
    switch (operation.getType()) {
      case five.BaseCalendarApi.EventOperation.Type.CREATE:
        this.createEvent_(calendarId, operation.eventData).
            chainDeferred(operation.getDeferred());
        break;
      case five.BaseCalendarApi.EventOperation.Type.SAVE:
        this.saveEvent_(calendarId, operation.eventData, operation.eventPatchData).
            chainDeferred(operation.getDeferred());
        break;
      case five.BaseCalendarApi.EventOperation.Type.DELETE:
        this.deleteEvent_(calendarId, operation.eventDeleteData).
            chainDeferred(operation.getDeferred());
        break;
    };
    return operation.getDeferred();
  }, this);
  return new goog.async.DeferredList(deferreds);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.createEvent_ = function(calendarId, eventData) {
  goog.asserts.assert(!eventData['id']);
  goog.asserts.assert(!eventData['etag']);
  var callback = function(resp) {
    goog.asserts.assert(resp['kind'] == 'calendar#event');
    this.logger_.info('Event created');
  };
  var errback = function(error) {
    this.logger_.severe('Error creating event: ' + goog.json.serialize(error), error);
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
five.CalendarApi.prototype.saveEvent_ = function(calendarId, eventData,
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
      eventPatchData).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {goog.async.Deferred}
 */
five.CalendarApi.prototype.deleteEvent_ = function(calendarId, eventDeleteData) {
  goog.asserts.assert(eventDeleteData['id']);
  goog.asserts.assert(eventDeleteData['etag']);
  var callback = function(resp) {
    this.logger_.info('Event deleted');
  };
  var errback = function(error) {
    this.logger_.severe('Error deleting event: ' + goog.json.serialize(error), error);
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
    var args = {
      'path': path,
      'method': httpMethod
    };
    if (opt_params) {
      args['params'] = opt_params;
    }
    if (opt_body) {
      args['body'] = opt_body;
    }
    var request = goog.getObjectByName('gapi.client.request')(args);
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
          d.errback(error);
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