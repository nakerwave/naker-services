import { SystemResponsive } from './systemResponsive';
import { SystemEvent } from './system';

import remove from 'lodash/remove';
import {
    IEasingFunction,
    EasingFunction,
    CircleEase,
    BounceEase,
    BackEase,
    CubicEase,
    ElasticEase,
    ExponentialEase,
    PowerEase,
    QuadraticEase,
    QuarticEase,
    QuinticEase,
    SineEase,
    BezierCurveEase
} from '@babylonjs/core/Animations/easing';

export class SystemAnimation extends SystemResponsive {

    fps = 60;
    fpsratio = 1;
    focusback = false;
    fpsnode: HTMLElement;
    frameBeforeEnd = 0;
    frameSinceStarted = 0;
    list: Array<Animation> = [];

    /**
    * List of all process which need rendering
    * Allow to have engine stop if nothing need rendering
    * Thus improving performance
    */

    constructor(canvas: HTMLCanvasElement, screenshot?: boolean) {
        super(canvas, screenshot);
        window.addEventListener("focus", () => {
            this.setFocusBack();
        });

        window.addEventListener("blur", () => {
            this.setFocusBack();
        });
    }

    forceRender() {
        this.frameSinceStarted = 0;
        this.notify(SystemEvent.Start, 0);
        this.engine.stopRenderLoop();
        if (this.limitFPS) {
            this.engine.runRenderLoop(() => {
                let stopped = this.checkStoppedAnimations();
                this.runAnimations();
                if ((this.limitSwitch && this.rendering) || stopped) this.scene.render();
                this.limitSwitch = !this.limitSwitch;
                this.removeStoppedAnimations();
            });
        } else {
            this.engine.runRenderLoop(() => {
                this.checkStoppedAnimations();
                this.runAnimations();
                this.scene.render();
                this.removeStoppedAnimations();
            });
        }
    }

    /**
     * Make one step forward for all animations
     * @param fps Frame per second of the engine
     */
    runAnimations() {
        // if (mode == 'develoment') this.fpsnode.textContent = fps+' - '+this.list.length;
        this.fps = this.engine.getFps();
        this.fpsratio = 60 / this.fps;

        this.frameBeforeEnd = 0;
        // To avoid acceleration when focus back
        // if (this.focusback) return;
        let fpsratio = Math.min(this.fpsratio, 2);
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            if (anim.running) {
                anim.run(anim.count);
                anim.count += anim.step * fpsratio;
                if (anim.howmany - anim.count > this.frameBeforeEnd) this.frameBeforeEnd = Math.round(anim.howmany - anim.count + 1);
            }
        }

        // We avoid sending start and end at the same time
        this.frameSinceStarted++;
        if (this.frameBeforeEnd < this.lastFrameNumberCheck) this.notify(SystemEvent.End, this.frameBeforeEnd);
        else if (this.frameSinceStarted < this.firstFrameNumberCheck) this.notify(SystemEvent.Begin, this.frameSinceStarted);
    }

    checkStoppedAnimations(): boolean {
        let animStopped = false;
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            if (anim.running) {
                if (anim.count >= anim.howmany) {
                    animStopped = true;
                    anim.stop(true);
                    // this.removeAnimation(anim);
                }
            } else {
                // this.removeAnimation(anim);
            }
        }
        return animStopped;
    }

    removeStoppedAnimations(): boolean {
        let animStopped = false;
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            if (!anim.running) {
                this.removeAnimation(anim);
            }
        }
        return animStopped;
    }

    lastFrameNumberCheck = 20;
    firstFrameNumberCheck = 2;

    /**
     * Stop all the scene animation
     */
    stopAnimations() {
        this.setFocusBack();
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            anim.stop(true);
        }
    }

    /**
     * Restart all the scene animation if there is any
     */
    restartAnimations() {
        this.setFocusBack();
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            anim.restart();
        }
    }

    /**
     * Make a small pause of animations (Used when focus is back to window)
     */
    setFocusBack() {
        this.focusback = true;
        // In case in worker
        // if (localStorage) localStorage.clear();
        setTimeout(() => {
            this.focusback = false;
        }, 200);
    }

    /**
    * Add a rendering process
    */
    addAnimation(animation: Animation) {
        // console.log(this.list.indexOf(animation) == -1, animation.key);
        if (this.list.indexOf(animation) == -1) {
            // console.log('add', animation);
            this.list.push(animation);
            this.checkStartRender();
        }
    }

    /**
    * @ignore
    */
    needProcess = true;

    /**
    * @ignore
    */
    setNeedProcess(needProcess: boolean) {
        this.needProcess = needProcess;
        if (!needProcess && this.launched) this.startRender();
    }

    /**
     * @ignore
     */
    checkStartRender() {
        if (this.launched) {
            // If overflow style = hidden, there is no scrollingElement on document
            this.checkSizeChange();
            let containerVisible = this.checkVisible();
            if (containerVisible && (this.list.length != 0 || !this.needProcess)) this.startRender();
            else if (this.needProcess) this.pauseRender();
        }
        this.checkFixedSideRatio();
    }

    /**
    * Remove a rendering process
    */
    removeAnimation(animation: Animation) {
        remove(this.list, (a: Animation) => { return a.key == animation.key });
        // console.log('remove', animation);
        this.checkStopRender();
    }

    /**
    * Check if there is still a process which need renderong
    */
    checkStopRender() {
        // console.log(this.list.length, this.needProcess);
        if (this.list.length == 0 && this.needProcess) this.pauseRender();
    }

    /**
    * Make a quick render in order to update the scene
    */
    quickRender(time?: number) {
        this.startRender();
        setTimeout(() => {
            this.checkStopRender();
        }, time ? time : 20);
    }
}

