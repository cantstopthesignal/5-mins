// Copyright cantstopthesignals@gmail.com

goog.provide('five.Event');
goog.provide('five.Event.EventType');

goog.require('five.EventEditEvent');
goog.require('five.EventMoveEvent');
goog.require('five.EventMutation');
goog.require('five.EventsProposeEvent');
goog.require('five.EventSnapToEvent');
goog.require('goog.array');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @param {Object} eventData
 * @param {boolean=} opt_isNew
 * @extends {goog.events.EventTarget}
 */
five.Event = function(eventData, opt_isNew) {
  goog.base(this);

  /** @type {Object} */
  this.eventData_ = eventData;

  /** @type {boolean} */
  this.isNew_ = opt_isNew || false;

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
  DATA_CHANGED: goog.events.getUniqueId('data_changed'),
  DELETE: goog.events.getUniqueId('delete'),
  DESELECT: goog.events.getUniqueId('deselect'),
  DUPLICATE: goog.events.getUniqueId('duplicate'),
  EDIT: five.EventEditEvent.EventType.EDIT,
  MOVE: five.EventMoveEvent.EventType.MOVE,
  MUTATIONS_CHANGED: goog.events.getUniqueId('mutations_changed'),
  PROPOSE: five.EventsProposeEvent.EventType.PROPOSE,
  SELECT: goog.events.getUniqueId('select'),
  SNAP_TO: five.EventSnapToEvent.EventType.SNAP_TO
};

/** @enum {string} */
five.Event.SummaryType = {
  DEFAULT: 'default',
  TODO: 'todo'
};

/**
 * @param {!goog.date.DateTime} startTime
 * @param {!goog.date.DateTime} endTime
 * @param {!string} summary
 * @return {!five.Event}
 */
five.Event.createNew = function(startTime, endTime, summary) {
  var eventData = {
    'summary': summary,
    'start': {
      'dateTime': new Date(startTime.valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(endTime.valueOf()).toISOString()
    }
  };
  return new five.Event(eventData, true);
};

/**
 * @param {Object} state
 * @return {!five.Event}
 */
five.Event.fromPreservedState = function(state) {
  var isNew = state['isNew'];
  var eventData = state['eventData'];
  var event = new five.Event(eventData, isNew);
  for (var mutationState of state['mutations']) {
    event.addMutation(five.EventMutation.fromPreservedState(mutationState));
  }
  return event;
};

/** @return {!goog.date.DateTime} */
five.Event.parseEventDataDate = function(dateData) {
  if ('dateTime' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['dateTime']);
    return new goog.date.DateTime(new Date(dateStr));
  } else if ('date' in dateData) {
    var dateStr = goog.asserts.assertString(dateData['date']);
    return new goog.date.DateTime(new Date(dateStr));
  }
  throw Error('Unexpected date data');
};

/**
 * @constructor
 * @param summary {string}
 * @param shortenedSummary {string}
 * @param type {five.Event.SummaryType}
 * @param isEstimate {boolean}
 */
five.Event.SummaryInfo = function(summary, shortenedSummary, type,
    isEstimate) {
  /** @type {string} */
  this.summary_ = summary;

  /** @type {string} */
  this.shortenedSummary_ = shortenedSummary;

  /** @type {five.Event.SummaryType} */
  this.type_ = type;

  /** @type {boolean} */
  this.isEstimate_ = isEstimate;
};

five.Event.SummaryInfo.TODO_PREFIX = '[todo] ';

five.Event.SummaryInfo.ESTIMATE_SUFFIX = ' (estimate)';

/**
 * @param summary {string}
 * @return {!five.Event.SummaryInfo}
 */
five.Event.SummaryInfo.fromSummary = function(summary) {
  var TODO_PREFIX = five.Event.SummaryInfo.TODO_PREFIX;
  var ESTIMATE_SUFFIX = five.Event.SummaryInfo.ESTIMATE_SUFFIX;
  var type = five.Event.SummaryType.DEFAULT;
  var shortenedSummary = summary;
  if (shortenedSummary.toLowerCase().startsWith(TODO_PREFIX)) {
    shortenedSummary = shortenedSummary.substring(TODO_PREFIX.length);
    type = five.Event.SummaryType.TODO;
  }
  var isEstimate = false;
  if (shortenedSummary.toLowerCase().endsWith(ESTIMATE_SUFFIX)) {
    shortenedSummary = shortenedSummary.substring(
        0, shortenedSummary.length - ESTIMATE_SUFFIX.length);
    isEstimate = true;
  }
  return new five.Event.SummaryInfo(summary, shortenedSummary, type, isEstimate);
};

