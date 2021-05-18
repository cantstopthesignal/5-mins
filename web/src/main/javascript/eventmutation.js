// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventMutation');
goog.provide('five.EventMutation.MoveBy');

goog.require('goog.asserts');
goog.require('goog.Disposable');


/**
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {goog.Disposable}
 */
five.EventMutation = function(opt_locked) {
  goog.base(this);

  /** @type {boolean} */
  this.locked_ = opt_locked || false;
};
goog.inherits(five.EventMutation, goog.Disposable);

/** @enum {number} */
five.EventMutation.SortIndex = {
  REPLACE_TEXT: 0,
  DEFAULT: 1
};

/**
 * @param {Object} state
 * @return {!five.EventMutation}
 */
five.EventMutation.fromPreservedState = function(state) {
  var type = state['type'];
  if (type == five.EventMutation.MoveBy.TYPE_) {
    return five.EventMutation.MoveBy.fromPreservedState(state);
  } else if (type == five.EventMutation.MoveStartBy.TYPE_) {
    return five.EventMutation.MoveStartBy.fromPreservedState(state);
  } else if (type == five.EventMutation.MoveEndBy.TYPE_) {
    return five.EventMutation.MoveEndBy.fromPreservedState(state);
  } else if (type == five.EventMutation.SetTimeRange.TYPE_) {
    return five.EventMutation.SetTimeRange.fromPreservedState(state);
  } else if (type == five.EventMutation.ChangeSummary.TYPE_) {
    return five.EventMutation.ChangeSummary.fromPreservedState(state);
  } else {
    goog.asserts.fail('Unexpected state :' + state);
  }
};

/** @param {boolean} locked */
five.EventMutation.prototype.setLocked = function(locked) {
  this.locked_ = locked;
};

/** @return {boolean} */
five.EventMutation.prototype.isLocked = function() {
  return this.locked_;
};

/** @return {number} */
five.EventMutation.prototype.getSortIndex = function() {
  return five.EventMutation.SortIndex.DEFAULT;
};

/** @return {!five.EventMutation} */
five.EventMutation.prototype.clone = goog.abstractMethod;

/** @return {!Object} */
five.EventMutation.prototype.preserveState = goog.abstractMethod;

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.IntervalMutation_ = function(interval, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {goog.date.Interval} */
  this.interval_ = interval;
};
goog.inherits(five.EventMutation.IntervalMutation_, five.EventMutation);

/** @return {goog.date.Interval} */
five.EventMutation.IntervalMutation_.prototype.getInterval = function() {
  return this.interval_;
};

five.EventMutation.IntervalMutation_.prototype.preserveState = function() {
  return {
    'interval': this.interval_.toIsoString()
  };
};

/**
 * @param {string} text
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.ReplaceTextMutation_ = function(text, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {string} */
  this.text_ = text;
};
goog.inherits(five.EventMutation.ReplaceTextMutation_, five.EventMutation);

/** @return {string} */
five.EventMutation.ReplaceTextMutation_.prototype.getText = function() {
  return this.text_;
};

/** @override */
five.EventMutation.ReplaceTextMutation_.prototype.getSortIndex = function() {
  return five.EventMutation.SortIndex.REPLACE_TEXT;
};

five.EventMutation.ReplaceTextMutation_.prototype.preserveState = function() {
  return {
    'text': this.text_
  };
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveBy, five.EventMutation.IntervalMutation_);

/** @type {!string} */
five.EventMutation.MoveBy.TYPE_ = 'MoveBy';

/**
 * @param {Object} state
 * @return {!five.EventMutation.MoveBy}
 */
five.EventMutation.MoveBy.fromPreservedState = function(state) {
  var interval = goog.date.Interval.fromIsoString(goog.asserts.assertString(state['interval']));
  return new five.EventMutation.MoveBy(interval);
};

/** @override */
five.EventMutation.MoveBy.prototype.clone = function() {
  return new five.EventMutation.MoveBy(this.getInterval().clone(),
      this.isLocked());
};

five.EventMutation.MoveBy.prototype.preserveState = function() {
  var state = goog.base(this, 'preserveState');
  state['type'] = five.EventMutation.MoveBy.TYPE_;
  return state;
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveStartBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveStartBy,
    five.EventMutation.IntervalMutation_);

/** @type {!string} */
five.EventMutation.MoveStartBy.TYPE_ = 'MoveStartBy';

/**
 * @param {Object} state
 * @return {!five.EventMutation.MoveStartBy}
 */
