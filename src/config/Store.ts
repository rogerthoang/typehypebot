import { DomainsByRegion, StoreConfigData } from './IStoresConfig';

export class Store {
    static createFrom(storeConfigData: StoreConfigData) {
        return new Store(
            storeConfigData.name,
            storeConfigData.domainsByRegion,
        );
    }

    constructor(
        public name: string,
        public domainsByRegion: DomainsByRegion,
    ) {}
}
