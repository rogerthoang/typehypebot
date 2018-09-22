import { ISearchItemData, SearchItem } from './step/SearchItem';
import { Bot } from '../../Bot';
import { Step } from './step/Step';
import { IProxy } from '@util/proxy';
import { log } from '@util/log';
import { IProductData, ITaskData } from '../../config/ITasksConfig';
import { IAccountData } from '../../config/IAccountsConfig';
import { IStoreData } from '../../config/IStoresConfig';
import { Order } from '../../Order';
import { compensateInterval } from '@util/timing';

let taskId = 0;

export enum StepBreakpoint {
    ProductsBreakpoint = 0,
    PaymentsBreakpoint,
}

export abstract class BaseTask {
    public id: number;
    public mainUrl: string;
    public isMonitoring: boolean;
    public startDelay: number;
    public mainProxy: IProxy;
    public interval: number;
    public startTime: number;
    public store: IStoreData;
    public account: IAccountData;
    public order: Order;
    public products: IProductData[];
    public searchItems: SearchItem[] = [];

    public firstRun = 0;
    public lastRun = 0;
    public lastReRun = 0;

    private hasStarted = false;

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
        this.order = baseData.order;
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
        this.init(() => this.doneInit());
    }

    protected doneInit(): void {
        this.log('Finished initialisation');

        setTimeout(() => {
            compensateInterval(() => {
                this.log('Starting task');
                this.run();
            }, this.startTime - Date.now());
        });
    }

    protected abstract init(done?: () => void): void;

    protected abstract getSearchItemClassReference(): { new(data: ISearchItemData): SearchItem };

    protected abstract getSteps(): ({ new(...args: any[]): Step } | StepBreakpoint)[];
    protected abstract getProductSteps(): { new(...args: any[]): Step }[];
    protected abstract getPaymentSteps(): { new(...args: any[]): Step }[];

    protected getStepsByBreakpoint(): { [breakpoint: number]: { new(...args: any[]): Step }[] } {
        const stepsByBreakpoint: { [breakpoint: number]: { new(...args: any[]): Step }[] } = {};
        stepsByBreakpoint[StepBreakpoint.PaymentsBreakpoint] = this.getPaymentSteps();
        stepsByBreakpoint[StepBreakpoint.ProductsBreakpoint] = this.getProductSteps();

        return stepsByBreakpoint;
    }

    async run(): Promise<void> {
        if(!this.hasStarted) {
            this.firstRun = Date.now();
            this.hasStarted = true;
        }else {
            this.lastRun = Date.now();
        }

        const firstStep = this.getSteps()[0];
        const stepsByBreakpoint = this.getStepsByBreakpoint();
        if(Number.isInteger(<number> firstStep)) { // is breakpoint
            const breakpointStep = stepsByBreakpoint[<number> firstStep][0];

            new breakpointStep(this, this.mainProxy, {}, [0, 0], this.getSteps(), stepsByBreakpoint);
        }else {
            new (<{ new(...args: any[]): Step }> firstStep)(this, this.mainProxy, {}, [0, 0], this.getSteps(), stepsByBreakpoint);
        }
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
