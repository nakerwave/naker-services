import { System } from '../System/system';

import { el, mount, unmount, setStyle, setAttr } from 'redom';
import icosphere from '../Asset/icosphere.svg';

export interface ProjectInterface extends ViewerOption {
    canvas?: HTMLCanvasElement,
    // engine: 'story' | 'form' | 'back',
    name?: string,
    assets?: Array<any>,
    palette?: Array<any>,
}

export interface ViewerOption {
    container?: HTMLElement,
    canvas?: HTMLCanvasElement,
    waterMark?: boolean,
    pushQuality?: boolean,
    website?: string,
    listenEvent?: boolean,
}

export let quotereplacement = '|';

export let removeQuote = (optionString: string): string => {
    let optionArray = optionString.split('"');
    return optionArray.join(quotereplacement);
}

export let addQuote = (optionString: string): string => {
    let optionArray = optionString.split(quotereplacement);
    return optionArray.join('"');
}

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
    constructor(viewerOption: ViewerOption) {
        // Keep that variable def
        if (viewerOption.container) this.buildCanvas(viewerOption);
    }

    buildCanvas(viewerOption: ViewerOption) {
        this.container = viewerOption.container;
        if (!this.container) throw 'Naker : Missing container';
        if (this.container.tagName == 'HEAD') throw 'Naker : container container can not be head tag';

        // let browser = this.getBrowser();
        //   let canvasposition = (browser == 'Safari') ? '-webkit-sticky' : 'sticky';
        // overflow hidden can break some website
        // setStyle(this.container, { 'overflow-x': 'hidden', '-webkit-tap-highlight-color': 'transparent', 'background-color': 'rgba(0,0,0,0)' });
        setStyle(this.container, { '-webkit-tap-highlight-color': 'transparent' });
        for (let i = 0; i < this.container.childNodes.length; i++) {
            const child = this.container.childNodes[i];
            if (this.checkElWithStyle(child)) {
                // Some node can't change style
                try { setStyle(child, { 'z-index': '1' }); }
                catch (e) { }
            }
        }

        this.canvas = el('canvas', { style: { top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden', 'overflow-x': 'hidden', outline: 'none', 'touch-action': 'none' }, oncontextmenu: "javascript:return false;" });
        let canvasposition = 'absolute';
        if (this.container == document.body) canvasposition = 'fixed';
        setStyle(this.canvas, { position: canvasposition });
        // if (this.container == document.body) setStyle(this.container, {	'overflow-y': 'auto' });
        // Problem with scroll and touch action with android, discussion here:
        // https://forum.babylonjs.com/t/scroll-issues-with-touch-action/2135
        // 'touch-action': 'none' Keep it to avoid refresh on android phones
        // -webkit-tap to avoid touch effect on iphone

        // Add cool WaterMark in all naker Projects
        setAttr(this.canvas, { 'data-who': 'Made with naker.io' });
        mount(this.container, this.canvas);

        this.checkContainerPosition();
        this._checkViewport();

        this.addWaterMark();
        if (viewerOption && viewerOption.waterMark === false) this.removeWaterMark();
        if (viewerOption && viewerOption.listenEvent === false) this.setNoEvent();
    }

    checkElWithStyle(el: HTMLElement) {
        return (el.style && !el.style.zIndex) && (el.tagName && el.tagName != 'SCRIPT')
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
        setStyle(this.canvas, { 'pointer-events': 'none' });
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
        width: '0px',
        color: '#6633ff',
        opacity: '0',
        transition: 'all ease 100ms',
        'line-height': '20px',
        'font-size': '15px',
        'vertical-align': 'middle',
        'box-sizing': 'unset',
        'webkit-box-sizing': 'unset',
        'font-family': 'Roboto, sans-serif',
        'z-index': '10000000000000000000',
        'text-overflow': 'ellipsis',
        'overflow': 'hidden',
    };
    
    containerStyle = {
        position: 'absolute',
        bottom: '5px', 
        right: '5px', 
        height: '30px', 
        width: '30px', 
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.7)',
        transition: 'all ease 100ms',
        'border-radius': '5px',
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
        this.addImportantCss();

        mount(this.container, this.waterMark);

        this.icosphere.innerHTML = icosphere;
        let icosphereHTML = this.icosphere.childNodes[0];
        setAttr(icosphereHTML, { width: '24px', height: '24px' });
        setStyle(this.icosphere, { 'margin-left': '5px' });
    }

    addImportantCss() {
        if (this.icosphere.style && this.icosphere.style.setProperty) {
            for (const key in this.iconStyle) {
                this.icosphere.style.setProperty(key, this.iconStyle[key], 'important');
            }
            for (const key in this.divStyle) {
                this.div.style.setProperty(key, this.divStyle[key], 'important');
            }
            for (const key in this.containerStyle) {
                this.waterMark.style.setProperty(key, this.containerStyle[key], 'important');
            }
        }
    }

    removeWaterMark() {
        if (this.waterMark) unmount(this.container, this.waterMark);
    }

    timeout;
    iconHovered() {
        setStyle(this.waterMark, { width: '170px' });
        setStyle(this.div, { width: '170px' });
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            setStyle(this.div, { opacity: '1' });
        }, 100);
    }

    iconNotHovered() {
        setStyle(this.div, { opacity: '0' });
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            setStyle(this.div, { width: '0px' });
            setStyle(this.waterMark, { width: '30px' });
        }, 100);
    }
}

export let currentScript: HTMLScriptElement;
export let getCurrentScript = () => {
    currentScript = document.currentScript;
    if (!currentScript) {
        (function () {
            var scripts = document.getElementsByTagName('script');
            currentScript = scripts[scripts.length - 1];
        })();
    }
}
getCurrentScript();

export let checkScript = (callback: Function) => {
    if (!currentScript) return;

    var projectString = currentScript.dataset.option;
    if (projectString) {
        let projectJson = addQuote(projectString);
        let projectOption: ProjectInterface;
        try {
            projectOption = JSON.parse(projectJson);
        } catch {
            return console.error('Naker: Bad Json');
        }
        callback(projectOption);
    }
}

export let checkContainer = (callback: Function) => {
    if (!currentScript) return;

    let containerSelector = currentScript.dataset.container;
    if (containerSelector) {
        let container = getContainer(containerSelector);
        if (container) { // If container already there then go
            callback(container);
        } else { // Otherwise wait for the page to load
            window.addEventListener('load', () => {
                let container = getContainer(containerSelector);
                if (container) {
                    callback(container);
                } else { // If still no container, launch loop to check if it appears later
                    let intervalCheck = setInterval(() => {
                        let container = getContainer(containerSelector);
                        if (container) {
                            clearInterval(intervalCheck);
                            callback(container);
                        }
                    }, 100);
                    console.error('Naker: Bad selector, not able to find your container after page load');
                }
            });
        }
    } else { // If no container in data, check for the parent
        callback(currentScript.parentNode);
    }
}

let getContainer = (selector: string) => {
    let container = document.getElementById(selector);
    if (!container) container = document.querySelector(selector);
    return container;
}
