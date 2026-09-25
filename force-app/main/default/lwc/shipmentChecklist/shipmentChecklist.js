import { LightningElement, api, wire, track } from 'lwc';
import getChecklistItems from '@salesforce/apex/ShipmentChecklistController.getChecklistItems';
import updateChecklistItems from '@salesforce/apex/ShipmentChecklistController.updateChecklistItems';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class ShipmentChecklist extends LightningElement {
    @api recordId;
    @track sections = [];
    wiredResult;

    @wire(getChecklistItems, { shipmentId: '$recordId' })
    wiredItems(value) {
        this.wiredResult = value;
        const { data, error } = value;
        if (data) {
            const grouped = {};
            data.forEach(item => {
                const section = item.Section__c || 'Other';
                if (!grouped[section]) {
                    grouped[section] = [];
                }
                grouped[section].push({
                    ...item,
                    isCompleted: item.Status__c === 'Completed'
                });
            });

            this.sections = Object.keys(grouped).map(key => ({
                header: key,
                items: grouped[key]
            }));
        } else if (error) {
            this.showToast('Error loading checklist', error.body.message, 'error');
        }
    }

    handleCheckboxChange(event) {
        const itemId = event.target.dataset.id;
        const checked = event.target.checked;

        this.sections.forEach(section => {
            const item = section.items.find(i => i.Id === itemId);
            if (item) {
                item.isCompleted = checked;
                item.Status__c = checked ? 'Completed' : 'Not Started';
            }
        });

        updateChecklistItems({
            items: [
                {
                    Id: itemId,
                    Status__c: checked ? 'Completed' : 'Not Started'
                }
            ]
        })
            .then(() => {
                this.showToast('Success', 'Checklist updated', 'success');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showToast('Error updating checklist', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
