import { SystemAnimation, Animation, Ease, EaseMode } from '../System/systemAnimation';
import { Catcher } from './catcher';

export enum ProgressEvent {
    Start,
    Stop,
    Progress,
}

interface ProgressEventData {
    progress: number,
    remain: number,
}

/**
 * Detect progress action of the user
 */

export class ProgressCatcher extends Catcher<ProgressEvent, ProgressEventData> {

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
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt progress height
     */
    constructor(system: SystemAnimation) {
        super(system, 'ProgressCatcher');
    }

    /**
     * Restart progress catcher
     */
    restart() {
        this.progressReal = 0;
        this.progressCatch = 0;
        this.progressGap = 0;
        this._restart();
    }

    /**
     * @ignore
     */
    start() {
        this._start();
        this.catch(this.progressReal, this.speed);
        this.notify(ProgressEvent.Progress, {progress: 0, remain: 0});
        this.notify(ProgressEvent.Start, {progress: 0, remain: 0});
    }

    /**
     * @ignore
     */
    stop() {
        this._stop();
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
        if (this.animation.running) {
            this.catch(this.progressReal);
        }
    }

    maximumCatchSpeed = 0.2;
    /**
     * Catch the progress
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    catch(progress: number, speed?: number, force?: boolean) {
        if (!this.hasObservers()) return;
        if (!progress) progress = 0;
        if (progress == this.progressReal) return;
        progress = this.animation.limitBorder(progress);

        // Sometimes on iphone, perc can go below 0
        this.progressReal = progress;
        
        let catchSpeed = (speed) ? speed : this.speed;
        // Bigger speed will make percentage go behind 100%
        // Alway keep a minimum inertia or scroll won't be fluide at all
        catchSpeed = Math.min(this.maximumCatchSpeed, catchSpeed);
        let isLimit = (progress == 0 || progress == 1);
        let isRecent = (catchSpeed == this.lastSpeed && this.checkRecentCatch(100));
        if (!isLimit && isRecent && !force) return;
        this.lastSpeed = catchSpeed;
        
        this.progressStart = this.progressCatch;
        this.progressChange = progress - this.progressStart;
        let howmany = Math.round(5 / catchSpeed);
        howmany = Math.min(howmany, 500);
        this.animation.simple(howmany, (perc) => {
            this.progress(perc);
        });
    }

    progressStart: number;
    progressChange: number;
    progress(perc: number) {
        // We use catchSpeed to make perc is never equal to 0
        // This way the scroll start from the first mouseWheel
        this.progressCatch = this.progressStart + this.progressChange * perc;        
        this.progressGap = this.progressReal - this.progressCatch;
        this.notifyProgress();
    }

    setToProgress(progress: number) {
        this.progressReal = progress;
        this.progressCatch = progress;
        this.progressGap = 0;
        this.notifyProgress();
    }
    
    notifyProgress() {
        this.notify(ProgressEvent.Progress, { progress: this.progressCatch, remain: this.progressGap });
    }
}
