import { INotifier, NotifierName, NotifierType } from '../INotifier';

export abstract class SocialNotifier implements INotifier {
    type: NotifierType.Social;

    abstract name: NotifierName;
    abstract notify(message: string): Promise<void>;
}
