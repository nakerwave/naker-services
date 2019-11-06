import { PointOfView } from './pointofview';
import { ProgressCatcher } from '../Catchers/progressCatcher';
import { MouseCatcher } from '../Catchers/mouseCatcher';
import { System } from './system';

import { Vector3, Vector2, Curve3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import remove from 'lodash/remove';
import find from 'lodash/find';

/**
 * Manage the movement of the camera along the journey and story
 */
export class Navigation {

    /**
     * @ignore
     */
    _system: System;

    /**
     * @ignore
     */
    _progressCatcher: ProgressCatcher;

    /**
     * Scene Camera to be used in movement changes
     */
    camera: FreeCamera;

    /**
     * Duration between two point of view to make it more or less precise and quick
     */
    duration: number = 500;

    /**
     * Is the cameras following mouse movement
     */
    followMouse: boolean = false;

    /**
     * List of all journey point of views
     */
    pointofviews: Array < PointOfView > = [];

    /**
     * The mouse position currently followed
     */
    currentMousePosition: Vector2;

    /**
     * @param system System of the 3D scene
     * @param progressCatcher Used to manage journey progress depending on scroll
     * @param mouseCatcher Used when camera has to follow mouse movement
     * @param pipeline Used to make journey pipeline transition depending on pointofviews options
     * @param progressBar Used to set the number of step to show on the progress bar
     */
    constructor(system: System, camera: FreeCamera, progressCatcher: ProgressCatcher, mouseCatcher: MouseCatcher) {
        this._system = system;
        this.camera = camera;

        this._progressCatcher = progressCatcher;
        progressCatcher.addListener((scrollPercentage: number) => {
            if (this.started) this.animViewPercentage(scrollPercentage);
        });

        this.currentMousePosition = new Vector2(0, 0);
        mouseCatcher.addListener((mousepos: Vector2) => {
            let navigationMousepos = mousepos.divideInPlace(new Vector2(10, 10));
            this.currentMousePosition = navigationMousepos;
            if (this.followMouse && this.started) {
                if (this.currentRotation) {
                    let newrot = this.currentRotation.add(new Vector3(navigationMousepos.y, navigationMousepos.x, 0));
                    this.setCameraRotation(newrot);
                }
            }
        });
    }

    /**
     * Set if the navigation camera should follow mouse movement or not
     */
    setFollowMouse(followMouse: boolean) {
        this.followMouse = followMouse;
    }

    /**
     * Set the list of point of views which will make the journey
     */
    setPointOfViews(pointofviews: Array < PointOfView > ) {
        for (let i = 0; i < pointofviews.length; i++) {
            this._addPointOfView(pointofviews[i]);
        }
    }

    /**
     * @ignore
     */
    _addPointOfView(pointofview: PointOfView) {
        this.pointofviews.push(pointofview);
    }

    /**
     * @ignore
     */
    _removePointOfView(pointofview: PointOfView) {
        remove(this.pointofviews, (o) => {
            return pointofview.name === o.name;
        });
    }

    /**
     * Set the cameras to be used in journey changes
     */
    setCamera(Camera: FreeCamera) {
        if (this.camera) this.camera.detachControl(this._system.canvas);
        this._system.scene.activeCamera = Camera;
        this.camera = Camera;
    }

    /**
     * @ignore
     */
    _curveLength: number;

    /**
     * Determine the spline of the journey in the 3D scene
     */
    getSpline(pointofviewsSorted: Array < PointOfView > ) {
        let pointofviewPositions = [];
        let pointofviewRotations = [];
        let checkRotations = [];
        let firstpointofview = pointofviewsSorted[0];

        if (pointofviewsSorted.length < 2) return this.showPointofview(firstpointofview);
        let pi = 180;
        for (let i = 0; i < pointofviewsSorted.length; i++) {
            pointofviewPositions.push(pointofviewsSorted[i].position.clone());
            checkRotations.push(pointofviewsSorted[i].rotation.clone());
        }
        // We check for the closest rotation angle between two point of views
        for (let i = 0; i < pointofviewsSorted.length; i++) {
            let rotationnew = checkRotations[i];
            if (pointofviewsSorted[i - 1]) {
                let rotationprevius = checkRotations[i - 1];
                let rotationgap = rotationnew.subtract(rotationprevius);
                for (let key in {
                        x: 0,
                        y: 0,
                        z: 0
                    }) {
                    let gap = rotationgap[key];
                    if (Math.abs(gap) > pi) {
                        rotationnew[key] = rotationprevius[key];
                        rotationnew[key] += (gap < 0) ? gap + (pi * 2) : gap - (pi * 2);
                    } else {
                        rotationnew[key] = rotationprevius[key];
                        rotationnew[key] += gap;
                    }
                }
            }
            pointofviewRotations[i] = rotationnew;
        }

        this.getAllPointofviewsCurve(pointofviewPositions, pointofviewRotations);
        this.showPointofview(firstpointofview);
    }

    /**
     * Determine the spline of the journey in the 3D scene
     */
    positions: Array < Vector3 > ;

    /**
     * Determine the spline of the journey in the 3D scene
     */
    rotations: Array < Vector3 > ;

    /**
     * @ignore
     */
    _journeyLength: number;

    /**
     * @ignore
     */
    getAllPointofviewsCurve(pointofviewPositions: Array < Vector3 > , pointofviewRotations: Array < Vector3 > ) {
        let catmullRomPos = Curve3.CreateCatmullRomSpline(pointofviewPositions, this._curveLength, false);
        this.positions = catmullRomPos.getPoints();

        let catmullRomRot = Curve3.CreateCatmullRomSpline(pointofviewRotations, this._curveLength, false);
        this.rotations = catmullRomRot.getPoints();

        
        this._journeyLength = this.positions.length;
    }

    /**
     * @ignore
     */
    started = false;

    /**
     * Start the navigation based on current Point of Views
     */
    start() {
        this.calculteSpline();
        this.showStartPointofview();
        this.started = true;
    }

    /**
     * Stop the navigation
     */
    stop() {
        this.started = false;
    }

    /**
     * @ignore
     */
    calculteSpline() {
        let nb = this.pointofviews.length;
        this._curveLength = Math.round(this.duration * 3 / nb); // *3 or you can see step when scroll is slowing
        this.getSpline(this.pointofviews);
    }

    /**
     * Set the camera to the start of the journey
     */
    showStartPointofview() {
        let firstpointofview = Object.keys(this.pointofviews)[0];
        let newpointofview = this.pointofviews[firstpointofview];
        this.showPointofview(newpointofview);
    }

    /**
     * Set the camera to a specific point of view
     * @param pointofview the point of view to be used
     */
    showPointofview(pointofview: PointOfView) {
        this.setCameraPosition(pointofview.position);
        let rot = pointofview.rotation;
        this.currentRotation = rot;
        this.setCameraRotation(rot);
    }

    /**
     * animate the camera to a specific point of view
     * @param pointofview name of the pointofview to go to
     */
    moveToPointofView(pointofviewName: string) {
        let pointofview = find(this.pointofviews, (o) => {
            return pointofviewName === o.name;
        });
        if (!pointofview) return console.error("This point of view doesn't exist");
        let index = this.pointofviews.indexOf(pointofview);
        let l = this.pointofviews.length;
        this._progressCatcher.catch(index / l, this._progressCatcher.speed);
    }

    /**
     * Current position of the cameras
     */
    currentPosition: Vector3;

    /**
     * Current rotation of the cameras
     */
    currentRotation: Vector3;

    /**
     * Set the navigation along the journey changing the position and rotation of the cameras, plus the pipeline corresponding of the point of view
     * @param perc Progress in the journey
     */
    animViewPercentage(perc: number) {
        this._animViewPercentage(perc);
    }

    /**
     * @ignore
     */
    _animViewPercentage(perc: number) {
        if (!this._journeyLength) return; // Safety 1
        let step = Math.min(Math.round(this._journeyLength * perc), this._journeyLength - 1);
        if (!this.positions[step]) return; // Safety 2
        
        this.currentPosition = this.positions[step];
        this.setCameraPosition(this.positions[step]);
        // ROTATION
        let newrot = this.rotations[step].clone();
        this.currentRotation = newrot;
        if (this.followMouse) newrot = newrot.add(new Vector3(this.currentMousePosition.y, this.currentMousePosition.x, 0));
        this.setCameraRotation(newrot);
    }

    /**
     * Set the cameras position in the 3D scene
     * @param position Position to set
     */
    setCameraPosition(position: Vector3) {        
        this.camera.position = position;
    }

    /**
     * Set the cameras rotation in the 3D scene
     * @param rotation Rotation to set
     */
    setCameraRotation(rotation: Vector3) {
        this.camera.rotation = rotation;
        // Keep that for future VR camera rotation
        // let target = this._system.freecamera.getFrontPosition(10);
        // this._system.mobilecamera.setTarget(target);
        // this._system.mobilecamera.lockedTarget = target;
        // this._system.mobilecamera.lockedTarget = null;
    }
}