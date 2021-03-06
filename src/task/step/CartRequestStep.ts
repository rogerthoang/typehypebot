import { Order } from '../../Order';
import { RawSession } from '../../session/RawSession';
import { IGetSizeStepResults } from './GetSizeStep';
import { RequestStep } from './RequestStep';
import { ISizeItem } from './ProductPageRequestStep';
import { IRequestOptions } from '@util/request';

export interface ICartRequestStepResults extends IGetSizeStepResults {
    cartSession: RawSession;
    order: Order;
}

export abstract class CartRequestStep extends RequestStep {
    async run() {
        this.keepCarting(async(session, order) => {
            try {
                this.log(`Carting${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}...`);
                const results = await this.cart(session, this.results.sizeItem);
                this.log('Carted');
                if(order !== null) {
                    this.nextStep(Object.assign({
                        cartSession: session,
                        order: order,
                    }, results ? results : {}), session.proxy);
                }
            }catch(error) {
                this.log(`Couldn't make cart request${session.proxy ? ` with proxy ${session.proxy.address}:${session.proxy.port}` : ''}: ${error.message}`);
                if(this.task.bot.isUsingDeveloperMode) {
                    console.log(error);
                }
            }
        });
    }

    protected getRequestOptions(): IRequestOptions {
        return {
            retry: true,
            onRetry: (statusCode: number) => {
                this.log(`Cart request returned status code ${statusCode}. Retrying...`);
            },
        };
    }

    protected keepCarting(cart: (session: RawSession, order: Order) => void): void {
        let orderIteration: number = 0;
        for(const proxy of this.task.cartProxies) {
            const order = this.task.orders[orderIteration] === undefined ? null : this.task.orders[orderIteration++];
            if(order !== null) {
                if(!order.use(this.task)) {
                    this.log('Tried carting but order data is not available');
                    continue;
                }
            }
            cart(new RawSession(this.task.bot, this.task.mainUrl, proxy), order);
        }
    }
    protected abstract async cart(session: RawSession, sizeItem: ISizeItem): Promise<any>;
}
