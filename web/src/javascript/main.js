// Copyright cantstopthesignals@gmail.com

goog.provide('five.main');

goog.require('five.App');
goog.require('five.mainCssLoader');
goog.require('five.mainTestMode');
goog.require('goog.asserts');
goog.require('goog.debug.Console');
goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.events.EventType');

// To appease closure missing types warnings.
goog.require('goog.debug.ErrorHandler');


five.main.maybeTestMode = function() {
  var url = new goog.Uri(window.location.href);
  var testMode = url.getParameterValue('test') == '1';
  if (testMode) {
    five.mainTestMode.init(five.main.start, five.main.dispose);
  }
  return testMode;
};

/** @type {five.App} */
five.main.app_;

five.main.start = function() {
  goog.asserts.assert(!five.main.app_);
  five.main.app_ = new five.App();
  five.main.app_.start();
};

five.main.dispose = function() {
  goog.dispose(five.main.app_);
  goog.events.unlistenByKey(five.main.windowLoadListenerKey_);
};

five.main.loadInline = function() {
  five.mainCssLoader.load();
}

five.main.handleWindowLoad = function() {
  goog.debug.Console.autoInstall();

  if (!five.main.maybeTestMode()) {
    five.main.start();
  }
};

five.main.windowLoadListenerKey_ = goog.events.listen(window,
    goog.events.EventType.LOAD, five.main.handleWindowLoad);
five.main.loadInline();
