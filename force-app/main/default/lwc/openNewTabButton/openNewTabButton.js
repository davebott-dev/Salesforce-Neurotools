import { LightningElement, api } from 'lwc';

export default class OpenNewTabButton extends LightningElement {
    @api buttonLabel = 'Open Page';
    @api url = '/'; 

    handleClick() {
        if (this.url) {
            window.open(this.url, '_blank');
        }
    }
}
