import { Step } from '../../BaseTask/step/Step';
import { ICartRequestStepResults } from './CartRequestStep';

export interface ICheckoutStepResults extends ICartRequestStepResults {

}

export interface IPayPalCheckoutStepResults extends ICheckoutStepResults {
    expressUrl: string;
}

export abstract class CheckoutStep extends Step {

}
