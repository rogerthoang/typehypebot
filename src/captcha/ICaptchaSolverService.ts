export interface ICaptchaSolverService {
    getResponseToken(url: string, siteKey: string): Promise<string>;
}
