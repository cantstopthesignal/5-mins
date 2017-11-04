// Copyright cantstopthesignals@gmail.com

goog.provide('five.demos.SplitsDemo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.fx.Animation');
goog.require('goog.fx.easing');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.testing.jsunit');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.demos.SplitsDemo = function() {
  goog.base(this);

  /** @type {Element} */
  this.el_;

  /** @type {Element} */
  this.boxEl_;

  /** @type {Array.<five.demos.SplitsDemo.Grid>} */
  this.grids_ = [];

  /** @rtpe {Array.<five.demos.SplitsDemo.Split>} */
  this.splits_ = [];

  this.splitState_ = 0;

  this.boxOffset_ = 0;
};
goog.inherits(five.demos.SplitsDemo, goog.events.EventTarget);

five.demos.SplitsDemo.WIDTH = 300;

five.demos.SplitsDemo.HEIGHT = 300;

five.demos.SplitsDemo.SPLIT_ANIMATION_DURATION_MS = 200;

five.demos.SplitsDemo.SPLIT_HEIGHT = 48;

five.demos.SplitsDemo.prototype.start = function() {
  this.el_ = document.createElement('div');
  goog.dom.classes.add(this.el_, 'container');
  document.body.appendChild(this.el_);

  this.boxEl_ = document.createElement('div');
  goog.dom.classes.add(this.boxEl_, 'box');
  document.body.appendChild(this.boxEl_);

  goog.style.setBorderBoxSize(this.boxEl_, new goog.math.Size(
      five.demos.SplitsDemo.WIDTH, five.demos.SplitsDemo.HEIGHT));

  for (var y = 20; y < five.demos.SplitsDemo.HEIGHT; y += 20) {
    var grid = new five.demos.SplitsDemo.Grid(y);
    goog.style.setPosition(grid.el, 0, y);
    goog.style.setBorderBoxSize(grid.el, new goog.math.Size(
        five.demos.SplitsDemo.WIDTH, 1));
    this.boxEl_.appendChild(grid.el);
    this.grids_.push(grid);
  }

  goog.events.listen(this.boxEl_, goog.events.EventType.CLICK,
      this.handleClickBox_, false, this);

  this.layout_();
};

five.demos.SplitsDemo.prototype.layout_ = function() {
  var yShift = 0;
  var splitIter = 0;
  var gridIter = 0;
  while (gridIter < this.grids_.length || splitIter < this.splits_.length) {
    var grid = this.grids_[gridIter];
    var split = this.splits_[splitIter];
    if (grid) {
      if (!split || grid.yPos <= split.yPos) {
        goog.style.setPosition(grid.el, 0, yShift + grid.yPos);
        gridIter++;
        continue;
      }
    }
    if (split) {
      goog.style.setPosition(split.el, 0, yShift + split.yPos);
      goog.style.setHeight(split.el, split.height);
      yShift += split.height;
      splitIter++;
      continue;
    }
  }
  this.boxEl_.style.top = this.boxOffset_ + 'px';
  goog.style.setHeight(this.boxEl_, five.demos.SplitsDemo.HEIGHT + yShift);
};

five.demos.SplitsDemo.prototype.handleClickBox_ = function(e) {
  var deletedSplits = goog.array.clone(this.splits_);
  var addedSplits = [];

  var createSplit = goog.bind(function(yPos) {
    var split = new five.demos.SplitsDemo.Split(yPos);
    goog.style.setPosition(split.el, 0, yPos);
    goog.style.setBorderBoxSize(split.el, new goog.math.Size(
        five.demos.SplitsDemo.WIDTH, 0));
    this.boxEl_.appendChild(split.el);
    addedSplits.push(split);
  }, this);

  var goalBoxOffset = 0;

  this.splitState_++;
  if (this.splitState_ == 1) {
    goalBoxOffset = -five.demos.SplitsDemo.SPLIT_HEIGHT;
    createSplit(50);
    createSplit(100);
    window.console.log('Next: Add a small event just above the region');
  } else if (this.splitState_ == 2) {
    goalBoxOffset = -five.demos.SplitsDemo.SPLIT_HEIGHT;
    createSplit(30);
    createSplit(100);
    window.console.log('Next: Add an event below the region');
  } else if (this.splitState_ == 3) {
    goalBoxOffset = -five.demos.SplitsDemo.SPLIT_HEIGHT;
    createSplit(30);
    createSplit(200);
    window.console.log('Next: Switch to a small event within the region');
  } else if (this.splitState_ == 4) {
    goalBoxOffset = -five.demos.SplitsDemo.SPLIT_HEIGHT;
    createSplit(50);
    createSplit(150);
    window.console.log(
        'Next: Switch to an event overlapping but starting later');
  } else if (this.splitState_ == 5) {
    goalBoxOffset = -five.demos.SplitsDemo.SPLIT_HEIGHT;
    createSplit(100);
    createSplit(200);
    window.console.log('Next: Clear events');
  } else {
    this.splitState_ = 0;
  }

  goog.array.extend(this.splits_, addedSplits);
  this.splits_.sort(function(a, b) {
    return a.yPos - b.yPos;
  });

  var addedSplits = goog.array.clone(addedSplits);

  var animation = new goog.fx.Animation([0, this.boxOffset_],
      [five.demos.SplitsDemo.SPLIT_HEIGHT, goalBoxOffset],
      five.demos.SplitsDemo.SPLIT_ANIMATION_DURATION_MS,
      goog.fx.easing.easeOut);
  var EventType = goog.fx.Animation.EventType;
  animation.registerDisposable(new goog.events.EventHandler(this).
      listen(animation, [EventType.END, EventType.ANIMATE], function(e) {
    this.boxOffset_ = e.coords[1];
    goog.array.forEach(addedSplits, function(split) {
      split.height = e.coords[0];
    }, this);
    goog.array.forEach(deletedSplits, function(split) {
      split.height = five.demos.SplitsDemo.SPLIT_HEIGHT - e.coords[0];
      if (e.type == EventType.END) {
        goog.dom.removeNode(split.el);
        this.splits_.splice(this.splits_.indexOf(split), 1);
      }
    }, this);
    this.layout_();
    if (e.type == EventType.END) {
      goog.dispose(animation);
    }
  }));
  animation.play();
};

five.demos.SplitsDemo.Grid = function(yPos) {
  this.yPos = yPos;
  this.el = document.createElement('div');
  goog.dom.classes.add(this.el, 'grid');
};

five.demos.SplitsDemo.Split = function(yPos) {
  this.yPos = yPos;
  this.height = 0;
  this.el = document.createElement('div');
  goog.dom.classes.add(this.el, 'split');
};

function testLoad() {
  // Ensure the demo loads without javascript errors.
}
