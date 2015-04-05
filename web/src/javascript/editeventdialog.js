// Copyright cantstopthesignals@gmail.com

goog.provide('five.EditEventDialog');

goog.require('five.Dialog');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.i18n.DateTimeFormat');
goog.require('goog.i18n.DateTimeParse');
goog.require('goog.ui.DatePicker');
goog.require('goog.ui.InputDatePicker');
goog.require('goog.ui.LabelInput');  // Fixes closure compile issue.


/**
 * @param {!five.AppContext} appContext
 * @param {five.Event} event
 * @param {boolean} newCreate
 * @constructor
 * @extends {five.Dialog}
 */
five.EditEventDialog = function(appContext, event, newCreate) {
  goog.base(this);

  /** @type {!five.AppContext} */
  this.appContext_ = appContext;

  /** @type {!five.NotificationManager} */
  this.notificationManager_ = five.NotificationManager.get(this.appContext_);

  /** @type {five.Event} */
  this.event_ = event;

  /** @type {boolean} */
  this.newCreate_ = newCreate;

  /** @type {Element} */
  this.summaryInputEl_;

  /** @type {goog.ui.InputDatePicker} */
  this.startDatePicker_;

  /** @type {string} */
  this.originalSummary_ = this.event_.getSummary();

  /** @type {!goog.date.DateTime} */
  this.originalStartTime_ = goog.asserts.assertObject(
      this.event_.getStartTime());

  /** @type {!goog.date.DateTime} */
  this.originalEndTime_ = goog.asserts.assertObject(this.event_.getEndTime());

  /** @type {goog.date.DateTime} */
  this.lastStartTime_ = this.event_.getStartTime();

  /** @type {five.EditEventDialog.TimePicker_} */
  this.startTimePicker_;

  /** @type {five.EditEventDialog.TimePicker_} */
  this.endTimePicker_;

  /** @type {Element} */
  this.oldFocusEl_;
};
goog.inherits(five.EditEventDialog, five.Dialog);

/** @enum {string} */
five.EditEventDialog.EventType = {
  DONE: goog.events.getUniqueId('done'),
  CANCEL: goog.events.getUniqueId('cancel'),
  EVENT_CHANGED: goog.events.getUniqueId('event_changed')
};

five.EditEventDialog.INVALID_SUMMARY_ERROR_ = 'Invalid summary.';

five.EditEventDialog.INVALID_START_TIME_ERROR_ = 'Invalid start time.';

five.EditEventDialog.INVALID_END_TIME_ERROR_ = 'Invalid end time.';

five.EditEventDialog.DATE_PATTERN_ = "yyyy'/'MM'/'dd";

five.EditEventDialog.TIME_PATTERN_ = "h':'mma";

five.EditEventDialog.TIME_PATTERN_HOURS_ = "ha";

five.EditEventDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var contentEl = this.getContentEl();

  goog.dom.classes.add(contentEl, 'edit-event-dialog');

  var headerEl = document.createElement('div');
  goog.dom.classes.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode(
      this.newCreate_ ? 'Create event' : 'Edit event'));
  contentEl.appendChild(headerEl);

  var summaryDiv = document.createElement('div');
  goog.dom.classes.add(summaryDiv, 'editor-row');
  var labelEl = document.createTextNode('Summary:');
  summaryDiv.appendChild(labelEl);
  this.summaryInputEl_ = document.createElement('input');
  this.summaryInputEl_.type = 'text';
  goog.dom.classes.add(this.summaryInputEl_, 'summary-input');
  summaryDiv.appendChild(this.summaryInputEl_);
  contentEl.appendChild(summaryDiv);

  this.startTimePicker_ = new five.EditEventDialog.TimePicker_();
  this.registerDisposable(this.startTimePicker_);
  this.startTimePicker_.setDate(this.event_.getStartTime());

  this.endTimePicker_ = new five.EditEventDialog.TimePicker_();
  this.registerDisposable(this.endTimePicker_);
  this.endTimePicker_.setDate(this.event_.getEndTime());
  this.endTimePicker_.setReverseInputOrder(true);

  var dateDiv = document.createElement('div');
  goog.dom.classes.add(dateDiv, 'editor-row');
  this.startTimePicker_.render(dateDiv);
  dateDiv.appendChild(document.createTextNode(' to '));
  this.endTimePicker_.render(dateDiv);
  contentEl.appendChild(dateDiv);

  var doneButtonEl = document.createElement('div');
  goog.dom.classes.add(doneButtonEl, 'button');
  this.eventHandler.listen(doneButtonEl, goog.events.EventType.CLICK,
      this.handleDoneClick_);
  doneButtonEl.appendChild(document.createTextNode('Done'));
  contentEl.appendChild(doneButtonEl);

  var cancelButtonEl = document.createElement('div');
  goog.dom.classes.add(cancelButtonEl, 'button');
  this.eventHandler.listen(cancelButtonEl, goog.events.EventType.CLICK,
      this.handleCancelClick_);
  cancelButtonEl.appendChild(document.createTextNode('Cancel'));
  contentEl.appendChild(cancelButtonEl);

  this.eventHandler.
      listen(this.el, goog.events.EventType.KEYUP, this.handleKeyUp_).
      listen(this.summaryInputEl_, goog.events.EventType.KEYUP,
          this.handleSummaryChanged_).
      listen(this.startTimePicker_,
          five.EditEventDialog.TimePicker_.EventType.CHANGE,
          this.handleStartTimeChanged_).
      listen(this.endTimePicker_,
          five.EditEventDialog.TimePicker_.EventType.CHANGE,
          this.handleEndTimeChanged_);
};

