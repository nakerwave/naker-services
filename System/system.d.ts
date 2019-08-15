import { AnimationManager } from '../Animation/animationManager';
import '@babylonjs/core/Animations/animatable';
import { Engine } from '@babylonjs/core/Engines/engine';
export interface Engine extends Engine {
}
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */
export declare class System {
    /**
    * Max Hardware scaling of BabylonJS Engine
    */
    maxScaling: number;
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
     * Creates a new System
     * @param container Element where the scene will be drawn
     */
    constructor(container: HTMLElement);
    /**
     * Build all the essentials assets for the 3D Scene
     */
    buildScene(): void;
    /**
     * set a Camera to be used
     */
    setCamera(type: 'free' | 'arcrotate'): FreeCamera | ArcRotateCamera;
    /**
     * Allow to launch scene rendering (when everything is loaded for instance)
     */
    launchRender(): void;
    /**
     * Optimize scene to make rendering faster
     * https://doc.babylonjs.com/how_to/optimizing_your_scene#reducing-shaders-overhead
     */
    optimize(): void;
    /**
     * Stop scene rendering
     */
    stopRender(): void;
}
