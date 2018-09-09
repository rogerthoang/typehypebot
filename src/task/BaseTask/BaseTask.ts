import { ISearchItemData, SearchItem } from './step/SearchItem';
import { Bot } from '../../Bot';
import { Step } from './step/Step';
import { PaymentStep } from './step/payment/PaymentStep';
import { IProxy } from '@util/proxy';
import { log } from '@util/log';
import { IProductData, ITaskData } from '../../config/ITasksConfig';
import { IAccountData } from '../../config/IAccountsConfig';
import { IStoreData } from '../../config/IStoresConfig';
import { Order } from '../../Order';

let taskId = 0;

export abstract class BaseTask {
    public id: number;
    public lastReRun: number;
    public mainUrl: string;
    public isMonitoring: boolean;
    public startDelay: number;
    public mainProxy: IProxy;
    public interval: number;
    public startTime: number;
    public store: IStoreData;
    public account: IAccountData;
    public products: IProductData[];
    public orders: Order[];
    public searchItems: SearchItem[] = [];

    private finishedInit = false;
    private waitingToStart = true;

    constructor(public bot: Bot, taskData: ITaskData, startInit = true) {
        this.id = taskId++;

        const baseData = taskData.baseData;

        this.startTime = baseData.startTime;
        this.mainProxy = baseData.mainProxy;
        this.account = baseData.account;
        this.isMonitoring = baseData.monitoring.isMonitoring;
        this.store = baseData.store;
        this.startDelay = this.isMonitoring ? baseData.monitoring.startDelay : 0;
        this.mainUrl = `http://www.${baseData.store.domainsByRegion[baseData.storeRegion]}`;
        this.interval = baseData.interval;
        this.orders = baseData.orders;
        this.startTime = baseData.startTime;
        this.products = baseData.products;

        for(const product of baseData.products) {
            const searchItemClassReference = this.getSearchItemClassReference();
            this.searchItems.push(new searchItemClassReference(product.early));
        }

        if(startInit) {
            this.startInit();
        }
    }

    protected isHTTPS(): void {
        this.mainUrl = this.mainUrl.replace('http://', 'https://');
    }

    protected startInit(): void {
        this.init(() => {
            this.doneInit();
        });
    }

    protected doneInit(): void {
        this.finishedInit = true;
        this.log('Finished initialisation');
        if(this.waitingToStart) {
            this.log('Running task');
            this.run();
        }
    }

    protected abstract getSearchItemClassReference(): { new(data: ISearchItemData): SearchItem };
    protected abstract init(done?: () => void): void;
    protected abstract getStepClassReferences(): { new(): Step }[];
    protected abstract getInsertPaymentClassesAfterClassReference(): { new(): PaymentStep };
    protected abstract getPaymentClassReferences(): { new(): PaymentStep }[];

    async run(startStepClassReference: { new(): Step } = null): Promise<void> {
        if(!this.finishedInit) {
            this.waitingToStart = true;
            return;
        }

        this.lastReRun = Date.now();

        const stepClassReferences = this.getStepClassReferences();
        const insertPaymentClassesAfterClassReference = this.getInsertPaymentClassesAfterClassReference();
        const paymentClassReferences = this.getPaymentClassReferences();

        const previousStepFunction = (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }): void => {
            this.lastReRun = Date.now();

            const realPreviousStepClassReference: { new(...args: any[]): Step } = previousStepClassReference === undefined ? (stepClassReferences[stepClassReferences.indexOf(currentStepClassReference) - 1] || stepClassReferences[0]) : previousStepClassReference;
            const previousStepClassReferenceIndex: number = stepClassReferences.indexOf(previousStepClassReference);

            let index: number = 0;
            for(const stepClassReference in resultsByClassReference) {
                if(index++ >= previousStepClassReferenceIndex) {
                    delete resultsByClassReference[stepClassReference];
                }
            }

            this.log(realPreviousStepClassReference.name);
            new realPreviousStepClassReference(self, previousStepFunction, nextStepFunction, resultsByClassReference).run();
        };

        const nextStepFunction = (currentStepClassReference: { new(...args: any[]): Step }, proxy: IProxy, resultsByClassReference: any, currentStepResult: any): void => {
            let nextStepClassReference: { new(...args: any[]): Step } = null;
            resultsByClassReference[<any> currentStepClassReference] = currentStepResult; // fix <any> later

            const values: any[] = Object.values(resultsByClassReference);
            const results: any = values.length === 0 ? {} : Object.assign({}, ...values);
            const currentStepClassReferenceIndex = stepClassReferences.indexOf(currentStepClassReference);

            if(currentStepClassReference.name === insertPaymentClassesAfterClassReference.name) {
                const paymentMethod: string = results.order.payment.method;
                const newPaymentClassReferences: { new(...args: any[]): Step }[] = paymentClassReferences[paymentMethod];

                if(newPaymentClassReferences.length === 0) {
                    nextStepClassReference = stepClassReferences[currentStepClassReferenceIndex + 1];
                }else {
                    nextStepClassReference = newPaymentClassReferences[0];
                }
            }else {
                if(currentStepClassReferenceIndex === -1) {
                    // probably payment class
                    const paymentMethod: string = results.order.payment.method;
                    const newPaymentClassReferences: any[] = paymentClassReferences[paymentMethod];

                    nextStepClassReference = newPaymentClassReferences[newPaymentClassReferences.indexOf(currentStepClassReference) + 1];

                    if(nextStepClassReference === undefined) { // current step class is the last payment class
                        nextStepClassReference = stepClassReferences[stepClassReferences.indexOf(insertPaymentClassesAfterClassReference) + 1];
                    }
                }else {
                    nextStepClassReference = stepClassReferences[currentStepClassReferenceIndex + 1];
                }
            }
            if(nextStepClassReference === undefined) {
                return;
            }
            this.log(nextStepClassReference.name);
            new nextStepClassReference(this, proxy, previousStepFunction, nextStepFunction, resultsByClassReference).run();
        };

        const firstStepClassReference: { new(...args: any[]): Step } = stepClassReferences[startStepClassReference === null ? 0 : stepClassReferences.indexOf(startStepClassReference)];
        this.log(firstStepClassReference.name);
        new firstStepClassReference(this, this.proxy, previousStepFunction, nextStepFunction, {}).run();
    }

    log(string: string, file?: string): void {
        let realFile = file;
        if(file === undefined) {
            realFile = `${this.store.name}_${this.id}.txt`;
        }
        log(`[${this.store.name}][${this.id}] ${string}`, realFile);
    }

    async getCaptchaResponseToken(url: string, siteKey: string): Promise<string> {
        return await this.bot.getFastestGeneratedCaptchaResponseToken(url, siteKey);
    }
}
