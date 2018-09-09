import { BaseTask } from '../BaseTask/BaseTask';
import { Session } from '../../session/Session';
import { Step } from '../BaseTask/step/Step';
import { IProxy } from '@util/proxy';

export abstract class PreCheckoutTask extends BaseTask {
    public preCheckoutSessions: {[orderId: number]: Session[]} = {};

    protected async doneInit(): Promise<void> {
        this.log('Getting pre-checkout sessions');
        await this.setPreCheckoutSessions();
        this.log('Finished setting pre-checkout settings');
        super.doneInit();
    }

    protected abstract getPreCheckoutStepClassReferences(): { new(...args: any[]): Step }[];

    private setPreCheckoutSessions(): Promise<void> {
        let resolve: () => void = null;
        const promise: Promise<void> = new Promise(_resolve => {
            resolve = _resolve;
        });
        const stepClassReferences: { new(...args: any[]): Step }[] = this.getPreCheckoutStepClassReferences();

        const nextStepFunction = (currentStepClassReference: { new(): Step }, proxy: IProxy, resultsByClassReference: any, currentStepResult: any): void => {
            let nextStepClassReference: any = null;
            resultsByClassReference[<any> currentStepClassReference] = currentStepResult;
            const values: any[] = Object.values(resultsByClassReference);
            const results: any = values.length === 0 ? {} : Object.assign({}, ...values);
            const currentStepClassReferenceIndex = stepClassReferences.indexOf(currentStepClassReference);
            if(currentStepClassReferenceIndex === stepClassReferences.length - 1) {
                if([].concat(...Object.values(this.preCheckoutSessions)).length === this.preCheckout.sessionsPerOrder * this.orders.length) {
                    resolve();
                }
                return;
            }
            nextStepClassReference = stepClassReferences[currentStepClassReferenceIndex + 1];
            this.log(nextStepClassReference.name);
            new nextStepClassReference(this, this.mainProxy, (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }) => {}, nextStepFunction, resultsByClassReference).run();
        };

        new stepClassReferences[0](this, this.mainProxy, (currentStepClassReference: { new(...args: any[]): Step }, resultsByClassReference: any, previousStepClassReference: { new(...args: any[]): Step }) => {}, nextStepFunction, {}).run();
        return promise;
    }
}
