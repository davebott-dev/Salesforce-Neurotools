import { LightningElement, track, wire } from 'lwc';

import getStockViruses
    from '@salesforce/apex/StockVirusProductController.getStockViruses';

import addStockToCart
    from '@salesforce/apex/StockVirusProductController.addStockToCart';

import { ShowToastEvent }
    from 'lightning/platformShowToastEvent';


// =========================================================
// MAIN STOCK PRODUCT TABLE
// =========================================================

const columns = [
    {
        label: 'Construct',
        fieldName: 'ConstructName',
        sortable: true
    },
    {
        label: 'Capsid/Envelope',
        fieldName: 'CapsidName',
        sortable: true
    },
    {
        label: 'Virus Type',
        fieldName: 'Virus_Type__c',
        sortable: true
    },
    {
        label: 'Tubes Available',
        fieldName: 'TubesRemaining',
        type: 'number',
        sortable: true
    },
    {
        type: 'button',
        label: 'Stock Batches',
        typeAttributes: {
            label: 'View Stock Batches',
            name: 'view_stock',
            title: 'View available stock batches',
            variant: 'brand-outline'
        }
    }
];


// =========================================================
// STOCK BATCH TABLE
// =========================================================

const batchColumns = [
    {
        label: 'Transfection / Collection ID',
        fieldName: 'Transfection_ID__c'
    },
    {
        label: 'Titer',
        fieldName: 'Titer__c'
    },
    {
        label: 'End Volume',
        fieldName: 'End_Volume__c'
    },
    {
        label: 'Tubes Available',
        fieldName: 'Tubes_Remaining_num_val__c',
        type: 'number'
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'Select',
            name: 'select_batch',
            variant: 'brand'
        }
    }
];


export default class StockVirusTable extends LightningElement {

    // =========================================================
    // FILTER STATE
    // =========================================================

    @track virusType = '';
    @track searchTerm = '';

    @track selectedSerotype = '';
    @track selectedPromoter = '';

    @track selectedHSVFilter = '';
    @track selectedRabiesEnvelope = '';


    // =========================================================
    // DATA
    // =========================================================

    @track allData = [];
    @track filteredData = [];

    @track error = null;


    // =========================================================
    // BATCH MODAL
    // =========================================================

    @track showBatchModal = false;
    @track selectedProduct = null;
    @track selectedBatch = null;


    // =========================================================
    // QUANTITY MODAL
    // =========================================================

    @track showQuantityModal = false;
    @track requestedQuantity = '';

    @track addingToCart = false;


    // =========================================================
    // DATATABLE COLUMNS
    // =========================================================

    columns = columns;
    batchColumns = batchColumns;


    // =========================================================
    // VIRUS TYPE OPTIONS
    // =========================================================

    get virusTypeOptions() {

        return [
            { label: 'All', value: '' },
            { label: 'AAV', value: 'AAV' },
            { label: 'HSV', value: 'HSV' },
            { label: 'Rabies', value: 'Rabies' },
            { label: 'Lenti', value: 'Lenti' }
        ];
    }


    // =========================================================
    // AAV FILTERS
    // =========================================================

    get serotypeOptions() {

        return [
            'AAV1',
            'AAV2',
            'AAV5',
            'AAV8',
            'AAV9',
            'PHP.eB',
            'PHP.B'
        ];
    }


    get promoterOptions() {

        return [
            'CMV',
            'CAG',
            'Syn',
            'EF1a',
            'GFAP',
            'TRE'
        ];
    }


    // =========================================================
    // HSV FILTERS
    // =========================================================

    get hsvFilterOptions() {

        return [
            'Zebra Fish',
            'Retrograde',
            'Short Term',
            'Rabies/TVA helpers',
            'Peripheral Nervous System'
        ];
    }


    // =========================================================
    // CONDITIONAL FILTERS
    // =========================================================

    get showAAVFilters() {

        return this.virusType === 'AAV';
    }


    get showHSVFilters() {

        return this.virusType === 'HSV';
    }


    get showRabiesFilters() {

        return this.virusType === 'Rabies';
    }


    // =========================================================
    // LOAD STOCK PRODUCTS
    // =========================================================

