import { BaseTask } from '../BaseTask';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '../../util/request';
import { StepConstructor, StepIndex } from '../StepManager';

export interface IStepResults {
    [x: string]: any;
}

export abstract class Step {
    constructor(
        protected task: BaseTask,
        private stepIndex: StepIndex,
        protected results: any,
    ) {}

    protected log(string: string) {
        this.task.log(string);
    }

    protected async makeRequest(method: RequestMethod, url: string, options: IRequestOptions = {}): Promise<IResponse> {
        try {
            if(options.proxy === undefined) {
                options.proxy = this.task.mainProxy;
            }
            return await makeRequest(method, url, options);
        }catch(error) {
            if(this.task.bot.isUsingDeveloperMode) {
                console.error(error);
            }

            throw error;
        }
    }

    abstract getReference(): StepConstructor;
    abstract run(): void;
}
