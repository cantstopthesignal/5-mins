// Copyright cantstopthesignals@gmail.com

goog.provide('five.App');

goog.require('five.AndroidAppApi');
goog.require('five.AndroidCalendarApi');
goog.require('five.AppBar');
goog.require('five.Auth');
goog.require('five.CalendarApi');
goog.require('five.CalendarChooser');
goog.require('five.CalendarManager');
goog.require('five.EventsView');
goog.require('five.NotificationManager');
goog.require('goog.Uri');
goog.require('five.device');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.App = function() {
  this.appContext_ = new five.AppContext();
  this.registerDisposable(this.appContext_);

  if (!five.device.isWebView()) {
    this.auth_ = new five.Auth();
  }

  /** @type {!five.BaseCalendarApi} */
  this.calendarApi_;

  if (five.device.isWebView()) {
    this.calendarApi_ = new five.AndroidCalendarApi();
  } else {
    this.calendarApi_ = new five.CalendarApi(this.auth_);
  }
  this.calendarApi_.register(this.appContext_);

  if (five.device.isWebView()) {
    var androidAppApi = new five.AndroidAppApi();
    androidAppApi.register(this.appContext_);
  }

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.App, goog.events.EventTarget);

/** @type {string} */
five.App.APP_UPDATE_AVAILABLE_NOTIFICATION_ =
    'New app available. Refresh page to update.';

/** @type {number} */
five.App.APP_UPDATE_AVAILABLE_NOTIFICATION_DURATION_ = 2000;

/** @type {goog.log.Logger} */
five.App.prototype.logger_ = goog.log.getLogger('five.App');

/** @type {five.AppBar} */
five.App.prototype.appBar_;

/** @type {five.NotificationManager} */
five.App.prototype.notificationManager_;

/** @type {five.CalendarChooser} */
five.App.prototype.calendarChooser_;

/** @type {five.EventsView} */
five.App.prototype.eventsView_;

/** @type {Element} */
five.App.prototype.footerEl_;

/** @type {Element} */
five.App.prototype.appEl_;

/** @type {Object} */
five.App.prototype.calendarData_;

five.App.prototype.start = function() {
  this.appEl_ = goog.dom.getElementByClass('app');
  goog.asserts.assert(this.appEl_);
  this.footerEl_ = goog.dom.getElementByClass('footer');
  goog.asserts.assert(this.footerEl_);

  this.appBar_ = new five.AppBar();
  this.appBar_.render(this.appEl_);

  this.notificationManager_ = new five.NotificationManager(this.appBar_);
  this.notificationManager_.register(this.appContext_);

  if (five.device.isWebView()) {
    this.calendarApi_.loadCalendarData().
        addCallback(this.handleAndroidCalendarData_, this);
  } else {
    this.auth_.getAuthDeferred().branch().
        addCallback(this.chooseCalendar_, this).
        addCallback(this.showEventsView_, this);
    this.auth_.start();
  }

  if (five.device.isServiceWorkerEnabled()) {
    this.installServiceWorker_();
  }

  this.eventHandler_.
      listen(window, goog.events.EventType.RESIZE, this.handleWindowResize_).
      listen(document, goog.events.EventType.COPY, this.handleCopy_).
      listen(document, goog.events.EventType.PASTE, this.handlePaste_).
      listen(window, goog.events.EventType.BEFOREUNLOAD, this.handleWindowBeforeUnload_).
      listen(navigator.serviceWorker, goog.events.EventType.MESSAGE,
        this.handleServiceWorkerMessage_);
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

five.App.prototype.handleAndroidCalendarData_ = function(calendarData) {
  this.calendarData_ = calendarData;
  this.showEventsView_();
};

five.App.prototype.showEventsView_ = function() {
  goog.asserts.assert(this.calendarData_);
  goog.asserts.assert(!this.eventsView_);
  var calendarManager = new five.CalendarManager(this.appContext_,
      this.calendarData_);
  this.registerDisposable(calendarManager);
  this.eventsView_ = new five.EventsView(this.appContext_, calendarManager,
      this.appBar_);
  this.registerDisposable(this.eventsView_);
  this.eventsView_.render(this.appEl_);
  this.appBar_.getMainMenu().setTitle(this.calendarData_['summary']);
  this.resize();
  this.eventsView_.focus();
};

five.App.prototype.handleWindowResize_ = function() {
  this.resize();
};

five.App.prototype.installServiceWorker_ = function() {
  if (!('serviceWorker' in navigator)) {
    this.logger_.severe('Service workers not available');
    return;
  }

  var serviceWorkerUri = new goog.Uri('/js/serviceWorker.js?jsmode=' + five.device.getJsMode());
  if (five.device.isDebug()) {
    serviceWorkerUri.setParameterValue("Debug", "true");
  }
  navigator.serviceWorker.register(serviceWorkerUri.toString(), { scope: '/' }).
    then(function(registration) {
      this.logger_.info('ServiceWorker registration successful, scope: ' + registration.scope);
      return navigator.serviceWorker.ready;
    }.bind(this), function(err) {
      this.logger_.severe('ServiceWorker registration failed: ' + err, err);
    }.bind(this)).
    then(function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          {'command': 'checkAppUpdateAvailable'});
      }
    }.bind(this));
};

/** @param {goog.events.BrowserEvent} e */
five.App.prototype.handleCopy_ = function(e) {
  if (e.target === document.body && this.eventsView_) {
    this.eventsView_.handleDefaultCopy(e);
  }
};

/** @param {goog.events.BrowserEvent} e */
five.App.prototype.handlePaste_ = function(e) {
  if (e.target === document.body && this.eventsView_) {
    this.eventsView_.handleDefaultPaste(e);
  }
};

five.App.prototype.resize = function() {
  var parentHeight = this.appEl_.parentNode.offsetHeight;
  var appBarHeight = this.appBar_.el.offsetHeight;
  var footerHeight = this.footerEl_.offsetHeight;

  var appHeight = parentHeight - footerHeight;
  goog.style.setHeight(this.appEl_, appHeight);

  var eventsViewHeight = Math.max(0, appHeight - appBarHeight);
  if (this.eventsView_) {
    this.eventsView_.resize(undefined, eventsViewHeight);
  }
};

/** @param {goog.events.BrowserEvent} e */
five.App.prototype.handleWindowBeforeUnload_ = function(e) {
  if (this.eventsView_ && this.eventsView_.hasUnsavedChanges()) {
    var message = this.eventsView_.getUnloadWarning();
    if (message) {
      if (e) {
        e.returnValue = message;
      }
      return message;
    }
  }
};

five.App.prototype.handleServiceWorkerMessage_ = function(e) {
  var event = e.getBrowserEvent();
  if (event.data['command'] == 'updateAvailable') {
    this.notificationManager_.show(
        five.App.APP_UPDATE_AVAILABLE_NOTIFICATION_,
        five.App.APP_UPDATE_AVAILABLE_NOTIFICATION_DURATION_,
        five.NotificationManager.Level.INFO);
  }
};
