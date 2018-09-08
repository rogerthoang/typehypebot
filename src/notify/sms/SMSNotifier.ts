import { INotifier, NotifierName, NotifierType } from '../INotifier';

export abstract class SMSNotifier implements INotifier {
    type: NotifierType.SMS;

    abstract name: NotifierName;
    protected toNumber: string;
    protected fromNumber: string;
    protected alphanumericName: string;

    constructor(toNumber: string, fromNumber: string, alphanumericName: string = null) {
        this.toNumber = toNumber;
        this.fromNumber = fromNumber;
        this.alphanumericName = alphanumericName;
    }

    abstract notify(message: string): Promise<void>;
}