    @wire(getStockViruses)
    wiredViruses({ error, data }) {

        if (data) {

            const rows = [];


            data.forEach(prod => {

                // =================================================
                // CONSTRUCT
                // =================================================

                const constructName =
                    prod.Construct__r
                        ? prod.Construct__r.Name
                        : '';


                // =================================================
                // CAPSID / ENVELOPE
                // =================================================

                const capsidName =
                    prod.Capsid_Envelope__r
                        ? prod.Capsid_Envelope__r.Name
                        : '';


                // =================================================
                // PROMOTER
                // =================================================

                const promoterName =
                    prod.Construct__r
                        ? prod.Construct__r.Promotor_Enhancer__c
                        : '';


                // =================================================
                // END USE
                // =================================================

                const endUse =
                    prod.End_Use__c || '';


                // =================================================
                // STOCK BATCHES
                // =================================================

                const batches =
                    prod.Stock_Batch__r || [];


                // =================================================
                // TOTAL TUBES AVAILABLE
                //
                // Uses:
                // Tubes_Remaining_num_val__c
                //
                // This is the formula field on Stock Batch.
                // =================================================

                const tubesRemaining =
                    batches.reduce(
                        (total, batch) => {

                            return total +
                                (
                                    Number(
                                        batch.Tubes_Remaining_num_val__c
                                    ) || 0
                                );

                        },
                        0
                    );


                // =================================================
                // FORMAT INDIVIDUAL BATCHES
                // =================================================

                const formattedBatches =
                    batches.map(batch => {

                        const available =
                            Number(
                                batch.Tubes_Remaining_num_val__c
                            ) || 0;


                        return {

                            Id:
                                batch.Id,

                            Titer__c:
                                batch.Titer__c,

                            Tubes_Remaining__c:
                                batch.Tubes_Remaining__c,

                            Tubes_Remaining_num_val__c:
                                available,

                            Transfection_ID__c:
                                batch.Transfection_ID__c,

                            End_Volume__c:
                                batch.End_Volume__c,

                            BatchDate:
                                batch.CreatedDate,

                            AvailableTubes:
                                available
                        };
                    });


                // =================================================
                // ADD PRODUCT ROW
                // =================================================

                rows.push({

                    Id:
                        prod.Id,

                    Name:
                        prod.Name,

                    ConstructName:
                        constructName,

                    CapsidName:
                        capsidName,

                    Virus_Type__c:
                        prod.Virus_Type__c,

                    PromoterName:
                        promoterName,

                    EndUse:
                        endUse,

                    Description:
                        prod.Description || '',

                    batches:
                        formattedBatches,

                    TubesRemaining:
                        tubesRemaining
                });

            });


            // =================================================
            // ONLY SHOW PRODUCTS WITH AVAILABLE STOCK
            // =================================================

            this.allData =
                rows.filter(
                    product =>
                        product.TubesRemaining > 0
                );


            this.error = undefined;

            this.applyFilters();

        } else if (error) {

            this.error =
                error.body
                    ? error.body.message
                    : error;

            this.allData = [];

            this.filteredData = [];
        }
    }


    // =========================================================
    // SEARCH
    // =========================================================

    handleSearchChange(event) {

        this.searchTerm =
            event.target.value.toLowerCase();

        this.applyFilters();
    }


    // =========================================================
    // VIRUS TYPE
    // =========================================================

    handleVirusTypeChange(event) {

        this.virusType =
            event.detail.value;

        this.selectedSerotype = '';

        this.selectedPromoter = '';

        this.selectedHSVFilter = '';

        this.selectedRabiesEnvelope = '';

        this.applyFilters();
    }


    // =========================================================
    // AAV SEROTYPE
    // =========================================================

    handleSerotypeClick(event) {

        const value =
            event.target.dataset.value;


        this.selectedSerotype =
            this.selectedSerotype === value
                ? ''
                : value;


        this.applyFilters();
    }


    // =========================================================
    // AAV PROMOTER
    // =========================================================

    handlePromoterClick(event) {

        const value =
            event.target.dataset.value;


        this.selectedPromoter =
            this.selectedPromoter === value
                ? ''
                : value;


        this.applyFilters();
    }


    // =========================================================
    // HSV FILTER
    // =========================================================

    handleHSVClick(event) {

        const value =
            event.target.dataset.value;


        this.selectedHSVFilter =
            this.selectedHSVFilter === value
                ? ''
                : value;


        this.applyFilters();
    }


    // =========================================================
    // RABIES ENVELOPE
    // =========================================================

    handleRabiesClick(event) {

        const value =
            event.target.dataset.value;


        this.selectedRabiesEnvelope =
            this.selectedRabiesEnvelope === value
                ? ''
                : value;


        this.applyFilters();
    }


