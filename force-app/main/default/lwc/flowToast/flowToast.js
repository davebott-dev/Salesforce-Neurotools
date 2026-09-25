import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FlowToast extends LightningElement {
    @api message; // Message text passed from Flow
    @api title = 'Your Order Was Successfully Added To Your Cart';
    @api variant = 'success'; // success | info | warning | error

    connectedCallback() {
        // Fire the toast
        this.dispatchEvent(
            new ShowToastEvent({
                title: this.title,
                message: this.message,
                variant: this.variant
            })
        );
    }
}
