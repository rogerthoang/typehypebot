export interface IConfig<BodyType = any> {
    isJSON?: boolean;
    body: BodyType;
}
