
import { Animation, AnimationManager } from '../Animation/animation';
import { ResponsiveCatcher } from './ResponsiveCatcher';

import remove from 'lodash/remove';
import { Vector2 } from '@babylonjs/core/Maths/math';

/**
 * Detect scroll action of the user
 */

export class ScrollCatcher {

    /**
     * @ignore
     */
    _container: HTMLElement;

    /**
     * Current scroll position
     */
    scrollReal = 0;

    /**
     * Position of the scroll catching the real scroll due to animation
     */
    scrollCatch = 0;

    /**
     * Pourcentage of current scroll catch compare with the full scroll size
     */
    scrollPercentage = 0;

    /**
     * Distance left to be reached by scroll animation
     */
    scrollGap = 0;

    /**
     * Scrollable height (Used to simulate real scroll in Intale)
     */
    scrollHeight = 1000;

    /**
     * Use to animate the catching
     */
    animation: Animation;

    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt scroll height
     */
    constructor(animationManager: AnimationManager, container:HTMLElement, responsive: ResponsiveCatcher) {
        this.animation = new Animation(animationManager, 10);
        this._container = container;
        
        responsive.addListener(() => {
            this.checkHeight(this.scrollHeight);
        });

        this._setScrollEvent();
        this._setMobileDragEvent();
    }

    /**
     * Set the scrollable height
     * @param height The new scrollable height
     */
    setScrollHeight(height: number) {
        if (!this.scrollHeight) this.followWindowScroll = false;
        this.checkHeight(height);
    }

    /**
      * Rather than simulating scroll, you can choose to follow real container scroll (need overflow to be visible)
     * Automatically activated if scene container is the body of the window
     */
    followWindowScroll = false;

    /**
     * Check if all condition are present in order to have a correct scroll
     * @param height On what height should be base the test
     */
    checkHeight(height: number) {
        if (this._container) {
            if (this._container == document.body) {
                // If overflow style = hidden, there is no scrollingElement on document
                if (document.scrollingElement) {
                    this.scrollHeight = document.scrollingElement.scrollHeight - window.innerHeight;
                }
            } else {
                this.scrollHeight = this._container.scrollHeight - this._container.clientHeight;
            }
        }
        // On some browser or phone, you can have a small different even if page not scrollable
        // Plus 50 is way too short to make et scene scroll
        if (this.scrollHeight <= 50) {
            this.scrollHeight = height;
            this.followWindowScroll = false;
        } else {
            this.followWindowScroll = true;
        }
    }

    /**
     * Initiate the scroll/mousewheel events in order to trigger scroll action
     * @ignore
     */
    _setScrollEvent() {
        // Body use different evnet for scroll
        if (this._container == document.body) {
            window.addEventListener("scroll", (evt) => {
                if (!this.followWindowScroll) return;
                // If overflow style = hidden, there is no scrollingElement on document
                if (document.scrollingElement) {
                    let top = document.scrollingElement.scrollTop;
                    if (this.catching) this.catchTop(top);
                }
            });
        } else {
            this._container.addEventListener("scroll", (evt) => {
                if (!this.followWindowScroll) return;
                let top = this._container.scrollTop;
                if (this.catching) this.catchTop(top);
            });
        }

        this._container.addEventListener("mousewheel", (evt) => {
            let top = this.scrollReal + evt.deltaY;
            this.mouseWheel(evt, top);
        });

        // Firefox trigger this other event which we need to prevent to avoid body scroll when in Intale
        this._container.addEventListener("MozMousePixelScroll", (evt) => {
            evt.preventDefault();
        });

        // Firefox use DOMMouseScroll
        this._container.addEventListener("DOMMouseScroll", (evt: any) => {
            let top = this.scrollReal + evt.detail * 50;
            this.mouseWheel(evt, top);
        });
    }

    /**
     * The position of drag start when on smartphone
     */
    touchStart = Vector2.Zero();

    /**
     * The gap of drag between start and current touch when on smartphone
     */
    touchGap = Vector2.Zero();

    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setMobileDragEvent() {
        let count = 0;
        this._container.addEventListener("touchstart", (evt) => {
            this.touchStart.x = evt.changedTouches[0].clientX;
            this.touchStart.y = evt.changedTouches[0].clientY;
            count = 0;
        });
        this._container.addEventListener("touchmove", (evt) => {
            if (this.touchStart && this.catching) {
                let x = evt.changedTouches[0].clientX;
                let y = evt.changedTouches[0].clientY;
                this.touchGap.x = (this.touchStart.x - x);
                this.touchGap.y = (this.touchStart.y - y);
                if (Math.abs(this.touchGap.x) < Math.abs(this.touchGap.y)) {
                    let top = this.scrollReal + this.touchGap.y;
                    if (this.catching) this.catchTop(top);
                    count++;
                    if (count == 50) {
                        this.touchStart.x = x;
                        this.touchStart.y = y;
                        count = 0;
                    }
                }
            }
        });
    }

