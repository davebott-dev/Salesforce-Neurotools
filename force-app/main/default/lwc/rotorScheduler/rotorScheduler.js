import { LightningElement, track, wire } from 'lwc';
import getProductionDetails from '@salesforce/apex/RotorSchedulerController.getProductionDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RotorScheduler extends LightningElement {
    @track rotors = [];
    @track availableOrders = [];
    @track legend = []; 

    draggedItem = null;
    colorMap = ['#d1ecf1', '#f8d7da', '#d4edda', '#fff3cd', '#cce5ff'];

    @wire(getProductionDetails)
    wiredProductionDetails({ error, data }) {
        if (data) {
            this.initializeRotors(data);
        } else if (error) {
            this.showToast('Error loading Production Details', error.body.message, 'error');
        }
    }

initializeLegend(productionDetails) {
    const colors = ['#d1ecf1', '#f8d7da', '#d4edda', '#fff3cd']; // example colors
    const assignedSet = new Set();

    productionDetails.forEach(detail => {
        if (detail.Virus_Order__r.Assigned_To__c) {
            assignedSet.add(detail.Virus_Order__r.Assigned_To__c);
        }
    });

    let i = 0;
    this.legendArray = Array.from(assignedSet).map(person => ({
        name: person,
        color: colors[i++ % colors.length]
    }));
}

    initializeRotors(productionDetails) {
        const rotorTypes = [
            { name: '65k-1', label: '65k Rotor #1' },
            { name: '65k-2', label: '65k Rotor #2' },
            { name: '90k-1', label: '90k Rotor #1' },
            { name: '90k-2', label: '90k Rotor #2' }
        ];

        this.rotors = rotorTypes.map(r => ({
            ...r,
            slots: Array(8).fill().map((_, i) => ({ id: `${r.name}-slot${i}`, detail: null }))
        }));

        let colorIndex = 0;

        productionDetails.forEach(detail => {
            const plates = parseInt(detail.Plates_Used__c) || 1;

            // Assign color based on Assigned_To__c
            let assignedTo = detail.Virus_Order__r.Assigned_To__c || 'Unassigned';
            if (!this.legend[assignedTo]) {
                this.legend[assignedTo] = this.colorMap[colorIndex % this.colorMap.length];
                colorIndex++;
            }

            const detailData = {
                ...detail,
                displayLabel: `${detail.Virus_Order__r.Order_Number__c || 'No Order Number'} (${detail.Lot_Transfection_Date__c || 'No Date'})`,
                colorStyle: `background-color: ${this.legend[assignedTo]};`
            };

            const slotsNeeded = Math.ceil(plates / 6);
            let index = 0;
            for (let i = 0; i < slotsNeeded; i++) {
                const rotor = this.rotors[index % this.rotors.length];
                const emptySlot = rotor.slots.find(s => !s.detail);
                if (emptySlot) {
                    emptySlot.detail = detailData;
                    index++;
                }
            }

            this.availableOrders.push(detailData);
        });

        // Remove already assigned
        this.availableOrders = this.availableOrders.filter(order => {
            return !this.rotors.some(rotor => rotor.slots.some(slot => slot.detail && slot.detail.Id === order.Id));
        });
    }

    handleDragStart(event) {
        this.draggedItem = event.target.dataset.id;
    }

    allowDrop(event) {
        event.preventDefault();
    }

    handleDrop(event) {
        event.preventDefault();
        const rotorName = event.currentTarget.dataset.rotor;
        let detail = this.removeFromCurrentSlotOrPool(this.draggedItem);

        if (detail) {
            const targetRotor = this.rotors.find(r => r.name === rotorName);
            const emptySlot = targetRotor.slots.find(s => !s.detail);
            if (emptySlot) emptySlot.detail = detail;
        }

        this.draggedItem = null;
    }

    handleDropToPool(event) {
        event.preventDefault();
        if (!this.draggedItem) return;

        this.rotors.forEach(rotor => {
            rotor.slots.forEach(slot => {
                if (slot.detail && slot.detail.Id === this.draggedItem) {
                    const detail = slot.detail;
                    slot.detail = null;
                    this.availableOrders.push(detail);
                }
            });
        });

        this.draggedItem = null;
    }

    removeFromCurrentSlotOrPool(id) {
        let detail = null;

        this.rotors.forEach(rotor => {
            rotor.slots.forEach(slot => {
                if (slot.detail && slot.detail.Id === id) {
                    detail = slot.detail;
                    slot.detail = null;
                }
            });
        });

        if (!detail) {
            detail = this.availableOrders.find(o => o.Id === id);
            this.availableOrders = this.availableOrders.filter(o => o.Id !== id);
        }

        return detail;
    }

    get noAvailableOrders() {
        return this.availableOrders.length === 0;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
