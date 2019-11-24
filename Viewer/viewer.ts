
import { el, mount, setStyle, setAttr } from 'redom';
// import * as workerPath from "file-loader?name=[name].js!./worker";
// import Worker from "worker-loader!./Worker";

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

    offscreen: boolean;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     */
    constructor(containerEL: HTMLElement, offscreen?:boolean) {
        // Keep that variable def
        this.container = containerEL;
        this.offscreen = offscreen;
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
        if ('OffscreenCanvas' in window && !this.offscreen) {
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


    // Events props to send to worker
    mouseEventFields = [
        'altKey',
        'bubbles',
        'button',
        'buttons',
        'cancelBubble',
        'cancelable',
        'clientX',
        'clientY',
        'composed',
        'ctrlKey',
        'defaultPrevented',
        'detail',
        'eventPhase',
        'fromElement',
        'isTrusted',
        'layerX',
        'layerY',
        'metaKey',
        'movementX',
        'movementY',
        'offsetX',
        'offsetY',
        'pageX',
        'pageY',
        'relatedTarget',
        'returnValue',
        'screenX',
        'screenY',
        'shiftKey',
        'timeStamp',
        'type',
        'which',
        'x',
        'y',
        'deltaX',
        'deltaY',
        'deltaZ',
        'deltaMode',
    ];

    worker: Worker;
    offScreen(scriptUrl: string, callback: Function) {
        this.worker = new Worker(scriptUrl+'worker.js');

        this.worker.onmessage = (mg) => {
            this.workerToMain(mg)
        };

        const offscreenCanvas = this.canvas.transferControlToOffscreen();

        window.addEventListener('resize', () => { this.onResize() }, false);

        this.worker.postMessage({
            type: 'init',
            canvas: offscreenCanvas,
        }, [offscreenCanvas]);
        this.sendToWorker('load', {url: scriptUrl+'engine.js'});
        this.onResize();
        callback();
    }

    engine: any;
    inScreen(scriptUrl: string, callback: Function) {
        const script = document.createElement("script");
        script.src = scriptUrl+'engine.js';
        script.async = true;
        document.body.appendChild(script);
        script.addEventListener('load', () => {
            callback();
        });
    }

    workerToMain(msg) {
        switch (msg.data.type) {
            case 'event':
                this.bindEvent(msg.data);
                break;
            case 'canvasMethod':
                this.canvas[msg.data.method](...msg.data.args);
                break;
            case 'canvasStyle':
                this.canvas.style[msg.data.name] = msg.data.value;
                break;
        }
    }

    /**
     * Bind DOM element
     * @param data
     */
    bindEvent(data) {

        let target;

        switch (data.targetName) {
            case 'window':
                target = window;
                break;
            case 'canvas':
                target = this.canvas;
                break;
            case 'document':
                target = document;
                break;
        }

        if (!target) {
            console.error('Unknown target: ' + data.targetName);
            return;
        }


        target.addEventListener(data.eventName, (e) => {

            // We can`t pass original event to the worker
            const eventClone = this.cloneEvent(e);

            this.worker.postMessage({
                type: 'event',
                targetName: data.targetName,
                eventName: data.eventName,
                eventClone: eventClone,
            });

        }, data.opt);

    }

    /**
     * Cloning Event to plain object
     * @param event
     */
    cloneEvent(event) {
        event.preventDefault();
        const eventClone = {};
        for (let field of this.mouseEventFields) {
            eventClone[field] = event[field];
        }
        return eventClone;
    }

    onResize() {
        let orientation = (<any>window.orientation !== undefined ? +<any>window.orientation : ((<any>window.screen).orientation && ((<any>window.screen).orientation)['angle'] ? ((<any>window.screen).orientation).angle : 0))
        
        let data = {
            canvas: this.canvas.getBoundingClientRect(),
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
                orientation: orientation,
            },
        };
        this.sendToWorker('resize', data);
    }

    sendToWorker(type: string, data: any) {
        data.type = type;
        if (this.worker) this.worker.postMessage(data);
    }

}
