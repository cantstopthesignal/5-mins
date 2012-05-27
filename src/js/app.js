// Copyright cantstopthesignals@gmail.com

goog.provide('five.App');

goog.require('five.Auth');
goog.require('five.CalendarApi');
goog.require('five.CalendarChooser');
goog.require('five.EventsList');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.App = function() {
  this.auth_ = new five.Auth();

  this.calendarApi_ = new five.CalendarApi(this.auth_);

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.App, goog.events.EventTarget);

/** @type {goog.debug.Logger} */
five.App.prototype.logger_ = goog.debug.Logger.getLogger('five.App');

/** @type {five.CalendarChooser} */
five.App.prototype.calendarChooser_;

/** @type {five.EventsList} */
five.App.prototype.eventsList_;

/** @type {Element} */
five.App.prototype.footerEl_;

/** @type {Element} */
five.App.prototype.appContentEl_;

/** @type {Object} */
five.App.prototype.calendar_;

five.App.prototype.start = function() {
  this.auth_.getAuthDeferred().branch().
      addCallback(this.chooseCalendar_, this).
      addCallback(this.showEventsList_, this);
  this.auth_.start();
  this.appContentEl_ = goog.dom.getElementByClass('app-content');
  goog.asserts.assert(this.appContentEl_);
  this.footerEl_ = goog.dom.getElementByClass('footer');
  goog.asserts.assert(this.footerEl_);
  this.eventHandler_.listen(window, goog.events.EventType.RESIZE,
      this.handleWindowResize_);
};

five.App.prototype.disposeInternal = function() {
  goog.dispose(this.calendarChooser_);
  goog.base(this, 'disposeInternal');
};

five.App.prototype.chooseCalendar_ = function() {
  return this.calendarApi_.loadCalendarList().
      addCallback(function(resp) {
        goog.asserts.assert(!this.calendarChooser_);
        this.calendarChooser_ = new five.CalendarChooser(resp);
        return this.calendarChooser_.chooseCalendar();
      }, this).
      addCallback(function(calendar) {
        this.calendar_ = calendar;
        goog.dispose(this.calendarChooser_);
        delete this.calendarChooser_;
      }, this);
};

five.App.prototype.showEventsList_ = function() {
  goog.asserts.assert(this.calendar_);
  goog.asserts.assert(!this.eventsList_);
  this.eventsList_ = new five.EventsList(this.calendarApi_, this.calendar_);
  this.registerDisposable(this.eventsList_);
  this.eventsList_.render(this.appContentEl_);
  this.resize();
};

five.App.prototype.handleWindowResize_ = function(e) {
  this.resize();
};

five.App.prototype.resize = function() {
  var footerHeight = this.footerEl_.offsetHeight;
  var parentHeight = this.appContentEl_.parentNode.offsetHeight;
  var appHeight = Math.max(0, parentHeight - footerHeight);
  if (this.eventsList_) {
    this.eventsList_.resize(undefined, appHeight);
  }
};
