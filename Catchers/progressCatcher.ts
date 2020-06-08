import { SystemAnimation, Animation, Ease, EaseMode } from '../System/systemAnimation';
import { NakerObservable } from '../Tools/observable';

export enum ProgressEvent {
    Start,
    Stop,
    Progress,
    MouseWheel, // Mandatory for scrollCatcher
}

interface ProgressEventData {
    progress: number,
    remain: number,
}

/**
 * Detect progress action of the user
 */

export class ProgressCatcher extends NakerObservable<ProgressEvent, ProgressEventData> {

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
        super('ProgressCatcher');
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
        this.notify(ProgressEvent.Progress, {progress: 0, remain: 0});
        this.notify(ProgressEvent.Start, {progress: 0, remain: 0});
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
        this.notify(ProgressEvent.Stop, { progress: this.progressCatch, remain: 0 });
    }

    /**
    * Speed of the progress used when mousewheel or drag on phone
    */
    speed = 0.02;

    /**
    * @ignore
    */
    lastSpeed = 0.02;

    /**
    * Set the catch speed of the progressCatcher
    * @param speed The new speed
    */
    setCatchSpeed(speed: number) {
        this.speed = speed;
        this.lastSpeed = speed;
    }

    /**
     * Catch the progress
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    catch(progress: number, speed?: number, callback?:Function) {
        if (!this.hasObservers()) return;
        if (!progress) progress = 0;
        let catchSpeed = (speed) ? speed : this.speed;
        // Bigger speed will make percentage go behind 100%
        catchSpeed = Math.min(0.1, catchSpeed);
        
        if (progress == this.progressReal && catchSpeed == this.lastSpeed) return;
        // Sometimes on iphone, perc can go below 0
        progress = this.checkBorderProgress(progress);
        this.progressReal = progress;
        this.lastSpeed = catchSpeed;
        
        let progressStart = this.progressCatch;
        let progressChange = progress - progressStart;
        
        let howmany = Math.round(5 / catchSpeed);
        howmany = Math.min(howmany, 500);
        
        this.animation.simple(howmany, (perc) => {
            let percSpeed = catchSpeed + (1 - catchSpeed) * perc;
            percSpeed = this.checkBorderProgress(percSpeed);
            this.progressCatch = progressStart + progressChange * percSpeed;
            this.progressGap = this.progressReal - this.progressCatch;
            
            this.notify(ProgressEvent.Progress, { progress: this.progressCatch, remain: this.progressGap });
        }, () => {
            if (callback) callback();
        });
    }

    checkBorderProgress(progress: number): number {
        progress = Math.max(0, progress);
        progress = Math.min(1, progress);
        return progress;
    }
}
