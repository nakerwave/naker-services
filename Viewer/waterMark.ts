import { el, mount, unmount, setStyle } from 'redom';
import { svgStringToDom } from '../Tools/svgImport';
let icosphere = '<svg id="Naker-logo" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 384.7 358.6" style="enable-background:new 0 0 384.7 358.6"><style>.st0{fill:url(#SVGID_1_)}.st1{fill:#63f}.st2{fill:url(#SVGID_2_)}</style><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="86.5848" y1="243.1276" x2="383.3806" y2="179.9697" gradientTransform="matrix(1 0 0 -1 0 360)"><stop offset="0" style="stop-color:#63f"/><stop offset="1" style="stop-color:#97f6ff"/></linearGradient><path class="st0" d="M213.1 120.6 139 260.1l-38.8 1.3c-9.8-.8-15.1-9.6-10.1-19.5C95 232.5 203.6 16 203.6 16c9.9-22.5 34.7-21.2 44.3 3.5 31.3 81.3 133.9 306.9 133.9 306.9L246.6 119.3c0 0-4.2-7.4-6.1-9.6-4.7-6.9-12.8-8.7-18.9-3.2C219.6 107.7 213.4 119.9 213.1 120.6z"/><path class="st1" d="M113 260.8l157.9-4.7 20.4 33.1c4.2 8.9-.9 17.9-11.9 18.4-10.6.5-252.4 13.4-252.4 13.4C2.4 323.4-8.8 301.3 8 280.8 63 213.2 204.6 13.9 204.6 13.9L95.3 232.4c0 0-4.3 7.3-5.3 10-3.7 7.6-1.2 15.4 6.6 18C98.6 261.6 112.2 260.9 113 260.8z"/><linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="201.3283" y1="3.801" x2="226.151" y2="243.3191" gradientTransform="matrix(1 0 0 -1 0 360)"><stop offset="0" style="stop-color:#09f"/><stop offset="1" style="stop-color:#00f"/></linearGradient><path class="st2" d="M283.5 277.3l-82.9-133.2 18-34.1c5.1-8.5 16.1-9.4 22.1-.1 5.8 8.9 138 211.6 138 211.6 14.5 19.9.9 40.7-25.2 36.6-86-13.6-330.1-37-330.1-37l244.4-14.2c0 0 8.5.1 11.3-.5 8.4-.6 14-6.7 12.3-14.8C291.4 289.4 284 278 283.5 277.3z"/></svg>'

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
        background: 'rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        // - 10 because of the padding
        height: (this.height - 10) + 'px',
        width: (this.height - 10) + 'px',
        'box-sizing': 'unset',
        'webkit-box-sizing': 'unset',
        'border-radius': '5px',
        transition: 'all ease 200ms',
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
        let rgba = 'rgba(0, 0, 0, 0.3)';
        setStyle(icon, { background: rgba });
    }

    iconNotHovered(icon: HTMLElement) {
        let rgba = 'rgba(0, 0, 0, 0.1)';
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