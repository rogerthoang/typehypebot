import { Step } from '../../../BaseTask/step/Step';
import { IPreCheckoutCartRequestStepResults } from './PreCheckoutCartRequestStep';
import { Session } from '../../../../session/Session';
import { Order } from '../../../../Order';
import { PreCheckoutTask } from '../../PreCheckoutTask';

export interface ISubmitOrderDetailsStepResults extends IPreCheckoutCartRequestStepResults {

}
export abstract class SubmitOrderDetailsStep extends Step {
    protected task: PreCheckoutTask;
    protected results: IPreCheckoutCartRequestStepResults;

    async run() {
        try {
            this.log('Submitting order details...');
            const result: any = await this.submitOrderDetails(this.results.cartSession, this.results.order);
            this.log('Submitted order details');
            this.nextStep(result ? result : {});
        }catch(error) {
            this.log(`Couldn't submit order details: ${error.message}`);
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
        }
    }

    protected abstract async submitOrderDetails(session: Session, order: Order): Promise<any>;
}
