import { SystemAnimation } from './systemAnimation';

import '@babylonjs/core/Misc/screenshotTools';
import { Tools } from '@babylonjs/core/Misc/tools';
import { Layer } from '@babylonjs/core/Layers/layer';
import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilitylayerRenderer';
import { Color4 } from '@babylonjs/core/Maths/math';
import { Scene } from '@babylonjs/core/scene';

export class SystemQuality extends SystemAnimation {

    /**
    * Allow to improve quality depending on the device
    * Plus make a even better rendering when animation stop
    */

    qualityLayer: UtilityLayerRenderer;
    layer1: Layer;
    layer2: Layer;
    qualityScene: Scene;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, true);

        this.qualityLayer = UtilityLayerRenderer.DefaultUtilityLayer;
        this.qualityLayer.shouldRender = false;
        this.qualityScene = this.qualityLayer.utilityLayerScene;
        this.qualityScene.autoClearDepthAndStencil = true;

        // Be careful, thi.optimize function can make screenshot bug
        // this.scene.autoClear = false;
        // this.scene.autoClearDepthAndStencil = false;

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

        this.on('stop', () => {
            if (this.qualityAtBreak) this.checkEndQuality();
        });

        this.on('start', () => {
            if (this.qualityAtBreak) this.checkStartQuality();
        });
    }

    qualityAtBreak = false;
    improveQualityAtBreak(qualityAtBreak: boolean) {
        this.qualityAtBreak = qualityAtBreak;
    }

    lastFrameNumberCheck = 20;
    firstFrameNumberCheck = 2;

    checkStartQuality() {
        this.engine.setHardwareScalingLevel(1);
        if (this.formerCameraLayerMask) this.scene.activeCamera.layerMask = this.formerCameraLayerMask;
        if (this.layer1) this.layer1.dispose();
        if (this.layer2) this.layer2.dispose();
    }

    // Test to slowy hide layer
    // checkStartQuality(frame: number) {
    //     if (this.layer2) {
    //         if (frame < 4) {
    //             let t = 1 - (frame / 5);
    //             let a = Math.max(t, 0)
    //             a = Math.min(a, 1)
    //             this.layer2.color.a = a;

    //             this.qualityLayer.render();
    //         } else {
    //             this.guiCamera.layerMask = 0x10000000;
    //             this.sceneAdvancedTexture.layer.layerMask = 0x10000000;
    //             this.layer2.dispose();
    //         }
    //     } else {
    //         this.guiCamera.layerMask = 0x10000000;
    //         this.sceneAdvancedTexture.layer.layerMask = 0x10000000;
    //     }
    //     if (this.layer1) this.layer1.dispose();
    // }

    formerCameraLayerMask;
    checkEndQuality() {
        let width = this.engine.getRenderWidth();
        let height = this.engine.getRenderHeight();

        // FIXME: Need timeout otherwise renderLoop will be called
        setTimeout(() => {
            Tools.CreateScreenshot(this.engine, this.scene.activeCamera, { width: width, height: height }, (image1) => {
                this.layer1 = new Layer('image1', image1, this.qualityScene, false);
                this.layer1.color = new Color4(1, 1, 1, 1);

                // Check if layer ready to make sure layer is in front of the scene and avoid seiing HD rendering
                let test = false;
                this.layer1.onAfterRenderObservable.add(() => {
                    
                    if (!test) {
                        test = true;
                        this.engine.stopRenderLoop();
                        this.engine.setHardwareScalingLevel(0.5);
                        this.scene.render();

                        // Camera can have a specific layerMask
                        // Gui camera in story for instance
                        this.formerCameraLayerMask = this.scene.activeCamera.layerMask;
                        this.scene.activeCamera.layerMask = 0x0FFFFFFF;
                        
                        Tools.CreateScreenshot(this.engine, this.scene.activeCamera, { width: width, height: height }, (image2) => {
                            this.layer1.render();
                            this.layer2 = new Layer('image2', image2, this.qualityScene, false);
                            this.layer2.color = new Color4(1, 1, 1, 0);
        
                            // Keep that if we need to check the result
                            // let img1 = document.createElement('img');
                            // document.body.append(img1);
                            // img1.setAttribute('src', image1);
                            // let img2 = document.createElement('img');
                            // document.body.append(img2);
                            // img2.setAttribute('src', image2);
        
                            var t = 0, change = 0.05;
                            this.engine.runRenderLoop(() => {
                                t += change;
                                let a = Math.max(t, 0)
                                a = Math.min(a, 1)
                                this.layer1.color.a = 2 - a * 2;
                                this.layer2.color.a = a * 2;
                                
                                this.qualityLayer.render();
                                if (a == 1) this.engine.stopRenderLoop();
                            });
                        });
                    }
                });

                this.engine.runRenderLoop(() => {
                    this.layer1.render();
                });
                
            });
        }, 0);
    }
}