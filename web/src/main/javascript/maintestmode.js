// Copyright cantstopthesignals@gmail.com

goog.provide('five.mainTestMode');

goog.require('goog.events');
goog.require('goog.testing.events');


/**
 * @param {Function} mainStartFn method to start main app
 * @param {Function} mainDisposeFn method to dispose main app
 * @suppress {deprecated}
 */
five.mainTestMode.init = function(mainStartFn, mainDisposeFn) {
  goog.exportSymbol('five.mainTestMode.start', mainStartFn);
  goog.exportSymbol('five.mainTestMode.dispose', mainDisposeFn);

  goog.exportSymbol('five.mainTestMode.fireClickSequence',
      goog.testing.events.fireClickSequence);
  goog.exportSymbol('five.mainTestMode.fireDoubleClickSequence',
      goog.testing.events.fireDoubleClickSequence);
  goog.exportSymbol('five.mainTestMode.fireKeySequence',
      goog.testing.events.fireKeySequence);
  goog.exportSymbol('five.mainTestMode.getTotalListenerCount',
      goog.events.getTotalListenerCount);
};
