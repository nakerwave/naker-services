import { el, mount, unmount, setStyle, setAttr } from 'redom';
import { svgStringToDom } from '../Tools/svgImport';
let icosphere = '<svg id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800"><style>.st0{fill:#7cfcf0}.st1{fill:#7ce8f0}.st2{fill:#767ee0}.st3{fill:#7dbeef}.st4{fill:#7df8f0}.st5{fill:#7bf0ee}.st6{fill:#78c8e7}.st7{fill:#7ec4ef}.st8{fill:#6d65d0}.st9{fill:#593ca7}.st10{fill:#7c75ec}.st11{fill:#7a8ee8}.st12{fill:#7ccdee}.st13{fill:#656bc1}.st14{fill:#6856c4}.st15{fill:#540c9e}.st16{fill:#550ca0}.st17{fill:#44168e}.st18{fill:#441389}.st19{fill:#6a0fc7}.st20{fill:#5c0dad}.st21{fill:#440a80}.st22{fill:#450e8c}.st23{fill:#4e0b93}.st24{fill:#530c9c}.st25{fill:#440b7f}.st26{fill:#6469c0}.st27{fill:#4d1090}.st28{fill:#7df0f0}</style><path class="st0" d="M214.1 141.7 202.4 54.4 45.2 229.1z"/><path class="st1" d="M383 19.4 214.1 141.7 202.4 54.4z"/><path class="st2" d="M487.8 141.7 383 19.4 598.5 71.9z"/><path class="st3" d="M214.1 141.7H487.8L383 19.4z"/><path class="st4" d="M97.6 339.7 45.2 229.1 214.1 141.7z"/><path class="st5" d="M21.9 479.5 97.6 339.7 45.2 229.1z"/><path class="st6" d="M167.5 572.7 97.6 339.7 21.9 479.5z"/><path class="st7" d="M487.8 141.7 307.3 357.2 214.1 141.7z"/><path class="st8" d="M709.1 269.9 487.8 141.7 598.5 71.9z"/><path class="st9" d="M738.2 217.4 709.1 269.9 598.5 71.9z"/><path class="st10" d="M563.5 374.7 709.1 269.9 487.8 141.7z"/><path class="st11" d="M307.3 357.2l256.2 17.5L487.8 141.7z"/><path class="st12" d="M167.5 572.7 307.3 357.2 97.6 339.7z"/><path class="st13" d="M447 601.8 307.3 357.2 167.5 572.7z"/><path class="st14" d="M563.5 374.7 447 601.8 307.3 357.2z"/><path class="st15" d="M779 427.1 709.1 269.9 738.2 217.4z"/><path class="st16" d="M685.8 537.8 779 427.1 709.1 269.9z"/><path class="st17" d="M563.5 374.7 685.8 537.8 709.1 269.9z"/><path class="st18" d="M447 601.8 685.8 537.8 563.5 374.7z"/><path class="st19" d="M703.3 630.9 685.8 537.8 779 427.1z"/><path class="st20" d="M540.2 735.8 685.8 537.8 703.3 630.9z"/><path class="st21" d="M447 601.8 540.2 735.8 685.8 537.8z"/><path class="st22" d="M313.1 735.8 447 601.8 540.2 735.8z"/><path class="st23" d="M359.7 782.4 540.2 735.8H313.1z"/><path class="st24" d="M144.2 695 313.1 735.8 359.7 782.4z"/><path class="st25" d="M167.5 572.7 313.1 735.8 447 601.8z"/><path class="st26" d="M21.9 479.5 144.2 695 167.5 572.7z"/><path class="st27" d="M313.1 735.8 144.2 695 167.5 572.7z"/><path class="st28" d="M307.3 357.2 97.6 339.7l116.5-198z"/></svg>'

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