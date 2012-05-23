// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.App');

goog.require('fivemins.Auth');
goog.require('fivemins.CalendarApi');
goog.require('fivemins.CalendarChooser');
goog.require('fivemins.EventsList');
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
fivemins.App = function() {
  this.auth_ = new fivemins.Auth();

  this.calendarApi_ = new fivemins.CalendarApi(this.auth_);

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(fivemins.App, goog.events.EventTarget);

/** @type {goog.debug.Logger} */
fivemins.App.prototype.logger_ = goog.debug.Logger.getLogger('fivemins.App');

/** @type {fivemins.CalendarChooser} */
fivemins.App.prototype.calendarChooser_;

/** @type {fivemins.EventsList} */
fivemins.App.prototype.eventsList_;

/** @type {Element} */
fivemins.App.prototype.footerEl_;

/** @type {Element} */
fivemins.App.prototype.appContentEl_;

/** @type {Object} */
fivemins.App.prototype.calendar_;

fivemins.App.prototype.start = function() {
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

fivemins.App.prototype.disposeInternal = function() {
  goog.dispose(this.calendarChooser_);
  goog.base(this, 'disposeInternal');
};

fivemins.App.prototype.chooseCalendar_ = function() {
  return this.calendarApi_.loadCalendarList().
      addCallback(function(resp) {
        goog.asserts.assert(!this.calendarChooser_);
        this.calendarChooser_ = new fivemins.CalendarChooser(resp);
        return this.calendarChooser_.chooseCalendar();
      }, this).
      addCallback(function(calendar) {
        this.calendar_ = calendar;
        goog.dispose(this.calendarChooser_);
        delete this.calendarChooser_;
      }, this);
};

fivemins.App.prototype.showEventsList_ = function() {
  goog.asserts.assert(this.calendar_);
  goog.asserts.assert(!this.eventsList_);
  this.eventsList_ = new fivemins.EventsList(this.calendarApi_, this.calendar_);
  this.registerDisposable(this.eventsList_);
  this.eventsList_.render(this.appContentEl_);
  this.resize();
};

fivemins.App.prototype.handleWindowResize_ = function(e) {
  this.resize();
};

fivemins.App.prototype.resize = function() {
  var footerHeight = this.footerEl_.offsetHeight;
  var parentHeight = this.appContentEl_.parentNode.offsetHeight;
  var appHeight = Math.max(0, parentHeight - footerHeight);
  if (this.eventsList_) {
    this.eventsList_.resize(undefined, appHeight);
  }
};
