import { Animation, Ease, EaseMode } from '../System/systemAnimation';
import { SystemAnimation } from '../System/systemAnimation';
import { TouchCatcher, NakerTouchEvent } from './touchCatcher';
import { Catcher } from './catcher';

import { Vector2, Quaternion } from '@babylonjs/core/Maths/math';
import { Tools } from '@babylonjs/core/Misc/Tools';

// NakerMouseEvent and not MouseEvent otherwise conflict with real window MouseEvent
export enum NakerMouseEvent {
    Move,
    InstantMove,
    Drag,
    DragStart,
}

export class MouseCatcher extends Catcher<NakerMouseEvent, Vector2> {

    moveAnimation: Animation;
    dragAnimation: Animation;
    accelerometerAvailable = true;

    constructor(system: SystemAnimation, touchCatcher: TouchCatcher) {
        super(system, 'MouseCather');
        this.moveAnimation = new Animation(system, 10);
        this.moveAnimation.setEasing(Ease.Circle, EaseMode.Out);

        this.dragAnimation = new Animation(system, 10);
        this.dragAnimation.setEasing(Ease.Circle, EaseMode.Out);

        window.addEventListener("deviceorientation", (evt) => { this.deviceOrientation(evt) });
        window.addEventListener("orientationchange", () => { this.orientationChanged() });
        this.orientationChanged();
        this._setMobileMoveEvent(touchCatcher);

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
                this.catchMove(this.mousePosition);
            }
        });

        window.addEventListener("pointermove", (evt) => {
            this.getMousePosition(evt);
            this.mouseOrientation(this.mousePosition);
        });

        // WARNING: This doesn't work if container z-index = -1
        system.canvas.addEventListener("pointerdown", (evt) => {
            this.getMousePosition(evt);
            this.startDrag();
        });

        system.canvas.addEventListener("pointerup", (evt) => {
            this.dragging = false;
        });
    }

    touchVector = new Vector2(0.01, 0.01);
    setTouchVector(touchVector: Vector2) {
        this.touchVector = touchVector;
    }

    lastTouchVector = Vector2.Zero();
    _setMobileMoveEvent(touchCatcher: TouchCatcher) {
        touchCatcher.on(NakerTouchEvent.Move, (touchEvent) => {
            if (this.catching) {
                let mouseChange = touchEvent.change.multiply(this.touchVector);
                let posMax = Vector2.Minimize(mouseChange, this.deviceMaxVector);
                let posMin = Vector2.Maximize(posMax, this.deviceMinVector);
                this.lastTouchVector = posMin.clone();
                posMin.x = -posMin.x;
                this.catchMove(posMin);
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
                this.catchMove(posMin);
            }
        }
    }

    mouseOrientation(mousepos: Vector2) {
        if (this.catching) {
            this.catchMove(mousepos);
            if (this.dragging) {
                this.catchDrag(mousepos);
            }
        } 
    }

    mousePosition = Vector2.Zero();
    getMousePosition(evt: PointerEvent | WheelEvent) {
        let w = window.innerWidth;
        let h = window.innerHeight;
        // Position in percentage of the window
        // From -50% to 50%
        this.mousePosition.x = (evt.x - w / 2) / w;
        this.mousePosition.y = (evt.y - h / 2) / h;
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

    moveCatch = Vector2.Zero();
    catchMove(mouse: Vector2) {
        if (this.hasEventObservers(NakerMouseEvent.InstantMove)) this.notify(NakerMouseEvent.InstantMove, mouse.clone());
        if (this.hasEventObservers(NakerMouseEvent.Move)) {
            // if (this.checkRecentCatch(100)) return;
            let start = this.moveCatch.clone();
            let change = mouse.subtract(start);
            let howmany = 5 / this.speed;
            this.moveAnimation.simple(howmany, (perc) => {
                let percSpeed = this.speed + (1 - this.speed) * perc;
                let progress = change.multiply(new Vector2(percSpeed, percSpeed));
                this.moveCatch = start.add(progress);
                this.notify(NakerMouseEvent.Move, this.moveCatch.clone());
            });
        }
    }

    dragStart = Vector2.Zero();
    dragging = false;
    startDrag() {
        // Make to stop animation or it will keep send data with bad start
        this.dragAnimation.stop();
        this.dragStart = this.mousePosition.clone();
        this.dragCatch = Vector2.Zero();

        this.dragging = true;
        this.notify(NakerMouseEvent.DragStart, Vector2.Zero());
    }

    dragCatch = Vector2.Zero();
    catchDrag(mouse: Vector2) {
        if (!this.hasEventObservers(NakerMouseEvent.Drag)) return;
        // if (this.checkRecentCatch(100)) return;
        let dragReal = mouse.subtract(this.dragStart);
        let start = this.dragCatch.clone();
        let change = dragReal.subtract(start);
        let howmany = 5 / this.speed;
        this.dragAnimation.simple(howmany, (perc) => {
            let percSpeed = this.speed + (1 - this.speed) * perc;
            let progress = change.multiply(new Vector2(percSpeed, percSpeed));
            this.dragCatch = start.add(progress);
            this.notify(NakerMouseEvent.Drag, this.dragCatch.clone());
        });
    }
}
