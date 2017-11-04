// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarManager');

goog.require('five.AppContext');
goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('five.NotificationManager');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');


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

  /** @type {!five.CalendarApi} */
  this.calendarApi_ = five.CalendarApi.get(this.appContext_);

  /** @type {!five.NotificationManager} */
  this.notificationManager_ = five.NotificationManager.get(this.appContext_);

  /** @type {Object} */
  this.calendarData_ = calendarData;

  /** @type {!Array.<!five.Event>} */
  this.removedEvents_ = [];

  /** @type {goog.events.EventHandler} */
  this.eventHandler = new goog.events.EventHandler(this);
};
goog.inherits(five.CalendarManager, goog.events.EventTarget);

/** @enum {string} */
five.CalendarManager.EventType = {
  EVENTS_CHANGED: goog.events.getUniqueId('eventschanged'),
  REQUESTS_STATE_CHANGED: goog.events.getUniqueId('requestsstatechanged'),
  MUTATIONS_STATE_CHANGED: goog.events.getUniqueId('mutationsstatechanged')
};

five.CalendarManager.EVENTS_LOAD_ERROR_ =
    'Error loading events. Please try again.';

five.CalendarManager.EVENTS_SAVE_ERROR_ =
    'Error saving events. Please try again.';

five.CalendarManager.EVENT_CREATE_ERROR_ =
    'Error creating event. Please try again.';

five.CalendarManager.EVENT_DELETE_ERROR_ =
    'Error deleting event. Please try again.';

/** @type {goog.debug.Logger} */
five.CalendarManager.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.CalendarManager');

/** @type {Array.<!five.Event>} */
five.CalendarManager.prototype.events_;

/** @type {number} */
five.CalendarManager.prototype.numRequestsInProgress_ = 0;

/** @type {boolean} */
five.CalendarManager.prototype.hasMutations_ = false;

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
  this.requestStarted_();
  return this.calendarApi_.loadEvents(this.calendarData_['id'], startDate,
      endDate).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#events');
        this.updateEventsData_(resp['items'] || []);
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

five.CalendarManager.prototype.saveMutations = function() {
  if (!this.hasMutations()) {
    return;
  }
  goog.array.forEach(this.events_, function(event) {
    if (event.isNew()) {
      this.createEvent_(event);
    } else if (event.hasMutations()) {
      this.saveMutatedEvent_(event);
    }
  }, this);
  goog.array.forEach(this.removedEvents_, function(event) {
    this.deleteEvent_(event);
  }, this);
};

/** @param {five.Event} event */
five.CalendarManager.prototype.createEvent_ = function(event) {
  goog.asserts.assert(event.isNew());
  this.requestStarted_();
  this.calendarApi_.createEvent(this.calendarData_['id'], event.startCreate()).
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

/** @param {five.Event} event */
five.CalendarManager.prototype.saveMutatedEvent_ = function(event) {
  goog.asserts.assert(event.hasMutations());
  this.requestStarted_();
  this.calendarApi_.saveEvent(this.calendarData_['id'],
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

/** @param {five.Event} event */
five.CalendarManager.prototype.deleteEvent_ = function(event) {
  this.requestStarted_();
  if (event.isNew()) {
    this.eventDeleted_(event);
    this.requestEnded_();
    return;
  }
  this.calendarApi_.deleteEvent(this.calendarData_['id'], event.startDelete()).
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
