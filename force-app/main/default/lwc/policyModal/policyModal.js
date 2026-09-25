import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class PolicyModal extends LightningElement {

    @api agreed = false;

    showModal = true;
    isChecked = false;

    get isDisabled() {
        return !this.isChecked;
    }

    handleCheck(event) {
        this.isChecked = event.target.checked;
    }

    handleCancel() {
        this.agreed = false;

        this.dispatchEvent(
            new FlowAttributeChangeEvent('agreed', false)
        );

        this.showModal = false;
        
        this.dispatchEvent(new FlowNavigationNextEvent());
    }

    handleSubmit() {

        this.agreed = this.isChecked;

        this.dispatchEvent(
            new FlowAttributeChangeEvent('agreed', this.agreed)
        );

        this.showModal = false;

        // 🚀 THIS ADVANCES THE FLOW
        if (this.agreed) {
            this.dispatchEvent(new FlowNavigationNextEvent());
        }
    }
}