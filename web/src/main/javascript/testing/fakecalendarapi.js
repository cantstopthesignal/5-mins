// Copyright cantstopthesignals@gmail.com

goog.provide('five.testing.FakeCalendarApi');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.json');
goog.require('goog.log');
goog.require('goog.testing.asserts');
goog.require('goog.testing.mockmatchers');


/**
 * Fake calendar api helper for tests.
 * @param {!five.testing.FakeAuth.RequestHandler} requestHandler
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.testing.FakeCalendarApi = function(requestHandler) {
  goog.base(this);

  /** @type {!five.testing.FakeAuth.RequestHandler} */
  this.requestHandler_ = requestHandler;

  this.makeTestData_();
};
goog.inherits(five.testing.FakeCalendarApi, goog.events.EventTarget);

/** @type {goog.log.Logger} */
five.testing.FakeCalendarApi.prototype.logger_ = goog.log.getLogger(
    'five.testing.FakeCalendarApi');

/** @type {number} */
five.testing.FakeCalendarApi.prototype.nextId_ = 1;

/** @type {string} */
five.testing.FakeCalendarApi.prototype.calendar1Id_ =
    '5minscalid1@group.calendar.google.com';

/** @type {string} */
five.testing.FakeCalendarApi.prototype.event1Id_ = 'eventid1';

/** @type {Object} */
five.testing.FakeCalendarApi.prototype.event1;

/** @type {Object} */
five.testing.FakeCalendarApi.calendarListResult_;

/** @type {Object} */
five.testing.FakeCalendarApi.calendar1EventsResult_;

five.testing.FakeCalendarApi.prototype.expectLoadCalendars = function() {
  this.requestHandler_.handleRequest({
    'path': 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    'method': 'GET'
  }).$returns(this.calendarListResult_);
};

five.testing.FakeCalendarApi.prototype.expectLoadCalendar1Events = function() {
  var argsMatcher = new goog.testing.mockmatchers.ArgumentMatcher(
      goog.bind(function(args) {
    var expectedArgs = {
      'path': 'https://www.googleapis.com/calendar/v3/calendars/' +
          encodeURIComponent(this.calendar1Id_) + '/events',
      'method': 'GET',
      'params': {
        'singleEvents': true,
        'maxResults': 240,
        'timeMin': goog.asserts.assertString(args['params']['timeMin']),
        'timeMax': goog.asserts.assertString(args['params']['timeMax'])
      }
    };
    assertObjectEquals(expectedArgs, args);
    return true;
  }, this));
  this.requestHandler_.handleRequest(argsMatcher).$returns(this.calendar1EventsResult_);
};

/**
 * @param {Object|goog.testing.mockmatchers.ArgumentMatcher} expectedResourceOrMatcher
 * @param {!five.event.Event} resultEvent
 */
five.testing.FakeCalendarApi.prototype.expectEventCreate = function(
    expectedResourceOrMatcher, resultEvent) {
  var argsMatcher = new goog.testing.mockmatchers.ArgumentMatcher(
      goog.bind(function(args) {
    var expectedResource;
    if (expectedResourceOrMatcher instanceof goog.testing.mockmatchers.ArgumentMatcher) {
      assertTrue(expectedResourceOrMatcher.matches(args['body']));
      expectedResource = args['body'];
    } else {
      expectedResource = expectedResourceOrMatcher;
    }
    var expectedArgs = {
      'path': 'https://www.googleapis.com/calendar/v3/calendars/' +
          encodeURIComponent(this.calendar1Id_) + '/events',
      'method': 'POST',
      'params': {},
      'body': expectedResource
    };
    assertObjectEquals(expectedArgs, args);
    return true;
  }, this));
  this.requestHandler_.handleRequest(argsMatcher).$returns(resultEvent);
};

five.testing.FakeCalendarApi.prototype.expectEventPatch = function(event,
    expectedResource, resultEvent) {
  var expectedArgs = {
    'path': 'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(this.calendar1Id_) + '/events/' +
        encodeURIComponent(event['id']),
    'method': 'PATCH',
    'params': {},
    'body': expectedResource
  };
  this.requestHandler_.handleRequest(expectedArgs).$returns(resultEvent);
};

five.testing.FakeCalendarApi.prototype.expectEventDelete = function(event) {
  var expectedArgs = {
    'path': 'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(this.calendar1Id_) + '/events/' +
        encodeURIComponent(event['id']),
    'method': 'DELETE',
    'params': {},
    'body': {}
  };
  this.requestHandler_.handleRequest(expectedArgs).$returns(null);
};

five.testing.FakeCalendarApi.prototype.makeTestData_ = function() {
  this.event1 = this.makeEvent1_();
  this.calendarListResult_ = this.makeCalendarListResult_();
  this.calendar1EventsResult_ = this.makeCalendar1EventsResult_();
};

five.testing.FakeCalendarApi.prototype.getUniqueEtag_ = function() {
  return "\"etag_u" + (this.nextId_++) + "\"";
};

five.testing.FakeCalendarApi.prototype.getUniqueEventUrl_ = function() {
  return "https://www.google.com/calendar/event?eid=testevent" + this.nextId_++;
};

five.testing.FakeCalendarApi.prototype.getUniqueEventId_ = function() {
  return "eventid_u" + this.nextId_++;
};

five.testing.FakeCalendarApi.prototype.getUniqueICalId_ = function() {
  return "icalid_u" + (this.nextId_++) + "@google.com";
};

