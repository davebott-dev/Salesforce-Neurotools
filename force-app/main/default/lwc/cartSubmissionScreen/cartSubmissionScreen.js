import { LightningElement, api, wire } from 'lwc';

import {
    FlowAttributeChangeEvent,
    FlowNavigationBackEvent,
    FlowNavigationNextEvent
} from 'lightning/flowSupport';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getDraftOrdersForUser
    from '@salesforce/apex/DraftOrderController.getDraftOrdersForUser';

import updateCartStatus
    from '@salesforce/apex/CartController.updateCartStatus';


export default class CartSubmissionScreen extends LightningElement {


// =========================================================
// FLOW INPUTS
// =========================================================

_selectedOrderIds = [];

_billingAssignments = '';


@api flowContactId;

@api labType;

@api contactCountry;


// =========================================================
// SHIPPING PREFERENCE
// =========================================================

@api shippingPreference = 'SINGLE';


// =========================================================
// SELECTED ORDER IDS
// =========================================================

@api
get selectedOrderIds() {

    return this._selectedOrderIds;
}


set selectedOrderIds(value) {

    console.log(
        'SUBMISSION SCREEN - selectedOrderIds INPUT:',
        JSON.stringify(value)
    );


    this._selectedOrderIds =
        Array.isArray(value)
            ? [...value]
            : [];


    this.rebuildSubmissionRows();
}


// =========================================================
// BILLING ASSIGNMENTS
// =========================================================

@api
get billingAssignments() {

    return this._billingAssignments;
}


set billingAssignments(value) {

    console.log(
        'SUBMISSION SCREEN - billingAssignments INPUT:',
        JSON.stringify(value)
    );


    this._billingAssignments =
        value || '';


    this.loadBillingAssignments();

    this.rebuildSubmissionRows();
}


// =========================================================
// BILLING RECORDS
// =========================================================

@api purchaseOrderRecords = [];

@api creditCardRecords = [];

@api chartfieldRecords = [];


// =========================================================
// FLOW OUTPUTS
// =========================================================

@api cartSubmitted = false;

@api virusOrderIds = [];


// =========================================================
// CART DATA
// =========================================================

draftOrders = [];

orderRows = [];

isLoading = true;

showSubmitCartFlow = false;

ccConfirmations = {};


// =========================================================
// BILLING ASSIGNMENTS
// =========================================================

billingAssignmentMap = {};


// =========================================================
// CONNECTED
// =========================================================

connectedCallback() {

    this.loadBillingAssignments();

}


// =========================================================
// LOAD ORDERS
// =========================================================

@wire(getDraftOrdersForUser)
wiredDraftOrders(result) {

    console.log(
        'SUBMISSION SCREEN - WIRED DRAFT ORDERS:',
        JSON.stringify(result.data)
    );


    if (result.data) {

        this.draftOrders = result.data;

        this.rebuildSubmissionRows();

        this.isLoading = false;

    }

    else if (result.error) {

        console.error(
            'SUBMISSION SCREEN LOAD ERROR:',
            result.error
        );


        this.isLoading = false;


        this.showToast(
            'Error',
            result.error.body?.message ||
                result.error.message ||
                'Unable to load order information.',
            'error'
        );

    }
}


// =========================================================
// LOAD BILLING ASSIGNMENTS
// =========================================================

loadBillingAssignments() {

    console.log(
        'SUBMISSION SCREEN - RAW BILLING INPUT:',
        this._billingAssignments
    );


    if (!this._billingAssignments) {

        this.billingAssignmentMap = {};

        console.log(
            'SUBMISSION SCREEN - NO BILLING ASSIGNMENTS'
        );

        return;
    }


    try {

        const assignments =
            typeof this._billingAssignments === 'string'
                ? JSON.parse(this._billingAssignments)
                : this._billingAssignments;


        console.log(
            'SUBMISSION SCREEN - PARSED BILLING:',
            JSON.stringify(assignments)
        );


        if (!Array.isArray(assignments)) {

            this.billingAssignmentMap = {};

            console.error(
                'SUBMISSION SCREEN - BILLING INPUT IS NOT AN ARRAY'
            );

            return;
        }


        const map = {};


        assignments.forEach(assignment => {

            if (
                assignment &&
                assignment.draftOrderId
            ) {

                map[assignment.draftOrderId] = {

                    ...assignment,

                    poLater:
                        assignment.poLater === true ||
                        String(
                            assignment.poLater
                        ).toLowerCase() === 'true'

                };

            }

        });


        this.billingAssignmentMap = map;


        console.log(
            'SUBMISSION SCREEN - BILLING MAP:',
            JSON.stringify(
                this.billingAssignmentMap
            )
        );

    }

    catch (error) {

        console.error(
            'SUBMISSION SCREEN - BILLING PARSE ERROR:',
            error
        );


        this.billingAssignmentMap = {};

    }

}


// =========================================================
// REBUILD SUBMISSION DATA
// =========================================================

rebuildSubmissionRows() {

    if (
        !this.draftOrders ||
        this.draftOrders.length === 0
    ) {

        return;
    }


    this.buildOrderRows();


    console.log(
        'SUBMISSION SCREEN - REBUILT ROWS:',
        JSON.stringify(this.orderRows)
    );

}


// =========================================================
// BUILD DISPLAY ROWS
// =========================================================

buildOrderRows() {

    const selectedIds =
        Array.isArray(this._selectedOrderIds)
            ? this._selectedOrderIds
            : [];


    console.log(
        'SUBMISSION SCREEN - BUILDING WITH SELECTED IDS:',
        JSON.stringify(selectedIds)
    );


    console.log(
        'SUBMISSION SCREEN - BUILDING WITH BILLING MAP:',
        JSON.stringify(this.billingAssignmentMap)
    );


    const selectedSet =
        new Set(selectedIds);


    this.orderRows = this.draftOrders

        .filter(order =>
            selectedSet.has(
                order.draftOrderId
            )
        )

        .map(order => {

            const assignment =
                this.billingAssignmentMap[
                    order.draftOrderId
                ] || {};


            const billingType =
                assignment.billingType || '';


            const poLater =
                assignment.poLater === true ||
                String(
                    assignment.poLater
                ).toLowerCase() === 'true';


            const purchaseOrderId =
                assignment.purchaseOrderId ||
                null;


            const creditCardId =
                assignment.creditCardId ||
                null;


            const chartfield =
                assignment.chartfield ||
                null;


            const total =
                Number(order.totalPrice) || 0;


            const requiresCCConfirmation =
                billingType === 'CC' &&
                total > 5000;


            const ccLimitConfirmed =
                this.ccConfirmations[
                    order.draftOrderId
                ] === true;


            const missingBilling =
                this.isBillingMissing(
                    billingType,
                    purchaseOrderId,
                    creditCardId,
                    chartfield,
                    poLater
                );


            console.log(
                'ORDER BILLING VALIDATION:',
                JSON.stringify({

                    draftOrderId:
                        order.draftOrderId,

                    billingType,

                    purchaseOrderId,

                    creditCardId,

                    chartfield,

                    poLater,

                    missingBilling

                })
            );


            return {

                ...order,

                draftOrderLabel:
                    order.draftOrderName ||
                    order.draftOrder1 ||
                    'Draft Order',

                billingType,

                billingMethodLabel:
                    this.getBillingMethodLabel(
                        billingType
                    ),

                isPO:
                    billingType === 'PO',

                isCC:
                    billingType === 'CC',

                isChartfield:
                    billingType === 'CHARTFIELD',

                poLater,

                purchaseOrderId,

                purchaseOrderLabel:
                    assignment.purchaseOrderName ||
                    this.getRecordName(
                        this.purchaseOrderRecords,
                        purchaseOrderId
                    ) ||
                    '',

                creditCardId,

                creditCardLabel:
    assignment.creditCardName ||
    this.getCreditCardName(
        this.creditCardRecords,
        creditCardId
    ) ||
    '',

                chartfield,

chartfieldLabel:
    assignment.chartfieldName ||
    this.getChartfieldName(
        this.chartfieldRecords,
        chartfield
    ) ||
    '',

                missingBilling,

                requiresCCConfirmation,

                ccLimitConfirmed,

                poBalanceError: false

            };

        });

}

getCreditCardName(records, recordId) {

    if (!recordId) {
        return '';
    }

    const record =
        (records || []).find(
            item =>
                item &&
                item.Id === recordId
        );

    return record
        ? record.Credit_Card_Name__c || ''
        : '';
}

getChartfieldName(records, recordId) {

    if (!recordId) {
        return '';
    }

    const record =
        (records || []).find(
            item =>
                item &&
                item.Id === recordId
        );

    return record
        ? record.Chartfield_String_Name__c || ''
        : '';
}
// =========================================================
// BILLING VALIDATION
// =========================================================

isBillingMissing(
    billingType,
    purchaseOrderId,
    creditCardId,
    chartfield,
    poLater
) {

    if (!billingType) {

        return true;
    }


    if (billingType === 'PO') {

        if (
            poLater === true ||
            String(poLater).toLowerCase() === 'true'
        ) {

            return false;
        }


        return !purchaseOrderId;
    }


    if (billingType === 'CC') {

        return !creditCardId;
    }


    if (billingType === 'CHARTFIELD') {

        return !chartfield;
    }


    return true;

}


// =========================================================
// RECORD NAME
// =========================================================

getRecordName(records, recordId) {

    if (!recordId) {

        return '';
    }


    const record =
        (records || []).find(
            item =>
                item &&
                item.Id === recordId
        );


    return record
        ? record.Name
        : '';

}


// =========================================================
// BILLING METHOD LABEL
// =========================================================

getBillingMethodLabel(type) {

    if (type === 'PO') {

        return 'Purchase Order';
    }


    if (type === 'CC') {

        return 'Credit Card';
    }


    if (type === 'CHARTFIELD') {

        return 'Chartfield String';
    }


    if (type === 'PO_LATER') {

        return 'Purchase Order';
    }


    return 'Not Selected';

}


// =========================================================
// CREDIT CARD CONFIRMATION
// =========================================================

handleCCConfirmation(event) {

    const draftOrderId =
        event.target.dataset.id;


    const checked =
        event.target.checked;


    this.ccConfirmations = {

        ...this.ccConfirmations,

        [draftOrderId]:
            checked

    };


    this.buildOrderRows();

}


// =========================================================
// TOTAL
// =========================================================

get totalSelectedPrice() {

    return this.orderRows.reduce(

        (sum, order) =>

            sum +
            (
                Number(
                    order.totalPrice
                ) || 0
            ),

        0

    );

}


// =========================================================
// SHIPPING CHARGE
// =========================================================

get shippingCharge() {

    if (
        this.orderRows.length === 0
    ) {

        return 0;
    }


    if (this.isInternalLab) {

        return 0;
    }


    if (this.isInternational) {

        return 170;
    }


    return 100;

}


// =========================================================
// GRAND TOTAL
// =========================================================

get grandTotal() {

    return (

        Number(
            this.totalSelectedPrice
        ) || 0

    ) + this.shippingCharge;

}


// =========================================================
// INTERNAL LAB
// =========================================================

get isInternalLab() {

    return (

        this.labType &&

        typeof this.labType === 'string' &&

        this.labType
            .toLowerCase()
            .includes('internal')

    );

}


// =========================================================
// INTERNATIONAL
// =========================================================

get isInternational() {

    const country =
        (this.contactCountry || '')
            .trim()
            .toLowerCase();


    if (!country) {

        return false;
    }


    return ![

        'united states',

        'united states of america',

        'usa',

        'us'

    ].includes(country);

}


// =========================================================
// SHIPPING PREFERENCE OPTIONS
// =========================================================

get shippingPreferenceOptions() {

    return [

        {
            label:
                'Ship all items together (one shipment)',

            value:
                'SINGLE'
        },

        {
            label:
                'Ship items as available (multiple shipments)',

            value:
                'MULTIPLE'
        }

    ];

}


// =========================================================
// SHOW SHIPPING PREFERENCE
// =========================================================

get showShippingPreference() {

    return (
        !this.isInternalLab &&
        this.orderRows.length > 1
    );

}


// =========================================================
// SHIPPING PREFERENCE DISPLAY
// =========================================================

get shippingPreferenceValue() {

    if (this.internalLab) {
        return'';
    }

    const orderNumbers =
        this.orderRows

            .map(order =>
                order.draftOrderLabel ||
                order.draftOrderName ||
                order.draftOrder1
            )

            .filter(Boolean);


    if (
        this.shippingPreference === 'MULTIPLE'
    ) {

        return (
            'Ship items as available ' +
            '(multiple shipments): [' +
            orderNumbers.join(',') +
            ']'
        );

    }


    if (
        this.shippingPreference === 'SINGLE'
    ) {

        return (
            'Ship all items together ' +
            '(one shipment): [' +
            orderNumbers.join(',') +
            ']'
        );

    }


    return '';

}


// =========================================================
// SHIPPING PREFERENCE LABEL
// =========================================================

get shippingPreferenceLabel() {

    if (
        this.shippingPreference === 'MULTIPLE'
    ) {

        return 'Ship items as available (multiple shipments)';
    }


    if (
        this.shippingPreference === 'SINGLE'
    ) {

        return 'Ship all items together (one shipment)';
    }


    return '';

}


// =========================================================
// SHIPPING PREFERENCE CHANGE
// =========================================================

handleShippingPreferenceChange(event) {

    this.shippingPreference =
        event.detail.value;


    console.log(
        'SHIPPING PREFERENCE SELECTED:',
        this.shippingPreference
    );


    console.log(
        'SHIPPING PREFERENCE FLOW VALUE:',
        this.shippingPreferenceValue
    );

}


// =========================================================
// SHIPPING PREFERENCE VALIDATION
// =========================================================

get hasShippingPreferenceError() {

    return (

        !this.isInternalLab &&

        this.orderRows.length > 1 &&

        !this.shippingPreference

    );

}

// =========================================================
// VALIDATION
// =========================================================

get hasValidationErrors() {

    if (
        this.orderRows.length === 0
    ) {

        return true;
    }


    if (
        this.hasShippingPreferenceError
    ) {

        return true;
    }


    return this.orderRows.some(
        order => {

            if (
                order.missingBilling
            ) {

                return true;
            }


            if (
                order.poBalanceError
            ) {

                return true;
            }


            if (
                order.requiresCCConfirmation &&
                !order.ccLimitConfirmed
            ) {

                return true;
            }


            return false;

        }
    );

}


get isSingleShipmentPreference() {

    return this.shippingPreference === 'SINGLE';

}


get isMultipleShipmentPreference() {

    return this.shippingPreference === 'MULTIPLE';

}


// =========================================================
// CAN SUBMIT
// =========================================================

get canSubmit() {

    return (

        this.orderRows.length > 0 &&

        !this.hasValidationErrors

    );

}


// =========================================================
// DISABLE SUBMIT
// =========================================================

get disableSubmit() {

    return (

        this.isLoading ||

        !this.canSubmit ||

        this.showSubmitCartFlow

    );

}


// =========================================================
// ORDER COUNT
// =========================================================

get selectedOrderCount() {

    return this.orderRows.length;

}


get selectedOrderLabel() {

    return this.orderRows.length === 1
        ? 'order selected'
        : 'orders selected';

}


// =========================================================
// HAS ORDERS
// =========================================================

get hasOrders() {

    return this.orderRows.length > 0;

}


get showNoOrders() {

    return (

        !this.isLoading &&

        this.orderRows.length === 0

    );

}


// =========================================================
// SUBMIT FLOW INPUTS
// =========================================================

get submitCartFlowInputs() {

    const ids =
        Array.isArray(this.selectedOrderIds)
            ? [...this.selectedOrderIds]
            : [];

    return [

        {
            name: 'SelectedOrderIds',

            type: 'String',

            value: ids
        },

        {
            name: 'ShippingPreference',

            type: 'String',

            value: this.shippingPreference
        }

    ];
}


// =========================================================
// SUBMIT
// =========================================================

handleSubmit() {

    console.log(
        'CAN SUBMIT:',
        this.canSubmit
    );


    console.log(
        'HAS VALIDATION ERRORS:',
        this.hasValidationErrors
    );


    console.log(
        'SHIPPING PREFERENCE:',
        this.shippingPreference
    );


    console.log(
        'SHIPPING PREFERENCE VALUE:',
        this.shippingPreferenceValue
    );


    console.log(
        'ORDER ROWS:',
        JSON.stringify(
            this.orderRows
        )
    );


    if (
        !this.canSubmit
    ) {

        this.showToast(

            'Cannot Submit',

            this.hasShippingPreferenceError

                ? 'Please select a shipping preference before submitting.'

                : 'Please resolve all billing requirements before submitting.',

            'warning'

        );


        return;
    }


    /*
     * Make sure the child Flow is not already
     * running before starting it.
     */

    this.showSubmitCartFlow = false;


    /*
     * Small delay forces Lightning to remove
     * and recreate the child Flow component.
     */

    setTimeout(() => {

        this.showSubmitCartFlow = true;

    }, 100);

}


// =========================================================
// SUBMIT FLOW STATUS
// =========================================================

handleSubmitCartFlowStatusChange(event) {

    const status =
        event.detail.status;


    console.log(
        'Submit_Cart status:',
        status
    );


    const outputVariables =
        event.detail.outputVariables || [];


    console.log(
        'Submit_Cart output variables:',
        JSON.stringify(outputVariables)
    );


    /*
     * We only want to continue when the
     * child Submit_Cart Flow has completely
     * finished.
     */

    if (status !== 'FINISHED') {

        return;
    }


    // =====================================================
    // GET VIRUS ORDER IDS FROM SUBMIT_CART
    // =====================================================

    const virusOrderIdsOutput =
        outputVariables.find(
            variable =>
                variable &&
                variable.name === 'VirusOrderIds'
        );


    if (
        virusOrderIdsOutput &&
        virusOrderIdsOutput.value
    ) {

        const value =
            virusOrderIdsOutput.value;


        /*
         * Salesforce Flow Text Collection
         * normally arrives as an Array.
         *
         * Normalize it so the parent Flow
         * receives a String[].
         */

        if (Array.isArray(value)) {

            this.virusOrderIds =
                value.map(
                    id => String(id)
                );

        }

        else {

            this.virusOrderIds = [
                String(value)
            ];

        }

    }

    else {

        console.warn(
            'Submit_Cart did not return VirusOrderIds.'
        );


        this.virusOrderIds = [];

    }


    console.log(
        'CREATED VIRUS ORDER IDS:',
        JSON.stringify(
            this.virusOrderIds
        )
    );


    // =====================================================
    // SEND VIRUS ORDER IDS TO PARENT FLOW
    // =====================================================

    this.dispatchEvent(
        new FlowAttributeChangeEvent(
            'virusOrderIds',
            this.virusOrderIds
        )
    );


    // =====================================================
    // VALIDATE SELECTED ORDERS
    // =====================================================

    if (
        !this.selectedOrderIds ||
        this.selectedOrderIds.length === 0
    ) {

        this.showToast(
            'Warning',
            'No orders were selected.',
            'warning'
        );


        this.showSubmitCartFlow = false;


        return;
    }


    // =====================================================
    // UPDATE CART STATUS
    // =====================================================

    this.isLoading = true;


updateCartStatus({

    newStatus: 'Submitted',

    orderIds:
        this.selectedOrderIds

})
.then(() => {

    console.log(
        'SUBMISSION SCREEN - CART STATUS UPDATED'
    );


    this.showToast(
        'Success',
        'Selected orders submitted successfully!',
        'success'
    );


    // =================================================
    // MARK CART AS SUBMITTED
    // =================================================

    this.cartSubmitted = true;


    this.dispatchEvent(
        new FlowAttributeChangeEvent(
            'cartSubmitted',
            true
        )
    );


    // =================================================
    // SEND VIRUS ORDER IDS TO PARENT FLOW
    // =================================================

    this.dispatchEvent(
        new FlowAttributeChangeEvent(
            'virusOrderIds',
            this.virusOrderIds
        )
    );


    // =================================================
    // HIDE CHILD SUBMIT FLOW
    // =================================================

    this.showSubmitCartFlow = false;


    /*
     * Give Lightning a moment to process the Flow
     * attribute changes and remove the child Flow
     * before requesting NEXT on the parent Flow.
     */

    setTimeout(() => {

        console.log(
            'SUBMISSION SCREEN - MOVING PARENT FLOW TO NEXT SCREEN'
        );


        this.dispatchEvent(
            new FlowNavigationNextEvent()
        );

    }, 100);

})
.catch(error => {

    console.error(
        'UPDATE CART STATUS ERROR:',
        error
    );


    this.showToast(
        'Error',
        error.body?.message ||
            error.message ||
            'Unable to update cart status.',
        'error'
    );

})
.finally(() => {

    this.isLoading = false;

});

}


// =========================================================
// BACK
// =========================================================

handleBack() {

    this.dispatchEvent(
        new FlowNavigationBackEvent()
    );

}


// =========================================================
// TOAST
// =========================================================

showToast(
    title,
    message,
    variant
) {

    this.dispatchEvent(

        new ShowToastEvent({

            title,

            message,

            variant

        })

    );

}

}