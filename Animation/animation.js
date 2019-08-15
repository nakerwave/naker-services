import remove from 'lodash/remove';
/**
 * animation which can be create aniwhere and which will be run by animationManager
 */
var Animation = /** @class */ (function () {
    /**
     * Create a new animation
     * @param System System of the 3D scene
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    function Animation(System, howmany, start, step) {
        /**
         * Starting value
         */
        this.start = 0;
        /**
         * Current progress
         */
        this.count = 0;
        /**
         * Progress step used in each run call
         */
        this.step = 1;
        /**
         * Is the animation running or not
         */
        this.running = false;
        this._system = System;
        if (howmany)
            this.setParam(howmany, start, step);
        this.key = Math.random().toString(36);
        return this;
    }
    /**
     * Set animation parameters
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    Animation.prototype.setParam = function (howmany, start, step) {
        if (this.running)
            this.stop(true);
        this.howmany = howmany - 1;
        if (step)
            this.step = step;
        if (start)
            this.start = start;
        this.count = this.start;
        return this;
    };
    /**
     * Create an infinite animation which will never stop
     * @param funct Function called at each run and used to animate something
     */
    Animation.prototype.infinite = function (funct) {
        var howmany = 1000000000000;
        this.simple(howmany, funct);
        return this;
    };
    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param alter How many step do we need to alternate the animation
     * @param funct1 Alternate function 1
     * @param funct2 Alternate function 2
     * @param functend Function called when animation is over
     */
    Animation.prototype.alternate = function (howmany, alter, funct1, funct2, functend) {
        var ft = true;
        var alterstep = 0;
        this.simple(howmany, function (count, perc) {
            if (count > alter * (alterstep + 1)) {
                ft = !ft;
                alterstep++;
            }
            count = count - alter * alterstep;
            perc = count / alter;
            if (ft)
                funct1(count, perc);
            else
                funct2(count, perc);
        }, functend);
        return this;
    };
    /**
     * Create an infinite animation which will never stop
     * @param howmany How many step is needed to end the animation
     * @param loop How many step do we need to loopn the animation
     * @param funct Function called at each run and used to animate something
     * @param functloop Function called everytime the loop goes back to start
     * @param functend Function called when animation is over
     */
    Animation.prototype.loop = function (howmany, loop, funct, functloop, functend) {
        var loopstep = 0;
        this.simple(howmany, function (count, perc) {
            if (count > loop * (loopstep + 1)) {
                loopstep++;
                if (functloop)
                    functloop();
            }
            count = count - loop * loopstep;
            perc = count / loop;
            funct(count, perc);
        }, functend);
        return this;
    };
    /**
     * Reverse the current step of the animation
     */
    Animation.prototype.reverse = function () {
        this.step = -this.step;
        return this;
    };
    // steps (steps:any) {
    // 	this.loopsteps(steps, 0);
    // 	return this;
    // }
    //
    // loopsteps (steps:any, step:number) {
    // 	if (!steps[step]) return;
    // 	let stepO = steps[step];
    // 	this.simple(stepO.howmany, (count, perc) => {
    // 		stepO.funct(count, perc);
    // 	}, () => {
    // 		stepO.functend();
    // 		step++
    // 		if (!this.running) this.loopsteps(steps, step);
    // 	});
    // }
    /**
     * Easiest way to lauch an animation (By default it start at 0 and use a step of 1)
     * @param howmany How many step is needed to end the animation
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    Animation.prototype.simple = function (howmany, funct, functend) {
        if (this.running)
            this.stop();
        this.start = 0;
        this.count = 0;
        this.step = 1;
        this.howmany = howmany;
        this.go(funct, functend);
        return this;
    };
    /**
     * Set main animation functions and launch it (Often used after setting the animation parameters)
     * @param funct Function called at each run and used to animate something
     * @param functend Function called when animation is over
     */
    Animation.prototype.go = function (funct, functend) {
        this.pause();
        this.running = true;
        this.funct = funct;
        this.functend = functend;
        this.play();
        return this;
    };
    /**
     * Restart animation
     */
    Animation.prototype.restart = function () {
        if (this.running) {
            this.pause();
            this.go(this.funct, this.functend);
        }
    };
    /**
     * Stop animation
     * @param arg Sent to functend so that it knows the stop can be forced and is not due to the end of the animation
     */
    Animation.prototype.stop = function (arg) {
        var _this = this;
        remove(this._system.animationManager.list, function (a) { return a.key == _this.key; });
        this.count = this.start;
        if (this.functend && this.running) {
            this.running = false;
            this.functend(arg);
        }
        return this;
    };
    /**
     * Pause animation
     */
    Animation.prototype.pause = function () {
        var _this = this;
        remove(this._system.animationManager.list, function (a) { return a.key == _this.key; });
        this.running = false;
        return this;
    };
    /**
     * Play animation
     */
    Animation.prototype.play = function () {
        if (this._system.animationManager.list.indexOf(this) == -1)
            this._system.animationManager.list.push(this);
        return this;
    };
    return Animation;
}());
export { Animation };
