// Copyright cantstopthesignals@gmail.com

goog.provide('five.OfflineCalendarApi');

goog.require('five.BaseCalendarApi');
goog.require('five.CalendarApi');
goog.require('five.Service');
goog.require('goog.async.DeferredList');
goog.require('goog.db');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');


/**
 * Offline calendar api wrapper.
 *
 * Api descriptor: https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
 *
 * @constructor
 * @param {five.Auth} auth
 * @extends {five.BaseCalendarApi}
 * @implements {five.Service}
 */
five.OfflineCalendarApi = function(auth) {
  goog.base(this);

  /** @type {!five.BaseCalendarApi} */
  this.calendarApi_ = new five.CalendarApi(auth);
};
goog.inherits(five.OfflineCalendarApi, five.BaseCalendarApi);

five.OfflineCalendarApi.SERVICE_ID = 's' + goog.getUid(five.OfflineCalendarApi);

/** @type {!string} */
five.OfflineCalendarApi.DB_NAME_ = 'offlineCalendar';

/** @type {!string} */
five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_ = 'calendars';

/** @type {!string} */
five.OfflineCalendarApi.CURRENT_CALENDAR_ID_VALUE_KEY = 'currentCalendarId';

/** @type {!string} */
five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_ = 'events';

/** @type {!string} */
five.OfflineCalendarApi.EVENTS_DB_VALUE_KEY = 'value';

/** @type {!string} */
five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_ = 'pendingMutations';

/** @type {!string} */
five.OfflineCalendarApi.PENDING_MUTATIONS_DB_VALUE_KEY = 'value';

/** @type {goog.async.Deferred} */
five.OfflineCalendarApi.prototype.dbDeferred_;

/**
 * @param {!five.AppContext} appContext
 * @return {!five.OfflineCalendarApi}
 */
five.OfflineCalendarApi.get = function(appContext) {
  return /** @type {!five.OfflineCalendarApi} */ (goog.asserts.assertObject(
      appContext.get(five.OfflineCalendarApi.SERVICE_ID)));
};

/** @type {goog.log.Logger} */
five.OfflineCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.OfflineCalendarApi');

/** @param {!five.AppContext} appContext */
five.OfflineCalendarApi.prototype.register = function(appContext) {
  appContext.register(five.OfflineCalendarApi.SERVICE_ID, this);
};

/** @return {goog.async.Deferred} */
five.OfflineCalendarApi.prototype.loadCalendarList = function() {
  return this.calendarApi_.loadCalendarList();
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.loadEvents = function(calendarId, startDate,
    endDate, opt_prevResp) {
  var deferred = new goog.async.Deferred();
  function onLoadEventsCallback(resp) {
    this.saveCachedEvents_(resp).addBoth(function() {
      deferred.callback(resp);
    });
  }
  function onLoadEventsError(error) {
    this.loadCachedEvents_().chainDeferred(deferred);
  }
  this.calendarApi_.loadEvents(calendarId, startDate, endDate, opt_prevResp).
      addCallbacks(onLoadEventsCallback, onLoadEventsError, this);
  return deferred;
};

/**
 * @param {string} calendarId
 * @param {!Array.<!five.BaseCalendarApi.EventOperation>} eventOperations
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.applyEventOperations = function(calendarId, eventOperations) {
  return this.calendarApi_.applyEventOperations(calendarId, eventOperations);
};

/**
 * @param {Object} pendingMutationsData
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.savePendingMutations = function(pendingMutationsData) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(
      five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_);
    store.put(pendingMutationsData, five.OfflineCalendarApi.PENDING_MUTATIONS_DB_VALUE_KEY);
    return putTx.wait().addErrback(function(err) {
      this.logger_.severe('Failed to store pending mutations: ' + err, err);
    }, this);
  }, this);
};

/**
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.loadPendingMutations = function() {
  return this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction(
      [five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_]);
    var request = getTx.objectStore(
      five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_).
      get(five.OfflineCalendarApi.PENDING_MUTATIONS_DB_VALUE_KEY);
    return request.addErrback(function(err) {
      this.logger_.severe('Failed to read pending mutations: ' + err, err);
    }, this);
  }, this);
};

/**
 * @param {!string} currentCalendarId
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.saveCurrentCalendarId = function(currentCalendarId) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(
      five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_);
    store.put(currentCalendarId, five.OfflineCalendarApi.CURRENT_CALENDAR_ID_VALUE_KEY);
    return putTx.wait().addErrback(function(err) {
      this.logger_.severe('Failed to store current calendar id: ' + err, err);
    }, this);
  }, this);
};

/**
 * @return {goog.async.Deferred}
 */
five.OfflineCalendarApi.prototype.loadCurrentCalendarId = function() {
  return this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction(
      [five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_]);
    var request = getTx.objectStore(
      five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_).
      get(five.OfflineCalendarApi.CURRENT_CALENDAR_ID_VALUE_KEY);
    return request.addErrback(function(err) {
      this.logger_.severe('Failed to read current calendar id: ' + err, err);
    }, this);
  }, this);
};

/** @return {goog.async.Deferred} */
five.OfflineCalendarApi.prototype.getDb_ = function() {
  if (this.dbDeferred_) {
    return this.dbDeferred_.branch();
  }

  this.dbDeferred_ = goog.db.openDatabase(
      five.OfflineCalendarApi.DB_NAME_, 3,
      function(ev, db, tx) {
        if (ev.oldVersion < 1) {
          db.createObjectStore(five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_);
        }
        if (ev.oldVersion < 2) {
          db.createObjectStore(five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_);
        }
        if (ev.oldVersion < 3) {
          db.createObjectStore(five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_);
        }
      });
  this.dbDeferred_.addErrback(function(err) {
    this.logger_.severe('Failed to open database: ' + err, err);
  }, this);

  return this.dbDeferred_.branch();
};

/** @return {goog.async.Deferred} */
five.OfflineCalendarApi.prototype.loadCachedEvents_ = function() {
  return this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction([five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_]);
    var request = getTx.objectStore(five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_).
      get(five.OfflineCalendarApi.EVENTS_DB_VALUE_KEY);
    return request.addCallbacks(function(resp) {
        resp[five.BaseCalendarApi.CACHED_RESPONSE_KEY] = true;
        return resp;
      }, function(err) {
        this.logger_.severe('Failed to read cached events: ' + err, err);
      }, this);
  }, this);
};

/** @return {goog.async.Deferred} */
five.OfflineCalendarApi.prototype.saveCachedEvents_ = function(eventsResp) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_);
    store.put(eventsResp, five.OfflineCalendarApi.EVENTS_DB_VALUE_KEY);
    return putTx.wait().addErrback(function(err) {
      this.logger_.severe('Failed to store cached events: ' + err, err);
    }, this);
  }, this);
};

