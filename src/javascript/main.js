// Copyright cantstopthesignals@gmail.com

goog.provide('five.main');

goog.require('five.App');
goog.require('goog.debug.Console');
goog.require('goog.Uri');

// To appease closure missing types warnings.
goog.require('goog.debug.ErrorHandler');
goog.require('goog.events.EventHandler');


five.main.maybePause = function() {
  var url = new goog.Uri(window.location.href);
  var paused = url.getParameterValue('pause') == '1';
  if (paused) {
    goog.exportSymbol('five.main.resume', five.main.start);
  }
  return paused;
};

five.main.start = function() {
  new five.App().start();
};

five.main.handleWindowLoad = function() {
  goog.debug.Console.autoInstall();

  if (!five.main.maybePause()) {
    five.main.start();
  }
};

window.onload = five.main.handleWindowLoad;
