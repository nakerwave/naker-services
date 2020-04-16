import { Animation } from '../System/systemAnimation';
import { SystemAnimation } from '../System/systemAnimation';
import { TouchCatcher } from './touchCatcher';

import remove from 'lodash/remove';
import { Vector2, Quaternion } from '@babylonjs/core/Maths/math';
import { Tools } from '@babylonjs/core/Misc/Tools';
import { EasingFunction, CircleEase } from '@babylonjs/core/Animations/easing';

export class MouseCatcher {

    mousecatch = new Vector2(0, 0);
    catching = false;
    system: SystemAnimation;
    animation: Animation;
    accelerometerAvailable = true;

    /**
    * Ease catch function
    */
    curve: EasingFunction;

    constructor(system: SystemAnimation, touchCatcher: TouchCatcher) {
        this.system = system;
        this.animation = new Animation(system, 10);

        window.addEventListener("mousemove", (evt) => { this.mouseOrientation(evt) });
        window.addEventListener("deviceorientation", (evt) => { this.deviceOrientation(evt) });
        window.addEventListener("orientationchange", () => { this.orientationChanged() });
        this.orientationChanged();
        this._setMobileDragEvent(touchCatcher);

        this.curve = new CircleEase();
        this.curve.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        // Want to add the possibility to stop the rendering when mouse is not moving
        // But we will mostly still need the rendering

        // Ask for device motion permission now mandatory on iphone since Safari 13 update
        // https://medium.com/@leemartin/three-things-im-excited-about-in-safari-13-994107ac6295
        // Can't make that work ;/
        // let motionTest = false;
        // container.addEventListener("touchstart", (evt) => {
        //     if (motionTest) return;
        //     motionTest = true;
        //     if (window.DeviceMotionEvent && window.DeviceMotionEvent.requestPermission) {
        //         window.DeviceMotionEvent.requestPermission()
        //             .then(response => {
        //                 console.log(response);
        //                 if (response == 'granted') {
        //                     // permission granted
        //                 } else {
        //                     // permission not granted
        //                 }
        //             });
        //     }
        // });

        if (window.DeviceMotionEvent && window.DeviceMotionEvent.requestPermission) this.accelerometerAvailable = false;

        window.addEventListener("focus", () => {
            if (this.catching) {
                this.catch(this.mouseReal);
            }
        });
    }

    touchVector: Vector2 = new Vector2(0.01, 0.01);
    setTouchVector(touchVector: Vector2) {
        this.touchVector = touchVector;
    }

    _setMobileDragEvent(touchCatcher: TouchCatcher) {
        touchCatcher.addListener((change: Vector2) => {
            if (this.catching) {
                let mouseChange = change.multiply(this.touchVector);
                let posMax = Vector2.Minimize(mouseChange, this.deviceMaxVector);
                let posMin = Vector2.Maximize(posMax, this.deviceMinVector);
                posMin.x = -posMin.x;
                this.catch(posMin);
            }
        });
    }

    // Code copied from babylon: https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/Inputs/freeCameraDeviceOrientationInput.ts
    screenQuaternion: Quaternion = new Quaternion();
    constantTranform = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    orientationChanged() {
        let screenOrientationAngle = (<any>window.orientation !== undefined ? +<any>window.orientation : ((<any>window.screen).orientation && ((<any>window.screen).orientation)['angle'] ? ((<any>window.screen).orientation).angle : 0));
        screenOrientationAngle = -Tools.ToRadians(screenOrientationAngle / 2);
        this.screenQuaternion.copyFromFloats(0, Math.sin(screenOrientationAngle), 0, Math.cos(screenOrientationAngle));
    }

    divideVector = new Vector2(Math.PI / 8, Math.PI / 8);
    deviceMaxVector = new Vector2(Math.PI / 4, Math.PI / 4);
    deviceMinVector = new Vector2(-Math.PI / 4, -Math.PI / 4);
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

                pos.divideInPlace(this.divideVector);
                let posMax = Vector2.Minimize(pos, this.deviceMaxVector);
                let posMin = Vector2.Maximize(posMax, this.deviceMinVector);
                this.catch(posMin);
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

    /**
    * Spped of the progress used when mousewheel or drag on phone
    */
    speed = 0.05;
    /**
    * Set the speed of the progressCatcher
    * @param speed The new speed
    */
    setSpeed(speed: number) {
        this.speed = speed;
    }

    step = new Vector2(0, 0);
    mouseReal = new Vector2(0, 0);
    mouseCatch = new Vector2(0, 0);
    catch(mouse: Vector2) {
        if (this.listeners.length == 0) return;
        let mouseStart = this.mouseCatch;
        let mouseChange = mouse.subtract(mouseStart);
        this.mouseReal = mouse;
        let howmany = 5 / this.speed;
        this.animation.simple(howmany, (count, perc) => {
            // if (perc == 0) return this.sendToListener();
            let percEased = this.speed + (1 - this.speed) * this.curve.ease(perc);
            let mouseProgress = mouseChange.multiply(new Vector2(percEased, percEased));
            this.mouseCatch = mouseStart.add(mouseProgress);
            this.sendToListener();
        });
    }

    listeners: Array<Function> = [];
    addListener(callback: Function) {
        this.listeners.push(callback);
        
    }

    removeListener(callback: Function) {
        remove(this.listeners, (c) => { c == callback });
        
    }

    sendToListener() {
        for (let i = 0; i < this.listeners.length; i++) {
            // Clone to make sure there is not something which can alter real mouseCatch
            this.listeners[i](this.mouseCatch.clone());
        }
    }
}
