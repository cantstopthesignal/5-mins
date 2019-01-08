// Copyright cantstopthesignals@gmail.com

goog.provide('five.AllTests');

goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.testing.MultiTestRunner')


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.AllTests = function() {
  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.AllTests, goog.events.EventTarget);

/** @type {Array.<string>} */
five.AllTests.TESTS = [
    'demos/appdemo.html',
    'demos/layout/demo.html',
    'demos/spinnerdemo.html',
    'demos/splitsdemo.html',
    'endtoenddebugtest.html',
    'endtoendoptimizedtest.html',
    'endtoenduncompiledtest.html',
    'eventssplittertest.html',
    'layout/calctest.html',
    'utiltest.html'
    ];

/** @type {goog.testing.MultiTestRunner} */
five.AllTests.prototype.testRunner_;

/** @type {Element} */
five.AllTests.prototype.filterInput_;

five.AllTests.prototype.start = function() {
  var hidePassesInput = document.getElementById('hidepasses');
  var parallelInput = document.getElementById('parallel');

  this.filterInput_ = document.getElementById('filter');

  this.testRunner_ = new goog.testing.MultiTestRunner()
      .setName(document.title)
      .setBasePath('./')
      .setPoolSize(parallelInput.checked ? 8 : 1)
      .setStatsBucketSizes(5, 500)
      .setHidePasses(hidePassesInput.checked)
      //.setVerbosePasses(true)
      .addTests(five.AllTests.TESTS);
  this.testRunner_.render(document.getElementById('runner'));

  this.eventHandler_.listen(hidePassesInput, goog.events.EventType.CLICK,
      function(e) {
    this.testRunner_.setHidePasses(e.target.checked);
  });

  this.eventHandler_.listen(parallelInput, goog.events.EventType.CLICK,
      function(e) {
    this.testRunner_.setPoolSize(e.target.checked ? 8 : 1);
  });

  this.eventHandler_.listen(this.filterInput_, goog.events.EventType.KEYUP,
      function() {this.setFilterFunction_();});

  this.setFilterFunction_();
};

five.AllTests.prototype.setFilterFunction_ = function() {
  var matchValue = this.filterInput_.value || '';
  this.testRunner_.setFilterFunction(function(testPath) {
    return testPath.indexOf(matchValue) > -1;
  });
};