five.EditEventDialog.prototype.handleStartTimeChanged_ = function() {
  var newStartTime = this.startTimePicker_.getDate();
  var delta = newStartTime.getTime() - this.lastStartTime_.getTime();
  var endTime = this.endTimePicker_.getDate();
  var newEndTime = new goog.date.DateTime();
  newEndTime.setTime(endTime.getTime() + delta);
  this.endTimePicker_.setDate(newEndTime);
  this.lastStartTime_ = newStartTime;
  this.updateEventTimeRange_();
};

five.EditEventDialog.prototype.handleEndTimeChanged_ = function() {
  this.updateEventTimeRange_();
};

five.EditEventDialog.prototype.updateEventTimeRange_ = function() {
  if (!this.event_) {
    return;
  }
  var newStartTime = this.startTimePicker_.getDate();
  var newEndTime = this.endTimePicker_.getDate();
  if (!newStartTime || !newEndTime) {
    return;
  }
  this.event_.addMutation(new five.EventMutation.SetTimeRange(
      newStartTime, newEndTime));
  this.dispatchEvent(new goog.events.Event(
          five.EditEventDialog.EventType.EVENT_CHANGED));
};

five.EditEventDialog.prototype.handleSummaryChanged_ = function() {
  if (!this.event_) {
    return;
  }
  var newSummary = this.summaryInputEl_.value.trim();
  if (!newSummary.length) {
    return;
  }
  this.event_.addMutation(new five.EventMutation.ChangeSummary(newSummary));
  this.dispatchEvent(new goog.events.Event(
      five.EditEventDialog.EventType.EVENT_CHANGED));
};

/** @override */
five.EditEventDialog.prototype.show = function() {
  goog.base(this, 'show');

  this.oldFocusEl_ = document.activeElement;

  this.summaryInputEl_.value = this.event_.getSummary();
  this.summaryInputEl_.focus();
  this.summaryInputEl_.select();
};

/** @override */
five.EditEventDialog.prototype.hide = function() {
  goog.base(this, 'hide');
  if (this.oldFocusEl_) {
    this.oldFocusEl_.focus();
  }
  goog.dispose(this);
};

five.EditEventDialog.prototype.done_ = function() {
  var newSummary = this.summaryInputEl_.value.trim();
  if (!newSummary) {
    this.notificationManager_.show(
        five.EditEventDialog.INVALID_SUMMARY_ERROR_, 2000);
    this.summaryInputEl_.select();
    return;
  }
  var newStartTime = this.startTimePicker_.getDate();
  if (!newStartTime) {
    this.notificationManager_.show(
        five.EditEventDialog.INVALID_START_TIME_ERROR_, 2000);
    this.startTimePicker_.selectTimeElement();
    return;
  }
  var newEndTime = this.endTimePicker_.getDate();
  if (!newEndTime) {
    this.notificationManager_.show(
        five.EditEventDialog.INVALID_END_TIME_ERROR_, 2000);
    this.endTimePicker_.selectTimeElement();
    return;
  }
  if (this.dispatchEvent(new goog.events.Event(
          five.EditEventDialog.EventType.DONE))) {
    this.hide();
  }
};

