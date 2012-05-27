// Copyright cantstopthesignals@gmail.com

goog.provide('five.main');

goog.require('five.App');
goog.require('goog.debug.Console');

// To appease closure missing types warnings.
goog.require('goog.debug.ErrorHandler');
goog.require('goog.events.EventHandler');


window.onload = function() {
  goog.debug.Console.autoInstall();
  new five.App().start();
};
