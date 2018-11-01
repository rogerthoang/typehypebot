import { SearchItem } from './SearchItem';
import { containsAnArrayItem, containsArrayItems } from '@util/generic';
import { compensateInterval, ICompensateInterval } from '@util/timing';
import { Step } from './Step';
import { ProductConfigData } from '../../config/ITasksConfig';

export abstract class GetSearchItemStep extends Step<{}, { product: ProductConfigData }> {
    protected interval: ICompensateInterval;

    run(): void {
        this.interval = compensateInterval(async () => {
            const searchItem = this.findSearchItem(await this.getSearchItems(this.results.product.search));

            if(searchItem !== null) {
                this.log(`Found search item with name ${searchItem.name} and URL ${searchItem.url}`);
                this.task.searchItemsByName[searchItem.name] = searchItem;
                this.interval.stop();
                this.nextStep();
                return;
            }
            this.log('Could not find search item');
        }, this.task.interval, true);
    }

    protected abstract async getSearchItems(search: string): Promise<SearchItem[]>;

    private findSearchItem(searchItems: SearchItem[]): SearchItem {
        for(const searchItem of searchItems) {
            if(this.isValidSearchItem(searchItem)) {
                this.task.searchItemsByName[searchItem.name] = searchItem;
                return searchItem;
            }
        }

        return null;
    }

    private isValidSearchItem(searchItem: SearchItem): boolean {
        return containsArrayItems(searchItem.name, this.results.product.filter.name.contains)
            && !containsAnArrayItem(searchItem.name, this.results.product.filter.name.blocked)
            && containsArrayItems(searchItem.url, this.results.product.filter.url.contains)
            && !containsAnArrayItem(searchItem.url, this.results.product.filter.url.blocked);
    }
}
