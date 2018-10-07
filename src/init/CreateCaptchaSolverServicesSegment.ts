import { IInitSegment } from './IInitSegment';
import { ICaptchaSolverService } from '../captcha/ICaptchaSolverService';
import { ITokens } from '../config/ITokensConfig';
import { AntiCaptchaCaptchaSolverService } from '../captcha/AntiCaptchaCaptchaSolverService';
import { CaptchaSolutionsCaptchaSolverService } from '../captcha/CaptchaSolutionsCaptchaSolverService';
import { TwoCaptchaCaptchaSolverService } from '../captcha/2CaptchaCaptchaSolverService';

export class CreateCaptchaSolverServicesSegment implements IInitSegment<ICaptchaSolverService[]> {
    constructor(private tokens: ITokens) {}

    getResult() {
        const captchaSolverServices: ICaptchaSolverService[] = [];

        if(this.tokens.captchaSolvers.AntiCaptcha) {
            captchaSolverServices.push(new AntiCaptchaCaptchaSolverService(this.tokens.captchaSolvers.AntiCaptcha));
        }
        if(this.tokens.captchaSolvers.CaptchaSolutions) {
            captchaSolverServices.push(new CaptchaSolutionsCaptchaSolverService(this.tokens.captchaSolvers.CaptchaSolutions.api, this.tokens.captchaSolvers.CaptchaSolutions.secret));
        }
        if(this.tokens.captchaSolvers.TwoCaptcha) {
            captchaSolverServices.push(new TwoCaptchaCaptchaSolverService(this.tokens.captchaSolvers.TwoCaptcha));
        }

        return captchaSolverServices;
    }
}
