// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.App');

goog.require('fivemins.CalendarApi');
goog.require('fivemins.CalendarChooser');
goog.require('fivemins.EventsList');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.App = function() {
  this.authDeferred_ = new goog.async.Deferred();

  this.calendarApi_ = new fivemins.CalendarApi();
};
goog.inherits(fivemins.App, goog.events.EventTarget);

fivemins.App.GAPI_API_KEY = 'AIzaSyDh5fbf_pmhJko-6SBua7ptbjnrNl9Jer4';
fivemins.App.GAPI_CLIENT_ID = '446611198518.apps.googleusercontent.com';
fivemins.App.GAPI_SCOPES = ['https://www.googleapis.com/auth/calendar'];

fivemins.App.GAPI_FULL_AUTH_TIMEOUT = 5000;

/** @type {goog.debug.Logger} */
fivemins.App.prototype.logger_ = goog.debug.Logger.getLogger('fivemins.App');

/** @type {fivemins.CalendarChooser} */
fivemins.App.prototype.calendarChooser_;

/** @type {fivemins.EventsList} */
fivemins.App.prototype.eventsList_;

/** @type {Object} */
fivemins.App.prototype.calendar_;

/** @type {number} */
fivemins.App.prototype.gapiFullAuthTimerId_;

fivemins.App.prototype.start = function() {
  this.authDeferred_.branch().
      addCallback(this.chooseCalendar_, this).
      addCallback(this.showEventsList_, this);
  this.loadGapiJavascriptClientAndAuth_();
};

fivemins.App.prototype.disposeInternal = function() {
  goog.dispose(this.calendarChooser_);
  goog.dispose(this.eventsList_);
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
  this.eventsList_.render();
};

fivemins.App.prototype.loadGapiJavascriptClientAndAuth_ = function() {
  var callbackName = 'callback_' + goog.getUid(this);
  goog.exportSymbol(callbackName,
      goog.bind(this.handleGapiClientLoad_, this));
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/client.js?onload=" +
      encodeURIComponent(callbackName);
  document.body.appendChild(scriptEl);
};

fivemins.App.prototype.handleGapiClientLoad_ = function() {
  this.logger_.info('handleGapiClientLoad_');
  goog.getObjectByName('gapi.client.setApiKey')(fivemins.App.GAPI_API_KEY);
  goog.getObjectByName('gapi.auth.init')(
      goog.bind(this.handleGapiAuthInit_, this));
};

fivemins.App.prototype.handleGapiAuthInit_ = function() {
  this.logger_.info('handleGapiAuthInit_');
  window.setTimeout(goog.bind(this.checkAuth_, this), 1);
  this.gapiFullAuthTimerId_ = window.setTimeout(
      goog.bind(this.fullAuth_, this), fivemins.App.GAPI_FULL_AUTH_TIMEOUT);
};

fivemins.App.prototype.checkAuth_ = function() {
  this.logger_.info('checkAuth_');
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: fivemins.App.GAPI_CLIENT_ID,
    scope: fivemins.App.GAPI_SCOPES,
    immediate: true
  }, goog.bind(this.handleAuthResult_, this));
};

fivemins.App.prototype.fullAuth_ = function() {
  this.logger_.info('fullAuth_');
  this.clearFullAuthTimer_();
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: fivemins.App.GAPI_CLIENT_ID,
    scope: fivemins.App.GAPI_SCOPES,
    immediate: false
  }, goog.bind(this.handleAuthResult_, this));
};

fivemins.App.prototype.clearFullAuthTimer_ = function() {
  if (this.gapiFullAuthTimerId_) {
    window.clearTimeout(this.gapiFullAuthTimerId_);
    delete this.gapiFullAuthTimerId_;
  }
};

fivemins.App.prototype.handleAuthResult_ = function(authResult) {
  this.logger_.info('handleAuthResult_ ' + authResult);
  if (!authResult) {
    // An empty auth result can happen if the user previously authorized
    // this service but then de-authorized.  Go immediately to full auth
    // in this case.
    this.fullAuth_();
    return;
  }
  this.clearFullAuthTimer_();
  this.authDeferred_.callback(null);
};
