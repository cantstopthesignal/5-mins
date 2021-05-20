// Copyright cantstopthesignals@gmail.com

goog.provide('five.serviceWorkerMain');

goog.require('five.ServiceWorker');
goog.require('goog.debug.Console');


(function() {
  goog.debug.Console.autoInstall();

  new five.ServiceWorker().start();
})();
