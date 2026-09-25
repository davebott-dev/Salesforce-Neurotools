import { LightningElement, api, wire } from 'lwc';

import {
    FlowAttributeChangeEvent
} from 'lightning/flowSupport';

import getStockViruses
    from '@salesforce/apex/StockVirusProductController.getStockViruses';


export default class StockSelector extends LightningElement {

    // =========================================================
    // FLOW INPUT
    // =========================================================

    _virusType;

    @api
    get virusType() {
        return this._virusType;
    }

    set virusType(value) {

        this._virusType = value;

        this.selectedStock = null;
        this.selectedBatch = null;

        this.searchTerm = '';
        this.selectedSeroType = '';
        this.selectedEnvelope = '';
        this.selectedEndUse = '';
        this.selectedPromoter = '';

        this.updateFilteredStocks();
    }


    // =========================================================
    // FLOW OUTPUTS
    // =========================================================

    @api selectedStockId;
    @api selectedStockName;

    @api selectedStockBatchId;
    @api selectedStockBatchDate;
    @api selectedStockBatchTiter;
    @api selectedStockBatchEndVolume;
    @api selectedStockBatchTubes;

    @api Set_Quantity;


    // =========================================================
    // DATA
    // =========================================================

    stocks = [];
    filteredStocks = [];

    selectedStock = null;
    selectedBatch = null;

    searchTerm = '';

    selectedSeroType = '';
    selectedEnvelope = '';
    selectedEndUse = '';
    selectedPromoter = '';

    isLoading = true;
    error;


    // =========================================================
    // APEX
    // =========================================================

    @wire(getStockViruses)
    wiredStockViruses({ data, error }) {

        this.isLoading = false;

        if (data) {

            this.error = undefined;

            this.stocks = data
                .map(stock => {

                    const batches =
                        stock.Stock_Batch__r || [];

                    return {
                        ...stock,

                        batches: batches,

                        constructName:
                            stock.Construct__r
                                ? stock.Construct__r.Name
                                : '',

                        promoterEnhancer:
                            stock.Construct__r
                                ? stock.Construct__r.Promotor_Enhancer__c
                                : '',

                        capsidEnvelopeName:
                            stock.Capsid_Envelope__r
                                ? stock.Capsid_Envelope__r.Name
                                : '',

                        batchCount:
                            batches.length,

                        availableTubes:
                            batches.reduce(
                                (total, batch) =>
                                    total +
                                    (
                                        Number(
                                            batch.Tubes_Remaining_num_val__c
                                        ) || 0
                                    ),
                                0
                            )
                    };
                })
                .filter(
                    stock =>
                        stock.batches.length > 0
                );

            this.updateFilteredStocks();

        } else if (error) {

            this.error = error;

            this.stocks = [];
            this.filteredStocks = [];
        }
    }


    // =========================================================
    // FILTER STOCKS
    // =========================================================

    updateFilteredStocks() {

        if (!this.stocks) {
            this.filteredStocks = [];
            return;
        }

        let results = [...this.stocks];


        // -----------------------------------------------------
        // VIRUS TYPE
        // -----------------------------------------------------

        if (this._virusType) {

            results = results.filter(
                stock =>
                    stock.Virus_Type__c === this._virusType
            );
        }


        // -----------------------------------------------------
        // SEARCH
        // -----------------------------------------------------

        if (this.searchTerm) {

            const search =
                this.searchTerm.toLowerCase();

            results = results.filter(stock => {

                return (

                    (stock.Name || '')
                        .toLowerCase()
                        .includes(search)

                    ||

                    (stock.constructName || '')
                        .toLowerCase()
                        .includes(search)

                    ||

                    (stock.capsidEnvelopeName || '')
                        .toLowerCase()
                        .includes(search)

                    ||

                    (stock.promoterEnhancer || '')
                        .toLowerCase()
                        .includes(search)

                );
            });
        }


        // -----------------------------------------------------
        // AAV CAPSId FILTER
        // -----------------------------------------------------

        if (
            this._virusType === 'AAV' &&
            this.selectedSeroType
        ) {

            results = results.filter(
                stock =>
                    stock.capsidEnvelopeName ===
                    this.selectedSeroType
            );
        }


        // -----------------------------------------------------
        // AAV PROMOTER FILTER
        // -----------------------------------------------------

        if (
            this._virusType === 'AAV' &&
            this.selectedPromoter
        ) {

            results = results.filter(
                stock =>
                    stock.promoterEnhancer ===
                    this.selectedPromoter
            );
        }


        // -----------------------------------------------------
        // RABIES / LENTI ENVELOPE FILTER
        // -----------------------------------------------------

        if (
            (
                this._virusType === 'Rabies' ||
                this._virusType === 'Lenti'
            ) &&
            this.selectedEnvelope
        ) {

            results = results.filter(
                stock =>
                    stock.capsidEnvelopeName ===
                    this.selectedEnvelope
            );
        }


        // -----------------------------------------------------
        // HSV END USE FILTER
        // -----------------------------------------------------

        if (
            this._virusType === 'HSV' &&
            this.selectedEndUse
        ) {

            results = results.filter(
                stock =>
                    stock.End_Use__c ===
                    this.selectedEndUse
            );
        }


        // -----------------------------------------------------
        // FINAL RESULTS
        // -----------------------------------------------------

        this.filteredStocks =
            results.map(stock => {

                return {
                    ...stock,

                    isSelected:
                        this.selectedStock &&
                        this.selectedStock.Id ===
                            stock.Id
                };
            });
    }


