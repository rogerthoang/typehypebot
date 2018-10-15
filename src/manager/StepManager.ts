import { BaseTask, Steps } from '../task/BaseTask';
import { Step } from '../task/step/Step';

export enum StepType {
    Single = 0,
    Parallel,
    Choice,
}

type AnyObject = { [x: string]: any };

export type StepIndex = [number, number]; // primary step index, secondary step index
export type StepConstructor<StepType extends Step = Step> = { new(task: BaseTask, stepIndex: StepIndex, results: StepResult): StepType };
export type StepResult = AnyObject;

export type StartOptions = { parallelSessionsCount?: number, identifier?: string };

export class StepManager {
    public halt = false;

    private parallelSessionsCount: { [stepIndex: number]: number } = {};
    private generalResults: { [stepIndex: number]: AnyObject } = {};
    private parallelResults: { [stepIndex: number]: { [sessionId: number]: { [secondaryStepIndex: number]: AnyObject } } } = {};
    private choiceResults: { [stepIndex: number]: { [secondaryStepIndex: number]: AnyObject } } = {};

    constructor(
        private task: BaseTask,
        private steps: Steps,
    ) {}

    startStep(options?: StartOptions): void {
        this.halt = false;

        const stepType = this.getStepType([0, null]);
        let step: StepConstructor = null;

        switch(stepType) {
            case StepType.Single:
                step = <StepConstructor> this.steps[0];

                for(let i = 0; i < options.parallelSessionsCount; i++) {
                    new step(this.task, [0, null], {}).run();
                }
                return;
            case StepType.Parallel:
                step = this.steps[0][0];
                break;
            case StepType.Choice:
                step = this.steps[0][options.identifier][0];
                break;
        }

        new step(this.task, [0, 0], {}).run();
    }

