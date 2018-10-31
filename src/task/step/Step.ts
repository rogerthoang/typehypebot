import { BaseTask } from '../BaseTask';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '@util/request';
import { StepIndex, StepResult } from '../../manager/StepManager';

export interface IStepResults {
    [x: string]: any;
}

export abstract class Step<ResultType = StepResult> {
    constructor(
        protected task: BaseTask,
        private stepIndex: StepIndex,
        protected results: ResultType,
    ) {}

    protected log(string: string): void {
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

    abstract run(): void;

    nextStep(result: StepResult): void {
        this.task.stepManager.nextStep(this.stepIndex, result);
    }

    previousStep(): void {}

    reRun(): void {}
}
