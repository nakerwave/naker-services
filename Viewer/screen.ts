import { NakerViewer, currentScript } from './viewer';

export interface BasicEventMessage { 
    targetName: 'document' | 'window' | 'canvas' | 'loader', // Loader event used to have project loading progress
    eventName: string,
}

export interface WorkerMessage extends BasicEventMessage {
    type: 'event' | 'method' | 'style',
    option?: any,
}

export interface EventMessage extends BasicEventMessage {
    option: any,
}

export interface BindEventMessage extends BasicEventMessage {
    eventClone: any,
}

export interface WindowData {
    innerWidth: number,
    innerHeight: number,
    devicePixelRatio: number,
    orientation: number,
}

export interface DocumentData {
    documentElement: {
        clientHeight: number;
    },
}

export interface ResizeEventMessage {
    canvas: DOMRect|ClientRect;
    window?: WindowData;
    document?: DocumentData;
}

export class NakerScreen extends NakerViewer {

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
        'changedTouches',
    ];

    worker: Worker;
    offScreen(callback: Function) {
        let scriptUrl = this.getScriptUrl();
        this.worker = this.createWorker(scriptUrl + 'worker.js');
        // In case error creating the worker, we fallback to inscreen canvas
        if (!this.worker) return false;

        this.worker.onmessage = (mg) => {
            this.messageFromWorker(mg)
        };

        const offscreenCanvas = this.canvas.transferControlToOffscreen();

        window.addEventListener('resize', () => { this.onResize() }, false);
        window.addEventListener('scroll', () => { this.onScroll() }, false);

        this.worker.postMessage({
            type: 'init',
            canvas: offscreenCanvas,
        }, [offscreenCanvas]);
        this.onResize();
        callback();
        return true;
    }

    engineVersion: string;
    setEngineVersion(engineVersion: string) {
        this.engineVersion = engineVersion;
    }

    getScriptUrl(): string {
        let scriptUrlString = currentScript.src;
        let scriptUrlArray = scriptUrlString.split('/');
        scriptUrlArray.pop(); // Remove viewer.js
        if (this.engineVersion) { // Check version
            scriptUrlArray.pop();
            scriptUrlArray.push('v' + this.engineVersion);
        }
        let scriptUrl = scriptUrlArray.join('/') + '/';
        return scriptUrl;
    }

    createWorker(workerUrl:string) {
        var worker = null;
        try {
            worker = new Worker(workerUrl);
        } catch (e) {
            try {
                var blob;
                try {
                    blob = new Blob(["importScripts('" + workerUrl + "');"], { "type": 'application/javascript' });
                } catch (e1) {
                    try {
                        var blobBuilder = new (window.BlobBuilder || window.MSBlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
                        blobBuilder.append("importScripts('" + workerUrl + "');");
                        blob = blobBuilder.getBlob('application/javascript');
                    } catch (e2) {
                        return false;
                        //if it still fails, there is nothing much we can do
                    }
                }
                var url = window.URL || window.webkitURL;
                var blobUrl = url.createObjectURL(blob);
                worker = new Worker(blobUrl);
            } catch (e2) {
                return false;
                //if it still fails, there is nothing much we can do
            }
        }
        return worker;
    }

    inScreen(callback: Function) {
        let scriptUrl = this.getScriptUrl();
        const script = document.createElement("script");
        script.src = scriptUrl+'engine.js';
        script.async = true;
        document.body.appendChild(script);
        script.addEventListener('load', () => {
            callback();
        });
    }

    messageFromWorker(msg: any) {
        let data: WorkerMessage = msg.data;
        if (data.targetName == 'canvas' || data.targetName == 'window' || data.targetName == 'document') {
            this.bindScreenToWorker(data);
        } else if (data.type == 'event') {
            this.handleEvent(data);
        }
    }

    bindScreenToWorker(data: WorkerMessage) {
        switch (data.type) {
            case 'event':
                this.bindEvent(data);
                break;
            case 'method':
                this.bindMethod(data);
                break;
            case 'style':
                this.bindStyle(data);
                break;
        }
    }

    /**
     * All event
     */
    handlers = new Map();

    bindWorkerToScreen(targetName: BasicEventMessage['targetName'], eventName: string, fn: Function, option?) {
        const handlerId = targetName + eventName;
        this.handlers.set(handlerId, fn);
    }

    handleEvent(event: WorkerMessage) {
        const handlerId = event.targetName + event.eventName;
        if (!this.handlers.has(handlerId)) {
            return;
            // Don't need to throw error has the event can be removed
            // throw new Error('Unknown handlerId: ' + handlerId);
        }
        this.handlers.get(handlerId)(event.option);
    }

    getTarget(data: WorkerMessage) {
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
            return null;
        }
        return target;
    }

    /**
     * Execute method
     * @param data
     */
    bindMethod(data: WorkerMessage) {
        let target = this.getTarget(data);
        if (!target) return;
        
        target[data.eventName](...data.option);
    }

    /**
     * Change style
     * @param data
    */
    bindStyle(data: WorkerMessage) {
        let target = this.getTarget(data);
        if (!target) return;

        target.style[data.eventName] = data.option;
    }

    /**
     * Bind DOM element
     * @param data
     */
    bindEvent(data: WorkerMessage) {
        let target = this.getTarget(data);
        if (!target) return;

        target.addEventListener(data.eventName, (e) => {
            // We can`t pass original event to the worker
            const eventClone = this.cloneMouseEvent(e);
            let bindEventMessage: BindEventMessage = {
                targetName: data.targetName,
                eventName: data.eventName,
                eventClone: eventClone,
            };
            this.sendToWorker('event', bindEventMessage);
        }, data.option);
    }

    /**
     * Cloning Event to plain object
     * @param event
     */
    cloneMouseEvent(event: Event) {
        // Sometimes can't preventDefault like with touch events
        // Do not do that or it prevents from scroll when mouse above Naker scene
        // try {
        //     event.preventDefault();
        // } catch {}
        return this.cloneMouseEventProperties(event);
    }

    cloneMouseEventProperties(event: Event) {
        const eventClone = {};
        for (let field of this.mouseEventFields) {
            if (field == 'changedTouches' && event.changedTouches) {
                eventClone.changedTouches = [];
                eventClone.changedTouches[0] = this.cloneMouseEventProperties(event.changedTouches[0]);
            } else {
                eventClone[field] = event[field];
            }
        }
        return eventClone;
    }

    onResize() {
        let orientation = (<any>window.orientation !== undefined ? +<any>window.orientation : ((<any>window.screen).orientation && ((<any>window.screen).orientation)['angle'] ? ((<any>window.screen).orientation).angle : 0))
        
        let data: ResizeEventMessage = {
            canvas: this.canvas.getBoundingClientRect(),
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
                orientation: orientation,
            },
            document: {
                documentElement: {
                    clientHeight: document.documentElement.clientHeight
                }
            }
        };
        this.sendToWorker('resize', data);
    }

    onScroll() {
        let data: ResizeEventMessage = {
            canvas: this.canvas.getBoundingClientRect(),
        };
        this.sendToWorker('scroll', data);
    }

    sendToWorker(type: string, data: Object) {
        data.type = type;

        // Avoid HTML Element to be used
        // Ths can create error: Converting circular structure to JSON
        let serializer = (key, value) => {
            if ( this.isElement(value) ) return null;
            else return value;
        }

        // Make sure data object is clonable
        // This will remove methods
        data = JSON.parse(JSON.stringify(data, serializer));
        if (this.worker) this.worker.postMessage(data);
    }

    //Returns true if it is a DOM element    
    isElement(o) {
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
        );
    }
}
