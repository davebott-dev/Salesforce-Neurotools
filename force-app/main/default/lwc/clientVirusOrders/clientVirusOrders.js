import { LightningElement, wire, track } from 'lwc';
import getClientVirusOrders from '@salesforce/apex/ClientOrderController.getClientVirusOrders';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import CONTACT_ID from '@salesforce/schema/User.ContactId';

export default class ClientVirusOrders extends LightningElement {
    @track contactId;
    @track allOrders = [];
    @track filteredOrders = [];
    @track paginatedOrders = [];
    @track selectedVirusType = '';
    @track searchTerm = '';
    @track sortedBy = 'EstimatedShipDate';
    @track sortedDirection = 'desc';

    @track pageNumber = 1;
    @track pageSize = 10;
    @track totalPages = 0;

    @track showMyOrdersOnly = false;

    virusTypeOptions = [
        { label: 'All Types', value: '' },
        { label: 'AAV', value: 'AAV' },
        { label: 'Rabies', value: 'Rabies' },
        { label: 'Lenti', value: 'Lenti' },
        { label: 'HSV', value: 'HSV' }
    ];

    pageSizeOptions = [
        { label: '10', value: 10 },
        { label: '25', value: 25 },
        { label: '50', value: 50 }
    ];

    draftStages = [
    'Draft',
    'Waiting for Approval',
    'Order Review in Progress',
    'Waiting for DNA',
    'Clone Construct',
    'DNA Prep in Progress',
    'Inventory Check',
    'Ready for Production',
];

    columns = [
        {
            label: 'Order #',
            fieldName: 'recordLink',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'OrderNumber' },
                target: '_self'
            },
            sortable: true
        },
        { label: 'Virus Type', fieldName: 'VirusType', sortable: true },
        { label: 'Capsid', fieldName: 'Capsid', sortable: true },
        { label: 'VO Construct', fieldName: 'VO_Construct', sortable: true },
        { label: 'Requestor', fieldName: 'Requestor', sortable: true },
        { label: 'Stage', fieldName: 'Stage', sortable: true },
        {
    label: 'Estimated Ship Date',
    fieldName: 'displayShipDate',
    type: 'text', 
    sortable: true
},

        { label: 'Titer', fieldName: 'displayTiter', sortable: true },
        { label: 'End Volume', fieldName: 'EndVolume' }
    ];

    @wire(getRecord, { recordId: USER_ID, fields: [CONTACT_ID] })
    wiredUser({ error, data }) {
        if (data) {
            this.contactId = data.fields.ContactId.value;
            this.loadData();
        } else if (error) {
            console.error('Error fetching contact ID', error);
        }
    }

    loadData() {
        if (!this.contactId) return;
        getClientVirusOrders({
            contactId: this.contactId,
            searchTerm: this.searchTerm,
            virusType: this.selectedVirusType,
            showMyOrdersOnly: this.showMyOrdersOnly
        })
            .then(data => {
                this.allOrders = data.map(row => {
    const isDraftStage = this.draftStages.includes(row.Stage);

    let displayTiter = '';

    if (row.Titer) {
        const titerStr = String(row.Titer).trim();

        // 🔹 Detect existing units (e.g. "4E+08 IU/mL")
        const hasUnits = /(GC\/mL|IU\/mL)/i.test(titerStr);

        if (hasUnits) {
            displayTiter = titerStr;
        } else {
            const unit = row.VirusType === 'AAV' ? 'GC/mL' : 'IU/mL';
            displayTiter = `${titerStr} ${unit}`;
        }
    }

    return {
        ...row,
        recordLink: `/opportunity/${row.Id}/${row.OrderNumber || ''}`,
        displayShipDate: isDraftStage ? 'TBD' : row.EstimatedShipDate,
        displayTiter
    };
});



                this.filteredOrders = [...this.allOrders];
                this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);
                this.pageNumber = 1;
                this.sortData(this.sortedBy, this.sortedDirection);
            })
            .catch(error => {
                console.error('Error loading virus orders:', error);
            });
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.loadData();
    }

    handleTypeChange(event) {
        this.selectedVirusType = event.detail.value;
        this.loadData();
    }

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortData(this.sortedBy, this.sortedDirection);
    }

    sortData(field, direction) {
        const sorted = [...this.filteredOrders].sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';
            return direction === 'asc'
                ? (valA > valB ? 1 : valA < valB ? -1 : 0)
                : (valA < valB ? 1 : valA > valB ? -1 : 0);
        });
        this.filteredOrders = sorted;
        this.updatePaginatedOrders();
    }

    updatePaginatedOrders() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedOrders = this.filteredOrders.slice(start, end);
    }

    handlePrevPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updatePaginatedOrders();
        }
    }

    handleNextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updatePaginatedOrders();
        }
    }

    handlePageSizeButtonClick(event) {
        const newSize = parseInt(event.target.dataset.size, 10);
        if (!isNaN(newSize)) {
            this.pageSize = newSize;
            this.totalPages = Math.ceil(this.filteredOrders.length / newSize);
            this.pageNumber = 1;
            this.updatePaginatedOrders();
        }
    }

    getPageSizeButtonClass(size) {
        return `slds-button slds-button_neutral slds-m-left_x-small ${this.pageSize == size ? 'slds-button_brand' : ''}`;
    }

    get pageSizeButtons() {
        return this.pageSizeOptions.map(option => ({
            label: option.label,
            value: option.value,
            class: `slds-button slds-button_neutral slds-m-left_x-small ${this.pageSize == option.value ? 'slds-button_brand' : ''}`
        }));
    }

    get isPrevDisabled() {
        return this.pageNumber <= 1;
    }

    get isNextDisabled() {
        return this.pageNumber >= this.totalPages;
    }

    handleToggleShowMyOrders() {
        this.showMyOrdersOnly = !this.showMyOrdersOnly;
        this.loadData();
    }

    get showMyOrdersLabel() {
        return this.showMyOrdersOnly ? 'Show All Orders' : 'Show My Orders Only';
    }

    get toggleButtonVariant() {
        return this.showMyOrdersOnly ? 'brand' : 'neutral';
    }
}
