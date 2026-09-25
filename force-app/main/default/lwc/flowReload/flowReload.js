import { LightningElement, api } from 'lwc';

export default class FlowReload extends LightningElement {
    @api delay = 1500; // milliseconds, customizable from Flow

    connectedCallback() {
        // Wait a short delay before reload (lets Flow finish saving)
        setTimeout(() => {
            window.location.reload();
        }, this.delay);
    }
}