    // =========================================================
    // APPLY FILTERS
    // =========================================================

    applyFilters() {

        this.filteredData =
            this.allData.filter(product => {

                // =================================================
                // VIRUS TYPE
                // =================================================

                const matchesVirusType =
                    this.virusType
                        ? product.Virus_Type__c ===
                          this.virusType
                        : true;


                // =================================================
                // SEARCH
                // =================================================

                const searchableText =

                    (product.Name || '') +
                    ' ' +
                    (product.ConstructName || '') +
                    ' ' +
                    (product.CapsidName || '') +
                    ' ' +
                    (product.Description || '');


                const matchesSearch =
                    this.searchTerm
                        ? searchableText
                            .toLowerCase()
                            .includes(this.searchTerm)
                        : true;


                // =================================================
                // AAV SEROTYPE
                // =================================================

                const matchesSerotype =
                    this.selectedSerotype
                        ? product.CapsidName ===
                          this.selectedSerotype
                        : true;


                // =================================================
                // AAV PROMOTER
                // =================================================

                const matchesPromoter =
                    this.selectedPromoter
                        ? (
                            product.PromoterName || ''
                        )
                            .toLowerCase()
                            .includes(
                                this.selectedPromoter
                                    .toLowerCase()
                            )
                        : true;


                // =================================================
                // HSV END USE
                // =================================================

                const matchesHSVFilter =
                    this.selectedHSVFilter
                        ? product.EndUse ===
                          this.selectedHSVFilter
                        : true;


                // =================================================
                // RABIES ENVELOPE
                // =================================================

                const matchesRabiesEnvelope =
                    this.selectedRabiesEnvelope
                        ? product.CapsidName ===
                          this.selectedRabiesEnvelope
                        : true;


                return (
                    matchesVirusType &&
                    matchesSearch &&
                    matchesSerotype &&
                    matchesPromoter &&
                    matchesHSVFilter &&
                    matchesRabiesEnvelope
                );
            });
    }


    // =========================================================
    // AAV BUTTONS
    // =========================================================

    get serotypeButtons() {

        return this.serotypeOptions.map(opt => {

            return {

                label:
                    opt,

                variant:
                    this.selectedSerotype === opt
                        ? 'brand'
                        : 'neutral'
            };
        });
    }


    get promoterButtons() {

        return this.promoterOptions.map(opt => {

            return {

                label:
                    opt,

                variant:
                    this.selectedPromoter === opt
                        ? 'brand'
                        : 'neutral'
            };
        });
    }


    // =========================================================
    // HSV BUTTONS
    // =========================================================

    get hsvButtons() {

        return this.hsvFilterOptions.map(opt => {

            return {

                label:
                    opt,

                variant:
                    this.selectedHSVFilter === opt
                        ? 'brand'
                        : 'neutral'
            };
        });
    }


    // =========================================================
    // RABIES ENVELOPE OPTIONS
    // =========================================================

    get rabiesEnvelopeOptions() {

        const envelopes =
            new Set();


        this.allData

            .filter(
                product =>
                    product.Virus_Type__c ===
                    'Rabies'
            )

            .forEach(product => {

                if (product.CapsidName) {

                    envelopes.add(
                        product.CapsidName
                    );
                }
            });


        return Array
            .from(envelopes)
            .sort();
    }


    get rabiesButtons() {

        return this.rabiesEnvelopeOptions.map(opt => {

            return {

                label:
                    opt,

                variant:
                    this.selectedRabiesEnvelope === opt
                        ? 'brand'
                        : 'neutral'
            };
        });
    }


    // =========================================================
    // VIEW STOCK BATCHES
    // =========================================================

    handleRowAction(event) {

        const actionName =
            event.detail.action.name;


        const row =
            event.detail.row;


        if (actionName === 'view_stock') {

            this.selectedProduct =
                row;


            this.selectedBatch =
                null;


            this.showBatchModal =
                true;
        }
    }


    // =========================================================
    // SELECT STOCK BATCH
    // =========================================================

