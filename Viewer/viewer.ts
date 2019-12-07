import { System } from '../System/system';

import { el, mount, unmount, setStyle, setAttr } from 'redom';
import icosphere from '../Asset/icosphere.svg';

export interface ProjectInterface {
    container?: HTMLElement,
    // engine: 'story' | 'form' | 'back',
    name?: string,
    assets?: Array<any>,
    palette?: Array<any>,
    waterMark?: boolean,
}

export interface ViewerOption {
    waterMark?: boolean,
}

export let quotereplacement = 'nqt';

export let removeQuote = (optionString) => {
    let optionArray = optionString.split('"');
    return optionArray.join(quotereplacement);
}

export let addQuote = (optionString) => {
    let optionArray = optionString.split(quotereplacement);
    return optionArray.join('"');
}

export class NakerViewer {

    /**
     * Element where the 3D Scene will be drawn
     */
    container: HTMLElement;
    system: System;
    // engine: 'story' | 'form' | 'back';

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

    /**
     * Creates a new System
     * @param container Element where the scene will be drawn
     * @param offscreen if false, the viewer won't use offscreen canvas
     */
    constructor(containerEL: HTMLElement, viewerOption?: ViewerOption) {
        // Keep that variable def
        this.container = containerEL;
        // this.engine = project.engine;
        this.addWaterMark();
        if (viewerOption && viewerOption.waterMark === false) this.removeWaterMark();

        // let browser = this.getBrowser();
        //   let canvasposition = (browser == 'Safari') ? '-webkit-sticky' : 'sticky';
        setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent' });
        
        this.canvas = el('canvas', { style: { top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden !important', 'overflow-x': 'hidden !important', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        let canvasposition = 'absolute';
        if (this.container == document.body) canvasposition = 'fixed';
        setStyle(this.canvas, { position: canvasposition });
        // if (this.container == document.body) setStyle(this.container, {	'overflow-y': 'auto' });
        // Problem with scroll and touch action with android, discussion here:
        // https://forum.babylonjs.com/t/scroll-issues-with-touch-action/2135
        // 'touch-action': 'none' Keep it to avoid refresh on android phones
        // -webkit-tap to avoid touch effect on iphone
       
       
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

    setNoEvent() {
        setStyle(this.canvas, { 'pointer-events': 'none', 'z-index': '-1' });
    }

    iconStyle = {
        position: 'relative',
        display: 'inline-block',
        float: 'right',
        padding: '3px',
        cursor: 'pointer',
        height: '24px',
        width: '24px',
        'border-radius': '5px',
        'box-sizing': 'unset',
        'webkit-box-sizing': 'unset',
    };
    
    divStyle = {
        position: 'absolute',
        padding: '5px',
        left: '5px',
        cursor: 'pointer',
        height: '20px',
        width: '125px',
        'line-height': '20px',
        'font- size': '15px',
        'vertical-align': 'middle',
        'box-sizing': 'unset',
        'webkit-box-sizing': 'unset',
        'font-family': 'Roboto, sans-serif',
        color: '#6633ff',
        opacity: 0,
        transition: 'all ease 100ms',
    };
    
    containerStyle = {
        position: 'absolute',
        bottom: '5px', 
        right: '5px', 
        height: '30px', 
        width: '30px', 
        cursor: 'pointer',
        'border-radius': '5px',
        background: 'rgba(255, 255, 255, 0.7)',
        transition: 'all ease 100ms',
    };

    waterMark: HTMLElement;
    icosphere: HTMLElement;
    div: HTMLElement;
    addWaterMark() {
        if (this.waterMark) return mount(this.container, this.waterMark);

        this.waterMark = el('div', {
                style: this.containerStyle,
                onclick: () => { window.open('https://naker.io?href=watermark', '_blank') },
                onmouseleave: () => { this.iconNotHovered(); },
                onmouseenter: () => { this.iconHovered(); },
            },
            [
                this.icosphere = el('div', {
                    style: this.iconStyle,
                }),
                this.div = el('div', 'Made with Naker', {
                    style: this.divStyle,
                }),
            ]
        );
        mount(this.container, this.waterMark);

        this.icosphere.innerHTML = icosphere;
        let icosphereHTML = this.icosphere.childNodes[0];
        setAttr(icosphereHTML, { width: '24px', height: '24px' });
        setStyle(this.icosphere, { 'margin-left': '5px' });
    }

    removeWaterMark() {
        if (this.waterMark) unmount(this.container, this.waterMark);
    }

    iconHovered() {
        setStyle(this.waterMark, { width: '170px' });
        setTimeout(() => {
            setStyle(this.div, { opacity: '1' });
        }, 100);
    }

    iconNotHovered() {
        setStyle(this.waterMark, { width: '30px' });
        setStyle(this.div, { opacity: '0' });
    }
}
