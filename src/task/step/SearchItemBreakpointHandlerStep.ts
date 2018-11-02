import { Step } from './Step';
import { SearchItem } from './SearchItem';

export type SearchItemBreakpointHandlerStepResult = {
    searchItem: SearchItem;
};

export class SearchItemBreakpointHandlerStep extends Step {
    run(): void {
        this.nextStep(Object.values(this.task.searchItemsByName).map(searchItem => ({ searchItem })));
    }
}