five.EditEventDialog.prototype.cancel_ = function() {
  this.event_.addMutation(new five.EventMutation.ChangeSummary(
      this.originalSummary_));
  this.event_.addMutation(new five.EventMutation.SetTimeRange(
      this.originalStartTime_, this.originalEndTime_));
  this.dispatchEvent(new goog.events.Event(
      five.EditEventDialog.EventType.EVENT_CHANGED));
  this.dispatchEvent(new goog.events.Event(
      five.EditEventDialog.EventType.CANCEL));
  delete this.event_;
  this.hide();
};

five.EditEventDialog.prototype.handleDoneClick_ = function() {
  this.done_();
};

five.EditEventDialog.prototype.handleCancelClick_ = function() {
  this.cancel_();
};

/** @param {goog.events.BrowserEvent} e */
five.EditEventDialog.prototype.handleKeyUp_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel_();
    e.preventDefault();
  } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
    this.done_();
    e.preventDefault();
  }
};

goog.scope(function() {

/**
 * @extends {five.Component}
 * @constructor
 */
five.EditEventDialog.TimePicker_ = function() {
  goog.base(this);

  /** {goog.date.DateTime} */
  this.date_ = new goog.date.DateTime();

  /** @type {Element} */
  this.dateEl_;

  /** @type {goog.ui.InputDatePicker} */
  this.datePicker_;

  /** @type {Element} */
  this.timeEl_;

  /** @type {boolean} */
  this.reverseInputOrder_ = false;
};
var TimePicker = five.EditEventDialog.TimePicker_;
goog.inherits(TimePicker, five.Component);

/** @enum {string} */
TimePicker.EventType = {
  CHANGE: goog.events.getUniqueId('change')
};

/** @type {goog.i18n.DateTimeFormat} */
TimePicker.DATE_FORMATTER_ = new goog.i18n.DateTimeFormat(
    five.EditEventDialog.DATE_PATTERN_);

/** @type {goog.i18n.DateTimeParse} */
TimePicker.DATE_PARSER_ = new goog.i18n.DateTimeParse(
    five.EditEventDialog.DATE_PATTERN_);

/** @type {goog.i18n.DateTimeFormat} */
TimePicker.TIME_FORMATTER_ = new goog.i18n.DateTimeFormat(
    five.EditEventDialog.TIME_PATTERN_);

/** @type {goog.i18n.DateTimeFormat} */
TimePicker.TIME_FORMATTER_HOURS_ = new goog.i18n.DateTimeFormat(
    five.EditEventDialog.TIME_PATTERN_HOURS_);

/** @type {goog.i18n.DateTimeParse} */
TimePicker.TIME_PARSER_ = new goog.i18n.DateTimeParse(
    five.EditEventDialog.TIME_PATTERN_);

/** @type {goog.i18n.DateTimeParse} */
TimePicker.TIME_PARSER_HOURS_ = new goog.i18n.DateTimeParse(
    five.EditEventDialog.TIME_PATTERN_HOURS_);

/** @type {Array.<goog.i18n.DateTimeParse>} */
TimePicker.TIME_PARSERS_ = [
    TimePicker.TIME_PARSER_,
    TimePicker.TIME_PARSER_HOURS_
    ];

TimePicker.prototype.setReverseInputOrder = function(reverseInputOrder) {
  goog.asserts.assert(!this.el);
  this.reverseInputOrder_ = reverseInputOrder;
};

TimePicker.prototype.setDate = function(date) {
  this.date_ = date;
  if (this.datePicker_) {
    this.datePicker_.setDate(this.date_);
    this.setTimeValue_(this.date_);
  }
  this.dispatchEvent(TimePicker.EventType.CHANGE);
};

TimePicker.prototype.getDate = function() {
  var date = this.datePicker_.getDate().clone();
  goog.asserts.assertObject(date);
  var timeStr = this.timeEl_.value;
  if (timeStr.length == 0) {
    return null;
  }
  for (var i = 0; i < TimePicker.TIME_PARSERS_.length; i++) {
    var timeParser = TimePicker.TIME_PARSERS_[i];
    if (timeParser.parse(timeStr, date) != timeStr.length) {
      continue;
    }
    if (timeParser == TimePicker.TIME_PARSER_HOURS_) {
      date.setMinutes(0);
    }
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
  return null;
};

TimePicker.prototype.selectTimeElement = function() {
  this.timeEl_.select();
};

TimePicker.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('span');

  this.dateEl_ = document.createElement('input');
  this.dateEl_.type = 'text';
  goog.dom.classes.add(this.dateEl_, 'date-time-input');

  this.datePicker_ = new goog.ui.InputDatePicker(TimePicker.DATE_FORMATTER_,
      TimePicker.DATE_PARSER_);
  this.datePicker_.decorate(this.dateEl_);
  goog.dom.classes.add(this.datePicker_.getDatePicker().getElement(),
      'date-picker');
  this.registerDisposable(this.datePicker_);
  this.eventHandler.
      listen(this.datePicker_.getDatePicker(), goog.ui.DatePicker.Events.CHANGE,
          this.handleDatePickerChange_).
      listen(this.dateEl_, goog.events.EventType.FOCUS,
          this.handleDateInputFocus_).
      listen(this.dateEl_, goog.events.EventType.BLUR,
          this.handleDateInputBlur_);

  this.timeEl_ = document.createElement('input');
  this.timeEl_.type = 'text';
  goog.dom.classes.add(this.timeEl_, 'date-time-input');
  this.eventHandler.
      listen(this.timeEl_, goog.events.EventType.MOUSEDOWN,
          this.handleTimeInputMouseDown_).
      listen(this.timeEl_, goog.events.EventType.BLUR,
          this.handleTimeInputBlur_);

  if (!this.reverseInputOrder_) {
    this.el.appendChild(this.dateEl_);
    this.el.appendChild(document.createTextNode(' '));
    this.el.appendChild(this.timeEl_);
  } else {
    this.el.appendChild(this.timeEl_);
    this.el.appendChild(document.createTextNode(' '));
    this.el.appendChild(this.dateEl_);
  }

  this.setDate(this.date_);

  this.eventHandler.listen(this.timeEl_, goog.events.EventType.KEYDOWN,
      this.handleKeyDownTimeEl_);
};

/** @param {goog.events.BrowserEvent} e */
TimePicker.prototype.handleKeyDownTimeEl_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.UP) {
    var date = this.getDate();
    date.add(new goog.date.Interval(goog.date.Interval.MINUTES, -5));
    this.setDate(date);
    e.preventDefault();
  } else if (e.keyCode == goog.events.KeyCodes.DOWN) {
    var date = this.getDate();
    date.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
    this.setDate(date);
    e.preventDefault();
  }
};

