import { LightningElement, api, track } from 'lwc';
import getBillingMethods from '@salesforce/apex/BillingMethodListController.getBillingMethods';

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


    // ============================================================
    // LIFECYCLE
    // ============================================================

    connectedCallback() {
        this.loadBillingMethods();
    }


    // ============================================================
    // LOAD BILLING METHODS
    // ============================================================

    async loadBillingMethods() {

        this.isLoading = true;
        this.errorMessage = null;

        try {

            const result = await getBillingMethods({
                billingType: this.billingType
            });

            this.billingMethods = (result || []).map(method => {
                return {
                    ...method,
                    fields: method.fields || []
                };
            });

        } catch (error) {

            console.error(
                'Error loading billing methods:',
                error
            );

            this.billingMethods = [];

            this.errorMessage =
                this.getErrorMessage(error);

        } finally {

            this.isLoading = false;
        }
    }


    // ============================================================
    // REFRESH
    // ============================================================

    @api
    refresh() {
        return this.loadBillingMethods();
    }


    // ============================================================
    // ADD BILLING METHOD
    // ============================================================

    handleAdd() {

        this.selectedBillingMethod = null;
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