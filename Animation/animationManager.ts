
/**
 * Deal with all the scene animations
 */

export class AnimationManager {

	fps = 60;
	fpsratio = 1;
	focusback = false;
	fpsnode:any;
	list = [];

	constructor () {
		window.addEventListener("focus", () => {
			this.setFocusBack();
		});

		window.addEventListener("blur", () => {
			this.setFocusBack();
		});
	}

	/**
	 * Make one step forward for all animations
	 * @param fps Frame per second of the engine
	 */
	runAnimations (fps:number) {
		// if (mode == 'develoment') this.fpsnode.textContent = fps+' - '+this.list.length;
		this.fps = fps;
		this.fpsratio = 60/this.fps;

		// if (this.focusback) return;
		// To avoid acceleration when focus back
		let fpsratio = Math.min(this.fpsratio, 2);
		for (let i = 0; i < this.list.length; i++) {
			let anim = this.list[i];
			if (anim.running) {
				anim.funct(anim.count, anim.count / anim.howmany);
				if (anim.count >= anim.howmany) anim.stop(true);
				anim.count += anim.step * fpsratio;
			}
		}
	}

	/**
	 * Stop all the scene animation
	 */
	stopAnimations () {
		this.setFocusBack();
		for (let i = 0; i < this.list.length; i++) {
			let anim = this.list[i];
			anim.stop(true);
		}
	}

	/**
	 * Restart all the scene animation if there is any
	 */
	restartAnimations () {
		this.setFocusBack();
		for (let i = 0; i < this.list.length; i++) {
			let anim = this.list[i];
			anim.restart();
		}
	}

	/**
	 * Make a small pause of animations (Used when focus is back to window)
	 */
	setFocusBack () {
		this.focusback = true;
		localStorage.clear()
		setTimeout( () => {
			this.focusback = false;
		}, 200);
	}
}