TimePicker.prototype.setTimeValue_ = function(date) {
  if (date.getMinutes() == 0) {
    this.timeEl_.value = TimePicker.TIME_FORMATTER_HOURS_.format(date).
        toLowerCase();
  } else {
    this.timeEl_.value = TimePicker.TIME_FORMATTER_.format(date).toLowerCase();
  }
};

TimePicker.prototype.handleTimeInputMouseDown_ = function(e) {
  e.preventDefault();
  this.timeEl_.select();
};

TimePicker.prototype.handleTimeInputBlur_ = function() {
  var date = this.getDate();
  if (!date) {
    this.timeEl_.select();
    return;
  }
  this.setTimeValue_(date);
  this.dispatchEvent(TimePicker.EventType.CHANGE);
};

TimePicker.prototype.handleDatePickerChange_ = function() {
  window.setTimeout(function() {
    if (document.activeElement == document.body) {
      this.dateEl_.focus();
    }
    this.dispatchEvent(TimePicker.EventType.CHANGE);
  }.bind(this), 0);
};

TimePicker.prototype.handleDateInputFocus_ = function() {
  this.datePicker_.showForElement(this.dateEl_);
};

TimePicker.prototype.handleDateInputBlur_ = function() {
  this.datePicker_.hidePopup();
  window.setTimeout(function() {
    if (document.activeElement == document.body) {
      this.dateEl_.focus();
    }
  }.bind(this), 0);
};

});  // namespace