    // =========================================================
    // FILTER HANDLERS
    // =========================================================

    handleSeroTypeChange(event) {

        this.selectedSeroType =
            event.detail.value;

        this.updateFilteredStocks();
    }


    handleEnvelopeChange(event) {

        this.selectedEnvelope =
            event.detail.value;

        this.updateFilteredStocks();
    }


    handleEndUseChange(event) {

        this.selectedEndUse =
            event.detail.value;

        this.updateFilteredStocks();
    }


    handlePromoterChange(event) {

        this.selectedPromoter =
            event.detail.value;

        this.updateFilteredStocks();
    }


    // =========================================================
    // SEARCH
    // =========================================================

    handleSearch(event) {

        this.searchTerm =
            event.target.value;

        this.updateFilteredStocks();
    }


    // =========================================================
    // SELECT STOCK
    // =========================================================

    handleStockSelect(event) {

        const stockId =
            event.currentTarget.dataset.id;

        const stock =
            this.stocks.find(
                item =>
                    item.Id === stockId
            );

        if (!stock) {
            return;
        }

        this.selectedStock = stock;
        this.selectedBatch = null;


        // Send stock information to Flow

        this.setFlowValue(
            'selectedStockId',
            stock.Id
        );

        this.setFlowValue(
            'selectedStockName',
            stock.Name
        );


        // Batch is not selected yet

        this.clearBatchOutputs();

        this.updateFilteredStocks();
    }


    // =========================================================
    // SELECT BATCH
    // =========================================================

    handleBatchSelect(event) {

        const batchId =
            event.currentTarget.dataset.id;

        if (!this.selectedStock) {
            return;
        }


        const batch =
            (this.selectedStock.batches || [])
                .find(
                    item =>
                        item.Id === batchId
                );

        if (!batch) {
            return;
        }


        this.selectedBatch = batch;


        // Send batch information to Flow

        this.setFlowValue(
            'selectedStockBatchId',
            batch.Id
        );

        this.setFlowValue(
            'selectedStockBatchDate',
            this.getBatchDate(batch)
        );

        this.setFlowValue(
            'selectedStockBatchTiter',
            batch.Titer__c
        );

        this.setFlowValue(
            'selectedStockBatchEndVolume',
            batch.End_Volume__c
        );

        this.setFlowValue(
            'selectedStockBatchTubes',
            batch.Tubes_Remaining_num_val__c
        );
    }


    // =========================================================
    // CHANGE BATCH
    // =========================================================

    handleChangeBatch() {

        this.selectedBatch = null;

        this.clearBatchOutputs();
    }


    // =========================================================
    // CHANGE STOCK
    // =========================================================

    handleChangeStock() {

        this.selectedStock = null;
        this.selectedBatch = null;

        this.clearAllOutputs();

        this.updateFilteredStocks();
    }


    // =========================================================
    // BATCH DATE
    //
    // AAV -> Transfection_ID__c
    // Other viruses -> CreatedDate
    // =========================================================

    getBatchDate(batch) {

        if (!batch) {
            return null;
        }


        if (this._virusType === 'AAV') {

            return batch.Transfection_ID__c ||
                   this.formatDate(
                       batch.CreatedDate
                   );
        }


        return this.formatDate(
            batch.CreatedDate
        );
    }


