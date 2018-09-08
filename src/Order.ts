import {
    IOrderData, IShippingAddress, IBillingAddress, IPriceRange, IPayment,
} from './config/IOrdersConfig';
import * as faker from 'faker';
import { Task } from './task/Task/Task';
import { generateRandomString } from '@util/generic';

let orderId: number = 0;

function randomify(string: string, randomStringLength: number) {
    return string
        .replace(/#randomFirstName#/g, faker.name.firstName().toLowerCase())
        .replace(/#randomLastName#/g, faker.name.lastName().toLowerCase())
        .replace(/#randomWord#/g, faker.random.word().replace(/ /g, '-').toLowerCase())
        .replace(/#randomNumber#/g, faker.random.number().toString())
        .replace(/#randomString#/g, generateRandomString(randomStringLength));
}

export class Registration {
    private originalEmail: string;
    private _email: string = null;
    private hasChangedEmail: boolean = false;
    private originalPassword: string;
    private _password: string = null;
    private hasChangedPassword: boolean = false;

    constructor(email: string, password: string) {
        this.originalEmail = email;
        this.originalPassword = password;
    }

    get email(): string {
        if(!this.hasChangedEmail) {
            this._email = randomify(this.originalEmail, 10);
            this.hasChangedEmail = true;
        }
        return this._email;
    }

    get password(): string {
        if(!this.hasChangedPassword) {
            this._password = randomify(this.originalPassword, 12);
            this.hasChangedPassword = true;
        }
        return this._password;
    }

    resetEmail(): void {
        this.hasChangedEmail = false;
    }

    resetPassword(): void {
        this.hasChangedPassword = false;
    }

    reset(): void {
        this.resetEmail();
        this.resetPassword();
    }
}

export class Order {
    static createOrder(orderData: IOrderData) {
        return new Order(
            orderData.canBeUsedMultipleTimesAtSameStore,
            orderData.maxUses,
            orderData.registration.email,
            orderData.registration.password,
            orderData.billing,
            orderData.shipping,
            orderData.price,
            orderData.payment,
        );
    }

    public id: number;
    public registration: Registration;

    private uses: number = 0;
    private usedAtStores: number[] = [];

    constructor(public canBeUsedMultipleTimesAtSameStore: boolean, public maxUses: number, email: string, password: string, public bulling: IBillingAddress, public shipping: IShippingAddress, private priceRange: IPriceRange, public payment: IPayment) {
        this.id = orderId++;
        this.registration = new Registration(email, password);
    }

    use(task: Task): boolean {
        if(this.maxUses !== null && this.maxUses !== -1 && this.uses + 1 < this.maxUses) {
            if(!this.canBeUsedMultipleTimesAtSameStore) {
                if(this.usedAtStores.indexOf(task.store.id) > -1) {
                    return false;
                }
            }
            this.usedAtStores.push(task.store.id);
            this.uses++;
            return true;
        }
        return false;
    }

    checkPrice(price: number): boolean {
        return price <= this.priceRange.maximum && price >= this.priceRange.minimum;
    }
}
