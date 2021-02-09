/**
 * An observer which will be call at a specific event
 */

export interface Observer<U> {
    funct: (eventData) => void,
    event: U,
    scope?: any,
}

/**
 * Class inpired by BabylonJS observable but more simple for our needs
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/observable.ts
 */

export class NakerObservable<U, T> {

    observers = new Array<Observer<U>>();

    observableName: string;
    constructor(observableName: string) {
        this.observableName = observableName;
    }

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     * Do not use anonymous function or you won't be able to remove it
     */
    on(event: U, funct: (eventData: T) => void, scope?: any, first?: boolean) {
        if (this.hasObserver(event, funct)) return;
        let newObserver = {
            funct: funct,
            event: event,
            scope: scope,
        }

        if (first) {
            this.observers.unshift(newObserver);
        } else {
            this.observers.push(newObserver);
        }
    }

    once(event: U, funct: (eventData: T) => void, scope?: any) {
        let execFunc = (eventData) => {
            this.off(event, execFunc);
            funct(eventData);
        };
        this.on(event, execFunc, scope);
    }

    off(event: U, funct: (eventData: T) => void): boolean {
        for (var obs of this.observers) {
            if (obs.event === event && obs.funct === funct) {
                var index = this.observers.indexOf(obs);
                if (index !== -1) {
                    //* setTimeout need as we loop on oberver object
                    setTimeout(() => {
                        this.observers.splice(index, 1);
                    }, 0);
                    return true;
                }
            }
        }
        return false;
    }

    inTheMiddleOfEventCallback: Array<U> = [];
    notify(event: U, eventData: T) {
        if (this.inTheMiddleOfEventCallback.indexOf(event) == -1) {
            this.inTheMiddleOfEventCallback.push(event);
            for (var obs of this.observers) {
                if (obs.event === event) {
                    this.notifyOberver(obs, eventData);
                }
            }
            let index = this.inTheMiddleOfEventCallback.indexOf(event);
            this.inTheMiddleOfEventCallback.splice(index, 1);
        } else {
            //infinite loop avoided! report the scenario somehow
            console.error('Infinite callback loop in observable: ' + this.observableName + ', Event: ' + event, eventData);
        }
    }

    notifyAll(eventData: T) {
        // Use null to avoid error message in loop test
        if (this.inTheMiddleOfEventCallback.indexOf(null) == -1) {
            this.inTheMiddleOfEventCallback.push(null);
            for (var obs of this.observers) {
                this.notifyOberver(obs, eventData);
            }
            let index = this.inTheMiddleOfEventCallback.indexOf(null);
            this.inTheMiddleOfEventCallback.splice(index, 1);
        } else {
            //infinite loop avoided! report the scenario somehow
            console.error('Infinite callback loop in observable: ' + this.observableName + ', Event All', eventData);
        }
    }

    notifyOberver(observer: Observer<U>, eventData: T) {
        if (observer.scope) {
            observer.funct.apply(observer.scope, [eventData]);
        } else {
            observer.funct(eventData);
        }
    }

    hasObserver(event: U, funct: (eventData: T) => void) {
        for (var obs of this.observers) {
            if (obs.funct === funct && obs.event === event) return true;
        }
        return false;
    }

    hasEventObservers(event: U): boolean {
        for (var obs of this.observers) {
            if (obs.event === event) return true;
        }
        return false;
    }

    hasObservers(): boolean {
        return this.observers.length > 0;
    }

    /**
    * Clear the list of observers
    */
    clear(): void {
        this.observers = new Array<Observer<U>>();
    }

}
