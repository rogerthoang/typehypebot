    import { IConfig } from './IConfig';

export enum PaymentMethod {
    PayPal = 'PayPal',
    CreditCard = 'Credit Card',
    BankTransfer = 'Bank Transfer',
}

export interface IAddress {
    company?: string;
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber: string;
    streetName2?: string;
    streetNumber2?: string;
    postcode: string;
    city: string;
    province: string;
    country: string;
}

export interface IEmailAddress extends IAddress {
    email: string;
}

export interface IBillingAddressData extends IEmailAddress {
    gender?: string;
    telephone: string;
    birthDate: {
        day: number;
        month: number;
        year: number;
    };
}

export interface IBillingAddress extends IBillingAddressData {

}

export interface IShippingAddressData extends IEmailAddress {

}

export interface IShippingAddress extends IShippingAddressData {

}

export interface IPriceRange {
    minimum: number;
    maximum: number;
}

export interface IEmptyPaymentData {

}

export interface ICustomPaymentData {
    [x: string]: any;
}

export interface IPayPalPaymentData {
    authentication: {
        method: string;
        data: {
            email: string;
            password: string;
        };
    };
}

export interface ICreditCardPaymentData {
    number: string;
    expirationDate: {
        month: number;
        year: number;
    };
    cvv: number;
}

export interface IPayment {
    method: PaymentMethod;
    data: IEmptyPaymentData|ICustomPaymentData|IPayPalPaymentData|ICreditCardPaymentData;
}

export interface IRegistration {
    email: string;
    password: string;
}

export interface IOrderData {
    active: boolean;
    canBeUsedMultipleTimesAtSameStore: boolean;
    maxUses: number;
    registration: IRegistration;
    billing: IBillingAddressData;
    shipping: IShippingAddressData;
    price: IPriceRange;
    payment: IPayment;
}

export interface IOrder extends IOrderData {
    billing: IBillingAddress;
    shipping: IShippingAddress;
}

export interface IOrdersConfig extends IConfig {
    body: IOrderData[];
}
