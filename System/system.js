import { AnimationManager } from '../Animation/animationManager';
import '@babylonjs/core/Animations/animatable';
import { Engine } from '@babylonjs/core/Engines/engine';
;
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { el, mount, setStyle } from 'redom';
/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */
var System = /** @class */ (function () {
    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     */
    function System(container) {
        /**
        * Max Hardware scaling of BabylonJS Engine
        */
        this.maxScaling = 1;
        if (!Engine.isSupported())
            throw 'WebGL not supported';
        // Keep that variable def
        this.container = container;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });
        this.canvas = el('canvas', { style: { position: 'absolute', 'z-index': 0, top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        mount(this.container, this.canvas);
        // For now keep false as the last argument of the engine,
        // We don't want the canvas to adapt to screen ratio as it slow down too much the scene
        this.engine = new Engine(this.canvas, true, { limitDeviceRatio: this.maxScaling }, false);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.engine.enableOfflineSupport = false;
    }
    /**
     * Build all the essentials assets for the 3D Scene
     */
    System.prototype.buildScene = function () {
        this.scene = new Scene(this.engine);
        this.scene.shadowsEnabled = false;
        this.scene.ambientColor = new Color3(1, 1, 1);
        this.animationManager = new AnimationManager();
    };
    /**
     * set a Camera to be used
     */
    System.prototype.setCamera = function (type) {
        var camera;
        if (type == 'free') {
            this.freeCamera = new FreeCamera('main_freeCamera', new Vector3(0, 0, -10), this.scene);
            this.freeCamera.minZ = 0;
            camera = this.freeCamera;
        }
        else if (type == 'arcrotate') {
            this.arcRotateCamera = new ArcRotateCamera('main_arcRotateCamera', Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 0, 0), this.scene);
            this.arcRotateCamera.setTarget(new Vector3(0, 0, 0));
            this.arcRotateCamera.minZ = 0;
            camera = this.arcRotateCamera;
        }
        return camera;
    };
    /**
     * Allow to launch scene rendering (when everything is loaded for instance)
     */
    System.prototype.launchRender = function () {
        var _this = this;
        this.engine.stopRenderLoop();
        this.engine.runRenderLoop(function () {
            _this.animationManager.runAnimations(_this.engine.getFps());
            _this.scene.render();
        });
    };
    /**
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    System.prototype.optimize = function () {
        this.scene.blockMaterialDirtyMechanism = true;
        this.scene.autoClear = false; // Color buffer
        this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    };
    /**
     * Stop scene rendering
     */
    System.prototype.stopRender = function () {
        this.engine.stopRenderLoop();
    };
    return System;
}());
export { System };
