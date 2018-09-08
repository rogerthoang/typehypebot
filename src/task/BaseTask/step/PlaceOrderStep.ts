import { IStepResults, Step } from './Step';

export interface IPlaceOrderStepResults extends IStepResults {}

export abstract class PlaceOrderStep extends Step{
    protected validatePrice(price: number): boolean {
        return true;
    }
}
