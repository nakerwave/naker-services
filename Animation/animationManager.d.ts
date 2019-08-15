/**
 * Deal with all the scene animations
 */
export declare class AnimationManager {
    fps: number;
    fpsratio: number;
    focusback: boolean;
    fpsnode: any;
    list: never[];
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
