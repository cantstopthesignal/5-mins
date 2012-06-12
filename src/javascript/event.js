// Copyright cantstopthesignals@gmail.com

goog.provide('five.Event');
goog.provide('five.Event.EventType');

goog.require('five.EventMoveEvent');
goog.require('five.EventMutation');
goog.require('goog.array');
goog.require('goog.date.DateTime');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @param {Object} eventData
 * @extends {goog.events.EventTarget}
 */
five.Event = function(eventData) {
  goog.base(this);

  /** @type {Object} */
  this.eventData_ = eventData;

  /** @type {Array.<five.EventCard>} */
  this.displays_ = [];

  /** @type {Array.<five.EventMutation>} */
  this.mutations_ = [];

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);

  this.parseEventData_();
};
goog.inherits(five.Event, goog.events.EventTarget);

/** @enum {string} */
five.Event.EventType = {
  SELECT: goog.events.getUniqueId('select'),
  DESELECT: goog.events.getUniqueId('deselect'),
  MOVE: five.EventMoveEvent.EventType.MOVE,
  MUTATIONS_CHANGED: goog.events.getUniqueId('mutations_changed'),
  DATA_CHANGED: goog.events.getUniqueId('data_changed')
};

/** @return {goog.date.DateTime} */
five.Event.parseEventDataDate_ = function(dateData) {
  if ('dateTime' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['dateTime']);
    return new goog.date.DateTime(new Date(dateStr));
  } else if ('date' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['date']);
    return new goog.date.DateTime(new Date(dateStr));
  }
  goog.asserts.fail('Unexpected date data');
  return null;
};

/** @type {boolean} */
five.Event.prototype.selected_ = false;

/** @type {goog.date.DateTime} */
five.Event.prototype.startTime_;

/** @type {goog.date.DateTime} */
five.Event.prototype.endTime_;

/** @type {goog.date.DateTime} */
five.Event.prototype.mutatedStartTime_;

/** @type {goog.date.DateTime} */
five.Event.prototype.mutatedEndTime_;

/** @return {goog.date.DateTime} */
five.Event.prototype.getStartTime = function() {
  return this.mutatedStartTime_ || this.startTime_;
};

/** @return {goog.date.DateTime} */
five.Event.prototype.getEndTime = function() {
  return this.mutatedEndTime_ || this.endTime_;
};

/** @return {string} */
five.Event.prototype.getSummary = function() {
  return this.eventData_['summary'] || '';
};

/** @param {five.EventCard} display */
five.Event.prototype.attachDisplay = function(display) {
  this.displays_.push(display);
  display.setSelected(this.selected_);
  var Event = five.Event.EventType;
  this.eventHandler_.
      listen(display, [Event.MOVE, Event.SELECT, Event.DESELECT],
          this.dispatchDisplayEvent_);
};

/** @param {five.EventCard} display */
five.Event.prototype.detachDisplay = function(display) {
  if (this.isDisposed()) {
    return;
  }
  goog.array.removeIf(this.displays_, function(existingDisplay) {
    return existingDisplay === display;
  });
};

/** @param {five.EventMutation} mutation */
five.Event.prototype.addMutation = function(mutation) {
  this.mutations_.push(mutation);
  this.updateMutations_();
};

five.Event.prototype.updateMutations_ = function() {
  this.calcMutations_();
  goog.array.forEach(this.displays_, function(display) {
    display.updateDisplay();
  }, this);
  this.dispatchEvent(five.Event.EventType.MUTATIONS_CHANGED);
};

/** @return {boolean} */
five.Event.prototype.hasMutations = function() {
  return this.mutations_.length > 0;
};

/** @return {Object} */
five.Event.prototype.getEventData = function() {
  return this.eventData_;
};

/** @return {Object} */
five.Event.prototype.startMutationPatch = function() {
  goog.asserts.assert(this.hasMutations());
  goog.asserts.assert(!goog.array.some(this.mutations_, function(mutation) {
    return mutation.isLocked();
  }));
  var patchData = {};
  patchData['etag'] = goog.asserts.assertString(this.eventData_['etag']);
  if (this.mutatedStartTime_ && goog.date.Date.compare(this.mutatedStartTime_,
      goog.asserts.assertObject(this.startTime_)) != 0) {
    patchData['start'] = {
      'dateTime': new Date(this.mutatedStartTime_.valueOf()).toISOString()
    };
  }
  if (this.mutatedEndTime_ && goog.date.Date.compare(this.mutatedEndTime_,
      goog.asserts.assertObject(this.endTime_)) != 0) {
    patchData['end'] = {
      'dateTime': new Date(this.mutatedEndTime_.valueOf()).toISOString()
    };
  }
  goog.array.forEach(this.mutations_, function(mutation) {
    mutation.setLocked(true);
  });
  return patchData;
};

