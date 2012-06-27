// Copyright cantstopthesignals@gmail.com

goog.provide('five.CalendarManager');

goog.require('five.Event');
goog.require('five.EventMutation');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');


/**
 * @param calendarApi {!five.CalendarApi}
 * @param notificationManager {!five.NotificationManager}
 * @param calendarData {Object}
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.CalendarManager = function(calendarApi, notificationManager,
    calendarData) {
  goog.base(this);

  /** @type {!five.CalendarApi} */
  this.calendarApi_ = calendarApi;

  /** @type {!five.NotificationManager} */
  this.notificationManager_ = notificationManager;

  /** @type {Object} */
  this.calendarData_ = calendarData;

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

/** @type {Array.<five.Event>} */
five.CalendarManager.prototype.events_;

/** @type {number} */
five.CalendarManager.prototype.numRequestsInProgress_ = 0;

/** @type {boolean} */
five.CalendarManager.prototype.hasMutations_ = false;

/** @override */
five.CalendarManager.prototype.disposeInternal = function() {
  goog.disposeAll(this.events_);
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
      addErrback(function() {
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
      addErrback(function() {
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
      addErrback(function() {
        event.abortMutationPatch();
        this.requestEnded_();
        this.notificationManager_.show(
            five.CalendarManager.EVENTS_SAVE_ERROR_);
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

/** @param {Array.<Object>} eventsData */
five.CalendarManager.prototype.updateEventsData_ = function(eventsData) {
  goog.disposeAll(this.events_);
  this.events_ = goog.array.map(eventsData, function(eventData) {
    var event = new five.Event(eventData);
    this.registerListenersForEvent_(event);
    return event;
  }, this);
  this.dispatchEvent(five.CalendarManager.EventType.
      EVENTS_CHANGED);
  this.updateHasMutations_();
};

five.CalendarManager.prototype.updateHasMutations_ = function() {
  var hadMutations = this.hasMutations_;
  this.hasMutations_ = goog.array.some(this.events_, function(event) {
    return event.hasMutations();
  });
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
