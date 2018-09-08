import { NotifierName } from '../INotifier';
import { ChatNotifier } from './ChatNotifier';
import * as Discord from 'discord.js';

export interface IRemoteFilesMessage {
    type: 'RemoteFiles';
    fileUrls: string[];
}

export interface ILocalFile {
    filePath: string;
    name: string;
}

export interface ILocalFilesMessage {
    type: 'LocalFiles';
    files: ILocalFile[];
}

export interface IAttachmentMessage {
    type: 'Attachment';
    name: string;
    filePath: Buffer;
}

export interface IField {
    name: string;
    value: string;
}

export interface IRichEmbedMessage {
    type: 'RichEmbed';
    author?: {
        name: string;
        iconUrl: string;
    };
    color?: string;
    title?: string;
    url?: string;
    description?: string;
    fields?: IField[];
    timestamp?: Date;
    footer?: {
        iconUrl: string;
        text: string;
    };
    thumbnailUrl?: string;
    imageUrl?: string;
    fileUrlOrPath?: string;
}

export class DiscordNotifier extends ChatNotifier {
    name = NotifierName.Discord;

    private client: any;
    private channel: any;
    private loggedIn: boolean;

    constructor(token: string, channelName: string) {
        super();

        this.loggedIn = false;

        this.client = new Discord.Client();
        this.client.login(token);
        this.client.on('login', () => {
            this.loggedIn = true;
            this.channel = this.client.channels.find('name', channelName);
        });
    }

    async notify(message: string|ILocalFilesMessage|IRemoteFilesMessage|IRichEmbedMessage): Promise<void> {
        if(this.loggedIn) {
            if(typeof message === 'string') {
                await this.channel.send(message);
                return;
            }

            let sendMessage: any = null;
            switch(message.type) {
                case 'RemoteFiles':
                    sendMessage = {
                        files: message.fileUrls,
                    };
                    break;
                case 'LocalFiles':
                    sendMessage = {
                        files: [],
                    };
                    for(let i = 0; i < message.files.length; i++) { // for some reason, for in loop has wrong type annotation
                        const localFile: ILocalFile = message.files[i];
                        sendMessage.files.push({
                            attachment: localFile.filePath,
                            name: localFile.name,
                        });
                    }
                    break;
                case 'RichEmbed':
                    const data: any = {};
                    if(message.author) {
                        data.author = {
                            name: message.author.name,
                            icon_url: message.author.iconUrl,
                        };
                    }
                    if(message.color) {
                        data.color = message.color;
                    }
                    if(message.title) {
                        data.title = message.title;
                    }
                    if(message.url) {
                        data.url = message.url;
                    }
                    if(message.description) {
                        data.description = message.description;
                    }
                    if(message.fields) {
                        data.fields = message.fields;
                    }
                    if(message.timestamp) {
                        data.timestamp = message.timestamp;
                    }
                    if(message.footer) {
                        data.footer.icon_url = message.footer.iconUrl;
                        data.footer.text = message.footer.text;
                    }
                    if(message.thumbnailUrl) {
                        data.thumbnail = {
                            url: message.thumbnailUrl,
                        };
                    }
                    if(message.imageUrl) {
                        data.image = {
                            url: sendMessage.imageUrl,
                        };
                    }
                    if(message.fileUrlOrPath) {
                        data.file = message.fileUrlOrPath;
                    }
                    sendMessage = new Discord.RichEmbed(data);
                    break;
            }
            await this.channel.send(sendMessage);
        }
    }
}
