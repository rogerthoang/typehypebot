import { IConfig } from './IConfig';

export enum PaymentMethod {
    Empty = 'empty',
    PayPal = 'PayPal',
    CreditCard = 'credit card',
    BankTransfer = 'bank transfer',
}

export interface IAddressData {
    company?: string;
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber: string;
    streetName2: string;
    streetNumber2: string;
    postcode: string;
    city: string;
    province: string;
    country: string;
}

export interface IBillingAddressConfigData extends IAddressData {
    gender: string;
    telephone: string;
    birthDate: {
        day: number;
        month: number;
        year: number;
    };
}

export interface IShippingAddressConfigData extends IAddressData {}

export interface IPriceRangeConfigData {
    minimum: number;
    maximum: number;
}

export interface IPaymentData {
    method: PaymentMethod;
    data: any;
}

export interface IEmptyPaymentConfigData extends IPaymentData {
    method: PaymentMethod.Empty;
    data: {};
}

export interface IPayPalPaymentConfigData extends IPaymentData {
    method: PaymentMethod.PayPal;
    data: {
        authentication: {
            method: 'credentials';
            data: {
                email: string;
                password: string;
            };
        };
    };
}

export interface ICreditCardPaymentData extends IPaymentData {
    method: PaymentMethod.CreditCard;
    data: {
        number: string;
        expirationDate: {
            month: number;
            year: number;
        };
        cvv: number;
    };
}

export interface IOrderConfigData {
    active: boolean;
    canBeUsedMultipleTimesAtSameStore: boolean;
    maxUses: number;
    billing: IBillingAddressConfigData;
    shipping: IShippingAddressConfigData;
    price: IPriceRangeConfigData;
    payment: IEmptyPaymentConfigData | IPayPalPaymentConfigData | ICreditCardPaymentData;
}

export interface IOrdersConfig extends IConfig<IOrderConfigData> {}
