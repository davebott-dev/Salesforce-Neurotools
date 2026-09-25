import { LightningElement, api, wire } from 'lwc';
import getInvoicesForShipment from '@salesforce/apex/ShipmentInvoiceController.getInvoicesForShipment';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    { label: 'Reference Number', fieldName: 'recordLink', type: 'url', typeAttributes: { label: { fieldName: 'QuoteNumber' }, target: '_blank' }},
    { label: 'Grand Total', fieldName: 'GrandTotal', type: 'currency' },
    { label: 'Status', fieldName: 'Status', type: 'text' },
    { label: 'Invoice Due Date', fieldName: 'Invoice_Due_Date__c', type: 'date' }
];

export default class ShipmentInvoices extends LightningElement {
    @api recordId;

    columns = COLUMNS;
    invoices = [];
    error;
    noData = false;

    @wire(getInvoicesForShipment, { shipmentId: '$recordId' })
    wiredInvoices({ error, data }) {
        if (data) {
            this.invoices = data.map(row => ({
                ...row,
                recordLink: '/' + row.Id
            }));
            this.noData = data.length === 0;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.invoices = [];
            this.noData = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading invoices',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        }
    }
}

