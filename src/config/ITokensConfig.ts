import { IConfig } from './IConfig';

export interface ITokens {
    serverProviders: {
        DigitalOcean?: string;
    };
    captchaSolvers: {
        AntiCaptcha?: string;
        CaptchaSolutions?: {
            api: string;
            secret: string;
        };
        TwoCaptcha?: string;
    };
    notifiers: {
        sms: {
            Nexmo?: {
                key: string;
                secret: string;
            };
            Twilio?: {
                sid: string;
                authToken: string;
            };
        };
        chat: {
            Discord?: {
                token: string;
            };
            Slack?: {
                token: string;
            };
        };
        social: {
            Twitter?: {
                consumerKey: string;
                consumerSecret: string;
                accessTokenKey: string;
                accessTokenSecret: string;
            };
        };
    };
}

export interface ITokensConfig extends IConfig {
    body: ITokens;
}
