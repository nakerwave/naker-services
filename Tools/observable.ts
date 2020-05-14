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

    observers: Array<Observer<U>> = new Array<Observer<U>>();

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

    off(event: U, funct: (eventData: T) => void): boolean {
        for (var obs of this.observers) {
            if (obs.event === event && obs.funct === funct) {
                var index = this.observers.indexOf(obs);
                if (index !== -1) {
                    this.observers.splice(index, 1);
                    return true;
                }
            }
        }
        return false;
    }

    notify(event: U, eventData: T) {
        for (var obs of this.observers) {
            if (obs.event === event) {
                this.notifyOberver(obs, eventData);
            }
        }
    }

    notifyAll(eventData: T) {
        for (var obs of this.observers) {
            this.notifyOberver(obs, eventData);
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
