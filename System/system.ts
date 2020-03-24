import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math';

/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */

export class System {

    /**
    * Max Hardware scaling of BabylonJS Engine
    */
    maxScaling = 1;

    /**
    * BabylonJS Engine
    */
    engine: Engine;

    /**
     * BabylonJS Scene
     */
    scene: Scene;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param canvas Element where the scene will be drawn
     */
    constructor(canvas: HTMLCanvasElement, screenshot?:boolean) {
        // if (!Engine.isSupported()) throw 'WebGL not supported';
        this.canvas = canvas;
        // For now keep false as the last argument of the engine,
        // We don't want the canvas to adapt to screen ratio as it slow down too much the scene
        // preserveDrawingBuffer and stencil needed for screenshot
        let engineOption;
        if (!screenshot) engineOption = { limitDeviceRatio: this.maxScaling };
        else engineOption = { limitDeviceRatio: this.maxScaling, preserveDrawingBuffer: false, stencil: true };
        this.engine = new Engine(this.canvas, true, engineOption, false);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.engine.enableOfflineSupport = false;
        this.buildScene();

        window.addEventListener("scroll", () => {
            this.checkScroll();
        });

        window.addEventListener("focus", () => {
            this.checkScroll();
        });
    }

    /**
    * @ignore
    */
    buildScene() {
        this.scene = new Scene(this.engine);
        this.scene.shadowsEnabled = false;
        this.scene.ambientColor = new Color3(1, 1, 1);
    }

    /**
    * Tell if system currently rendering scene
    */
    rendering = false;

    /**
    * Tell if scene needs to be render
    */
    started = false;

    /**
     * @ignore
     */
    checkingScroll = true;

    /**
    * Set if if have to check scroll to render
    */
    setCheckScroll(checkingScroll: boolean) {
        this.checkingScroll = checkingScroll;
        if (checkingScroll && this.started) this.checkScroll();
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
    }

    /**
     * @ignore
     */
    checkScroll() {
        if (this.started && (this.checkingScroll || !this.needProcess)) {
            // If overflow style = hidden, there is no scrollingElement on document
            let containerVisible = this.checkVisible();
            if (containerVisible) this.startRender();
            else this.pauseRender();
        }
    }

    /**
    * Check if element visible by the screen
    */
    checkVisible() {
        var rect = this.canvas.getBoundingClientRect();
        var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    }

    /**
     * Allow to launch scene rendering (when everything is loaded for instance)
     */
    launchRender() {
        this.started = true;
        // console.log('launch');
        this.scene.render();
        this.checkScroll();
    }

    /**
     * Stop scene rendering
     */
    stopRender() {
        this.started = false;
        this.pauseRender();
    }

    /**
     * @ignore
     */
    pauseRender() {
        if (!this.rendering) return;
        // console.log('stop');
        this.sendToStopListener();
        this.rendering = false;
        this.engine.stopRenderLoop();
        this.scene.render();
    }

    /**
     * @ignore
     */
    startRender() {
        if (this.rendering || !this.started) return;
        this.rendering = true;
        this.forceRender();
    }
    
    forceRender() {
        // console.log('start');
        this.sendToStartListener();
        this.engine.stopRenderLoop();        
        if (this.limitFPS) {
            this.engine.runRenderLoop(() => {
                if (this.limitSwitch) this.scene.render();
                this.limitSwitch = !this.limitSwitch;
            });
        } else {
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });
        }
    }

    /**
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    optimize() {
        this.scene.autoClear = false; // Color buffer
        this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously

        // let activeTest = 0;
        // this.scene.registerBeforeRender(() => {
        //     activeTest++;
        //     this.scene.freezeActiveMeshes();
        //     if (activeTest > 30) {
        //         activeTest = 0;
        //         this.scene.unfreezeActiveMeshes();
        //     }
        // });
    }

    /**
     * UnOptimize scene rendering
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    unOptimize() {
        this.scene.autoClear = true; // Color buffer
        this.scene.autoClearDepthAndStencil = true; // Depth and stencil, obviously
    }

    /**
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    optimizeHard() {
        this.optimize();
        this.scene.freezeActiveMeshes();
        // Can not use blockMaterial or imageProcessing does't work in pipeline
        // this.scene.blockMaterialDirtyMechanism = true;
        // this.scene.setRenderingAutoClearDepthStencil(renderingGroupIdx, autoClear, depth, stencil);
        this.setLimitFPS(true);
    }

    /**
     * UnOptimize scene rendering
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    unOptimizeHard() {
        this.unOptimize();
        this.scene.unfreezeActiveMeshes();
        // Can not use blockMaterial or imageProcessing does't work in pipeline
        // this.scene.blockMaterialDirtyMechanism = false;
        // this.scene.setRenderingAutoClearDepthStencil(renderingGroupIdx, autoClear, depth, stencil);
        this.setLimitFPS(false);
    }

    limitFPS = false;
    // Keep first value as true so that render function is called straight away
    // Otherwise you could have a flash 
    limitSwitch = true;
    setLimitFPS(limitFPS: boolean) {
        if (limitFPS == this.limitFPS) return;
        this.limitFPS = limitFPS;
        if (this.rendering) this.forceRender();
    }

    /**
    * Allow to add a listener on special events
    * @ignore
    */
    _startListeners: Array<Function> = [];
    _stopListeners: Array<Function> = [];
    _beginListeners: Array<Function> = [];
    _endListeners: Array<Function> = [];

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop
     * @param funct the function to be called at the event
     */
    on(what: 'start' | 'stop' | 'begin' | 'end', funct: Function) {
        if (what == 'start') this._startListeners.push(funct);
        else if (what == 'stop') this._stopListeners.push(funct);
        else if (what == 'begin') this._beginListeners.push(funct);
        else if (what == 'end') this._endListeners.push(funct);
    }

    sendToStartListener() {
        for (let i = 0; i < this._startListeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this._startListeners[i]();
        }
    }

    sendToStopListener() {
        for (let i = 0; i < this._stopListeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this._stopListeners[i]();
        }
    }

    sendToBeginListener(frameSinceStarted: number) {
        for (let i = 0; i < this._beginListeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this._beginListeners[i](frameSinceStarted);
        }
    }

    sendToEndListener(frameBeforeEnd: number) {
        for (let i = 0; i < this._endListeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this._endListeners[i](frameBeforeEnd);
        }
    }
}
