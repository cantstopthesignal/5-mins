// Copyright cantstopthesignals@gmail.com

goog.provide('five.mainTestMode');

goog.require('goog.events');
goog.require('goog.math.Coordinate');
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
      function(target) {
        goog.testing.events.fireClickSequence(target);
      });
  goog.exportSymbol('five.mainTestMode.fireDoubleClickSequence',
      function(target) {
        goog.testing.events.fireDoubleClickSequence(target);
      });
  goog.exportSymbol('five.mainTestMode.fireKeySequence',
      function(target, keyCode) {
        goog.testing.events.fireKeySequence(target, keyCode);
      });
  goog.exportSymbol('five.mainTestMode.fireMouseDownEvent',
      function(target, opt_x, opt_y) {
        var opt_coords;
        if (opt_x !== undefined && opt_y !== undefined) {
          opt_coords = new goog.math.Coordinate(opt_x, opt_y);
        }
        goog.testing.events.fireMouseDownEvent(target, undefined, opt_coords);
      });
  goog.exportSymbol('five.mainTestMode.fireMouseMoveEvent',
      function(target, opt_x, opt_y) {
        var opt_coords;
        if (opt_x !== undefined && opt_y !== undefined) {
          opt_coords = new goog.math.Coordinate(opt_x, opt_y);
        }
        goog.testing.events.fireMouseMoveEvent(target, opt_coords);
      });
  goog.exportSymbol('five.mainTestMode.fireMouseUpEvent',
      function(target, opt_x, opt_y) {
        var opt_coords;
        if (opt_x !== undefined && opt_y !== undefined) {
          opt_coords = new goog.math.Coordinate(opt_x, opt_y);
        }
        goog.testing.events.fireMouseUpEvent(target, undefined, opt_coords);
      });
  goog.exportSymbol('five.mainTestMode.getTotalListenerCount',
      goog.events.getTotalListenerCount);
};