    handleBatchAction(event) {

        const actionName =
            event.detail.action.name;


        const row =
            event.detail.row;


        if (
            actionName !==
            'select_batch'
        ) {

            return;
        }


        // =================================================
        // CHECK INVENTORY
        // =================================================

        const available =
            Number(
                row.Tubes_Remaining_num_val__c
            ) || 0;


        if (available <= 0) {

            this.showToast(

                'Out of Stock',

                'This stock batch is no longer available.',

                'error'
            );

            return;
        }


        // =================================================
        // SAVE SELECTED BATCH
        // =================================================

        this.selectedBatch =
            row;


        // =================================================
        // CLEAR PREVIOUS QUANTITY
        // =================================================

        this.requestedQuantity =
            '';


        // =================================================
        // OPEN QUANTITY MODAL
        // =================================================

        this.showQuantityModal =
            true;
    }


    // =========================================================
    // QUANTITY INPUT
    // =========================================================

    handleQuantityChange(event) {

        this.requestedQuantity =
            event.target.value;
    }


    // =========================================================
    // SELECTED BATCH AVAILABLE
    // =========================================================

    get selectedBatchAvailable() {

        if (!this.selectedBatch) {

            return 0;
        }


        return Number(
            this.selectedBatch
                .Tubes_Remaining_num_val__c
        ) || 0;
    }


    // =========================================================
    // ADD TO CART
    // =========================================================

    async handleAddToCart() {

        // =====================================================
        // MAKE SURE A BATCH IS SELECTED
        // =====================================================

        if (!this.selectedBatch) {

            this.showToast(

                'No Stock Selected',

                'Please select a stock batch first.',

                'error'
            );

            return;
        }


        // =====================================================
        // GET QUANTITY
        // =====================================================

        const quantity =
            Number(
                this.requestedQuantity
            );


        // =====================================================
        // VALIDATE QUANTITY
        // =====================================================

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            this.showToast(

                'Invalid Quantity',

                'Please enter a whole number of tubes greater than 0.',

                'error'
            );

            return;
        }


        // =====================================================
        // GET CURRENT AVAILABLE STOCK
        // =====================================================

        const available =
            Number(
                this.selectedBatch
                    .Tubes_Remaining_num_val__c
            ) || 0;


        // =====================================================
        // OUT OF STOCK
        // =====================================================

        if (available <= 0) {

            this.showToast(

                'Out of Stock',

                'This stock batch is no longer available.',

                'error'
            );

            return;
        }


        // =====================================================
        // TOO MANY TUBES
        // =====================================================

        if (quantity > available) {

            this.showToast(

                'Not Enough Stock',

                `Only ${available} tubes are available for this stock batch.`,

                'error'
            );

            return;
        }


        // =====================================================
        // DISABLE UI
        // =====================================================

        this.addingToCart =
            true;


        try {

            // =================================================
            // CALL APEX
            // =================================================

            const draftOrderId =
                await addStockToCart({

                    stockBatchId:
                        this.selectedBatch.Id,

                    tubesRequested:
                        quantity

                });


            console.log(
                'Stock added to cart. Draft Order:',
                draftOrderId
            );


            // =================================================
            // CLOSE MODALS
            // =================================================

            this.showQuantityModal =
                false;


            this.showBatchModal =
                false;


            this.selectedBatch =
                null;


            this.selectedProduct =
                null;


            this.requestedQuantity =
                '';


            // =================================================
            // SUCCESS TOAST
            // =================================================

            this.showToast(

                'Added to Cart',

                `${quantity} tube${quantity === 1 ? '' : 's'} added to your cart.`,

                'success'
            );


        } catch (error) {

            console.error(
                'Error adding stock to cart:',
                error
            );


            let message =
                'Unable to add the stock to your cart.';


            if (
                error &&
                error.body &&
                error.body.message
            ) {

                message =
                    error.body.message;

            } else if (
                error &&
                error.message
            ) {

                message =
                    error.message;
            }


            this.showToast(

                'Unable to Add to Cart',

                message,

                'error'
            );


        } finally {

            this.addingToCart =
                false;
        }
    }


    // =========================================================
    // CLOSE QUANTITY MODAL
    // =========================================================

    closeQuantityModal() {

        if (this.addingToCart) {

            return;
        }


        this.showQuantityModal =
            false;


        this.requestedQuantity =
            '';
    }


    // =========================================================
    // CLOSE BATCH MODAL
    // =========================================================

    closeBatchModal() {

        if (this.addingToCart) {

            return;
        }


        this.showBatchModal =
            false;


        this.selectedProduct =
            null;


        this.selectedBatch =
            null;


        this.requestedQuantity =
            '';
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

                title:
                    title,

                message:
                    message,

                variant:
                    variant
            })
        );
    }
}