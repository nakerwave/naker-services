import { System } from '../System/system';
/**
 * Detect scene size change in order to adapt some size
 */
export declare class ResponsiveCatcher {
    /**
     * @ignore
     */
    _system: System;
    /**
     * @param system System of the 3D scene
     */
    constructor(system: System);
    /**
     * Listen to engine changes
     * @ignore
     */
    _addEngineEvent(): void;
    /**
     * Window viewport can be problematic for scale rendering, we check if one is present
     * @ignore
     */
    _checkViewport(): void;
    /**
     * Ratio between height of width of the scene container
     */
    containerRatio: number;
    /**
     * Width of the scene rendered
     */
    renderWidth: number;
    /**
     * Height of the scene rendered
     */
    renderHeight: number;
    /**
     * Width of the scene container
     */
    containerWidth: number;
    /**
     * Height of the scene container
     */
    containerHeight: number;
    /**
     * Scale between the scene size and the container size
     */
    renderScale: number;
    checkSize(): void;
    checkScaling(): void;
    /**
      * Send responsive data to listeners
     */
    sendToListsteners(): void;
    /**
      * List of all functions following the mouse position
     * @ignore
     */
    _listeners: Array<Function>;
    /**
     * Add a new listener which will get the responsive data
     */
    addListener(callback: Function): void;
    /**
     * Remove a listener to stop following responsive change events
     */
    removeListener(callback: Function): void;
}
