import { LightningElement, api } from 'lwc';

export default class BillingMethodList extends LightningElement {

    // =========================================================
    // EXPERIENCE BUILDER INPUT
    // =========================================================

    @api billingType = 'PO';


    // =========================================================
    // UI STATE
    // =========================================================

    showModal = false;

    modalMode = 'add';


    // =========================================================
    // MOCK DATA
    //
    // This will eventually come from Apex.
    // =========================================================

    poMethods = [

        {
            id: 'po1',
            name: 'PO-2026-001',
            type: 'Purchase Order',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added recently',

            fields: [
                {
                    label: 'PO Number',
                    value: 'PO-2026-001'
                },
                {
                    label: 'Organization',
                    value: 'Example Research Lab'
                },
                {
                    label: 'Amount',
                    value: '$5,000.00'
                },
                {
                    label: 'Expiration',
                    value: 'December 31, 2026'
                }
            ]
        },

        {
            id: 'po2',
            name: 'PO-2026-002',
            type: 'Purchase Order',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added recently',

            fields: [
                {
                    label: 'PO Number',
                    value: 'PO-2026-002'
                },
                {
                    label: 'Organization',
                    value: 'Example Research Lab'
                },
                {
                    label: 'Amount',
                    value: '$10,000.00'
                },
                {
                    label: 'Expiration',
                    value: 'June 30, 2027'
                }
            ]
        }

    ];


    creditCardMethods = [

        {
            id: 'cc1',
            name: 'Visa ending in 4242',
            type: 'Credit Card',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added recently',

            fields: [
                {
                    label: 'Card Type',
                    value: 'Visa'
                },
                {
                    label: 'Last Four',
                    value: '•••• 4242'
                },
                {
                    label: 'Name on Card',
                    value: 'Example User'
                },
                {
                    label: 'Expiration',
                    value: '12/2028'
                }
            ]
        },

        {
            id: 'cc2',
            name: 'Mastercard ending in 8888',
            type: 'Credit Card',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added previously',

            fields: [
                {
                    label: 'Card Type',
                    value: 'Mastercard'
                },
                {
                    label: 'Last Four',
                    value: '•••• 8888'
                },
                {
                    label: 'Name on Card',
                    value: 'Example User'
                },
                {
                    label: 'Expiration',
                    value: '08/2027'
                }
            ]
        }

    ];


    cfsMethods = [

        {
            id: 'cfs1',
            name: 'CFS-001',
            type: 'Chartfield',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added recently',

            fields: [
                {
                    label: 'Chartfield',
                    value: '123456'
                },
                {
                    label: 'Fund',
                    value: '12345'
                },
                {
                    label: 'Department',
                    value: 'NeuroTools'
                },
                {
                    label: 'Description',
                    value: 'Research supplies'
                }
            ]
        },

        {
            id: 'cfs2',
            name: 'CFS-002',
            type: 'Chartfield',
            status: 'Active',
            statusClass: 'status active',
            footerText: 'Added previously',

            fields: [
                {
                    label: 'Chartfield',
                    value: '789012'
                },
                {
                    label: 'Fund',
                    value: '67890'
                },
                {
                    label: 'Department',
                    value: 'Research'
                },
                {
                    label: 'Description',
                    value: 'Laboratory expenses'
                }
            ]
        }

    ];


    // =========================================================
    // GET CURRENT BILLING TYPE
    // =========================================================

    get billingMethods() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return this.creditCardMethods;

            case 'CFS':
                return this.cfsMethods;

            case 'PO':
            default:
                return this.poMethods;
        }
    }


    // =========================================================
    // NORMALIZE BILLING TYPE
    // =========================================================

    get normalizedBillingType() {

        const value =
            (this.billingType || '')
                .toString()
                .trim()
                .toUpperCase();

        if (
            value === 'CC' ||
            value === 'CREDIT CARD' ||
            value === 'CREDITCARD'
        ) {
            return 'CC';
        }

        if (
            value === 'CFS' ||
            value === 'CHARTFIELD' ||
            value === 'CHARTFIELDS'
        ) {
            return 'CFS';
        }

        return 'PO';
    }


    // =========================================================
    // PAGE TITLE
    // =========================================================

    get pageTitle() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'Credit Cards';

            case 'CFS':
                return 'Chartfields';

            case 'PO':
            default:
                return 'Purchase Orders';
        }
    }


    // =========================================================
    // PAGE DESCRIPTION
    // =========================================================

    get pageDescription() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'Manage the credit cards available for billing your NeuroTools orders.';

            case 'CFS':
                return 'Manage the chartfields available for billing your NeuroTools orders.';

            case 'PO':
            default:
                return 'Manage the purchase orders available for billing your NeuroTools orders.';
        }
    }


    // =========================================================
    // BUTTON LABEL
    // =========================================================

    get addButtonLabel() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'Add Credit Card';

            case 'CFS':
                return 'Add Chartfield';

            case 'PO':
            default:
                return 'Add Purchase Order';
        }
    }


    // =========================================================
    // SINGULAR / PLURAL
    // =========================================================

    get billingMethodSingular() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'credit card';

            case 'CFS':
                return 'chartfield';

            case 'PO':
            default:
                return 'purchase order';
        }
    }


    get billingMethodPlural() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'credit cards';

            case 'CFS':
                return 'chartfields';

            case 'PO':
            default:
                return 'purchase orders';
        }
    }


    // =========================================================
    // ICON
    // =========================================================

    get iconName() {

        switch (this.normalizedBillingType) {

            case 'CC':
                return 'utility:money';

            case 'CFS':
                return 'utility:table';

            case 'PO':
            default:
                return 'utility:contract';
        }
    }


    // =========================================================
    // SUMMARY
    // =========================================================

    get activeCount() {

        return this.billingMethods.filter(
            method =>
                method.status === 'Active'
        ).length;
    }


    get hasBillingMethods() {

        return this.billingMethods.length > 0;
    }


    // =========================================================
    // ADD
    // =========================================================

    handleAdd() {

        this.modalMode = 'add';

        this.showModal = true;
    }


    // =========================================================
    // VIEW
    // =========================================================

    handleView(event) {

        const id =
            event.currentTarget.dataset.id;

        console.log(
            'View billing method:',
            id
        );

        this.modalMode = 'view';

        this.showModal = true;
    }


    // =========================================================
    // EDIT
    // =========================================================

    handleEdit(event) {

        const id =
            event.currentTarget.dataset.id;

        console.log(
            'Edit billing method:',
            id
        );

        this.modalMode = 'edit';

        this.showModal = true;
    }


    // =========================================================
    // CLOSE MODAL
    // =========================================================

    handleCloseModal() {

        this.showModal = false;
    }


    // =========================================================
    // SAVE
    // =========================================================

    handleSave() {

        console.log(
            'Save billing method'
        );

        this.showModal = false;
    }


    // =========================================================
    // MODAL TITLE
    // =========================================================

    get modalTitle() {

        if (this.modalMode === 'edit') {
            return `Edit ${this.billingMethodSingular}`;
        }

        if (this.modalMode === 'view') {
            return `View ${this.billingMethodSingular}`;
        }

        return `Add ${this.billingMethodSingular}`;
    }

}