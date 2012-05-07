// Copyright cantstopthesignals@gmail.com

goog.provide('main');

goog.require('goog.asserts');
goog.require('goog.Uri');

var main = {};

main.GAPI_API_KEY = 'AIzaSyDh5fbf_pmhJko-6SBua7ptbjnrNl9Jer4';
main.GAPI_CLIENT_ID = '446611198518.apps.googleusercontent.com';
main.GAPI_SCOPES = ['https://www.googleapis.com/auth/calendar'];

main.GAPI_FULL_AUTH_TIMEOUT = 5000;

main.gapiFullAuthTimerId = null;

main.handleGapiCalendarLoad = function() {
  window.console.log("main.handleGapiCalendarLoad");

  var request = goog.getObjectByName('gapi.client.request')({
    path: '/calendar/v3/users/me/calendarList',
    params: {
      maxResults: 10
    }
  });

  request['execute'](function(resp) {
    window.console.log(resp);
  });
};

main.handleGapiClientLoad = function() {
  window.console.log('main.handleGapiClientLoad');
  goog.getObjectByName('gapi.client.setApiKey')(main.GAPI_API_KEY);
  goog.getObjectByName('gapi.auth.init')(main.handleGapiAuthInit);
};

main.handleGapiAuthInit = function() {
  window.console.log('main.handleGapiAuthInit');
  window.setTimeout(main.checkAuth, 1);
  main.gapiFullAuthTimerId = window.setTimeout(
      main.fullAuth, main.GAPI_FULL_AUTH_TIMEOUT);
};

main.checkAuth = function() {
  window.console.log('main.checkAuth');
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: main.GAPI_CLIENT_ID,
    scope: main.GAPI_SCOPES,
    immediate: true
  }, main.handleAuthResult);
};

main.fullAuth = function() {
  window.console.log('main.fullAuth');
  main.clearFullAuthTimer();
  goog.getObjectByName('gapi.auth.authorize')({
    client_id: main.GAPI_CLIENT_ID,
    scope: main.GAPI_SCOPES,
    immediate: false
  }, main.handleAuthResult);
};

main.clearFullAuthTimer = function() {
  if (main.gapiFullAuthTimerId) {
    window.clearTimeout(main.gapiFullAuthTimerId);
    main.gapiFullAuthTimerId = null;
  }
};

main.handleAuthResult = function(authResult) {
  window.console.log('main.handleAuthResult', authResult);
  if (!authResult) {
    // An empty auth result can happen if the user previously authorized
    // this service but then de-authorized.  Go immediately to full auth
    // in this case.
    main.fullAuth();
    return;
  }
  main.clearFullAuthTimer();
  goog.getObjectByName('gapi.client.load')('calendar', 'v3',
      main.handleGapiCalendarLoad);
};

main.loadGapiJavascriptClientAndAuth = function() {
  var callbackName = 'callback_' + goog.getUid(main.handleGapiClientLoad);
  goog.exportSymbol(callbackName, main.handleGapiClientLoad);
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/client.js?onload=" +
      callbackName;
  document.body.appendChild(scriptEl);
};

window.onload = function() {
  main.loadGapiJavascriptClientAndAuth();
};
