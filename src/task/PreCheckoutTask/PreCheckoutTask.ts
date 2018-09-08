import { BaseTask } from '../BaseTask/BaseTask';
import { Order } from '../../Order';
import { Bot, IStore } from '../../Bot';
import { IEarly, IMonitoring, IPreCheckoutTaskData, IProduct, ISizes } from '../../config/ITasksConfig';
import { Session } from '../../session/Session';
import { Task } from '../Task/Task';
import { Step } from '../BaseTask/step/Step';
import { getProxiesArray, getProxyDetails, IProxy } from '@util/proxy';
import { getTimeFromString } from '@util/generic';

export interface ITaskPreCheckout {
    proxies: IProxy[];
    sessionsPerOrder: number;
    delayWithoutProxies: number;
}

export abstract class PreCheckoutTask extends Task {
    static createTask(bot: Bot, store: IStore, taskData: IPreCheckoutTaskData, orders: Order[]): BaseTask {
        const preCheckout: ITaskPreCheckout = {
            proxies: getProxiesArray(taskData.preCheckout.proxies, bot.options.proxyFormat),
            sessionsPerOrder: taskData.preCheckout.sessionsPerOrder,
            delayWithoutProxies: taskData.preCheckout.delayWithoutProxies,
        };
        return new store.taskClassReference(
            bot,
            store,
            taskData.storeDomain,
            taskData.monitoring,
            taskData.proxy ? getProxyDetails(taskData.proxy, bot.options.proxyFormat) : null,
            taskData.interval,
            taskData.startTime ? getTimeFromString(taskData.startTime) : 0,
            taskData.extra ? taskData.extra : {},
            orders,
            taskData.product,
            taskData.early ? taskData.early : {},
            taskData.sizes,
            getProxiesArray(taskData.cartProxies, bot.options.proxyFormat),
            preCheckout,
        );
    }

    public preCheckout: ITaskPreCheckout;
    public preCheckoutSessions: {[orderId: number]: Session[]} = {};

    constructor(bot: Bot, store: IStore, storeDomain: string, monitoring: IMonitoring, proxy: IProxy, interval: number, startTime: number, extra: any, orders: Order[], product: IProduct, early: IEarly, sizes: ISizes, cartProxies: IProxy[], preCheckout: ITaskPreCheckout, startInit: boolean = true) {
        super(bot, store, storeDomain, monitoring, proxy, interval, startTime, extra, orders, product, early, sizes, cartProxies, false);
        this.preCheckout = preCheckout;
        if(startInit) {
            this.startInit();
        }
    }

    protected async doneInit(): Promise<void> {
        this.log('Getting pre-checkout sessions');
        await this.setPreCheckoutSessions();
        this.log('Finished setting pre-checkout settings');
        super.doneInit();
    }

    protected abstract getPreCheckoutStepClassReferences(): { new(...args: any[]): Step }[];

    private setPreCheckoutSessions(): Promise<void> {
        let resolve: () => void = null;
        const promise: Promise<void> = new Promise(_resolve => {
            resolve = _resolve;
        });
        const stepClassReferences: { new(...args: any[]): Step }[] = this.getPreCheckoutStepClassReferences();

        const nextStepFunction = (currentStepClassReference: { new(): Step }, proxy: IProxy, resultsByClassReference: any, currentStepResult: any): void => {
            let nextStepClassReference: any = null;
            resultsByClassReference[<any> currentStepClassReference] = currentStepResult;
            const values: any[] = Object.values(resultsByClassReference);
            const results: any = values.length === 0 ? {} : Object.assign({}, ...values);
            const currentStepClassReferenceIndex = stepClassReferences.indexOf(currentStepClassReference);
            if(currentStepClassReferenceIndex === stepClassReferences.length - 1) {
                if([].concat(...Object.values(this.preCheckoutSessions)).length === this.preCheckout.sessionsPerOrder * this.orders.length) {
                    resolve();
                }
                return;
            }
            nextStepClassReference = stepClassReferences[currentStepClassReferenceIndex + 1];
            this.log(nextStepClassReference.name);
            new nextStepClassReference(this, this.proxy, (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }) => {}, nextStepFunction, resultsByClassReference).run();
        };

        new stepClassReferences[0](this, this.proxy, (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }) => {}, nextStepFunction, {}).run();
        return promise;
    }
}
