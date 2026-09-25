import { LightningElement, track, wire, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getDraftOrdersForUser from '@salesforce/apex/DraftOrderController.getDraftOrdersForUser';
import deleteDraftOrder from '@salesforce/apex/DraftOrderController.deleteDraftOrder';
import getCartStatus from '@salesforce/apex/CartController.getCartStatus';

const COLUMNS = [
    {
        label: 'Draft Order Number',
        type: 'button',
        typeAttributes: {
            label: { fieldName: 'draftOrder1Label' },
            name: 'navigate',
            variant: 'base'
        }
    },
    { label: 'Order Type', fieldName: 'customOrStock', type: 'text' },
    { label: 'Virus Type', fieldName: 'virusType', type: 'text' },
    { label: 'Construct Name', fieldName: 'constructName', type: 'text' },
    { label: 'Capsid/Envelope Name', fieldName: 'capsidName', type: 'text' },
    { label: 'End Volume', fieldName: 'endVolume', type: 'text' },
    { label: 'Price', fieldName: 'totalPrice', type: 'currency' },
    { label: 'Quantity', fieldName: 'quantity', type: 'text' },
    {
        type: 'button',
        typeAttributes: {
            label: 'Delete',
            name: 'delete',
            title: 'Delete Draft Order',
            variant: 'brand'
        }
    }
];

export default class DraftOrderDatatable extends NavigationMixin(LightningElement) {
    @api flowContactId;
    @track columns = COLUMNS;
    @track draftOrders = [];
    @track totalCartPrice = 0;
    @track cartStatus;
    @track submittedDateText;
    @track selectedDraftOrderIds = [];
    @track hideCheckbox = false;
    @track selectedRowIds = [];

    @api selectedRowsOutput = [];

    @api selectedRowsInput = [];

    wiredDraftOrdersResult;

    @wire(getDraftOrdersForUser)
wiredDraftOrders(result) {
    this.wiredDraftOrdersResult = result;

    if (result.data) {

        this.draftOrders = result.data.map(row => ({
            ...row,
            draftOrder1: row.draftOrderId,
            draftOrder1Label: row.draftOrderName || 'View'
        }));

        /*
         * If Flow gave us a previous selection,
         * restore that selection.
         *
         * Otherwise, select all orders.
         */
        if (
            this.selectedRowsInput &&
            this.selectedRowsInput.length > 0
        ) {

            const validIds = new Set(
                this.draftOrders.map(row => row.draftOrderId)
            );

            this.selectedDraftOrderIds =
                this.selectedRowsInput.filter(
                    id => validIds.has(id)
                );

        } else {

            this.selectedDraftOrderIds =
                this.draftOrders.map(
                    row => row.draftOrderId
                );
        }

        this.selectedRowIds = [
            ...this.selectedDraftOrderIds
        ];

        /*
         * IMPORTANT:
         * Tell Flow what the initial selection is.
         */
        this.notifyFlowOfSelection();

        console.log(
            'INITIAL SELECTION:',
            JSON.stringify(this.selectedDraftOrderIds)
        );

        this.totalCartPrice = this.draftOrders.reduce(
            (sum, item) =>
                sum + (item.totalPrice || 0),
            0
        );

    } else if (result.error) {

        this.showToast(
            'Error',
            result.error.body?.message ||
                result.error.message,
            'error'
        );
    }
}

    connectedCallback() {
        this.fetchCartStatus();
    }

    refreshData() {
        if (this.wiredDraftOrdersResult) {
            refreshApex(this.wiredDraftOrdersResult);
        }
        this.fetchCartStatus();
    }

    fetchCartStatus() {
        getCartStatus()
            .then(result => {
                if (result) {
                    this.cartStatus = result.status;
                    this.submittedDateText = result.lastSubmissionTime
                        ? new Date(result.lastSubmissionTime).toLocaleString()
                        : null;
                }
            })
            .catch(error => {
                this.showToast(
                    'Error',
                    error.body?.message || error.message,
                    'error'
                );
            });
    }

handleRowSelection(event) {

    this.selectedDraftOrderIds =
        event.detail.selectedRows.map(
            r => r.draftOrderId
        );

    this.selectedRowIds = [
        ...this.selectedDraftOrderIds
    ];

    console.log(
        'USER SELECTED:',
        JSON.stringify(this.selectedDraftOrderIds)
    );

    this.notifyFlowOfSelection();

    this.dispatchEvent(
        new CustomEvent('selectionchange', {
            detail: this.selectedDraftOrderIds
        })
    );
}

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'navigate') {
            this.navigateToDraftOrder(row.draftOrderId);
        }

        if (actionName === 'delete') {
            if (
                confirm(
                    'Are you sure you want to delete this Draft Order from your cart?'
                )
            ) {
                this.deleteDraftOrder(row.draftOrderId);
            }
        }
    }

    navigateToDraftOrder(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId,
                objectApiName: 'Draft_Virus_Order__c',
                actionName: 'view'
            }
        });
    }

    deleteDraftOrder(draftOrderId) {
        deleteDraftOrder({ draftOrderId })
            .then(() => {
                this.showToast('Success', 'Draft Order deleted', 'success');

                this.draftOrders = this.draftOrders.filter(
                    row => row.draftOrderId !== draftOrderId
                );

                // Remove from selected
                this.selectedDraftOrderIds = this.selectedDraftOrderIds.filter(
                    id => id !== draftOrderId
                );
                this.selectedRowIds = [...this.selectedDraftOrderIds];

                this.totalCartPrice = this.draftOrders.reduce(
                    (sum, item) => sum + (item.totalPrice || 0),
                    0
                );
            })
            .catch(error => {
                this.showToast(
                    'Error',
                    error.body?.message || error.message,
                    'error'
                );
            });
    }

    get isSubmitted() {
        return this.cartStatus === 'Submitted';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }

    handleBackToOrderForm() {
        window.location.href = '/s/createorder';
    }

    notifyFlowOfSelection() {
    this.selectedRowsOutput = [...this.selectedDraftOrderIds];

    this.dispatchEvent(
        new FlowAttributeChangeEvent(
            'selectedRowsOutput',
            this.selectedRowsOutput
        )
    );
}
}