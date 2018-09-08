import { Step } from '../../BaseTask/step/Step';
import { IProductPageRequestStepResults, ISizeItem } from './ProductPageRequestStep';
import { Task } from '../Task';

export interface IGetSizeStepResults extends IProductPageRequestStepResults {
    chosenSizeItem: ISizeItem;
}

export abstract class GetSizeStep extends Step {
    protected task: Task;
    protected results: IProductPageRequestStepResults;
    protected abstract getPreviousStepReferenceForNoSize(): { new(...args: any[]): Step };

    run() {
        const chosenSizeItem = this.findSizeItem();
        if(chosenSizeItem === null) {
            this.reRun(this.getPreviousStepReferenceForNoSize());
            return this.log('Could not find size');
        }
        this.log(`Found size ${chosenSizeItem.sizeAsListedOnProductPage}`);

        if(!this.task.isMonitoring) {
            this.log('Will cart at start time');
            setTimeout(() => {
                this.nextStep({ sizeItem: chosenSizeItem });
            }, this.task.startTime ? this.task.startTime - Date.now() : 0);
        }else {
            this.nextStep({ chosenSizeItem: chosenSizeItem });
        }
    }
    protected convertSizeFromTaskToProductPageFormat(size: number|string): string {
        return typeof size === 'number' ? size.toString() : size;
    }
    protected findSizeItem(): ISizeItem {
        const sizeItemsBySizeInProductPageFormat: {[sizeInProductPageFormat: string]: ISizeItem} = {};
        for(const sizeItem of this.results.sizeItems) {
            if(this.task.isMonitoring) {
                if(!sizeItem.available) {
                    continue;
                }
            }
            sizeItemsBySizeInProductPageFormat[sizeItem.sizeAsListedOnProductPage] = sizeItem;
        }

        const sizeInProductPageFormat = this.convertSizeFromTaskToProductPageFormat(this.task.sizes.size);
        if(sizeItemsBySizeInProductPageFormat[sizeInProductPageFormat] !== undefined) {
            return sizeItemsBySizeInProductPageFormat[sizeInProductPageFormat];
        }

        for(const size of this.task.sizes.fallback.sizes) {
            const fallbackSizeInProductPageFormat = this.convertSizeFromTaskToProductPageFormat(size);
            if(sizeItemsBySizeInProductPageFormat[fallbackSizeInProductPageFormat] !== undefined) {
                return sizeItemsBySizeInProductPageFormat[fallbackSizeInProductPageFormat];
            }
        }

        if(this.task.sizes.fallback.any) {
            const sizesInReverse = Object.values(sizeItemsBySizeInProductPageFormat).reverse();
            if(sizesInReverse.length === 0) {
                return null;
            }
            return sizesInReverse[0];
        }
    }
}
