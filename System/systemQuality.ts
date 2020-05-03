import { SystemAnimation } from './systemAnimation';

import '@babylonjs/core/Misc/screenshotTools';
import { Tools } from '@babylonjs/core/Misc/tools';
import { Layer } from '@babylonjs/core/Layers/layer';
import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilitylayerRenderer';
import { Color4 } from '@babylonjs/core/Maths/math';
import { Scene } from '@babylonjs/core/scene';
import { EventsName } from '../Tools/observable';

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
        this.qualityScene.autoClearDepthAndStencil = false;

        // Be careful, thi.optimize function can make screenshot bug
        // this.scene.autoClear = false;
        // this.scene.autoClearDepthAndStencil = false;

        this.on(EventsName.Stop, () => {
            if (this.qualityAtBreak) this.checkEndQuality();
        });

        this.on(EventsName.Start, () => {
            if (this.qualityAtBreak) this.checkStartQuality();
        });

        this.on(EventsName.Resize, () => {
            // if (this.qualityBreakDone) {
            //     this.checkStartQuality();
            //     this.checkEndQuality();
            // }
            
            if (this.qualityBreakDone) {
                if (this.formerCameraLayerMask) this.scene.activeCamera.layerMask = this.formerCameraLayerMask;
                this.engine.resize();
                this.scene.render();
                this.scene.activeCamera.layerMask = 0x0FFFFFFF;

                this.getScreenshot((image2) => {
                    if (!this.qualityBreakStarted) return; // Check if animation restarted
                    this.layer2.dispose();
                    this.layer2 = this.addLayerImage(image2, () => {
                        if (!this.qualityBreakStarted) return; // Check if animation restarted
                        this.qualityLayer.render();
                    });
                });
            }
        });
    }

    qualityAtBreak = false;
    improveQualityAtBreak(qualityAtBreak: boolean) {
        this.qualityAtBreak = qualityAtBreak;
    }

    lastFrameNumberCheck = 20;
    firstFrameNumberCheck = 2;

    checkStartQuality() {
        this.qualityBreakStarted = false;
        this.qualityBreakDone = false;
        this.engine.setHardwareScalingLevel(1 / this.pixelRatio);
        if (this.formerCameraLayerMask) this.scene.activeCamera.layerMask = this.formerCameraLayerMask;
        if (this.layer1) this.layer1.dispose();
        if (this.layer2) this.layer2.dispose();
        this.scene.render();
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
    qualityBreakStarted = false;
    qualityBreakDone = false;
    checkEndQuality() {
        this.qualityBreakStarted = true;
        // FIXME: Need timeout otherwise renderLoop will be called
        setTimeout(() => {
            if (this.isRendering()) return;
            this.engine.stopRenderLoop();
            this.getScreenshot((image1) => {
                if (this.isRendering()) return;
                this.layer1 = this.addLayerImage(image1, () => {
                    if (this.isRendering()) return;
                    this.layer1.color = new Color4(1, 1, 1, 1);

                    this.engine.stopRenderLoop();
                    this.engine.setHardwareScalingLevel(0.5 / this.pixelRatio);
                    this.scene.render();
                    this.qualityLayer.render();

                    // Camera can have a specific layerMask
                    // Gui camera in story for instance
                    this.formerCameraLayerMask = this.scene.activeCamera.layerMask;
                    this.scene.activeCamera.layerMask = 0x0FFFFFFF;
                    
                    this.getScreenshot((image2) => {
                        if (this.isRendering()) return;
                        this.layer2 = this.addLayerImage(image2);
                        this.layer2.color = new Color4(1, 1, 1, 0);
                        this.qualityLayer.render();

                        // Keep that if we need to check the result
                        // let img1 = document.createElement('img');
                        // document.body.append(img1);
                        // img1.setAttribute('src', image1);
                        // let img2 = document.createElement('img');
                        // document.body.append(img2);
                        // img2.setAttribute('src', image2);
    
                        var t = 0, change = 0.05;
                        this.engine.runRenderLoop(() => {
                            if (this.isRendering()) return;
                            t += change;
                            let a = Math.max(t, 0)
                            a = Math.min(a, 1)
                            this.layer1.color.a = 2 - a * 2;
                            this.layer2.color.a = a * 2;
                            
                            this.qualityLayer.render();
                            if (a == 1) {
                                this.engine.stopRenderLoop();
                                this.qualityBreakDone = true;
                            }
                        });
                    });
                });
            });
        }, 0);
    }

    getScreenshot(callback: Function) {
        let width = this.engine.getRenderWidth();
        let height = this.engine.getRenderHeight();
        Tools.CreateScreenshot(this.engine, this.scene.activeCamera, { width: width, height: height }, (image) => {
            callback(image);
        });
    }

    addLayerImage(image: string, callback?: Function): Layer {
        let layer = new Layer('image', image, this.qualityScene, false);

        // Check if layer ready to make sure layer is in front of the scene and avoid seiing HD rendering
        if (callback) {
            let test = false;
            layer.onAfterRenderObservable.add(() => {
                if (!test) {
                    test = true;
                    callback();
                }
            });

            this.engine.runRenderLoop(() => {
                this.layer1.render();
            });
        }
        return layer;
    }
}