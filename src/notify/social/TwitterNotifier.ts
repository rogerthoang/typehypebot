import { SocialNotifier } from './SocialNotifier';
import { NotifierName } from '../INotifier';
import * as Twitter from 'twitter';

export class TwitterNotifier extends SocialNotifier {
    name = NotifierName.Twitter;

    private client: any;

    constructor(consumerKey: string, consumerSecret: string, accessTokenKey: string, accessTokenSecret: string) {
        super();

        this.client = new Twitter({
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            access_token_key: accessTokenKey,
            access_token_secret: accessTokenSecret,
        });
    }

    async notify(message: string): Promise<void> {
        await this.client.post('statuses/update', { status: message });
    }
}
