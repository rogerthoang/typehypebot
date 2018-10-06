import { IRequestOptions, IResponse, RequestMethod } from '@util/request';

export interface ICookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    expires?: number | string;
}

export interface ISession {
    url: string;
    cookies: ICookie[];
    makeRequest: (method: RequestMethod, url: string, options: IRequestOptions) => Promise<IResponse>;
    open: () => void;
}
