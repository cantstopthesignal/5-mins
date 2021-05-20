// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceWorkerApi');


five.ServiceWorkerApi = {};

/** @type {!string} */
five.ServiceWorkerApi.MESSAGE_COMMAND_KEY = 'command';

/** @type {!string} */
five.ServiceWorkerApi.COMMAND_CHECK_APP_UPDATE_AVAILABLE = 'checkAppUpdateAvailable';

/** @type {!string} */
five.ServiceWorkerApi.COMMAND_UPDATE_AVAILABLE = 'updateAvailable';

/** @type {!string} */
five.ServiceWorkerApi.COMMAND_CALENDAR_API_RPC = 'calendarApiRpc';

/** @type {!string} */
five.ServiceWorkerApi.COMMAND_AUTH_RPC = 'authRpc';

/** @type {!string} */
five.ServiceWorkerApi.SYNC_TAG = 'sync';