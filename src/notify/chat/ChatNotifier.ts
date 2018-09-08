import { INotifier, NotifierType } from '../INotifier';

export abstract class ChatNotifier implements INotifier {
    type = NotifierType.Chat;

    abstract name;
    abstract notify(message: string): Promise<void>;
}
