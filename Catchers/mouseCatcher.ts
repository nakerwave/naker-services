
import { Animation, AnimationManager } from '../Animation/animation';

import remove from 'lodash/remove';
import { Vector2, Quaternion } from '@babylonjs/core/Maths/math';
import { Tools } from '@babylonjs/core/Misc/Tools';

export class MouseCatcher {

    mousecatch = new Vector2(0, 0);
    catching = true;
    animation: Animation;

    constructor(animationManager: AnimationManager) {
        this.animation = new Animation(animationManager, 10);
        window.addEventListener("mousemove", (evt) => { this.mouseOrientation(evt) });
        window.addEventListener("deviceorientation", (evt) => { this.deviceOrientation(evt) });
        window.addEventListener("orientationchange", () => { this.orientationChanged() });
        this.orientationChanged();
    }

    // Code copied from babylon: https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/Inputs/freeCameraDeviceOrientationInput.ts
    screenQuaternion: Quaternion = new Quaternion();
    constantTranform = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    orientationChanged() {
        let screenOrientationAngle = (<any>window.orientation !== undefined ? +<any>window.orientation : ((<any>window.screen).orientation && ((<any>window.screen).orientation)['angle'] ? ((<any>window.screen).orientation).angle : 0));
        screenOrientationAngle = -Tools.ToRadians(screenOrientationAngle / 2);
        this.screenQuaternion.copyFromFloats(0, Math.sin(screenOrientationAngle), 0, Math.cos(screenOrientationAngle));
    }

    deviceMaxVector = new Vector2(Math.PI / 8, Math.PI / 8);
    deviceOrientation(evt: DeviceOrientationEvent) {
        if (this.catching) {
            let gamma = evt.gamma !== null ? evt.gamma : 0;
            let beta = evt.beta !== null ? evt.beta : 0;
            let alpha = evt.alpha !== null ? evt.alpha : 0;
            if (evt.gamma !== null) {
                let quaternion = Quaternion.RotationYawPitchRoll(Tools.ToRadians(alpha), Tools.ToRadians(beta), -Tools.ToRadians(gamma));
                quaternion.multiplyInPlace(this.screenQuaternion);
                quaternion.multiplyInPlace(this.constantTranform);
                quaternion.z *= -1;
                quaternion.w *= -1;
                let angles = quaternion.toEulerAngles();

                let pos = new Vector2(angles.y, angles.x);
                // * 3 to make it match with mousemove
                pos.divideInPlace(this.deviceMaxVector);
                Vector2.Maximize(pos, this.deviceMaxVector);
                this.catch(pos);
            }
        }
    }

    mouseOrientation(evt: MouseEvent) {
        if (this.catching) {
            let pos = Vector2.Zero();
            let w = window.innerWidth;
            let h = window.innerHeight;
            pos.x = 2 * (evt.x - w / 2) / w;
            pos.y = 2 * (evt.y - h / 2) / h;
            this.catch(pos);
        }
    }

    start() {
        this.catching = true;
    }

    stop() {
        this.catching = false;
    }

    step = new Vector2(0, 0);
    mouseReal = new Vector2(0, 0);
    mouseCatch = new Vector2(0, 0);
    rapidity = 0.1;
    finalPrecision = 0.01;

    catch(mouse: Vector2) {
        this.mouseReal = mouse;
        this.animation.infinite(() => {
            let gapmouse = this.mouseReal.subtract(this.mouseCatch);
            this.step.x = gapmouse.x * this.rapidity;
            this.step.y = gapmouse.y * this.rapidity;
            this.mouseCatch.x += this.step.x;
            this.mouseCatch.y += this.step.y;
            if (Math.abs(gapmouse.x) < this.finalPrecision && Math.abs(gapmouse.y) < this.finalPrecision) this.animation.running = false;
            for (let i = 0; i < this.listeners.length; i++) {
                this.listeners[i](this.mouseCatch);
            }
        });
    }

    listeners: Array<Function> = [];
    addListener(callback: Function) {
        this.listeners.push(callback);
    }

    removeListener(callback: Function) {
        remove(this.listeners, (c) => { c == callback });
    }
}
