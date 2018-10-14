import { BaseTask } from '../task/BaseTask';

export class TaskManager {
    public tasksByStoreName: { [storeName: string]: BaseTask[] } = {};
    public tasksByRegion: { [region: string]: BaseTask[] } = {};
    public tasksByAccountId: { [id: number]: BaseTask[] } = {};

    constructor(public tasks: BaseTask[]) {
        for(const task of tasks) {
            this.addTask(task);
        }
    }

    addTask(task: BaseTask) {
        const storeName = task.store.name;
        const region = task.region;
        const accountId = task.account.id;

        if(this.tasksByStoreName[storeName] === undefined) {
            this.tasksByStoreName[storeName] = [];
        }
        if(this.tasksByRegion[region] === undefined) {
            this.tasksByRegion[region] = [];
        }
        if(this.tasksByAccountId[accountId] === undefined) {
            this.tasksByAccountId[accountId] = [];
        }

        this.tasksByStoreName[storeName].push(task);
        this.tasksByRegion[region].push(task);
        this.tasksByAccountId[accountId].push(task);
    }

    startAll() {
        for(const task of this.tasks) {
            task.start();
        }
    }

    stopAll() {
        for(const task of this.tasks) {
            task.stop();
        }
    }
}