/**
 * @param shortenedSummary {string}
 * @param type {five.Event.SummaryType}
 * @param isEstimate {boolean}
 * @return {!five.Event.SummaryInfo}
 */
five.Event.SummaryInfo.fromShortenedSummary = function(shortenedSummary, type,
    isEstimate) {
  var TODO_PREFIX = five.Event.SummaryInfo.TODO_PREFIX;
  var ESTIMATE_SUFFIX = five.Event.SummaryInfo.ESTIMATE_SUFFIX;
  var summary = shortenedSummary;
  if (type == five.Event.SummaryType.TODO) {
    summary = TODO_PREFIX + summary;
  }
  if (isEstimate) {
    summary = summary + ESTIMATE_SUFFIX;
  }
  return new five.Event.SummaryInfo(summary, shortenedSummary, type, isEstimate);
};

/**
 * @param summaryInfo {five.Event.SummaryInfo}
 * @return {!five.Event.SummaryInfo}
 */
five.Event.SummaryInfo.toggleTodo = function(summaryInfo) {
  var newType = five.Event.SummaryType.DEFAULT;
  if (summaryInfo.getType() == five.Event.SummaryType.DEFAULT) {
    newType = five.Event.SummaryType.TODO;
  }
  return five.Event.SummaryInfo.fromShortenedSummary(
    summaryInfo.getShortenedSummary(), newType, summaryInfo.isEstimate());
};

/**
 * @param summaryInfo {five.Event.SummaryInfo}
 * @return {!five.Event.SummaryInfo}
 */
five.Event.SummaryInfo.toggleIsEstimate = function(summaryInfo) {
  return five.Event.SummaryInfo.fromShortenedSummary(
      summaryInfo.getShortenedSummary(), summaryInfo.getType(), !summaryInfo.isEstimate());
};

/** @return {string} */
five.Event.SummaryInfo.prototype.getSummary = function() {
  return this.summary_;
};

/** @return {string} */
five.Event.SummaryInfo.prototype.getShortenedSummary = function() {
  return this.shortenedSummary_;
};

/** @return {five.Event.SummaryType} */
five.Event.SummaryInfo.prototype.getType = function() {
  return this.type_;
};

/** @return {boolean} */
five.Event.SummaryInfo.prototype.isEstimate = function() {
  return this.isEstimate_;
};

/** @return {!Array.<number>} */
five.Event.SummaryInfo.prototype.getShortenedSummaryRange = function() {
  var TODO_PREFIX = five.Event.SummaryInfo.TODO_PREFIX;
  var ESTIMATE_SUFFIX = five.Event.SummaryInfo.ESTIMATE_SUFFIX;
  var range = [0, this.summary_.length];
  if (this.type_ == five.Event.SummaryType.TODO) {
    range[0] += TODO_PREFIX.length;
  }
  if (this.isEstimate_) {
    range[1] -= ESTIMATE_SUFFIX.length;
  }
  return range;
};

/** @type {boolean} */
five.Event.prototype.selected_ = false;

/** @type {boolean} */
five.Event.prototype.proposed_ = false;

/** @type {!goog.date.DateTime} */
five.Event.prototype.startTime_;

/** @type {!goog.date.DateTime} */
five.Event.prototype.endTime_;

/** @type {goog.date.DateTime} */
five.Event.prototype.mutatedStartTime_;

/** @type {goog.date.DateTime} */
five.Event.prototype.mutatedEndTime_;

/** @type {string} */
five.Event.prototype.mutatedSummary_;

/** @type {five.Event} */
five.Event.prototype.insertAfter_;

/** @return {!goog.date.DateTime} */
five.Event.prototype.getStartTime = function() {
  return this.mutatedStartTime_ || this.startTime_;
};

