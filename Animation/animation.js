import remove from 'lodash/remove';
/**
 * Deal with all the scene animations
 */
var AnimationManager = /** @class */ (function () {
    function AnimationManager() {
        var _this = this;
        this.fps = 60;
        this.fpsratio = 1;
        this.focusback = false;
        this.list = [];
        window.addEventListener("focus", function () {
            _this.setFocusBack();
        });
        window.addEventListener("blur", function () {
            _this.setFocusBack();
        });
    }
    /**
     * Make one step forward for all animations
     * @param fps Frame per second of the engine
     */
    AnimationManager.prototype.runAnimations = function (fps) {
        // if (mode == 'develoment') this.fpsnode.textContent = fps+' - '+this.list.length;
        this.fps = fps;
        this.fpsratio = 60 / this.fps;
        // if (this.focusback) return;
        // To avoid acceleration when focus back
        var fpsratio = Math.min(this.fpsratio, 2);
        for (var i = 0; i < this.list.length; i++) {
            var anim = this.list[i];
            if (anim.running) {
                anim.funct(anim.count, anim.count / anim.howmany);
                if (anim.count >= anim.howmany)
                    anim.stop(true);
                anim.count += anim.step * fpsratio;
            }
        }
    };
    /**
     * Stop all the scene animation
     */
    AnimationManager.prototype.stopAnimations = function () {
        this.setFocusBack();
        for (var i = 0; i < this.list.length; i++) {
            var anim = this.list[i];
            anim.stop(true);
        }
    };
    /**
     * Restart all the scene animation if there is any
     */
    AnimationManager.prototype.restartAnimations = function () {
        this.setFocusBack();
        for (var i = 0; i < this.list.length; i++) {
            var anim = this.list[i];
            anim.restart();
        }
    };
    /**
     * Make a small pause of animations (Used when focus is back to window)
     */
    AnimationManager.prototype.setFocusBack = function () {
        var _this = this;
        this.focusback = true;
        localStorage.clear();
        setTimeout(function () {
            _this.focusback = false;
        }, 200);
    };
    return AnimationManager;
}());
export { AnimationManager };
/**
 * animation which can be create aniwhere and which will be run by animationManager
 */
var Animation = /** @class */ (function () {
    /**
     * Create a new animation
     * @param animationManager Manager where to push animation
     * @param howmany How many step is needed to end the animation
     * @param start Starting value
     * @param step Progress step used in each run call
     */
    function Animation(animationManager, howmany, start, step) {
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
        this.animationManager = animationManager;
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
            else if (funct2)
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
        remove(this.animationManager.list, function (a) { return a.key == _this.key; });
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
        remove(this.animationManager.list, function (a) { return a.key == _this.key; });
        this.running = false;
        return this;
    };
    /**
     * Play animation
     */
    Animation.prototype.play = function () {
        if (this.animationManager.list.indexOf(this) == -1)
            this.animationManager.list.push(this);
        return this;
    };
    return Animation;
}());
export { Animation };
//# sourceMappingURL=animation.js.map