import { ProgressCatcher, ProgressEvent } from './progressCatcher';
import { SystemAnimation } from '../System/systemAnimation';
import { SystemEvent } from '../System/system';
import { TouchCatcher, NakerTouchEvent } from './touchCatcher';

import { setStyle } from 'redom';

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
     */
    constructor(system: SystemAnimation, container: HTMLElement, touchCatcher: TouchCatcher) {
        super(system);
        this._container = container;
        this.system = system;
        
        this.system.on(SystemEvent.Resize, () => {
            this.checkHeight();
        });

        this._setScrollEvent();
        this._setMobileDragEvent(touchCatcher);
    }

    /**
    * Speed of the progress used when mousewheel or drag on phone
    */
    scrollSpeed = 0.02;
    speedHeight = 1000;

    /**
    * Set the speed of the scrollCatcher
    * @param scrollSpeed The new speed
    */
    setScrollSpeed(scrollSpeed: number) {
        this.scrollSpeed = scrollSpeed;
        this.speedHeight = 1000/this.scrollSpeed;
        this.checkHeight();
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
    checkHeight() {
        let height: number;
        if (this._container) {
            if (this._container == document.body) {
                // If overflow style = hidden, there is no scrollingElement on document
                if (document.scrollingElement) {
                    height = document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight;
                }
            } else {
                height = this._container.scrollHeight - this._container.clientHeight;
            }
        }
        // On some browser or phone, you can have a small different even if page not scrollable
        // Plus 50 is way too short to make et scene scroll
        if (height <= 50) {
            this.scrollHeight = this.speedHeight;
            this.followWindowScroll = false;
        } else {
            this.scrollHeight = height;
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
                let top = document.scrollingElement.scrollTop;
                this.scrollEvent(top);
            });
        } else {
            this._container.addEventListener("scroll", (evt) => {
                let top = this._container.scrollTop;
                this.scrollEvent(top);
            });
        }

        this._container.addEventListener("mousewheel", (evt) => {
            let top = this.progressReal * this.scrollHeight + evt.deltaY;
            this.checkMouseWheel(evt, top);
        });

        // Wheel is continuously called when on a pad
        // Unfortunately can not find an event to trigger real end of scroll
        this._container.addEventListener("wheel", (evt) => {
            let top = this.progressReal * this.scrollHeight + evt.deltaY;
            this.checkMouseWheel(evt, top);
        });

        // Firefox trigger this other event which we need to prevent to avoid body scroll when in Stpry
        this._container.addEventListener("MozMousePixelScroll", (evt) => {
            this.checkPreventComputerScroll(evt);
        });

        // Firefox use DOMMouseScroll
        this._container.addEventListener("DOMMouseScroll", (evt: any) => {
            let top = this.progressReal * this.scrollHeight + evt.detail * 50;
            this.checkMouseWheel(evt, top);
        });
    }

    checkMouseWheel(evt: WheelEvent, top: number) {
        this.checkPreventComputerScroll(evt);
        this.mouseWheelEvent(top);
    }

    // Detect if mousewheel started from touchPad
    checkIfFromTouchPad(evt: WheelEvent): boolean {
        return evt.wheelDeltaY ? evt.wheelDeltaY === -3 * evt.deltaY : evt.deltaMode === 0
    }

    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setMobileDragEvent(touchCatcher: TouchCatcher) {
        touchCatcher.on(NakerTouchEvent.Move, (touchEvent) => {
            let change = touchEvent.change;
            let evt = touchEvent.event;
            this.checkPreventBodyScroll(evt, change.y);
            if (Math.abs(change.x) < Math.abs(change.y)) {
                let top = this.progressReal * this.scrollHeight + change.y/5;
                if (this.catching) this.catchTop(top);
            }
        });
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

        this.notify(ProgressEvent.Progress, { progress: this.progressCatch, remain: this.progressGap });
        this.notify(ProgressEvent.Start, { progress: this.progressCatch, remain: this.progressGap });
    }

    scrollEvent(top: number) {
        if (this.catching && this.followWindowScroll) this.catchTop(top);
    }

    /**
    * Called when a mousewheel event occur
    * @param evt Event of the mouse wheel
    * @param top What is the new top position due to this mouseWheel event
    */
    mouseWheelEvent(top: number) {
        if (this.followWindowScroll) return;
        if (this.catching) this.catchTop(top);
    }

    checkPreventComputerScroll(evt: MouseEvent) {
        let delta = evt.deltaY;
        if (delta === undefined) delta = evt.detail;
        if (delta === undefined) delta = 0;
        this.checkPreventBodyScroll(evt, delta);
    }

    borderCheck = 0.01;
    checkPreventBodyScroll(evt: MouseEvent | TouchEvent, move: number) {
        // If scroll catcher didn't start we make sure to not prevent scrolling
        if (!this.catching) return;
        // Try to have different sensitivity when leaving or entering
        // Should be easy to leave and fast to enter
        // let topTest =false, bottomTest =false;
        // if (move >= 0) {
        //     if (this.progressCatch - this.accuracy > 0) topTest = true;
        //     else if (this.progressCatch + this.borderCheck < 1) bottomTest = true;
        // } else {
        //     if (this.progressCatch + this.accuracy > 0) bottomTest = true;
        //     else if (this.progressCatch - this.borderCheck < 1) topTest = true;
        // }
        // console.log(topTest, bottomTest);

        // If scroll reach start or end we stop preventing page scroll
        let topTest = this.progressCatch + this.borderCheck < 1 && move >= 0;
        let bottomTest = this.progressCatch - this.borderCheck > 0 && move <= 0;
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
        // let progress = top / this.scrollHeight;
        // let change = 100 * Math.abs(progress - this.progressCatch);
        // The furthest, the fatest
        // this.catch(top / this.scrollHeight, change * this.speed);
        this.catch(top / this.scrollHeight);
    }
}
