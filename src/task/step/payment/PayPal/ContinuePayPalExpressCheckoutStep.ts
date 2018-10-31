import { ILoginPayPalStepResults } from './LoginPayPalStep';
import { PayPalPaymentStep } from './PayPalPaymentStep';

export interface IContinuePayPalExpressCheckoutStepResults extends ILoginPayPalStepResults {
    expressResponseUrl: string;
}

export class ContinuePayPalExpressCheckoutStep extends PayPalPaymentStep {
    protected results: ILoginPayPalStepResults;

    getReference() {
        return ContinuePayPalExpressCheckoutStep;
    }

    async run() {
        const { page } = this.results;

        await page.waitForSelector('#confirmButtonTop');
        const content = await page.content();

        const returnUrlFirstIndex = content.indexOf('"return_url": "') + 15;
        const returnUrlEndIndex = content.indexOf('"', returnUrlFirstIndex);
        const returnUrl: string = content.slice(returnUrlFirstIndex, returnUrlEndIndex);

        await page.setRequestInterception(true);

        const interval = setInterval(async() => { // initialisation problems
            try {
                if(await page.$('#confirmButtonTop') === null) {
                    return clearInterval(interval);
                }
                await page.click('#confirmButtonTop');
            }catch(error) {
                // silent ignore
            }
        }, 200);

        page.on('request', async request => {
            if((<any> request.url).indexOf(returnUrl) > -1) { // need to use <any> due to () => String bug on Request::url
                request.abort();
                clearInterval(interval);
                await page.close();

                this.log('Continued PayPal Express checkout');
                this.nextStep({ expressResponseUrl: request.url });
            }else {
                request.continue();
            }
        });
    }
}
