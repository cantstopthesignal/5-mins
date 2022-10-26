// Copyright cantstopthesignals@gmail.com

goog.provide('five.EditEventDialog');

goog.require('five.Dialog');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
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

  /** @type {Element} */
  this.todoCheckboxEl_;

  /** @type {Element} */
  this.isEstimateCheckboxEl_;

  /** @type {string} */
  this.originalSummary_ = this.event_.getSummary();

  /** @type {!goog.date.DateTime} */
  this.originalStartTime_ = this.event_.getStartTime();

  /** @type {!goog.date.DateTime} */
  this.originalEndTime_ = this.event_.getEndTime();

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

five.EditEventDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var contentEl = this.getContentEl();

  goog.dom.classlist.add(contentEl, 'edit-event-dialog');
  if (five.device.isMobile()) {
    goog.dom.classlist.add(contentEl, 'no-center-vertically');
  }

  var headerEl = document.createElement('div');
  goog.dom.classlist.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode(
      this.newCreate_ ? 'Create event' : 'Edit event'));
  contentEl.appendChild(headerEl);

  var summaryDiv = document.createElement('div');
  goog.dom.classlist.add(summaryDiv, 'editor-row');
  var labelEl = document.createElement('span');
  goog.dom.classlist.add(labelEl, 'summary-label');
  labelEl.appendChild(document.createTextNode('Summary:'));
  summaryDiv.appendChild(labelEl);
  this.summaryInputEl_ = document.createElement('input');
  this.summaryInputEl_.type = 'text';
  this.summaryInputEl_.setAttribute('autocapitalize', 'off');
  goog.dom.classlist.add(this.summaryInputEl_, 'summary-input');
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
  goog.dom.classlist.add(dateDiv, 'editor-row');
  this.startTimePicker_.render(dateDiv);
  dateDiv.appendChild(document.createTextNode(' to '));
  this.endTimePicker_.render(dateDiv);
  contentEl.appendChild(dateDiv);

  var todoDivEl = document.createElement('div');
  goog.dom.classlist.add(todoDivEl, 'todo');
  this.todoCheckboxEl_ = document.createElement('input');
  this.todoCheckboxEl_.setAttribute('type', 'checkbox');
  var todoCheckboxId = goog.getUid(this.todoCheckboxEl_);
  this.todoCheckboxEl_.setAttribute('id', todoCheckboxId);
  todoDivEl.append(this.todoCheckboxEl_);
  var todoLabelEl = document.createElement('label');
  todoLabelEl.setAttribute('for', todoCheckboxId);
  todoLabelEl.appendChild(document.createTextNode('todo'));
  todoDivEl.append(todoLabelEl);
  this.eventHandler.listen(this.todoCheckboxEl_, goog.events.EventType.CHANGE,
      this.handleTodoCheckboxChange_);
  contentEl.appendChild(todoDivEl);

  var isEstimateDivEl = document.createElement('div');
  goog.dom.classlist.add(isEstimateDivEl, 'isEstimate');
  this.isEstimateCheckboxEl_ = document.createElement('input');
  this.isEstimateCheckboxEl_.setAttribute('type', 'checkbox');
  var isEstimateCheckboxId = goog.getUid(this.isEstimateCheckboxEl_);
  this.isEstimateCheckboxEl_.setAttribute('id', isEstimateCheckboxId);
  isEstimateDivEl.append(this.isEstimateCheckboxEl_);
  var isEstimateLabelEl = document.createElement('label');
  isEstimateLabelEl.setAttribute('for', isEstimateCheckboxId);
  isEstimateLabelEl.appendChild(document.createTextNode('estimate'));
  isEstimateDivEl.append(isEstimateLabelEl);
  this.eventHandler.listen(this.isEstimateCheckboxEl_, goog.events.EventType.CHANGE,
      this.handleIsEstimateCheckboxChange_);
  contentEl.appendChild(isEstimateDivEl);

  var doneButtonEl = document.createElement('div');
  goog.dom.classlist.add(doneButtonEl, 'button');
  this.eventHandler.listen(doneButtonEl, goog.events.EventType.CLICK,
      this.handleDoneClick_);
  doneButtonEl.appendChild(document.createTextNode('Done'));
  contentEl.appendChild(doneButtonEl);

  var cancelButtonEl = document.createElement('div');
  goog.dom.classlist.add(cancelButtonEl, 'button');
  this.eventHandler.listen(cancelButtonEl, goog.events.EventType.CLICK,
      this.handleCancelClick_);
  cancelButtonEl.appendChild(document.createTextNode('Cancel'));
  contentEl.appendChild(cancelButtonEl);

  this.eventHandler.
      listen(this.el, goog.events.EventType.KEYUP, this.handleKeyUp_).
      listen(this.el, goog.events.EventType.KEYDOWN, this.handleKeyDown_).
      listen(this.summaryInputEl_, goog.events.EventType.INPUT,
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
  var summaryInfo =  five.Event.SummaryInfo.fromSummary(newSummary);
  this.todoCheckboxEl_.checked = summaryInfo.getType() == five.Event.SummaryType.TODO;
  this.isEstimateCheckboxEl_.checked = summaryInfo.isEstimate();
  if (!newSummary.length) {
    return;
  }
  this.event_.addMutation(new five.EventMutation.ChangeSummary(newSummary));
  this.dispatchEvent(new goog.events.Event(
      five.EditEventDialog.EventType.EVENT_CHANGED));
};

/** @param {!five.Event.SummaryInfo} summaryInfo */
five.EditEventDialog.prototype.setSummaryInputValueAndSelect_ = function(summaryInfo) {
  this.summaryInputEl_.value = summaryInfo.getSummary();
  this.summaryInputEl_.focus();
  var range = summaryInfo.getShortenedSummaryRange();
  this.summaryInputEl_.setSelectionRange(range[0], range[1]);
  this.todoCheckboxEl_.checked = summaryInfo.getType() == five.Event.SummaryType.TODO;
  this.isEstimateCheckboxEl_.checked = summaryInfo.isEstimate();
};

