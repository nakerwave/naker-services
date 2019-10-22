
import '@babylonjs/core/Misc/screenshotTools';
import { Tools } from '@babylonjs/core/Misc/tools';
import { VideoRecorder } from '@babylonjs/core/Misc/videoRecorder';

import { System } from './system';

interface size {
    width: number,
    height: number,
}

/**
 * Allow to take image or video screenshot of the scene
 */
export class screenshotSystem extends System {

    /**
     * Take a screenshot of the current scene generating an image buffer
     */
    takeScreenshot(size: size, callback: Function) {
        Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.activeCamera, size, (image) => {
            // Keep that in order to test result image
            // var img = document.createElement('img');
            // img.src = image;
            // img.style.position = 'absolute';
            // img.style.bottom = '100px';
            // img.style.right = '300px';
            // document.body.appendChild(img);
            // img.innerHTML = "Image Element Added."; 
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
