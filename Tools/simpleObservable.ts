import { NakerObservable } from "./observable";

export enum SimpleEvent {
    Progress,
}

export class SimpleObservable<T> extends NakerObservable<SimpleEvent, T> {

    onChange(funct: (eventData: T) => void, scope?: any, first?: boolean) {
        this.on(SimpleEvent.Progress, funct, scope, first);
    }

    offChange(funct: (eventData: T) => void): boolean {
        return this.off(SimpleEvent.Progress, funct);
    }

    notifyChange(eventData: T) {
        this.notify(SimpleEvent.Progress, eventData);
    }

}
