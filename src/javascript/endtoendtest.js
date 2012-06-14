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
goog.require('goog.events.KeyCodes');
goog.require('goog.style');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.DeferredTestCase');
goog.require('goog.testing.MockControl');


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

/** @type {goog.testing.MockControl} */
five.EndToEndTest.prototype.mockControl;

/** @type {Element} */
five.EndToEndTest.prototype.appFrame;

/** @type {goog.dom.DomHelper} */
five.EndToEndTest.prototype.appDom;

/** @type {five.testing.FakeAuth} */
five.EndToEndTest.prototype.fakeAuth;

/** @type {five.testing.FakeAuth.RequestHandler} */
five.EndToEndTest.prototype.mockRequestHandler;

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

  this.mockControl = new goog.testing.MockControl();

  this.mockRequestHandler = this.mockControl.createStrictMock(
      five.testing.FakeAuth.RequestHandler);
  this.fakeCalendarApi = new five.testing.FakeCalendarApi(
      this.mockRequestHandler);
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
  this.mockControl.$tearDown();
  delete this.mockControl;

  goog.base(this, 'tearDown');

  window.setTimeout(goog.bind(function() {
    if (this.isSuccess()) {
      goog.dom.removeNode(this.appFrame);
    }
  }, this));
};

five.EndToEndTest.prototype.addLoadApp = function() {
  var appLoadDeferred = new goog.async.Deferred();

  var loadApp = goog.bind(function() {
    this.appFrame = document.createElement('iframe');
    goog.dom.classes.add(this.appFrame, 'fivemins-app-frame');
    var url = new goog.Uri('/');
    url.setParameterValue('jsmode', this.jsMode);
    url.setParameterValue('Debug', 'true');
    url.setParameterValue('test', '1');
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
    this.fakeAuth = new five.testing.FakeAuth(this.appDom,
        this.mockRequestHandler);
    this.fakeAuth.register();
  }, this));
};

five.EndToEndTest.prototype.addVerifyFakeAuth = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    assertTrue(this.fakeAuth.authCompleted());
  }, this));
};

five.EndToEndTest.prototype.addReplayMocks = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    this.mockControl.$replayAll();
  }, this));
};

five.EndToEndTest.prototype.addVerifyMocks = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    this.mockControl.$verifyAll();
  }, this));
};

five.EndToEndTest.prototype.addStartApp = function() {
  this.testDeferred.addCallback(goog.bind(function() {
    var resumeFunction = goog.getObjectByName('five.mainTestMode.start',
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

five.EndToEndTest.prototype.addCheckSaveButtonVisible = function(visible) {
  this.addWaitForAsync('Check save button visible == ' + visible);
  this.testDeferred.addCallback(function() {
    var saveButton = this.getButton_('Save');
    assertTrue(!!saveButton);
    assertEquals(visible, goog.style.isElementShown(saveButton));
  }, this);
};

five.EndToEndTest.prototype.addClickSaveButton = function() {
  this.addWaitForAsync('Click save button');
  this.testDeferred.addCallback(function() {
    var saveButton = this.getButton_('Save');
    assertTrue(!!saveButton);
    this.fireAppClickSequence_(saveButton);
  }, this);
};

five.EndToEndTest.prototype.addMoveOneEventDown = function() {
  this.addWaitForAsync('Moving one event');
  this.testDeferred.addCallback(function() {
    var eventCard = goog.asserts.assertObject(this.appDom.getElementsByClass(
        'event-card')[0]);
    this.fireAppClickSequence_(eventCard);
    this.fireAppKeySequence_(eventCard, goog.events.KeyCodes.DOWN);
  }, this);
};

five.EndToEndTest.prototype.addDuplicateEvent = function() {
  this.addWaitForAsync('Duplicating one event');
  this.testDeferred.addCallback(function() {
    var eventCard = goog.asserts.assertObject(this.appDom.getElementsByClass(
        'event-card')[0]);
    this.fireAppClickSequence_(eventCard);
    this.fireAppKeySequence_(eventCard, goog.events.KeyCodes.D);
  }, this);
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

five.EndToEndTest.prototype.getButton_ = function(buttonName) {
  return goog.array.find(this.appDom.getElementsByClass('button'),
      function(buttonEl) {
    return goog.dom.getTextContent(buttonEl) == buttonName;
  });
};

five.EndToEndTest.prototype.fireAppClickSequence_ = function(var_args) {
  var fireClickSequenceFunction = goog.getObjectByName(
      'five.mainTestMode.fireClickSequence', this.appDom.getWindow());
  fireClickSequenceFunction.apply(null, arguments);
};

five.EndToEndTest.prototype.fireAppKeySequence_ = function(var_args) {
  var fireKeySequenceFunction = goog.getObjectByName(
      'five.mainTestMode.fireKeySequence', this.appDom.getWindow());
  fireKeySequenceFunction.apply(null, arguments);
};

function testLoad() {
  test.fakeCalendarApi.expectLoadCalendars();
  test.fakeCalendarApi.expectLoadCalendar1Events();
  test.addReplayMocks();
  test.addLoadApp();
  test.addInstallFakeAuth();
  test.addStartApp();
  test.addWaitForAppContent();
  test.addVerifyFakeAuth();
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testSave() {
  test.fakeCalendarApi.expectLoadCalendars();
  test.fakeCalendarApi.expectLoadCalendar1Events();

  var event = test.fakeCalendarApi.event1;
  var start = new goog.date.DateTime(new Date(event['start']['dateTime']));
  start.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
  var end = new goog.date.DateTime(new Date(event['end']['dateTime']));
  end.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
  var expectedBody = {
    'etag': goog.asserts.assertString(event['etag']),
    'start': {
      'dateTime': new Date(start.valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(end.valueOf()).toISOString()
    }
  };
  var resultEvent = goog.object.unsafeClone(event);
  resultEvent['start'] = expectedBody['start'];
  resultEvent['end'] = expectedBody['end'];
  test.fakeCalendarApi.expectEventPatch(event, expectedBody, resultEvent);

  test.addReplayMocks();
  test.addLoadApp();
  test.addInstallFakeAuth();
  test.addStartApp();
  test.addWaitForAppContent();
  test.addVerifyFakeAuth();
  test.addCheckSaveButtonVisible(false);
  test.addMoveOneEventDown();
  test.addClickSaveButton();
  test.addCheckSaveButtonVisible(false);
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testDuplicate() {
  test.fakeCalendarApi.expectLoadCalendars();
  test.fakeCalendarApi.expectLoadCalendar1Events();

  var event = test.fakeCalendarApi.event1;
  var start = new goog.date.DateTime(new Date(event['start']['dateTime']));
  var end = new goog.date.DateTime(new Date(event['end']['dateTime']));
  var expectedBody = {
    'summary': goog.asserts.assertString(event['summary']),
    'start': {
      'dateTime': new Date(start.valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(end.valueOf()).toISOString()
    }
  };
  var resultEvent = goog.object.unsafeClone(event);
  resultEvent['start'] = expectedBody['start'];
  resultEvent['end'] = expectedBody['end'];
  test.fakeCalendarApi.expectCreateEvent(event, expectedBody, resultEvent);

  test.addReplayMocks();
  test.addLoadApp();
  test.addInstallFakeAuth();
  test.addStartApp();
  test.addWaitForAppContent();
  test.addVerifyFakeAuth();
  test.addCheckSaveButtonVisible(false);
  test.addDuplicateEvent();
  test.addClickSaveButton();
  test.addCheckSaveButtonVisible(false);
  test.addVerifyMocks();
  test.waitForDeferred();
}
