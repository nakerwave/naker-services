
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
