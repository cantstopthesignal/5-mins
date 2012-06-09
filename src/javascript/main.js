// Copyright cantstopthesignals@gmail.com

goog.provide('five.main');

goog.require('five.App');
goog.require('five.mainTestMode');
goog.require('goog.debug.Console');
goog.require('goog.Uri');

// To appease closure missing types warnings.
goog.require('goog.debug.ErrorHandler');
goog.require('goog.events.EventHandler');


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

five.main.handleWindowLoad = function() {
  goog.debug.Console.autoInstall();

  if (!five.main.maybeTestMode()) {
    five.main.start();
  }
};

window.onload = five.main.handleWindowLoad;
