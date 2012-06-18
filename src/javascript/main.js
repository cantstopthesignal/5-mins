// Copyright cantstopthesignals@gmail.com

goog.provide('five.main');

goog.require('five.App');
goog.require('five.mainCssLoader');
goog.require('five.mainTestMode');
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
    five.mainTestMode.init(five.main.start);
  }
  return testMode;
};

five.main.start = function() {
  new five.App().start();
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

goog.events.listen(window, goog.events.EventType.LOAD,
    five.main.handleWindowLoad);
five.main.loadInline();
