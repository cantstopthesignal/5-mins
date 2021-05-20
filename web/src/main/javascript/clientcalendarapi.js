// Copyright cantstopthesignals@gmail.com

goog.provide('five.ClientCalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.ServiceCalendarApi');
goog.require('five.Service');
goog.require('goog.async.DeferredList');
goog.require('goog.events.EventTarget');
goog.require('goog.log');


/**
 * Client calendar api wrapper. Communicates with the service worker
 *
 * Api descriptor: https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
 *
 * @constructor
 * @extends {five.BaseCalendarApi}
 * @implements {five.Service}
 */
five.ClientCalendarApi = function() {
  goog.base(this);
};
goog.inherits(five.ClientCalendarApi, five.BaseCalendarApi);

five.ClientCalendarApi.SERVICE_ID = 's' + goog.getUid(five.ClientCalendarApi);

/**
 * @param {!five.AppContext} appContext
 * @return {!five.ClientCalendarApi}
 */
five.ClientCalendarApi.get = function(appContext) {
  return /** @type {!five.ClientCalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.ClientCalendarApi.SERVICE_ID)));
};

/** @type {goog.log.Logger} */
five.ClientCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.ClientCalendarApi');

/** @param {!five.AppContext} appContext */
five.ClientCalendarApi.prototype.register = function(appContext) {
  appContext.register(five.ClientCalendarApi.SERVICE_ID, this);
};

/**
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.loadCalendarList = function() {
  return this.callRpc_(five.ServiceCalendarApi.RPC_LOAD_CALENDAR_LIST)
      .addCallback((resp) => {
        goog.asserts.assert(resp['kind'] == 'calendar#calendarList');
        return resp;
      });
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate, opt_prevResp) {
  var rpcRequest = {
    'calendarId': calendarId,
    'startTime': startDate.getTime(),
    'endTime': endDate.getTime()
  };
  if (opt_prevResp) {
    rpcRequest['prevResp'] = opt_prevResp;
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_LOAD_EVENTS, rpcRequest)
      .addCallback(resp => {
        goog.asserts.assert(resp['kind'] == 'calendar#events');
        return resp;
      });
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.createEvent = function(calendarId, eventData) {
  var rpcRequest = {
    'calendarId': calendarId,
    'eventData': eventData
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_CREATE_EVENT, rpcRequest)
      .addCallback(resp => {
        goog.asserts.assert(resp['kind'] == 'calendar#event');
        return resp;
      });
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.saveEvent = function(calendarId, eventData,
    eventPatchData) {
  var rpcRequest = {
    'calendarId': calendarId,
    'eventData': eventData,
    'eventPatchData': eventPatchData
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_SAVE_EVENT, rpcRequest)
      .addCallback(resp => {
        goog.asserts.assert(resp['kind'] == 'calendar#event');
        return resp;
      })
      .addErrback(err => {
        // TODO: use better method for determining sync
        navigator.serviceWorker.ready
          .then(registration => {
            return registration.sync.register(five.ServiceWorkerApi.SYNC_TAG);
          })
          .catch(err => {
            this.logger_.severe('Sync ready or register failed: ' + err,
                /** @type {?Error} */ (err));
          });
      });
};

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.deleteEvent = function(calendarId, eventDeleteData) {
  var rpcRequest = {
    'calendarId': calendarId,
    'eventDeleteData': eventDeleteData
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_DELETE_EVENT, rpcRequest);
};

/**
 * @param {Object} pendingMutationsData
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.savePendingMutations = function(pendingMutationsData) {
  var rpcRequest = {
    'pendingMutationsData': pendingMutationsData
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_SAVE_PENDING_MUTATIONS, rpcRequest);
};

/**
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.loadPendingMutations = function() {
  return this.callRpc_(five.ServiceCalendarApi.RPC_LOAD_PENDING_MUTATIONS);
};

/**
 * @param {!string} currentCalendarId
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.saveCurrentCalendarId = function(currentCalendarId) {
  var rpcRequest = {
    'currentCalendarId': currentCalendarId
  }
  return this.callRpc_(five.ServiceCalendarApi.RPC_SAVE_CURRENT_CALENDAR_ID, rpcRequest);
};

/**
 * @return {!goog.async.Deferred}
 * @override
 */
five.ClientCalendarApi.prototype.loadCurrentCalendarId = function() {
  return this.callRpc_(five.ServiceCalendarApi.RPC_LOAD_CURRENT_CALENDAR_ID);
};

/**
 * @param {!string} rpcName
 * @param {Object=} opt_request
 * @return {!goog.async.Deferred}
 */
five.ClientCalendarApi.prototype.callRpc_ = function(rpcName, opt_request) {
  return goog.async.Deferred.fromPromise(navigator.serviceWorker.ready
    .then(() => {
      return new Promise((resolve, reject) => {
        if (navigator.serviceWorker.controller) {
          var channel = new MessageChannel();
          channel.port1.onmessage = (e) => {
            var rpcResponse = e.data[five.ServiceCalendarApi.RPC_RESPONSE_KEY];
            var rpcError = e.data[five.ServiceCalendarApi.RPC_ERROR_KEY];
            if (rpcError) {
              reject(rpcError);
            } else {
              resolve(rpcResponse);
            }
          };
          var message = {};
          message[five.ServiceWorkerApi.MESSAGE_COMMAND_KEY] =
              five.ServiceWorkerApi.COMMAND_CALENDAR_API_RPC;
          message[five.ServiceCalendarApi.RPC_NAME_KEY] = rpcName;
          message[five.ServiceCalendarApi.RPC_REQUEST_KEY] = opt_request;
          navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
        } else {
          this.logger_.severe('ServiceWorker controller not set');
          reject(Error('ServiceWorker controller not set'));
        }
      });
    }));
};
