import { LightningElement, api, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

import getInventory from '@salesforce/apex/ConstructSelectorController.getInventory';

export default class ConstructSelector extends LightningElement {

    // ============================================================
    // FLOW INPUT
    // ============================================================

    _virusType = '';
    _previousConstructId = '';

    @api
    get virusType() {
        return this._virusType;
    }

    set virusType(value) {

        this._virusType = value || '';

        // Clear previous selection
        this.selectedInventoryId = null;
        this.selectedInventoryName = '';
        this.selectedInventoryAlias = '';

        this.selectedConstructFullLength = null;
        this.selectedAddgeneConstruct = '';
        this.selectedITRLength = null;
        this.selectedExpectedTransfectionFluorescence = '';

        // Reset filters
        this.searchTerm = '';
        this.promoterFilter = 'All';

        this.updateFilteredInventory();

        // Inventory may already be loaded
        this.selectPreviousConstruct();
    }


    @api
    get previousConstructId() {
        return this._previousConstructId;
    }

    set previousConstructId(value) {

        this._previousConstructId = value || '';

        // Inventory may already be loaded
        if (this._previousConstructId) {
            this.selectPreviousConstruct();
        }
    }


    // ============================================================
    // FLOW OUTPUTS
    // ============================================================

    @api selectedInventoryId;

    @api selectedInventoryName = '';

    @api selectedInventoryAlias = '';

    @api selectedConstructFullLength;

    @api selectedAddgeneConstruct = '';

    @api selectedITRLength;

    @api selectedExpectedTransfectionFluorescence = '';


    // ============================================================
    // INVENTORY DATA
    // ============================================================

    inventoryRecords = [];

    filteredInventory = [];


    // ============================================================
    // UI STATE
    // ============================================================

    activeTab = 'neurotools';

    searchTerm = '';

    promoterFilter = 'All';


    // ============================================================
    // QUERY APEX
    // ============================================================

    @wire(getInventory, { virusType: '$virusType' })
    wiredInventory({ data, error }) {

        if (data) {

            this.inventoryRecords = data;

            this.updateFilteredInventory();

            // Automatically select previous construct
            this.selectPreviousConstruct();

        } else if (error) {

            console.error(
                'Construct Selector - Error:',
                JSON.stringify(error)
            );

            this.inventoryRecords = [];

            this.filteredInventory = [];
        }
    }


    // ============================================================
    // TABS
    // ============================================================

    handleTabChange(event) {

        this.activeTab =
            event.currentTarget.dataset.tab;

        this.searchTerm = '';

        this.promoterFilter = 'All';

        this.updateFilteredInventory();
    }


    get neurotoolsTabClass() {

        return this.activeTab === 'neurotools'
            ? 'tab active'
            : 'tab';
    }


    get clientTabClass() {

        return this.activeTab === 'client'
            ? 'tab active'
            : 'tab';
    }


    // ============================================================
    // INVENTORY COUNTS
    // ============================================================

    get neurotoolsCount() {

        return this.inventoryRecords.filter(
            record =>
                record.Permissions__c === 'Global'
        ).length;
    }


    get clientCount() {

        return this.inventoryRecords.filter(
            record =>
                record.Permissions__c === 'Requesting Lab'
        ).length;
    }


    // ============================================================
    // CURRENT TAB INVENTORY
    // ============================================================

    get currentTabInventory() {

        if (this.activeTab === 'client') {

            return this.inventoryRecords.filter(
                record =>
                    record.Permissions__c === 'Requesting Lab'
            );
        }

        return this.inventoryRecords.filter(
            record =>
                record.Permissions__c === 'Global'
        );
    }


    // ============================================================
    // PROMOTER OPTIONS
    // ============================================================

    get promoterOptions() {

        const promoters = new Set();

        this.currentTabInventory.forEach(record => {

            if (record.Promotor_Enhancer__c) {

                promoters.add(
                    record.Promotor_Enhancer__c
                );
            }
        });


        const options = [
            {
                label: 'All Promoters / Enhancers',
                value: 'All'
            }
        ];


        [...promoters]
            .sort()
            .forEach(promoter => {

                options.push({
                    label: promoter,
                    value: promoter
                });

            });


        return options;
    }


    // ============================================================
    // FILTER INVENTORY
    // ============================================================

    updateFilteredInventory() {

        let results =
            [...this.currentTabInventory];


        // --------------------------------------------------------
        // SEARCH
        // --------------------------------------------------------

        if (this.searchTerm) {

            const search =
                this.searchTerm
                    .trim()
                    .toLowerCase();


            results = results.filter(record => {

                const constructName =
                    record.Name
                        ? String(record.Name).toLowerCase()
                        : '';


                const promoter =
                    record.Promotor_Enhancer__c
                        ? String(
                            record.Promotor_Enhancer__c
                        ).toLowerCase()
                        : '';


                const alias =
                    record.Inventory_Alias__c
                        ? String(
                            record.Inventory_Alias__c
                        ).toLowerCase()
                        : '';


                const addgene =
                    record.Addgene_Construct__c
                        ? String(
                            record.Addgene_Construct__c
                        ).toLowerCase()
                        : '';


                return (
                    constructName.includes(search) ||
                    promoter.includes(search) ||
                    alias.includes(search) ||
                    addgene.includes(search)
                );
            });
        }


        // --------------------------------------------------------
        // PROMOTER FILTER
        // --------------------------------------------------------

        if (this.promoterFilter !== 'All') {

            results = results.filter(
                record =>
                    record.Promotor_Enhancer__c ===
                    this.promoterFilter
            );
        }


        // --------------------------------------------------------
        // SELECTION
        // --------------------------------------------------------

        const hasSelection =
            this.selectedInventoryId != null;


        // --------------------------------------------------------
        // BUILD UI RECORDS
        // --------------------------------------------------------

        this.filteredInventory =
            results.map(record => {

                const isSelected =
                    record.Id ===
                    this.selectedInventoryId;


                const addgeneNumber =
                    record.Addgene_Construct__c != null
                        ? String(
                            record.Addgene_Construct__c
                        ).trim()
                        : '';


                const isAddgene =
                    addgeneNumber.length > 0;


                return {

                    ...record,

                    isSelected: isSelected,

                    isCustomerInventory:
                        record.Permissions__c ===
                        'Requesting Lab',

                    isAddgene: isAddgene,

                    addgeneNumber: addgeneNumber,

                    rowClass:
                        isSelected
                            ? 'selected-row'
                            : hasSelection
                                ? 'dimmed-row'
                                : 'normal-row'
                };

            });
    }


    // ============================================================
    // SEARCH
    // ============================================================

    handleSearch(event) {

        this.searchTerm =
            event.target.value || '';

        this.updateFilteredInventory();
    }


    // ============================================================
    // PROMOTER FILTER
    // ============================================================

    handlePromoterChange(event) {

        this.promoterFilter =
            event.detail.value;

        this.updateFilteredInventory();
    }


    // ============================================================
    // AUTO-SELECT PREVIOUS CONSTRUCT
    // ============================================================

    selectPreviousConstruct() {

        // Nothing to do for a new order
        if (!this.previousConstructId) {
            return;
        }

        // Inventory has not loaded yet
        if (!this.inventoryRecords.length) {
            return;
        }

        const previousConstruct =
            this.inventoryRecords.find(
                record =>
                    record.Id === this.previousConstructId
            );

        // Previous construct isn't available
        if (!previousConstruct) {

            console.warn(
                'Construct Selector: Previous construct not found:',
                this.previousConstructId
            );

            return;
        }


        // ========================================================
        // SWITCH TO THE CORRECT TAB
        // ========================================================

        if (
            previousConstruct.Permissions__c ===
            'Requesting Lab'
        ) {

            this.activeTab = 'client';

        } else {

            this.activeTab = 'neurotools';
        }


        // Reset filters so the previous construct is visible
        this.searchTerm = '';
        this.promoterFilter = 'All';


        // ========================================================
        // SELECT THE CONSTRUCT
        // ========================================================

        this.selectConstruct(previousConstruct);
    }


    // ============================================================
    // SELECT CONSTRUCT
    // ============================================================

    handleSelection(event) {

        const inventoryId =
            event.target.value;


        const selected =
            this.inventoryRecords.find(
                record =>
                    record.Id === inventoryId
            );


        if (!selected) {

            console.error(
                'Construct Selector: Could not find selected inventory record.'
            );

            return;
        }


        this.selectConstruct(selected);
    }


    selectConstruct(selected) {

        // --------------------------------------------------------
        // BASIC CONSTRUCT INFORMATION
        // --------------------------------------------------------

        this.selectedInventoryId =
            selected.Id;

        this.selectedInventoryName =
            selected.Name || '';

        this.selectedInventoryAlias =
            selected.Inventory_Alias__c || '';


        // --------------------------------------------------------
        // CONSTRUCT FULL LENGTH
        // --------------------------------------------------------

        this.selectedConstructFullLength =
            selected.Construct_Full_Length__c != null
                ? selected.Construct_Full_Length__c
                : null;


        // --------------------------------------------------------
        // ADDGENE CONSTRUCT
        // --------------------------------------------------------

        this.selectedAddgeneConstruct =
            selected.Addgene_Construct__c
                ? String(
                    selected.Addgene_Construct__c
                ).trim()
                : '';


        // --------------------------------------------------------
        // ITR LENGTH
        // --------------------------------------------------------

        this.selectedITRLength =
            selected.ITR_ITR_Length_bp__c != null
                ? selected.ITR_ITR_Length_bp__c
                : null;


        // --------------------------------------------------------
        // TRANSFECTION FLUORESCENCE
        // --------------------------------------------------------

        this.selectedExpectedTransfectionFluorescence =
            selected.Expected_Transfection_Fluorescence__c || '';


        // ========================================================
        // SEND VALUES TO FLOW
        // ========================================================

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryId',
                this.selectedInventoryId
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryName',
                this.selectedInventoryName
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryAlias',
                this.selectedInventoryAlias
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedConstructFullLength',
                this.selectedConstructFullLength
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedAddgeneConstruct',
                this.selectedAddgeneConstruct
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedITRLength',
                this.selectedITRLength
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedExpectedTransfectionFluorescence',
                this.selectedExpectedTransfectionFluorescence
            )
        );


        // ========================================================
        // REFRESH TABLE
        // ========================================================

        this.updateFilteredInventory();


        // ========================================================
        // SCROLL TO SELECTED ROW
        // ========================================================

        this.scrollToSelectedConstruct();


        // ========================================================
        // CUSTOM EVENT
        // ========================================================

        this.dispatchEvent(
            new CustomEvent(
                'inventorychange',
                {
                    detail: {
                        inventoryId: selected.Id,
                        inventory: selected
                    }
                }
            )
        );
    }


    // ============================================================
    // SCROLL TO SELECTED CONSTRUCT
    // ============================================================

    scrollToSelectedConstruct() {

        if (!this.selectedInventoryId) {
            return;
        }


        // Wait for the updated table to render
        requestAnimationFrame(() => {

            const selectedRow =
                this.template.querySelector(
                    `[data-id="${this.selectedInventoryId}"]`
                );


            if (selectedRow) {

                selectedRow.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

            }

        });
    }


    // ============================================================
    // CLEAR SELECTION
    // ============================================================

    clearSelection() {

        this.selectedInventoryId = null;

        this.selectedInventoryName = '';

        this.selectedInventoryAlias = '';

        this.selectedConstructFullLength = null;

        this.selectedAddgeneConstruct = '';

        this.selectedITRLength = null;

        this.selectedExpectedTransfectionFluorescence = '';


        // ========================================================
        // TELL FLOW
        // ========================================================

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryId',
                null
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryName',
                ''
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedInventoryAlias',
                ''
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedConstructFullLength',
                null
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedAddgeneConstruct',
                ''
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedITRLength',
                null
            )
        );

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'selectedExpectedTransfectionFluorescence',
                ''
            )
        );


        this.updateFilteredInventory();
    }


    // ============================================================
    // SELECTED ADDGENE
    // ============================================================

    get isSelectedAddgene() {

        return (
            this.selectedInventoryId != null &&
            this.selectedAddgeneConstruct != null &&
            String(
                this.selectedAddgeneConstruct
            ).trim() !== ''
        );
    }


    // ============================================================
    // DISPLAY GETTERS
    // ============================================================

    get showTable() {

        return (
            this.virusType &&
            this.filteredInventory.length > 0
        );
    }


    get showNoResults() {

        return (
            this.virusType &&
            this.filteredInventory.length === 0
        );
    }


    // ============================================================
    // SELECTION STATUS
    // ============================================================

    get hasSelection() {

        return (
            this.selectedInventoryId != null
        );
    }


    // ============================================================
    // FLOW VALIDATION
    // ============================================================

    @api
    validate() {

        if (!this.selectedInventoryId) {

            return {
                isValid: false,
                errorMessage:
                    'Please select a construct before continuing.'
            };

        }

        return {
            isValid: true,
            errorMessage: ''
        };
    }

}