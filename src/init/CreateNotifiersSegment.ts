import { IInitSegment } from './IInitSegment';
import { INotifier } from '../notify/INotifier';
import { NexmoNotifier } from '../notify/sms/NexmoNotifier';
import { TwilioNotifier } from '../notify/sms/TwilioNotifier';
import { DiscordNotifier } from '../notify/chat/DiscordNotifier';
import { SlackNotifier } from '../notify/chat/SlackNotifier';
import { TwitterNotifier } from '../notify/social/TwitterNotifier';
import { TokensConfigData } from '../config/ITokensConfig';
import { NotifiersConfigData } from '../config/INotifiersConfig';

export class CreateNotifiersSegment implements IInitSegment<INotifier[]> {
    constructor(private notifiersData: NotifiersConfigData, private tokens: TokensConfigData) {}

    getResult() {
        const notifiers: INotifier[] = [];

        if(this.tokens.notifiers.sms.Nexmo) {
            notifiers.push(new NexmoNotifier(this.tokens.notifiers.sms.Nexmo.key, this.tokens.notifiers.sms.Nexmo.secret, this.notifiersData.sms.Nexmo.toNumber, this.notifiersData.sms.Nexmo.fromNumber, this.notifiersData.sms.Nexmo.alphanumericName));
        }
        if(this.tokens.notifiers.sms.Twilio) {
            notifiers.push(new TwilioNotifier(this.tokens.notifiers.sms.Twilio.sid, this.tokens.notifiers.sms.Twilio.authToken, this.notifiersData.sms.Twilio.toNumber, this.notifiersData.sms.Twilio.fromNumber, this.notifiersData.sms.Twilio.alphanumericName));
        }
        if(this.tokens.notifiers.chat.Discord) {
            notifiers.push(new DiscordNotifier(this.tokens.notifiers.chat.Discord.token, this.notifiersData.chat.Discord.channelId));
        }
        if(this.tokens.notifiers.chat.Slack) {
            notifiers.push(new SlackNotifier(this.tokens.notifiers.chat.Slack.token, this.notifiersData.chat.Slack.channelName, this.notifiersData.chat.Slack.botName));
        }
        if(this.tokens.notifiers.social.Twitter) {
            notifiers.push(new TwitterNotifier(this.tokens.notifiers.social.Twitter.consumerKey, this.tokens.notifiers.social.Twitter.consumerSecret, this.tokens.notifiers.social.Twitter.accessTokenKey, this.tokens.notifiers.social.Twitter.accessTokenSecret));
        }

        return notifiers;
    }
}
