import { SearchItem } from './step/SearchItem';
import { IBaseTaskData } from '../../config/ITasksConfig';
import { IProxy, getMilliseconds, log, getProxyDetails, getTimeFromString } from '../../util/Utils';
import { Order } from '../../Order';
import { Bot, IStore } from '../../Bot';
import { Step } from './step/Step';
import { PaymentStep } from './step/payment/PaymentStep';

let taskId: number = 0;

export abstract class BaseTask {
    public id: number;
    public lastReRun: number;
    public mainUrl: string;
    public isMonitoring: boolean;
    public startDelay: number;
    public proxy: IProxy;
    public interval: number;
    public startTime: number;
    public extra: any;
    public orders: Order[];
    public searchItem: SearchItem;

    private finishedInit: boolean = false;
    private waitingToStart: boolean = true;

    constructor(public bot: Bot, public store: IStore, taskData: IBaseTaskData, orders: Order[], startInit: boolean = true) {
        this.id = taskId++;

        this.isMonitoring = taskData.monitoring.isMonitoring;
        this.startDelay = taskData.monitoring.startDelay;
        this.proxy = taskData.proxy ? getProxyDetails(taskData.proxy, bot.options.proxyFormat) : null;
        this.mainUrl = `http://www.${taskData.storeDomain}`;
        this.interval = taskData.interval;
        this.startTime = taskData.startTime ? getTimeFromString(taskData.startTime) : 0;
        this.extra = taskData.extra ? taskData.extra : {};
        this.orders = orders;

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

    protected abstract init(done?: () => void): void;
    protected abstract getStepClassReferences(): { new(): Step }[];
    protected abstract getInsertPaymentClassesAfterClassReference(): { new(): PaymentStep };
    protected abstract getPaymentClassReferences(): { new(): PaymentStep }[];

    async run(startStepClassReference: { new(): Step } = null): Promise<void> {
        if(!this.finishedInit) {
            this.waitingToStart = true;
            return;
        }

        this.lastReRun = getMilliseconds();

        const stepClassReferences = this.getStepClassReferences();
        const insertPaymentClassesAfterClassReference = this.getInsertPaymentClassesAfterClassReference();
        const paymentClassReferences = this.getPaymentClassReferences();

        const previousStepFunction = (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }): void => {
            this.lastReRun = getMilliseconds();

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
        let realFile: string = file;
        if(file === undefined) {
            realFile = this.store.name + '_' + this.id + '.txt';
        }
        log(`[${this.store.name}][${this.id}] ${string}`, realFile);
    }

    async getCaptchaResponseToken(url: string, siteKey: string): Promise<string> {
        return await this.bot.getFastestGeneratedCaptchaResponseToken(url, siteKey);
    }
}
