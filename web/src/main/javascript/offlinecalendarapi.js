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
 * @param {!five.BaseAuth} auth
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
five.OfflineCalendarApi.CALENDARS_VALUE_KEY = 'calendars';

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

/**
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.loadCalendarList = function() {
  var deferred = new goog.async.Deferred();
  function onLoadCallback(resp) {
    this.saveCachedCalendars_(resp).addBoth(function() {
      deferred.callback(resp);
    });
  }
  function onLoadError(error) {
    this.loadCachedCalendars_().chainDeferred(deferred);
  }
  this.calendarApi_.loadCalendarList()
      .addCallbacks(onLoadCallback, onLoadError, this);
  return deferred;
};

/**
 * @param {string} calendarId
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @param {Object=} opt_prevResp
 * @return {!goog.async.Deferred}
 * @override
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
 * @param {Object} eventData
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.createEvent = function(calendarId, eventData) {
  var deferred = new goog.async.Deferred();
  function onCreateEventCallback(resp) {
    this.loadCachedEvents_()
        .addCallback(cachedResp => {
          this.mergeCreatedEvent_(cachedResp, resp);
          this.saveCachedEvents_(cachedResp)
              .addBoth(() => deferred.callback(resp));
        })
        .addErrback(() => deferred.callback(resp));
  };
  this.calendarApi_.createEvent(calendarId, eventData).
      addCallback(onCreateEventCallback, this).
      addErrback(err => deferred.errback(err));
  return deferred;
};

/**
 * @param {string} calendarId
 * @param {Object} eventData
 * @param {Object} eventPatchData
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.saveEvent = function(calendarId, eventData,
    eventPatchData) {
  var deferred = new goog.async.Deferred();
  function onSaveEventCallback(resp) {
    this.loadCachedEvents_()
        .addCallback(cachedResp => {
          this.mergeSavedEvent_(cachedResp, resp);
          this.saveCachedEvents_(cachedResp)
              .addBoth(() => deferred.callback(resp));
        })
        .addErrback(() => deferred.callback(resp));
  };
  this.calendarApi_.saveEvent(calendarId, eventData, eventPatchData).
      addCallback(onSaveEventCallback, this).
      addErrback(err => deferred.errback(err));
  return deferred;
}

/**
 * @param {string} calendarId
 * @param {Object} eventDeleteData
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.deleteEvent = function(calendarId, eventDeleteData) {
  var deferred = new goog.async.Deferred();
  function onDeleteEventCallback(resp) {
    this.loadCachedEvents_()
        .addCallback(cachedResp => {
          this.mergeDeletedEvent_(cachedResp, eventDeleteData);
          this.saveCachedEvents_(cachedResp)
              .addBoth(() => deferred.callback(resp));
        })
        .addErrback(() => deferred.callback(resp));
  };
  this.calendarApi_.deleteEvent(calendarId, eventDeleteData).
      addCallback(onDeleteEventCallback, this).
      addErrback(err => deferred.errback(err));
  return deferred;
};

/**
 * @param {Object} pendingMutationsData
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.savePendingMutations = function(pendingMutationsData) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(
      five.OfflineCalendarApi.PENDING_MUTATIONS_DB_STORE_NAME_);
    store.put(pendingMutationsData, five.OfflineCalendarApi.PENDING_MUTATIONS_DB_VALUE_KEY);
    return putTx.wait()
      .addCallback(resp => null)
      .addErrback(err => {
        this.logger_.severe('Failed to store pending mutations: ' + err, err);
      });
  }, this);
};

/**
 * @return {!goog.async.Deferred}
 * @override
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
 * @return {!goog.async.Deferred}
 * @override
 */
five.OfflineCalendarApi.prototype.saveCurrentCalendarId = function(currentCalendarId) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(
      five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_);
    store.put(currentCalendarId, five.OfflineCalendarApi.CURRENT_CALENDAR_ID_VALUE_KEY);
    return putTx.wait()
      .addCallback(resp => null)
      .addErrback(err => {
        this.logger_.severe('Failed to store current calendar id: ' + err, err);
      });
  }, this);
};

