import { LightningElement, api, wire } from 'lwc';
import getClonesByVirusOrder from '@salesforce/apex/CloneController.getClonesByVirusOrder';

export default class CloneList extends LightningElement {
    @api recordId; // Virus Order Id

    clones;
    error;

    columns = [
        {
            label: 'Clone Name',
            fieldName: 'cloneUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
        },
        {label: 'Resultant Plasmid Name', fieldName: 'Resultant_Plasmid_Name__c'},
        { label: 'Stage', fieldName: 'Stage' },
        { label: 'Created Date', fieldName: 'CreatedDate', type: 'date' }
    ];

    @wire(getClonesByVirusOrder, { virusOrderId: '$recordId' })
    wiredClones({ error, data }) {
        if (data) {
            this.clones = data.map(c => {
                return {
                    Id: c.Id,
                    Name: c.Name,
                    Stage: c.Stage,
                    Resultant_Plasmid_Name__c: c.PlasmidName,
                    CreatedDate: c.CreatedDate,
                    cloneUrl: '/' + c.Id
                };
            });
            this.error = undefined;
        } else if (error) {
            this.error = error.body ? error.body.message : error;
            this.clones = undefined;
        }
    }
}
