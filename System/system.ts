import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math';
import { NakerObservable } from '../Tools/observable';

/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */

export enum SystemEvent {
    Start, // System
    Stop, // System
    Begin, // SystemAnimation
    End, // SystemAnimation
    Resize, // SystemResponsive
    HighQuality, // SystemQuality
    LowQuality, // SystemQuality
}

export class System extends NakerObservable<SystemEvent, number> {

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
        super('System');
        // if (!Engine.isSupported()) throw 'WebGL not supported';
        this.canvas = canvas;
        // For now keep false as the last argument of the engine,
        // We don't want the canvas to adapt to screen ratio as it slow down too much the scene
        // preserveDrawingBuffer and stencil needed for screenshot
        // premultipliedAlpha needed for .HDR to .ENV transformation
        let engineOption;
        if (!screenshot) engineOption = { limitDeviceRatio: this.maxScaling };
        else engineOption = { limitDeviceRatio: this.maxScaling, preserveDrawingBuffer: true, stencil: true, premultipliedAlpha: false };
        this.engine = new Engine(this.canvas, true, engineOption, false);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.engine.enableOfflineSupport = false;
        this.buildScene();

        window.addEventListener("scroll", () => {
            this.checkStartRender();
        });

        window.addEventListener("focus", () => {
            this.checkStartRender();
            // When focus on page after launchedRender called we need to restart the check
            if (!this.launched && this.isCheckingReady) this.launchRender(this.currentLaunchCallback);
        });
    }

    /**
    * @ignore
    */
    buildScene() {
        this.scene = new Scene(this.engine);
        this.scene.shadowsEnabled = false;
        this.scene.ambientColor = new Color3(1, 1, 1);

        // Avoid automatic pick and improve performance
        // Can't use it now as it breaks GUI events
        // this.scene.detachControl();
    }

    /**
    * Tell if system currently rendering scene
    */
    rendering = false;

    /**
    * Tell if scene needs to be render
    */
    launched = false;

    /**
     * @ignore
     */
    checkStartRender() {
        if (this.launched) {
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
    currentLaunchCallback: Function;
    launchRender(callback?: Function) {
        this.currentLaunchCallback = callback;
        this.checkSceneReadyToRender(() => {
            this.launched = true; 
            this.scene.render();
            this.checkStartRender();
            if (callback) callback();
        });
    }
    
    isCheckingReady = false;
    checkSceneReadyToRender(callback: Function) {
        this.isCheckingReady = true;
        this.engine.stopRenderLoop();
        // Make sure scene is ready  
        this.scene.executeWhenReady(() => {
            this.isCheckingReady = false;
            callback();
        });
    }

    executeOnceAfterRender(func: () => void): void {
        let execFunc = () => {
            this.scene.unregisterAfterRender(execFunc);
            func();
        };
        this.scene.registerAfterRender(execFunc);
    }

    /**
     * Stop scene rendering
     */
    stopRender() {
        this.launched = false;
        this.pauseRender();
    }

    /**
     * @ignore
     */
    pauseRender() {
        if (!this.rendering) return;
        // console.log('stop');
        this.notify(SystemEvent.Stop, 0);
        this.rendering = false;
        this.engine.stopRenderLoop();
    }

    /**
     * @ignore
     */
    startRender() {
        if (this.rendering || !this.launched) return;
        // console.log('start');
        this.rendering = true;
        this.forceRender();
    }

    isRendering(): boolean {
        return this.rendering;
    }
    
    forceRender() {
        this.notify(SystemEvent.Start, 0);
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
    otimized = false;
    optimize() {
        this.otimized = true;
        this.scene.autoClear = false; // Color buffer
        this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously

        // this.scene.clearCachedVertexData();
        // this.scene.cleanCachedTextureBuffer();
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
        this.otimized = false;
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

    checkActiveMeshes() {
        this.scene.unfreezeActiveMeshes();
        this.scene.freezeActiveMeshes();
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
}
