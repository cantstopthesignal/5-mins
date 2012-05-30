// Copyright cantstopthesignals@gmail.com

goog.provide('five.EndToEndTest');

goog.require('five.testing.FakeAuth');
goog.require('five.testing.FakeCalendarApi');
goog.require('five.util');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.DeferredTestCase');


var test;

/**
 * @param {string} jsBinary
 * @constructor
 * @extends {goog.testing.DeferredTestCase}
 */
five.EndToEndTest = function(jsMode) {
  goog.base(this, 'five.EndToEndTest (' + jsMode + ')');

  assertTrue(!test);
  test = this;

  /** @type {string} */
  this.jsMode = jsMode;
};
goog.inherits(five.EndToEndTest, goog.testing.DeferredTestCase);

/** @type {goog.async.Deferred} */
five.EndToEndTest.prototype.testDeferred;

/** @type {Element} */
five.EndToEndTest.prototype.appFrame;

/** @type {goog.dom.DomHelper} */
five.EndToEndTest.prototype.appDom;

/** @type {five.testing.FakeAuth} */
five.EndToEndTest.prototype.fakeAuth;

/** @type {five.testing.FakeCalendarApi} */
five.EndToEndTest.prototype.fakeCalendarApi;

five.EndToEndTest.prototype.install = function() {
  goog.testing.TestCase.initializeTestRunner(this);
};

/** @override */
five.EndToEndTest.prototype.addWaitForAsync = function(message) {
  goog.base(this, 'addWaitForAsync', message, this.testDeferred);
};

/** @override */
five.EndToEndTest.prototype.waitForDeferred = function() {
  goog.base(this, 'waitForDeferred', this.testDeferred);
}

/** @override */
five.EndToEndTest.prototype.setUp = function() {
  goog.base(this, 'setUp');

  this.testDeferred = new goog.async.Deferred();
  goog.dom.removeNode(this.appFrame);
};

/** @override */
five.EndToEndTest.prototype.tearDown = function() {
  goog.dispose(this.fakeAuth);
  delete this.fakeAuth;
  goog.dispose(this.fakeCalendarApi);
  delete this.fakeCalendarApi;
  goog.dispose(this.appDom);
  delete this.appDom;
  delete this.testDeferred;

  goog.base(this, 'tearDown');

  window.setTimeout(goog.bind(function() {
    if (this.isSuccess()) {
      goog.dom.removeNode(this.appFrame);
    }
  }, this));
};

five.EndToEndTest.prototype.addLoadApp = function(paused) {
  var appLoadDeferred = new goog.async.Deferred();

  var loadApp = goog.bind(function() {
    this.appFrame = document.createElement('iframe');
    goog.dom.classes.add(this.appFrame, 'fivemins-app-frame');
    var url = new goog.Uri('/');
    url.setParameterValue('jsmode', this.jsMode);
    url.setParameterValue('Debug', 'true');
    if (paused) {
      url.setParameterValue('pause', '1');
    }
    this.appFrame.src = url.toString();
    this.appFrame.addEventListener(goog.events.EventType.LOAD, goog.bind(
        function() {
      this.appDom = new goog.dom.DomHelper(this.appFrame.contentDocument);
      this.forwardWindowErrors_(this.appDom.getWindow());
      appLoadDeferred.callback();
    }, this));
    this.appFrame.addEventListener(goog.events.EventType.ERROR, function(e) {
      fail('Error loading frame: ' + e);
    });
    document.body.appendChild(this.appFrame);
  }, this);

  this.addWaitForAsync('Waiting for main app load');
  this.testDeferred.addCallback(function() {
    loadApp();
    return appLoadDeferred;
  });
};

five.EndToEndTest.prototype.addInstallFakeAuth = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    assertTrue(!this.fakeAuth);
    assertTrue(!!this.appDom);
    this.fakeAuth = new five.testing.FakeAuth(this.appDom);
    this.fakeAuth.register();
  }, this));
};

five.EndToEndTest.prototype.addVerifyFakeAuth = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    assertTrue(this.fakeAuth.authCompleted());
  }, this));
};

five.EndToEndTest.prototype.addInstallFakeCalendarApi = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    assertTrue(!this.fakeCalendarApi);
    assertTrue(!!this.fakeAuth);
    this.fakeCalendarApi = new five.testing.FakeCalendarApi(this.fakeAuth);
  }, this));
};

five.EndToEndTest.prototype.addResumeApp = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    var resumeFunction = goog.getObjectByName('five.main.resume',
        this.appDom.getWindow());
    assertTrue(!!resumeFunction);
    resumeFunction();
  }, this));
};

five.EndToEndTest.prototype.addWaitForAppContent = function() {
  var appLoadDeferred = new goog.async.Deferred();

  var pollIntervalId;
  var poll = goog.bind(function() {
    var hasEventCard = this.appDom.getElementsByClass('event-card').length > 0;
    var hasTimeMarker = this.appDom.getElementsByClass('time-marker').length >
        0;
    var hasTimeAxis = this.appDom.getElementsByClass('time-axis').length > 0;
    var hasTimeAxisPatchCanvas = this.appDom.getElementsByClass(
        'time-axis-patch-canvas').length > 0;
    var spinner = this.appDom.getElementByClass('spinner');
    var spinnerVisible = spinner && goog.style.isElementShown(spinner);
    if (!hasEventCard || !hasTimeMarker || !hasTimeAxis ||
        !hasTimeAxisPatchCanvas || !spinner || spinnerVisible) {
      window.console.log('Waiting for all required elements to be visible...');
      return;
    }
    appLoadDeferred.callback();
    window.clearInterval(pollIntervalId);
  }, this);

  this.addWaitForAsync('Waiting for app content to display');
  this.testDeferred.addCallback(function() {
    pollIntervalId = window.setInterval(function() {
      try {
        poll();
      } catch (ex) {
        window.clearInterval(pollIntervalId);
        throw ex;
      }
    }, 10);
    return appLoadDeferred;
  });
};

/** Forward errors from a window to this test harness */
five.EndToEndTest.prototype.forwardWindowErrors_ = function(win) {
  var oldOnError = this.appDom.getWindow().onerror;
  this.appDom.getWindow().onerror = function(error) {
    if (window.onerror) {
      window.onerror.apply(this, arguments);
    }
    if (oldOnError) {
      oldOnError.apply(this, arguments);
    }
  };
};

function testLoad() {
  test.addLoadApp(true);
  test.addInstallFakeAuth();
  test.addInstallFakeCalendarApi();
  test.addResumeApp();
  test.addWaitForAppContent();
  test.addVerifyFakeAuth();
  test.waitForDeferred();
}
