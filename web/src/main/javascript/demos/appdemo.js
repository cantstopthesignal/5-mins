// Copyright cantstopthesignals@gmail.com

goog.provide('five.demos.AppDemo');

goog.require('five.Component');
goog.require('five.device');
goog.require('five.util');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.DateTime');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.events.EventHandler');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('goog.testing.jsunit');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.demos.AppDemo = function() {
  goog.base(this);

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.demos.AppDemo, goog.events.EventTarget);

five.demos.AppDemo.loadCss = function() {
  function loadStylesheet(filename) {
    var stylesheetEl = document.createElement('link');
    stylesheetEl.setAttribute('rel', 'stylesheet');
    stylesheetEl.setAttribute('type', 'text/css');
    stylesheetEl.setAttribute('href', filename);
    document.head.appendChild(stylesheetEl);
  }

  loadStylesheet('appdemo.css');

  var uri = new goog.Uri(window.location.href);
  var zoom = parseFloat(uri.getParameterValue('zoom') || '1');
  var fixedWidth = uri.getParameterValue('width');
  if (fixedWidth) {
    document.documentElement.style.width = fixedWidth + 'px';
  }
  var fixedHeight = uri.getParameterValue('height');
  if (fixedHeight) {
    document.documentElement.style.height = fixedHeight + 'px';
  }
  if (zoom != 1) {
    var transformOrigin = 'top left';
    var transform = 'scale(' + zoom + ',' + zoom + ')';
    document.documentElement.style.transformOrigin = transformOrigin;
    document.documentElement.style.mozTransformOrigin = transformOrigin;
    document.documentElement.style.webkitTransformOrigin = transformOrigin;
    document.documentElement.style.transform = transform;
    document.documentElement.style.mozTransform = transform;
    document.documentElement.style.webkitTransform = transform;
  }
};

five.demos.AppDemo.stripDomWhitespace = function(opt_node) {
  var node = opt_node || document.body;
  while (node) {
    var nextNode = node.nextSibling;
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      if (!node.data.trim().length) {
        goog.dom.removeNode(node);
      }
    } else if (node.firstChild) {
      five.demos.AppDemo.stripDomWhitespace(node.firstChild);
    }
    node = nextNode;
  }
};

five.demos.AppDemo.prototype.start = function() {
  this.eventHandler_.listen(window, goog.events.EventType.RESIZE,
      this.handleResize_);
  this.handleResize_();
};

five.demos.AppDemo.prototype.handleResize_ = function() {
  var eventAreaWidths = this.calcEventAreaWidths_();
  var appBar = goog.dom.getElementByClass('app-bar');
  var eventAreas = goog.array.clone(goog.dom.getElementsByClass('event-area'));
  while (eventAreas.length < eventAreaWidths.length) {
    var newEventArea = eventAreas[0].cloneNode(true);
    eventAreas[0].parentNode.appendChild(newEventArea);
    eventAreas.push(newEventArea);
  }
  while (eventAreas.length > eventAreaWidths.length) {
    goog.dom.removeNode(eventAreas[0]);
    eventAreas.pop();
  }
  var bodyHeight = document.body.offsetHeight;
  var appBarHeight = appBar.offsetHeight;
  var xPos = 0;
  goog.array.forEach(eventAreas, function(eventArea, idx) {
    eventArea.style.height = (bodyHeight - appBarHeight) + 'px';
    eventArea.style.width = eventAreaWidths[idx] + 'px';
    eventArea.style.left = xPos + 'px';
    xPos += eventAreaWidths[idx];
  });
};

five.demos.AppDemo.prototype.calcEventAreaWidths_ = function() {
  var minPixelsPerEventArea = 400;
  var maxPixelsPerEventArea = 600;
  var numEventAreas = Math.max(1, Math.floor(
      document.body.offsetWidth / minPixelsPerEventArea));
  var widthPerArea = Math.min(maxPixelsPerEventArea,
      Math.floor(document.body.offsetWidth / numEventAreas));
  var widths = [];
  for (var i = 0; i < numEventAreas; i++) {
    widths.push(widthPerArea);
  }
  return widths;
};

function testLoad() {
  // Ensure the demo loads without javascript errors.
}
