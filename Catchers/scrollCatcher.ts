import { ResponsiveCatcher } from './ResponsiveCatcher';
import { ProgressCatcher } from './progressCatcher';
import { SystemAnimation } from '../System/systemAnimation';

import { Vector2 } from '@babylonjs/core/Maths/math';
import { setStyle } from 'redom';
import { TouchCatcher } from './touchCatcher';

/**
 * Detect scroll action of the user
 */

export class ScrollCatcher extends ProgressCatcher {

    /**
     * @ignore
     */
    _container: HTMLElement;

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
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt scroll height
     */
    constructor(system: SystemAnimation, container: HTMLElement, responsive: ResponsiveCatcher, touchCatcher: TouchCatcher) {
        super(system);
        this._container = container;
        this.system = system;
        
        responsive.addListener(() => {
            this.checkHeight(this.scrollHeight);
        });

        this._setScrollEvent();
        this._setMobileDragEvent(touchCatcher);
    }

    /**
     * Set the scrollable height
     * @param height The new scrollable height
     */
    setScrollHeight(height: number) {
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
                    this.scrollHeight = document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight;
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
                let top = document.scrollingElement.scrollTop;
                this.scrollEvent(top);
            });
        } else {
            this._container.addEventListener("scroll", (evt) => {
                if (!this.followWindowScroll) return;
                let top = this._container.scrollTop;
                this.scrollEvent(top);
            });
        }

        this._container.addEventListener("mousewheel", (evt) => {
            let top = this.progressReal * this.scrollHeight + evt.deltaY;
            this.mouseWheelEvent(evt, top);
        });

        // Wheel is continuously called when on a pad
        // Unfortunately can not find an event to trigger real end of scroll
        this._container.addEventListener("wheel", (evt) => {
            let top = this.progressReal * this.scrollHeight + evt.deltaY;
            this.mouseWheelEvent(evt, top);
        });

        // Firefox trigger this other event which we need to prevent to avoid body scroll when in Stpry
        this._container.addEventListener("MozMousePixelScroll", (evt) => {
            this.checkPreventComputerScroll(evt);
        });

        // Firefox use DOMMouseScroll
        this._container.addEventListener("DOMMouseScroll", (evt: any) => {
            let top = this.progressReal * this.scrollHeight + evt.detail * 50;
            this.mouseWheelEvent(evt, top);
        });
    }

    /**
     * The position of drag start when on smartphone
     */
    // touchStart = Vector2.Zero();

    // /**
    //  * The gap of drag between start and current touch when on smartphone
    //  */
    // touchGap = Vector2.Zero();

    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setMobileDragEvent(touchCatcher: TouchCatcher) {
        touchCatcher.addListener((change: Vector2, evt) => {
            this.checkPreventBodyScroll(evt, change.y);
            if (Math.abs(change.x) < Math.abs(change.y)) {
                let top = this.progressReal * this.scrollHeight + change.y/100;
                if (this.catching) this.catchTop(top);
            }
        });

        // let count = 0;
        // this._container.addEventListener("touchstart", (evt) => {
        //     this.touchStart.x = evt.changedTouches[0].clientX;
        //     this.touchStart.y = evt.changedTouches[0].clientY;
        //     count = 0;
        // });
        // // Need test
        // // this._container.addEventListener("touchend", (evt) => {
        // //     this.touchStart = null;
        // //     count = 0;
        // // });
        // this._container.addEventListener("touchmove", (evt) => {
        //     if (this.touchStart && this.catching) {
        //         let x = evt.changedTouches[0].clientX;
        //         let y = evt.changedTouches[0].clientY;
        //         this.touchGap.x = (this.touchStart.x - x);
        //         this.touchGap.y = (this.touchStart.y - y);
        //         this.checkPreventBodyScroll(evt, this.touchGap.y);
        //         if (Math.abs(this.touchGap.x) < Math.abs(this.touchGap.y)) {
        //             let top = this.progressReal * this.scrollHeight + this.touchGap.y;
        //             if (this.catching) this.catchTop(top);
        //             count++;
        //             if (count == 50) {
        //                 this.touchStart.x = x;
        //                 this.touchStart.y = y;
        //                 count = 0;
        //             }
        //         }
        //     }
        // });
    }

    /**
     * @ignore
     */
    _start() {
        this.catching = true;
        this.progressCatch = 0; 
        this.progressGap = 0;
        
        if (this.followWindowScroll) {
            if (this._container == document.body) {
                if (document.scrollingElement) {
                    let top = document.scrollingElement.scrollTop;
                    let height = document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight;
                    if (this.catching) this.catch(top / height);
                }
            } else {
                let top = this._container.scrollTop;
                this.catchTop(top);
            }
        } else {
            let top = this.progressReal * this.scrollHeight;
            this.catchTop(top);
        }
        this.sendToListsteners();
        this.sendStartToListeners();
    }

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

    scrollEvent(top: number) {
        if (this.catching) this.catchTop(top);
    }

    /**
    * Called when a mousewheel event occur
    * @param evt Event of the mouse wheel
    * @param top What is the new top position due to this mouseWheel event
    */
    mouseWheelEvent(evt: MouseEvent, top: number) {
        if (this.followWindowScroll) return;
        this.checkPreventComputerScroll(evt);
        for (let i = 0; i < this._mouseWheelListeners.length; i++) {
            this._mouseWheelListeners[i]();
        }
        if (this.catching) this.catchTop(top);
    }

    checkPreventComputerScroll(evt: MouseEvent) {
        let delta = evt.deltaY;
        if (delta === undefined) delta = evt.detail;
        if (delta === undefined) delta = 0;
        this.checkPreventBodyScroll(evt, delta);
    }

    checkPreventBodyScroll(evt: MouseEvent | TouchEvent, move: number) {
        // Try to have different sensitivity when leaving or entering
        // Should be easy to leave and fast to enter
        // let topTest =false, bottomTest =false;
        // if (move >= 0) {
        //     if (this.progressCatch - this.accuracy > 0) topTest = true;
        //     else if (this.progressCatch + 10 * this.accuracy < 1) bottomTest = true;
        // } else {
        //     if (this.progressCatch + this.accuracy > 0) bottomTest = true;
        //     else if (this.progressCatch - 10 * this.accuracy < 1) topTest = true;
        // }
        // console.log(topTest, bottomTest);

        // If scroll reach start or end we stop preventing page scroll
        let topTest = this.progressCatch + 10 * this.accuracy < 1 && move >= 0;
        let bottomTest = this.progressCatch - 10 * this.accuracy > 0 && move <= 0;
        
        if (this._container != document.body && (topTest || bottomTest)) {
            evt.preventDefault();
            evt.stopPropagation();
            setStyle(this.system.canvas, { 'touch-action': 'none' });
        } else {
            setStyle(this.system.canvas, { 'touch-action': 'auto' });
        }
    }

    /**
    * Catch the percentage of the scrollHeight
    * @param perc What is the top position to be catched
    */
    catchPercentage(perc: number) {
        if (!this.followWindowScroll) this.catch(perc);
    }

    /**
    * Catch the new top position due to scroll, mousewheel or drag
    * @param top What is the top position to be catched
    */
    catchTop(top: number) {
        this._catchTop(top);
    }

    _catchTop(top: number) {
        if (!this.followWindowScroll) {
            let progress = top / this.scrollHeight;
            let change = 100 * Math.abs(progress - this.progressCatch);
            // The furthest, the fatest
            this.catch(top / this.scrollHeight, change * this.speed);
        }
    }
}
