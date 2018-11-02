import { Step } from './Step';
import { IRequestOptions } from '@util/request';
import { StepResult } from '../../manager/StepManager';

export abstract class RequestStep<CurrentResultsType extends object = StepResult, ResultType extends object = StepResult> extends Step<CurrentResultsType, ResultType> {
    protected abstract getRequestOptions(): IRequestOptions;
}
