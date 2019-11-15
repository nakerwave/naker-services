
import { el, mount, setStyle, setAttr } from 'redom';
import * as workerPath from "file-loader?name=[name].js!./test.worker";

/**
 * Manage all the essential assets needed to build a 3D scene (Engine, Scene Cameras, etc)
 *
 * The system is really important as it is often sent in every other class created to manage core assets
 */

export class NakerViewer {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     */
    constructor(containerEL: any) {
        // Keep that variable def
        this.container = containerEL;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });

        //  'z-index': -1 not mandatory
        this.canvas = el('canvas', { style: { position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        // Add cool WaterMark in all naker Projects
        setAttr(this.canvas, { 'data-who': '💎 Made with naker.io 💎' });
        mount(this.container, this.canvas);

        console.log('this is a test message, wahoo!!');


        const worker = new Worker(workerPath);

        console.log(workerPath, worker);
        worker.addEventListener('message', message => {
            console.log(message);
        });
        worker.postMessage('this is a test message to the worker');

        window.addEventListener("scroll", () => {
            // if (this.checkingScroll) this.checkScroll();
        });

    }


    /**
    * Make sure there is a position on container
    * @ignore
    */
    checkContainerPosition() {
        // Due to a lot of user feedback having trouble when no position on parent
        // .style returns only inline values (not useful)
        // let containerStyle = this.container.style;
        // getComputedStyle return all values so can be used to check if position already fixed
        let containerStyle = window.getComputedStyle(this.container);
        // Best way found to determine if there is already a position or not
        // Seems like static is the default value (tested in edge, chrome and firefox)
        if (containerStyle.position == 'static') {
            // We set to relative because this is the default behavior
            setStyle(this.container, { position: 'relative' });
            this.engine.resize();
        }
    }

    /**
     * @ignore
     */
    checkingScroll = true;

    /**
    * Set if if have to check scroll to render
    */
    setCheckScroll(checkingScroll: boolean) {
        this.checkingScroll = checkingScroll;
        if (checkingScroll) this.checkScroll();
        else this.launchRender();
    }

    /**
     * @ignore
     */
    checkScroll() {
        // If overflow style = hidden, there is no scrollingElement on document
        let containerVisible = this.checkVisible(this.container);
        if (containerVisible && !this.rendering) this.startRender();
        else if (!containerVisible && this.rendering) this.pauseRender();
    }

    /**
    * Check if element visible by the screen
    */
    checkVisible(elm: HTMLElement) {
        var rect = elm.getBoundingClientRect();
        var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    }

}
