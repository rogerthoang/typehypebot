import { IStepResults, Step } from '../Step';
import { SearchItem } from '../SearchItem';
import { PreCheckoutTask } from '../../../PreCheckoutTask/PreCheckoutTask';

export interface IGetRandomSearchItemStepResults extends IStepResults {
    searchItem: SearchItem;
}
export abstract class GetRandomSearchItemStep extends Step {
    protected task: PreCheckoutTask;

    async run() {
        try {
            this.log('Getting random search item...');
            const randomSearchItem = await this.getRandomSearchItem();
            this.log(`Found random search item ${randomSearchItem.title} (${randomSearchItem.url})`);
            this.nextStep({
                searchItem: randomSearchItem,
            });
        }catch(error) {
            this.log(`Couldn't get random search item: ${error.message}`);
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
        }
    }

    protected abstract async getRandomSearchItem(): Promise<SearchItem>;
}
