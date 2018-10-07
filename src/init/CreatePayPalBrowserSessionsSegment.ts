import { IInitSegment } from './IInitSegment';
import { Browser, BrowserContext } from 'puppeteer';
import { IPayPalPaymentData } from '../config/IOrdersConfig';
import { BrowserManager } from '../BrowserManager';
import { BrowserSession } from '../session/BrowserSession';

export type BrowserSessionsByEmail = { [email: string]: BrowserSession };

export class CreatePayPalBrowserSessionsSegment implements IInitSegment<Promise<BrowserSessionsByEmail>> {
    constructor(private browserManager: BrowserManager, private paymentDataset: IPayPalPaymentData[]) {}

    async getResult() {
        const browserSessionsByEmail: BrowserSessionsByEmail = {};
        const promises: Promise<void>[] = [];

        for(const paymentData of this.paymentDataset) {
            const { email, password } = paymentData.authentication.data;

            promises.push(new Promise(async resolve => {
                const browserSession = await BrowserSession.build(this.browserManager);
                const context = browserSession.context;
                browserSessionsByEmail[email] = browserSession;
                const page = await context.newPage();

                await page.goto('https://www.paypal.com/signin');
                await page.waitForSelector('#login');
                await page.evaluate((email: string, password: string) => {
                    (<HTMLInputElement> document.getElementById('email')).value = email;
                    (<HTMLInputElement> document.getElementById('password')).value = password;
                }, email, password);
                await page.click('button#btnNext');

                const interval = setInterval(async() => {
                    try {
                        if(await page.evaluate(() => !document.getElementsByClassName('forgotLink')[0].classList.contains('hide'))) {
                            await page.click('#btnLogin');
                        }
                    }catch(error) {}

                    if(await page.$('.vx_mainContent.contents') !== null || await page.$('#summary')) {
                        resolve();
                        clearInterval(interval);
                    }
                }, 500);

                setInterval(async() => {
                    if(await page.$('button.vx_btn.extendSession') !== null) {
                        try {
                            await page.click('button.vx_btn.extendSession');
                        }catch(error) {}
                    }
                }, 30000);
            }));
        }

        await Promise.all(promises);

        return browserSessionsByEmail;
    }
}
