import { IRequestOptions, IResponse, RequestMethod } from '@util/request';

export interface ICookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string;
}

export interface ISession {
    url: string;
    cookies: ICookie[];
    makeRequest?: (method: RequestMethod, url: string, options: IRequestOptions) => Promise<IResponse>;
}
