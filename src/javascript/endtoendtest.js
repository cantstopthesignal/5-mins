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
goog.require('goog.testing.DeferredTestCase');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');


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

  this.stepTimeout = five.EndToEndTest.STEP_TIMEOUT_;
};
goog.inherits(five.EndToEndTest, goog.testing.DeferredTestCase);

/** @type {number} */
five.EndToEndTest.STEP_TIMEOUT_ = 10000;

/** @type {number} */
five.EndToEndTest.prototype.startTestListenerCount_;

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

  this.startTestListenerCount_ = goog.events.getTotalListenerCount();

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

  goog.getObjectByName('five.mainTestMode.dispose',
      this.appDom.getWindow())();
  var endAppListenerCount = goog.getObjectByName(
      'five.mainTestMode.getTotalListenerCount', this.appDom.getWindow())();
  assertEquals('Expected 0 app listeners after app dispose',
      0, endAppListenerCount);

  goog.dispose(this.appDom);
  delete this.appDom;
  delete this.testDeferred;
  this.mockControl.$tearDown();
  delete this.mockControl;

  var endTestListenerCount = goog.events.getTotalListenerCount();
  assertEquals('Expect test net listeners to be 0 after test',
      this.startTestListenerCount_, endTestListenerCount);

  goog.base(this, 'tearDown');

  window.setTimeout(goog.bind(function() {
    if (this.isSuccess()) {
      goog.dom.removeNode(this.appFrame);
    }
  }, this));
};

/**
 * @param {Function():boolean} conditionFn
 * @return {!goog.async.Deferred}
 */
five.EndToEndTest.prototype.pollUntil_ = function(conditionFn) {
  var deferred = new goog.async.Deferred();

  var pollIntervalId;
  var poll = goog.bind(function() {
    if (!this.running) {
      return;
    }
    if (!conditionFn()) {
      return;
    }
    deferred.callback();
    window.clearInterval(pollIntervalId);
  }, this);

  pollIntervalId = window.setInterval(function() {
    try {
      poll();
    } catch (ex) {
      window.clearInterval(pollIntervalId);
      throw ex;
    }
  }, 10);
  return deferred;
};

five.EndToEndTest.prototype.expectCalendarApiLoads = function() {
  this.fakeCalendarApi.expectLoadCalendars();
  this.fakeCalendarApi.expectLoadCalendar1Events();
};

five.EndToEndTest.prototype.addAppStartupSequence = function() {
  this.addLoadApp();
  this.addInstallFakeAuth();
  this.addStartApp();
  this.addWaitForAppContent();
  this.addVerifyFakeAuth();
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
    url.setParameterValue('touch', new goog.Uri(window.location.href)
        .getParameterValue('touch'));
    url.setParameterValue('density', new goog.Uri(window.location.href)
        .getParameterValue('density'));
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
  this.addWaitForAsync('Waiting for app content to display');
  this.testDeferred.addCallback(function() {
    return this.pollUntil_(goog.bind(function() {
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
        return false;
      }
      return true;
    }, this));
  }, this);
};

five.EndToEndTest.prototype.addCheckSaveButtonVisible = function(visible) {
  this.addWaitForAsync('Check save button visible == ' + visible);
  this.testDeferred.addCallback(function() {
    var saveButton = this.getButton_('Save');
    assertTrue(!!saveButton);
    assertEquals(visible, goog.style.isElementShown(saveButton));
  }, this);
};

five.EndToEndTest.prototype.addPollSaveButtonVisible = function(visible) {
  this.addWaitForAsync('Poll for save button visible == ' + visible);
  this.testDeferred.addCallback(function() {
    return this.pollUntil_(goog.bind(function() {
      var saveButton = this.getButton_('Save');
      assertTrue(!!saveButton);
      return visible == goog.style.isElementShown(saveButton);
    }, this));
  }, this);
};

