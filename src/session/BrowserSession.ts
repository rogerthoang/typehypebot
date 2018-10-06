import { Bot } from '../Bot';
import { BrowserContext, NavigationOptions, Page } from 'puppeteer';
import { IProxy } from '@util/proxy';

export class BrowserSession {
    static async build(bot: Bot, proxy: IProxy): Promise<BrowserSession> {
        const context = await (await bot.browserManager.getBrowser(proxy)).createIncognitoBrowserContext();
        const page = await context.newPage();
        return new BrowserSession(context, page);
    }

    constructor(private context: BrowserContext, public page: Page) {}

    async goto(url: string, options?: NavigationOptions) {

        await this.page.goto(url, options);
    }

    async close() {
        await this.context.close();
    }
}
