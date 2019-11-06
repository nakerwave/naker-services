
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';

import { Camera } from '@babylonjs/core/Cameras/camera';
import remove from 'lodash/remove';
import { el, mount } from 'redom';

/*
  +------------------------------------------------------------------------+
  | RESPONSIVE                                                             |
  +------------------------------------------------------------------------+
*/

/**
 * Detect scene size change in order to adapt some size
 */

export class ResponsiveCatcher {

    /**
     * @ignore
     */
    _engine: Engine;

    /**
     * @ignore
     */
    _scene: Scene;


    /**
    * Max Hardware scaling of BabylonJS Engine
    */
    maxScaling = 1;

    /**
     * @param system System of the 3D scene
     */
    constructor(engine: Engine, scene: Scene, horizontalFixed?: boolean) {
        this._engine = engine;
        this._scene = scene;

        this._checkViewport();

        this._engine.onResizeObservable.add(() => {
            this.checkSize();
        });

        window.addEventListener('resize', () => {
            this._engine.resize();
        });

        // To avoid iphone flash on resize, we put resize here on every frame
        // Don't worry resize will be calculated only when needed
        // Actually it is called on every frame so not very performant
        // Temporarely removed it in cae it creates oter issues
        // this._scene.registerBeforeRender(() => {
        //     this._engine.resize();
        // });

        this.checkSize();
        if (horizontalFixed) this.setHorizontalFixed(horizontalFixed);
    }

    /**
     * Should the catcher change Scene field of view to adapt to screen size
     */
    horizontalFixed = false;

    /**
     * Change horizontalFixed option
     */
    setHorizontalFixed(horizontalFixed: boolean) {
        this.horizontalFixed = horizontalFixed;
        let fovMode = (horizontalFixed) ? Camera.FOVMODE_HORIZONTAL_FIXED : Camera.FOVMODE_VERTICAL_FIXED;
        if (this._scene.activeCameras.length) {
            for (let i = 0; i < this._scene.activeCameras.length; i++) {
                const camera = this._scene.activeCameras[i];
                camera.fovMode = fovMode;
            }
        } else {
            this._scene.activeCamera.fovMode = fovMode;
        }
    }

    /**
     * Window viewport can be problematic for scale rendering, we check if one is present
     * @ignore
     */
    _checkViewport() {
        // In order to have good scale and text size, we need to check for the viewport meta in header
        // This makes the scene a bit blurry on iphones, need to find a solution
        let viewport = document.querySelector("meta[name=viewport]");
        if (!viewport) {
            let viewporttoadd = el('meta', { content: "width=device-width, initial-scale=1", name: "viewport" });
            mount(document.getElementsByTagName('head')[0], viewporttoadd);
        }
        // Should check for the viewport and adapt to it.
        // else {
        //   let content = viewport.getAttribute("content");
        //   if (content) {
        //     let scalecheck = content.indexOf('initial-scale');
        //     if (scalecheck == -1) this.ratio = window.devicePixelRatio;
        //   }
        // }
    }

    /**
     * Ratio between height of width of the scene container
     */
    containerRatio = 1;

    /**
     * Width of the scene rendered
     */
    renderWidth = 100;

    /**
     * Height of the scene rendered
     */
    renderHeight = 100;

    /**
     * Width of the scene container
     */
    containerWidth = 100;

    /**
     * Height of the scene container
     */
    containerHeight = 100;

    /**
     * Scale between the scene size and the container size
     */
    renderScale = 1;

    checkSize() {
        this.renderWidth = this._engine.getRenderWidth();
        this.renderHeight = this._engine.getRenderHeight();
        this.renderScale = 1 / this._engine.getHardwareScalingLevel();
        // this.checkScaling();
        this.containerWidth = this.renderWidth / this.renderScale;
        this.containerHeight = this.renderHeight / this.renderScale;
        this.containerRatio = this.containerWidth / this.containerHeight - 1;
        // Keep that for test purpose
        // console.log(window.orientation, window.devicePixelRatio)
        // console.log(this.containerWidth, this.containerHeight)
        // console.log(this.containerRatio)
        this.sendToListsteners();
    }

    checkScaling() {
        const devicePixelRatio = window.devicePixelRatio;
        let newScale = Math.min(this.maxScaling, devicePixelRatio);
        // We make sure scene stays fluid on big screen by forcing renderScale to 1
        // console.log(newScale)
        // console.log(this.renderWidth/newScale, this.renderHeight/newScale)
        if (this.renderWidth / newScale > 800 || this.renderHeight / newScale > 800) newScale = 1;
        // setHardwareScalingLevel will call resize which call onResizeObservable which call checkScaling
        // So we make sure something has change inorder to avoid infinite loop
        if (newScale != this.renderScale) {
            this.renderScale = newScale;
            this._engine.setHardwareScalingLevel(1 / this.renderScale);
        }
    }

    /**
     * Scene field of view
     */
    fieldOfView = 1;

    /**
    * Set the field of view of all the scene cameras
    */
    setFieldOfView(fieldOfView: number) {
        this.fieldOfView = fieldOfView;
        if (this._scene.activeCameras.length) {
            for (let i = 0; i < this._scene.activeCameras.length; i++) {
                const camera = this._scene.activeCameras[i];
                camera.fov = fieldOfView;
            }
        } else {
            this._scene.activeCamera.fov = fieldOfView;
        }
    }

    /**
      * Send responsive data to listeners
     */
    sendToListsteners() {
        for (let i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this.containerRatio, this.containerWidth, this.containerHeight, this.renderScale);
        }
    }

    /**
      * List of all functions following the mouse position
     * @ignore
     */
    _listeners: Array<Function> = [];

    /**
     * Add a new listener which will get the responsive data
     */
    addListener(callback: Function) {
        this._listeners.push(callback);
    }

    /**
     * Remove a listener to stop following responsive change events
     */
    removeListener(callback: Function) {
        remove(this._listeners, (c) => { c == callback });
    }
}
