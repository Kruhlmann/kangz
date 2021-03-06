class WorkerEventInterface {
    constructor(target) {
        this.eventListeners = new Map();
        target.onmessage = (ev) => {
            const eventListenersForEvent = this.eventListeners.get(ev.data.event) || [];
            for (let listener of eventListenersForEvent) {
                listener(ev.data.data);
            }
        };
    }
    addEventListener(event, listener) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).push(listener);
        }
        else {
            this.eventListeners.set(event, [listener]);
        }
    }
    removeEventListener(event, listenerToRemove) {
        if (this.eventListeners.has(event)) {
            let eventListenersForEvent = this.eventListeners.get(event);
            if (eventListenersForEvent) {
                this.eventListeners.set(event, eventListenersForEvent.filter((listener) => {
                    return listener !== listenerToRemove;
                }));
            }
        }
    }
    removeEventListenersForEvent(event) {
        this.eventListeners.delete(event);
    }
    send(event, data, target = self) {
        target.postMessage({
            event: event,
            data: data
        });
    }
}
export class WorkerInterface extends WorkerEventInterface {
    constructor(url) {
        const worker = new Worker(url);
        super(worker);
        this.worker = worker;
    }
    send(event, data) {
        super.send(event, data, this.worker);
    }
    terminate() {
        this.worker.terminate();
    }
}
export class MainThreadInterface extends WorkerEventInterface {
    constructor() {
        super(self);
    }
    static get instance() {
        if (!MainThreadInterface._instance) {
            MainThreadInterface._instance = new MainThreadInterface();
        }
        return MainThreadInterface._instance;
    }
}
//# sourceMappingURL=worker_event_interface.js.map