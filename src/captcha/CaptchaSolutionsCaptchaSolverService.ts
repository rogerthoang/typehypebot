import { ICaptchaSolverService } from './ICaptchaSolverService';
import { makeRequest } from '../util/Utils';

export class CaptchaSolutionsCaptchaSolverService implements ICaptchaSolverService {
    private secretToken: string;
    private apiToken: string;

    constructor(apiToken: string, secretToken: string) {
        this.secretToken = secretToken;
        this.apiToken = apiToken;
    }

    async getResponseToken(url: string, siteKey: string): Promise<string> {
        try {
            const { body } = await makeRequest('POST', 'http://api.captchasolutions.com/solve', {
                form: {
                    p: 'nocaptcha',
                    googlekey: siteKey,
                    pageurl: url,
                    key: this.apiToken,
                    secret: this.secretToken,
                    out: 'text',
                },
            });
            return body;
        }catch(error) {
            return null;
        }
    }
}
