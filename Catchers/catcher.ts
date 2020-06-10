import { SystemAnimation, Animation, Ease, EaseMode } from '../System/systemAnimation';
import { NakerObservable } from '../Tools/observable';

/**
 * Detect progress action of the user
 */

export abstract class Catcher<T, U> extends NakerObservable<T, U> {

    /**
     * Use to animate the catching
     */
    animation: Animation;
    system: SystemAnimation;

    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt progress height
     */
    constructor(system: SystemAnimation, catcher: string) {
        super(catcher);
        this.system = system;
        this.animation = new Animation(system, 10);
        this.animation.setEasing(Ease.Cubic, EaseMode.Out);
    }

    /**
     * Restart progress catcher
     */
    restart() {
        this._restart();
    }

    _restart() {
        this.stop();
        this.start();
    }

    /**
     * Is the progress currently catched or not
     */
    catching = false;

    /**
     * Start catching progress
     */
    start() {
        this._start();
    }

    /**
     * @ignore
     */
    _start() {
        this.catching = true;
    }

    pause() {
        this.catching = false;
    }

    play() {
        this.catching = true;
    }

    /**
     * Stop catching progress
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
    }

    lastTimeCatch = new Date().getTime();

    /**
    * Allow to check if there was enough time between two catch event
    */
    checkRecentCatch(interval: number): boolean {
        let now = new Date().getTime();
        if (now - this.lastTimeCatch < interval ) {
            return true;
        } else {
            this.lastTimeCatch = now;
            return false;
        }
    }
}
