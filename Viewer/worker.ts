
export class NakerWorker {
    
    constructor() {
        self.importScripts('https://test.naker.io/back/viewer.js');
        
        self.window = {
            addEventListener: (event, fn, opt) => {
                this.bindHandler('window', event, fn, opt);
            },
            setTimeout: self.setTimeout.bind(self),
            PointerEvent: true,
            innerHeight: 100,
            innerWidth: 100,
        };
        
        self.document = {
            addEventListener: (event, fn, opt) => {
                this.bindHandler('document', event, fn, opt);
            },
            // Uses to detect wheel event like at src/Inputs/scene.inputManager.ts:797
            createElement: () => {
                return {
                    onwheel: true
                };
            },
            defaultView: self.window,
        };
        
        // Not works without it
        class HTMLElement { }
        
        // Listening events from Main thread
        self.onmessage = (msg) => { this.onMainMessage(msg); }
        
        /**
         * All event handlers
         * @type {Map<String, Function>} key as (documentcontextmenu, canvaspointerup...)
         */
        self.handlers = new Map();
        
        /**
         * @type {OffscreenCanvas}
         */
        self.canvas = null;
        
        // getBoundingInfo()
    }
    
    onMainMessage(msg) {
        let type = msg.data.type;
        let data = msg.data;
        switch (type) {
            case 'event':
                this.handleEvent(data);
                break;
            case 'resize':
                this.onResize(data);
                break;
            case 'load':
                self.importScripts(data.url);
                break;
            case 'init':
                this.prepareCanvas(data);
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
    rect = {
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
     * @param data
     * @returns {OffscreenCanvas}
     */
    prepareCanvas(data) {
        const canvas = data.canvas;
        this.canvas = data.canvas;
        self.canvas = canvas;

        canvas.setAttribute = (name, value) => {
            postMessage({
                type: 'canvasMethod',
                method: 'setAttribute',
                args: [name, value],
            })
        };

        canvas.addEventListener = (event, fn, opt) => {
            this.bindHandler('canvas', event, fn, opt);
        };

        canvas.getBoundingClientRect = () => {
            return this.rect;
        };

        canvas.focus = () => {
            postMessage({
                type: 'canvasMethod',
                method: 'focus',
                args: [],
            })
        };

        // noinspection JSUnusedGlobalSymbols
        const style = {
            set touchAction(value) {
                postMessage({
                    type: 'canvasStyle',
                    name: 'touchAction',
                    value: value,
                })
            }
        };

        Object.defineProperty(canvas, 'style', {
            get() {
                return style
            }
        });
    }

    /**
     * addEventListener hooks
     * 1. Store callback in worker
     * 2. Send info to Main thread to bind to DOM elements
     * @param {String} targetName  ['canvas', 'document', 'window']
     * @param {String} eventName
     * @param {Function} fn
     * @param {Boolean} opt third addEventListener argument
     */
    bindHandler(targetName, eventName, fn, opt) {

        const handlerId = targetName + eventName;

        handlers.set(handlerId, fn);

        postMessage({
            type: 'event',
            targetName: targetName,
            eventName: eventName,
            opt: opt,
        });
    }

    /**
     * Events from Main thread call this handler which calls right callback saved earlier
     * @param event
     */
    handleEvent(event) {
        const handlerId = event.targetName + event.eventName;
        event.eventClone.preventDefault = () => {};
        event.eventClone.target = self.canvas;
        // Just in case
        if (!handlers.has(handlerId)) {
            throw new Error('Unknown handlerId: ' + handlerId);
        }
        handlers.get(handlerId)(event.eventClone);
    }

    onResize(data) {
        for (let prop of Object.keys(this.rect)) {
            this.rect[prop] = data.canvas[prop];
        }
        
        self.canvas.clientWidth = this.rect.width;
        self.canvas.clientHeight = this.rect.height;

        self.canvas.width = this.rect.width;
        self.canvas.height = this.rect.height;

        self.window.innerWidth = data.window.innerWidth;
        self.window.innerHeight = data.window.innerHeight;
        self.window.devicePixelRatio = data.window.devicePixelRatio;
        self.window.orientation = data.window.orientation;
    }
}

new NakerWorker();