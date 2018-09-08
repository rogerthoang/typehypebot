import { BaseTask } from '../BaseTask';
import { IProxy } from '@util/proxy';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '@util/request';

export interface IStepResults {
    [x: string]: any;
}

export abstract class Step {
    protected task: BaseTask;
    protected proxy: IProxy;
    protected previousStep: (previousStepClass: { new(...args: any[]): Step }) => void;
    protected nextStep: (stepResult?: any, proxy?: IProxy) => void;
    protected results: any;

    constructor(task: BaseTask, proxy: IProxy = null, previousStep: (...args: any[]) => void, nextStep: (...args: any[]) => void, resultsByClass: any) {
        this.task = task;
        this.proxy = proxy;
        this.previousStep = (previousStepClass: { new(...args: any[]): Step }): void => {
            previousStep(this.getReference(), resultsByClass, previousStepClass);
        };
        this.nextStep = (stepResult: any = {}, proxy: IProxy = null) => {
            nextStep(
                this.getReference(),
                proxy,
                resultsByClass,
                stepResult,
            );
        };
        const values: any[] = Object.values(resultsByClass);
        this.results = values.length === 0 ? {} : Object.assign({}, ...values);
    }

    protected log(string: string) {
        this.task.log(string);
    }

    protected async makeRequest(method: RequestMethod, url: string, options: IRequestOptions = {}): Promise<IResponse> {
        try {
            if(options.proxy === undefined || options.proxy === null) {
                options.proxy = this.proxy;
            }
            return await makeRequest(method, url, options);
        }catch(error) {
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
            throw error;
        }
    }

    abstract getReference(): { new(...args: any[]): Step };
    abstract run(): void;

    reRun(classReference?: { new(...args: any[]): Step }, now: boolean = false): void {
        const reRun = (): void => {
            if(classReference === undefined || classReference === null) {
                this.previousStep(this.getReference());
            }else {
                this.previousStep(classReference);
            }
        };
        if(now) {
            reRun();
        }else {
            setTimeout(() => reRun(), this.task.interval);
        }
    }
}
