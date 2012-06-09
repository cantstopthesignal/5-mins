// Copyright cantstopthesignals@gmail.com

goog.provide('five.mainTestMode');

goog.require('goog.testing.events');


/** @param {Function} mainStartFn method to start main app */
five.mainTestMode.init = function(mainStartFn) {
  goog.exportSymbol('five.mainTestMode.start', mainStartFn);

  goog.exportSymbol('five.mainTestMode.fireClickSequence',
      goog.testing.events.fireClickSequence);
  goog.exportSymbol('five.mainTestMode.fireKeySequence',
      goog.testing.events.fireKeySequence);
};
