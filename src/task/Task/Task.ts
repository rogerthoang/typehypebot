import { BaseTask } from '../BaseTask/BaseTask';
import { Order } from '../../Order';
import { Bot, IStore } from '../../Bot';
import { IEarly, IMonitoring, IProduct, ITaskData, ISizes } from '../../config/ITasksConfig';
import { SearchItem } from '../BaseTask/step/SearchItem';
import { getProxiesArray, getProxyDetails, IProxy } from '@util/proxy';
import { getTimeFromString } from '@util/generic';

export abstract class Task extends BaseTask {
    static createTask(bot: Bot, store: IStore, taskData: ITaskData, orders: Order[]): BaseTask {
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
        );
    }
    public cartProxies: IProxy[];
    public sizes: ISizes;
    public product: IProduct;
    public searchItem: SearchItem = null;
    constructor(bot: Bot, store: IStore, storeDomain: string, monitoring: IMonitoring, proxy: IProxy, interval: number, startTime: number, extra: any, orders: Order[], product: IProduct, early: IEarly, sizes: ISizes, cartProxies: IProxy[], startInit: boolean = true) {
        super(bot, store, storeDomain, monitoring, proxy, interval, startTime, extra, orders, false);
        this.cartProxies = cartProxies;
        this.sizes = sizes;
        this.product = product;
        if(early && early.url) { // early URL is set which means we can set the search item early
            const searchItem = new store.searchItemClassReference(
                early.url,
                early.name,
            ); // class might have more parameters but these should be the only necessary ones
            if(early.extra !== undefined) {
                for(const key in extra) {
                    searchItem[key] = early.extra[key];
                }
            }
            this.searchItem = searchItem;
        }
        if(startInit) {
            this.startInit();
        }
    }
}