/** @return {!goog.date.DateTime} */
five.Event.prototype.getEndTime = function() {
  return this.mutatedEndTime_ || this.endTime_;
};

/** @return {string} */
five.Event.prototype.getSummary = function() {
  if (goog.isString(this.mutatedSummary_)) {
    return this.mutatedSummary_;
  }
  return this.eventData_['summary'] || '';
};

/** @return {!Array.<string>} */
five.Event.prototype.getSplitSummaries = function() {
  return this.getSummary().split(new RegExp(";[ ]?"));
};

/** @return {number} */
five.Event.prototype.getDuration = function() {
  return this.getEndTime().getTime() - this.getStartTime().getTime();
};

/** @param {five.EventCard} display */
five.Event.prototype.attachDisplay = function(display) {
  this.displays_.push(display);
  display.setSelected(this.selected_);
  display.setProposed(this.proposed_);
  var EventType = five.Event.EventType;
  this.eventHandler_.
      listen(display, [EventType.SELECT, EventType.DESELECT, EventType.EDIT],
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

/** @param {five.Event} otherEvent */
five.Event.prototype.setInsertAfter = function(otherEvent) {
  this.insertAfter_ = otherEvent;
};

/** @return {five.Event} */
five.Event.prototype.getInsertAfter = function() {
  return this.insertAfter_;
};

/** @return {!five.Event} */
five.Event.prototype.duplicate = function() {
  var eventData = {
    'summary': this.getSummary(),
    'start': {
      'dateTime': new Date(this.getStartTime().valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(this.getEndTime().valueOf()).toISOString()
    }
  };
  var newEvent = new five.Event(eventData, true);
  newEvent.setInsertAfter(this);
  return newEvent;
};

/**
 * @param {five.EventMutation} mutation
 * @return {boolean} Whether the mutation was accepted.
 */
five.Event.prototype.addMutation = function(mutation) {
  goog.asserts.assert(this.stateIsValid_());
  this.mutations_.push(mutation);
  this.calcMutations_(false);
  var mutationValid = this.stateIsValid_();
  if (!mutationValid) {
    // Rollback the mutation, it caused state to be invalid.
    this.mutations_.pop();
  }
  this.updateMutations_();
  return mutationValid;
};

five.Event.prototype.updateMutations_ = function() {
  this.calcMutations_(true);
  goog.asserts.assert(this.stateIsValid_());
  goog.array.forEach(this.displays_, function(display) {
    display.updateDisplay();
  }, this);
  this.dispatchEvent(five.Event.EventType.MUTATIONS_CHANGED);
};

/** @return {boolean} */
five.Event.prototype.hasMutations = function() {
  return this.mutations_.length > 0 || this.isNew_;
};

/** @return {boolean} */
five.Event.prototype.isNew = function() {
  return this.isNew_;
};

/** @return {Object} */
five.Event.prototype.getEventData = function() {
  return this.eventData_;
};

/** @return {Object} */
five.Event.prototype.startMutationPatch = function() {
  goog.asserts.assert(this.hasMutations());
  goog.asserts.assert(!this.isNew());
  goog.asserts.assert(!goog.array.some(this.mutations_, function(mutation) {
    return mutation.isLocked();
  }));
  var patchData = {};
  goog.asserts.assertString(this.eventData_['etag']);
  patchData['etag'] = this.eventData_['etag'];
  this.mergeMutationsIntoData_(patchData);
  goog.array.forEach(this.mutations_, function(mutation) {
    mutation.setLocked(true);
  });
  return patchData;
};

/** @param {Object} eventData */
five.Event.prototype.endMutationPatch = function(eventData) {
  goog.asserts.assert(eventData['kind'] == 'calendar#event');
  if (this.eventData_['id']) {
    goog.asserts.assert(this.eventData_['id'] == goog.asserts.assertString(
        eventData['id']));
  } else {
    goog.asserts.assertString(eventData['id']);
  }
  goog.asserts.assert(!this.isNew());
  this.endMutationOrCreate_(eventData);
};

five.Event.prototype.abortMutationPatch = function() {
  goog.asserts.assert(!this.isNew());
  this.abortMutationOrCreate_();
};

/** @return {Object} */
five.Event.prototype.startCreate = function() {
  goog.asserts.assert(this.hasMutations());
  goog.asserts.assert(this.isNew());
  goog.asserts.assert(!goog.array.some(this.mutations_, function(mutation) {
    return mutation.isLocked();
  }));
  var eventData = goog.asserts.assertObject(JSON.parse(goog.json.serialize(this.eventData_)));
  this.mergeMutationsIntoData_(eventData);
  goog.array.forEach(this.mutations_, function(mutation) {
    mutation.setLocked(true);
  });
  return eventData;
};

/** @param {Object} eventData */
five.Event.prototype.endCreate = function(eventData) {
  goog.asserts.assert(eventData['kind'] == 'calendar#event');
  goog.asserts.assert(this.isNew());
  this.isNew_ = false;
  this.endMutationOrCreate_(eventData);
};

five.Event.prototype.abortCreate = function() {
  goog.asserts.assert(this.isNew());
  this.abortMutationOrCreate_();
};

/** @param {Object} eventData */
five.Event.prototype.endMutationOrCreate_ = function(eventData) {
  goog.asserts.assert(eventData['kind'] == 'calendar#event');
  this.eventData_ = eventData;
  this.parseEventData_();

  // Remove all locked mutations, they should now be saved.
  this.mutations_ = goog.array.filter(this.mutations_, function(mutation) {
    return !mutation.isLocked();
  });
  // TODO: Verify that response data matches expectations for in progress patch.

  this.updateMutations_();
  this.dispatchEvent(five.Event.EventType.DATA_CHANGED);
};

five.Event.prototype.abortMutationOrCreate_ = function() {
  // Unlock all mutations
  goog.array.forEach(this.mutations_, function(mutation) {
    mutation.setLocked(false);
  });
  this.updateMutations_();
  this.dispatchEvent(five.Event.EventType.DATA_CHANGED);
};

/** @return {Object} */
five.Event.prototype.startDelete = function() {
  goog.asserts.assert(!this.isNew());
  var deleteData = {};
  deleteData['id'] = this.eventData_['id'];
  deleteData['originalId'] = this.eventData_['originalId'];
  deleteData['originalInstanceTime'] = this.eventData_['originalInstanceTime'];
  deleteData['etag'] = this.eventData_['etag'];
  return deleteData;
};

/** @return {Object} */
five.Event.prototype.preserveState = function() {
  return {
    'isNew': this.isNew_,
    'eventData': this.eventData_,
    'mutations': goog.array.map(this.mutations_, function(mutation) {
        return mutation.preserveState();
      })
  }
};

/** @return {boolean} Whether the current state of this event is valid. */
five.Event.prototype.stateIsValid_ = function() {
  var startTime = this.getStartTime();
  goog.asserts.assertObject(startTime);
  var endTime = this.getEndTime();
  goog.asserts.assertObject(endTime);
  if (goog.date.Date.compare(startTime, endTime) >= 0) {
    return false;
  }
  if (this.getSummary().trim().length == 0) {
    return false;
  }
  return true;
};

/** @param {Object} eventData */
five.Event.prototype.mergeMutationsIntoData_ = function(eventData) {
  if (this.mutatedStartTime_ && goog.date.Date.compare(this.mutatedStartTime_,
      goog.asserts.assertObject(this.startTime_)) != 0) {
    eventData['start'] = {
      'dateTime': new Date(this.mutatedStartTime_.valueOf()).toISOString()
    };
  }
  if (this.mutatedEndTime_ && goog.date.Date.compare(this.mutatedEndTime_,
      goog.asserts.assertObject(this.endTime_)) != 0) {
    eventData['end'] = {
      'dateTime': new Date(this.mutatedEndTime_.valueOf()).toISOString()
    };
  }
  if (goog.isString(this.mutatedSummary_) && this.mutatedSummary_ !=
      this.eventData_['summary']) {
    eventData['summary'] = this.mutatedSummary_;
  }
};

five.Event.prototype.parseEventData_ = function() {
  this.startTime_ = goog.asserts.assertObject(
      five.Event.parseEventDataDate(this.eventData_['start']));
  this.endTime_ = goog.asserts.assertObject(
      five.Event.parseEventDataDate(this.eventData_['end']));
  goog.asserts.assert(this.stateIsValid_());
};

/** @override */
five.Event.prototype.disposeInternal = function() {
  delete this.displays_;
  delete this.mutations_;
  delete this.insertAfter_;
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

/** @return {boolean} */
five.Event.prototype.isProposed = function() {
  return this.proposed_;
};

/** @param {boolean} proposed */
five.Event.prototype.setProposed = function(proposed) {
  this.proposed_ = proposed;
  goog.array.forEach(this.displays_, function(display) {
    display.setProposed(this.proposed_);
  }, this);
};

/** @param {goog.events.Event} e */
five.Event.prototype.dispatchDisplayEvent_ = function(e) {
  e.target = this;
  if (!this.dispatchEvent(e)) {
    e.preventDefault();
  }
};

/**
 * @param {boolean} collapse Whether to collapse mutations that can be merged.
 */
five.Event.prototype.calcMutations_ = function(collapse) {
  if (collapse) {
    this.collapseMutations_();
  }
  this.mutatedSummary_ = this.eventData_['summary'];
  this.mutatedStartTime_ = this.startTime_.clone();
  this.mutatedEndTime_ = this.endTime_.clone();
  var newMutations = [];
  goog.array.forEach(this.mutations_, function(mutation) {
    if (mutation instanceof five.EventMutation.MoveBy) {
      if (mutation.getInterval().isZero()) {
        return;
      }
      this.mutatedStartTime_.add(mutation.getInterval());
      this.mutatedEndTime_.add(mutation.getInterval());
    } else if (mutation instanceof five.EventMutation.MoveStartBy) {
      if (mutation.getInterval().isZero()) {
        return;
      }
      this.mutatedStartTime_.add(mutation.getInterval());
    } else if (mutation instanceof five.EventMutation.MoveEndBy) {
      if (mutation.getInterval().isZero()) {
        return;
      }
      this.mutatedEndTime_.add(mutation.getInterval());
    } else if (mutation instanceof five.EventMutation.SetTimeRange) {
      if (!goog.date.Date.compare(
              goog.asserts.assertObject(this.mutatedStartTime_),
              mutation.getStartTime()) &&
          !goog.date.Date.compare(
              goog.asserts.assertObject(this.mutatedEndTime_),
              mutation.getEndTime())) {
        return;
      }
      this.mutatedStartTime_ = mutation.getStartTime().clone();
      this.mutatedEndTime_ = mutation.getEndTime().clone();
    } else if (mutation instanceof five.EventMutation.ChangeSummary) {
      if (this.mutatedSummary_ == mutation.getText()) {
        return;
      }
      this.mutatedSummary_ = mutation.getText();
    } else {
      goog.asserts.fail('Unexpected mutation: ' + mutation);
    }
    if (collapse) {
      newMutations.push(mutation);
    }
  }, this);
  if (collapse) {
    this.mutations_ = newMutations;
  }
};

five.Event.prototype.collapseMutations_ = function() {
  var newMutations = [];
  var sortedMutations = goog.array.clone(this.mutations_);
  goog.array.stableSort(sortedMutations, function(a, b) {
    return a.getSortIndex() - b.getSortIndex();
  });
  var topMutation = null;
  goog.array.forEach(sortedMutations, function(mutation) {
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
 *     possible.  mutation1 or mutation2 can also be returned to ignore
 *     the other.
 */
five.Event.prototype.maybeGetMergedMutation_ = function(mutation1, mutation2) {
  if (mutation1.isLocked() || mutation2.isLocked()) {
    return null;
  }
  if (mutation2 instanceof five.EventMutation.SetTimeRange) {
    if (mutation1 instanceof five.EventMutation.MoveBy ||
        mutation1 instanceof five.EventMutation.MoveStartBy ||
        mutation1 instanceof five.EventMutation.MoveEndBy ||
        mutation1 instanceof five.EventMutation.SetTimeRange) {
      return mutation2;
    }
  } else if (mutation1 instanceof five.EventMutation.MoveBy) {
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
  } else if (mutation1 instanceof five.EventMutation.ChangeSummary) {
    if (mutation2 instanceof five.EventMutation.ChangeSummary) {
      return mutation2;
    }
  }
  return null;
};
