
import { NakerObservable } from '../Tools/observable';

import { Vector2 } from '@babylonjs/core/Maths/math';

interface TouchEventData {
    change: Vector2,
    event: Event,
}

/**
 * Detect scroll action of the user
 */

export class TouchCatcher extends NakerObservable<TouchEventData> {

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
    constructor(container: HTMLElement) {
        super();
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
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setTouchEvent() {
        this._container.addEventListener("touchstart", (evt) => {
            this.touchStart.x = evt.changedTouches[0].clientX;
            this.touchStart.y = evt.changedTouches[0].clientY;
        });
        // Need test
        this._container.addEventListener("touchend", (evt) => {
            this.touchStart = Vector2.Zero();
            this.touchGap = Vector2.Zero();
            this.notifyAll({change: this.touchGap.clone(), event: evt});
        });
        this._container.addEventListener("touchmove", (evt) => {
            if (this.touchStart) {
                let x = evt.changedTouches[0].clientX;
                let y = evt.changedTouches[0].clientY;
                // need to have bigger value to match with computer mouse sensitivity
                this.touchGap.x = (this.touchStart.x - x) * 20;
                this.touchGap.y = (this.touchStart.y - y) * 20;
                this.notifyAll({change: this.touchGap.clone(), event: evt});
            }
        });
    }
}
