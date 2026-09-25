import { LightningElement, api } from 'lwc';

export default class DnaEntryForm extends LightningElement {
    @api dnaNameInput;
    @api dnaNameOutput;
    @api isEditable = false;

    _selectedRecordName; 

    @api
    get selectedRecordName() {
        return this._selectedRecordName;
    }
    set selectedRecordName(value) {
        this._selectedRecordName = value;

        if (value) {
            this.dnaNameOutput = value;
        } else {
            this.dnaNameOutput = this.dnaNameInput || '';
        }
    }

    connectedCallback() {
        if (this.dnaNameInput && !this.dnaNameOutput) {
            this.dnaNameOutput = this.dnaNameInput;
        }
    }

    handleChange(event) {
        this.dnaNameOutput = event.target.value;
    }

    @api
validate() {
    const inputField = this.template.querySelector('lightning-input');

    if (!inputField.checkValidity()) {
        inputField.reportValidity();
        return {
            isValid: false,
            errorMessage: 'DNA Name is required.'
        };
    }

    return { isValid: true };
}


    @api
    getValue() {
        return this.dnaNameOutput;
    }

    get isDisabled() {
        return !this.isEditable || !!this.selectedRecordName;
    }
}
