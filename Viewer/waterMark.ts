import { el, mount, unmount, setStyle, setAttr } from 'redom';
import { svgStringToDom } from '../Tools/svgImport';
import icosphere from '../Asset/icosphere.html';

export class WaterMark {

    parent: HTMLElement;
    container: HTMLElement;
    height = 30;

    containerStyle = { 
        height: this.height + 'px',
        width: '200px',
        bottom: '5px',
        right: '5px',
        position: 'absolute',
        opacity: '0',
        'z-index': 1000,
        transition: 'all ease 200ms',
    };

    constructor(parent: HTMLElement) {
        this.parent = parent;
        this.container = el('div', { style: this.containerStyle });  
        this.setMenuEvent();
    }

    setMenuEvent() {
        this.parent.addEventListener('mousemove', () => {
            this.fadeIn();
        });

        // Show menu on mobile only if user tapped
        let moved = false;
        this.parent.addEventListener("touchmove", (evt) => {
            moved = true;
        });

        let lasttap = new Date().getTime();
        this.parent.addEventListener("touchend", (evt) => {
            let newtap = new Date().getTime();
            let time = newtap - lasttap;
            if (!moved) {
                if (this.visible && time > 500) this.fadeOut();
                else this.fadeIn();
            }
            lasttap = newtap;
            moved = false;
        });
    }

    show() {
        mount(this.parent, this.container);
    }

    hide() {
        unmount(this.parent, this.container);
    }

    fadeTimeout: any;
    visible = false;
    // Do not use system animation here because it will reset the quality of the scene
    fadeIn() {
        this.show();
        if (this.visible) return;
        this.visible = true;
        setStyle(this.container, { opacity: 1 });

        if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
        this.fadeTimeout = setTimeout(() => {
            this.fadeOut();
        }, 5000);
    }

    fadeOut() {
        this.visible = false;
        setStyle(this.container, { opacity: 0 });
    }

    buttonStyle = {
        position: 'relative',
        display: 'inline-block',
        float: 'right',
        padding: '5px',
        background: 'rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        // - 10 because of the padding
        height: (this.height - 10) + 'px',
        width: (this.height - 10) + 'px',
        'box-sizing': 'unset',
        'webkit-box-sizing': 'unset',
        'border-radius': '5px',
        transition: 'all ease 100ms',
    };

    addButton(icon: string, clickCallback: Function, hoverCallback?: Function): HTMLElement {
        let button = el('div', {
            style: this.buttonStyle,
            onclick: () => { if (clickCallback) clickCallback(); },
            onmouseenter: () => { this.iconHovered(button); if (hoverCallback) hoverCallback(); },
            onmouseleave: () => { this.iconNotHovered(button); if (hoverCallback) hoverCallback(); }
        });
        svgStringToDom(button, icon);
        this.addImportantCss(button, this.buttonStyle);
        mount(this.container, button);
        return button;
    }

    iconHovered(icon: HTMLElement) {
        let rgba = 'rgba(0, 0, 0, 0.6)';
        setStyle(icon, { background: rgba });
    }

    iconNotHovered(icon: HTMLElement) {
        let rgba = 'rgba(0, 0, 0, 0.3)';
        setStyle(icon, { background: rgba });
    }

    // iconStyle = {
    //     position: 'relative',
    //     display: 'inline-block',
    //     float: 'right',
    //     padding: '3px',
    //     cursor: 'pointer',
    //     height: '24px',
    //     width: '24px',
    //     'border-radius': '5px',
    //     'box-sizing': 'unset',
    //     'webkit-box-sizing': 'unset',
    // };
    
    // madeWithStyle = {
    //     position: 'absolute',
    //     padding: '5px',
    //     left: '5px',
    //     cursor: 'pointer',
    //     height: '20px',
    //     width: '0px',
    //     color: '#6633ff',
    //     opacity: '0',
    //     transition: 'all ease 100ms',
    //     'line-height': '20px',
    //     'font-size': '15px',
    //     'vertical-align': 'middle',
    //     'box-sizing': 'unset',
    //     'webkit-box-sizing': 'unset',
    //     'font-family': 'Roboto, sans-serif',
    //     'z-index': '10000000000000000000',
    //     'text-overflow': 'ellipsis',
    //     'overflow': 'hidden',
    // };

    waterMarkButton: HTMLElement;
    // icosphere: HTMLElement;
    // div: HTMLElement;
    addWaterMark() {
        this.waterMarkButton = this.addButton(icosphere, () => { window.open('https://naker.io?href=watermark', '_blank') });
        setStyle(this.waterMarkButton, { 'margin-left': '10px' });

        // this.waterMark = el('div', {
        //         style: this.buttonStyle,
        //         onclick: () => { window.open('https://naker.io?href=watermark', '_blank') },
        //         // onmouseleave: () => { this.watermarkNotHovered(); },
        //         // onmouseenter: () => { this.watermarkHovered(); },
        //     },
        //     [
        //         this.icosphere = el('div', {
        //             style: this.iconStyle,
        //         }),
        //         this.div = el('div', 'Made with Naker', {
        //             style: this.madeWithStyle,
        //         }),
        //     ]
        // );
        // mount(this.container, this.waterMark);
    }

    addImportantCss(element: HTMLElement, styles) {
        for (const key in styles) {
            const style = styles[key];
            element.style.setProperty(key, style, 'important');
        }
    }

    hideWaterMark() {
        if (this.waterMarkButton) setStyle(this.waterMarkButton, { display: 'none' });
    }

    showWaterMark() {
        if (this.waterMarkButton) setStyle(this.waterMarkButton, { display: 'block' });
    }

    // timeout;
    // watermarkHovered() {
    //     setStyle(this.waterMark, { width: '170px' });
    //     if (this.timeout) clearTimeout(this.timeout);
    //     this.timeout = setTimeout(() => {
    //         setStyle(this.div, { width: '150px' });
    //         setStyle(this.div, { opacity: '1' });
    //     }, 100);
    // }

    // watermarkNotHovered() {
    //     setStyle(this.div, { opacity: '0' });
    //     if (this.timeout) clearTimeout(this.timeout);
    //     this.timeout = setTimeout(() => {
    //         setStyle(this.div, { width: '0px' });
    //         setStyle(this.waterMark, { width: '30px' });
    //     }, 100);
    // }
}