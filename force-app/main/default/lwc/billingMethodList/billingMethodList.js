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
    selectedBillingMethodId = null;

    flowApiName = null;
    flowContactId = null;

    /*
     * Modal mode:
     *
     * view = read-only billing method details
     * add  = creation Flow
     * edit = Edit_Billing_Method Flow
     */
    modalMode = null;

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


    // ============================================================
    // LOAD CURRENT USER CONTACT
    // ============================================================

    async loadContactId() {

        try {

            this.flowContactId =
                await getCurrentUserContactId();

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

            return refreshApex(
                this.wiredBillingMethodsResult
            );
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

        /*
         * Clear any previously selected billing method.
         */
        this.selectedBillingMethod = null;
        this.selectedBillingMethodId = null;

        /*
         * Set modal mode to ADD.
         */
        this.modalMode = 'add';

        /*
         * Select the appropriate creation Flow.
         */
        switch (this.billingType) {

            case 'PO':

                this.flowApiName =
                    'LWC_Purchase_Order_Modal';

                break;

            case 'CC':

                this.flowApiName =
                    'LWC_Credit_Card_Modal';

                break;

            case 'CFS':

                this.flowApiName =
                    'LWC_Chartfield_String_Modal';

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

        /*
         * Store the selected record ID.
         */
        this.selectedBillingMethodId = recordId;

        /*
         * View mode uses the existing read-only
         * billing method fields.
         */
        this.modalMode = 'view';

        /*
         * No Flow is needed for viewing.
         */
        this.flowApiName = null;

        this.showModal = true;
    }


    // ============================================================
    // EDIT
    // ============================================================

    handleEdit(event) {

        const recordId =
            event.currentTarget.dataset.id;

        /*
         * Find the billing method that was clicked.
         */
        this.selectedBillingMethod =
            this.billingMethods.find(
                method => method.id === recordId
            );

        /*
         * Store the record ID that will be passed
         * into the Edit_Billing_Method Flow.
         */
        this.selectedBillingMethodId = recordId;

        /*
         * Put the modal into EDIT mode.
         */
        this.modalMode = 'edit';

        /*
         * All billing types use the same edit Flow.
         */
        this.flowApiName =
            'Edit_Billing_Method';

        this.showModal = true;

        console.log(
            'Opening Edit_Billing_Method Flow',
            {
                recordId: this.selectedBillingMethodId,
                billingType: this.billingType,
                contactId: this.flowContactId
            }
        );
    }


    // ============================================================
    // CLOSE MODAL
    // ============================================================

    handleCloseModal() {

        this.showModal = false;

        this.selectedBillingMethod = null;
        this.selectedBillingMethodId = null;

        this.flowApiName = null;
        this.modalMode = null;
    }


    // ============================================================
    // FLOW INPUT VARIABLES
    // ============================================================

    /*
     * Creation Flows only need the Contact ID.
     *
     * Edit_Billing_Method receives:
     *
     *     recordId
     *     billingType
     *     contactId
     */
    get flowInputVariables() {

        /*
         * EDIT FLOW
         */
        if (this.modalMode === 'edit') {

            if (
                !this.selectedBillingMethodId ||
                !this.billingType ||
                !this.flowContactId
            ) {

                return [];
            }

            return [

                {
                    name: 'recordId',
                    type: 'String',
                    value: this.selectedBillingMethodId
                },

                {
                    name: 'billingType',
                    type: 'String',
                    value: this.billingType
                },

                {
                    name: 'contactId',
                    type: 'String',
                    value: this.flowContactId
                }
            ];
        }


        /*
         * ADD FLOW
         */
        if (this.modalMode === 'add') {

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


        /*
         * VIEW MODE
         */
        return [];
    }


    // ============================================================
    // MODAL MODE GETTERS
    // ============================================================

    get isViewMode() {

        return this.modalMode === 'view';
    }


    get isFlowMode() {

        return (
            this.modalMode === 'add' ||
            this.modalMode === 'edit'
        );
    }


    // ============================================================
    // FLOW FINISHED
    // ============================================================

    async handleFlowStatusChange(event) {

        const status =
            event.detail.status;

        console.log(
            'Billing method Flow status:',
            status
        );


        /*
         * FLOW ERROR
         */
        if (status === 'ERROR') {

            console.error(
                'Billing method Flow error:',
                event.detail
            );

            return;
        }


        /*
         * FLOW CANCELED
         */
        if (status === 'CANCELED') {

            this.handleCloseModal();

            return;
        }


        /*
         * Ignore all statuses other than FINISHED.
         */
        if (status !== 'FINISHED') {

            return;
        }


        /*
         * Close the modal.
         */
        this.handleCloseModal();


        /*
         * Refresh the wired billing-method data.
         *
         * This means the newly created or edited
         * billing record will immediately appear
         * in the list.
         */
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

        if (this.wiredBillingMethodsResult) {

            refreshApex(
                this.wiredBillingMethodsResult
            );

        } else {

            console.warn(
                'No wired billing-method result available to refresh.'
            );
        }
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
            method =>
                method.statusClass === 'status active'
        ).length;
    }


    get hasBillingMethods() {

        return this.billingMethods.length > 0;
    }


    get hasError() {

        return !!this.errorMessage;
    }


    get modalTitle() {

        /*
         * EDIT
         */
        if (this.modalMode === 'edit') {
            return `Edit ${this.billingType === 'PO'
                ? 'Purchase Order'
                : this.billingType === 'CC'
                    ? 'Credit Card'
                    : this.billingType === 'CFS'
                        ? 'Chartfield'
                        : 'Billing Method'}`;
        }


        /*
         * VIEW
         */
        if (
            this.modalMode === 'view' &&
            this.selectedBillingMethod
        ) {

            return `View ${this.selectedBillingMethod.type}`;
        }


        /*
         * ADD
         */
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

            if (
                typeof error.body.message === 'string'
            ) {

                return error.body.message;
            }


            if (
                Array.isArray(error.body)
            ) {

                return error.body
                    .map(item => item.message)
                    .filter(Boolean)
                    .join(', ');
            }
        }


        if (
            typeof error.message === 'string'
        ) {

            return error.message;
        }


        return 'Unable to load billing methods.';
    }
}