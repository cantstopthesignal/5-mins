// Copyright cantstopthesignals@gmail.com

goog.provide('five.App');

goog.require('five.AppBar');
goog.require('five.Auth');
goog.require('five.CalendarApi');
goog.require('five.CalendarChooser');
goog.require('five.CalendarManager');
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

/** @type {five.AppBar} */
five.App.prototype.appBar_;

/** @type {five.CalendarChooser} */
five.App.prototype.calendarChooser_;

/** @type {five.EventsList} */
five.App.prototype.eventsList_;

/** @type {Element} */
five.App.prototype.footerEl_;

/** @type {Element} */
five.App.prototype.appEl_;

/** @type {Object} */
five.App.prototype.calendarData_;

five.App.prototype.start = function() {
  this.auth_.getAuthDeferred().branch().
      addCallback(this.chooseCalendar_, this).
      addCallback(this.showEventsList_, this);
  this.auth_.start();
  this.appEl_ = goog.dom.getElementByClass('app');
  goog.asserts.assert(this.appEl_);
  this.footerEl_ = goog.dom.getElementByClass('footer');
  goog.asserts.assert(this.footerEl_);

  this.appBar_ = new five.AppBar();
  this.appBar_.render(this.appEl_);

  this.eventHandler_.listen(window, goog.events.EventType.RESIZE,
      this.handleWindowResize_);
};

/** @override */
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
      addCallback(function(calendarData) {
        this.calendarData_ = calendarData;
        goog.dispose(this.calendarChooser_);
        delete this.calendarChooser_;
      }, this);
};

five.App.prototype.showEventsList_ = function() {
  goog.asserts.assert(this.calendarData_);
  goog.asserts.assert(!this.eventsList_);
  var calendarManager = new five.CalendarManager(
      this.calendarApi_, this.calendarData_);
  this.registerDisposable(calendarManager);
  this.eventsList_ = new five.EventsList(calendarManager, this.appBar_);
  this.registerDisposable(this.eventsList_);
  this.eventsList_.render(this.appEl_);
  this.appBar_.getMainMenu().setTitle(this.calendarData_['summary']);
  this.resize();
};

five.App.prototype.handleWindowResize_ = function(e) {
  this.resize();
};

five.App.prototype.resize = function() {
  var appBarHeight = this.appBar_.el.offsetHeight;
  var footerHeight = this.footerEl_.offsetHeight;
  var parentHeight = this.appEl_.parentNode.offsetHeight;
  var innerHeight = Math.max(0, parentHeight - footerHeight - appBarHeight);
  if (this.eventsList_) {
    this.eventsList_.resize(undefined, innerHeight);
  }
};
