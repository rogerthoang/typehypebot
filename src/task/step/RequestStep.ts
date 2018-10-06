import { IStepResults, Step } from './Step';
import { IRequestOptions } from '../../util/request';

export interface IRequestStepResults extends IStepResults {}

export abstract class RequestStep extends Step {
    protected abstract getRequestOptions(): IRequestOptions;
}
