import { LightningElement, api, wire } from 'lwc';

import {
    getRelatedListRecords
} from 'lightning/uiRelatedListApi';

import {
    NavigationMixin
} from 'lightning/navigation';


export default class VirusShipmentList extends NavigationMixin(LightningElement) {

    @api recordId;


    records = [];

    isLoading = true;

    errorMessage = null;


    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Virus_Shipments__r',
        fields: [
            'Virus_Shipments__c.Id',
            'Virus_Shipments__c.Name',

            'Virus_Shipments__c.Virus_Order__c',
            'Virus_Shipments__c.Virus_Order__r.Name',
            'Virus_Shipments__c.Virus_Order__r.Requestor__c',
            'Virus_Shipments__c.Virus_Order__r.Requestor__r.Name',
            'Virus_Shipments__c.Virus_Order__r.CloseDate',

            'Virus_Shipments__c.Production_Lot_Included__c',
            'Virus_Shipments__c.Production_Lot_Included__r.Name',

            'Virus_Shipments__c.Packing_Checked_In__c',
            'Virus_Shipments__c.Packing_Checked_In_By__c',
            'Virus_Shipments__c.Packing_Checked_In_By__r.Name',
            'Virus_Shipments__c.Packing_Checked_In_Date__c'
        ],
        pageSize: 50
    })
    wiredVirusShipments({ data, error }) {

        this.isLoading = false;

        if (data) {

            this.errorMessage = null;

            this.processRecords(data.records);

        }
        else if (error) {

            console.error(
                'Error loading Virus Shipments:',
                error
            );

            this.records = [];

            this.errorMessage =
                this.getErrorMessage(error);

        }

    }

    formatDate(dateString) {

    if (!dateString) {
        return '';
    }

    const [year, month, day] =
        dateString.split('-');

    return `${month}/${day}/${year}`;

}


    async processRecords(rawRecords) {

        const processed = rawRecords.map(item => {

            const fields = item.fields;

            const virusOrder =
                fields.Virus_Order__r?.value?.fields;

            const requestor =
                virusOrder?.Requestor__r?.value?.fields;

            const productionDetail =
                fields.Production_Lot_Included__r?.value?.fields;

            const checkedBy =
                fields.Packing_Checked_In_By__r?.value?.fields;


            const checkedIn =
                fields.Packing_Checked_In__c?.value === true;


            return {

                id:
                    item.id,

                virusOrderId:
                    fields.Virus_Order__c?.value,

                virusOrderName:
                    virusOrder?.Name?.value ||
                    'Unknown Order',

                requestorId:
                    virusOrder?.Requestor__c?.value,

                requestorName:
                    requestor?.Name?.value ||
                    'Unknown Requestor',

                closeDate:
                    this.formatDate(virusOrder?.CloseDate?.value),

                productionDetailId:
                    fields.Production_Lot_Included__c?.value,

                productionDetailName:
                    productionDetail?.Name?.value ||
                    'Unknown Tube',

                checkedIn,

                checkedById:
                    fields.Packing_Checked_In_By__c?.value,

                checkedByName:
                    checkedBy?.Name?.value ||
                    'Unknown User',

                checkedInDate:
                    fields.Packing_Checked_In_Date__c?.value,

                statusText:
                    checkedIn
                        ? 'Checked In'
                        : 'Not Checked In',

                statusIcon:
                    checkedIn
                        ? 'utility:success'
                        : 'utility:circle',

                statusClass:
                    checkedIn
                        ? 'packing-status checked'
                        : 'packing-status pending',

                rowClass:
                    checkedIn
                        ? 'shipment-row checked-row'
                        : 'shipment-row pending-row'

            };

        });

        const recordsWithUrls =
            await Promise.all(
                processed.map(async record => {

                    const urls =
                        await Promise.all([

                            this.generateRecordUrl(
                                'Opportunity',
                                record.virusOrderId
                            ),

                            this.generateRecordUrl(
                                'Production_Detail__c',
                                record.productionDetailId
                            ),

                            this.generateRecordUrl(
                                'Contact',
                                record.requestorId
                            )

                        ]);


                    return {

                        ...record,

                        virusOrderUrl:
                            urls[0],

                        productionDetailUrl:
                            urls[1],

                        requestorUrl:
                            urls[2]

                    };

                })
            );


        this.records = recordsWithUrls;

    }


    generateRecordUrl(objectApiName, recordId) {

        if (!recordId) {
            return null;
        }


        return this[NavigationMixin.GenerateUrl]({

            type:
                'standard__recordPage',

            attributes: {

                recordId,

                objectApiName,

                actionName: 'view'

            }

        });

    }


    get totalCount() {

        return this.records.length;

    }


    get checkedInCount() {

        return this.records.filter(
            record => record.checkedIn
        ).length;

    }


    get remainingCount() {

        return (
            this.totalCount -
            this.checkedInCount
        );

    }


    get progressPercentage() {

        if (!this.totalCount) {
            return 0;
        }


        return Math.round(
            (this.checkedInCount /
                this.totalCount) * 100
        );

    }


    get progressStyle() {

        return `width: ${this.progressPercentage}%;`;

    }


    get hasRecords() {

        return this.records.length > 0;

    }


    get showEmpty() {

        return (
            !this.isLoading &&
            !this.errorMessage &&
            !this.hasRecords
        );

    }


    getErrorMessage(error) {

        if (error?.body?.message) {
            return error.body.message;
        }


        if (
            Array.isArray(error?.body) &&
            error.body.length > 0
        ) {

            return error.body
                .map(item => item.message)
                .join(', ');

        }


        if (error?.message) {
            return error.message;
        }


        return 'Unable to load Virus Shipments.';

    }

}