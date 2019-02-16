// Copyright cantstopthesignals@gmail.com

goog.provide('five.deviceParams');

goog.require('five.device');


/** @constructor */
five.deviceParams.DeviceParams = function() {
  var isTouch = five.device.isTouch();
  var isMobile = five.device.isMobile();

  this.timeAxisWidth = isMobile ? 45 : 40;
  this.timeAxisPatchWidth = 15;
  this.defaultHourHeight = isMobile ? 50 : 45;
  this.minEventHeight = isMobile ? 21 : 17;

  this.eventCardMinShortHeight = isMobile ? 28 : 26;
  this.eventCardMinNormalHeight = isMobile ? 32 : 30;
  this.eventCardMinLargeHeight = 44;
  this.eventCardHitBoxMargin = 5;

  this.timelineMinWidth = 400;
  this.timelineMaxWidth = 600;
  this.timelineRightGutterWidth = !isMobile ? 24 : 0;

  this.enableInlineEventsEditor = !isTouch;
  this.inlineEventsEditorHeight = 48;

  this.showTimeMarkerLabels = true;
  this.enableCursorTimeMarker = !isTouch;
  this.enableDragCreateEvent = !isTouch;
  this.enableDragEvents = !isTouch;
  this.enableDragMoveControls = true;
};
goog.addSingletonGetter(five.deviceParams.DeviceParams);

goog.scope(function() {
  var getInstance = five.deviceParams.DeviceParams.getInstance;

  /** @return {number} */
  five.deviceParams.getTimeAxisWidth = function() {
    return getInstance().timeAxisWidth;
  };

  /** @return {number} */
  five.deviceParams.getTimeAxisPatchWidth = function() {
    return getInstance().timeAxisPatchWidth;
  };

  /** @return {number} */
  five.deviceParams.getDefaultHourHeight = function() {
    return getInstance().defaultHourHeight;
  };

  /** @return {number} */
  five.deviceParams.getMinEventHeight = function() {
    return getInstance().minEventHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinShortHeight = function() {
    return getInstance().eventCardMinShortHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinNormalHeight = function() {
    return getInstance().eventCardMinNormalHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinLargeHeight = function() {
    return getInstance().eventCardMinLargeHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardHitBoxMargin = function() {
    return getInstance().eventCardHitBoxMargin;
  };

  /** @return {number} */
  five.deviceParams.getTimelineMinWidth = function() {
    return getInstance().timelineMinWidth;
  };

  /** @return {number} */
  five.deviceParams.getTimelineMaxWidth = function() {
    return getInstance().timelineMaxWidth;
  };

  /** @return {number} */
  five.deviceParams.getTimelineRightGutterWidth = function() {
    return getInstance().timelineRightGutterWidth;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableInlineEventsEditor = function() {
    return getInstance().enableInlineEventsEditor;
  };

  /** @return {number} */
  five.deviceParams.getInlineEventsEditorHeight = function() {
    return getInstance().inlineEventsEditorHeight;
  };

  /** @return {boolean} */
  five.deviceParams.getShowTimeMarkerLabels = function() {
    return getInstance().showTimeMarkerLabels;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableCursorTimeMarker = function() {
    return getInstance().enableCursorTimeMarker;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableDragCreateEvent = function() {
    return getInstance().enableDragCreateEvent;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableDragEvents = function() {
    return getInstance().enableDragEvents;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableDragMoveControls = function() {
    return getInstance().enableDragMoveControls;
  };
});
