// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarManager');

goog.require('five.AppContext');
goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('five.IdleTracker');
goog.require('five.NotificationManager');
goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.log');


/**
 * @param {!five.AppContext} appContext
 * @param {Object} calendarData
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.CalendarManager = function(appContext, calendarData) {
  goog.base(this);

  /** @type {!five.AppContext} */
  this.appContext_ = appContext;

  /** @type {!five.BaseCalendarApi} */
  this.calendarApi_;
  if (five.device.isWebView()) {
    this.calendarApi_ = five.AndroidCalendarApi.get(this.appContext_);
  } else {
    this.calendarApi_ = five.CalendarApi.get(this.appContext_);
  }

  /** @type {five.IdleTracker} */
  this.idleTracker_;

  if (!five.device.isWebView()) {
    this.idleTracker_ = new five.IdleTracker();
    this.registerDisposable(this.idleTracker_);
  }

  /** @type {!five.NotificationManager} */
  this.notificationManager_ = five.NotificationManager.get(this.appContext_);

  /** @type {Object} */
  this.calendarData_ = calendarData;

  /** @type {!Array.<!five.Event>} */
  this.removedEvents_ = [];

  /** @type {goog.events.EventHandler} */
  this.eventHandler = new goog.events.EventHandler(this);

  /** @type {Object} */
  this.eventLoadingLocks_ = {};

  /** @type {number} */
  this.eventLoadingLockNextId_ = 1;

  this.calendarApi_.registerEventsListener(goog.bind(this.handleEventsChanged_, this));

  if (this.idleTracker_) {
    this.eventHandler.listen(this.idleTracker_, five.IdleTracker.EventType.ACTIVE,
        this.handleUserActive_);
  }
};
goog.inherits(five.CalendarManager, goog.events.EventTarget);

/** @enum {string} */
five.CalendarManager.EventType = {
  EVENTS_CHANGED: goog.events.getUniqueId('eventschanged'),
  REQUESTS_STATE_CHANGED: goog.events.getUniqueId('requestsstatechanged'),
  MUTATIONS_STATE_CHANGED: goog.events.getUniqueId('mutationsstatechanged')
};

/**
 * @constructor
 * @param {!five.CalendarManager} calendarManager
 * @extends {goog.Disposable}
 */
five.CalendarManager.EventLoadingLock = function(calendarManager) {
  /** @type {!five.CalendarManager} */
  this.calendarManager_ = calendarManager;

  /** @type {number} */
  this.lockId_ = 0;
};
goog.inherits(five.CalendarManager.EventLoadingLock, goog.Disposable);

five.CalendarManager.EventLoadingLock.prototype.setLocked = function(locked) {
  if (locked) {
    if (!this.lockId_) {
      this.lockId_ = this.calendarManager_.lockEventLoading_();
    }
  } else if (this.lockId_) {
    this.calendarManager_.unlockEventLoading_(this.lockId_);
    this.lockId_ = 0;
  }
};

/** @override */
five.CalendarManager.EventLoadingLock.prototype.disposeInternal = function() {
  if (this.lockId_) {
    this.calendarManager_.unlockEventLoading_(this.lockId_);
  }
  goog.base(this, 'disposeInternal');
};

five.CalendarManager.EVENTS_LOAD_ERROR_ =
    'Error loading events. Please try again.';

five.CalendarManager.EVENTS_SAVE_ERROR_ =
    'Error saving events. Please try again.';

five.CalendarManager.EVENT_CREATE_ERROR_ =
    'Error creating event. Please try again.';

five.CalendarManager.EVENT_DELETE_ERROR_ =
    'Error deleting event. Please try again.';

five.CalendarManager.OPEN_EVENTS_EDITOR_ERROR_ =
    'Error editing event. Please try again.';

five.CalendarManager.EVENTS_REFRESHED_NOTIFICATION_ =
    'Events refreshed.';

/** @type {number} */
five.CalendarManager.EVENTS_REFRESHED_NOTIFICATION_DURATION_ = 1000;

/** @type {goog.debug.Logger} */
five.CalendarManager.prototype.logger_ = goog.log.getLogger(
    'five.CalendarManager');

/** @type {goog.date.DateTime} */
five.CalendarManager.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.CalendarManager.prototype.endDate_;

/** @type {Array.<!five.Event>} */
five.CalendarManager.prototype.events_;

/** @type {number} */
five.CalendarManager.prototype.numRequestsInProgress_ = 0;

/** @type {boolean} */
five.CalendarManager.prototype.hasMutations_ = false;

/** @type {boolean} */
five.CalendarManager.prototype.needIdleRefresh_ = false;

/** @override */
five.CalendarManager.prototype.disposeInternal = function() {
  goog.disposeAll(this.events_);
  goog.disposeAll(this.removedEvents_);
  goog.base(this, 'disposeInternal');
};

/** @return {Array.<five.Event>} */
five.CalendarManager.prototype.getEvents = function() {
  return this.events_;
};