export enum Ease {
    Linear,
    Circle,
    Back,
    Bounce,
    Cubic,
    Elastic,
    Exponential,
    Power,
    Quadratic,
    Quartic,
    Quintic,
    Sine,
    BezierCurve,
}

export enum EaseMode {
    In,
    Out,
    InOut,
}

class LinearEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return gradient;
    }
}

/**
 * animation which can be create aniwhere and which will be run by system
 */

export class Animation {

    system: SystemAnimation;

    /**
     * Starting value
     */
    start = 1;

    /**
     * Current progress
     */
    count = 0;

    /**
     * Progress step used in each run call
     */
    step = 1;

    /**
     * Is the animation running or not
     */
    running = false;

    /**
     * How many step is needed to end the animation
     */
    howmany: number;

    /**
     * Function called at each run and used to animate something
     */
    funct: (perc: number, count: number) => void;

    /**
     * Function called when animation is over
     */
    functend: Function;

    /**
     * Key of animation used to store it
     */
    key: string;

    /**
     * Easing of the animation
     */
    easing: EasingFunction;

    /**
     * Create a new animation
     * @param system Manager where to push animation
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    constructor(system: SystemAnimation, howmany?: number, start?: number, step?: number) {
        this.system = system;
        if (howmany) this.setParam(howmany, start, step);
        this.key = Math.random().toString(36);
        // Set default easing mode
        this.setEasing(Ease.Linear);
        return this;
    }

    /**
     * Set animation parameters
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    setParam(howmany: number, start?: number, step?: number) {
        if (this.running) this.stop(true);
        this.howmany = howmany - 1;
        if (step) this.step = step;
        if (start) this.start = start;
        this.count = this.start;
        return this;
    }

    setEasing(ease: Ease, mode?: EaseMode) {
        if (ease == Ease.Linear) this.easing = new LinearEase();
        else if (ease == Ease.Circle) this.easing = new CircleEase();
        else if (ease == Ease.Back) this.easing = new BackEase();
        else if (ease == Ease.Bounce) this.easing = new BounceEase();
        else if (ease == Ease.Cubic) this.easing = new CubicEase();
        else if (ease == Ease.Elastic) this.easing = new ElasticEase();
        else if (ease == Ease.Exponential) this.easing = new ExponentialEase();
        else if (ease == Ease.Power) this.easing = new PowerEase();
        else if (ease == Ease.Quadratic) this.easing = new QuadraticEase();
        else if (ease == Ease.Quartic) this.easing = new QuarticEase();
        else if (ease == Ease.Quintic) this.easing = new QuinticEase();
        else if (ease == Ease.Sine) this.easing = new SineEase();
        else if (ease == Ease.BezierCurve) this.easing = new BezierCurveEase();

        if (mode && this.easing) {
            if (mode == EaseMode.In) this.easing.setEasingMode(EasingFunction.EASINGMODE_EASEIN);
            else if (mode == EaseMode.Out) this.easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
            else if (mode == EaseMode.InOut) this.easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        }
    }

    /**
     * Create an infinite animation which will never stop
     * @param funct Function called at each run and used to animate something
     */
    infinite(funct: (perc: number, count: number) => void) {
        let howmany = 1000000000000;
        this.simple(howmany, funct);
        return this;
    }

    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param alter How many step do we need to alternate the animation
     * @param funct1 Alternate function 1
     * @param funct2 Alternate function 2
     * @param functend Function called when animation is over
     */
    alternate(howmany: number, alter: number, funct1: (perc: number, count: number) => void, funct2?: Function, functend?: Function) {
        let ft = true;
        let alterstep = 0;
        this.simple(howmany, (perc, count) => {
            if (count > alter * (alterstep + 1)) {
                ft = !ft;
                alterstep++;
            }
            count = count - alter * alterstep;
            perc = count / alter;
            if (ft) funct1(perc, count);
            else if (funct2) funct2(perc, count);
        }, functend);
        return this;
    }

    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param loop How many step do we need to loopn the animation
     * @param funct Function called at each run and used to animate something
     * @param functloop Function called everytime the loop goes back to start
     * @param functend Function called when animation is over
     */
    loop(howmany: number, loop: number, funct: (perc: number, count: number) => void, functloop?: Function, functend?: Function) {
        let loopstep = 0;
        this.simple(howmany, (perc, count) => {
            if (count > loop * (loopstep + 1)) {
                loopstep++;
                if (functloop) functloop();
            }
            count = count - loop * loopstep;
            perc = count / loop;
            funct(perc, count);
        }, functend);
        return this;
    }

