import { System } from './system';

import remove from 'lodash/remove';

/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */

export class SystemAnimation extends System {

    fps = 60;
    fpsratio = 1;
    focusback = false;
    fpsnode: HTMLElement;
    frameBeforeEnd = 0;
    frameSinceStarted = 0;

    /**
    * List of all process which need rendering
    * Allow to have engine stop if nothing need rendering
    * Thus improving performance
    */
    list: Array<Animation> = [];

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
        // console.log('start');
        this.frameSinceStarted = 0;
        this.sendToStartListener();
        this.engine.stopRenderLoop();
        if (this.limitFPS) {
            this.engine.runRenderLoop(() => {
                this.runAnimations(this.engine.getFps());
                if (this.limitSwitch) this.scene.render();
                this.limitSwitch = !this.limitSwitch;
            });
        } else {
            this.engine.runRenderLoop(() => {
                this.runAnimations(this.engine.getFps());
                this.scene.render();
            });
        }
    }

	/**
	 * Make one step forward for all animations
	 * @param fps Frame per second of the engine
	 */
    runAnimations(fps: number) {
        // if (mode == 'develoment') this.fpsnode.textContent = fps+' - '+this.list.length;
        this.fps = fps;
        this.fpsratio = 60 / this.fps;
        
        this.frameBeforeEnd = 0;
        // if (this.focusback) return;
        // To avoid acceleration when focus back
        let fpsratio = Math.min(this.fpsratio, 2);
        for (let i = 0; i < this.list.length; i++) {
            let anim = this.list[i];
            if (anim.running) {
                anim.funct(anim.count, anim.count / anim.howmany);
                if (anim.count >= anim.howmany) anim.stop(true);
                anim.count += anim.step * fpsratio;
                if (anim.howmany - anim.count > this.frameBeforeEnd) this.frameBeforeEnd = Math.round(anim.howmany - anim.count + 1);
            }
        }

        // We avoid sending start and end at the same time
        if (this.frameBeforeEnd < 10) this.sendToEndListener(this.frameBeforeEnd);
        else if (this.frameSinceStarted < 10) this.sendToBeginListener(this.frameSinceStarted);
        this.frameSinceStarted++;
    }

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
        this.setCheckScroll(false);
        let containerVisible = this.checkVisible();
        // console.log(containerVisible);
        if (containerVisible) {
            if (this.list.indexOf(animation) == -1) {
                // console.log('add', animation);
                this.list.push(animation);
                if (this.needProcess) this.startRender();
            }
        }
    }

    /**
    * Remove a rendering process
    */
    removeAnimation(animation: Animation) {
        remove(this.list, (a: Animation) => { return a.key == animation.key });
        // console.log('remove', this.list);
        this.checkStopRender();
    }

    /**
    * Check if there is still a process which need renderong
    */
    checkStopRender() {
        if (this.list.length == 0 && this.needProcess) this.pauseRender();
    }

    /**
    * Make a quick render in order to update the scene
    */
    quickRender(time?: number) {
        this.startRender();
        setTimeout(() => {
            this.checkStopRender();
        }, time? time : 20);
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
    start = 0;

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
    funct: Function;

	/**
	 * Function called when animation is over
	 */
    functend: Function;

	/**
	 * Key of animation used to store it
	 */
    key: string;

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

	/**
	 * Create an infinite animation which will never stop
	 * @param funct Function called at each run and used to animate something
	 */
    infinite(funct: Function) {
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
    alternate(howmany: number, alter: number, funct1: Function, funct2?: Function, functend?: Function) {
        let ft = true;
        let alterstep = 0;
        this.simple(howmany, (count, perc) => {
            if (count > alter * (alterstep + 1)) {
                ft = !ft;
                alterstep++;
            }
            count = count - alter * alterstep;
            perc = count / alter;
            if (ft) funct1(count, perc);
            else if (funct2) funct2(count, perc);
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
    loop(howmany: number, loop: number, funct: Function, functloop?: Function, functend?: Function) {
        let loopstep = 0;
        this.simple(howmany, (count, perc) => {
            if (count > loop * (loopstep + 1)) {
                loopstep++;
                if (functloop) functloop();
            }
            count = count - loop * loopstep;
            perc = count / loop;
            funct(count, perc);
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

    // steps (steps:any) {
    // 	this.loopsteps(steps, 0);
    // 	return this;
    // }
    //
    // loopsteps (steps:any, step:number) {
    // 	if (!steps[step]) return;
    // 	let stepO = steps[step];
    // 	this.simple(stepO.howmany, (count, perc) => {
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
    simple(howmany: number, funct: Function, functend?: Function) {
        this.start = 0;
        this.count = 0;
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
    go(funct: Function, functend?: Function) {
        this.resetVar();
        this.running = true;
        this.funct = funct;
        this.functend = functend;
        this.play();
        return this;
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
    }

	/**
	 * Stop animation
	 * @param arg Sent to functend so that it knows the stop can be forced and is not due to the end of the animation
	 */
    stop(arg?: boolean) {
        this.resetVar(arg);
        this.system.removeAnimation(this);
        this.running = false;
        return this;
    }

	/**
	 * Pause animation
	 */
    pause() {
        this.system.removeAnimation(this);
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