five.EndToEndTest.prototype.addSaveSequence = function() {
  this.addCheckSaveButtonVisible(true);
  this.addClickSaveButton();
  this.addPollSaveButtonVisible(false);
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

five.EndToEndTest.prototype.addDeleteEvent = function() {
  this.addWaitForAsync('Deleting one event');
  this.testDeferred.addCallback(function() {
    var eventCard = goog.asserts.assertObject(this.appDom.getElementsByClass(
        'event-card')[0]);
    this.fireAppClickSequence_(eventCard);
    this.fireAppKeySequence_(eventCard, goog.events.KeyCodes.BACKSPACE);
  }, this);
};

five.EndToEndTest.prototype.addChangeEventSummary = function() {
  this.addWaitForAsync('Changing the summary of one event');
  this.testDeferred.addCallback(function() {
    var eventCard = goog.asserts.assertObject(this.appDom.getElementsByClass(
        'event-card')[0]);
    this.fireAppDoubleClickSequence_(eventCard);
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
  var fn = goog.getObjectByName('five.mainTestMode.fireClickSequence',
      this.appDom.getWindow());
  fn.apply(null, arguments);
};

five.EndToEndTest.prototype.fireAppDoubleClickSequence_ = function(var_args) {
  var fn = goog.getObjectByName('five.mainTestMode.fireDoubleClickSequence',
      this.appDom.getWindow());
  fn.apply(null, arguments);
};

five.EndToEndTest.prototype.fireAppKeySequence_ = function(var_args) {
  var fn = goog.getObjectByName('five.mainTestMode.fireKeySequence',
      this.appDom.getWindow());
  fn.apply(null, arguments);
};

function testLoad() {
  test.expectCalendarApiLoads();
  test.addReplayMocks();
  test.addAppStartupSequence();
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testMove() {
  test.expectCalendarApiLoads();

  var event = test.fakeCalendarApi.event1;
  var start = new goog.date.DateTime(new Date(event['start']['dateTime']));
  start.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
  var end = new goog.date.DateTime(new Date(event['end']['dateTime']));
  end.add(new goog.date.Interval(goog.date.Interval.MINUTES, 5));
  var expectedResource = {
    'etag': goog.asserts.assertString(event['etag']),
    'start': {
      'dateTime': new Date(start.valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(end.valueOf()).toISOString()
    }
  };
  var resultEvent = goog.object.unsafeClone(event);
  resultEvent['start'] = expectedResource['start'];
  resultEvent['end'] = expectedResource['end'];
  test.fakeCalendarApi.expectEventPatch(event, expectedResource, resultEvent);

  test.addReplayMocks();
  test.addAppStartupSequence();
  test.addCheckSaveButtonVisible(false);
  test.addMoveOneEventDown();
  test.addSaveSequence();
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testDuplicate() {
  test.expectCalendarApiLoads();

  var event = test.fakeCalendarApi.event1;
  var start = new goog.date.DateTime(new Date(event['start']['dateTime']));
  var end = new goog.date.DateTime(new Date(event['end']['dateTime']));
  var expectedResource = {
    'summary': goog.asserts.assertString(event['summary']),
    'start': {
      'dateTime': new Date(start.valueOf()).toISOString()
    },
    'end': {
      'dateTime': new Date(end.valueOf()).toISOString()
    }
  };
  var resultEvent = goog.object.unsafeClone(event);
  resultEvent['start'] = expectedResource['start'];
  resultEvent['end'] = expectedResource['end'];
  test.fakeCalendarApi.expectEventCreate(event, expectedResource, resultEvent);

  test.addReplayMocks();
  test.addAppStartupSequence();
  test.addCheckSaveButtonVisible(false);
  test.addDuplicateEvent();
  test.addSaveSequence();
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testDelete() {
  test.expectCalendarApiLoads();

  var event = test.fakeCalendarApi.event1;
  test.fakeCalendarApi.expectEventDelete(event);

  test.addReplayMocks();
  test.addAppStartupSequence();
  test.addCheckSaveButtonVisible(false);
  test.addDeleteEvent();
  test.addSaveSequence();
  test.addVerifyMocks();
  test.waitForDeferred();
}

function testChangeSummary() {
  test.expectCalendarApiLoads();

  var promptMockControl = new goog.testing.MockControl();

  var event = test.fakeCalendarApi.event1;
  var expectedResource = {
    'etag': goog.asserts.assertString(event['etag']),
    'summary': event['summary'] + ' (edited)'
  };
  var resultEvent = goog.object.unsafeClone(event);
  resultEvent['summary'] = expectedResource['summary'];
  test.fakeCalendarApi.expectEventPatch(event, expectedResource, resultEvent);

  test.addReplayMocks();
  test.addAppStartupSequence();
  test.addCheckSaveButtonVisible(false);

  test.addWaitForAsync('Setup mock prompt');
  test.testDeferred.addCallback(function() {
    promptMockControl.createMethodMock(test.appDom.getWindow(), 'prompt')(
        goog.testing.mockmatchers.isString, event['summary']).$returns(
            event['summary'] + ' (edited)');
    promptMockControl.$replayAll();
  }, this);

  test.addChangeEventSummary();

  test.addWaitForAsync('Verify mock prompt');
  test.testDeferred.addCallback(function() {
    promptMockControl.$verifyAll();
  }, this);

  test.addSaveSequence();
  test.addVerifyMocks();
  test.waitForDeferred();
}
