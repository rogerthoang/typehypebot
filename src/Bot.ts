import { ICaptchaSolverService } from './captcha/ICaptchaSolverService';
import { INotifier, NotifierName, NotifierType } from './notify/INotifier';
import { BrowserManager } from './BrowserManager';
import { BaseTask, TaskConstructor } from './task/BaseTask';
import { CreateTasksSegment } from './init/CreateTasksSegment';
import { BrowserSessionsByEmail, CreatePayPalBrowserSessionsSegment } from './init/CreatePayPalBrowserSessionsSegment';
import { CreateNotifiersSegment } from './init/CreateNotifiersSegment';
import { CreateCaptchaSolverServicesSegment } from './init/CreateCaptchaSolverServicesSegment';
import { LoadConfigsSegment } from './init/LoadConfigsSegment';
import { CreateOrdersSegment } from './init/CreateOrdersSegment';
import { CreateAccountsSegment } from './init/CreateAccountsSegment';

export type TaskConstructorsByStoreReferenceName = {
    [storeReferenceName: string]: TaskConstructor;
};

export class Bot {
    public captchaSolverServices: ICaptchaSolverService[] = [];
    public notifiers: INotifier[] = [];
    public isUsingDeveloperMode = false;
    public browserManager: BrowserManager;

    private taskConstructorsByStoreReferenceName: TaskConstructorsByStoreReferenceName = {};
    private payPalBrowserSessionsByEmail: BrowserSessionsByEmail = {};
    private tasks: BaseTask[] = [];

    constructor() {
        this.browserManager = new BrowserManager();
        this.registerTasks();
        this.start();
    }

    protected registerTask(storeReferenceName: string, taskClassReference: { new(...args: any[]): BaseTask }) {
        this.taskConstructorsByStoreReferenceName[storeReferenceName] = taskClassReference;
    }

    protected registerTasks(): void {}

    private async start(): Promise<void> {
        await this.init();
        for(const task of this.tasks) {
            task.start();
        }
    }

    protected async init(): Promise<void> {
        try {
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

            const botConfigData = botConfig.body;
            const tokensConfigData = tokensConfig.body;
            const notifiersConfigData = notifiersConfig.body;
            const ordersConfigData = ordersConfig.body;
            const storesConfigData = storesConfig.body;
            const accountsConfigData = accountsConfig.body;
            const tasksConfigData = tasksConfig.body;

            console.log('Creating captcha solver services...');
            this.captchaSolverServices = new CreateCaptchaSolverServicesSegment(tokensConfigData).getResult();
            console.log('Finished creating captcha solver services\n');

            console.log('Creating notifiers...');
            this.notifiers = new CreateNotifiersSegment(notifiersConfigData, tokensConfigData).getResult();
            console.log('Finished creating notifiers\n');

            console.log('Creating orders...');
            const { orders, payPalPaymentConfigDataset } = new CreateOrdersSegment(ordersConfigData).getResult();
            console.log('Created orders\n');

            if(!botConfigData.developer.skipPayPalLogin) {
                console.log('Logging into PayPal account(s)...');
                this.payPalBrowserSessionsByEmail = await new CreatePayPalBrowserSessionsSegment(this.browserManager, payPalPaymentConfigDataset).getResult();
                console.log('Logged into PayPal account(s)\n');
            }

            console.log('Creating accounts...');
            const accounts = new CreateAccountsSegment(accountsConfigData).getResult();
            console.log('Created accounts\n');

            console.log('Creating tasks...');
            this.tasks = new CreateTasksSegment(this, tasksConfigData, accounts, orders, storesConfigData, this.taskConstructorsByStoreReferenceName).getResult();
            console.log('Created tasks\n');
        }catch(error) {
            console.log('Could not initialise bot', error);
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
