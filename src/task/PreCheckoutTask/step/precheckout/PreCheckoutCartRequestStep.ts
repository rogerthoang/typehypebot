import { Order } from '../../../../Order';
import { Session } from '../../../../session/Session';
import { PreCheckoutTask } from '../../PreCheckoutTask';
import { RequestStep } from '../../../BaseTask/step/RequestStep';
import { IGetPreCheckoutSizeStepResults } from './GetPreCheckoutSizeStep';
import { IStepResults } from '../../../BaseTask/step/Step';
import { ISizeItem } from '../../../BaseTask/step/ProductPageRequestStep';
import { IRequestOptions } from '@util/request';

export interface IPreCheckoutCartRequestStepResults extends IStepResults {
    cartSession: Session;
    order: Order;
}

export abstract class PreCheckoutCartRequestStep extends RequestStep {
    protected task: PreCheckoutTask;
    protected results: IGetPreCheckoutSizeStepResults;

    async run() {
        const keys = Object.keys(this.task.preCheckoutSessions);
        if(keys.length > 0) {
            for(const orderId of keys) {
                const sessions: Session[] = this.task.preCheckoutSessions[orderId];
                const order: Order = this.task.bot.ordersById[orderId];

                for(const session of sessions) {
                    try {
                        this.log(`Carting${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}...`);
                        const result: any = await this.cart(session, this.results.sizeItem);
                        this.log('Carted');
                        this.nextStep(Object.assign({
                            cartSession: session,
                            order: order,
                        }, result ? result : {}), session.proxy);
                    }catch(error) {
                        this.log(`Couldn't make cart request${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}: ${error.message}`);
                        if(this.task.bot.isUsingDeveloperMode) {
                            console.log(error);
                        }
                    }
                }
            }
        }else {
            this.keepCarting(async(session: Session, order: Order): Promise<void> => {
                try {
                    this.log(`Carting${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}...`);
                    const result: any = await this.cart(session, this.results.sizeItem);
                    this.log('Carted');
                    if(this.task.preCheckoutSessions[order.id] === undefined) {
                        this.task.preCheckoutSessions[order.id] = [];
                    }
                    this.task.preCheckoutSessions[order.id].push(session);
                    this.nextStep(Object.assign({
                        cartSession: session,
                        order: order,
                    }, result ? result : {}), session.proxy);
                } catch(error) {
                    this.log(`Couldn't make cart request${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}: ${error.message}`);
                    if(this.task.bot.isUsingDeveloperMode) {
                        console.log(error);
                    }
                }
            });
        }
    }

    protected getRequestOptions(): IRequestOptions {
        return {
            retry: true,
            onRetry: (statusCode: number) => {
                this.log(`Cart request returned status code ${statusCode}. Retrying...`);
            },
        };
    }

    protected keepCarting(cartFunction: (session: Session, order: Order) => void): void {
        const max = this.task.preCheckout.sessionsPerOrder * this.task.orders.length;

        let iteration = 0;
        let proxyIndex = 0;
        let orderIndex = 0;

        if(this.task.preCheckout.proxies.length > 0) {
            for(let i = 0; i < max; i++) {
                cartFunction(new Session(this.task.bot, this.task.mainUrl, this.task.preCheckout.proxies[proxyIndex]), this.task.orders[orderIndex]);
                proxyIndex = proxyIndex === this.task.preCheckout.proxies.length - 1 ? 0 : proxyIndex + 1;
                orderIndex = orderIndex === this.task.orders.length - 1 ? 0 : orderIndex + 1;
            }
        }else {
            const interval = () => {
                cartFunction(new Session(this.task.bot, this.task.mainUrl), this.task.orders[orderIndex]);
                orderIndex = orderIndex === this.task.orders.length - 1 ? 0 : orderIndex + 1;
            };
            const int = setInterval(() => {
                if(iteration++ === max) {
                    return clearInterval(int);
                }
                interval();
            }, this.task.preCheckout.delayWithoutProxies);
            interval();
            iteration++;
        }
    }

    protected abstract async cart(session: Session, sizeItem: ISizeItem): Promise<any>;
}
