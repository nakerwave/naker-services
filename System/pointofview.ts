
import { Vector3 } from '@babylonjs/core/Maths/math'

export interface PointOfViewOptions {
    name:string,
    position:Vector3,
    rotation:Vector3,
}

/**
* Used to parameter a step in the story
*/
export class PointOfView {

    /**
    * Name of the point of view
    */
    name:string;

    /**
    * The position of the point of view in the 3D scene
    */
    position:Vector3;

    /**
    * The rotation of the point of view which determine what we see
    */
    rotation:Vector3;

    /**
     * @param pointofviewOptions Options to be used
     */
    constructor(pointofviewOptions: PointOfViewOptions) {
        this.name = pointofviewOptions.name;

        this.setPosition(pointofviewOptions.position);
        this.setRotation(pointofviewOptions.rotation);
    }

    /**
     * Set the position of the pointofview
     * @param position New position
     */
    setPosition (position:Vector3) {
        this.position = position;
    }

    /**
     * Set the rotation of the pointofview
     * @param rotation New rotation
     */
    setRotation (rotation:Vector3) {
        this.rotation = rotation;
    }
}
