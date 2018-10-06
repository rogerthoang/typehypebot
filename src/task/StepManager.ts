import { BaseTask } from './BaseTask';
import { Step } from './step/Step';

enum StepType {
    Single = 0,
    Parallel,
    Choice,
}

type AnyObject = { [x: string]: any };

export type StepIndex = [number, number]; // primary step index, secondary step index
export type StepConstructor<StepType extends Step = Step> = { new(...args: any[]): StepType };
export type StepResult = { [x: string]: any };

export class StepManager {
    private parallelSessionsCount: { [stepIndex: number]: number } = {};
    private generalResults: { [stepIndex: number]: AnyObject } = {};
    private parallelResults: { [stepIndex: number]: { [sessionId: number]: { [secondaryStepIndex: number]: AnyObject } } } = {};
    private choiceResults: { [stepIndex: number]: { [secondaryStepIndex: number]: AnyObject } } = {};

    constructor(
        private task: BaseTask,
        private steps: (StepConstructor | StepConstructor[] | { [key: string]: StepConstructor[] })[],
    ) {}

    nextStep(currentStepIndex: StepIndex, result: StepResult, options?: { sessionId?: number, identifier?: string }): boolean {
        const currentStep = this.steps[currentStepIndex[0]];
        const currentStepType = Array.isArray(currentStep) ? StepType.Parallel : (typeof currentStep === 'object' ? StepType.Choice : StepType.Single);

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

    previousStep(currentStepIndex: StepIndex, previousStep?: StepConstructor) {}
}
