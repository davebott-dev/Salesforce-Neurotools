import { LightningElement, api, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';

import getBillingMethods from '@salesforce/apex/BillingMethodListController.getBillingMethods';
import getCurrentUserContactId from '@salesforce/apex/BillingMethodListController.getCurrentUserContactId';

export default class BillingMethodList extends LightningElement {

    // ============================================================
    // EXPERIENCE BUILDER INPUT
    // ============================================================

    @api billingType = 'PO';


    // ============================================================
    // STATE
    // ============================================================

    @track billingMethods = [];

    isLoading = false;
    errorMessage = null;

    showModal = false;
    selectedBillingMethod = null;

    flowApiName = null;
    flowContactId = null;
    wiredBillingMethodsResult;

    // ============================================================
    // LIFECYCLE
    // ============================================================

    connectedCallback() {
        this.loadContactId();
    }


    // ============================================================
    // LOAD BILLING METHODS
    // ============================================================

@wire(getBillingMethods, { billingType: '$billingType' })
wiredBillingMethods(result) {

    this.wiredBillingMethodsResult = result;

    const { data, error } = result;

    if (data) {

        this.billingMethods = (data || []).map(method => {
            return {
                ...method,
                fields: method.fields || []
            };
        });

        this.errorMessage = null;
        this.isLoading = false;

    } else if (error) {

        console.error(
            'Error loading billing methods:',
            error
        );

        this.billingMethods = [];
        this.errorMessage = this.getErrorMessage(error);
        this.isLoading = false;
    }
}

async loadContactId() {
    try {
        this.flowContactId = await getCurrentUserContactId();

        console.log(
            'BillingMethodList flowContactId:',
            this.flowContactId
        );

    } catch (error) {
        console.error(
            'Error loading current user ContactId:',
            error
        );

        this.flowContactId = null;
    }
}
    // ============================================================
    // REFRESH
    // ============================================================

  @api
refresh() {
    if (this.wiredBillingMethodsResult) {
        return refreshApex(this.wiredBillingMethodsResult);
    }

    return Promise.resolve();
}


    // ============================================================
    // ADD BILLING METHOD
    // ============================================================

handleAdd() {

    if (!this.flowContactId) {
        console.error(
            'Cannot open billing creation Flow: Contact ID is missing.'
        );

        this.errorMessage =
            'Unable to determine the current portal user. Please refresh the page and try again.';

        return;
    }

    this.selectedBillingMethod = null;

    switch (this.billingType) {

        case 'PO':
            this.flowApiName = 'LWC_Purchase_Order_Modal';
            break;

        case 'CC':
            this.flowApiName = 'LWC_Credit_Card_Modal';
            break;

        case 'CFS':
            this.flowApiName = 'LWC_Chartfield_String_Modal';
            break;

        default:
            this.flowApiName = null;

            console.error(
                'Unsupported billing type:',
                this.billingType
            );

            return;
    }

    this.showModal = true;
}


    // ============================================================
    // VIEW
    // ============================================================

    handleView(event) {

        const recordId =
            event.currentTarget.dataset.id;

        this.selectedBillingMethod =
            this.billingMethods.find(
                method => method.id === recordId
            );

        this.showModal = true;
    }


    // ============================================================
    // EDIT
    // ============================================================

    handleEdit(event) {

        const recordId =
            event.currentTarget.dataset.id;

        this.selectedBillingMethod =
            this.billingMethods.find(
                method => method.id === recordId
            );

        this.showModal = true;
    }


    // ============================================================
    // CLOSE MODAL
    // ============================================================

    handleCloseModal() {

        this.showModal = false;
        this.selectedBillingMethod = null;
        this.flowApiName = null;
    }


    // ============================================================
    // FLOW FINISHED
    // ============================================================

  async handleFlowStatusChange(event) {

    const status = event.detail.status;

    console.log(
        'Billing creation Flow status:',
        status
    );

    if (status === 'ERROR') {

        console.error(
            'Billing creation Flow error:',
            event.detail
        );

        return;
    }

    if (status === 'CANCELED') {
        this.handleCloseModal();
        return;
    }

    if (status !== 'FINISHED') {
        return;
    }

    // Close the Flow modal
    this.handleCloseModal();

    // Refresh the wired Apex data
    try {

        await refreshApex(
            this.wiredBillingMethodsResult
        );

        console.log(
            'Billing methods refreshed successfully.'
        );

    } catch (error) {

        console.error(
            'Error refreshing billing methods:',
            error
        );

    }
}


    // ============================================================
    // RETRY
    // ============================================================

    handleRetry() {
        this.loadBillingMethods();
    }


    // ============================================================
    // DISPLAY HELPERS
    // ============================================================

    get pageTitle() {

        switch (this.billingType) {

            case 'PO':
                return 'Purchase Orders';

            case 'CC':
                return 'Credit Cards';

            case 'CFS':
                return 'Chartfields';

            default:
                return 'Billing Methods';
        }
    }


    get pageDescription() {

        switch (this.billingType) {

            case 'PO':
                return 'Manage purchase orders available for your organization.';

            case 'CC':
                return 'Manage credit cards available for your organization.';

            case 'CFS':
                return 'Manage chartfield strings available for your organization.';

            default:
                return 'Manage your billing methods.';
        }
    }


    get addButtonLabel() {

        switch (this.billingType) {

            case 'PO':
                return 'Add Purchase Order';

            case 'CC':
                return 'Add Credit Card';

            case 'CFS':
                return 'Add Chartfield';

            default:
                return 'Add Billing Method';
        }
    }


    get headerIcon() {

        switch (this.billingType) {

            case 'PO':
                return 'utility:money';

            case 'CC':
                return 'utility:card_details';

            case 'CFS':
                return 'utility:product_transfer';

            default:
                return 'utility:billing';
        }
    }


    get emptyStateTitle() {

        switch (this.billingType) {

            case 'PO':
                return 'No Purchase Orders';

            case 'CC':
                return 'No Credit Cards';

            case 'CFS':
                return 'No Chartfields';

            default:
                return 'No Billing Methods';
        }
    }


    get emptyStateMessage() {

        switch (this.billingType) {

            case 'PO':
                return 'You do not currently have any purchase orders associated with your organization.';

            case 'CC':
                return 'You do not currently have any credit cards associated with your organization.';

            case 'CFS':
                return 'You do not currently have any chartfield strings associated with your organization.';

            default:
                return 'You do not currently have any billing methods.';
        }
    }


    get totalCount() {
        return this.billingMethods.length;
    }


    get activeCount() {

        return this.billingMethods.filter(
            method => method.statusClass === 'status active'
        ).length;
    }


    get hasBillingMethods() {
        return this.billingMethods.length > 0;
    }


    get hasError() {
        return !!this.errorMessage;
    }


    get modalTitle() {

        if (this.selectedBillingMethod) {
            return `View ${this.selectedBillingMethod.type}`;
        }

        return this.addButtonLabel;
    }


    get pageTitleLowerCase() {
        return this.pageTitle.toLowerCase();
    }

get flowInputVariables() {

    if (!this.flowContactId) {
        return [];
    }

    return [
        {
            name: 'contactId',
            type: 'String',
            value: this.flowContactId
        }
    ];
}
    // ============================================================
    // ERROR HANDLING
    // ============================================================

    getErrorMessage(error) {

        if (!error) {
            return 'An unexpected error occurred.';
        }

        if (error.body) {

            if (typeof error.body.message === 'string') {
                return error.body.message;
            }

            if (Array.isArray(error.body)) {

                return error.body
                    .map(item => item.message)
                    .filter(Boolean)
                    .join(', ');
            }
        }

        if (typeof error.message === 'string') {
            return error.message;
        }

        return 'Unable to load billing methods.';
    }
}