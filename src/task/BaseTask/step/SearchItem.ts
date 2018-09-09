export interface ISearchItemData {
    url: string;
    name: string;
}

export class SearchItem {
    public url: string;
    public name: string;

    constructor(data: ISearchItemData) {
        Object.assign(this, data);
    }
}
