import { PreCheckoutTask } from '../../PreCheckoutTask';
import { IGetCheckoutUrlStepResults } from './GetCheckoutUrlStep';
import { RawSession } from '../../../session/RawSession';
import { RequestStep } from '../RequestStep';
import { IRequestOptions } from '../../../util/request';

export abstract class ClearCartRequestStep extends RequestStep {
    protected task: PreCheckoutTask;
    protected results: IGetCheckoutUrlStepResults;

    async run() {
        try {
            this.log('Clearing cart...');
            const result: any = await this.clearCart(this.results.cartSession);
            this.log('Cart cleared');
            this.nextStep(result ? result : {});
        }catch(error) {
            this.log(`Couldn't clear cart: ${error.message}`);
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
        }
    }

    protected getRequestOptions(): IRequestOptions {
        return {

        };
    }

    protected abstract async clearCart(session: RawSession): Promise<any>;
}
