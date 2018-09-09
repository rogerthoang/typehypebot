import { IConfig } from './IConfig';

export interface INotifiersConfig extends IConfig {
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
                channelId: number;
            };
            Slack?: {
                channelName: string;
                botName?: string;
            };
        }
    };
}
