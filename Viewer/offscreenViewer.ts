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
    constructor(viewerOption: OffscreenViewerOption) {
        super(viewerOption);
        if (viewerOption && viewerOption.offscreen !== undefined) this.offscreen = viewerOption.offscreen;
    }

    load(project: any, callback: Function) {
        if (this.isOffsreenAvailable() && this.offscreen) {
            let offscreenSuccess = this.offScreen(() => {
                console.log('Naker - offscreen');
                this.sendToWorker('build', project);
                callback('offscreen mode');
            });
            if (!offscreenSuccess) {
                this.loadInscreen(project, callback);
            }
        } else {
            this.loadInscreen(project, callback);
        }
        this.onResize();
    }

    loadInscreen(project: any, callback: Function) {
        this.inScreen(() => {
            project.container = this.container;
            project.canvas = this.canvas;
            let engine = this.buildProject(project);
            this.system = engine.system;
            callback(engine);
        });
    }

    // Offscreen canvas not compatible everywhere yet
    isOffsreenAvailable() {
        return 'transferControlToOffscreen' in this.canvas && 'OffscreenCanvas' in window;
    }

    buildProject(project: any) {
    }
}
