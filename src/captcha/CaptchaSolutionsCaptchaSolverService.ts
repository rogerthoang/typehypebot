import { ICaptchaSolverService } from './ICaptchaSolverService';
import { makeRequest, RequestMethod } from '@util/request';

export class CaptchaSolutionsCaptchaSolverService implements ICaptchaSolverService {
    constructor(private apiToken: string, private secretToken: string) {}

    async getResponseToken(url: string, siteKey: string): Promise<string> {
        try {
            const { body } = await makeRequest(RequestMethod.POST, 'http://api.captchasolutions.com/solve', {
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
