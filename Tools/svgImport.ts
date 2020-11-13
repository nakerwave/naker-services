import { setAttr } from 'redom';

export let svgStringToDom = (parent: HTMLElement, svg: string) => {
    var parser = new DOMParser();
    let doc = parser.parseFromString(svg, "application/xml");
    let iconHTML = doc.documentElement;
    setAttr(iconHTML, { fill: 'white' });
    parent.appendChild(
        parent.ownerDocument.importNode(iconHTML, true)
    )
}