    formatDate(value) {

        if (!value) {
            return '';
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(
            'en-US'
        ).format(date);
    }


    // =========================================================
    // FLOW ATTRIBUTE CHANGE
    // =========================================================

    setFlowValue(
        propertyName,
        value
    ) {

        this[propertyName] =
            value;

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                propertyName,
                value
            )
        );
    }


    // =========================================================
    // CLEAR BATCH OUTPUTS
    // =========================================================

    clearBatchOutputs() {

        this.setFlowValue(
            'selectedStockBatchId',
            null
        );

        this.setFlowValue(
            'selectedStockBatchDate',
            null
        );

        this.setFlowValue(
            'selectedStockBatchTiter',
            null
        );

        this.setFlowValue(
            'selectedStockBatchEndVolume',
            null
        );

        this.setFlowValue(
            'selectedStockBatchTubes',
            null
        );
    }


    // =========================================================
    // CLEAR ALL OUTPUTS
    // =========================================================

    clearAllOutputs() {

        this.setFlowValue(
            'selectedStockId',
            null
        );

        this.setFlowValue(
            'selectedStockName',
            null
        );

        this.clearBatchOutputs();
    }


    // =========================================================
    // UI GETTERS
    // =========================================================

    get seroTypeOptions() {

        return this.getUniqueOptions(
            this.stocks
                .filter(
                    stock =>
                        stock.Virus_Type__c === 'AAV'
                )
                .map(
                    stock =>
                        stock.capsidEnvelopeName
                )
        );
    }


    get promoterOptions() {

        return this.getUniqueOptions(
            this.stocks
                .filter(
                    stock =>
                        stock.Virus_Type__c === 'AAV'
                )
                .map(
                    stock =>
                        stock.promoterEnhancer
                )
        );
    }


    get envelopeOptions() {

        return this.getUniqueOptions(
            this.stocks
                .filter(
                    stock =>
                        stock.Virus_Type__c === this._virusType
                )
                .map(
                    stock =>
                        stock.capsidEnvelopeName
                )
        );
    }


    get endUseOptions() {

        return this.getUniqueOptions(
            this.stocks
                .filter(
                    stock =>
                        stock.Virus_Type__c === 'HSV'
                )
                .map(
                    stock =>
                        stock.End_Use__c
                )
        );
    }


    getUniqueOptions(values) {

        return [
            {
                label: 'All',
                value: ''
            },

            ...[
                ...new Set(
                    values.filter(
                        value => value
                    )
                )
            ].map(value => ({
                label: value,
                value: value
            }))
        ];
    }


    get showSeroTypeFilter() {

        return this._virusType === 'AAV';
    }


    get showEnvelopeFilter() {

        return (
            this._virusType === 'Rabies' ||
            this._virusType === 'Lenti'
        );
    }


    get showEndUseFilter() {

        return this._virusType === 'HSV';
    }


    get isHSV() {

        return this._virusType === 'HSV';
    }

    get isLenti() {
    return this._virusType === 'Lenti';
}


    get hasStocks() {

        return this.filteredStocks.length > 0;
    }


    get hasSelectedStock() {

        return !!this.selectedStock;
    }


    get hasSelectedBatch() {

        return !!this.selectedBatch;
    }


    get availableBatches() {

        if (!this.selectedStock) {
            return [];
        }

        return (
            this.selectedStock.batches || []
        ).map(batch => {

            return {
                ...batch,

                displayDate:
                    this.getBatchDate(batch),

                isSelected:
                    this.selectedBatch &&
                    this.selectedBatch.Id ===
                        batch.Id
            };
        });
    }


    get hasBatches() {

        return this.availableBatches.length > 0;
    }


    get batchDateLabel() {

        if (
            this._virusType === 'AAV'
        ) {
            return 'Transfection Date';
        }

        return 'Collection Date';
    }


    // =========================================================
    // SAFE SELECTED STOCK GETTERS
    // =========================================================

    get selectedStockDisplayName() {

        return this.selectedStock
            ? this.selectedStock.Name || ''
            : '';
    }


    get selectedStockConstructName() {

        return this.selectedStock
            ? this.selectedStock.constructName || ''
            : '';
    }


    get selectedStockCapsidEnvelopeName() {

        return this.selectedStock
            ? this.selectedStock.capsidEnvelopeName || ''
            : '';
    }


    // =========================================================
    // ERROR MESSAGE
    // =========================================================

    get errorMessage() {

        if (!this.error) {
            return '';
        }


        if (
            this.error.body &&
            this.error.body.message
        ) {
            return this.error.body.message;
        }


        return 'Unable to load stock products.';
    }


    // =========================================================
    // FLOW VALIDATION
    // =========================================================

@api
validate() {
    if (this.isLenti) {
        return {
            isValid: false,
            errorMessage:
                'There are currently no lentivirus stocks available. Please choose another virus type to continue.'
        };
    }

    if (!this.selectedStock) {
        return {
            isValid: false,
            errorMessage: 'Please select a stock product.'
        };
    }

    if (!this.selectedBatch) {
        return {
            isValid: false,
            errorMessage: 'Please select an available stock batch.'
        };
    }

    const requested = Number(this.Set_Quantity);
    const available = Number(this.selectedStockBatchTubes);

    if (!Number.isFinite(requested) || requested <= 0) {
        return {
            isValid: false,
            errorMessage: 'Please enter a valid number of tubes.'
        };
    }

    if (requested > available) {
        return {
            isValid: false,
            errorMessage:
                `You requested ${requested} tubes, but only ${available} tubes are available in the selected stock batch.`
        };
    }

    return {
        isValid: true
    };
}
}