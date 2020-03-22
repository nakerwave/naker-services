import { Tools } from '@babylonjs/core/Misc/tools';
import '@babylonjs/core/Misc/screenshotTools';
import { VideoRecorder } from '@babylonjs/core/Misc/videoRecorder';

import { SystemAnimation } from './systemAnimation';

interface size {
    width: number,
    height: number,
}

/**
 * Allow to take image or video screenshot of the scene
 */
export class screenshotSystem extends SystemAnimation {

    constructor(containerEl:HTMLCanvasElement) {
        super(containerEl, true);
    }

    /**
     * Take a screenshot of the current scene generating an image buffer
     */
    takeScreenshot(size: size, callback: Function) {
        Tools.CreateScreenshot(this.engine, this.scene.activeCamera, size, (image) => {
            // // Keep that in order to test result image
            // var img = document.createElement('img');
            // img.src = image;
            // img.style.position = 'fixed';
            // img.style.bottom = '100px';
            // img.style.right = '300px';
            // document.body.appendChild(img);
            // console.log(img);
            callback(image);
        });
    }

    /**
     * Take a screenshot of the current scene generating a video in webm format
     */
    takeVideoScreenshot(name: string, time:number, callback: Function) {
        if (VideoRecorder.IsSupported(this.engine)) {
            var recorder = new VideoRecorder(this.engine);
            if (!name) name = 'naker';
            recorder.startRecording(name + ".webm", time).then(() => {
                callback(true);
            });
        } else {
            callback(false, 'Hum 😑, video compilation is not supported by your browser');
        }
    }
}
