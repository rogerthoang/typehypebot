import { IGetSearchItemStepResults } from './GetSearchItemStep';
import { RequestStep } from './RequestStep';
import { IRequestOptions, IResponse, RequestMethod } from '@util/request';

export interface ISizeItem {
    available: boolean;
    sizeAsListedOnProductPage: string;
    sizeData?: any;
}

export interface IProductPageRequestStepResults extends IGetSearchItemStepResults {
    sizeItems: ISizeItem[];
}

export interface IProductPageRequestResult {
    sizeItems: ISizeItem[];
    [x: string]: any;
}

export abstract class ProductPageRequestStep extends RequestStep {
    async run() {
        try {
            const response = await this.getProductPageResponse();
            const result = await this.onProductPageRequest(response);
            this.nextStep(result);
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

    protected abstract onProductPageRequest(response: IResponse): Promise<IProductPageRequestResult>;
}