import { INotifier, NotifierName } from '../INotifier';
import { ChatNotifier } from './ChatNotifier';
import * as SlackBot from 'slackbots';

export interface ISlackOptions {
    iconUrl?: string;
    iconEmoji?: string;
}

export class SlackNotifier extends ChatNotifier {
    name = NotifierName.Slack;

    private bot: any;
    private channelName: string;
    private hasStarted: boolean = false;
    private options: ISlackOptions;

    constructor(token: string, channelName: string, botName = 'typehypebot', options: ISlackOptions = {}) {
        super();

        this.bot = new SlackBot({
            token: token,
            name: botName,
        });
        this.options = options;
        this.bot.on('start', () => {
            this.hasStarted = true;
        });
        this.channelName = channelName;
    }

    async notify(message: string): Promise<void> {
        if(this.hasStarted) {
            this.bot.postMessageToChannel(this.channelName, message, this.options);
        }
    }
}
