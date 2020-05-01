import remove from 'lodash/remove';

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
}

/**
 * Class inpired by BabylonJS observable but more simple for our needs
 * https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/observable.ts
 */

export class NakerObservable<T> {

    observers: Array<Observer> = new Array<Observer>();

    addListener(funct: (eventData: T) => void, first?: boolean) {
        this.on(EventsName.Progress, funct, first);
    }

    removeListener(funct: (eventData: T) => void) {
        this.off(EventsName.Progress, funct);
    }

    sendToListener(eventData: T) {
        this.notify(EventsName.Progress, eventData);
    }

    /**
     * Allow to add a listener on special events
     * @param what the event: start or stop and mouseWheel for now
     * @param funct the function to be called at the event
     */
    on(eventName: EventsName, funct: (eventData: T) => void, first?: boolean) {
        if (this.hasObserver(eventName, funct)) return;
        let newObserver = {
            funct: funct,
            eventName: eventName
        }

        if (first) {
            this.observers.unshift(newObserver);
        } else {
            this.observers.push(newObserver);
        }
    }

    off(eventName: EventsName, funct: (eventData: T) => void) {
        remove(this.observers, (obs) => { return obs.funct == funct && obs.eventName == eventName });
    }

    notify(eventName: EventsName, eventData: T) {
        for (var obs of this.observers) {
            // console.log(obs.eventName, eventName, obs.eventName && eventName && obs.eventName === eventName);
            
            if (obs.eventName === eventName) {
                obs.funct(eventData);
            }
        }
    }

    notifyAll(eventData: T) {
        for (var obs of this.observers) {
            obs.funct(eventData);
        }
    }

    hasObserver(eventName: EventsName, funct: (eventData: T) => void) {
        for (var obs of this.observers) {
            if (obs.funct == funct && obs.eventName == eventName) return true;
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
