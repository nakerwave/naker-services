/**
 * Specifies all the events possible
 */

export enum EventsName {
    Progress,
    Start,
    Stop,
    Begin,
    End,
    Resize,
    MouseWheel,
}

export interface Observer {
    funct: (eventData) => void,
    eventName: EventsName,
    scope?: any,
}

/**
 * Class inpired by BabylonJS observable but more simple for our needs
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/observable.ts
 */

export class NakerObservable<T> {

    observers: Array<Observer> = new Array<Observer>();

    addListener(funct: (eventData: T) => void, scope?:any, first?: boolean) {
        this.on(EventsName.Progress, funct, scope, first);
    }

    removeListener(funct: (eventData: T) => void): boolean {
        return this.off(EventsName.Progress, funct);
    }

    sendToListener(eventData: T) {
        this.notify(EventsName.Progress, eventData);
    }

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     * Do not use anonymous function or you won't be able to remove it
     */
    on(eventName: EventsName, funct: (eventData: T) => void, scope?: any, first?: boolean) {
        if (this.hasObserver(eventName, funct)) return;
        let newObserver = {
            funct: funct,
            eventName: eventName,
            scope: scope,
        }

        if (first) {
            this.observers.unshift(newObserver);
        } else {
            this.observers.push(newObserver);
        }
    }

    off(eventName: EventsName, funct: (eventData: T) => void): boolean {
        for (var obs of this.observers) {
            if (obs.eventName === eventName && obs.funct === funct) {
                var index = this.observers.indexOf(obs);
                if (index !== -1) {
                    this.observers.splice(index, 1);
                    return true;
                }
            }
        }
        return false;
    }

    notify(eventName: EventsName, eventData: T) {
        for (var obs of this.observers) {
            if (obs.eventName === eventName) {
                this.notifyOberver(obs, eventData);
            }
        }
    }

    notifyAll(eventData: T) {
        for (var obs of this.observers) {
            this.notifyOberver(obs, eventData);
        }
    }

    notifyOberver(observer: Observer, eventData: T) {
        if (observer.scope) {
            observer.funct.apply(observer.scope, [eventData]);
        } else {
            observer.funct(eventData);
        }
    }

    hasObserver(eventName: EventsName, funct: (eventData: T) => void) {
        for (var obs of this.observers) {
            if (obs.funct === funct && obs.eventName === eventName) return true;
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
        this.observers = new Array<Observer>();
    }

}
