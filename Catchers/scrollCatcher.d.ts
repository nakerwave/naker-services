import { Animation, AnimationManager } from '../Animation/animation';
import { ResponsiveCatcher } from './ResponsiveCatcher';
import { Vector2 } from '@babylonjs/core/Maths/math';
/**
 * Detect scroll action of the user
 */
export declare class ScrollCatcher {
    /**
     * @ignore
     */
    _container: HTMLElement;
    /**
     * Current scroll position
     */
    scrollReal: number;
    /**
     * Position of the scroll catching the real scroll due to animation
     */
    scrollCatch: number;
    /**
     * Pourcentage of current scroll catch compare with the full scroll size
     */
    scrollPercentage: number;
    /**
     * Scrollable height (Used to simulate real scroll in Intale)
     */
    scrollHeight: number;
    /**
     * Use to animate the catching
     */
    animation: Animation;
    /**
     * Use to animate the catching
     * @param system System of the 3D scene
     * @param responsive If there is responsive changes, we may have to adapt scroll height
     */
    constructor(animationManager: AnimationManager, container: HTMLElement, responsive: ResponsiveCatcher);
    /**
     * Set the scrollable height
     * @param height The new scrollable height
     */
    setScrollHeight(height: number): void;
    /**
      * Rather than simulating scroll, you can choose to follow real container scroll (need overflow to be visible)
     * Automatically activated if scene container is the body of the window
     */
    followWindowScroll: boolean;
    /**
     * Check if all condition are present in order to have a correct scroll
     * @param height On what height should be base the test
     */
    checkHeight(height: number): void;
    /**
     * Initiate the scroll/mousewheel events in order to trigger scroll action
     * @ignore
     */
    _setScrollEvent(): void;
    /**
     * The position of drag start when on smartphone
     */
    touchStart: Vector2;
    /**
     * The gap of drag between start and current touch when on smartphone
     */
    touchGap: Vector2;
    /**
     * On smartphone, we use the touch events to simulate scroll
     * @ignore
     */
    _setMobileDragEvent(): void;
    /**
     * Restart scroll catcher
     */
    restart(): void;
    /**
     * Is the scroll currently catched or not
     */
    catching: boolean;
    /**
     * Start catching scroll
     */
    start(): void;
    /**
     * Send start event to listeners
     */
    sendStartToListeners(): void;
    /**
     * Stop catching scroll
     */
    stop(): void;
    /**
     * Send stop event to listeners
     */
    sendStopToListeners(): void;
    /**
     * List of scroll start listeners
     * @ignore
     */
    _startListeners: Array<Function>;
    /**
     * List of scroll stop listeners
     * @ignore
     */
    _stopListeners: Array<Function>;
    /**
    * Allow to add a listener on special events
    * @ignore
    */
    _mouseWheelListeners: Array<Function>;
    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     */
    on(what: 'start' | 'stop' | 'mouseWheel', funct: Function): void;
    /**
    * Called when a mousewheel event occur
    * @param evt Event of the mouse wheel
    * @param top What is the new top position due to this mouseWheel event
    */
    mouseWheel(evt: MouseEvent, top: number): void;
    /**
    * Spped of the scroll used when mousewheel or drag on phone
    */
    speed: number;
    /**
    * Set the speed of the scrollCatcher
    * @param speed The new speed
    */
    setSpeed(speed: number): void;
    /**
    * Catch the new top position due to scroll, mousewheel or drag
    * @param top What is the top position to be catched
    */
    catchTop(top: number): void;
    /**
     * Catch the scroll
     * @param top Top position to be catched
     * @param speed At what speed should we catch the new position (used when accelarating to new step for instance)
     */
    catch(top: number, speed: number): void;
    /**
      * Send scroll change data to listeners
     */
    sendToListsteners(): void;
    /**
     * List of all functions following the scroll position
     * @ignore
     */
    _listeners: Array<Function>;
    /**
     * Add a new listener which will get the catching scroll position
     */
    addListener(callback: Function): void;
    /**
     * Remove a listener to stop following scroll
     */
    removeListener(callback: Function): void;
}