five.EventMutation.MoveStartBy.fromPreservedState = function(state) {
  var interval = goog.date.Interval.fromIsoString(goog.asserts.assertString(state['interval']));
  return new five.EventMutation.MoveStartBy(interval);
};

/** @override */
five.EventMutation.MoveStartBy.prototype.clone = function() {
  return new five.EventMutation.MoveStartBy(this.getInterval().clone(),
      this.isLocked());
};

five.EventMutation.MoveStartBy.prototype.preserveState = function() {
  var state = goog.base(this, 'preserveState');
  state['type'] = five.EventMutation.MoveStartBy.TYPE_;
  return state;
};

/**
 * @param {goog.date.Interval} interval
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.IntervalMutation_}
 */
five.EventMutation.MoveEndBy = function(interval, opt_locked) {
  goog.base(this, interval, opt_locked);
};
goog.inherits(five.EventMutation.MoveEndBy,
    five.EventMutation.IntervalMutation_);

/** @type {!string} */
five.EventMutation.MoveEndBy.TYPE_ = 'MoveEndBy';

/**
 * @param {Object} state
 * @return {!five.EventMutation.MoveEndBy}
 */
five.EventMutation.MoveEndBy.fromPreservedState = function(state) {
  var interval = goog.date.Interval.fromIsoString(goog.asserts.assertString(state['interval']));
  return new five.EventMutation.MoveEndBy(interval);
};

/** @override */
five.EventMutation.MoveEndBy.prototype.clone = function() {
  return new five.EventMutation.MoveEndBy(this.getInterval().clone(),
      this.isLocked());
};

five.EventMutation.MoveEndBy.prototype.preserveState = function() {
  var state = goog.base(this, 'preserveState');
  state['type'] = five.EventMutation.MoveEndBy.TYPE_;
  return state;
};

/**
 * @param {!goog.date.DateTime} startTime
 * @param {!goog.date.DateTime} endTime
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation}
 */
five.EventMutation.SetTimeRange = function(startTime, endTime, opt_locked) {
  goog.base(this, opt_locked);

  /** @type {!goog.date.DateTime} */
  this.startTime_ = startTime;

  /** @type {!goog.date.DateTime} */
  this.endTime_ = endTime;
};
goog.inherits(five.EventMutation.SetTimeRange, five.EventMutation);

/** @type {!string} */
five.EventMutation.SetTimeRange.TYPE_ = 'SetTimeRange';

/**
 * @param {Object} state
 * @return {!five.EventMutation.SetTimeRange}
 */
five.EventMutation.SetTimeRange.fromPreservedState = function(state) {
  var startTime = new goog.date.DateTime(
      new Date(goog.asserts.assertNumber(state['startTime'])));
  var endTime = new goog.date.DateTime(
      new Date(goog.asserts.assertNumber(state['endTime'])));
  return new five.EventMutation.SetTimeRange(startTime, endTime);
};

/** @return {!goog.date.DateTime} */
five.EventMutation.SetTimeRange.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {!goog.date.DateTime} */
five.EventMutation.SetTimeRange.prototype.getEndTime = function() {
  return this.endTime_;
};

five.EventMutation.SetTimeRange.prototype.preserveState = function() {
  return {
    'type': five.EventMutation.SetTimeRange.TYPE_,
    'startTime': this.startTime_.getTime(),
    'endTime': this.endTime_.getTime()
  };
};

/**
 * @param {string} text
 * @param {boolean=} opt_locked
 * @constructor
 * @extends {five.EventMutation.ReplaceTextMutation_}
 */
five.EventMutation.ChangeSummary = function(text, opt_locked) {
  goog.base(this, text, opt_locked);
};
goog.inherits(five.EventMutation.ChangeSummary,
    five.EventMutation.ReplaceTextMutation_);

/** @type {!string} */
five.EventMutation.ChangeSummary.TYPE_ = 'ChangeSummary';

/**
 * @param {Object} state
 * @return {!five.EventMutation.ChangeSummary}
 */
five.EventMutation.ChangeSummary.fromPreservedState = function(state) {
  var text = goog.asserts.assertString(state['text']);
  return new five.EventMutation.ChangeSummary(text);
};

/** @override */
five.EventMutation.ChangeSummary.prototype.clone = function() {
  return new five.EventMutation.ChangeSummary(this.getText(),
      this.isLocked());
};

five.EventMutation.ChangeSummary.prototype.preserveState = function() {
  var state = goog.base(this, 'preserveState');
  state['type'] = five.EventMutation.ChangeSummary.TYPE_;
  return state;
};
