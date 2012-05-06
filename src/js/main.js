// Copyright cantstopthesignals@gmail.com

goog.provide('main');

goog.require('goog.Uri');

var main = {};

main.handleGapiCalendarCallback = function() {
  window.console.log("calendar api called back");
};

main.handleGapiJavascriptClientCallback = function() {
  window['gapi']['client']['setApiKey'](main.GAPI_API_KEY);
  window['gapi']['client']['load']('calendar', 'v3',
      main.handleGapiCalendarCallback);
};

main.GAPI_JS_CALLBACK_NAME = 'gapi_js_callback';

main.GAPI_API_KEY = 'AIzaSyDh5fbf_pmhJko-6SBua7ptbjnrNl9Jer4';

main.setupGapiJavascriptClient = function() {
  window[main.GAPI_JS_CALLBACK_NAME] =
      main.handleGapiJavascriptClientCallback;
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = "https://apis.google.com/js/client.js?onload=" +
      main.GAPI_JS_CALLBACK_NAME;
  document.body.appendChild(scriptEl);
};

window.onload = function() {
  main.setupGapiJavascriptClient();
};
