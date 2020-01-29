
import { Animation } from '../System/systemAnimation';
import { SystemAnimation } from '../System/systemAnimation';

import remove from 'lodash/remove';

/**
 * Detect progress action of the user
 */

export class ProgressCatcher {

    /**
    * @ignore
    */
    key: string;

    /**
    * @ignore
    */
    system: SystemAnimation;

    /**
     * Current progress position to be catched
     */
    progressReal = 0;

    /**
     * Position of the progress catching the real progress due to animation
     */
    progressCatch = 0;

    /**
     * Progress left to be reached by progress animation
     */
    progressGap = 0;

    /**
     * Use to animate the catching
     */
    animation: Animation;

    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt progress height
     */
    constructor(system: SystemAnimation) {
        this.key = Math.random().toString(36);
        this.animation = new Animation(system, 10);
    }

    /**
     * Restart progress catcher
     */
    restart() {
        this._restart();
    }
    _restart() {
        this.progressReal = 0;
        this.progressCatch = 0;
        this.progressGap = 0;
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
        this.catch(this.progressReal, this.speed);
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
     * List of progress start listeners
     * @ignore
     */
    _startListeners: Array<Function> = [];

    /**
     * List of progress stop listeners
     * @ignore
     */
    _stopListeners: Array<Function> = [];

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     */
    on(what: 'start' | 'stop', funct: Function) {
        if (what == 'start') this._startListeners.push(funct);
        else if (what == 'stop') this._stopListeners.push(funct);
    }

    /**
    * Spped of the progress used when mousewheel or drag on phone
    */
    speed = 0.02;
    /**
    * Set the speed of the progressCatcher
    * @param speed The new speed
    */
    setSpeed(speed: number) {
        this.speed = speed;
    }

    /**
    * Spped of the progress used when mousewheel or drag on phone
    */
    accuracy = 0.002;
    /**
    * Set the speed of the progressCatcher
    * @param speed The new speed
    */
    setAccuracy(accuracy: number) {
        this.accuracy = accuracy;
    }

    /**
    * @ignore
    */
    lastSpeed = 0.02;

    /**
     * Catch the progress
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    catch(perc: number, speed?: number, callback?:Function) {
        // Sometimes on iphone, perc can go below 0
        if (!perc) perc = 0;
        let catchSpeed = (speed) ? speed : this.speed;
        if (perc == this.progressReal && catchSpeed == this.lastSpeed) return;
        perc = Math.max(0, perc);
        perc = Math.min(1, perc);
        this.progressReal = perc;
        this.lastSpeed = catchSpeed;
        this.animation.infinite((count, perc) => {
            this.progressGap = this.progressReal - this.progressCatch;
            let step = this.progressGap * catchSpeed * Math.min(count/20, 1);
            this.progressCatch += step;
            if (Math.abs(this.progressGap) < this.accuracy) {
                // Don't force to reach last value or it makes a jump in the animation
                // this.progressCatch = this.progressReal;
                if (callback) callback();
                this.animation.stop();
            }
            this.sendToListsteners();
        });
    }

    /**
      * Send progress change data to listeners
     */
    sendToListsteners() {
        for (let i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this.progressCatch, this.progressGap);
        }
    }

    /**
     * List of all functions following the progress position
     * @ignore
     */
    _listeners: Array<Function> = [];

    /**
     * Add a new listener which will get the catching progress position
     */
    addListener(callback: Function) {
        this._listeners.push(callback);
    }

    /**
     * Remove a listener to stop following progress
     */
    removeListener(callback: Function) {
        remove(this._listeners, (c) => { c == callback });
    }
}
