
import { BindEventMessage, EventMessage, ResizeEventMessage } from './screen';

export class NakerWorker {
    
    constructor() {
        self.window = {
            addEventListener: (event: string, fn: Function, option) => {
                this.bindHandler('window', event, fn, option);
            },
            removeEventListener: (event: string, fn: Function, option) => {
                this.unbindHandler('window', event);
            },
            setTimeout: self.setTimeout.bind(self),
            PointerEvent: true,
            innerHeight: 100,
            innerWidth: 100,
        };
        
        self.document = {
            addEventListener: (event: string, fn: Function, option) => {
                this.bindHandler('document', event, fn, option);
            },
            removeEventListener: (event: string, fn: Function, option) => {
                this.unbindHandler('document', event);
            },
            // Uses to detect wheel event like at src/Inputs/scene.inputManager.ts:797
            createElement: () => {
                return {
                    onwheel: true
                };
            },
            defaultView: self.window,
            documentElement: {},
        };
        
        // Not works without it
        class HTMLElement { }
        
        // Listening events from Main thread
        self.onmessage = (msg) => { this.onMainMessage(msg); }
        
        self.canvas = null;
    }
    
    onMainMessage(msg) {
        let type = msg.data.type;
        let data = msg.data;
        switch (type) {
            case 'event':
                this.handleEvent(data);
                break;
            case 'visible':
                this.engine.system.setVisible(data.visible);
                break;
            case 'resize':
                this.onResize(data);
                break;
            case 'scroll':
                this.onScroll(data);
                break;
            case 'init':
                this.prepareCanvas(data.canvas);
                break;
            case 'build':
                data.container = this.canvas;
                this.engine = this.buildProject(data);
                break;
        }
    }

    engine: any;
    buildProject(project: any) {

    }
    
    canvas: HTMLCanvasElement;
    canvasRect: DOMRect | ClientRect = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        height: 0,
        width: 0,
    };
    /**
     * Preparing and hooks canvas
     * @param canvas
     */
    prepareCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        self.canvas = canvas;

        canvas.setAttribute = (name, value) => {
            this.sendToScreen('canvasMethod', {
                method: 'setAttribute',
                args: [name, value],
            });
        };

        canvas.addEventListener = (event: string, fn: Function, option) => {
            this.bindHandler('canvas', event, fn, option);
        };

        canvas.removeEventListener = (event: string, fn: Function, option) => {
            this.unbindHandler('canvas', event);
        };

        canvas.getBoundingClientRect = () => {
            return this.canvasRect;
        };

        canvas.focus = () => {
            this.sendToScreen('canvasMethod', {
                method: 'focus',
                args: [],
            });
        };

        // noinspection JSUnusedGlobalSymbols
        const style = {
            set touchAction(value) {
                postMessage({
                    type: 'canvasStyle',
                    name: 'touchAction',
                    value: value,
                });
            }
        };

        Object.defineProperty(canvas, 'style', {
            get() {
                return style
            }
        });
    }

    /**
     * All event this.handlers
     */
    handlers = new Map();

    /**
     * addEventListener hooks
     * 1. Store callback in worker
     * 2. Send info to Main thread to bind to DOM elements
     * @param targetName
     * @param eventName
     * @param fn
     * @param option third addEventListener argument
     */
    bindHandler(targetName: 'document' | 'window' | 'canvas', eventName: string, fn: Function, option) {

        const handlerId = targetName + eventName;

        this.handlers.set(handlerId, fn);

        let eventMessage: EventMessage = {
            targetName: targetName,
            eventName: eventName,
            option: option,
        }

        this.sendToScreen('event', eventMessage);
    }

    /**
     * removeEventListener hooks
     * 1. Remove callback in worker
     * @param targetName
     * @param eventName
     */
    unbindHandler(targetName: 'document' | 'window' | 'canvas', eventName: string) {
        const handlerId = targetName + eventName;
        this.handlers.delete(handlerId);
    }

    /**
     * Events from Main thread call this handler which calls right callback saved earlier
     * @param event
     */
    handleEvent(event: BindEventMessage) {
        const handlerId = event.targetName + event.eventName;
        event.eventClone.preventDefault = () => {};
        event.eventClone.target = self.canvas;
        // Just in case
        if (!this.handlers.has(handlerId)) {
            throw new Error('Unknown handlerId: ' + handlerId);
        }
        this.handlers.get(handlerId)(event.eventClone);
    }

    onResize(data: ResizeEventMessage) {
        for (let prop of Object.keys(this.canvasRect)) {
            this.canvasRect[prop] = data.canvas[prop];
        }
        
        self.canvas.clientWidth = this.canvasRect.width;
        self.canvas.clientHeight = this.canvasRect.height;

        self.canvas.width = this.canvasRect.width;
        self.canvas.height = this.canvasRect.height;

        self.window.innerWidth = data.window.innerWidth;
        self.window.innerHeight = data.window.innerHeight;
        self.window.devicePixelRatio = data.window.devicePixelRatio;
        self.window.orientation = data.window.orientation;

        self.document.documentElement.clientHeight = data.document.documentElement.clientHeight;
    }

    onScroll(data: ResizeEventMessage) {
        for (let prop of Object.keys(this.canvasRect)) {
            if (this.canvasRect[prop] != data.canvas[prop]) this.canvasRect[prop] = data.canvas[prop];
        }
    }

    sendToScreen(type: string, data: any){
        data.type = type;
        postMessage(data);
    }
}