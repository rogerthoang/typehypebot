import { BaseTask, StepBreakpoint } from '../BaseTask';
import { IProxy } from '@util/proxy';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '@util/request';

export interface IStepResults {
    [x: string]: any;
}

export abstract class Step {
    protected results: any;

    constructor(
        protected task: BaseTask,
        protected proxy: IProxy = null,
        private resultsByStepIndex: any = {},
        private stepIndex: [number, number] = [0, 0],
        protected steps: ({ new(...args: any[]): Step } | StepBreakpoint)[] = [],
        protected stepsByBreakpoint: { [breakpoint: number]: { new(...args: any[]): Step }[] },
    ) {
        this.results = this.resultsByStepIndex.length === 0 ? {} : Object.assign({}, ...Object.values(this.resultsByStepIndex));
    }

    protected nextStep(result: { [x: string]: any }) {
        if(this.stepIndex[0] === this.steps.length - 1) {
            if(!Array.isArray(this.stepIndex[this.steps.length - 1])) {
                return;
            }
            if(this.stepIndex[1] === (<{ new(...args: any[]): Step }> this.steps[this.stepIndex[0]]).length - 1) {
                return;
            }
        }

        this.resultsByStepIndex[this.stepIndex[0]] = result;

        const step = this.steps[this.stepIndex[0] - 1];
        if(Array.isArray(step)) {
            const breakpointSteps = this.stepsByBreakpoint[<StepBreakpoint> step];

            new breakpointSteps[0](this.task, this.proxy, this.resultsByStepIndex, [this.stepIndex[0] + 1, 0], this.steps, this.stepsByBreakpoint).run();
        }else {
            new (<{ new(...args: any[]): Step }> step)(this.task, this.proxy, this.resultsByStepIndex, [this.stepIndex[0] + 1, 0], this.steps, this.stepsByBreakpoint).run();
        }
    }

    protected previousStep(previousStep?: { new(...args: any[]): Step }) {
        if(this.stepIndex[0] === 0) {
            return;
        }

        if(previousStep) {
            let previousStepIndex = this.steps.indexOf(previousStep);
            let previousStepSubIndex = 0;

            if(previousStepIndex === -1) {
                let stepIndex = 0;

                for(const breakpoint of this.steps) {
                    stepIndex++;

                    if(!Number.isInteger(<StepBreakpoint> breakpoint)) {
                        continue;
                    }

                    const breakpointSteps = this.stepsByBreakpoint[<StepBreakpoint> breakpoint];
                    previousStepSubIndex = breakpointSteps.indexOf(previousStep);

                    if(previousStepSubIndex !== -1) {
                        previousStepIndex = stepIndex;
                    }
                }
            }

            if(previousStepIndex === -1) {
                throw new Error('Previous step does not exist');
            }

            new previousStep(this.task, this.proxy, this.resultsByStepIndex, [previousStepIndex, previousStepSubIndex], this.steps, this.stepsByBreakpoint).run();
            return;
        }

        const step = this.steps[this.stepIndex[0] - 1];
        if(Array.isArray(step)) {
            const breakpointSteps = this.stepsByBreakpoint[<StepBreakpoint> step];

            const breakpointStepIndex = 0; // or should this be the last step?

            new breakpointSteps[breakpointStepIndex](this.task, this.proxy, this.resultsByStepIndex, [this.stepIndex[0] - 1, breakpointStepIndex], this.steps, this.stepsByBreakpoint).run();
        }else {
            new (<{ new(...args: any[]): Step }> step)(this.task, this.proxy, this.resultsByStepIndex, [this.stepIndex[0] - 1, 0], this.steps, this.stepsByBreakpoint).run();
        }
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
                console.error(error);
            }

            throw error;
        }
    }

    abstract getReference(): { new(...args: any[]): Step };
    abstract run(): void;

    reRun(step?: { new(...args: any[]): Step }, now: boolean = false): void {
        const reRun = (): void => {
            if(step === undefined || step === null) {
                this.previousStep();
            }else {
                this.previousStep(step);
            }
        };

        if(now) {
            reRun();
        }else {
            setTimeout(() => reRun(), this.task.interval);
        }
    }
}
