
import { el, mount, setStyle, setAttr } from 'redom';
import { NakerScreen } from './screen';

export class NakerViewer extends NakerScreen {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;

    offscreen = true;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     * @param offscreen if false, the viewer won't use offscreen canvas
     */
    constructor(containerEL: HTMLElement, offscreen?:boolean) {
        super();
        // Keep that variable def
        this.container = containerEL;
        if (offscreen !== undefined) this.offscreen = offscreen;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });

        //  'z-index': -1 not mandatory
        this.canvas = el('canvas', { style: { position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        // Add cool WaterMark in all naker Projects
        setAttr(this.canvas, { 'data-who': '💎 Made with naker.io 💎' });
        mount(this.container, this.canvas);
        
        window.addEventListener("scroll", () => {
            if (this.checkingScroll) this.checkScroll();
        });

        this.checkContainerPosition();
        this._checkViewport();
    }

    /**
     * Window viewport can be problematic for scale rendering, we check if one is present
     * @ignore
     */
    _checkViewport() {
        // In order to have good scale and text size, we need to check for the viewport meta in header
        // This makes the scene a bit blurry on iphones, need to find a solution
        let viewport = document.querySelector("meta[name=viewport]");
        if (!viewport) {
            let viewporttoadd = el('meta', { content: "width=device-width, initial-scale=1", name: "viewport" });
            mount(document.getElementsByTagName('head')[0], viewporttoadd);
        }
        // Should check for the viewport and adapt to it.
        // else {
        //   let content = viewport.getAttribute("content");
        //   if (content) {
        //     let scalecheck = content.indexOf('initial-scale');
        //     if (scalecheck == -1) this.ratio = window.devicePixelRatio;
        //   }
        // }
    }
    
    load(scriptUrl: string, project: any, callback: Function) {
        if ('OffscreenCanvas' in window && this.offscreen) {
            this.offScreen(scriptUrl, () => {
                this.sendToWorker('build', project);
                callback('offscreen mode');
            });
        } else {
            this.inScreen(scriptUrl, () => {
                project.container = this.canvas;
                this.engine = this.buildProject(project);
                callback(this.engine);
            });
        }
        this.onResize();
    }

    buildProject(project: any) {

    }

    /**
    * Make sure there is a position on container
    * @ignore
    */
    checkContainerPosition() {
        // Due to a lot of user feedback having trouble when no position on parent
        // .style returns only inline values (not useful)
        // let containerStyle = this.container.style;
        // getComputedStyle return all values so can be used to check if position already setted
        let containerStyle = window.getComputedStyle(this.container);
        // Best way found to determine if there is already a position or not
        // Seems like static is the default value (tested in edge, chrome and firefox)
        if (containerStyle.position == 'static') {
            // We set to relative because this is the default behavior
            setStyle(this.container, { position: 'relative' });
        }
    }

    /**
     * @ignore
     */
    checkingScroll = true;

    /**
    * Set if we have to check scroll to render
    */
    setCheckScroll(checkingScroll: boolean) {
        this.checkingScroll = checkingScroll;
        if (checkingScroll) this.checkScroll();
        else this.startRender();
    }

    /**
     * @ignore
     */
    checkScroll() {
        // If overflow style = hidden, there is no scrollingElement on document
        let containerVisible = this.checkVisible(this.container);
        if (containerVisible) this.startRender();
        else if (!containerVisible) this.pauseRender();
    }


    /**
    * Say engine the canvas is visible and that we should render the scene
    */
    startRender() {
        if (this.worker) this.sendToWorker('visible', { visible: true });
        else this.engine.system.setVisible(true);
    }

    /**
    * Say engine the canvas is not visible and that we should stop rendering the scene
    */
    pauseRender() {
        if (this.worker) this.sendToWorker('visible', {visible:false});
        else this.engine.system.setVisible(false);
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
