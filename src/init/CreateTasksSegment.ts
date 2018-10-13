import { IInitSegment } from './IInitSegment';
import { TaskConfigData } from '../config/ITasksConfig';
import { BaseTask, ITaskData } from '../task/BaseTask';
import { getTimeFromString } from '@util/generic';
import { getProxy } from '@util/proxy';
import { Bot, TaskConstructorsByStoreReferenceName } from '../Bot';
import { StoresConfigData } from '../config/IStoresConfig';
import { Account } from '../config/Account';
import { Order } from '../config/Order';

export class CreateTasksSegment implements IInitSegment<BaseTask[]> {
    constructor(
        private bot: Bot,
        private tasksConfigData: TaskConfigData[],
        private accounts: Account[],
        private orders: Order[],
        private storesByReferenceName: StoresConfigData,
        private taskConstructorsByStoreReferenceName: TaskConstructorsByStoreReferenceName,
    ) {}

    getResult() {
        const tasks: BaseTask[] = [];

        for(const taskConfigData of this.tasksConfigData) {
            if(taskConfigData.active) {
                const { baseData } = taskConfigData;
                const taskData: ITaskData = {
                    baseData: {
                        startTime: getTimeFromString(baseData.startTime),
                        mainProxy: getProxy(baseData.mainProxy),
                        account: this.accounts[baseData.account],
                        order: this.orders[baseData.order],
                        monitoring: baseData.monitoring,
                        store: this.storesByReferenceName[baseData.storeOptions.referenceName],
                        storeRegion: baseData.storeOptions.region,
                        products: baseData.products,
                        interval: baseData.interval,
                    },
                    extendedData: taskConfigData.extendedData,
                    taskSpecificData: taskConfigData.taskSpecificData,
                };
                const taskClassReference = this.taskConstructorsByStoreReferenceName[baseData.storeOptions.referenceName];
                tasks.push(new taskClassReference(this.bot, taskData));
            }
        }

        return tasks;
    }
}
