import { Step } from '../Step';
import { IPreCheckoutCartRequestStepResults } from './PreCheckoutCartRequestStep';
import { RawSession } from '../../../session/RawSession';
import { Order } from '../../../Order';
import { PreCheckoutTask } from '../../../PreCheckoutTask/PreCheckoutTask';

export interface ISubmitOrderDetailsStepResults extends IPreCheckoutCartRequestStepResults {

}
export abstract class SubmitOrderDetailsStep extends Step {
    protected task: PreCheckoutTask;
    protected results: IPreCheckoutCartRequestStepResults;

    async run() {
        try {
            this.log('Submitting order details...');
            const result = await this.submitOrderDetails(this.results.cartSession, this.results.order);
            this.log('Submitted order details');
            this.nextStep(result ? result : {});
        }catch(error) {
            this.log(`Couldn't submit order details: ${error.message}`);
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
        }
    }

    protected abstract async submitOrderDetails(session: RawSession, order: Order): Promise<any>;
}