    nextStep(currentStepIndex: StepIndex, result: StepResult, options?: { sessionId?: number, identifier?: string }): boolean {
        if(this.halt) {
            return false;
        }

        const currentStepType = this.getStepType(currentStepIndex);

        const [primaryStepIndex, secondaryStepIndex] = currentStepIndex;

        const isLastParallelStep = () => secondaryStepIndex === (<StepConstructor[]> this.steps[primaryStepIndex]).length - 1;
        const isLastChoiceStep = () => secondaryStepIndex === (<StepConstructor[]> this.steps[primaryStepIndex][options.identifier]).length - 1;

        if(primaryStepIndex === this.steps.length - 1) {
            switch(currentStepType) {
                case StepType.Single:
                    return false;
                case StepType.Parallel:
                    if(isLastParallelStep()) {
                        return false;
                    }
                    break;
                case StepType.Choice:
                    if(isLastChoiceStep()) {
                        return false;
                    }
                    break;
            }
        }

        let nextStepIndex: StepIndex = null;
        let nextStepType = currentStepType;
        const nextStepResult: StepResult = Object.assign(
            {},
            ...Object.keys(this.generalResults)
                .map(stepIndex => Number(stepIndex) <= primaryStepIndex ? this.generalResults[stepIndex] : null)
                .filter(value => value !== null),
        );

        const primaryIndexIncrement = () => {
            nextStepType = typeof this.steps[nextStepIndex[0]] === 'object' ? StepType.Choice : Array.isArray(this.steps[nextStepIndex[0]]) ? StepType.Parallel : StepType.Single;
            nextStepIndex = [
                primaryStepIndex + 1,
                nextStepType === StepType.Choice || StepType.Parallel ? 0 : null,
            ];
        };
        const secondaryIndexIncrement = () => {
            nextStepIndex = [
                primaryStepIndex,
                secondaryStepIndex + 1,
            ];
        };

        switch(currentStepType) {
            case StepType.Single:
                this.generalResults[primaryStepIndex] = result;

                primaryIndexIncrement();
                break;
            case StepType.Parallel:
                if(secondaryStepIndex === 0) {
                    if(this.parallelResults[primaryStepIndex] === undefined) {
                        this.parallelResults[primaryStepIndex] = {};
                    }

                    this.parallelResults[primaryStepIndex][options.sessionId] = {};
                }

                this.parallelResults[primaryStepIndex][options.sessionId][secondaryStepIndex] = result;

                if(isLastParallelStep()) {
                    const finishedSessionsCount = Object.keys(this.parallelResults[primaryStepIndex]).length;
                    if(finishedSessionsCount < this.parallelSessionsCount[primaryStepIndex]) { // wait till all sessions have finished
                        return false;
                    }

                    const sessionIds = Object.values(this.parallelResults[primaryStepIndex]);
                    const combinedResults: { [x: string]: any[] } = {};
                    for(const sessionId of sessionIds) {
                        const lastStepResult = this.parallelResults[primaryStepIndex][Number(sessionId)][secondaryStepIndex];
                        for(const key in lastStepResult) {
                            if(combinedResults[key] === undefined) {
                                combinedResults[key] = [];
                            }
                            combinedResults[key].push(lastStepResult[key]);
                        }
                    }

                    this.generalResults[primaryStepIndex] = combinedResults;

                    Object.assign(nextStepResult, combinedResults);

                    primaryIndexIncrement();
                }else {
                    Object.assign(
                        nextStepResult,
                        ...Object.keys(this.parallelResults[primaryStepIndex][options.sessionId])
                            .map(parallelSecondaryStepIndex => Number(parallelSecondaryStepIndex) <= secondaryStepIndex ? this.parallelResults[primaryStepIndex][options.sessionId][secondaryStepIndex] : null)
                            .filter(value => value !== null),
                    );

                    nextStepType = StepType.Parallel;
                    secondaryIndexIncrement();
                }
                break;
            case StepType.Choice:
                if(secondaryStepIndex === 0) {
                    this.choiceResults[primaryStepIndex] = {};
                }

                this.choiceResults[primaryStepIndex][secondaryStepIndex] = result;

                if(isLastChoiceStep()) {
                    this.generalResults[primaryStepIndex] = result;

                    Object.assign(nextStepResult, result);

                    primaryIndexIncrement();
                }else {
                    const secondaryResults = Object.assign(
                        {},
                        ...Object.keys(this.choiceResults[primaryStepIndex])
                            .map(choiceSecondaryStepIndex => Number(choiceSecondaryStepIndex) <= secondaryStepIndex ? this.choiceResults[primaryStepIndex][secondaryStepIndex] : null)
                            .filter(value => value !== null),
                    );

                    Object.assign(
                        nextStepResult,
                        secondaryResults,
                    );

                    nextStepType = StepType.Choice;
                    secondaryIndexIncrement();
                }
                break;
        }

        let nextStep: StepConstructor = null;

        switch(nextStepType) {
            case StepType.Single:
                nextStep = <StepConstructor> this.steps[nextStepIndex[0]];
                break;
            case StepType.Parallel:
                nextStep = <StepConstructor> this.steps[nextStepIndex[0]][nextStepIndex[1]];
                break;
            case StepType.Choice:
                nextStep = <StepConstructor> this.steps[nextStepIndex[0]][options.identifier][nextStepIndex[1]];
                break;
        }

        new nextStep(this.task, nextStepIndex, nextStepResult).run();

        return true;
    }

    private getStepType(stepIndex: StepIndex): StepType {
        const step = this.steps[stepIndex[0]];
        return Array.isArray(step) ? StepType.Parallel : (typeof step === 'object' ? StepType.Choice : StepType.Single);
    }

    setParallelSessionsCount(stepIndex: StepIndex, sessionsCount: number): void {
        this.parallelSessionsCount[stepIndex[0]] = sessionsCount;
    }

    previousStep(currentStepIndex: StepIndex, previousStep?: StepConstructor): void {}
}
