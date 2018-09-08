import { INotifier, NotifierName, NotifierType } from '../INotifier';

export abstract class SMSNotifier implements INotifier {
    type: NotifierType.SMS;

    abstract name: NotifierName;

    constructor(protected toNumber: string, protected fromNumber: string, protected alphanumericName: string = null) {}

    abstract notify(message: string): Promise<void>;
}
