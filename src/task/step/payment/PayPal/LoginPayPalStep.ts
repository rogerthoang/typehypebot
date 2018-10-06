import { IPayPalPaymentStepResults, PayPalPaymentStep } from './PayPalPaymentStep';
import { IPayPalCheckoutStepResults } from '../../CheckoutStep';
import { IPayPalPaymentData } from '../../../../config/IOrdersConfig';
import { Page } from 'puppeteer';

export interface ILoginPayPalStepResults extends IPayPalPaymentStepResults {
    page: Page;
}

export class LoginPayPalStep extends PayPalPaymentStep {
    protected results: IPayPalCheckoutStepResults;

    getReference() {
        return LoginPayPalStep;
    }

    async run() {
        this.log('Visiting PayPal Express checkout page...');

        const browser = this.task.bot.getPayPalBrowser((<IPayPalPaymentData> this.results.order.payment.data).authentication.data.email);
        const page = await browser.newPage();

        await page.setCookie(...this.results.cartSession.getPuppeteerCookies());
        await page.goto(this.results.expressUrl);

        this.log('On PayPay Express checkout page, waiting for content to load...');

        await page.waitForSelector('#main'); // past loading page

        this.log('PayPal Express checkout page content loaded');

        if(await page.$('input#email') !== null) { // login page
            this.log('Logging in...');
            await page.evaluate(() => {
                (<HTMLInputElement> document.getElementById('email')).value = '';
            });
            await page.type('#email', (<IPayPalPaymentData> this.results.order.payment.data).authentication.data.email);
            await page.type('#password', (<IPayPalPaymentData> this.results.order.payment.data).authentication.data.password);
            await page.waitForSelector('#btnLogin');
            await page.click('#btnLogin');
            this.log('Logged in');
        }else {
            this.log('No login page, continuing with next step');
        }
        this.nextStep({ page: page });
    }
}
