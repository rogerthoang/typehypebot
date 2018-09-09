import { Session } from './session/Session';
import { RemoteServer } from './remote/RemoteServer';
import { BaseTask } from './task/BaseTask/BaseTask';
import { Order } from './Order';
import { IBotConfig, IBotOptions } from './config/IBotConfig';
import { loadConfig } from './config/IConfig';
import { IOrder, IOrdersConfig, IPayPalPaymentData, PaymentMethod } from './config/IOrdersConfig';
import { ITasksConfig } from './config/ITasksConfig';
import { AntiCaptchaCaptchaSolverService } from './captcha/AntiCaptchaCaptchaSolverService';
import { CaptchaSolutionsCaptchaSolverService } from './captcha/CaptchaSolutionsCaptchaSolverService';
import { TwoCaptchaCaptchaSolverService } from './captcha/2CaptchaCaptchaSolverService';
import { ITokens, ITokensConfig } from './config/ITokensConfig';
import { DigitalOcean } from '@util/DigitalOcean';
import { ICaptchaSolverService } from './captcha/ICaptchaSolverService';
import { INotifier, NotifierName, NotifierType } from './notify/INotifier';
import { NexmoNotifier } from './notify/sms/NexmoNotifier';
import { INotifiersConfig } from './config/INotifiersConfig';
import { TwilioNotifier } from './notify/sms/TwilioNotifier';
import { DiscordNotifier } from './notify/chat/DiscordNotifier';
import { SlackNotifier } from './notify/chat/SlackNotifier';
import { TwitterNotifier } from './notify/social/TwitterNotifier';
import * as puppeteer from 'puppeteer';
import { SearchItem } from './task/BaseTask/step/SearchItem';

export interface ITaskConstructionData {
    taskClass: { new(...args: any[]): BaseTask };
    searchItemClass: { new(...args: any[]): SearchItem };
}

export interface IStoreData {
    name: string;
    countries?: string[];
}

export interface IStore extends IStoreData {
    id: number;
}

const taskConstructionData: { [storeName: string]: ITaskConstructionData } = {};
const stores: { [storeName: string]: IStore } = {};
let storeId: number = 0;

export class Bot {
    public browser: puppeteer.Browser;
    public options: IBotOptions;
    public tokens: ITokens;
    public digitalOcean: DigitalOcean;
    public captchaSolverServices: ICaptchaSolverService[] = [];
    public notifiers: INotifier[];
    public ordersById: {[id: number]: Order};
    public isUsingDeveloperMode: boolean;
    public sessions: Session[] = [];

    private payPalBrowserContextsByEmail: {[email: string]: puppeteer.BrowserContext} = {};
    private tasks: BaseTask[] = [];
    private remoteServer: RemoteServer;

    constructor() {
        this.remoteServer = null;
        this.options = null;
        this.isUsingDeveloperMode = null;
        this.start();
    }

    protected registerTask(storeData: IStoreData, taskClass: { new(...args: any[]): BaseTask }, searchItemClass: { new(...args: any[]): SearchItem }): void {
        taskConstructionData[storeData.name] = {
            taskClass,
            searchItemClass,
        };
        stores[storeData.name] = {
            id: storeId++,
            ...storeData,
        };
    }

    protected registerTasks(): void {}

    private async start(): Promise<void> {
        await this.init();
        for(const task of this.tasks) {
            task.run();
        }
    }

