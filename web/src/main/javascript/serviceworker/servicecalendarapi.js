// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceCalendarApi');

goog.require('five.OfflineCalendarApi');
goog.require('five.ServiceAuth');
goog.require('goog.async.DeferredList');
goog.require('goog.date.DateTime');
goog.require('goog.events.EventTarget');
goog.require('goog.log');


/**
 * Service calendar api wrapper. Communicates with client application
 *
 * Api descriptor: https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
 *
 * @param {!five.ServiceAuth} serviceAuth
 * @constructor
 */
five.ServiceCalendarApi = function(serviceAuth) {
  /** @type {!five.OfflineCalendarApi} */
  this.calendarApi_ = new five.OfflineCalendarApi(serviceAuth);
};

/** @type {!string} */
five.ServiceCalendarApi.RPC_NAME_KEY = 'rpcName';

/** @type {!string} */
five.ServiceCalendarApi.RPC_REQUEST_KEY = 'rpcRequest';

/** @type {!string} */
five.ServiceCalendarApi.RPC_ERROR_KEY = 'rpcError';

/** @type {!string} */
five.ServiceCalendarApi.RPC_RESPONSE_KEY = 'rpcResponse';

/** @type {!string} */
five.ServiceCalendarApi.RPC_LOAD_CALENDAR_LIST = 'loadCalendarList';

/** @type {!string} */
five.ServiceCalendarApi.RPC_LOAD_EVENTS = 'loadEvents';

/** @type {!string} */
five.ServiceCalendarApi.RPC_CREATE_EVENT = 'createEvent';

/** @type {!string} */
five.ServiceCalendarApi.RPC_SAVE_EVENT = 'saveEvent';

/** @type {!string} */
five.ServiceCalendarApi.RPC_DELETE_EVENT = 'deleteEvent';

/** @type {!string} */
five.ServiceCalendarApi.RPC_SAVE_PENDING_MUTATIONS = 'savePendingMutations';

/** @type {!string} */
five.ServiceCalendarApi.RPC_LOAD_PENDING_MUTATIONS = 'loadPendingMutations';

/** @type {!string} */
five.ServiceCalendarApi.RPC_SAVE_CURRENT_CALENDAR_ID = 'saveCurrentCalendarId';

/** @type {!string} */
five.ServiceCalendarApi.RPC_LOAD_CURRENT_CALENDAR_ID = 'loadCurrentCalendarId';

/** @type {goog.log.Logger} */
five.ServiceCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.ServiceCalendarApi');

/**
 * @param {!goog.events.BrowserEvent} e
 */
five.ServiceCalendarApi.prototype.handleMessage = function(e) {
  var event = e.getBrowserEvent();
  var rpcName = event.data[five.ServiceCalendarApi.RPC_NAME_KEY];
  var rpcRequest = event.data[five.ServiceCalendarApi.RPC_REQUEST_KEY];
  if (rpcName ==
      five.ServiceCalendarApi.RPC_LOAD_CALENDAR_LIST) {
    this.respondToRpc_(this.loadCalendarList_(), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_LOAD_EVENTS) {
    this.respondToRpc_(this.loadEvents_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_CREATE_EVENT) {
    this.respondToRpc_(this.createEvent_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_SAVE_EVENT) {
    this.respondToRpc_(this.saveEvent_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_DELETE_EVENT) {
    this.respondToRpc_(this.deleteEvent_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_SAVE_PENDING_MUTATIONS) {
    this.respondToRpc_(this.savePendingMutations_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_LOAD_PENDING_MUTATIONS) {
    this.respondToRpc_(this.loadPendingMutations_(), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_SAVE_CURRENT_CALENDAR_ID) {
    this.respondToRpc_(this.saveCurrentCalendarId_(rpcRequest), event.ports[0]);
  } else if (rpcName == five.ServiceCalendarApi.RPC_LOAD_CURRENT_CALENDAR_ID) {
    this.respondToRpc_(this.loadCurrentCalendarId_(), event.ports[0]);
  } else {
    throw Error('Unexpected message ' + event);
  }
};

/**
 * @param {!goog.async.Deferred} deferred
 * @param {!MessagePort} responsePort
 */
five.ServiceCalendarApi.prototype.respondToRpc_ = function(deferred, responsePort) {
  deferred.addCallbacks(response => {
      var message = {};
      message[five.ServiceCalendarApi.RPC_RESPONSE_KEY] = response;
      responsePort.postMessage(message);
    }, err => {
      var message = {};
      message[five.ServiceCalendarApi.RPC_ERROR_KEY] = err;
      responsePort.postMessage(message);
    });
};

/** @return {!goog.async.Deferred} */
five.ServiceCalendarApi.prototype.loadCalendarList_ = function() {
  return this.calendarApi_.loadCalendarList();
};

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.loadEvents_ = function(rpcRequest) {
  var calendarId = rpcRequest['calendarId'];
  var startDate = new goog.date.DateTime(
      new Date(goog.asserts.assertNumber(rpcRequest['startTime'])));
  var endDate = new goog.date.DateTime(
      new Date(goog.asserts.assertNumber(rpcRequest['endTime'])));
  var opt_prevResp = rpcRequest['prevResp'] || undefined;
  return this.calendarApi_.loadEvents(calendarId, startDate, endDate, opt_prevResp);
};

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.createEvent_ = function(rpcRequest) {
  var calendarId = rpcRequest['calendarId'];
  var eventData = rpcRequest['eventData'];
  return this.calendarApi_.createEvent(calendarId, eventData);
};

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.saveEvent_ = function(rpcRequest) {
  var calendarId = rpcRequest['calendarId'];
  var eventData = rpcRequest['eventData'];
  var eventPatchData = rpcRequest['eventPatchData'];
  return this.calendarApi_.saveEvent(calendarId, eventData, eventPatchData);
}

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.deleteEvent_ = function(rpcRequest) {
  var calendarId = rpcRequest['calendarId'];
  var eventDeleteData = rpcRequest['eventDeleteData'];
  return this.calendarApi_.deleteEvent(calendarId, eventDeleteData);
};

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.savePendingMutations_ = function(rpcRequest) {
  var pendingMutationsData = rpcRequest['pendingMutationsData'];
  return this.calendarApi_.savePendingMutations(pendingMutationsData);
};

/**
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.loadPendingMutations_ = function() {
  return this.calendarApi_.loadPendingMutations();
};

/**
 * @param {Object} rpcRequest
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.saveCurrentCalendarId_ = function(rpcRequest) {
  var currentCalendarId = rpcRequest['currentCalendarId'];
  return this.calendarApi_.saveCurrentCalendarId(currentCalendarId);
};

/**
 * @return {!goog.async.Deferred}
 */
five.ServiceCalendarApi.prototype.loadCurrentCalendarId_ = function() {
  return this.calendarApi_.loadCurrentCalendarId();
};