    /**
     * Reverse the current step of the animation
     */
    reverse() {
        this.step = -this.step;
        return this;
    }

    interval(time: number, funct: Function) {
        let timeTest = 0;
        this.infinite(() => {
            timeTest += 1000 / this.system.fps;
            if (timeTest > time) {
                funct();
                timeTest = 0;
            }
        });
    }

    // steps (steps:any) {
    // 	this.loopsteps(steps, 0);
    // 	return this;
    // }
    //
    // loopsteps (steps:any, step:number) {
    // 	if (!steps[step]) return;
    // 	let stepO = steps[step];
    // 	this.simple(stepO.howmany, (perc, count) => {
    // 		stepO.funct(count, perc);
    // 	}, () => {
    // 		stepO.functend();
    // 		step++
    // 		if (!this.running) this.loopsteps(steps, step);
    // 	});
    // }

    /**
     * Easiest way to lauch an animation (By default it start at 0 and use a step of 1)
     * @param howmany How many step is needed to end the animation
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    simple(howmany: number, funct: (perc: number, count: number) => void, functend?: Function) {
        // Equal 1 so that it start quick
        this.start = 1;
        this.count = 1;
        this.step = 1;
        this.howmany = howmany;
        this.go(funct, functend);
        return this;
    }

    /**
     * Set main animation functions and launch it (Often used after setting the animation parameters)
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    go(funct: (perc: number, count: number) => void, functend?: Function) {
        this.resetVar();
        this.running = true;
        this.funct = funct;
        this.functend = functend;
        this.play();
        return this;
    }

    run(count: number) {
        let easedPerc = this.easing.ease(count / this.howmany);
        easedPerc = this.limitBorder(easedPerc);
        let easedCount = easedPerc * this.howmany;
        this.funct(easedPerc, easedCount);
    }

    limitBorder(perc: number): number {
        perc = Math.max(perc, 0);
        return Math.min(perc, 1);
    }

    /**
     * Restart animation
     */
    restart() {
        if (this.running) {
            this.pause();
            this.go(this.funct, this.functend);
        }
    }

    resetVar(arg?: boolean) {
        this.count = this.start;
        if (this.functend && this.running) this.functend(arg);
        this.functend = null;
    }

    /**
     * Stop animation
     * @param arg Sent to functend so that it knows the stop can be forced and is not due to the end of the animation
     */
    stop(arg?: boolean) {
        this.resetVar(arg);
        this.running = false;
        return this;
    }

    /**
     * Pause animation
     */
    pause() {
        this.running = false;
        return this;
    }

    /**
     * Play animation
     */
    play() {
        this.system.addAnimation(this);
        return this;
    }
}
