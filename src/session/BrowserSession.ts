import { BrowserContext, NavigationOptions, Page } from 'puppeteer';
import { IProxy } from '@util/proxy';
import { BrowserManager } from '../manager/BrowserManager';

export class BrowserSession {
    static async build(browserManager: BrowserManager, proxy?: IProxy): Promise<BrowserSession> {
        const context = await (await browserManager.getBrowser(proxy)).createIncognitoBrowserContext();
        const page = await context.newPage();
        return new BrowserSession(context, page);
    }

    constructor(public context: BrowserContext, public page: Page) {}

    async goto(url: string, options?: NavigationOptions): Promise<void> {
        await this.page.goto(url, options);
    }

    async close(): Promise<void> {
        await this.context.close();
    }
}
