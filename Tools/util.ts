export function checkElementVisible(element: HTMLElement, margin?: number): boolean {
    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    // is canvas on screen depending on scroll
    if (!margin) margin = 0;
    let onScreen = !(rect.bottom < -margin || rect.top - viewHeight >= margin);
    // is parent display or not
    let parentDisplayed = !!element.offsetParent;
    let containerVisible = (onScreen && parentDisplayed);
    return containerVisible;
}