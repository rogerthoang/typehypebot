import { SMSNotifier } from './SMSNotifier';
import { NotifierName } from '../INotifier';
import * as Nexmo from 'nexmo';

export class NexmoNotifier extends SMSNotifier {
    name = NotifierName.Nexmo;

    private nexmo: any;

    constructor(key: string, secret: string, toNumber: string, fromNumber: string, alphanumericName: string = null) {
        super(toNumber, fromNumber, alphanumericName);
        this.nexmo = new Nexmo({
            apiKey: key,
            apiSecret: secret,
        });
    }

    notify(message: string): Promise<void> {
        let resolve: () => void = null;
        const promise: Promise<void> = new Promise(_resolve => {
            resolve = _resolve;
        });
        this.nexmo.message.sendSms(this.alphanumericName === null ? this.fromNumber : this.alphanumericName, this.toNumber, message, {}, () => {
            resolve();
        });
        return promise;
    }
}