/** @return {string} */
five.CalendarManager.prototype.getCalendarSummary = function() {
  return this.calendarData_['summary'];
};

/** @return {boolean} */
five.CalendarManager.prototype.hasMutations = function() {
  return this.hasMutations_;
};

five.CalendarManager.prototype.cancelMutations = function() {
  this.hasMutations_ = false;
  this.dispatchEvent(five.CalendarManager.EventType.MUTATIONS_STATE_CHANGED);
};

/** @return {boolean} */
five.CalendarManager.prototype.hasRequestsInProgress = function() {
  return this.numRequestsInProgress_ > 0;
};

/**
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.loadEvents = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  return this.refreshEvents_();
};

/**
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.refreshEvents_ = function() {
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.requestStarted_();
  return this.calendarApi_.loadEvents(this.calendarData_['id'], this.startDate_,
      this.endDate_).
      addCallback(function(resp) {
        this.handleEventsChanged_(resp);
        this.requestEnded_();
        return this.events_;
      }, this).
      addErrback(function(error) {
        this.logger_.severe('Error loading events: ' + error, error);
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.EVENTS_LOAD_ERROR_);
      }, this);
};

/** @param {!five.Event} newEvent */
five.CalendarManager.prototype.addEvent = function(newEvent) {
  goog.asserts.assert(newEvent.isNew());
  this.events_.push(newEvent);
  this.registerListenersForEvent_(newEvent);
  this.updateHasMutations_();
};

/** @param {!five.Event} event */
five.CalendarManager.prototype.removeEvent = function(event) {
  var index = this.events_.indexOf(event);
  goog.asserts.assert(index >= 0);
  this.events_.splice(index, 1);
  if (!event.isNew()) {
    this.removedEvents_.push(event);
  } else {
    goog.dispose(event);
  }
  this.updateHasMutations_();
};

/** @return {goog.async.Deferred} */
five.CalendarManager.prototype.saveMutations = function() {
  var deferreds = [];
  if (!this.hasMutations()) {
    return new goog.async.DeferredList(deferreds);
  }
  goog.array.forEach(this.events_, function(event) {
    if (event.isNew()) {
      deferreds.push(this.createEvent_(event));
    } else if (event.hasMutations()) {
      deferreds.push(this.saveMutatedEvent_(event));
    }
  }, this);
  goog.array.forEach(this.removedEvents_, function(event) {
    deferreds.push(this.deleteEvent_(event));
  }, this);
  return new goog.async.DeferredList(deferreds).
      addCallback(function(resp) {
        this.checkIdleRefresh_();
        this.calendarApi_.requestSync();
      }, this);
};

/** @param {five.Event} event */
five.CalendarManager.prototype.openEventEditor = function(event) {
  goog.asserts.assert(!event.isNew());
  goog.asserts.assert(!event.hasMutations());
  this.requestStarted_();
  this.calendarApi_.openEventEditor(this.calendarData_['id'], event.getEventData()).
      addCallback(function(resp) {
        this.requestEnded_();
      }, this).
      addErrback(function(error) {
        this.logger_.severe('Error opening event editor: ' + error, error);
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.OPEN_EVENTS_EDITOR_ERROR_);
      }, this);
};

/** @return {!five.CalendarManager.EventLoadingLock} */
five.CalendarManager.prototype.createEventLoadingLock = function() {
  return new five.CalendarManager.EventLoadingLock(this);
};

/** @return {number} */
five.CalendarManager.prototype.lockEventLoading_ = function() {
  var lockId = this.eventLoadingLockNextId_;
  this.eventLoadingLocks_[lockId] = true;
  this.eventLoadingLockNextId_ += 1;
  return lockId;
};

/** @param lockId {number} */
five.CalendarManager.prototype.unlockEventLoading_ = function(lockId) {
  goog.asserts.assert(lockId in this.eventLoadingLocks_);
  delete this.eventLoadingLocks_[lockId];
  this.checkIdleRefresh_();
};

