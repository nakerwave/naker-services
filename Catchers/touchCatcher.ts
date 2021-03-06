import { NakerObservable } from '../Tools/observable';

import { Vector2 } from '@babylonjs/core/Maths/math';

// NakerTouchEvent and not TouchEvent otherwise conflict with real window TouchEvent
export enum NakerTouchEvent {
    Start,
    Stop,
    Move,
}

interface TouchEventData {
    change: Vector2,
    event: Event,
}

/**
 * Detect scroll action of the user
 */

export class TouchCatcher extends NakerObservable<NakerTouchEvent, TouchEventData> {

    /**
     * @ignore
     */
    _container: HTMLElement;

    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt scroll height
     */
    constructor(container: HTMLElement) {
        super('TouchCatcher');
        this._container = container;

        this._setTouchEvent();
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
     * The gap of drag between start and current touch when on smartphone
     */
    timeStart = 0;

    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setTouchEvent() {
        window.addEventListener("touchstart", (evt) => {
            this.touchStart.x = evt.changedTouches[0].clientX;
            this.touchStart.y = evt.changedTouches[0].clientY;
            this.timeStart = new Date().getTime();
            this.notify(NakerTouchEvent.Start, { change: Vector2.Zero(), event: evt });
        });
        window.addEventListener("touchend", (evt) => {
            this.timeStart = 0;
            this.notify(NakerTouchEvent.Stop, {change: this.touchGap.clone(), event: evt});
            this.touchStart = Vector2.Zero();
            this.touchGap = Vector2.Zero();
        });
        window.addEventListener("touchmove", (evt) => {
            if (this.touchStart) {
                let time = new Date().getTime();
                let timeGap = (time - this.timeStart) / 1000 + 0.1;
                let timeInfluence = Math.min(timeGap, 1);

                let x = evt.changedTouches[0].clientX;
                let y = evt.changedTouches[0].clientY;
                // need to have bigger value to match with computer mouse sensitivity
                this.touchGap.x = (this.touchStart.x - x);
                // We divide height by touchSensity to have quick swipe taken into account
                // this.touchGap.x = (this.touchStart.x - x) / timeInfluence;
                this.touchGap.y = (this.touchStart.y - y) / timeInfluence;
                this.notify(NakerTouchEvent.Move, { change: this.touchGap.clone(), event: evt });
            }
        });
    }
}
