
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
        // Add cool WaterMark in all naker Project
        setAttr(this.canvas, { 'data-who': '💎 Made with naker.io 💎'});
        mount(this.container, this.canvas);

        // For now keep false as the last argument of the engine,
        // We don't want the canvas to adapt to screen ratio as it slow down too much the scene
        this.engine = new Engine(this.canvas, true, { limitDeviceRatio: this.maxScaling }, false);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.engine.enableOfflineSupport = false;
        
        this.animationManager = new AnimationManager();
        this.buildScene();
    }

    buildScene() {
        this.scene = new Scene(this.engine);
        this.scene.shadowsEnabled = false;
        this.scene.ambientColor = new Color3(1, 1, 1);
    }

    /**
     * Allow to launch scene rendering (when everything is loaded for instance)
     */
    launchRender() {
        this.engine.stopRenderLoop();
        this.engine.runRenderLoop(() => {
            this.animationManager.runAnimations(this.engine.getFps());
            this.scene.render();
        });
    }

    /**
     * Stop scene rendering
     */
    stopRender() {
        this.engine.stopRenderLoop();
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
}
