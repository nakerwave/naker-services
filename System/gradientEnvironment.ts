import { System } from './system';

import { Color4 } from '@babylonjs/core/Maths/math'
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import '@babylonjs/core/Meshes/meshBuilder';
import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import '@babylonjs/core/Materials/standardMaterial';

export class GradientEnvironment {

    system: System;

    gradient: 'vertical' | 'horizontal' | 'radial';
    colorStart: Array<number>;
    colorEnd: Array<number>;

    constructor(system: System) {
        this.system = system;
        this.setSky();
    }

    skySize = 200.0;
    skyBox: Mesh;
    sky: ShaderMaterial;
    setSky() {
        this.skyBox = Mesh.CreateSphere("skyBox", 10.0, this.skySize, this.system.scene);
        this.skyBox.freezeWorldMatrix();
        this.skyBox.convertToUnIndexedMesh();
        this.skyBox.doNotSyncBoundingInfo = true;
        // Be careful : cullingStrategy prevent Shader from working
        // this.skyBox.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
        let sharedVextex = "precision mediump float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec4 vPosition;varying vec3 vNormal;void main(){vec4 p = vec4(position,1.0);vPosition = p;vNormal = normal;gl_Position = worldViewProjection * p;}"
        let sharedVar = "precision mediump float;uniform mat4 worldView;varying vec4 vPosition;varying vec3 vNormal;uniform vec4 topColor;uniform vec4 bottomColor;"
        Effect.ShadersStore.verticalVertexShader = sharedVextex;
        Effect.ShadersStore.verticalPixelShader = sharedVar + "void main(void){float h = normalize(vPosition).y + 0.5;float maxh = max(h,0.0); gl_FragColor = mix(bottomColor,topColor,maxh);}";

        Effect.ShadersStore.horizontalVertexShader = sharedVextex;
        Effect.ShadersStore.horizontalPixelShader = sharedVar + "void main(void){float h = normalize(vPosition).x + 0.5;float maxh = max(h,0.0); gl_FragColor = mix(bottomColor,topColor,maxh);}";
        
        Effect.ShadersStore.radialVertexShader = sharedVextex;
        Effect.ShadersStore.radialPixelShader = sharedVar + "void main(void){float h = normalize(vPosition).z - 0.5;float maxh = max(2.0*h,0.0); gl_FragColor = mix(bottomColor,topColor,maxh);}";
    }
    
    setSkyGradient(gradient: 'vertical' | 'horizontal' | 'radial') {
        this.gradient = gradient;

        if (this.sky) this.sky.dispose();
        this.sky = new ShaderMaterial("gradient", this.system.scene, gradient, {});
        this.sky.backFaceCulling = false;
        
        if (this.colorStart) this.setBackStart(this.colorStart);
        if (this.colorEnd) this.setBackStop(this.colorEnd);

        this.skyBox.material = this.sky;
        this.skyBox.material.needDepthPrePass = true;
    }

    setBackStart(color: Array < number > ) {
        this.colorStart = color;
        if (this.sky) {
            this.sky.unfreeze();
            this.sky.setColor4("topColor", Color4.FromInts(color[0], color[1], color[2], color[3] * 255));
            this.sky.freeze();
        }
    }

    setBackStop(color: Array < number > ) {
        this.colorEnd = color;
        if (this.sky) {
            this.sky.unfreeze();
            this.sky.setColor4("bottomColor", Color4.FromInts(color[0], color[1], color[2], color[3] * 255));
            this.sky.freeze();
        }
    }
}