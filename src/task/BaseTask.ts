import { ISearchItemData, SearchItem, SearchItemConstructor } from './step/SearchItem';
import { Bot } from '../Bot';
import { IProxy } from '@util/proxy';
import { log } from '@util/log';
import {
    MonitoringConfigData,
    ProductConfigData,
} from '../config/ITasksConfig';
import { compensateInterval } from '@util/timing';
import { StartOptions, StepConstructor, StepManager } from '../manager/StepManager';
import { Account } from '../config/Account';
import { StoreConfigData } from '../config/IStoresConfig';
import { Order } from '../config/Order';

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

export interface ITaskData {
    baseData: {
        startTime: number;
        mainProxy: IProxy;
        account: Account;
        order: Order;
        monitoring: MonitoringConfigData;
        store: StoreConfigData;
        region: string;
        products: ProductConfigData[];
        interval: number;
    };
    extendedData: any;
    taskSpecificData: any;
}

export abstract class BaseTask {
    public id: number;
    public mainUrl: string;
    public isMonitoring: boolean;
    public startDelay: number;
    public mainProxy: IProxy;
    public interval: number;
    public startTime: number;
    public store: StoreConfigData;
    public region: string;
    public account: Account;
    public order: Order;
    public products: ProductConfigData[];
    public searchItems: SearchItem[] = [];

    public stepManager: StepManager;

    private startedTime = 0;
    private running = false;

    protected startOptions: StartOptions = {};

    constructor(public bot: Bot, taskData: ITaskData, startInit = true) {
        this.id = taskId++;

        const { baseData } = taskData;

        this.stepManager = new StepManager(this, this.getSteps());

        this.startTime = baseData.startTime;
        this.mainProxy = baseData.mainProxy;
        this.account = baseData.account;
        this.isMonitoring = baseData.monitoring.isMonitoring;
        this.store = baseData.store;
        this.region = baseData.region;
        this.startDelay = this.isMonitoring ? baseData.monitoring.startDelay : 0;
        this.mainUrl = `http://www.${baseData.store.domainsByRegion[baseData.region]}`;
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

    protected abstract getSearchItemClassReference(): SearchItemConstructor;

    protected abstract getStepsWithBreakpoints(): (SingleStep | StepBreakpoint)[];
    protected abstract getProductSteps(): ParallelSteps;
    protected abstract getPaymentSteps(): ChoiceSteps;

    protected getStepsByBreakpoint(): StepsByBreakpoint {
        const stepsByBreakpoint: { [breakpoint: string]: ParallelSteps | ChoiceSteps } = {};
        stepsByBreakpoint[StepBreakpoint.ProductsBreakpoint] = this.getProductSteps();
        stepsByBreakpoint[StepBreakpoint.PaymentsBreakpoint] = this.getPaymentSteps();
        return stepsByBreakpoint;
    }

    private getSteps(): Steps {
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

    start(): void {
        if(!this.running) {
            this.startedTime = Date.now();
            this.running = true;
            this.stepManager.startStep(this.startOptions);
        }
    }

    stop(): void {
        if(this.running) {
            this.running = false;
            this.stepManager.halt = true;
        }
    }

    log(string: string, file?: string): void {
        let realFile = file;

        if(file === undefined) {
            realFile = `${this.id}_${this.store.name}.txt`;
        }

        log(`[${this.id}][${this.store.name}] ${string}`, realFile);
    }

    getCaptchaResponseToken(url: string, siteKey: string): Promise<string> { // todo: not really relevant here, move to step class
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
