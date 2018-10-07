import { ISearchItemData, SearchItem } from './step/SearchItem';
import { Bot } from '../Bot';
import { Step } from './step/Step';
import { IProxy } from '@util/proxy';
import { log } from '@util/log';
import { IProductData, ITaskData } from '../config/ITasksConfig';
import { IAccountData } from '../config/IAccountsConfig';
import { IStoreData } from '../config/IStoresConfig';
import { compensateInterval } from '@util/timing';
import { Order } from '../Order';
import { PaymentStep } from './step/payment/PaymentStep';
import { StepConstructor, StepManager } from './StepManager';

let taskId = 0;

export type TaskConstructor = { new(bot: Bot, taskData: ITaskData, startInit?: boolean): BaseTask };

export type SingleStep = StepConstructor;
export type ParallelSteps = StepConstructor[];
export type ChoiceSteps = { [choice: string]: StepConstructor[] };

export type Steps = (SingleStep | ParallelSteps | ChoiceSteps)[];

export type StepsByBreakpoint = { [breakpoint: string]: ParallelSteps | ChoiceSteps };

export enum StepBreakpoint {
    ProductsBreakpoint,
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

    public stepManager: StepManager;

    private startedTime = 0;
    private hasStarted = false;

    constructor(public bot: Bot, taskData: ITaskData, startInit = true) {
        this.id = taskId++;

        const baseData = taskData.baseData;

        this.stepManager = new StepManager(this, this.getSteps()); // todo: use right steps

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
                this.start();
            }, this.startTime - Date.now());
        });
    }

    protected abstract init(done?: () => void): void;

    protected abstract getSearchItemClassReference(): { new(data: ISearchItemData): SearchItem };

    protected abstract getStepsWithBreakpoints(): (SingleStep | StepBreakpoint)[];
    protected abstract getProductSteps(): ParallelSteps;
    protected abstract getPaymentSteps(): ChoiceSteps;

    protected getStepsByBreakpoint(): StepsByBreakpoint {
        const stepsByBreakpoint: { [breakpoint: string]: ParallelSteps | ChoiceSteps } = {};
        stepsByBreakpoint[StepBreakpoint.ProductsBreakpoint] = this.getProductSteps();
        stepsByBreakpoint[StepBreakpoint.PaymentsBreakpoint] = this.getPaymentSteps();
        return stepsByBreakpoint;
    }

    protected getSteps(): Steps {
        const steps: Steps = [];

        const stepsWithBreakpoints = this.getStepsWithBreakpoints();
        const stepsByBreakpoint = this.getStepsByBreakpoint();
        const breakpoints = Object.keys(stepsWithBreakpoints);

        for(const step of stepsWithBreakpoints) {
            const index = breakpoints.indexOf(String(<StepBreakpoint> step));
            if(index > -1) { // breakpoint
                steps.push(stepsByBreakpoint[String(<StepBreakpoint> step)]);
            }else {
                steps.push(<SingleStep> step);
            }
        }

        return steps;
    }

    async start(): Promise<void> {
        if(!this.hasStarted) {
            this.startedTime = Date.now();
            this.hasStarted = true;
            // todo: start running steps
        }
    }

    log(string: string, file?: string): void {
        let realFile = file;

        if(file === undefined) {
            realFile = `${this.id}_${this.store.name}.txt`;
        }

        log(`[${this.id}][${this.store.name}] ${string}`, realFile);
    }

    getCaptchaResponseToken(url: string, siteKey: string): Promise<string> {
        let alreadyResolved = false;
        let finished = null;

        for(const captchaSolverService of this.bot.captchaSolverServices) {
            captchaSolverService.getResponseToken(url, siteKey).then((responseToken: string) => {
                if(!alreadyResolved) {
                    alreadyResolved = true;
                    finished(responseToken);
                }
            });
        }

        return new Promise(resolve => finished = resolve);
    }
}
