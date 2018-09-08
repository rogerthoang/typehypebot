export abstract class EventListener {
    private eventListeners: {[event: string]: ((...parameters) => void)[]} = {};

    addEventListener(event: string|number, eventListener: (...parameters) => void): void {
        if(this.eventListeners[event] === undefined) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(eventListener);
    }

    callEvent(event: string|number, ...args): void {
        if(this.eventListeners[event] !== undefined) {
            for(const eventListener of this.eventListeners[event]) {
                eventListener(...args);
            }
        }
    }
}
