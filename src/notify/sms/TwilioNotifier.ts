import { SMSNotifier } from './SMSNotifier';
import { NotifierName } from '../INotifier';
import * as Twilio from 'twilio';

export class TwilioNotifier extends SMSNotifier {
    name = NotifierName.Twilio;

    private twilio: any;

    constructor(sid: string, authToken: string, toNumber: string, fromNumber: string, alphanumericName: string = null) {
        super(toNumber, fromNumber, alphanumericName);
        this.twilio = new Twilio(sid, authToken);
    }

    async notify(message: string): Promise<void> {
        await this.twilio.messages.create({
            body: message,
            to: this.toNumber,
            from: this.alphanumericName === null ? this.fromNumber : this.alphanumericName,
        });
    }
}
