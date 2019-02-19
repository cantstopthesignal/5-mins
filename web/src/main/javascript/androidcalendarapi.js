// Copyright cantstopthesignals@gmail.com

goog.provide('five.AndroidCalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.Service');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');

/**
 * Android calendar api wrapper.
 *
 * @constructor
 * @extends {five.BaseCalendarApi}
 * @implements {five.Service}
 */
five.AndroidCalendarApi = function() {
  goog.base(this);
};
goog.inherits(five.AndroidCalendarApi, five.BaseCalendarApi);

five.AndroidCalendarApi.SERVICE_ID = 's' + goog.getUid(five.AndroidCalendarApi);

/** @type {Object} */
five.AndroidCalendarApi.prototype.interface_;

/**
 * @param {!five.AppContext} appContext
 * @return {!five.AndroidCalendarApi}
 */
five.AndroidCalendarApi.get = function(appContext) {
  return /** @type {!five.AndroidCalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.AndroidCalendarApi.SERVICE_ID)));
};

/** @type {goog.debug.Logger} */
five.AndroidCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.AndroidCalendarApi');

/** @param {!five.AppContext} appContext */
five.AndroidCalendarApi.prototype.register = function(appContext) {
  appContext.register(five.AndroidCalendarApi.SERVICE_ID, this);
};

/** @return {goog.async.Deferred} */
five.AndroidCalendarApi.prototype.loadCalendarData = function() {
  var callback = function(respJson) {
    return JSON.parse(respJson);
  };
  var errback = function(error) {
    this.logger_.severe('Error loading calendar data: ' + error, error);
  };
  return this.callApi_('loadCalendarData').
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.loadEvents = function(calendarId, startDate, endDate) {
  var d = new goog.async.Deferred();
  var callbackName = 'callback_' + goog.getUid(d);
  var callback = function(resp) {
    delete goog.global[callbackName];
    d.callback(resp);
  }
  goog.exportSymbol(callbackName, goog.bind(callback, this));
  var errback = function(error) {
    this.logger_.severe('Error loading events: ' + error, error);
    d.errback(error);
  }
  this.callApi_(
    'loadEvents', calendarId, startDate.getTime(), endDate.getTime(), callbackName).
    addErrback(errback, this);
  return d;
};

/**
 * @param {!Function} callback
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.registerEventsListener = function(callback) {
  var callbackName = 'callback_' + goog.getUid(callback);
  goog.exportSymbol(callbackName, callback);
  var errback = function(error) {
    this.logger_.severe('Error registering events listener: ' + error, error);
  };
  return this.callApi_('registerEventsListener', callbackName).
      addErrback(errback, this);
};

/**
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.requestSync = function() {
  var errback = function(error) {
    this.logger_.severe('Error requesting sync: ' + error, error);
  };
  return this.callApi_('requestSync').
      addErrback(errback, this);
};

/**
 * @param {string} calendarId
 * @param {!Array.<!five.BaseCalendarApi.EventOperation>} eventOperations
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.applyEventOperations = function(calendarId, eventOperations) {
  if (!eventOperations.length) {
    return goog.async.Deferred.succeed();
  }
  var operationsJson = goog.array.map(eventOperations, function(operation) {
    switch (operation.getType()) {
      case five.BaseCalendarApi.EventOperation.Type.CREATE:
        var eventData = operation.eventData;
        goog.asserts.assert(!eventData['id']);
        goog.asserts.assert(!eventData['originalId']);
        goog.asserts.assert(!eventData['originalInstanceTime']);
        goog.asserts.assert(!eventData['etag']);
        return {
          'type': 'create',
          'eventData': eventData
        };
      case five.BaseCalendarApi.EventOperation.Type.SAVE:
        var eventData = operation.eventData;
        if (!eventData['id']) {
          goog.asserts.assert(eventData['originalId']);
          goog.asserts.assert(eventData['originalInstanceTime']);
        }
        return {
          'type': 'save',
          'eventData': eventData,
          'eventPatchData': operation.eventPatchData
        }
      case five.BaseCalendarApi.EventOperation.Type.DELETE:
        var eventDeleteData = operation.eventDeleteData;
        if (!eventDeleteData['id']) {
          goog.asserts.assert(eventDeleteData['originalId']);
          goog.asserts.assert(eventDeleteData['originalInstanceTime']);
        }
        return {
          'type': 'delete',
          'eventDeleteData': eventDeleteData
        };
    };
  }, this);
  var callback = function(respArrayJson) {
    var respArray = JSON.parse(respArrayJson);
    goog.asserts.assert(goog.isArray(respArray));
    goog.asserts.assert(eventOperations.length == respArray.length);
    var successCount = 0;
    for (var i = 0; i < respArray.length; i++) {
      var operation = eventOperations[i];
      var resp = respArray[i];
      if (!resp || (goog.isObject(resp) && 'error' in resp)) {
        operation.getDeferred().errback(JSON.stringify(resp));
      } else {
        operation.getDeferred().callback(resp);
        successCount += 1;
      }
    }
    if (successCount == 0) {
      this.logger_.severe('Error applying event operations');
    } else if (successCount < eventOperations.length) {
      this.logger_.severe('Applied ' + successCount + ' out of ' + eventOperations.length +
          ' event operations');
    } else {
      this.logger_.info('Applied ' + eventOperations.length + ' event operations');
    }
    return respArray;
  };
  var errback = function(error) {
    this.logger_.severe('Error applying event operations: ' + error, error);
    goog.array.forEach(eventOperations, function(operation) {
      operation.getDeferred().errback(error);
    });
  };
  return this.callApi_('applyEventOperations', calendarId, JSON.stringify(operationsJson)).
      addCallbacks(callback, errback, this);
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.openEventEditor = function(calendarId, eventData) {
  goog.asserts.assert(eventData['id']);
  var callback = function(resp) {
    this.logger_.info('Event editor opened');
  };
  var errback = function(error) {
    this.logger_.severe('Error opening event editor: ' + error, error);
  };
  return this.callApi_('openEventEditor', calendarId, eventData['id']).
      addCallbacks(callback, errback, this);
};


/**
 * @param {string} methodName
 * @param {...*} var_args
 * @return {goog.async.Deferred}
 */
five.AndroidCalendarApi.prototype.callApi_ = function(methodName, var_args) {
  var params = Array.prototype.slice.call(arguments, 1);
  var d = new goog.async.Deferred();
  try {
    var resp = this.getInterface_()[methodName].apply(this.getInterface_(), params);
    if (resp !== undefined) {
      this.logger_.info('Response from [' + methodName + '] is ' + resp);
    }
    d.callback(resp);
  } catch (e) {
    d.errback(e);
  }
  return d;
};

five.AndroidCalendarApi.prototype.getInterface_ = function() {
  if (!this.interface_) {
    this.interface_ = goog.getObjectByName('Android');
  }
  return this.interface_;
}