/**
 * @return {!goog.async.Deferred}
 * @override
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

/** @return {!goog.async.Deferred} */
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

/** @return {!goog.async.Deferred} */
five.OfflineCalendarApi.prototype.loadCachedEvents_ = function() {
  return this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction([five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_]);
    var request = getTx.objectStore(five.OfflineCalendarApi.EVENTS_DB_STORE_NAME_).
      get(five.OfflineCalendarApi.EVENTS_DB_VALUE_KEY);
    return request.addCallbacks(function(resp) {
        if (!resp) {
          throw Error('No cached events available');
        }
        resp[five.BaseCalendarApi.CACHED_RESPONSE_KEY] = true;
        return resp;
      }, function(err) {
        this.logger_.severe('Failed to read cached events: ' + err, err);
      }, this);
  }, this);
};

/** @return {!goog.async.Deferred} */
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

/** @return {!goog.async.Deferred} */
five.OfflineCalendarApi.prototype.loadCachedCalendars_ = function() {
  return this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction([five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_]);
    var request = getTx.objectStore(five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_).
      get(five.OfflineCalendarApi.CALENDARS_VALUE_KEY);
    return request.addCallbacks(function(resp) {
        if (!resp) {
          throw Error('No cached calendars available');
        }
        resp[five.BaseCalendarApi.CACHED_RESPONSE_KEY] = true;
        return resp;
      }, function(err) {
        this.logger_.severe('Failed to read cached calendars: ' + err, err);
      }, this);
  }, this);
};

/** @return {!goog.async.Deferred} */
five.OfflineCalendarApi.prototype.saveCachedCalendars_ = function(CalendarsResp) {
  return this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(five.OfflineCalendarApi.CALENDARS_DB_STORE_NAME_);
    store.put(CalendarsResp, five.OfflineCalendarApi.CALENDARS_VALUE_KEY);
    return putTx.wait().addErrback(function(err) {
      this.logger_.severe('Failed to store cached calendars: ' + err, err);
    }, this);
  }, this);
};

/**
 * @param {Object} eventsResp
 * @param {Object} createResp
 */
five.OfflineCalendarApi.prototype.mergeCreatedEvent_ = function(eventsResp, createResp) {
  var eventId = goog.asserts.assertString(createResp['id']);
  var eventItems = eventsResp['items'];
  for (var existingItem of eventItems) {
    if (existingItem['id'] == eventId) {
      this.logger_.severe('Event ' + eventId + ' already in cache, not merging created event');
      return;
    }
  }
  eventItems.push(createResp);
};

/**
 * @param {Object} eventsResp
 * @param {Object} saveResp
 */
five.OfflineCalendarApi.prototype.mergeSavedEvent_ = function(eventsResp, saveResp) {
  var eventId = goog.asserts.assertString(saveResp['id']);
  var eventItems = eventsResp['items'];
  for (var i = 0; i < eventItems.length; i++) {
    if (eventItems[i]['id'] == eventId) {
      eventItems.splice(i, 1, saveResp);
      return;
    }
  }
  this.logger_.warning('Event ' + eventId + ' not yet in cache, merging saved event');
  eventItems.push(saveResp);
};

/**
 * @param {Object} eventsResp
 * @param {Object} eventDeleteData
 */
five.OfflineCalendarApi.prototype.mergeDeletedEvent_ = function(eventsResp, eventDeleteData) {
  var eventId = goog.asserts.assertString(eventDeleteData['id']);
  var eventItems = eventsResp['items'];
  for (var i = 0; i < eventItems.length; i++) {
    if (eventItems[i]['id'] == eventId) {
      eventItems.splice(i, 1);
      return;
    }
  }
  this.logger_.severe('Event ' + eventId + ' not in cache, not merging deleted event');
};
