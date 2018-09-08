export enum NotifierType {
    Chat,
    SMS,
    Social,
}

export enum NotifierName {
    Twilio,
    Nexmo,
    Discord,
    Slack,
    Twitter,
}

export interface INotifier {
    type: NotifierType;
    name: NotifierName;

    notify(message: any): Promise<void>;
}
