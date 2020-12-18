import { NakerScreen } from './screen';
import { ViewerOption } from './viewer';

export interface OffscreenViewerOption extends ViewerOption {
    offscreen?: boolean;
}

export class NakerOffscreenViewer extends NakerScreen {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;
    system: any;

    offscreen = true;

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
            this.offscreen = offscreenSuccess;
            if (!offscreenSuccess) {
                this.loadInscreen(project, callback);
            }
        } else {
            this.loadInscreen(project, callback);
        }
        this.onResize();
    }

    loadInscreen(project: any, callback: Function) {
        this.offscreen = false;
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