/**
 * @param {five.Event} event
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.createEvent_ = function(event) {
  goog.asserts.assert(event.isNew());
  this.requestStarted_();
  return this.calendarApi_.createEvent(this.calendarData_['id'], event.startCreate()).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#event');
        event.endCreate(resp);
        this.requestEnded_();
      }, this).
      addErrback(function(error) {
        this.logger_.severe('Error creating event: ' + error, error);
        event.abortCreate();
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.EVENT_CREATE_ERROR_);
      }, this);
};

/**
 * @param {five.Event} event
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.saveMutatedEvent_ = function(event) {
  goog.asserts.assert(event.hasMutations());
  this.requestStarted_();
  return this.calendarApi_.saveEvent(this.calendarData_['id'],
      event.getEventData(), event.startMutationPatch()).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#event');
        event.endMutationPatch(resp);
        this.requestEnded_();
      }, this).
      addErrback(function(error) {
        this.logger_.severe('Error saving event: ' + error, error);
        event.abortMutationPatch();
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.EVENTS_SAVE_ERROR_);
      }, this);
};

/**
 * @param {five.Event} event
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.deleteEvent_ = function(event) {
  this.requestStarted_();
  if (event.isNew()) {
    this.eventDeleted_(event);
    this.requestEnded_();
    return goog.async.Deferred.succeed();
  }
  return this.calendarApi_.deleteEvent(this.calendarData_['id'], event.startDelete()).
      addCallback(function(resp) {
        this.eventDeleted_(event);
        this.requestEnded_();
      }, this).
      addErrback(function(error) {
        this.logger_.severe('Error deleting events: ' + error, error);
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.EVENT_DELETE_ERROR_);
      }, this);
};

five.CalendarManager.prototype.requestStarted_ = function() {
  this.numRequestsInProgress_++;
  if (this.numRequestsInProgress_ == 1) {
    this.dispatchEvent(five.CalendarManager.EventType.
        REQUESTS_STATE_CHANGED);
  }
};

five.CalendarManager.prototype.requestEnded_ = function() {
  this.numRequestsInProgress_--;
  goog.asserts.assert(this.numRequestsInProgress_ >= 0);
  if (this.numRequestsInProgress_ == 0) {
    this.dispatchEvent(five.CalendarManager.EventType.
        REQUESTS_STATE_CHANGED);
  }
};

five.CalendarManager.prototype.eventDeleted_ = function(event) {
  var index = this.removedEvents_.indexOf(event);
  goog.asserts.assert(index >= 0);
  this.removedEvents_.splice(index, 1);
  goog.dispose(event);
  this.updateHasMutations_();
};

/** @param {Array.<Object>} eventsData */
five.CalendarManager.prototype.updateEventsData_ = function(eventsData) {
  if (!this.canRefreshEvents_()) {
    return;
  }
  goog.disposeAll(this.events_);
  var filteredEventsData = goog.array.filter(eventsData, function(eventData) {
    var startTime = five.Event.parseEventDataDate(eventData['start']);
    var endTime = five.Event.parseEventDataDate(eventData['end']);
    if (goog.date.Date.compare(startTime, endTime) >= 0) {
      window.console.warn('Ignoring event with invalid date range: "' +
          eventData['summary'] + '", ' +
          new Date(startTime.valueOf()).toISOString() + ' to ' +
          new Date(endTime.valueOf()).toISOString());
      this.notificationManager_.show(
          'Ignoring event "' + eventData['summary'] + '" because ' +
          'it has an invalid date range.');
      return false;
    }
    return true;
  }, this);
  this.events_ = goog.array.map(filteredEventsData, function(eventData) {
    var event = new five.Event(eventData);
    this.registerListenersForEvent_(event);
    return event;
  }, this);
  goog.disposeAll(this.removedEvents_);
  this.removedEvents_ = [];
  this.dispatchEvent(five.CalendarManager.EventType.
      EVENTS_CHANGED);
  this.updateHasMutations_();
};

five.CalendarManager.prototype.updateHasMutations_ = function() {
  var hadMutations = this.hasMutations_;
  this.hasMutations_ = goog.array.some(this.events_, function(event) {
    return event.hasMutations();
  }) || !!this.removedEvents_.length;
  if (hadMutations != this.hasMutations_) {
    this.dispatchEvent(five.CalendarManager.EventType.MUTATIONS_STATE_CHANGED);
  }
};

/** @param {five.Event} event */
five.CalendarManager.prototype.registerListenersForEvent_ = function(event) {
  this.eventHandler.listen(event, five.Event.EventType.MUTATIONS_CHANGED,
      this.handleEventMutationsChanged_);
};

/** @param {goog.events.Event} e */
five.CalendarManager.prototype.handleEventMutationsChanged_ = function(e) {
  this.updateHasMutations_();
};

five.CalendarManager.prototype.handleEventsChanged_ = function(resp) {
  goog.asserts.assert(resp['kind'] == 'calendar#events');
  this.updateEventsData_(resp['items'] || []);
};

five.CalendarManager.prototype.canRefreshEvents_ = function() {
  return !this.hasMutations_ && goog.object.isEmpty(this.eventLoadingLocks_)
};

five.CalendarManager.prototype.handleUserActive_ = function() {
  if (!this.startDate_ || five.device.isWebView()) {
    return;
  }
  this.needIdleRefresh_ = true;
  this.checkIdleRefresh_();
};

five.CalendarManager.prototype.checkIdleRefresh_ = function() {
  if (this.canRefreshEvents_() && this.needIdleRefresh_) {
    this.needIdleRefresh_ = false;
    this.refreshEvents_().addCallback(function() {
      this.notificationManager_.show(
          five.CalendarManager.EVENTS_REFRESHED_NOTIFICATION_,
          five.CalendarManager.EVENTS_REFRESHED_NOTIFICATION_DURATION_,
          five.NotificationManager.Level.INFO);
    }, this);
  }
};
