// Copyright cantstopthesignals@gmail.com

goog.provide('five.BaseAuth');

goog.require('five.Service');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.log');


/**
 * Base Auth.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.BaseAuth = function() {
  goog.base(this);
};
goog.inherits(five.BaseAuth, goog.events.EventTarget);

/**
 * Restart auth in the case where an api has detected an authorization failure.
 */
five.BaseAuth.prototype.restart = goog.abstractMethod;

/**
 * Check if the current auth token seems to be valid.
 * @return {boolean}
 */
five.BaseAuth.prototype.isTokenValid = goog.abstractMethod;

/** @return {!goog.async.Deferred} */
five.BaseAuth.prototype.getAuthDeferred = goog.abstractMethod;

/** @return {!string} */
five.BaseAuth.prototype.getAuthorizationHeaderValue = goog.abstractMethod;