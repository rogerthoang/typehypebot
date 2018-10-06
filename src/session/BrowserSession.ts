import { ISession } from './ISession';
import { IRequestOptions, IResponse, RequestMethod } from '@util/request';
import { Bot } from '../Bot';
import { Browser, BrowserContext, NavigationOptions, Page } from 'puppeteer';

export class BrowserSession implements ISession {
    static async build(browser: Browser): Promise<BrowserSession> {
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        return new BrowserSession(context, page);
    }

    constructor(context: BrowserContext, public page: Page) {}

    async goto(url: string, options?: NavigationOptions): Promise<void> {
        await this.page.goto(url, options);
    }
}
