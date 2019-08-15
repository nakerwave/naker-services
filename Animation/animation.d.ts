/**
 * Deal with all the scene animations
 */
export declare class AnimationManager {
    fps: number;
    fpsratio: number;
    focusback: boolean;
    fpsnode: HTMLElement;
    list: Array<Animation>;
    constructor();
    /**
     * Make one step forward for all animations
     * @param fps Frame per second of the engine
     */
    runAnimations(fps: number): void;
    /**
     * Stop all the scene animation
     */
    stopAnimations(): void;
    /**
     * Restart all the scene animation if there is any
     */
    restartAnimations(): void;
    /**
     * Make a small pause of animations (Used when focus is back to window)
     */
    setFocusBack(): void;
}
/**
 * animation which can be create aniwhere and which will be run by animationManager
 */
export declare class Animation {
    animationManager: AnimationManager;
    /**
     * Starting value
     */
    start: number;
    /**
     * Current progress
     */
    count: number;
    /**
     * Progress step used in each run call
     */
    step: number;
    /**
     * Is the animation running or not
     */
    running: boolean;
    /**
     * How many step is needed to end the animation
     */
    howmany: number;
    /**
     * Function called at each run and used to animate something
     */
    funct: Function;
    /**
     * Function called when animation is over
     */
    functend: Function;
    /**
     * Key of animation used to store it
     */
    key: string;
    /**
     * Create a new animation
     * @param animationManager Manager where to push animation
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    constructor(animationManager: AnimationManager, howmany?: number, start?: number, step?: number);
    /**
     * Set animation parameters
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    setParam(howmany: number, start?: number, step?: number): this;
    /**
     * Create an infinite animation which will never stop
     * @param funct Function called at each run and used to animate something
     */
    infinite(funct: Function): this;
    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param alter How many step do we need to alternate the animation
     * @param funct1 Alternate function 1
     * @param funct2 Alternate function 2
     * @param functend Function called when animation is over
     */
    alternate(howmany: number, alter: number, funct1: Function, funct2?: Function, functend?: Function): this;
    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param loop How many step do we need to loopn the animation
     * @param funct Function called at each run and used to animate something
     * @param functloop Function called everytime the loop goes back to start
     * @param functend Function called when animation is over
     */
    loop(howmany: number, loop: number, funct: Function, functloop?: Function, functend?: Function): this;
    /**
     * Reverse the current step of the animation
     */
    reverse(): this;
    /**
     * Easiest way to lauch an animation (By default it start at 0 and use a step of 1)
     * @param howmany How many step is needed to end the animation
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    simple(howmany: number, funct: Function, functend?: Function): this;
    /**
     * Set main animation functions and launch it (Often used after setting the animation parameters)
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    go(funct: Function, functend?: Function): this;
    /**
     * Restart animation
     */
    restart(): void;
    /**
     * Stop animation
     * @param arg Sent to functend so that it knows the stop can be forced and is not due to the end of the animation
     */
    stop(arg?: boolean): this;
    /**
     * Pause animation
     */
    pause(): this;
    /**
     * Play animation
     */
    play(): this;
}
