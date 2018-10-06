import { Bot } from '../Bot';
import * as puppeteer from 'puppeteer';
import * as request from 'request-promise-native';
import { IProxy } from '@util/proxy';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '@util/request';
import { CookieJar } from 'request';

let sessionId = 0;

export class RawSession {
    public id: number;
    public urlHistory: {[time: number]: string};
    public _url;
    public cookieJar: CookieJar;
    public extra: any;

    constructor(public bot: Bot, url: string, public proxy: IProxy = null, cookieJar: CookieJar = null) {
        this.id = sessionId++;
        this.extra = {};
        bot.sessions.push(this);
        this.urlHistory = {};
        this.url = url;
        this.cookieJar = cookieJar === null ? request.jar() : cookieJar;
    }

    async makeRequest(method: RequestMethod, url: string, options: IRequestOptions = {}): Promise<IResponse> {
        return await makeRequest(method, url, Object.assign(options, {
            cookieJar: this.cookieJar,
            proxy: this.proxy,
        }));
    }

    get url(): string {
        return this._url;
    }

    set url(url: string) {
        this.urlHistory[Date.now()] = url;
        this._url = url;
    }

    resetCookies() {
        this.cookieJar = request.jar();
    }

    async updateCookies(puppeteerPage: puppeteer.Page) {
        const cookies = await puppeteerPage.cookies();
        for(let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            this.cookieJar.setCookie(cookie.name + '=' + cookie.value + '; ' + (cookie.httpOnly ? 'HttpOnly; ' : '')/* + (cookie.secure ? 'Secure; ' : '')*/, (cookie.domain.charAt(0) === '.' ? ('http://www' + cookie.domain) : ('http://' + cookie.domain)));
        }
    }

    updateCookiesWithEditThisCookieValue(value: string) {
        try {
            const cookies = JSON.parse(value);
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                this.cookieJar.setCookie(cookie.name + '=' + cookie.value + '; ' + (cookie.httpOnly ? 'HttpOnly; ' : '')/* + (cookie.secure ? 'Secure; ' : '')*/, 'http://' + cookie.domain);
            }
        }catch(error) {

        }
    }

    getPuppeteerCookies() {
        const cookies = this.cookieJar.getCookies(this.url);
        const returnCookies = [];
        for(let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            returnCookies.push({
                url: this.url,
                name: cookie.key,
                domain: cookie.domain,
                value: cookie.value,
                path: cookie.path,
                // expires: cookie.secure === undefined ? 0 : (new Date(cookie.expires).getTime() / 1000),
                size: 0,
                httpOnly: cookie.httpOnly === undefined ? false : cookie.httpOnly,
                secure: cookie.secure === undefined ? false : cookie.secure,
            });
        }
        return returnCookies;
    }

    getEditThisCookieValue() {
        const cookies = this.cookieJar.getCookies(this.url);
        const newCookies = [];
        for(let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const cookieData = {
                domain: (cookie.domain.slice(0, 4) !== 'www.' ? '.' : '') + cookie.domain,
                hostOnly: cookie.hostOnly,
                name: cookie.key,
                path: cookie.path,
                sameSite: 'no_restriction', // ?
                httpOnly: cookie.httpOnly === undefined ? false : cookie.httpOnly,
                secure: cookie.secure === undefined ? false : cookie.secure,
                storeId: '0',
                value: cookie.value,
                id: i + 1,
            };
            newCookies.push(cookieData);
        }
        return newCookies;
    }

    async open(useDefaultBrowser: boolean = false) {
        if(!useDefaultBrowser) {
            try {
                const browser = await puppeteer.launch({ headless: false });
                const page = await browser.newPage();
                await page.setViewport({
                    height: 1920,
                    width: 1080,
                });
                await page.setCookie(...this.getPuppeteerCookies());
                await page.goto(this.url);
                await page.cookies();
            }catch(error) {

            }
        }else {

        }
    }
}
