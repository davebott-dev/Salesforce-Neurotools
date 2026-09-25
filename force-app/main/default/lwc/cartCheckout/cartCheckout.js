import { LightningElement, api, wire } from 'lwc';

import {
    FlowAttributeChangeEvent,
    FlowNavigationNextEvent
} from 'lightning/flowSupport';

import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import getDraftOrdersForUser
    from '@salesforce/apex/DraftOrderController.getDraftOrdersForUser';

import deleteDraftOrder
    from '@salesforce/apex/DraftOrderController.deleteDraftOrder';

import getCartStatus
    from '@salesforce/apex/CartController.getCartStatus';

import saveBillingAssignments
    from '@salesforce/apex/CartBillingController.saveBillingAssignments';


const COLUMNS = [

    {
        label: 'Draft Order Number',
        type: 'button',

        typeAttributes: {
            label: {
                fieldName: 'draftOrder1Label'
            },

            name: 'navigate',

            variant: 'base'
        }
    },

    {
        label: 'Order Type',
        fieldName: 'customOrStock',
        type: 'text'
    },

    {
        label: 'Virus Type',
        fieldName: 'virusType',
        type: 'text'
    },

    {
        label: 'Construct Name',
        fieldName: 'constructName',
        type: 'text'
    },

    {
        label: 'Capsid/Envelope',
        fieldName: 'capsidName',
        type: 'text'
    },

    {
        label: 'End Volume',
        fieldName: 'endVolume',
        type: 'text'
    },

    {
        label: 'Price',
        fieldName: 'totalPrice',
        type: 'currency'
    },

    {
        label: 'Quantity',
        fieldName: 'quantity',
        type: 'text'
    },

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


export default class CartCheckout
    extends NavigationMixin(LightningElement) {


    // =========================================================
    // FLOW INPUTS
    // =========================================================

    @api flowContactId;

    @api labType;

    @api contactCountry;

    @api contactOrganization;

    @api selectedRowsInput = [];

    @api creditCardRecords = [];

    @api purchaseOrderRecords = [];

    @api chartfieldRecords = [];


    // =========================================================
    // FLOW OUTPUTS
    // =========================================================

    @api selectedRowsOutput = [];

    @api billingAssignmentsOutput = '';


    // =========================================================
    // CREATION FLOW API NAMES
    // =========================================================

    @api purchaseOrderFlowApiName =
        'LWC_Purchase_Order_Modal';

    @api creditCardFlowApiName =
        'LWC_Credit_Card_Modal';

    @api chartfieldFlowApiName =
        'LWC_Chartfield_String_Modal';


    // =========================================================
    // CART DATA
    // =========================================================

    columns = COLUMNS;

    draftOrders = [];

    selectedDraftOrderIds = [];

    selectedRowIds = [];

    totalSelectedPrice = 0;

    cartStatus;

    submittedDateText;

    wiredDraftOrdersResult;

    isLoading = false;


    // =========================================================
    // BILLING DATA
    // =========================================================

    billingAssignments = {};

    bulkBillingType = '';

    bulkBillingValue = '';


    // =========================================================
    // CREATION FLOW MODAL
    // =========================================================

    showCreateFlow = false;

    createFlowApiName = '';

    createFlowType = '';

    createFlowInputVariables = [];


    // =========================================================
    // QUOTE FLOW
    // =========================================================

    showQuoteFlow = false;

    quoteFlowInputVariables = [];

    quoteFlowStarted = false;


    // =========================================================
    // BILLING RECORD OPTIONS
    // =========================================================

    get purchaseOrderOptions() {

        const options = (this.purchaseOrderRecords || [])

            .filter(record =>
                record &&
                record.Id &&
                record.Name
            )

            .map(record => ({
                label: record.Name,
                value: record.Id
            }));


        options.push({
            label: 'Add PO Later',
            value: 'PO_LATER'
        });


        return options;
    }


get creditCardOptions() {
    return (this.creditCardRecords || [])
        .filter(record =>
            record &&
            record.Id &&
            record.Credit_Card_Name__c
        )
        .map(record => ({
            label: record.Credit_Card_Name__c,
            value: record.Id
        }));
}


get chartfieldOptions() {
    return (this.chartfieldRecords || [])
        .filter(record =>
            record &&
            record.Id &&
            record.Chartfield_String_Name__c
        )
        .map(record => ({
            label: record.Chartfield_String_Name__c,
            value: record.Id
        }));
}


    // =========================================================
    // BILLING TYPE OPTIONS
    // =========================================================

   get billingTypeOptions() {

    // ---------------------------------------------------------
    // INTERNAL USERS
    // ---------------------------------------------------------
    // Internal users do NOT use Purchase Orders.
    // They can use Credit Card or Chartfield String.
    // ---------------------------------------------------------

    if (this.isInternalLab) {

        return [

            {
                label: 'Credit Card',
                value: 'CC'
            },

            {
                label: 'Chartfield String',
                value: 'CHARTFIELD'
            }

        ];
    }


    // ---------------------------------------------------------
    // EXTERNAL USERS
    // ---------------------------------------------------------
    // External users can use Purchase Order or Credit Card.
    // ---------------------------------------------------------

    return [

        {
            label: 'Purchase Order',
            value: 'PO'
        },

        {
            label: 'Credit Card',
            value: 'CC'
        }

    ];
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
    // BULK BILLING
    // =========================================================

    get showBulkChartfield() {

        return (

            this.isInternalLab &&

            this.bulkBillingType ===
                'CHARTFIELD'

        );
    }


    // =========================================================
    // LOAD CART
    // =========================================================

    @wire(getDraftOrdersForUser)

    wiredDraftOrders(result) {

        this.wiredDraftOrdersResult =
            result;


        if (result.data) {

            this.draftOrders =

                result.data.map(row => ({

                    ...row,

                    draftOrder1:
                        row.draftOrderId,

                    draftOrder1Label:
                        row.draftOrderName ||
                        'View'

                }));


            // -------------------------------------------------
            // RESTORE SELECTION
            // -------------------------------------------------

            if (

                this.selectedRowsInput &&

                this.selectedRowsInput.length > 0

            ) {

                const validIds =

                    new Set(

                        this.draftOrders.map(
                            row =>
                                row.draftOrderId
                        )

                    );


                this.selectedDraftOrderIds =

                    this.selectedRowsInput.filter(
                        id =>
                            validIds.has(id)
                    );

            } else {

                // Default to all orders

                this.selectedDraftOrderIds =

                    this.draftOrders.map(
                        row =>
                            row.draftOrderId
                    );
            }


            this.selectedRowIds = [

                ...this.selectedDraftOrderIds

            ];


            this.calculateTotal();

            this.notifyFlowOfSelection();

            this.initializeBillingAssignments();


        } else if (result.error) {

            this.showToast(

                'Error',

                result.error.body?.message ||
                    result.error.message,

                'error'

            );
        }
    }


    // =========================================================
    // CONNECTED
    // =========================================================

    connectedCallback() {

        this.fetchCartStatus();

    }


    // =========================================================
    // RENDERED CALLBACK
    // =========================================================
    // This is specifically used for the Quote Flow.
    //
    // The lightning-flow component is conditionally rendered
    // after the Create Quote button is clicked.
    //
    // Once Salesforce renders it, renderedCallback() starts
    // the autolaunched Flow.
    // =========================================================

    renderedCallback() {

        if (
            !this.showQuoteFlow ||
            this.quoteFlowStarted
        ) {

            return;
        }


        const flow =
            this.template.querySelector(
                'lightning-flow'
            );


        if (!flow) {

            return;
        }


        this.quoteFlowStarted = true;


        console.log(
            'STARTING QUOTE FLOW'
        );


        flow.startFlow(

            'Create_Quote_From_Cart_Items_Autolaunched',

            this.quoteFlowInputVariables

        );
    }


    // =========================================================
    // INITIALIZE BILLING
    // =========================================================

    initializeBillingAssignments() {

        const assignments = {

            ...this.billingAssignments

        };


        this.draftOrders.forEach(order => {

            if (

                !assignments[
                    order.draftOrderId
                ]

            ) {

                assignments[order.draftOrderId] = {

                    billingType: '',

                    purchaseOrderId: null,

                    creditCardId: null,

                    chartfield: null,

                    poLater: false

                };
            }
        });


        this.billingAssignments =
            assignments;


        this.updateBillingOutput();
    }


    // =========================================================
    // CART STATUS
    // =========================================================

    fetchCartStatus() {

        getCartStatus()

            .then(result => {

                if (result) {

                    this.cartStatus =
                        result.status;


                    this.submittedDateText =

                        result.lastSubmissionTime

                            ? new Date(
                                result.lastSubmissionTime
                            ).toLocaleString()

                            : null;
                }
            })

            .catch(error => {

                this.showToast(

                    'Error',

                    error.body?.message ||
                        error.message,

                    'error'

                );
            });
    }


    // =========================================================
    // ORDER SELECTION
    // =========================================================

    handleRowSelection(event) {

        this.selectedDraftOrderIds =

            event.detail.selectedRows.map(
                row =>
                    row.draftOrderId
            );


        this.selectedRowIds = [

            ...this.selectedDraftOrderIds

        ];


        this.calculateTotal();

        this.notifyFlowOfSelection();

        this.updateBillingOutput();
    }


    calculateTotal() {

        const selectedIds =

            new Set(
                this.selectedDraftOrderIds
            );


        this.totalSelectedPrice =

            this.draftOrders

                .filter(
                    row =>
                        selectedIds.has(
                            row.draftOrderId
                        )
                )

                .reduce(

                    (sum, row) =>

                        sum +
                        (
                            Number(
                                row.totalPrice
                            ) || 0
                        ),

                    0

                );
    }


    // =========================================================
    // ROW ACTIONS
    // =========================================================

    handleRowAction(event) {

        const actionName =
            event.detail.action.name;

        const row =
            event.detail.row;


        if (
            actionName === 'navigate'
        ) {

            this.navigateToDraftOrder(
                row.draftOrderId
            );
        }


        if (
            actionName === 'delete'
        ) {

            this.confirmDelete(
                row.draftOrderId
            );
        }
    }


    navigateToDraftOrder(recordId) {

        this[
            NavigationMixin.Navigate
        ]({

            type:
                'standard__recordPage',

            attributes: {

                recordId,

                objectApiName:
                    'Draft_Virus_Order__c',

                actionName:
                    'view'

            }

        });
    }


    // =========================================================
    // DELETE
    // =========================================================

    confirmDelete(draftOrderId) {

        if (

            confirm(
                'Are you sure you want to delete this Draft Order from your cart?'
            )

        ) {

            this.deleteDraftOrder(
                draftOrderId
            );
        }
    }


    deleteDraftOrder(draftOrderId) {

        this.isLoading = true;


        deleteDraftOrder({

            draftOrderId

        })

            .then(() => {

                this.showToast(

                    'Success',

                    'Draft Order deleted',

                    'success'

                );


                this.draftOrders =

                    this.draftOrders.filter(
                        row =>
                            row.draftOrderId !==
                            draftOrderId
                    );


                this.selectedDraftOrderIds =

                    this.selectedDraftOrderIds.filter(
                        id =>
                            id !==
                            draftOrderId
                    );


                this.selectedRowIds = [

                    ...this.selectedDraftOrderIds

                ];


                const assignments = {

                    ...this.billingAssignments

                };


                delete assignments[
                    draftOrderId
                ];


                this.billingAssignments =
                    assignments;


                this.calculateTotal();

                this.notifyFlowOfSelection();

                this.updateBillingOutput();

            })

            .catch(error => {

                this.showToast(

                    'Error',

                    error.body?.message ||
                        error.message,

                    'error'

                );

            })

            .finally(() => {

                this.isLoading = false;

            });
    }


    // =========================================================
    // BULK BILLING
    // =========================================================

    handleBulkBillingTypeChange(event) {

        this.bulkBillingType =
            event.detail.value;

        this.bulkBillingValue = '';
    }


    handleBulkBillingValueChange(event) {

        this.bulkBillingValue =
            event.detail.value;
    }


    applyBillingToSelected() {

        if (
            !this.bulkBillingType
        ) {

            this.showToast(

                'Billing Method Required',

                'Please select a billing method.',

                'warning'

            );

            return;
        }


        if (
            !this.bulkBillingValue
        ) {

            this.showToast(

                'Billing Selection Required',

                'Please select a billing account.',

                'warning'

            );

            return;
        }


        const assignments = {

            ...this.billingAssignments

        };


        this.selectedDraftOrderIds

            .forEach(draftOrderId => {

                assignments[
                    draftOrderId
                ] = {

                    billingType:
                        this.bulkBillingType,

                    purchaseOrderId:
                        this.bulkBillingType === 'PO' &&
                        this.bulkBillingValue !== 'PO_LATER'
                            ? this.bulkBillingValue
                            : null,

                    creditCardId:
                        this.bulkBillingType === 'CC'
                            ? this.bulkBillingValue
                            : null,

                    chartfield:
                        this.bulkBillingType === 'CHARTFIELD'
                            ? this.bulkBillingValue
                            : null,

                    poLater:
                        this.bulkBillingType === 'PO' &&
                        this.bulkBillingValue === 'PO_LATER'

                };

            });


        this.billingAssignments =
            assignments;


        this.updateBillingOutput();


        this.showToast(

            'Billing Updated',

            `Billing applied to ${this.selectedDraftOrderIds.length} selected orders.`,

            'success'

        );
    }


    // =========================================================
    // INDIVIDUAL BILLING TYPE
    // =========================================================

    handleOrderBillingTypeChange(event) {

        const draftOrderId =
            event.target.dataset.id;

        const billingType =
            event.detail.value;


        this.setBillingAssignment(

            draftOrderId,

            billingType,

            null

        );
    }


    // =========================================================
    // INDIVIDUAL BILLING VALUE
    // =========================================================

    handleOrderBillingValueChange(event) {

        const draftOrderId =
            event.target.dataset.id;

        const value =
            event.detail.value;

        const assignment =
            this.billingAssignments[draftOrderId] || {};

        let updatedAssignment = {
            ...assignment
        };


        // ---------------------------------------------------------
        // PURCHASE ORDER
        // ---------------------------------------------------------

        if (assignment.billingType === 'PO') {

            if (value === 'PO_LATER') {

                updatedAssignment = {

                    ...assignment,

                    billingType: 'PO',

                    purchaseOrderId: null,

                    creditCardId: null,

                    chartfield: null,

                    poLater: true

                };

            } else {

                updatedAssignment = {

                    ...assignment,

                    billingType: 'PO',

                    purchaseOrderId: value,

                    creditCardId: null,

                    chartfield: null,

                    poLater: false

                };
            }
        }


        // ---------------------------------------------------------
        // CREDIT CARD
        // ---------------------------------------------------------

        else if (assignment.billingType === 'CC') {

            updatedAssignment = {

                ...assignment,

                billingType: 'CC',

                creditCardId: value,

                purchaseOrderId: null,

                chartfield: null,

                poLater: false

            };
        }


        // ---------------------------------------------------------
        // CHARTFIELD
        // ---------------------------------------------------------

        else if (
            assignment.billingType === 'CHARTFIELD'
        ) {

            updatedAssignment = {

                ...assignment,

                billingType: 'CHARTFIELD',

                chartfield: value,

                purchaseOrderId: null,

                creditCardId: null,

                poLater: false

            };
        }


        this.billingAssignments = {

            ...this.billingAssignments,

            [draftOrderId]:
                updatedAssignment

        };


        this.updateBillingOutput();
    }


    // =========================================================
    // SET BILLING ASSIGNMENT
    // =========================================================

    setBillingAssignment(
        draftOrderId,
        billingType,
        value
    ) {

        this.billingAssignments = {

            ...this.billingAssignments,

            [draftOrderId]: {

                billingType,

                purchaseOrderId:
                    billingType === 'PO'
                        ? value
                        : null,

                creditCardId:
                    billingType === 'CC'
                        ? value
                        : null,

                chartfield:
                    billingType === 'CHARTFIELD'
                        ? value
                        : null,

                poLater: false

            }

        };


        this.updateBillingOutput();
    }


    // =========================================================
    // BILLING OUTPUT
    // =========================================================

updateBillingOutput() {

    const output =

        this.selectedDraftOrderIds.map(
            draftOrderId => {

                const assignment =
                    this.billingAssignments[
                        draftOrderId
                    ] || {};

let purchaseOrderName = '';
let creditCardName = '';
let chartfieldName = '';


// ---------------------------------------------------------
// PURCHASE ORDER NAME
// ---------------------------------------------------------

if (assignment.purchaseOrderId) {

    const purchaseOrder =
        (this.purchaseOrderRecords || []).find(
            record =>
                record &&
                record.Id ===
                    assignment.purchaseOrderId
        );

    if (purchaseOrder) {

        purchaseOrderName =
            purchaseOrder.Name || '';

    }
}


// ---------------------------------------------------------
// CREDIT CARD NAME / NICKNAME
// ---------------------------------------------------------

if (assignment.creditCardId) {

    const creditCard =
        (this.creditCardRecords || []).find(
            record =>
                record &&
                record.Id ===
                    assignment.creditCardId
        );

if (creditCard) {

    creditCardName =
        creditCard.Credit_Card_Name__c || '';

}
}

// CHARTFIELD NAME
if (assignment.chartfield) {
    const chartfield =
        (this.chartfieldRecords || []).find(
            record =>
                record &&
                record.Id === assignment.chartfield
        );

    if (chartfield) {
        chartfieldName =
    chartfield.Chartfield_String_Name__c || '';
    }
}

return {

    draftOrderId,

    billingType:
        assignment.billingType ||
        '',

    purchaseOrderId:
        assignment.purchaseOrderId ||
        null,

    purchaseOrderName,

    creditCardId:
        assignment.creditCardId ||
        null,

    creditCardName,

chartfield:
    assignment.chartfield ||
    null,

chartfieldName,

poLater:
    assignment.poLater === true

};
            }

        );

    const jsonOutput =
        JSON.stringify(output);

    this.billingAssignmentsOutput =
        jsonOutput;

    this.dispatchEvent(

        new FlowAttributeChangeEvent(

            'billingAssignmentsOutput',

            jsonOutput

        )

    );
}


    // =========================================================
    // OPEN PURCHASE ORDER MODAL
    // =========================================================

    openCreatePurchaseOrder() {

        this.openCreateFlow(

            'PO',

            'LWC_Purchase_Order_Modal'

        );
    }


    // =========================================================
    // OPEN CREDIT CARD MODAL
    // =========================================================

    openCreateCreditCard() {

        this.openCreateFlow(

            'CC',

            this.creditCardFlowApiName

        );
    }


    // =========================================================
    // OPEN CHARTFIELD MODAL
    // =========================================================

    openCreateChartfield() {

        this.openCreateFlow(

            'CHARTFIELD',

            this.chartfieldFlowApiName

        );
    }


    // =========================================================
    // OPEN CREATION FLOW MODAL
    // =========================================================

    openCreateFlow(type, flowApiName) {

        this.createFlowType = type;

        this.createFlowApiName =
            flowApiName || '';


        if (this.flowContactId) {

            this.createFlowInputVariables = [

                {
                    name: 'contactId',

                    type: 'String',

                    value:
                        this.flowContactId
                }

            ];

        } else {

            this.createFlowInputVariables = [];

        }


        this.showCreateFlow = true;
    }


    // =========================================================
    // CREATION FLOW STATUS
    // =========================================================

    handleCreateFlowStatusChange(event) {

        const status =
            event.detail.status;


        if (status === 'ERROR') {

            this.showToast(

                'Error',

                'There was a problem creating the billing record.',

                'error'

            );

            return;
        }


        if (status === 'CANCELED') {

            this.closeCreateFlow();

            return;
        }


        if (status !== 'FINISHED') {

            return;
        }


        const outputs =

            event.detail.outputVariables ||
            [];


        const outputMap = {};


        outputs.forEach(variable => {

            if (variable && variable.name) {

                outputMap[
                    variable.name
                ] =
                    variable.value;
            }

        });


        const createdRecordId =
            outputMap.createdRecordId;


        const createdRecordName =
            outputMap.createdRecordName;


        if (createdRecordId) {

            const recordName =
                createdRecordName ||
                createdRecordId;


            this.addCreatedBillingRecord(

                this.createFlowType,

                createdRecordId,

                recordName

            );


            this.assignNewBillingRecord(

                this.createFlowType,

                createdRecordId

            );


            let label;


            if (
                this.createFlowType === 'PO'
            ) {

                label = 'Purchase Order';

            }

            else if (
                this.createFlowType === 'CC'
            ) {

                label = 'Credit Card';

            }

            else {

                label = 'Chartfield String';
            }


            this.showToast(

                'Success',

                `${label} created and applied to the selected orders.`,

                'success'

            );

        }

        else {

            this.showToast(

                'Success',

                'The billing record was created.',

                'success'

            );
        }


        this.closeCreateFlow();
    }


    // =========================================================
    // ADD CREATED BILLING RECORD
    // =========================================================

addCreatedBillingRecord(
    type,
    recordId,
    recordName
) {

    // ---------------------------------------------------------
    // PURCHASE ORDER
    // ---------------------------------------------------------

    if (type === 'PO') {

        const newRecord = {

            Id:
                recordId,

            Name:
                recordName

        };

        this.purchaseOrderRecords = [

            ...(this.purchaseOrderRecords || [])
                .filter(record =>
                    record &&
                    record.Id
                ),

            newRecord

        ];
    }


    // ---------------------------------------------------------
    // CREDIT CARD
    // ---------------------------------------------------------

    else if (type === 'CC') {

        const newRecord = {

            Id:
                recordId,

            Credit_Card_Name__c:
                recordName

        };

        this.creditCardRecords = [

            ...(this.creditCardRecords || [])
                .filter(record =>
                    record &&
                    record.Id
                ),

            newRecord

        ];

        this.dispatchEvent(

            new FlowAttributeChangeEvent(

                'creditCardRecords',

                this.creditCardRecords

            )

        );
    }


    // ---------------------------------------------------------
    // CHARTFIELD
    // ---------------------------------------------------------

else if (type === 'CHARTFIELD') {

    const newRecord = {

        Id:
            recordId,

        Chartfield_String_Name__c:
            recordName

    };

    this.chartfieldRecords = [

        ...(this.chartfieldRecords || [])
            .filter(record =>
                record &&
                record.Id
            ),

        newRecord

    ];
}
}


    // =========================================================
    // ASSIGN NEW BILLING RECORD
    // =========================================================

    assignNewBillingRecord(
        type,
        recordId
    ) {

        const assignments = {

            ...this.billingAssignments

        };


        this.selectedDraftOrderIds

            .forEach(draftOrderId => {

                assignments[
                    draftOrderId
                ] = {

                    billingType:
                        type,

                    purchaseOrderId:
                        type === 'PO'
                            ? recordId
                            : null,

                    creditCardId:
                        type === 'CC'
                            ? recordId
                            : null,

                    chartfield:
                        type === 'CHARTFIELD'
                            ? recordId
                            : null

                };

            });


        this.billingAssignments =
            assignments;


        this.updateBillingOutput();
    }


    // =========================================================
    // CLOSE CREATION FLOW MODAL
    // =========================================================

    closeCreateFlow() {

        this.showCreateFlow = false;

        this.createFlowApiName = '';

        this.createFlowType = '';

        this.createFlowInputVariables = [];
    }


    // =========================================================
    // VALIDATION
    // =========================================================

    validateBilling() {

        if (
            this.selectedDraftOrderIds.length ===
                0
        ) {

            this.showToast(

                'No Orders Selected',

                'Please select at least one draft order.',

                'warning'

            );

            return false;
        }


        const missingBilling =

            this.selectedDraftOrderIds.filter(
                id => {

                    const assignment =

                        this.billingAssignments[
                            id
                        ];


                    if (
                        !assignment ||
                        !assignment.billingType
                    ) {

                        return true;
                    }


                    // PO

                    if (
                        assignment.billingType === 'PO'
                    ) {

                        if (
                            !assignment.purchaseOrderId &&
                            !assignment.poLater
                        ) {

                            return true;
                        }
                    }


                    // Credit Card

                    if (
                        assignment.billingType ===
                            'CC' &&
                        !assignment.creditCardId
                    ) {

                        return true;
                    }


                    // Chartfield

                    if (
                        assignment.billingType ===
                            'CHARTFIELD' &&
                        !assignment.chartfield
                    ) {

                        return true;
                    }


                    return false;

                }

            );


        if (
            missingBilling.length > 0
        ) {

            this.showToast(

                'Billing Information Required',

                `${missingBilling.length} selected order(s) still need billing information.`,

                'warning'

            );

            return false;
        }


        return true;
    }


     // =========================================================
    // PURCHASE ORDER AMOUNT VALIDATION
    // =========================================================

    validatePurchaseOrderAmounts() {

        const poTotals = {};

        // -----------------------------------------------------
        // Calculate the order total assigned to each PO
        // -----------------------------------------------------

        this.selectedDraftOrderIds.forEach(
            draftOrderId => {

                const assignment =
                    this.billingAssignments[
                        draftOrderId
                    ];

                // Ignore CC, Chartfield, and PO Later

                if (
                    !assignment ||
                    assignment.billingType !== 'PO' ||
                    !assignment.purchaseOrderId
                ) {

                    return;
                }


                const order =
                    this.draftOrders.find(
                        row =>
                            row.draftOrderId ===
                            draftOrderId
                    );


                if (!order) {
                    return;
                }


                const orderTotal =
                    Number(
                        order.totalPrice
                    ) || 0;


                if (
                    !poTotals[
                        assignment.purchaseOrderId
                    ]
                ) {

                    poTotals[
                        assignment.purchaseOrderId
                    ] = 0;
                }


                poTotals[
                    assignment.purchaseOrderId
                ] += orderTotal;

            }
        );


        // -----------------------------------------------------
        // Nothing is being billed to a PO
        // -----------------------------------------------------

        const poIds =
            Object.keys(poTotals);


        if (poIds.length === 0) {

            return true;
        }


        // -----------------------------------------------------
        // Add the entire shipping charge to ONE PO.
        //
        // The shipping charge is assigned to the PO with
        // the largest order total.
        // -----------------------------------------------------

        let shippingPoId = null;
        let largestPoTotal = -1;


        poIds.forEach(poId => {

            if (
                poTotals[poId] >
                largestPoTotal
            ) {

                largestPoTotal =
                    poTotals[poId];

                shippingPoId =
                    poId;
            }

        });


        if (shippingPoId) {

            poTotals[shippingPoId] +=
                this.shippingCharge;

        }


        // -----------------------------------------------------
        // Validate each PO against Amount_Remaining__c
        // -----------------------------------------------------

        for (
            const poId of poIds
        ) {

            const purchaseOrder =
                (this.purchaseOrderRecords || [])
                    .find(
                        record =>
                            record &&
                            record.Id === poId
                    );


            if (!purchaseOrder) {

                this.showToast(

                    'Purchase Order Not Found',

                    'The selected Purchase Order could not be found. Please select it again.',

                    'error'

                );

                return false;
            }


            const remainingAmount =
                Number(
                    purchaseOrder.Amount_Remaining__c
                ) || 0;


            const requiredAmount =
                poTotals[poId];


            if (
                requiredAmount >
                remainingAmount
            ) {

                const shortfall =
                    requiredAmount -
                    remainingAmount;


                this.showToast(

                    'Insufficient Purchase Order Funds',

                    `${purchaseOrder.Name} has $${remainingAmount.toFixed(2)} remaining, but the selected orders require $${requiredAmount.toFixed(2)}. You need $${shortfall.toFixed(2)} more.`,

                    'error'

                );

                return false;
            }

        }


        return true;
    }


    // =========================================================
    // CONTINUE
    // =========================================================

    handleContinue() {

        if (!this.validateBilling()) {

            return;
        }


        if (!this.validatePurchaseOrderAmounts()) {

            return;
        }


        this.isLoading = true;


        this.notifyFlowOfSelection();

        this.updateBillingOutput();


        saveBillingAssignments({

            assignmentsJson:
                this.billingAssignmentsOutput

        })

            .then(() => {

                this.showToast(

                    'Billing Saved',

                    'Billing information has been saved to your selected orders.',

                    'success'

                );


                setTimeout(() => {

                    this.dispatchEvent(

                        new FlowNavigationNextEvent()

                    );

                }, 50);

            })

            .catch(error => {

                console.error(

                    'SAVE BILLING ERROR:',

                    error

                );


                this.showToast(

                    'Unable to Save Billing',

                    error.body?.message ||
                        error.message ||
                        'An error occurred while saving billing information.',

                    'error'

                );

            })

            .finally(() => {

                this.isLoading = false;

            });
    }


    // =========================================================
    // BACK TO ORDER FORM
    // =========================================================

    handleBackToOrderForm() {

        window.location.href =
            '/s/createorder';
    }


    // =========================================================
    // CREATE QUOTE
    // =========================================================

    handleCreateQuote() {

        console.log(
            'CREATE QUOTE CLICKED'
        );

        console.log(
            'Selected Draft Order IDs:',
            this.selectedDraftOrderIds
        );

        console.log(
            'Has Selection:',
            this.hasSelection
        );


        if (!this.hasSelection) {

            this.showToast(

                'No Orders Selected',

                'Please select at least one draft order.',

                'warning'

            );

            return;
        }


        this.quoteFlowInputVariables = [

            {
                name: 'SelectedOrderIds',

                type: 'String',

                value: [
                    ...this.selectedDraftOrderIds
                ]
            }

        ];


        console.log(

            'Quote Flow Inputs:',

            JSON.stringify(
                this.quoteFlowInputVariables
            )

        );


        // Reset the Flow lifecycle

        this.quoteFlowStarted = false;


        // This causes the lightning-flow
        // component to be rendered.

        this.showQuoteFlow = true;
    }


    // =========================================================
    // QUOTE FLOW STATUS
    // =========================================================

    handleQuoteStatusChange(event) {

        const status =
            event.detail.status;


        console.log(
            '========== QUOTE FLOW STATUS =========='
        );

        console.log(
            'STATUS:',
            status
        );

        console.log(

            'OUTPUT VARIABLES:',

            JSON.stringify(
                event.detail.outputVariables
            )

        );


        // -----------------------------------------------------
        // ERROR
        // -----------------------------------------------------

        if (status === 'ERROR') {

            console.error(

                'QUOTE FLOW ERROR',

                JSON.stringify(event.detail)

            );


            this.showQuoteFlow = false;

            this.quoteFlowStarted = false;


            this.showToast(

                'Error',

                'There was a problem creating the quote. Check the console for details.',

                'error'

            );


            return;
        }


        // -----------------------------------------------------
        // CANCELED
        // -----------------------------------------------------

        if (status === 'CANCELED') {

            console.log(
                'Quote Flow was canceled.'
            );


            this.showQuoteFlow = false;

            this.quoteFlowStarted = false;


            return;
        }


        // -----------------------------------------------------
        // COMPLETED
        //
        // Salesforce can return FINISHED or
        // FINISHED_SCREEN depending on the Flow.
        // -----------------------------------------------------

        if (

            status !== 'FINISHED' &&

            status !== 'FINISHED_SCREEN'

        ) {

            return;
        }


        const outputs =

            event.detail.outputVariables ||
            [];


        const outputMap = {};


        outputs.forEach(variable => {

            if (
                variable &&
                variable.name
            ) {

                outputMap[
                    variable.name
                ] =
                    variable.value;
            }

        });


        const quoteId =
            outputMap.CreatedQuoteId;


        console.log(
            'CREATED QUOTE ID:',
            quoteId
        );


        // -----------------------------------------------------
        // Destroy Flow component.
        //
        // This is important because it allows the next
        // Create Quote click to create a brand-new Flow
        // interview.
        // -----------------------------------------------------

        this.showQuoteFlow = false;

        this.quoteFlowStarted = false;


        // -----------------------------------------------------
        // Quote ID missing
        // -----------------------------------------------------

        if (!quoteId) {

            this.showToast(

                'Quote Created',

                'The quote was created, but no Quote ID was returned.',

                'warning'

            );


            return;
        }


        // -----------------------------------------------------
        // SUCCESS TOAST
        // -----------------------------------------------------

        this.showToast(

            'Quote Created',

            'Your quote was created successfully. Opening quote...',

            'success'

        );


        // -----------------------------------------------------
        // Refresh cart
        // -----------------------------------------------------

        this.refreshData();


        // -----------------------------------------------------
        // Navigate to Quote
        // -----------------------------------------------------

        setTimeout(() => {

            this[
                NavigationMixin.Navigate
            ]({

                type:
                    'standard__recordPage',

                attributes: {

                    recordId:
                        quoteId,

                    objectApiName:
                        'Quote',

                    actionName:
                        'view'

                }

            });

        }, 500);
    }


    // =========================================================
    // FLOW SELECTION
    // =========================================================

    notifyFlowOfSelection() {

        this.selectedRowsOutput = [

            ...this.selectedDraftOrderIds

        ];


        this.dispatchEvent(

            new FlowAttributeChangeEvent(

                'selectedRowsOutput',

                this.selectedRowsOutput

            )

        );
    }


    // =========================================================
    // REFRESH
    // =========================================================

    refreshData() {

        if (
            this.wiredDraftOrdersResult
        ) {

            refreshApex(

                this.wiredDraftOrdersResult

            );
        }


        this.fetchCartStatus();
    }


    // =========================================================
    // GETTERS
    // =========================================================

    get isSubmitted() {

        return (

            this.cartStatus ===
                'Submitted'

        );
    }


    get hasOrders() {

        return (

            this.draftOrders.length > 0

        );
    }


    get hasSelection() {

        return (

            this.selectedDraftOrderIds.length >
                0

        );
    }


    get selectedOrderCount() {

        return (

            this.selectedDraftOrderIds.length

        );
    }


    get selectionSummary() {

        const count =
            this.selectedDraftOrderIds.length;


        return `${count} ${
            count === 1
                ? 'order'
                : 'orders'
        } selected`;
    }


    get disableQuote() {

        return !this.hasSelection;
    }


    get disableContinue() {

        return !this.hasSelection;
    }


    get hasBulkBillingSelection() {

        return (

            this.bulkBillingType !== ''

        );
    }


    get bulkBillingNeedsValue() {

        return (

            this.bulkBillingType !== ''

        );
    }


    get bulkIsPo() {

        return (

            this.bulkBillingType ===
                'PO'

        );
    }


    get bulkIsCreditCard() {

        return (

            this.bulkBillingType ===
                'CC'

        );
    }


    get bulkIsChartfield() {

        return (

            this.bulkBillingType ===
                'CHARTFIELD'

        );
    }


    get disableBulkApply() {

        if (
            !this.hasSelection
        ) {

            return true;
        }


        if (
            !this.bulkBillingType
        ) {

            return true;
        }


        if (
            !this.bulkBillingValue
        ) {

            return true;
        }


        return false;
    }


    get shippingCharge() {

        if (!this.hasSelection) {
            return 0;
        }


        // Internal UNC lab

        if (this.isInternalLab) {
            return 0;
        }


        // External international

        if (this.isInternational) {
            return 170;
        }


        // External United States

        return 100;
    }


    get grandTotal() {

        return (

            Number(
                this.totalSelectedPrice
            ) || 0

        ) + this.shippingCharge;
    }


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
    // CREATION FLOW MODAL GETTERS
    // =========================================================

    get hasCreateFlow() {

        return (

            this.showCreateFlow &&

            !!this.createFlowApiName

        );
    }


    get isCreatingPO() {

        return (

            this.createFlowType === 'PO'

        );
    }


    get isCreatingCC() {

        return (

            this.createFlowType === 'CC'

        );
    }


    get isCreatingChartfield() {

        return (

            this.createFlowType ===
                'CHARTFIELD'

        );
    }


    // =========================================================
    // INDIVIDUAL BILLING ROWS
    // =========================================================

    get billingOrderRows() {

        return this.draftOrders

            .filter(

                order =>

                    this.selectedDraftOrderIds
                        .includes(
                            order.draftOrderId
                        )

            )

            .map(order => {

                const assignment =

                    this.billingAssignments[
                        order.draftOrderId
                    ] || {};


                return {

                    ...order,

                    billingType:
                        assignment.billingType ||
                        '',

                    purchaseOrderId:
                        assignment.purchaseOrderId ||
                        '',

                    purchaseOrderValue:
                        assignment.poLater === true
                            ? 'PO_LATER'
                            : assignment.purchaseOrderId || '',

                    creditCardId:
                        assignment.creditCardId ||
                        '',

                    chartfield:
                        assignment.chartfield ||
                        '',

showPO:
    !this.isInternalLab &&
    assignment.billingType ===
    'PO',

                    showCC:
                        assignment.billingType ===
                        'CC',

                    showChartfield:
                        this.isInternalLab &&
                        assignment.billingType ===
                        'CHARTFIELD',

                    showPoLater:
                        assignment.billingType === 'PO' &&
                        assignment.poLater === true

                };

            });
    }


    // =========================================================
    // AVAILABLE BILLING RECORDS
    // =========================================================

    get hasPurchaseOrders() {

        return (

            this.purchaseOrderOptions.length >
                0

        );
    }


    get hasCreditCards() {

        return (

            this.creditCardOptions.length >
                0

        );
    }


    get hasChartfields() {

        return (

            this.chartfieldOptions.length >
                0

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