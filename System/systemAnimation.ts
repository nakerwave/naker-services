import { System } from './system';

import { Tools } from '@babylonjs/core/Misc/tools';
// import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilityLayerRenderer';
import { Layer } from '@babylonjs/core/Layers/layer';
import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilitylayerRenderer';
import '@babylonjs/core/Misc/screenshotTools';
import { Vector3, Color4 } from '@babylonjs/core/Maths/math';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
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
    qualityLayer: UtilityLayerRenderer;
    layer1: Layer;
    layer2: Layer;
    qualityScene: Scene;

    constructor(canvas: HTMLCanvasElement, screenshot?: boolean) {
        super(canvas, true);
        window.addEventListener("focus", () => {
            this.setFocusBack();
        });

        window.addEventListener("blur", () => {
            this.setFocusBack();
        });

        this.qualityLayer = UtilityLayerRenderer.DefaultUtilityLayer;
        this.qualityLayer.shouldRender = false;
        this.qualityScene = this.qualityLayer.utilityLayerScene;
        this.qualityScene.autoClearDepthAndStencil = true;

        // Be careful, thi.optimize function can make screenshot bug
        // this.scene.autoClear = false;
        // this.scene.autoClearDepthAndStencil = false;

        this.on('stop', () => {
            if (this.qualityAtBreak) this.checkEndQuality();
        });

        this.on('start', () => {
            if (this.qualityAtBreak) this.checkStartQuality();
        });
    }

    forceRender() {
        // console.log('start');
        this.frameSinceStarted = 0;
        this.sendToStartListener();
        this.engine.stopRenderLoop();
        if (this.limitFPS) {
            this.engine.runRenderLoop(() => {
                this.runAnimations();
                if (this.limitSwitch && this.rendering) this.scene.render();
                this.limitSwitch = !this.limitSwitch;
            });
        } else {
            this.engine.runRenderLoop(() => {
                this.runAnimations();
                this.scene.render();
            });
        }
    }

    pauseRender() {
        if (!this.rendering) return;
        // console.log('stop');
        this.sendToStopListener();
        this.rendering = false;
        this.engine.stopRenderLoop();
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
        this.frameSinceStarted++;
        if (this.frameBeforeEnd < this.lastFrameNumberCheck && this.qualityAtBreak) this.sendToEndListener(this.frameBeforeEnd);
        else if (this.frameSinceStarted < this.firstFrameNumberCheck && this.qualityAtBreak) this.sendToBeginListener(this.frameSinceStarted);
    }

    qualityAtBreak = false;
    improveQualityAtBreak(qualityAtBreak: boolean) {
        this.qualityAtBreak = qualityAtBreak;
    }

    lastFrameNumberCheck = 20;
    firstFrameNumberCheck = 2;
    scaleAccuracy = 10;

    checkStartQuality() {
        this.engine.setHardwareScalingLevel(1);
        this.scene.activeCamera.layerMask = this.formerCameraLayerMask;
        if (this.layer1) this.layer1.dispose();
        if (this.layer2) this.layer2.dispose();
    }

    // Test to slowy hide layer
    // checkStartQuality(frame: number) {
    //     if (this.layer2) {
    //         if (frame < 4) {
    //             let t = 1 - (frame / 5);
    //             let a = Math.max(t, 0)
    //             a = Math.min(a, 1)
    //             this.layer2.color.a = a;

    //             this.qualityLayer.render();
    //         } else {
    //             this.guiCamera.layerMask = 0x10000000;
    //             this.sceneAdvancedTexture.layer.layerMask = 0x10000000;
    //             this.layer2.dispose();
    //         }
    //     } else {
    //         this.guiCamera.layerMask = 0x10000000;
    //         this.sceneAdvancedTexture.layer.layerMask = 0x10000000;
    //     }
    //     if (this.layer1) this.layer1.dispose();
    // }

    formerCameraLayerMask;
    checkEndQuality() {
        let width = this.engine.getRenderWidth();
        let height = this.engine.getRenderHeight();

        // FIXME: Need timeout otherwise renderLoop will be called
        setTimeout(() => {
            Tools.CreateScreenshot(this.engine, this.scene.activeCamera, { width: width, height: height }, (image1) => {
                this.layer1 = new Layer('', image1, this.qualityScene, false);
                this.layer1.color = new Color4(1, 1, 1, 1);

                // Check if layer ready to make sure layer is in front of the scene and avoid seiing HD rendering
                let test = false;
                this.layer1.onAfterRenderObservable.add(() => {
                    
                    if (!test) {
                        test = true;
                        this.engine.stopRenderLoop();
                        this.engine.setHardwareScalingLevel(0.5);
                        this.scene.render();

                        // Camera can have a specific layerMask
                        // Gui camera in story for instance
                        this.formerCameraLayerMask = this.scene.activeCamera.layerMask;
                        this.scene.activeCamera.layerMask = 0x0FFFFFFF;
                        
                        Tools.CreateScreenshot(this.engine, this.scene.activeCamera, { width: width, height: height }, (image2) => {
                            this.layer1.render();
                            this.layer2 = new Layer('', image2, this.qualityScene, false);
                            this.layer2.color = new Color4(1, 1, 1, 0);
        
                            // Keep that if we need to check the result
                            // let img1 = document.createElement('img');
                            // document.body.append(img1);
                            // img1.setAttribute('src', image1);
                            // let img2 = document.createElement('img');
                            // document.body.append(img2);
                            // img2.setAttribute('src', image2);
        
                            var t = 0, change = 0.05;
                            this.engine.runRenderLoop(() => {
                                t += change;
                                let a = Math.max(t, 0)
                                a = Math.min(a, 1)
                                this.layer1.color.a = 2 - a * 2;
                                this.layer2.color.a = a * 2;
                                
                                this.qualityLayer.render();
                                if (a == 1) this.engine.stopRenderLoop();
                            });
                        });
                    }
                });

                this.engine.runRenderLoop(() => {
                    this.layer1.render();
                });
                
            });
        }, 0);
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
        if (!this.started) return;
        this.setCheckScroll(false);
        let containerVisible = this.checkVisible();
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