    protected async init(): Promise<void> {
        try {
            console.log('Registering tasks...');
            this.registerTasks();
            console.log('Registered tasks\n');

            console.log('Loading bot.json...');
            const botConfig = <IBotConfig> loadConfig(`${__dirname}/..config/bot.json`);
            const botData = botConfig.body;
            this.options = botData;
            console.log('Loaded bot.json\n');

            console.log('Loading tokens.json...');
            const tokensConfig = <ITokensConfig> loadConfig(`${__dirname}/../config/tokens.json`);
            this.tokens = tokensConfig.body;
            console.log('Loaded tokens.json\n');

            this.digitalOcean = null;
            if(this.tokens.serverProviders.DigitalOcean) {
                this.digitalOcean = new DigitalOcean(this.tokens.serverProviders.DigitalOcean);
            }

            this.captchaSolverServices = [];
            console.log('Creating captcha solver services...');
            if(this.tokens.captchaSolvers.AntiCaptcha) {
                this.captchaSolverServices.push(new AntiCaptchaCaptchaSolverService(this.tokens.captchaSolvers.AntiCaptcha));
                console.log('Created AntiCaptchaSolverService');
            }
            if(this.tokens.captchaSolvers.CaptchaSolutions) {
                this.captchaSolverServices.push(new CaptchaSolutionsCaptchaSolverService(this.tokens.captchaSolvers.CaptchaSolutions.api, this.tokens.captchaSolvers.CaptchaSolutions.secret));
                console.log('Created CaptchaSolutionsCaptchaSolverService');
            }
            if(this.tokens.captchaSolvers.TwoCaptcha) {
                this.captchaSolverServices.push(new TwoCaptchaCaptchaSolverService(this.tokens.captchaSolvers.TwoCaptcha));
                console.log('Created TwoCaptchaSolverService');
            }
            console.log('Finished creating captcha solver services\n');

            console.log('Loading notifier.json...');
            const notifiersConfig = <INotifiersConfig> loadConfig(`${__dirname}/../config/notifiers.json`);
            const notifiers = notifiersConfig.body;
            console.log('Loaded notifier.json\n');

            this.notifiers = [];
            console.log('Creating notifiers...');
            if(this.tokens.notifiers.sms.Nexmo) {
                this.notifiers.push(new NexmoNotifier(this.tokens.notifiers.sms.Nexmo.key, this.tokens.notifiers.sms.Nexmo.secret, notifiers.sms.Nexmo.toNumber, notifiers.sms.Nexmo.fromNumber, notifiers.sms.Nexmo.alphanumericName));
                console.log('Created NexmoNotifier');
            }
            if(this.tokens.notifiers.sms.Twilio) {
                this.notifiers.push(new TwilioNotifier(this.tokens.notifiers.sms.Twilio.sid, this.tokens.notifiers.sms.Twilio.authToken, notifiers.sms.Twilio.toNumber, notifiers.sms.Twilio.fromNumber, notifiers.sms.Twilio.alphanumericName));
                console.log('Created TwilioNotifier');
            }
            if(this.tokens.notifiers.chat.Discord) {
                this.notifiers.push(new DiscordNotifier(this.tokens.notifiers.chat.Discord.token, notifiers.chat.Discord.channelId));
                console.log('Created DiscordNotifier');
            }
            if(this.tokens.notifiers.chat.Slack) {
                this.notifiers.push(new SlackNotifier(this.tokens.notifiers.chat.Slack.token, notifiers.chat.Slack.channelName, notifiers.chat.Slack.botName));
                console.log('Created SlackNotifier');
            }
            if(this.tokens.notifiers.social.Twitter) {
                this.notifiers.push(new TwitterNotifier(this.tokens.notifiers.social.Twitter.consumerKey, this.tokens.notifiers.social.Twitter.consumerSecret, this.tokens.notifiers.social.Twitter.accessTokenKey, this.tokens.notifiers.social.Twitter.accessTokenSecret));
                console.log('Created TwitterNotifier');
            }
            console.log('Finished creating notifiers\n');

            // console.log('Starting remote server...');
            // this.remoteServer = new RemoteServer(botData.remoteServerPort);
            // console.log('Started remote server\n');

            console.log('Loading orders.json...');
            const ordersConfig = <IOrdersConfig> loadConfig(`${__dirname}/../config/orders.json`);
            const ordersData = ordersConfig.body;
            console.log('Loaded orders.json\n');

            const ordersById: {[id: number]: Order} = {};
            const ordersDataByPayPalEmail: {[payPalEmail: string]: IOrder[]} = {};
            const passwordsByPayPalEmail: {[payPalEmail: string]: string} = {};
            console.log('Creating orders...');
            for(let i = 0; i < ordersData.length; i++) {
                const orderData = ordersData[i];

                if(orderData.active) {
                    if(orderData.payment.method === PaymentMethod.PayPal) {
                        const paymentData = <IPayPalPaymentData> orderData.payment.data;
                        if(ordersDataByPayPalEmail[paymentData.authentication.data.email] === undefined) {
                            ordersDataByPayPalEmail[paymentData.authentication.data.email] = [];
                        }
                        ordersDataByPayPalEmail[paymentData.authentication.data.email].push(orderData);
                        passwordsByPayPalEmail[paymentData.authentication.data.email] = paymentData.authentication.data.password;
                    }
                }

                ordersById[i] = Order.createOrder(orderData);
            }
            this.ordersById = ordersById;
            console.log('Created orders\n');

            this.browser = await puppeteer.launch({ headless: this.options.developer.isHeadlessBrowser });
            if(!botData.developer.skipPayPalLogin) {
                const promises: Promise<void>[] = [];

                for(const email in ordersDataByPayPalEmail) {
                    console.log(`Logging in with PayPal ${email}...`);

                    promises.push(new Promise(async resolve => {
                        const context = await this.createIncognitoBrowserContext();
                        const page = await context.newPage();
                        const password = passwordsByPayPalEmail[email];

                        await page.goto('https://www.paypal.com/signin');
                        await page.waitForSelector('#login');
                        await page.evaluate((email: string, password: string) => {
                            (<HTMLInputElement> document.getElementById('email')).value = email;
                            (<HTMLInputElement> document.getElementById('password')).value = password;
                        }, email, password);
                        await page.click('button#btnNext');

                        const interval = setInterval(async() => {
                            try {
                                if(await page.evaluate(() => !document.getElementsByClassName('forgotLink')[0].classList.contains('hide'))) {
                                    await page.click('#btnLogin');
                                }
                            }catch(error) {}

                            if(await page.$('.vx_mainContent.contents') !== null || await page.$('#summary')) {
                                console.log(`Logged into PayPal ${email}`);
                                this.payPalBrowserContextsByEmail[email] = context;
                                resolve();
                                clearInterval(interval);
                            }
                        }, 500);

                        setInterval(async() => {
                            if(await page.$('button.vx_btn.extendSession') !== null) {
                                try {
                                    await page.click('button.vx_btn.extendSession');
                                }catch(error) {}
                            }
                        }, 30000);
                    }));
                }

                await Promise.all(promises);
                console.log('Logged into PayPal account(s)\n');
            }

            console.log('Loading tasks.json...');
            const tasksConfig = <ITasksConfig> loadConfig(`${__dirname}/../config/tasks.json`);
            const tasksData = tasksConfig.body;
            console.log('Loaded tasks.json\n');

            console.log('Creating tasks...');
            for(let i = 0; i < tasksData.length; i++) {
                const taskData: any = tasksData[i];
                const orders: Order[] = [];

                for(let x = 0; x < taskData.orders.length; x++) {
                    const orderId: number = taskData.orders[x];
                    orders.push(ordersById[orderId]);
                }

                const store = stores[taskData.storeName];

                this.tasks.push(new taskConstructionData[taskData.storeName].taskClass(this, store, taskData, orders));
            }
        }catch(error) {
            console.log('Could not load config file(s)', error);
        }
    }

