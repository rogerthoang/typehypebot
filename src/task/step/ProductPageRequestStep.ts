import { RequestStep } from './RequestStep';
import { IRequestOptions, IResponse, RequestMethod } from '@util/request';
import { SearchItemBreakpointHandlerStepResult } from './SearchItemBreakpointHandlerStep';

export interface ISizeItem {
    available: boolean;
    sizeAsListedOnProductPage: string;
    sizeData?: any;
}

export type ProductPageRequestStepResult = {
    sizeItems: ISizeItem[];
};

export abstract class ProductPageRequestStep extends RequestStep<SearchItemBreakpointHandlerStepResult, ProductPageRequestStepResult> {
    // error handling because this page might crash sometimes under heavy load

    async run(): Promise<void> {
        try {
            const response = await this.getProductPageResponse();
            const sizeItems = await this.onProductPageRequest(response);
            this.nextStep({ sizeItems });
        }catch(error) {
            if(error.name === 'StatusCodeError') {
                this.log(`Could not make product page request: status code ${error.statusCode}`);
            }else {
                this.log(`Could not make product page request: ${error.message}`);
            }
            if(this.task.bot.isUsingDeveloperMode) {
                console.log(error);
            }
            this.reRun();
        }
    }

    protected getRequestOptions(): IRequestOptions {
        return {
            retry: true,
            onRetry: statusCode => {
                this.log(`Product page request returned status code ${statusCode}. Retrying...`);
            },
            useCheerio: true,
        };
    }

    protected async getProductPageResponse(): Promise<IResponse> {
        return await this.makeRequest(RequestMethod.GET, this.results.searchItem.url, this.getRequestOptions());
    }

    protected abstract onProductPageRequest(response: IResponse): Promise<ISizeItem[]>;
}
