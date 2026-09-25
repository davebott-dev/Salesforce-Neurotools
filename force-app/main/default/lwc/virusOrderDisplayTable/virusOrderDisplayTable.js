import { LightningElement, track, api } from 'lwc';
import getActiveVirusOrders from '@salesforce/apex/VirusOrderService.getActiveVirusOrders';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const DELAY_REASON_OPTIONS = [
    { label: 'Waiting on Supplies', value: 'Waiting on Supplies' },
    { label: 'Increased Order Volume', value: 'Increased Order Volume' },
    { label: 'Staff Shortage', value: 'Staff Shortage' },
    { label: 'Equipment Failure', value: 'Equipment Failure' },
    { label: 'Weather Delay', value: 'Weather Delay' },
    { label: 'Other', value: 'Other' }
];

const TYPE_OPTIONS = [
    { label: 'All Types', value: '' },
    { label: 'AAV', value: 'AAV' },
    { label: 'Lenti', value: 'Lenti' },
    { label: 'HSV', value: 'HSV' },
    { label: 'Rabies', value: 'Rabies' }
];

export default class VirusOrderDisplayTable extends LightningElement {
    @track virusOrders = [];
    @track searchTerm = '';
    @track typeFilter = '';
    @track pageSize = 10;
    @track currentPage = 1;
    @track selectedIds = new Set();


    @api
    get selectedOrderIds() {
        return Array.from(this.selectedIds).join(',');
    }

    @api
get selectedDelayReasons() {
    return Array.from(this.selectedIds).map(id => {
        const order = this.virusOrders.find(o => o.Id === id);
        return order ? order.Delay_Reason__c || '' : '';
    });
}

@api
get selectedShipDates() {
    return Array.from(this.selectedIds).map(id => {
        const order = this.virusOrders.find(o => o.Id === id);
        return order ? order.CloseDate || '' : '';
    });
}

    get typeOptions() {
        return TYPE_OPTIONS;
    }

    get delayReasonOptions() {
        return DELAY_REASON_OPTIONS;
    }

    connectedCallback() {
        this.loadOrders();
    }

    loadOrders() {
        getActiveVirusOrders()
            .then(result => {
                this.virusOrders = result.map(order => ({
                    ...order,
                    CloseDate: order.CloseDate ? order.CloseDate.substring(0, 10) : null,
                    Delay_Reason__c: order.Delay_Reason__c || '',
                    isSelected: this.selectedIds.has(order.Id)
                }));
            })
            .catch(error => {
                console.error(error);
            });
    }

    get filteredOrders() {
        return this.virusOrders.filter(order => {
            const matchesSearch = order.Name?.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesType = this.typeFilter ? order.Type === this.typeFilter : true;
            return matchesSearch && matchesType;
        });
    }

    get pagedOrders() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredOrders.slice(start, start + this.pageSize);
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage >= this.totalPages;
    }

    get pageSizeOptionsWithVariant() {
        const sizes = [10, 25, 50];
        return sizes.map(size => ({
            size,
            variant: size === this.pageSize ? 'brand' : 'neutral'
        }));
    }

    isSelected(id) {
        return this.selectedIds.has(id);
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
    }

    handleTypeChange(event) {
        this.typeFilter = event.detail.value;
        this.currentPage = 1;
    }

    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.dataset.size, 10);
        this.currentPage = 1;
    }

    handleNext() {
        this.currentPage += 1;
    }

    handlePrevious() {
        this.currentPage -= 1;
    }

    handleDateChange(event) {
        const id = event.target.dataset.id;
        const order = this.virusOrders.find(o => o.Id === id);
        if (order) {
            order.CloseDate = event.target.value;
        }
    }

    handleReasonChange(event) {
        const id = event.target.dataset.id;
        const order = this.virusOrders.find(o => o.Id === id);
        if (order) {
            order.Delay_Reason__c = event.detail.value;
        }
    }

    handleCheckboxChange(event) {
        const id = event.target.dataset.id;
        if (event.target.checked) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
        this.virusOrders = this.virusOrders.map(order => ({
            ...order,
            isSelected: this.selectedIds.has(order.Id)
        }));
    }
}
