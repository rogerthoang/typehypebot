import * as request from 'request-promise-native';
import * as querystring from 'querystring';
import * as cheerio from 'cheerio';
import { IProxy } from '@util/proxy';
import { CookieJar } from 'request';
import * as StatusCode from 'http-status-codes';
import { FullResponse } from 'request-promise-native';
import { readFile } from '@util/file';

export type MakeRequest = (method: RequestMethod, url: string, options: IRequestOptions) => Promise<IResponse>;

export interface IResponse<BodyType = any> {
    statusCode: number;
    body: BodyType;
    href: string;
    $?: any;
    json?: any;
}

export interface IRequestOptions {
    clearHeaders?: boolean;
    headers?: any;
    gzip?: boolean;
    proxy?: IProxy;
    useCookiesFromJar?: CookieJar;
    cookieJar?: any;
    rawCookies?: string;
    isJSON?: boolean;
    useCheerio?: boolean;
    isFormURLEncoded?: boolean;
    rawForm?: boolean;
    followAllRedirects?: boolean;
    timeout?: number;
    retry?: boolean;
    onRetry?: (statusCode: number) => void;
    parseJSONResponse?: boolean;
    form?: any;
}

export enum RequestMethod {
    POST = 'POST',
    GET = 'GET',
    DELETE = 'DELETE',
    PUT = 'PUT',
}

export async function makeRequest(method: RequestMethod, url: string, options: IRequestOptions = null): Promise<IResponse> {
    const headers: any = {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Language': 'en-US,en;q=0.8,nl;q=0.6,fr;q=0.4',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': 1,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
    };

    const requestData: request.OptionsWithUrl = {
        method: method,
        url: url,
        headers: headers,
        gzip: true,
        timeout: 15000,
        proxy: null,
        resolveWithFullResponse: true,
    };

    let parseJSONResponse = false;
    let isUsingCheerio = false;
    let isJSON = false;
    let isFormURLEncoded = false;
    let retry = false;
    let onRetry: (statusCode: number) => void = null;

    if(options !== null) {
        if(options.clearHeaders) {
            requestData.headers = {};
        }
        if(options.gzip) {
            requestData.gzip = options.gzip;
        }
        if(options.headers !== undefined) {
            requestData.headers = Object.assign(requestData.headers, options.headers);
        }
        if(options.proxy !== undefined && options.proxy !== null) {
            requestData.proxy = `http://${options.proxy.username ? (`${options.proxy.username}:${options.proxy.password}@`) : `${options.proxy.address}:${options.proxy.port}`}`;
        }
        if(options.rawCookies !== undefined) {
            requestData.headers['Cookie'] = options.rawCookies;
        }
        if(options.cookieJar !== undefined) {
            requestData.jar = options.cookieJar;
        }
        if(options.parseJSONResponse !== undefined) {
            parseJSONResponse = options.parseJSONResponse;
        }
        if(options.isJSON !== undefined) {
            isJSON = options.isJSON;
        }
        if(options.isFormURLEncoded !== undefined) {
            isFormURLEncoded = options.isFormURLEncoded;
        }
        if(options.useCheerio !== undefined) {
            isUsingCheerio = options.useCheerio;
        }
        if(options.followAllRedirects !== undefined) {
            requestData.followAllRedirects = options.followAllRedirects;
        }
        if(options.timeout !== undefined) {
            requestData.timeout = options.timeout;
        }
        if(options.retry !== undefined) {
            retry = options.retry;
        }
        if(options.onRetry !== undefined) {
            retry = true;
            onRetry = options.onRetry;
        }
    }

    if(isJSON) {
        headers['Content-Type'] = 'application/json';
        requestData.json = options.form;
    }else
    if(isFormURLEncoded) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        requestData.body = querystring.stringify(options.form);
    }else {
        if(options !== undefined) {
            if(options.rawForm) {
                requestData.body = options.form;
            }else
            if(options.form !== undefined) {
                switch(method){
                    case 'GET':
                        requestData.qs = options.form;
                        break;
                    case 'POST':
                        requestData.form = options.form;
                        break;
                }
            }
        }
    }

    const respond = (response: FullResponse): IResponse => {
        const returnData: IResponse = {
            statusCode: response.statusCode,
            href: response.request.uri.href,
            body: response.body,
        };

        if(response.statusCode === 302) {
            returnData.href = response.headers['location'];
        }

        if(isUsingCheerio) {
            returnData.$ = cheerio.load(response.body);
        }

        if(parseJSONResponse) {
            if(typeof response.body === 'object') {
                returnData.json = response.body;
                return returnData;
            }

            returnData.json = JSON.parse(response.body);
        }

        return returnData;
    };

    const makeRequest = async(): Promise<IResponse> => {
        try {
            return respond(await request(requestData));
        }catch(error) {
            if(error.name === 'StatusCodeError') { // handle 302 "error" as a normal request as it's just a redirect
                if(error.statusCode === StatusCode.MOVED_TEMPORARILY) {
                    return respond(error.response);
                }

                if(retry) {
                    onRetry(error.response.statusCode);
                    return await makeRequest();
                }
            }else
            if(error.message.indexOf('ESOCKETTIMEDOUT') > -1) {
                if(retry) {
                    onRetry(StatusCode.REQUEST_TIMEOUT);
                    return await makeRequest();
                }
            }

            throw error;
        }
    };

    return await makeRequest();
}

const userAgents: string[] = readFile(`${__dirname}/user_agents.txt`).split('\n');

export function getRandomUserAgent(): string {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export interface IPuppeteerCookie{
    url: string;
    name: string;
    domain: string;
    value: string;
    path: string;
    expires?: number;
    size?: number;
    httpOnly?: boolean;
    secure?: boolean;
    session?: boolean;
}

export function updateCookieJarWithPuppeteerCookies(url: string, puppeteerCookies: IPuppeteerCookie[], cookieJar: CookieJar) {
    const slashIndex = url.indexOf('/', 8);
    const realUrl = url.slice(0, slashIndex === -1 ? url.length : slashIndex);

    for(let i = 0; i < puppeteerCookies.length; i++) {
        const cookie = puppeteerCookies[i];
        cookieJar.setCookie(cookie.name + '=' + cookie.value + ';' + (cookie.httpOnly ? ' HttpOnly; ' : ''), realUrl);
    }
}

export function getEditThisCookieImportValue(host: string, cookies: any[]): string {
    const importCookies = [];

    for(let i = 0; i < cookies.length; i++) {
        const endCookieNameIndex = cookies[i].indexOf('=');
        let value = cookies[i].slice(endCookieNameIndex + 1);

        if(value.indexOf(';') > -1) {
            value = value.slice(0, value.indexOf(';'));
        }

        value = value.replace(/"/g, '\\"');

        importCookies.push({
            domain: host,
            name: cookies[i].slice(0, endCookieNameIndex),
            value: value,
            path: '/',
            sameSite: 'no_restriction',
            secure: false,
            session: false,
            storeId: '0',
            hostOnly: false,
            httpOnly: false,
            id: i + 1,
        });
    }

    return JSON.stringify(importCookies);
}

export function getHostname(url: string): string {
    let hostname = '';

    if(url.indexOf('https://') !== -1) {
        hostname = url.replace('https://', '');
    }else
    if(url.indexOf('http://') !== -1) {
        hostname = url.replace('http://', '');
    }

    if(hostname.slice(0, 4) !== 'www.') {
        hostname = `www.${hostname}`;
    }

    const dashIndex = hostname.indexOf('/');

    if(dashIndex !== -1) {
        hostname = hostname.slice(0, dashIndex);
    }

    return hostname;
}
