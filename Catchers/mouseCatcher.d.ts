import { System } from '../System/system';
import { Animation } from '../Animation/animation';
import { Vector2, Quaternion } from '@babylonjs/core/Maths/math';
export declare class MouseCatcher {
    mousecatch: Vector2;
    catching: boolean;
    animation: Animation;
    constructor(System: System);
    screenQuaternion: Quaternion;
    constantTranform: Quaternion;
    orientationChanged(): void;
    deviceMaxVector: Vector2;
    deviceOrientation(evt: DeviceOrientationEvent): void;
    mouseOrientation(evt: MouseEvent): void;
    start(): void;
    stop(): void;
    step: Vector2;
    mouseReal: Vector2;
    mouseCatch: Vector2;
    rapidity: number;
    finalPrecision: number;
    catch(mouse: Vector2): void;
    listeners: Array<Function>;
    addListener(callback: Function): void;
    removeListener(callback: Function): void;
}
