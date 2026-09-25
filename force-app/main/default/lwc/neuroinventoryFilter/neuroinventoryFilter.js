import { LightningElement, api, wire, track } from 'lwc';
import getInventoryByVirusType from '@salesforce/apex/NeuroInventoryController.getInventoryByVirusType';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text' },
    { label: 'Construct Length', fieldName: 'Construct_Full_Length__c', type: 'number' }
];

export default class NeuroinventoryFilter extends LightningElement {
    @api virusType;
    @track inventory = [];
    @track error;

    @api selectedRowId = null;     // For Flow output
    @api selectedRowName = null;   // For Flow output

    columns = COLUMNS;

    @wire(getInventoryByVirusType, { virusType: '$virusType' })
    wiredInventory({ data, error }) {
        if (data) {
            this.inventory = data.filter(item => item.Inventory_Family__c === "Expression Construct");
            this.error = undefined;
        } else {
            this.error = error;
            this.inventory = [];
        }
    }

    get hasInventory() {
        return this.inventory && this.inventory.length > 0;
    }

    get hasError() {
        return !!this.error;
    }

    get showNoRecords() {
        return !this.hasInventory && !this.hasError;
    }

    get cardTitle() {
        return this.virusType ? `${this.virusType} DNA Inventory` : 'DNA Inventory';
    }

    get selectedRowArray() {
    return this.selectedRowId ? [this.selectedRowId] : [];
}


    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;

        if (selectedRows.length === 1) {
            this.selectedRowId = selectedRows[0].Id;
            this.selectedRowName = selectedRows[0].Name;
        } else {
            this.selectedRowId = null;
            this.selectedRowName = null;
        }

        // Optional: fire event to parent
        const selectedEvent = new CustomEvent('selectionchange', {
            detail: {
                selectedRowId: this.selectedRowId,
                selectedRowName: this.selectedRowName
            }
        });
        this.dispatchEvent(selectedEvent);
    }
}

