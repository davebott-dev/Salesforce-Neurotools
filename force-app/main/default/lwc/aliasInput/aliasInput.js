import { LightningElement, api } from 'lwc';

export default class DnaEntryForm extends LightningElement {
    @api aliasInput;
    @api aliasOutput;
    @api isEditable = false;

    _selectedRecordAlias; // private backing field

    @api
    get selectedRecordAlias() {
        return this._selectedRecordAlias;
    }
    set selectedRecordAlias(value) {
        this._selectedRecordAlias = value;

        if (value) {
            this.aliasOutput = value;
        } else {
            this.aliasOutput = this.aliasInput || '';
        }
    }

    connectedCallback() {
        if (this.aliasInput && !this.aliasOutput) {
            this.aliasOutput = this.aliasInput;
        }
    }

    handleChange(event) {
        this.aliasOutput = event.target.value;
    }

    @api
validate() {
    const inputField = this.template.querySelector('lightning-input');

    if (!inputField.checkValidity()) {
        inputField.reportValidity();
        return {
            isValid: false,
            errorMessage: 'DNA Alias is required.'
        };
    }

    return { isValid: true };
}

    @api
    getValue() {
        return this.aliasOutput;
    }

    get isDisabled() {
        return !this.isEditable || !!this._selectedRecordAlias;
    }
}
