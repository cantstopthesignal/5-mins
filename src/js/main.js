// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.main');

goog.require('fivemins.App');
goog.require('goog.debug.Console');

// To appease closure missing types warnings.
goog.require('goog.debug.ErrorHandler');
goog.require('goog.events.EventHandler');


window.onload = function() {
  goog.debug.Console.autoInstall();
  new fivemins.App().start();
};
