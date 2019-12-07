import { NakerScreen } from './screen';
import { System } from '../System/system';
import { ViewerOption } from './viewer';

export interface OffscreenViewerOption extends ViewerOption {
    offscreen?: boolean;
}

export class NakerOffscreenViewer extends NakerScreen {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;
    system: System;

    offscreen = true;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     * @param offscreen if false, the viewer won't use offscreen canvas
     */
    constructor(containerEL: HTMLElement, viewerOption?: OffscreenViewerOption) {
        super(containerEL);
        if (viewerOption && viewerOption.offscreen !== undefined) this.offscreen = viewerOption.offscreen;
    }

    load(scriptUrl: string, project: any, callback: Function) {
        if (this.isOffsreenAvailable() && this.offscreen) {
            this.offScreen(scriptUrl, () => {
                this.sendToWorker('build', project);
                callback('offscreen mode');
            });
        } else {
            this.inScreen(scriptUrl, () => {
                project.container = this.canvas;
                let engine = this.buildProject(project);
                this.system = engine.system;
                callback(engine);
            });
        }
        this.onResize();
    }

    // Offscreen canvas not compatible everywhere yet
    isOffsreenAvailable() {
        return 'transferControlToOffscreen' in this.canvas && 'OffscreenCanvas' in window;
    }

    buildProject(project: any) {
    }
}
