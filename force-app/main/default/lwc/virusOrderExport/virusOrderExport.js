import { LightningElement, api, track } from 'lwc';

import getVirusOrders
    from '@salesforce/apex/VirusOrderController.getVirusOrders';

import generatePackingList
    from '@salesforce/apex/VirusOrderController.generatePackingList';


const COLUMNS = [
    {
        label: 'Order Number',
        fieldName: 'Order_Number__c',
        type: 'text'
    }
];


export default class VirusOrderExport extends LightningElement {

    // ==========================================
    // FLOW INPUTS
    // ==========================================

    // Text Collection containing the Opportunity IDs
    // created by the Submit_Cart Flow.
    @api virusOrderIds = [];

    // Kept temporarily because the currently active
    // Flow still references this variable.
    @api submissionTime;
    @api requestorContactId;

    // URLs supplied by Flow.
    @api orderFormUrl;
    @api cartUrl;


    // ==========================================
    // FLOW OUTPUT
    // ==========================================

    @api isSendingDna;


    // ==========================================
    // COMPONENT STATE
    // ==========================================

    @track virusOrders = [];

    columns = COLUMNS;

    isLoading = true;
    hasError = false;

    errorMessage = '';

    isGeneratingPdf = false;


    // ==========================================
    // GETTERS
    // ==========================================

    get hasOrders() {
        return this.virusOrders.length > 0;
    }

    get orderCount() {
        return this.virusOrders.length;
    }

    get orderCountLabel() {

        if (this.orderCount === 1) {
            return '1 order was submitted';
        }

        return `${this.orderCount} orders were submitted`;
    }


    // ==========================================
    // LIFECYCLE
    // ==========================================

    connectedCallback() {

        console.log(
            'VIRUS ORDER EXPORT - VIRUS ORDER IDS:',
            JSON.stringify(this.virusOrderIds)
        );

        console.log(
            'VIRUS ORDER EXPORT - SUBMISSION TIME:',
            this.submissionTime
        );

        console.log(
            'VIRUS ORDER EXPORT - ORDER FORM URL:',
            this.orderFormUrl
        );

        console.log(
            'VIRUS ORDER EXPORT - CART URL:',
            this.cartUrl
        );

        this.loadVirusOrders();
    }


    // ==========================================
    // LOAD ORDERS
    // ==========================================

    loadVirusOrders() {

        this.isLoading = true;
        this.hasError = false;

        if (
            !Array.isArray(this.virusOrderIds) ||
            this.virusOrderIds.length === 0
        ) {

            console.log(
                'VIRUS ORDER EXPORT - NO VIRUS ORDER IDS'
            );

            this.virusOrders = [];
            this.isLoading = false;

            return;
        }

        console.log(
            'VIRUS ORDER EXPORT - LOADING ORDERS:',
            JSON.stringify(this.virusOrderIds)
        );

        getVirusOrders({
            virusOrderIds: this.virusOrderIds
        })
        .then(result => {

            console.log(
                'VIRUS ORDER EXPORT - APEX RESULT:',
                JSON.stringify(result)
            );

            this.virusOrders =
                (result || []).map(order => ({
                    ...order,
                    RequestorName:
                        order.Requestor__r?.Name
                }));

            this.isLoading = false;

            console.log(
                'VIRUS ORDER EXPORT - ORDERS FOUND:',
                this.virusOrders.length
            );

        })
        .catch(error => {

            console.error(
                'VIRUS ORDER EXPORT - ERROR:',
                error
            );

            this.virusOrders = [];

            this.isSendingDna = false;

            this.isLoading = false;

            this.hasError = true;

            this.errorMessage =
                error?.body?.message ||
                'There was an error loading your submitted orders.';
        });
    }


    // ==========================================
    // GENERATE / DOWNLOAD PACKING LIST PDF
    // ==========================================

    handleDownloadPdf() {

        console.log(
    'PACKING LIST - VIRUS ORDER IDS:',
    JSON.stringify(this.virusOrderIds)
);

console.log(
    'PACKING LIST - ID COUNT:',
    this.virusOrderIds?.length
);

        if (
            !Array.isArray(this.virusOrderIds) ||
            this.virusOrderIds.length === 0
        ) {

            console.warn(
                'VIRUS ORDER EXPORT - NO IDS AVAILABLE FOR PDF'
            );

            return;
        }

        if (this.isGeneratingPdf) {
            return;
        }

        this.isGeneratingPdf = true;

        console.log(
            'VIRUS ORDER EXPORT - GENERATING PACKING LIST FOR:',
            JSON.stringify(this.virusOrderIds)
        );

        generatePackingList({
            virusOrderIds: this.virusOrderIds
        })
        .then(fileId => {

            console.log(
                'VIRUS ORDER EXPORT - PACKING LIST FILE ID:',
                fileId
            );

            this.isGeneratingPdf = false;

            if (!fileId) {

                throw new Error(
                    'No File ID was returned from Apex.'
                );
            }

            console.log(
                'VIRUS ORDER EXPORT - OPENING GENERATED FILE:',
                fileId
            );

            window.open(
                `/sfc/servlet.shepherd/document/download/${fileId}`,
                '_blank'
            );

        })
  .catch(error => {

    console.error(
        'VIRUS ORDER EXPORT - PACKING LIST ERROR OBJECT:',
        error
    );

    console.error(
        'VIRUS ORDER EXPORT - PACKING LIST ERROR JSON:',
        JSON.stringify(error)
    );

    console.error(
        'VIRUS ORDER EXPORT - PACKING LIST ERROR BODY:',
        error?.body
    );

    console.error(
        'VIRUS ORDER EXPORT - PACKING LIST ERROR MESSAGE:',
        error?.body?.message ||
        error?.message ||
        'No error message returned'
    );

    this.isGeneratingPdf = false;
    this.hasError = true;

    this.errorMessage =
        error?.body?.message ||
        error?.message ||
        'There was an error generating the DNA packing list.';
});
    }


    // ==========================================
    // RETURN TO CART
    // ==========================================

    handleReturnToCart() {

        if (!this.cartUrl) {

            console.warn(
                'VIRUS ORDER EXPORT - NO CART URL PROVIDED'
            );

            return;
        }

        window.location.href =
            this.cartUrl;
    }


    // ==========================================
    // START ANOTHER ORDER
    // ==========================================

    handleStartAnotherOrder() {

        if (!this.orderFormUrl) {

            console.warn(
                'VIRUS ORDER EXPORT - NO ORDER FORM URL PROVIDED'
            );

            return;
        }

        window.location.href =
            this.orderFormUrl;
    }
}