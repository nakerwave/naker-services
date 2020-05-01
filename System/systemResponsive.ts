import { System } from './system';

import { Camera } from '@babylonjs/core/Cameras/camera';
import { EventsName } from '../Tools/observable';

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

        // Useless bacause resize loop is already triggered
        // window.addEventListener('resize', () => {
        //     this.engine.resize();
        // });
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
    sizeCheckInterval = 500;

    // Only way to make sure the scene is always fitted with the container is to have a timer checking for changes
    // window resize does not always work in some specific cases
    setResizeContainerLoop() {
        this.intervalLoop = setInterval(() => {
            this.checkChange();
        }, this.sizeCheckInterval);
    }

    checkChange() {
        let sizeChanged = this.checkCanvasSize();
        let platformChanged = false;
        if (sizeChanged) platformChanged = this.checkPixelRatio();
        if (sizeChanged || platformChanged) this.updateSize();
    }

    checkCanvasSize(): boolean {
        let newHeight, newWidth;
        newWidth = this.canvas.offsetWidth;
        newHeight = this.canvas.offsetHeight;
        if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
            this.canvasWidth = newWidth;
            this.canvasHeight = newHeight
            return true;
        } else {
            return false;
        }
    }

    /**
    * Max Hardware scaling of BabylonJS Engine
    */
    maxScaling = 1;

    isOnMobile = false;

    /**
     * Scale between the scene size and the container size
     */
    pixelRatio = 1;

    checkPixelRatio(): boolean {
        let isMobile = navigator.userAgent.toLowerCase().match(/mobile/i),
            isTablet = navigator.userAgent.toLowerCase().match(/tablet/i),
            isAndroid = navigator.userAgent.toLowerCase().match(/android/i),
            isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i),
            isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);
        if (isMobile || isTablet || isAndroid || isiPhone || isiPad) {
            this.isOnMobile = true;
            this.maxScaling = 2;
        } else {
            this.isOnMobile = false;
            this.maxScaling = 1;
        }

        const devicePixelRatio = window.devicePixelRatio;

        let newPixelRatio = Math.min(this.maxScaling, devicePixelRatio);
        // We make sure scene stays fluid on big screen by forcing pixelRatio to 1
        // console.log(newPixelRatio)
        // console.log(this.renderWidth/newPixelRatio, this.renderHeight/newPixelRatio)
        // if (this.renderWidth / newPixelRatio > 800 || this.renderHeight / newPixelRatio > 800) newPixelRatio = 1;
        // setHardwareScalingLevel will call resize which call onResizeObservable which call checkPixelRatio
        // So we make sure something has change inorder to avoid infinite loop
        if (newPixelRatio != this.pixelRatio) {
            this.pixelRatio = newPixelRatio;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get thecurrent browser
     */
    browser: string;
    getBrowser(): string {
        var nav = navigator.userAgent;
        if ((nav.indexOf("Opera") || nav.indexOf('OPR')) != -1) {
            this.browser = 'Opera';
        } else if (nav.indexOf("Edge") != -1) {
            this.browser = 'Edge';
        } else if (nav.indexOf("Chrome") != -1) {
            this.browser = 'Chrome';
        } else if (nav.indexOf("Safari") != -1) {
            this.browser = 'Safari';
        } else if (nav.indexOf("Firefox") != -1) {
            this.browser = 'Firefox';
        } else if ((nav.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {
            this.browser = 'IE';
        } else {
            this.browser = 'unknown';
        }
        return this.browser;
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
        } else if (this.scene.activeCamera) {
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

    updateSize() {
        // Can't trust engine because qualitySystem will alter rending size 
        // this.renderWidth = this.engine.getRenderWidth();
        // this.renderHeight = this.engine.getRenderHeight();

        this.renderWidth = this.canvasWidth * this.pixelRatio;
        this.renderHeight = this.canvasHeight * this.pixelRatio;

        this.containerRatio = this.renderWidth / this.renderHeight - 1;
        // Keep that for test purpose
        // console.log(window.orientation, window.devicePixelRatio)
        // console.log(this.containerWidth, this.containerHeight)
        // console.log(this.containerRatio)

        this.notify(EventsName.Resize, 0);
    }
}