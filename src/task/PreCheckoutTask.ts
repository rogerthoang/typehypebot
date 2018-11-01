import { BaseTask, ParallelSteps, Steps } from './BaseTask';

export abstract class PreCheckoutTask extends BaseTask {
    protected abstract getPreCheckoutSteps(): ParallelSteps;

    protected getSteps(): Steps {
        return [
            this.getSearchItemSteps(),
            this.getCartSteps(),
            this.getPaymentSteps(),
        ];
    }
}
