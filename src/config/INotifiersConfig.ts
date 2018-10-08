import { IConfig } from './IConfig';

export interface INotifiersConfigData {
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
    };
}

export interface INotifiersConfig extends IConfig<INotifiersConfigData> {}
