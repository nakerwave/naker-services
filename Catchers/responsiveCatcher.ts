
import { System } from '../System/system';

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Camera } from '@babylonjs/core/Cameras/camera';
import remove from 'lodash/remove';

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
    _system: System;

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
    constructor(system: System, horizontalFixed?: boolean) {
        this._system = system;
        this._engine = system.engine;
        this._scene = system.scene;

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

        // Call to launch the loop, initialize with and height of canvas plus make a first resize check
        this.setResizeContainerLoop();
        if (horizontalFixed) this.setHorizontalFixed(horizontalFixed);
        this.checkPlatform();
    }

    isOnMobile = false;
    checkPlatform() {
        let isMobile = navigator.userAgent.toLowerCase().match(/mobile/i),
        isTablet = navigator.userAgent.toLowerCase().match(/tablet/i),
        isAndroid = navigator.userAgent.toLowerCase().match(/android/i),
        isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i),
        isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);
        if (isMobile || isTablet || isAndroid || isiPhone || isiPad) this.isOnMobile = true;
        else this.isOnMobile = false;
    }

    /**
     * Width of canvas
     */
    canvasWidth = 100;

    /**
     * Height of canvas
     */
    canvasHeight = 100;
    
    intervalLoop;
    sizeCheckInterval = 100;

    // Only way to make sure the scene is always fitted with the container is to have a timer checking for changes
    // window resize does not always work in some specific cases
    setResizeContainerLoop() {
        this.intervalLoop = setInterval(() => {
            let newHeight, newWidth;
            newWidth = this._system.canvas.offsetWidth;
            newHeight = this._system.canvas.offsetHeight;
            if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
                this._engine.resize();
                this._scene.render();
                this.canvasWidth = newWidth;
                this.canvasHeight = newHeight
            }
        }, this.sizeCheckInterval);
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