    /**
     * Restart scroll catcher
     */
    restart() {
        this.stop();
        this.start();
    }

    /**
     * Is the scroll currently catched or not
     */
    catching = false;

    /**
     * Start catching scroll
     */
    start() {
        this._start();
    }

    /**
     * @ignore
     */
    _start() {
        this.catching = true;
        if (this.followWindowScroll) {
            if (this._container == document.body) {
                if (document.scrollingElement) {
                    let top = document.scrollingElement.scrollTop;
                    this.catchTop(top);
                }
            } else {
                let top = this._container.scrollTop;
                this.catchTop(top);
            }
        } else {
            let top = this.scrollReal;
            this.catchTop(top);
        }
        this.sendToListsteners();
        this.sendStartToListeners();
    }

    /**
     * Send start event to listeners
     */
    sendStartToListeners() {
        for (let i = 0; i < this._startListeners.length; i++) {
            this._startListeners[i]();
        }
    }

    /**
     * Stop catching scroll
     */
    stop() {
        this._stop();
    }

    /**
     * @ignore
     */
    _stop() {
        this.animation.stop();
        this.catching = false;
        this.sendStopToListeners();
    }

    /**
     * Send stop event to listeners
     */
    sendStopToListeners() {
        for (let i = 0; i < this._stopListeners.length; i++) {
            this._stopListeners[i]();
        }
    }

    /**
     * List of scroll start listeners
     * @ignore
     */
    _startListeners: Array<Function> = [];

    /**
     * List of scroll stop listeners
     * @ignore
     */
    _stopListeners: Array<Function> = [];

    /**
    * Allow to add a listener on special events
    * @ignore
    */
    _mouseWheelListeners: Array<Function> = [];

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     */
    on(what: 'start' | 'stop' | 'mouseWheel', funct: Function) {
        if (what == 'start') this._startListeners.push(funct);
        else if (what == 'stop') this._stopListeners.push(funct);
        else if (what == 'mouseWheel') this._mouseWheelListeners.push(funct);
    }

    /**
    * Called when a mousewheel event occur
    * @param evt Event of the mouse wheel
    * @param top What is the new top position due to this mouseWheel event
    */
    mouseWheel(evt: MouseEvent, top: number) {
        if (this._container != document.body) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        for (let i = 0; i < this._mouseWheelListeners.length; i++) {
            this._mouseWheelListeners[i]();
        }
        if (this.followWindowScroll) return;
        if (this.catching) this.catchTop(top);
    }

    /**
    * Spped of the scroll used when mousewheel or drag on phone
    */
    speed = 20;
    /**
    * Set the speed of the scrollCatcher
    * @param speed The new speed
    */
    setSpeed(speed: number) {
        this.speed = speed;
    }

    /**
    * Catch the new top position due to scroll, mousewheel or drag
    * @param top What is the top position to be catched
    */
    catchTop(top: number) {
        if (!this.followWindowScroll) this.catch(top, this.speed);
    }

    /**
     * Catch the scroll
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    catch(top: number, speed: number) {
        // Sometimes on iphone, top can go below 0
        if (!top) top = 0;
        top = Math.max(0, top);
        top = Math.min(this.scrollHeight, top);
        if (top == this.scrollReal) return;
        this.scrollReal = top;
        this.animation.infinite(() => {
            this.scrollGap = this.scrollReal - this.scrollCatch;
            let step = Math.sign(this.scrollGap) * Math.min(Math.abs(this.scrollGap) / 20, speed);
            this.scrollCatch += step;
            this.scrollPercentage = this.scrollCatch / this.scrollHeight;
            if (Math.abs(this.scrollGap) < 2) this.animation.running = false;
            this.sendToListsteners();
        });
    }

    /**
      * Send scroll change data to listeners
     */
    sendToListsteners() {
        for (let i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this.scrollCatch, this.scrollPercentage, this.scrollGap);
        }
    }

    /**
     * List of all functions following the scroll position
     * @ignore
     */
    _listeners: Array<Function> = [];

    /**
     * Add a new listener which will get the catching scroll position
     */
    addListener(callback: Function) {
        this._listeners.push(callback);
    }

    /**
     * Remove a listener to stop following scroll
     */
    removeListener(callback: Function) {
        remove(this._listeners, (c) => { c == callback });
    }
}
