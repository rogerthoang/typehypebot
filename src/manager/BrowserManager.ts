import { Browser, launch } from 'puppeteer';
import { getProxyString, IProxy } from '@util/proxy';

export class BrowserManager {
    private browsersByProxy: { [proxy: string]: Browser } = {};

    async getBrowser(proxy?: IProxy): Promise<Browser> {
        if(proxy === undefined) {
            if(this.browsersByProxy[''] === undefined) {
                this.browsersByProxy[''] = await launch();
            }
            return this.browsersByProxy[''];
        }

        const proxyString = getProxyString(proxy);
        if(this.browsersByProxy[proxyString] === undefined) {
            const browser = await launch({
                ignoreHTTPSErrors: true,
                args: [`--proxy-server=http://${proxy.address}:${proxy.port}`],
            });
            browser.on('targetcreated', async target => {
                if(target.type() === 'page') {
                    (await target.page()).authenticate({
                        username: proxy.username,
                        password: proxy.password,
                    });
                }
            });
            this.browsersByProxy[proxyString] = browser;
        }

        return this.browsersByProxy[proxyString];
    }
}
