import { IInitSegment } from './IInitSegment';
import { Order } from '../config/Order';
import { OrderConfigData, IPayPalPaymentConfigData, PaymentMethod } from '../config/IOrdersConfig';

export class CreateOrdersSegment implements IInitSegment<{ orders: Order[]; payPalPaymentConfigDataset: IPayPalPaymentConfigData[]; }> {
    constructor(private ordersConfigData: OrderConfigData[]) {}

    getResult() {
        const orders: Order[] = [];
        const finishedEmails: string[] = [];
        const payPalPaymentConfigDataset: IPayPalPaymentConfigData[] = [];

        for(const orderConfigData of this.ordersConfigData) {
            if(orderConfigData.active) {
                if(orderConfigData.payment.method === PaymentMethod.PayPal) {
                    const paymentData = <IPayPalPaymentConfigData> orderConfigData.payment;

                    if(finishedEmails.indexOf(paymentData.data.authentication.data.email) !== -1) {
                        finishedEmails.push(paymentData.data.authentication.data.email);
                        payPalPaymentConfigDataset.push(paymentData);
                    }
                }

                orders.push(Order.createFrom(orderConfigData));
            }
        }

        return {
            orders,
            payPalPaymentConfigDataset,
        };
    }
}
