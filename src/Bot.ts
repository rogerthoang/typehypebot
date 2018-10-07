import { Order } from './Order';
import { IPayPalPaymentData, PaymentMethod } from './config/IOrdersConfig';
import { DigitalOcean } from '@util/DigitalOcean';
import { ICaptchaSolverService } from './captcha/ICaptchaSolverService';
import { INotifier, NotifierName, NotifierType } from './notify/INotifier';
import { BrowserManager } from './BrowserManager';
import { BaseTask, TaskConstructor } from './task/BaseTask';
import { CreateTasksSegment } from './init/CreateTasksSegment';
import { BrowserSessionsByEmail, CreatePayPalBrowserSessionsSegment } from './init/CreatePayPalBrowserSessionsSegment';
import { CreateNotifiersSegment } from './init/CreateNotifiersSegment';
import { CreateCaptchaSolverServicesSegment } from './init/CreateCaptchaSolverServicesSegment';
import { LoadConfigsSegment } from './init/LoadConfigsSegment';

export type TaskConstructorsByStoreReferenceName = {
    [storeReferenceName: string]: TaskConstructor;
};

export class Bot {
    public digitalOcean: DigitalOcean;
    public captchaSolverServices: ICaptchaSolverService[] = [];
    public notifiers: INotifier[] = [];
    public isUsingDeveloperMode: boolean = false;
    public browserManager: BrowserManager;

    private taskConstructorsByStoreReferenceName: TaskConstructorsByStoreReferenceName = {};
    private payPalBrowserSessionsByEmail: BrowserSessionsByEmail = {};
    private tasks: BaseTask[] = [];

    constructor() {
        this.browserManager = new BrowserManager();
        this.start();
    }

    protected registerTask(storeReferenceName: string, taskClassReference: { new(...args: any[]): BaseTask }) {
        this.taskConstructorsByStoreReferenceName[storeReferenceName] = taskClassReference;
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

            console.log('Loading configs...');
            const {
                botConfig,
                tokensConfig,
                notifiersConfig,
                accountsConfig,
                ordersConfig,
                storesConfig,
                tasksConfig,
            } = new LoadConfigsSegment(`${__dirname}/..config`).getResult();
            console.log('Loaded configs\n');

            const botData = botConfig.body;
            const tokensData = tokensConfig.body;
            const notifiersData = notifiersConfig.body;
            const ordersData = ordersConfig.body;
            const storesData = storesConfig.body;
            const accountsData = accountsConfig.body;
            const tasksData = tasksConfig.body;

            console.log('Creating captcha solver services...');
            this.captchaSolverServices = new CreateCaptchaSolverServicesSegment(tokensData).getResult();
            console.log('Finished creating captcha solver services\n');

            console.log('Creating notifiers...');
            this.notifiers = new CreateNotifiersSegment(notifiersData, tokensData).getResult();
            console.log('Finished creating notifiers\n');

            const orders: Order[] = [];
            const finishedEmails: string[] = [];
            const payPalPaymentDataset: IPayPalPaymentData[] = [];
            console.log('Creating orders...');

            for(const orderData of ordersData) {
                if(orderData.active) {
                    if(orderData.payment.method === PaymentMethod.PayPal) {
                        const paymentData = <IPayPalPaymentData> orderData.payment.data;

                        if(finishedEmails.indexOf(paymentData.authentication.data.email) !== -1) {
                            finishedEmails.push(paymentData.authentication.data.email);
                            payPalPaymentDataset.push(paymentData);
                        }
                    }

                    orders.push(Order.createOrder(orderData));
                }
            }
            console.log('Created orders\n');

            if(!botData.developer.skipPayPalLogin) {
                console.log('Logging into PayPal account(s)...');
                this.payPalBrowserSessionsByEmail = await new CreatePayPalBrowserSessionsSegment(this.browserManager, payPalPaymentDataset).getResult();
                console.log('Logged into PayPal account(s)\n');
            }

            console.log('Creating tasks...');
            this.tasks = new CreateTasksSegment(this, tasksData, accountsData, orders, storesData, this.taskConstructorsByStoreReferenceName).getResult();
            console.log('Created tasks\n');
        }catch(error) {
            console.log('Could not load config file(s)', error);
        }
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
}
