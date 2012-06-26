// Copyright cantstopthesignals@gmail.com

goog.provide('five.demos.SpinnerDemo');

goog.require('five.Spinner');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.testing.jsunit');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.demos.SpinnerDemo = function() {
  goog.base(this);
};
goog.inherits(five.demos.SpinnerDemo, goog.events.EventTarget);

five.demos.SpinnerDemo.prototype.start = function() {
  var regions = goog.dom.getElementsByClass('region', document.body);
  var sizes = [16, 32, 64, 128];
  goog.array.forEach(regions, function(region) {
    var darkBackground = !goog.dom.classes.has(region, 'white');
    goog.array.forEach(sizes, function(size) {
      var spinner = new five.Spinner(darkBackground, size);
      spinner.render(region);
      spinner.spin();
    });
  });
};

function testLoad() {
  // Ensure the demo loads without javascript errors.
}