/** @override */
five.EditEventDialog.prototype.show = function() {
  goog.base(this, 'show');

  this.oldFocusEl_ = document.activeElement;

  var summaryInfo = five.Event.SummaryInfo.fromSummary(this.event_.getSummary());
  this.setSummaryInputValueAndSelect_(summaryInfo);
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

five.EditEventDialog.prototype.handleTodoCheckboxChange_ = function() {
  this.toggleTodo_();
};

five.EditEventDialog.prototype.handleIsEstimateCheckboxChange_ = function() {
  this.toggleIsEstimate_();
};

/** @param {goog.events.BrowserEvent} e */
five.EditEventDialog.prototype.handleKeyDown_ = function(e) {
  if ((e.keyCode == goog.events.KeyCodes.E || e.keyCode == goog.events.KeyCodes.Y) && e.ctrlKey) {
    e.preventDefault();
  }
};

/** @param {goog.events.BrowserEvent} e */
five.EditEventDialog.prototype.handleKeyUp_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel_();
    e.preventDefault();
  } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
    this.done_();
    e.preventDefault();
  } else if (e.keyCode == goog.events.KeyCodes.Y && e.ctrlKey) {
    this.toggleTodo_();
    e.preventDefault();
  } else if (e.keyCode == goog.events.KeyCodes.E && e.ctrlKey) {
    this.toggleIsEstimate_();
    e.preventDefault();
  }
};

five.EditEventDialog.prototype.toggleTodo_ = function() {
  var summaryInfo = five.Event.SummaryInfo.fromSummary(this.summaryInputEl_.value.trim());
  var newSummaryInfo = five.Event.SummaryInfo.toggleTodo(summaryInfo);
  this.setSummaryInputValueAndSelect_(newSummaryInfo);
  this.handleSummaryChanged_();
};

five.EditEventDialog.prototype.toggleIsEstimate_ = function() {
  var summaryInfo = five.Event.SummaryInfo.fromSummary(this.summaryInputEl_.value.trim());
  var newSummaryInfo = five.Event.SummaryInfo.toggleIsEstimate(summaryInfo);
  this.setSummaryInputValueAndSelect_(newSummaryInfo);
  this.handleSummaryChanged_();
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

TimePicker.prototype.setReverseInputOrder = function(reverseInputOrder) {
  goog.asserts.assert(!this.el);
  this.reverseInputOrder_ = reverseInputOrder;
};

/**
 * @param {goog.date.DateTime} newDate
 * @param {boolean=} opt_forceUpdate
 */
TimePicker.prototype.setDate = function(newDate, opt_forceUpdate) {
  if (!opt_forceUpdate && this.date_ && newDate &&
      goog.date.Date.compare(this.date_, newDate) == 0) {
    return;
  }
  this.date_ = newDate;
  if (this.dateEl_) {
    var timeWithoutTimezone = this.getTimeWithoutTimezone_(this.date_);
    this.dateEl_.valueAsNumber = timeWithoutTimezone;
    this.timeEl_.valueAsNumber = timeWithoutTimezone;
  }
  this.dispatchEvent(TimePicker.EventType.CHANGE);
};

TimePicker.prototype.getDate = function() {
  return this.date_;
};

TimePicker.prototype.getTimeWithoutTimezone_ = function(date) {
  return date.getTime() - (date.getTimezoneOffset() * 60 * 1000);
};

TimePicker.prototype.calculateDate_ = function() {
  var dateValue = this.dateEl_.valueAsNumber;
  if (!isFinite(dateValue)) {
    return null;
  }
  var timeValue = this.timeEl_.valueAsNumber;
  if (!isFinite(timeValue)) {
    return null;
  }
  var date = new Date(dateValue + timeValue + new Date().getTimezoneOffset() * 60 * 1000);
  return new goog.date.DateTime(date);
};

TimePicker.prototype.selectTimeElement = function() {
  this.timeEl_.select();
};

TimePicker.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('span');

  this.dateEl_ = document.createElement('input');
  this.dateEl_.type = 'date';
  this.dateEl_.required = true;
  goog.dom.classlist.add(this.dateEl_, 'date-input');
  this.eventHandler.
      listen(this.dateEl_, goog.events.EventType.CHANGE,
          this.handleDateElChange_);

  this.timeEl_ = document.createElement('input');
  this.timeEl_.type = 'time';
  this.timeEl_.step = 5 * 60;
  this.timeEl_.required = true;
  goog.dom.classlist.add(this.timeEl_, 'time-input');
  this.eventHandler.
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

  this.setDate(this.date_, true);
};

TimePicker.prototype.handleTimeInputBlur_ = function() {
  var newDate = this.calculateDate_();
  if (!newDate) {
    this.timeEl_.select();
    return;
  }
  if (goog.date.Date.compare(goog.asserts.assertObject(this.date_), newDate) == 0) {
    return;
  }
  this.date_ = newDate;
  this.timeEl_.valueAsNumber = this.getTimeWithoutTimezone_(this.date_);
  this.dispatchEvent(TimePicker.EventType.CHANGE);
};

TimePicker.prototype.handleDateElChange_ = function(e) {
  if (document.activeElement == document.body) {
    this.timeEl_.select();
  }
  var newDate = this.calculateDate_();
  if (!newDate || goog.date.Date.compare(this.date_, newDate) == 0) {
    return;
  }
  this.date_ = newDate;
  this.dispatchEvent(TimePicker.EventType.CHANGE);
};

});  // namespace
