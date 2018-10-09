import {
    IBillingAddressConfigData,
    IOrderConfigData,
    IPriceRangeConfigData,
    IShippingAddressConfigData, PaymentConfigData
} from './IOrdersConfig';

export class Order {
    static createFrom(orderConfigData: IOrderConfigData) {
        return new Order(
            orderConfigData.canBeUsedMultipleTimesAtSameStore,
            orderConfigData.maxUses,
            orderConfigData.billingAddress,
            orderConfigData.shippingAddress,
            orderConfigData.priceRange,
            orderConfigData.payment,
        );
    }

    constructor(
        public canBeUsedMultipleTimesAtSameStore: boolean,
        public maxUses: number,
        public billingAddress: IBillingAddressConfigData,
        public shippingAddress: IShippingAddressConfigData,
        public priceRange: IPriceRangeConfigData,
        public payment: PaymentConfigData,
    ) {}

    checkPrice(price: number): boolean {
        return price <= this.priceRange.maximum && price >= this.priceRange.minimum;
    }
}
