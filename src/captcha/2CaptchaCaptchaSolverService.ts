import { ICaptchaSolverService } from './ICaptchaSolverService';
import { makeRequest, RequestMethod } from '@util/request';
import { wait } from '@util/generic';

export class TwoCaptchaCaptchaSolverService implements ICaptchaSolverService {
    constructor(private apiToken: string) {}

    async getResponseToken(url: string, siteKey: string): Promise<string> {
        try {
            const { json } = await makeRequest(RequestMethod.GET, 'http://2captcha.com/in.php', {
                form: {
                    key: this.apiToken,
                    method: 'userrecaptcha',
                    googlekey: siteKey,
                    pageurl: url,
                    json: 1,
                },
                parseJSONResponse: true,
            });

            const requestId: number = json.request;

            const getResponseToken = async(): Promise<string> => {
                try {
                    const { body } = await makeRequest(RequestMethod.GET, 'http://2captcha.com/res.php', {
                        form: {
                            key: this.apiToken,
                            action: 'get',
                            id: requestId,
                        },
                    });
                    return body;
                }catch(error) {
                    return null;
                }
            };

            await wait(10000);

            let result = await getResponseToken();
            do {
                await wait(2500);
                result = await getResponseToken();
            }while(result === 'CAPCHA_NOT_READY');

            return result;
        }catch(error) {
            return null;
        }
    }
}
