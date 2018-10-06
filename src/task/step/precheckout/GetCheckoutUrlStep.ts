import { Step } from '../Step';
import { PreCheckoutTask } from '../../PreCheckoutTask';
import { ISubmitOrderDetailsStepResults } from './SubmitOrderDetailsStep';
import { RawSession } from '../../../session/RawSession';

export interface IGetCheckoutUrlStepResults extends ISubmitOrderDetailsStepResults {
    checkoutUrl: string;
}

export abstract class GetCheckoutUrlStep extends Step {
    protected task: PreCheckoutTask;
    protected results: ISubmitOrderDetailsStepResults;

    async run() {
        try {
            this.log('Getting pre-checkout session checkout URL...');
            const checkoutUrl = await this.getCheckoutUrl(this.results.cartSession);
            this.log('Found pre-checkout session checkout URL');
            this.nextStep({
                checkoutUrl: checkoutUrl,
            });
        }catch(error) {
            this.log(`Couldn't get pre-checkout session checkout URL: ${error.message}`);
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
        }
    }

    protected abstract async getCheckoutUrl(session: RawSession): Promise<string>;
}
