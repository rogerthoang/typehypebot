import { IConfig } from './IConfig';

export interface INotifierOptionsConfig extends IConfig {
    body: {
        sms: {
            Nexmo?: {
                fromNumber: string;
                toNumber: string;
                alphanumericName?: string;
            };
            Twilio?: {
                fromNumber: string;
                toNumber: string;
                alphanumericName?: string;
            };
        };
        chat: {
            Discord?: {
                channelName: string;
            };
            Slack?: {
                channelName: string;
                botName?: string;
            };
        }
    };
}
