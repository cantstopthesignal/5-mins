// Copyright cantstopthesignals@gmail.com

goog.provide('five.testing.FakeCalendarApi');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * Fake calendar api for tests.
 * @param {five.testing.FakeAuth} fakeAuth
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.testing.FakeCalendarApi = function(fakeAuth) {
  goog.base(this);

  fakeAuth.addRequestHandler(goog.bind(this.handleRequest_, this));
};
goog.inherits(five.testing.FakeCalendarApi, goog.events.EventTarget);

/** @type {number} */
five.testing.FakeCalendarApi.nextId_ = 1;

/** @type {goog.debug.Logger} */
five.testing.FakeCalendarApi.prototype.logger_ = goog.debug.Logger.getLogger(
    'five.testing.FakeCalendarApi');

five.testing.FakeCalendarApi.prototype.getUniqueEtag_ = function() {
  return "\"etag" + (five.testing.FakeCalendarApi.nextId_++) + "\"";
};

five.testing.FakeCalendarApi.prototype.getUniqueEventUrl_ = function() {
  return "https://www.google.com/calendar/event?eid=testevent" +
      (five.testing.FakeCalendarApi.nextId_++);
};

five.testing.FakeCalendarApi.prototype.getUniqueEventId_ = function() {
  return "eventid" + (five.testing.FakeCalendarApi.nextId_++);
};

five.testing.FakeCalendarApi.prototype.getUniqueICalId_ = function() {
  return "icalid" + (five.testing.FakeCalendarApi.nextId_++) + "@google.com";
};

five.testing.FakeCalendarApi.prototype.handleRequest_ = function(path, params,
    callback) {
  var result;
  if (path == '/calendar/v3/users/me/calendarList') {
    result = this.getCalendarListResult_();
  } else if (path == '/calendar/v3/calendars/5minscalid1@' +
      'group.calendar.google.com/events') {
    result = this.getEventsResult_(params);
  }
  if (result) {
    callback(result);
    return true;
  }
  return false;
};

five.testing.FakeCalendarApi.prototype.getCalendarListResult_ = function() {
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
      "id": "5minscalid1@group.calendar.google.com",
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

five.testing.FakeCalendarApi.prototype.getEventsResult_ = function(params) {
  goog.asserts.assert(params['orderBy'] == 'startTime',
      "'orderBy' should be 'startTime'");
  goog.asserts.assert(params['singleEvents'] === true,
      "'singleEvents' should be true");
  goog.asserts.assert(goog.asserts.assertString(params['timeMin']),
      "'timeMin' should be a string");
  goog.asserts.assert(goog.asserts.assertString(params['timeMax']),
      "'timeMax' should be a string");
  return {
    "kind": "calendar#events",
    "etag": this.getUniqueEtag_(),
    "summary": "5mins",
    "description": "",
    "updated": "2012-05-28T17:05:05.000Z",
    "timeZone": "America/Los_Angeles",
    "accessRole": "owner",
    "items": [
     {
      "kind": "calendar#event",
      "etag": this.getUniqueEtag_(),
      "id": this.getUniqueEventId_(),
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
       "email": "5minscalid1@group.calendar.google.com",
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
     },
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
       "email": "5minscalid1@group.calendar.google.com",
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
