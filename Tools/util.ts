export function checkElementVisible(element: HTMLElement, margin?: number): boolean {
    if (element == document.body) return true;
    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    // is canvas on screen depending on scroll
    if (!margin) margin = 0;
    let onScreen = !(rect.bottom <= -margin || rect.top - viewHeight >= margin);
    // is parent display or not
    let parentDisplayed = true;
    if (element.offsetParent) {
        parentDisplayed = !!element.offsetParent
    }
    let containerVisible = (onScreen && parentDisplayed);
    return containerVisible;
}

export let getDevice = (): 'iOS' | 'Androïd' | 'Computer' => {
    let isMobile = navigator.userAgent.toLowerCase().match(/mobile/i),
        isTablet = navigator.userAgent.toLowerCase().match(/tablet/i),
        isAndroid = navigator.userAgent.toLowerCase().match(/android/i),
        isiPhone = navigator.userAgent.toLowerCase().match(/iphone/i),
        isiPad = navigator.userAgent.toLowerCase().match(/ipad/i);
    if (isiPhone || isiPad) {
        return 'iOS'
    } else if (isMobile || isTablet || isAndroid) {
        return 'Androïd'
    } else {
        return 'Computer'
    }
}

export let getUrlWithoutExtension = (url: string): string => {
    return url.substr(0, url.lastIndexOf('.') + 1);
}