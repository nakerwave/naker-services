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
