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
 * @param calendarApi {five.CalendarApi}
 * @param calendarData {Object}
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.CalendarManager = function(calendarApi, calendarData) {
  goog.base(this);

  /** @type {five.CalendarApi} */
  this.calendarApi_ = calendarApi;

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
}

/** @type {Array.<five.Event>} */
five.CalendarManager.prototype.events_;

/** @type {boolean} */
five.CalendarManager.prototype.hasRequestsInProgress_ = false;

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
  return this.hasRequestsInProgress_;
};

/**
 * @param {goog.date.DateTime} startDate
 * @param {goog.date.DateTime} endDate
 * @return {goog.async.Deferred}
 */
five.CalendarManager.prototype.loadEvents = function(startDate, endDate) {
  this.updateHasRequestsInProgress_(true);
  return this.calendarApi_.loadEvents(this.calendarData_['id'], startDate,
      endDate).
      addCallback(function(resp) {
        goog.asserts.assert(resp['kind'] == 'calendar#events');
        this.updateEventsData_(resp['items'] || []);
        this.updateHasRequestsInProgress_(false);
        return this.events_;
      }, this);
};

five.CalendarManager.prototype.saveMutations = function() {
  if (!this.hasMutations()) {
    return;
  }
};

/** @param {boolean} requestsInProgress */
five.CalendarManager.prototype.updateHasRequestsInProgress_ = function(
    requestsInProgress) {
  goog.asserts.assert(this.hasRequestsInProgress() != requestsInProgress);
  this.hasRequestsInProgress_ = requestsInProgress;
  this.dispatchEvent(five.CalendarManager.EventType.
      REQUESTS_STATE_CHANGED);
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
