import { IStepResults, Step } from './Step';
import { SearchItem } from './SearchItem';
import { containsAnArrayItem, containsArrayItems } from '@util/generic';
import { compensateInterval, ICompensateInterval } from '@util/timing';
import { BaseTask } from '../BaseTask';
import { StepIndex, StepResult } from '../../manager/StepManager';

export interface IGetSearchItemStepResults extends IStepResults {
    searchItem: SearchItem;
}

export abstract class GetSearchItemStep extends Step {
    protected task: Task;
    protected interval: ICompensateInterval;

    constructor(task: BaseTask, stepIndex: StepIndex, results: StepResult) {
        super(task, stepIndex, results);
        this.interval = compensateInterval(() => {
            this.run();
        }, this.task.interval, false);
    }

    protected foundSearchItem(searchItem: SearchItem): void {
        if(this.task.isMonitoring) {
            this.log('Will start looking for sizes at start time');
            setTimeout(() => {
                this.nextStep({ searchItem: searchItem });
            }, this.task.startTime ? this.task.startTime - Date.now() + this.task.startDelay : this.task.startDelay);
        }else {
            this.nextStep({ searchItem: searchItem });
        }
    }

    async run(): Promise<void> {
        if(this.task.searchItem !== null) {
            this.interval.stop();
            this.foundSearchItem(this.task.searchItem);
        }else {
            try {
                const searchItems = await this.getSearchItems(this.task.product.search);
                if(searchItems === undefined) { // then the child should use the trySearchItem method manually
                    return;
                }
                for(let i = 0; i < searchItems.length; i++) {
                    const searchItem = searchItems[i];
                    if(this.trySearchItem(searchItem)) {
                        return;
                    }
                }
                this.log('Could not find search item');
            }catch(error) {
                if(error.name === 'StatusCodeError') {
                    this.log(`Could not get search items: status code ${error.statusCode}`);
                }else {
                    this.log(`Could not get search items: ${error.message}`);
                }
            }
        }
    }

    protected isValidSearchItem(searchItem: SearchItem): boolean {
        return containsArrayItems(searchItem.name, this.task.product.filter.title.contains) && !containsAnArrayItem(searchItem.name, this.task.product.filter.title.blocked);
    }

    protected trySearchItem(searchItem: SearchItem): boolean {
        if(this.isValidSearchItem(searchItem)) {
            this.log(`Found search item with name ${searchItem.name} and URL ${searchItem.url}`);
            this.task.searchItem = searchItem;
            this.interval.stop();
            this.foundSearchItem(searchItem);
            return true;
        }
        return false;
    }

    protected abstract async getSearchItems(searchValue: string): Promise<SearchItem[]>;
}