/** @param {Object} eventData */
five.Event.prototype.endMutationPatch = function(eventData) {
  goog.asserts.assert(eventData['kind'] == 'calendar#event');
  goog.asserts.assert(this.eventData_['id'] == goog.asserts.assertString(
      eventData['id']));
  this.eventData_ = eventData;
  this.parseEventData_();

  // Remove all locked mutations, they should now be saved.
  goog.array.removeIf(this.mutations_, function(mutation) {
    return mutation.isLocked();
  });
  // TODO: Verify that response data matches expectations for in progress patch.

  this.updateMutations_();
  this.dispatchEvent(five.Event.EventType.DATA_CHANGED);
};

five.Event.prototype.parseEventData_ = function() {
  this.startTime_ = five.Event.parseEventDataDate_(this.eventData_['start']);
  this.endTime_ = five.Event.parseEventDataDate_(this.eventData_['end']);
};

/** @override */
five.Event.prototype.disposeInternal = function() {
  delete this.displays_;
  delete this.mutations_;
  goog.base(this, 'disposeInternal');
};

/** @return {boolean} */
five.Event.prototype.isSelected = function() {
  return this.selected_;
};

/** @param {boolean} selected */
five.Event.prototype.setSelected = function(selected) {
  this.selected_ = selected;
  goog.array.forEach(this.displays_, function(display) {
    display.setSelected(this.selected_);
  }, this);
};

/** @param {goog.events.Event} e */
five.Event.prototype.dispatchDisplayEvent_ = function(e) {
  e.target = this;
  if (!this.dispatchEvent(e)) {
    e.preventDefault();
  }
};

five.Event.prototype.calcMutations_ = function() {
  this.collapseMutations_();
  this.mutatedStartTime_ = this.startTime_.clone();
  this.mutatedEndTime_ = this.endTime_.clone();
  goog.array.forEach(this.mutations_, function(mutation) {
    if (mutation instanceof five.EventMutation.MoveBy) {
      this.mutatedStartTime_.add(mutation.getInterval());
      this.mutatedEndTime_.add(mutation.getInterval());
    } else if (mutation instanceof five.EventMutation.MoveStartBy) {
      this.mutatedStartTime_.add(mutation.getInterval());
    } else if (mutation instanceof five.EventMutation.MoveEndBy) {
      this.mutatedEndTime_.add(mutation.getInterval());
    } else {
      goog.asserts.fail('Unexpected mutation: ' + mutation);
    }
  }, this);
};

five.Event.prototype.collapseMutations_ = function() {
  var newMutations = [];
  var topMutation = null;
  goog.array.forEach(this.mutations_, function(mutation) {
    if (!topMutation) {
      topMutation = mutation;
      return;
    }
    var mergedMutation = this.maybeGetMergedMutation_(topMutation, mutation);
    if (mergedMutation) {
      topMutation = mergedMutation;
    } else {
      newMutations.push(topMutation);
      topMutation = mutation;
    }
  }, this);
  if (topMutation) {
    newMutations.push(topMutation);
  }
  this.mutations_ = newMutations;
};

/**
 * @return {five.EventMutation} A merged mutation or null if no merge is
 *     possible.
 */
five.Event.prototype.maybeGetMergedMutation_ = function(mutation1, mutation2) {
  if (mutation1.isLocked() || mutation2.isLocked()) {
    return null;
  }
  if (mutation1 instanceof five.EventMutation.MoveBy) {
    if (mutation2 instanceof five.EventMutation.MoveBy) {
      var interval = mutation1.getInterval().clone();
      interval.add(mutation2.getInterval());
      return new five.EventMutation.MoveBy(interval);
    }
  } else if (mutation1 instanceof five.EventMutation.MoveStartBy) {
    if (mutation2 instanceof five.EventMutation.MoveStartBy) {
      var interval = mutation1.getInterval().clone();
      interval.add(mutation2.getInterval());
      return new five.EventMutation.MoveStartBy(interval);
    }
  } else if (mutation1 instanceof five.EventMutation.MoveEndBy) {
    if (mutation2 instanceof five.EventMutation.MoveEndBy) {
      var interval = mutation1.getInterval().clone();
      interval.add(mutation2.getInterval());
      return new five.EventMutation.MoveEndBy(interval);
    }
  }

  return null;
}