    getFastestGeneratedCaptchaResponseToken(url: string, siteKey: string): Promise<string> {
        let alreadyResolved = false;
        let resolve = null;

        for(const captchaSolverService of this.captchaSolverServices) {
            captchaSolverService.getResponseToken(url, siteKey).then((responseToken: string) => {
                if(!alreadyResolved) {
                    alreadyResolved = true;
                    resolve(responseToken);
                }
            });
        }

        return new Promise(actualResolve => {
            resolve = actualResolve;
        });
    }

    async createIncognitoBrowserContext(): Promise<puppeteer.BrowserContext> {
        return await this.browser.createIncognitoBrowserContext();
    }

    async notify(message: any, identifiers?: {type?: NotifierType, name?: NotifierName}): Promise<void> {
        const notifiers: INotifier[] = [];

        if(identifiers === undefined) {
            notifiers.push(...this.notifiers);
        }else {
            for(const notifier of this.notifiers) {
                if(identifiers.type) {
                    if(notifier.type !== identifiers.type) {
                        continue;
                    }
                }

                if(identifiers.name) {
                    if(notifier.name !== identifiers.name) {
                        continue;
                    }
                }

                notifiers.push(notifier);
            }
        }

        const promises: Promise<void>[] = [];
        for(const notifier of notifiers) {
            promises.push(notifier.notify(message));
        }
        await Promise.all(promises);
    }

    getPayPalBrowserContext(email: string): puppeteer.BrowserContext {
        return this.payPalBrowserContextsByEmail[email];
    }
}
