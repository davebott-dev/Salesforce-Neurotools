import { LightningElement, api } from 'lwc';
import {
    FlowAttributeChangeEvent,
    FlowNavigationNextEvent
} from 'lightning/flowSupport';

export default class OrderCompleteModal extends LightningElement {

    @api nextAction = '';

    showModal = true;

    handleContinue() {

        this.nextAction = 'CONTINUE';

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'nextAction',
                this.nextAction
            )
        );

        this.showModal = false;

        this.dispatchEvent(
            new FlowNavigationNextEvent()
        );
    }

    handleCart() {

        this.nextAction = 'CART';

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'nextAction',
                this.nextAction
            )
        );

        this.showModal = false;

        this.dispatchEvent(
            new FlowNavigationNextEvent()
        );
    }
}