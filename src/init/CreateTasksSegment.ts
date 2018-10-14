import { IInitSegment } from './IInitSegment';
import { TaskConfigData } from '../config/ITasksConfig';
import { BaseTask, ITaskData } from '../task/BaseTask';
import { getTimeFromString } from '@util/generic';
import { getProxy } from '@util/proxy';
import { Bot, TaskConstructorsByStoreReferenceName } from '../Bot';
import { StoresConfigData } from '../config/IStoresConfig';
import { Account } from '../config/Account';
import { Order } from '../config/Order';
import { Store } from '../config/Store';

export class CreateTasksSegment implements IInitSegment<BaseTask[]> {
    constructor(
        private bot: Bot,
        private tasksConfigData: TaskConfigData[],
        private accounts: Account[],
        private orders: Order[],
        private storesConfigDataByName: StoresConfigData,
        private taskConstructorsByStoreReferenceName: TaskConstructorsByStoreReferenceName,
    ) {}

    getResult() {
        const tasks: BaseTask[] = [];
        const storesByName: { [name: string]: Store } = {};

        for(const taskConfigData of this.tasksConfigData) {
            if(taskConfigData.active) {
                const { baseData } = taskConfigData;
                const { storeOptions } = baseData;

                if(storesByName[storeOptions.name] === undefined) {
                    storesByName[storeOptions.name] = Store.createFrom(this.storesConfigDataByName[storeOptions.name]);
                }

                const taskData: ITaskData = {
                    baseData: {
                        startTime: getTimeFromString(baseData.startTime),
                        mainProxy: getProxy(baseData.mainProxy),
                        account: this.accounts[baseData.account],
                        order: this.orders[baseData.order],
                        monitoring: baseData.monitoring,
                        store: storesByName[storeOptions.name],
                        region: baseData.storeOptions.region,
                        products: baseData.products,
                        interval: baseData.interval,
                    },
                    extendedData: taskConfigData.extendedData,
                    taskSpecificData: taskConfigData.taskSpecificData,
                };
                const taskClassReference = this.taskConstructorsByStoreReferenceName[baseData.storeOptions.name];
                tasks.push(new taskClassReference(this.bot, taskData));
            }
        }

        return tasks;
    }
}
