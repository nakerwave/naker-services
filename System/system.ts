
import { AnimationManager } from '../Animation/animation';

import '@babylonjs/core/Animations/animatable';

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { setStyle } from 'redom';

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
     * BabylonJS Cameras
     */
    freeCamera: FreeCamera;
    arcRotateCamera: ArcRotateCamera;

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
     * Creates a new System, can't create Engine and Scene here or it won't include extensions
     * @param container Element where the scene will be drawn
     * @param engine BabylonJS Engine
     * @param scene BabylonJS Scene
     */
    set(container: HTMLElement, engine:Engine, scene:Scene) {
        if (!Engine.isSupported()) throw 'WebGL not supported';

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
    }

    /**
     * set a Camera to be used
     */
    setCamera(type: 'free' | 'arcrotate') {
        if (type == 'free') {
            this.freeCamera = new FreeCamera('main_freeCamera', new Vector3(0, 0, -10), this.scene);
            this.freeCamera.minZ = 0;
        } else if (type == 'arcrotate') {
            this.arcRotateCamera = new ArcRotateCamera('main_arcRotateCamera', Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 0, 0), this.scene);
            this.arcRotateCamera.setTarget(new Vector3(0, 0, 0));
            this.arcRotateCamera.minZ = 0;
        }
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
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    optimize() {
        this.scene.blockMaterialDirtyMechanism = true;
        this.scene.autoClear = false; // Color buffer
        this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    }

    /**
     * Stop scene rendering
     */
    stopRender() {
        this.engine.stopRenderLoop();
    }
}
