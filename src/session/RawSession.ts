import * as request from 'request-promise-native';
import { IProxy } from '@util/proxy';
import { IRequestOptions, IResponse, makeRequest, RequestMethod } from '@util/request';
import { CookieJar } from 'request';

export class RawSession {
    constructor(public proxy: IProxy = null, public cookieJar?: CookieJar) {
        if(this.cookieJar === undefined) {
            this.cookieJar = request.jar();
        }
    }

    async makeRequest(method: RequestMethod, url: string, options: IRequestOptions = {}): Promise<IResponse> {
        return await makeRequest(method, url, Object.assign(options, {
            cookieJar: this.cookieJar,
            proxy: this.proxy,
        }));
    }

    resetCookies() {
        this.cookieJar = request.jar();
    }
}
