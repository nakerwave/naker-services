import { System } from '../System/system';

import { el, mount, setStyle, setAttr } from 'redom';

export class NakerViewer {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;
    system: System;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     * @param offscreen if false, the viewer won't use offscreen canvas
     */
    constructor(containerEL: HTMLElement) {
        // Keep that variable def
        this.container = containerEL;
        // -webkit-tap to avoid touch effect on iphone
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });

        //  'z-index': -1 not mandatory
        this.canvas = el('canvas', { style: { position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        // Add cool WaterMark in all naker Projects
        setAttr(this.canvas, { 'data-who': '💎 Made with naker.io 💎' });
        mount(this.container, this.canvas);

        this.checkContainerPosition();
        this._checkViewport();
    }

    /**
     * Window viewport can be problematic for scale rendering, we check if one is present
     * @ignore
     */
    _checkViewport() {
        // In order to have good scale and text size, we need to check for the viewport meta in header
        // This makes the scene a bit blurry on iphones, need to find a solution
        let viewport = document.querySelector("meta[name=viewport]");
        if (!viewport) {
            let viewporttoadd = el('meta', { content: "width=device-width, initial-scale=1", name: "viewport" });
            mount(document.getElementsByTagName('head')[0], viewporttoadd);
        }
        // Should check for the viewport and adapt to it.
        // else {
        //   let content = viewport.getAttribute("content");
        //   if (content) {
        //     let scalecheck = content.indexOf('initial-scale');
        //     if (scalecheck == -1) this.ratio = window.devicePixelRatio;
        //   }
        // }
    }

    /**
    * Make sure there is a position on container
    * @ignore
    */
    checkContainerPosition() {
        // Due to a lot of user feedback having trouble when no position on parent
        // .style returns only inline values (not useful)
        // let containerStyle = this.container.style;
        // getComputedStyle return all values so can be used to check if position already setted
        let containerStyle = window.getComputedStyle(this.container);
        // Best way found to determine if there is already a position or not
        // Seems like static is the default value (tested in edge, chrome and firefox)
        if (containerStyle.position == 'static') {
            // We set to relative because this is the default behavior
            setStyle(this.container, { position: 'relative' });
        }
    }
}
