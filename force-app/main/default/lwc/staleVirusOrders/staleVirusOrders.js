import { LightningElement, track, wire } from 'lwc';
import getStaleVirusOrders from '@salesforce/apex/StaleVirusOrdersController.getStaleVirusOrders';

export default class StaleVirusOrders extends LightningElement {
    @track allOrders = [];
    @track filteredOrders = [];
    @track error;
    @track searchTerm = '';
    @track selectedVirusType = '';

    virusTypeOptions = [
        { label: 'All Types', value: '' },
        { label: 'AAV', value: 'AAV' },
        { label: 'Rabies', value: 'Rabies' },
        { label: 'HSV', value: 'HSV' },
        { label: 'Lenti', value: 'Lenti' },
    ];

    @wire(getStaleVirusOrders)
wiredOrders({ error, data }) {
    if (data) {
        this.allOrders = data.map(order => {
            const dt = new Date(order.LastStageChangeDate);
            const year = dt.getFullYear();
            const month = (dt.getMonth() + 1).toString().padStart(2, '0');
            const day = dt.getDate().toString().padStart(2, '0');

            return {
                ...order,
                url: '/' + order.Id,
                formattedLastStageChangeDate: `${year}-${month}-${day}`
            };
        });
        this.applyFilters();
        this.error = undefined;
    } else if (error) {
        this.error = error;
        this.allOrders = [];
        this.filteredOrders = [];
    }
}


    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }

    handleVirusTypeChange(event) {
        this.selectedVirusType = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredOrders = this.allOrders.filter(order => {
            const matchesType = this.selectedVirusType
                ? order.Type === this.selectedVirusType
                : true;

            const matchesSearch = this.searchTerm
                ? (order.Name && order.Name.toLowerCase().includes(this.searchTerm))
                : true;

            return matchesType && matchesSearch;
        });
    }

    get errorMessage() {
  if (!this.error) return '';
  if (this.error.body && this.error.body.message) {
    return this.error.body.message;
  }
  return this.error.message || JSON.stringify(this.error);
}

}
