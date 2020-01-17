import { NakerViewer } from './viewer';

export interface WorkerMessage {
     data: any;
 }

export interface EventMessage {
    targetName: 'document' | 'window' | 'canvas';
    eventName: string;
    option: any;
}

export interface BindEventMessage {
    targetName: 'document' | 'window' | 'canvas';
    eventName: string;
    eventClone: any;
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
    window: WindowData;
    document: DocumentData;
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
    ];

    worker: Worker;
    offScreen(scriptUrl: string, callback: Function) {
        // this.worker = new Worker(scriptUrl + 'worker.js');
        this.worker = this.createWorker(scriptUrl + 'worker.js');
        // In case error creating the worker, we fallback to inscreen canvas
        if (!this.worker) return this.inScreen(scriptUrl, callback);
        this.worker.onmessage = (mg) => {
            this.workerToMain(mg)
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
    }

    createWorker(workerUrl:string) {
        var worker = null;
        try {
            console.log(0);
            
            worker = new Worker(workerUrl);
        } catch (e) {
            console.log(1);
            try {
                var blob;
                try {
                    console.log(2);
                    blob = new Blob(["importScripts('" + workerUrl + "');"], { "type": 'application/javascript' });
                } catch (e1) {
                    console.log(3);
                    var blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
                    blobBuilder.append("importScripts('" + workerUrl + "');");
                    blob = blobBuilder.getBlob('application/javascript');
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

    inScreen(scriptUrl: string, callback: Function) {
        const script = document.createElement("script");
        script.src = scriptUrl+'engine.js';
        script.async = true;
        document.body.appendChild(script);
        script.addEventListener('load', () => {
            callback();
        });
    }

    workerToMain(msg: WorkerMessage) {
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
    bindEvent(data: EventMessage) {

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
        event.preventDefault();
        const eventClone = {};
        for (let field of this.mouseEventFields) {
            eventClone[field] = event[field];
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

    sendToWorker(type: string, data: any) {
        data.type = type;
        if (this.worker) this.worker.postMessage(data);
    }

}
