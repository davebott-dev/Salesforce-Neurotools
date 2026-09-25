import { LightningElement, api, track } from 'lwc';
import getVirusOrders from '@salesforce/apex/ContractVirusOrdersController.getVirusOrders';

const COLUMNS = [
    {
        label: 'Order Name',
        fieldName: 'recordLink',  // use a new field for URL
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },  // label shows the name text
            target: '_blank'                // open in new tab
        }
    },
    { label: 'Type', fieldName: 'Type' },
    { label: 'Stage', fieldName: 'StageName' },
    { label: 'Order Date', fieldName: 'Order_Date__c', type: 'date' },
    { label: 'Amount', fieldName: 'Amount', type: 'currency' }
];

export default class ContractVirusOrders extends LightningElement {
    columns = COLUMNS;
    @api recordId;
    @track virusOrders = [];
    @track pagedOrders = [];
    @track error;
    @track page = 1;
    @track pageSize = 10;
    @track totalPages = 1;

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        getVirusOrders({ contractId: this.recordId })
            .then(data => {
                // Add recordLink property for URL in each record
                this.virusOrders = data.map(order => {
                    return { ...order, recordLink: '/' + order.Id };
                });
                this.totalPages = Math.ceil(this.virusOrders.length / this.pageSize);
                this.updatePagedOrders();
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.virusOrders = [];
                this.pagedOrders = [];
                console.error('Error loading virus orders:', error);
            });
    }

    updatePagedOrders() {
        const start = (this.page - 1) * this.pageSize;
        const end = this.page * this.pageSize;
        this.pagedOrders = this.virusOrders.slice(start, end);
    }

    handlePrev() {
        if (this.page > 1) {
            this.page--;
            this.updatePagedOrders();
        }
    }

    handleNext() {
        if (this.page < this.totalPages) {
            this.page++;
            this.updatePagedOrders();
        }
    }

    handleRefresh() {
        this.page = 1;
        this.loadData();
    }

    get isFirstPage() {
        return this.page === 1;
    }

    get isLastPage() {
        return this.page === this.totalPages;
    }

    get hasData() {
        return this.pagedOrders.length > 0;
    }
}
