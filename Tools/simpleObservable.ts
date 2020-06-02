import { NakerObservable } from "./observable";

export enum SimpleEvent {
    Progress,
}

export class SimpleObservable<T> extends NakerObservable<SimpleEvent, T> {

    addListener(funct: (eventData: T) => void, scope?: any, first?: boolean) {
        this.on(SimpleEvent.Progress, funct, scope, first);
    }

    removeListener(funct: (eventData: T) => void): boolean {
        return this.off(SimpleEvent.Progress, funct);
    }

    sendToListener(eventData: T) {
        this.notify(SimpleEvent.Progress, eventData);
    }

}
