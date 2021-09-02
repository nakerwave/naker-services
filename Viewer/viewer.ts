import { el, mount, setStyle, setAttr } from 'redom';
import { checkElementVisible } from '../Tools/util';

export interface ViewerOption {
    id?: string,
    version?: string,
    container?: HTMLElement,
    canvas?: HTMLCanvasElement,
    waterMark?: boolean,
    pushQuality?: boolean,
    fullScreen?: boolean,
    website?: string,
    listenEvent?: boolean,
}

export interface ProjectInterface extends ViewerOption {
    canvas?: HTMLCanvasElement,
    // engine: 'story' | 'form' | 'back',
    name?: string,
    assets?: Array<any>,
    palette?: Array<any>,
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
     * Main container
     */
    container: HTMLElement;

    /**
     * Element where the 3D Scene will be drawn
     */
    sceneContainer: HTMLElement;

    /**
     * Canvas used to draw the 3D scene
     */
    canvas: HTMLCanvasElement;

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

        this.sceneContainer = el('div', {
            class: 'naker-scene-container',
            style: { top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden', 'overflow-x': 'hidden' }, oncontextmenu: "javascript:return false;"
        });
        mount(this.container, this.sceneContainer);
        this.canvas = el('canvas', {
            class: 'naker-canvas',
            style: { top: '0px', left: '0px', width: '100%', height: '100%', 'overflow-y': 'hidden', 'overflow-x': 'hidden', outline: 'none', 'touch-action': 'none' }
        });
        let canvasposition = 'absolute';
        if (this.container == document.body) canvasposition = 'fixed';
        setStyle(this.canvas, { position: canvasposition });
        // if (this.container == document.body) setStyle(this.container, {	'overflow-y': 'auto' });
        // Problem with scroll and touch action with android, discussion here:
        // https://forum.babylonjs.com/t/scroll-issues-with-touch-action/2135
        // 'touch-action': 'none' Keep it to avoid refresh on android phones
        // -webkit-tap to avoid touch effect on iphone

        setAttr(this.canvas, { 'data-who': 'Made with naker.io' });
        mount(this.sceneContainer, this.canvas);

        this.checkContainerPosition();
        this._checkViewport();
        if (viewerOption && viewerOption.listenEvent === false) this.setNoEvent();
    }

    checkIfVisible = false;
    waitElementToBeVisible(callback: Function) {
        this.checkIfVisible = true;
        this.checkContainerVisible(callback);
        window.addEventListener("scroll", () => {
            this.checkContainerVisible(callback);
        });

    }

    checkContainerVisible(callback: Function) {
        if (!this.checkIfVisible) return;
        let containerVisible = checkElementVisible(this.canvas, 500);
        if (containerVisible) {
            callback();
            this.checkIfVisible = false;
        }
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
    if (!projectString) {
        projectString = currentScript.getAttribute('data-option');
    }

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