five.testing.FakeCalendarApi.prototype.makeCalendarListResult_ = function() {
  var calendarReader1 = {
    "kind": "calendar#calendarListEntry",
    "etag": this.getUniqueEtag_(),
    "id": "#contacts@group.v.calendar.google.com",
    "summary": "Contacts' birthdays and events",
    "description": "Your contacts' birthdays and anniversaries",
    "timeZone": "America/Los_Angeles",
    "colorId": "12",
    "selected": true,
    "accessRole": "reader"
  };
  var calendarReader2 = {
    "kind": "calendar#calendarListEntry",
    "etag": this.getUniqueEtag_(),
    "id": "en.usa#holiday@group.v.calendar.google.com",
    "summary": "US Holidays",
    "description": "US Holidays",
    "timeZone": "America/Los_Angeles",
    "colorId": "9",
    "selected": true,
    "accessRole": "reader"
  };
  var calendarOwner1 = {
    "kind": "calendar#calendarListEntry",
    "etag": this.getUniqueEtag_(),
    "id": this.calendar1Id_,
    "summary": "5mins",
    "timeZone": "America/Los_Angeles",
    "colorId": "9",
    "selected": true,
    "accessRole": "owner"
  };
  var calendarOwner2 = {
    "kind": "calendar#calendarListEntry",
    "etag": this.getUniqueEtag_(),
    "id": "cantstopthesignals@gmail.com",
    "summary": "cantstopthesignals@gmail.com",
    "timeZone": "America/Los_Angeles",
    "colorId": "15",
    "selected": true,
    "accessRole": "owner",
    "defaultReminders": [
      {
        "method": "popup",
        "minutes": 30
      },
      {
        "method": "email",
        "minutes": 30
      }
    ]
  };
  return {
    "kind": "calendar#calendarList",
    "etag": this.getUniqueEtag_(),
    "items": [calendarReader1, calendarReader2, calendarOwner1 ]
  };
};

five.testing.FakeCalendarApi.prototype.makeEvent1_ = function() {
  return {
    "kind": "calendar#event",
    "etag": this.getUniqueEtag_(),
    "id": this.event1Id_,
    "status": "confirmed",
    "htmlLink": this.getUniqueEventUrl_(),
    "created": "2012-05-20T19:25:15.000Z",
    "updated": "2012-05-28T17:04:51.000Z",
    "summary": "event 6",
    "creator": {
      "email": "cantstopthesignals@gmail.com",
      "displayName": "Ca Ntstopthesignals"
    },
    "organizer": {
      "email": this.calendar1Id_,
      "displayName": "5mins",
      "self": true
    },
    "start": {
      "dateTime": "2012-05-28T17:00:00-07:00"
    },
    "end": {
      "dateTime": "2012-05-28T17:05:00-07:00"
    },
    "iCalUID": this.getUniqueICalId_(),
    "sequence": 4,
    "guestsCanInviteOthers": true,
    "guestsCanSeeOtherGuests": true,
    "reminders": {
      "useDefault": true
    }
  };
};

five.testing.FakeCalendarApi.prototype.makeCalendar1EventsResult_ = function() {
  return {
    "kind": "calendar#events",
    "etag": this.getUniqueEtag_(),
    "summary": "5mins",
    "description": "",
    "updated": "2012-05-28T17:05:05.000Z",
    "timeZone": "America/Los_Angeles",
    "accessRole": "owner",
    "items": [
      goog.asserts.assertObject(this.event1),
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-20T19:25:33.000Z",
        "updated": "2012-05-28T17:04:53.000Z",
        "summary": "event 7",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T17:05:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T17:15:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 4,
        "guestsCanInviteOthers": true,
        "guestsCanSeeOtherGuests": true,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-20T19:25:45.000Z",
        "updated": "2012-05-28T17:04:55.000Z",
        "summary": "event 8",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T17:15:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T17:25:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 4,
        "guestsCanInviteOthers": true,
        "guestsCanSeeOtherGuests": true,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-20T19:26:11.000Z",
        "updated": "2012-05-28T17:04:57.000Z",
        "summary": "event 9",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T17:25:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T17:45:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 4,
        "guestsCanInviteOthers": true,
        "guestsCanSeeOtherGuests": true,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-13T17:12:39.000Z",
        "updated": "2012-05-28T17:04:59.000Z",
        "summary": "event 4",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T18:30:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T21:00:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 7,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-09T15:54:17.000Z",
        "updated": "2012-05-28T17:05:01.000Z",
        "summary": "event 2",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T18:30:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T19:30:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 7,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-13T17:12:33.000Z",
        "updated": "2012-05-28T17:05:03.000Z",
        "summary": "event 1",
        "creator": {
          "email": "cantstopthesignals@gmail.com"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T20:00:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T21:00:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 6,
        "reminders": {
          "useDefault": true
        }
      },
      {
        "kind": "calendar#event",
        "etag": this.getUniqueEtag_(),
        "id": this.getUniqueEventId_(),
        "status": "confirmed",
        "htmlLink": this.getUniqueEventUrl_(),
        "created": "2012-05-09T15:54:22.000Z",
        "updated": "2012-05-28T17:05:05.000Z",
        "summary": "event 3",
        "creator": {
          "email": "cantstopthesignals@gmail.com",
          "displayName": "Ca Ntstopthesignals"
        },
        "organizer": {
          "email": this.calendar1Id_,
          "displayName": "5mins",
          "self": true
        },
        "start": {
          "dateTime": "2012-05-28T20:30:00-07:00"
        },
        "end": {
          "dateTime": "2012-05-28T21:30:00-07:00"
        },
        "iCalUID": this.getUniqueICalId_(),
        "sequence": 7,
        "reminders": {
          "useDefault": true
        }
      }
    ]
  };
};
