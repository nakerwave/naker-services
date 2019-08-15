import { AnimationManager } from '../Animation/animation';
import '@babylonjs/core/Animations/animatable';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { setStyle } from 'redom';
/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */
var System = /** @class */ (function () {
    function System() {
        /**
        * Max Hardware scaling of BabylonJS Engine
        */
        this.maxScaling = 1;
    }
    /**
     * Creates a new System, can't create Engine and Scene here or it won't include extensions
     * @param container Element where the scene will be drawn
     * @param engine BabylonJS Engine
     * @param scene BabylonJS Scene
     */
    System.prototype.set = function (container, engine, scene) {
        if (!Engine.isSupported())
            throw 'WebGL not supported';
        this.container = container;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });
        this.engine = engine;
        this.engine.enableOfflineSupport = false;
        this.scene = scene;
        this.scene.shadowsEnabled = false;
        this.scene.ambientColor = new Color3(1, 1, 1);
        // NOTE to avoid request for manifest files because it can block loading on safari
        this.animationManager = new AnimationManager();
    };
    /**
     * set a Camera to be used
     */
    System.prototype.setCamera = function (type) {
        if (type == 'free') {
            this.freeCamera = new FreeCamera('main_freeCamera', new Vector3(0, 0, -10), this.scene);
            this.freeCamera.minZ = 0;
        }
        else if (type == 'arcrotate') {
            this.arcRotateCamera = new ArcRotateCamera('main_arcRotateCamera', Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 0, 0), this.scene);
            this.arcRotateCamera.setTarget(new Vector3(0, 0, 0));
            this.arcRotateCamera.minZ = 0;
        }
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
//# sourceMappingURL=system.js.map