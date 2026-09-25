// productionDetailSummary.js
import { LightningElement, api, wire, track } from 'lwc';
import getProductionOverview from '@salesforce/apex/ProductionDetailOverviewController.getProductionOverview';

export default class ProductionDetailSummary extends LightningElement {
    @api recordId;
    @track details = [];
    @track summary;
    @track error;

    columns = [
        { label: 'Name', fieldName: 'name', type: 'text' },
        {label: 'Protocol Mods', fieldName: 'protocolModifications', type: 'text'},
        { label: 'Transfection Date', fieldName: 'transfectionDate', type: 'text' },
        {label: 'Expression Construct', fieldName: 'constructName', type: 'text' },
        { label: 'Construct Location', fieldName: 'constructLocation', type: 'text' },
        {label: 'Capsid', fieldName: 'capsidName', type: 'text' },
        { label: 'Capsid Location', fieldName: 'capsidLocation', type: 'text' },
        { label: 'pHelper Location', fieldName: 'pHelperLocation', type: 'text' },
        { label: 'Plates Used', fieldName: 'platesUsed', type: 'number' },
        { label: 'Titer', fieldName: 'titerUsed', type: 'text' },
        { label: 'Status', fieldName: 'status', type: 'text' },
        { label: 'Conc. or Unconc.', fieldName: 'prepToSend', type: 'text' },
    ];

    @wire(getProductionOverview, { recordId: '$recordId' })
    wiredOverview({ error, data }) {
        if (data) {
            this.details = data.details;
            this.summary = data.summary;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.details = [];
            this.summary = undefined;
        }
    }

    get formattedAverageTiter() {
    if (!this.summary || this.summary.averageTiter == null) return 'N/A';

    let num = Number(this.summary.averageTiter);
    if (isNaN(num)) return this.summary.averageTiter;

    return num.toExponential(3); 
}

get formattedAveragePlatesUsed() {
    if (!this.summary || this.summary.averagePlatesUsed == null) return 'N/A';
    return Number(this.summary.averagePlatesUsed).toFixed(1); // round to 1 decimal
}

get formattedPassRate() {
    if (!this.summary || this.summary.passRate == null) return 'N/A';
    return Number(this.summary.passRate).toFixed(1); // round to 1 decimal
}


}
