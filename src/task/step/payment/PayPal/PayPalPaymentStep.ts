import { Step } from '../../Step';
import { IPayPalCheckoutStepResults } from '../../CheckoutStep';

export interface IPayPalPaymentStepResults extends IPayPalCheckoutStepResults {}

export abstract class PayPalPaymentStep extends Step {}
