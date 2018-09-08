import { ICaptchaSolverService } from './ICaptchaSolverService';
import * as AntiCaptcha from 'anti-captcha';

export class AntiCaptchaCaptchaSolverService implements ICaptchaSolverService {
    private antiCaptcha: any;

    constructor(apiToken: string) {
        this.antiCaptcha = AntiCaptcha(apiToken);
        this.antiCaptcha.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:58.0) Gecko/20100101 Firefox/58.0');
    }

    getResponseToken(url: string, siteKey: string): Promise<string> {
        this.antiCaptcha.setWebsiteURL(url);
        this.antiCaptcha.setWebsiteKey(siteKey);
        return new Promise(resolve => {
            this.antiCaptcha.createTaskProxyless((err, taskId: number) => {
                if(err) {
                    resolve(null);
                }
                this.antiCaptcha.getTaskSolution(taskId, (err, taskSolution: string) => {
                    if(err) {
                        resolve(null);
                    }
                    resolve(taskSolution);
                });
            });
        });
    }
}
