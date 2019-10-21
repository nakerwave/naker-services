
import { AnimationManager } from '../Animation/animation';

import '@babylonjs/core/Animations/animatable';

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math';
import { el, mount, setStyle, setAttr } from 'redom';

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
     * Manage all the animations only for this 3D Scene
     */
    animationManager: AnimationManager;

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     */
    constructor(containerEL: any) {
        if (!Engine.isSupported()) throw 'WebGL not supported';
        // Keep that variable def
        this.container = containerEL;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });

        //  'z-index': -1 not mandatory
        this.canvas = el('canvas', { style: { position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        // Add cool WaterMark in all naker Projects
        setAttr(this.canvas, { 'data-who': '💎 Made with naker.io 💎'});
        mount(this.container, this.canvas);

        // For now keep false as the last argument of the engine,
        // We don't want the canvas to adapt to screen ratio as it slow down too much the scene
        this.engine = new Engine(this.canvas, true, { limitDeviceRatio: this.maxScaling }, false);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.engine.enableOfflineSupport = false;
        
        this.animationManager = new AnimationManager();
        this.buildScene();

        window.addEventListener("scroll", () => {
            if (this.checkingScroll && this.started) this.checkScroll();
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
     * @ignore
     */
    checkingScroll = true;

    /**
    * Set if if have to check scroll to render
    */
    setCheckScroll(checkingScroll: boolean) {
        this.checkingScroll = checkingScroll;
        if (checkingScroll) this.checkScroll();
        else this.launchRender();
    }

    /**
     * @ignore
     */
    checkScroll() {
        // If overflow style = hidden, there is no scrollingElement on document
        let containerVisible = this.checkVisible(this.container);
        if (containerVisible && !this.rendering) this.startRender();
        else if (!containerVisible && this.rendering) this.pauseRender();
    }

    /**
    * Check if element visible by the screen
    */
    checkVisible(elm: HTMLElement) {
        var rect = elm.getBoundingClientRect();
        var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
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
     * Allow to launch scene rendering (when everything is loaded for instance)
     */
    launchRender() {
        this.started = true;
        this.startRender();
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
        this.rendering = false;
        this.engine.stopRenderLoop();
    }

    /**
     * @ignore
     */
    startRender() {
        this.rendering = true;
        this.engine.stopRenderLoop();
        this.engine.runRenderLoop(() => {
            this.animationManager.runAnimations(this.engine.getFps());
            this.scene.render();
        });
    }

    /**
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    optimize() {
        this.scene.blockMaterialDirtyMechanism = true;
        this.scene.autoClear = false; // Color buffer
        this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    }

    /**
     * UnOptimize scene rendering
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    unOptimize() {
        this.scene.blockMaterialDirtyMechanism = false;
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
        this.scene.blockMaterialDirtyMechanism = true;
        // this.scene.setRenderingAutoClearDepthStencil(renderingGroupIdx, autoClear, depth, stencil);
    }

    /**
     * UnOptimize scene rendering
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    unOptimizeHard() {
        this.unOptimize();
        this.scene.unfreezeActiveMeshes();
        this.scene.blockMaterialDirtyMechanism = false;
        // this.scene.setRenderingAutoClearDepthStencil(renderingGroupIdx, autoClear, depth, stencil);
    }
}
