import { System } from './system';

import { Camera } from '@babylonjs/core/Cameras/camera';

export class SystemResponsive extends System {

    /**
    * Check size and platform on which the 3D is rendered
    */

    constructor(canvas: HTMLCanvasElement, screenshot?: boolean) {
        super(canvas, screenshot);

        // To avoid iphone flash on resize, we put resize here on every frame
        // Don't worry resize will be calculated only when needed
        // Actually it is called on every frame so not very performant
        // Temporarely removed it in case it creates other issues
        // this.scene.registerBeforeRender(() => {
        //     this.engine.resize();
        // });

        // Call to launch the loop, initialize with and height of canvas plus make a first resize check
        this.setResizeContainerLoop();
        this.checkPlatform();

        this.engine.onResizeObservable.add(() => {
            this.checkSize();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    /**
    * Max Hardware scaling of BabylonJS Engine
    */
    maxScaling = 1;

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
            newWidth = this.canvas.offsetWidth;
            newHeight = this.canvas.offsetHeight;
            if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
                this.engine.resize();
                this.scene.render();
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
        if (this.scene.activeCameras.length) {
            for (let i = 0; i < this.scene.activeCameras.length; i++) {
                const camera = this.scene.activeCameras[i];
                camera.fovMode = fovMode;
            }
        } else {
            this.scene.activeCamera.fovMode = fovMode;
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
        this.renderWidth = this.engine.getRenderWidth();
        this.renderHeight = this.engine.getRenderHeight();
        this.renderScale = 1 / this.engine.getHardwareScalingLevel();
        // this.checkScaling();
        this.containerWidth = this.renderWidth / this.renderScale;
        this.containerHeight = this.renderHeight / this.renderScale;
        this.containerRatio = this.containerWidth / this.containerHeight - 1;
        // Keep that for test purpose
        // console.log(window.orientation, window.devicePixelRatio)
        // console.log(this.containerWidth, this.containerHeight)
        // console.log(this.containerRatio)
        this.sendToResizeListener();
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
            this.engine.setHardwareScalingLevel(1 / this.renderScale);
        }
    }

    resizeListeners: Array<Function> = [];

    on(what: 'start' | 'stop' | 'resize', funct: Function) {
        if (what == 'start' || what == 'stop') this._onStartStop(what, funct);
        else if (what == 'resize') this._onResize(what, funct);
    }

    _onResize(what: 'resize', funct: Function) {
        this.resizeListeners.push(funct);
    }

    sendToResizeListener() {
        for (let i = 0; i < this.resizeListeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this.resizeListeners[i](this.containerRatio, this.containerWidth, this.containerHeight, this.renderScale);
        }
    }
}