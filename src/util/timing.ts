export interface ICompensateInterval {
    stop: () => void;
}

export function compensateInterval(func: () => void, interval: number, runAtStart = true): ICompensateInterval {
    let previousTime = Date.now();
    let stopped = false;

    function timeout() {
        if(!stopped) {
            func();
            previousTime += interval;
            setTimeout(timeout, previousTime - Date.now());
        }
    }

    if(runAtStart) {
        timeout();
    }else {
        setTimeout(timeout, interval);
    }

    return { stop: () => stopped = true };
}

export class TimeMeasurement {
    startTime: number;
    endTime: number = null;

    constructor(start = true) {
        if(start) {
            this.start();
        }
    }

    start(): void {
        this.startTime = Date.now();
    }

    stop(): void {
        this.endTime = Date.now();
    }

    difference(): number {
        return this.endTime - this.startTime;
    }
}
