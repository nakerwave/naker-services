import { Animation } from '../Animation/animation';
import remove from 'lodash/remove';
import { Vector2 } from '@babylonjs/core/Maths/math';
/**
 * Detect scroll action of the user
 */
var ScrollCatcher = /** @class */ (function () {
    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt scroll height
     */
    function ScrollCatcher(system, responsive) {
        var _this = this;
        /**
         * Current scroll position
         */
        this.scrollReal = 0;
        /**
         * Position of the scroll catching the real scroll due to animation
         */
        this.scrollCatch = 0;
        /**
         * Pourcentage of current scroll catch compare with the full scroll size
         */
        this.scrollPercentage = 0;
        /**
         * Scrollable height (Used to simulate real scroll in Intale)
         */
        this.scrollHeight = 1000;
        /**
          * Rather than simulating scroll, you can choose to follow real container scroll (need overflow to be visible)
         * Automatically activated if scene container is the body of the window
         */
        this.followWindowScroll = false;
        /**
         * The position of drag start when on smartphone
         */
        this.touchStart = Vector2.Zero();
        /**
         * The gap of drag between start and current touch when on smartphone
         */
        this.touchGap = Vector2.Zero();
        /**
         * Is the scroll currently catched or not
         */
        this.catching = false;
        /**
         * List of scroll start listeners
         * @ignore
         */
        this._startListeners = [];
        /**
         * List of scroll stop listeners
         * @ignore
         */
        this._stopListeners = [];
        /**
        * Allow to add a listener on special events
        * @ignore
        */
        this._mouseWheelListeners = [];
        /**
        * Spped of the scroll used when mousewheel or drag on phone
        */
        this.speed = 20;
        /**
         * List of all functions following the scroll position
         * @ignore
         */
        this._listeners = [];
        this._system = system;
        this.animation = new Animation(this._system, 10);
        responsive.addListener(function () {
            _this.checkHeight(_this.scrollHeight);
        });
        this._setScrollEvent();
        this._setMobileDragEvent();
    }
    /**
     * Set the scrollable height
     * @param height The new scrollable height
     */
    ScrollCatcher.prototype.setScrollHeight = function (height) {
        if (!this.scrollHeight)
            this.followWindowScroll = false;
        this.checkHeight(height);
    };
    /**
     * Check if all condition are present in order to have a correct scroll
     * @param height On what height should be base the test
     */
    ScrollCatcher.prototype.checkHeight = function (height) {
        if (this._system.container) {
            if (this._system.container == document.body) {
                // If overflow style = hidden, there is no scrollingElement on document
                if (document.scrollingElement) {
                    this.scrollHeight = document.scrollingElement.scrollHeight - window.innerHeight;
                }
            }
            else {
                this.scrollHeight = this._system.container.scrollHeight - this._system.container.clientHeight;
            }
        }
        // On some browser or phone, you can have a small different even if page not scrollable
        // Plus 50 is way too short to make et scene scroll
        if (this.scrollHeight <= 50) {
            this.scrollHeight = height;
            this.followWindowScroll = false;
        }
        else {
            this.followWindowScroll = true;
        }
    };
    /**
     * Initiate the scroll/mousewheel events in order to trigger scroll action
     * @ignore
     */
    ScrollCatcher.prototype._setScrollEvent = function () {
        var _this = this;
        // Body use different evnet for scroll
        if (this._system.container == document.body) {
            window.addEventListener("scroll", function (evt) {
                if (!_this.followWindowScroll)
                    return;
                // If overflow style = hidden, there is no scrollingElement on document
                if (document.scrollingElement) {
                    var top_1 = document.scrollingElement.scrollTop;
                    if (_this.catching)
                        _this.catchTop(top_1);
                }
            });
        }
        else {
            this._system.container.addEventListener("scroll", function (evt) {
                if (!_this.followWindowScroll)
                    return;
                var top = _this._system.container.scrollTop;
                if (_this.catching)
                    _this.catchTop(top);
            });
        }
        this._system.container.addEventListener("mousewheel", function (evt) {
            var top = _this.scrollReal + evt.deltaY;
            _this.mouseWheel(evt, top);
        });
        // Firefox trigger this other event which we need to prevent to avoid body scroll when in Intale
        this._system.container.addEventListener("MozMousePixelScroll", function (evt) {
            evt.preventDefault();
        });
        // Firefox use DOMMouseScroll
        this._system.container.addEventListener("DOMMouseScroll", function (evt) {
            var top = _this.scrollReal + evt.detail * 50;
            _this.mouseWheel(evt, top);
        });
    };
    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    ScrollCatcher.prototype._setMobileDragEvent = function () {
        var _this = this;
        var count = 0;
        this._system.canvas.addEventListener("touchstart", function (evt) {
            _this.touchStart.x = evt.changedTouches[0].clientX;
            _this.touchStart.y = evt.changedTouches[0].clientY;
            count = 0;
        });
        this._system.canvas.addEventListener("touchmove", function (evt) {
            if (_this.touchStart && _this.catching) {
                var x = evt.changedTouches[0].clientX;
                var y = evt.changedTouches[0].clientY;
                _this.touchGap.x = (_this.touchStart.x - x);
                _this.touchGap.y = (_this.touchStart.y - y);
                if (Math.abs(_this.touchGap.x) < Math.abs(_this.touchGap.y)) {
                    var top_2 = _this.scrollReal + _this.touchGap.y;
                    if (_this.catching)
                        _this.catchTop(top_2);
                    count++;
                    if (count == 50) {
                        _this.touchStart.x = x;
                        _this.touchStart.y = y;
                        count = 0;
                    }
                }
            }
        });
    };
    /**
     * Restart scroll catcher
     */
    ScrollCatcher.prototype.restart = function () {
        this.stop();
        this.start();
    };
    /**
     * Start catching scroll
     */
    ScrollCatcher.prototype.start = function () {
        this.catching = true;
        if (this.followWindowScroll) {
            if (this._system.container == document.body) {
                if (document.scrollingElement) {
                    var top_3 = document.scrollingElement.scrollTop;
                    this.catchTop(top_3);
                }
            }
            else {
                var top_4 = this._system.container.scrollTop;
                this.catchTop(top_4);
            }
        }
        else {
            var top_5 = this.scrollReal;
            this.catchTop(top_5);
        }
        this.sendToListsteners();
        this.sendStartToListeners();
    };
    /**
     * Send start event to listeners
     */
    ScrollCatcher.prototype.sendStartToListeners = function () {
        for (var i = 0; i < this._startListeners.length; i++) {
            this._startListeners[i]();
        }
    };
    /**
     * Stop catching scroll
     */
    ScrollCatcher.prototype.stop = function () {
        this.animation.stop();
        this.catching = false;
        this.movingToStep = false;
        this.sendStopToListeners();
    };
    /**
     * Send stop event to listeners
     */
    ScrollCatcher.prototype.sendStopToListeners = function () {
        for (var i = 0; i < this._stopListeners.length; i++) {
            this._stopListeners[i]();
        }
    };
    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     */
    ScrollCatcher.prototype.on = function (what, funct) {
        if (what == 'start')
            this._startListeners.push(funct);
        else if (what == 'stop')
            this._stopListeners.push(funct);
        else if (what == 'mouseWheel')
            this._mouseWheelListeners.push(funct);
    };
    /**
    * Called when a mousewheel event occur
    * @param evt Event of the mouse wheel
    * @param top What is the new top position due to this mouseWheel event
    */
    ScrollCatcher.prototype.mouseWheel = function (evt, top) {
        if (this._system.container != document.body) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        for (var i = 0; i < this._mouseWheelListeners.length; i++) {
            this._mouseWheelListeners[i]();
        }
        if (this.followWindowScroll)
            return;
        if (this.catching)
            this.catchTop(top);
    };
    /**
    * Set the speed of the scrollCatcher
    * @param speed The new speed
    */
    ScrollCatcher.prototype.setSpeed = function (speed) {
        this.speed = speed;
    };
    /**
    * Catch the new top position due to scroll, mousewheel or drag
    * @param top What is the top position to be catched
    */
    ScrollCatcher.prototype.catchTop = function (top) {
        if (!this.followWindowScroll)
            this.catch(top, this.speed);
    };
    /**
     * Catch the scroll
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    ScrollCatcher.prototype.catch = function (top, speed) {
        var _this = this;
        // Sometimes on iphone, top can go below 0
        if (!top)
            top = 0;
        top = Math.max(0, top);
        top = Math.min(this.scrollHeight, top);
        if (top == this.scrollReal)
            return;
        this.scrollReal = top;
        this.animation.infinite(function () {
            var gapscroll = _this.scrollReal - _this.scrollCatch;
            var step = Math.sign(gapscroll) * Math.min(Math.abs(gapscroll) / 20, speed);
            _this.scrollCatch += step;
            _this.scrollPercentage = _this.scrollCatch / _this.scrollHeight;
            if (Math.abs(gapscroll) < 2)
                _this.animation.running = false;
            _this.sendToListsteners();
        });
    };
    /**
      * Send scroll change data to listeners
     */
    ScrollCatcher.prototype.sendToListsteners = function () {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this.scrollCatch, this.scrollPercentage);
        }
    };
    /**
     * Add a new listener which will get the catching scroll position
     */
    ScrollCatcher.prototype.addListener = function (callback) {
        this._listeners.push(callback);
    };
    /**
     * Remove a listener to stop following scroll
     */
    ScrollCatcher.prototype.removeListener = function (callback) {
        remove(this._listeners, function (c) { c == callback; });
    };
    return ScrollCatcher;
}());
export { ScrollCatcher };
