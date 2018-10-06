import { Step } from '../Step';
import { PreCheckoutTask } from '../../../PreCheckoutTask/PreCheckoutTask';
import { IGetRandomSearchItemStepResults } from './GetRandomSearchItemStep';
import { IProductPageRequestStepResults, ISizeItem } from '../ProductPageRequestStep';

export interface IGetPreCheckoutSizeStepResults extends IGetRandomSearchItemStepResults {
    sizeItem: ISizeItem;
}

export class GetPreCheckoutSizeStep extends Step {
    protected task: PreCheckoutTask;
    protected results: IProductPageRequestStepResults;

    getReference() {
        return GetPreCheckoutSizeStep;
    }

    run() {
        const sizeItem = this.getRandomSizeItem();
        this.log(`Found random size ${sizeItem.sizeAsListedOnProductPage}`);
        this.nextStep({
            sizeItem: sizeItem,
        });
    }

    private getRandomSizeItem(): ISizeItem {
        for(const sizeItem of this.results.sizeItems) {
            if(sizeItem.available) {
                return sizeItem;
            }
        }
    }
}
