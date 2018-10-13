import { IConfig } from './IConfig';

export type TokensConfigData = {
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
};

export interface ITokensConfig extends IConfig<TokensConfigData> {}
