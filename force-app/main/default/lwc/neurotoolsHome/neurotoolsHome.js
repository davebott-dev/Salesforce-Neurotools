
import { refreshApex } from '@salesforce/apex';
import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import USER_ID from '@salesforce/user/Id';
import CONTACT_ID from '@salesforce/schema/User.ContactId';
import CONTACT_ACCOUNT_LAB_TYPE from '@salesforce/schema/Contact.Account.Lab_Type__c';

import BulkOrderDownloadTemplate from '@salesforce/resourceUrl/BulkOrderTemplate';

import getRecentClientVirusOrders
    from '@salesforce/apex/ClientOrderController.getRecentClientVirusOrders';
import getClientOrderSummary
    from '@salesforce/apex/ClientOrderController.getClientOrderSummary';

import getStockViruses
    from '@salesforce/apex/StockVirusProductController.getStockViruses';
import addStockToCart
    from '@salesforce/apex/StockVirusProductController.addStockToCart';

export default class NeurotoolsHome extends LightningElement {
    routes = {
        createOrder: '/s/createorder',
        quoteRequest: '/s/quoterequest',
        createCase: '/s/createcase',
        allOrders: '/s/orders',
        creditCard: '/partners/s/credit-card/Credit_Card__c/Default',
        chartfield: '/partners/s/chartfield-strings',
        purchaseOrder: '/partners/s/purchaseorders',
        orderingGuide: 'https://neurotools.unc.edu/about-us/placing-paying-for-your-order',
        shippingInfo: 'https://neurotools.unc.edu/sending-samples',
        faqs: 'https://neurotools.unc.edu/faqs',
        products: 'https://neurotools.unc.edu/services/virus-pricing',
        publications: '/s/publications'
    };

    // Current user and contact
    contactId;
    _labType;

    // Dashboard data
    recentOrders = [];
    orderSummary = {
        active: 0,
        inProduction: 0,
        readyToShip: 0,
        completed: 0
    };

    isLoadingDashboard = true;
    dashboardError = '';

    // Billing modal
    billingModalOpen = false;
    billingOptions = [];

    // Quick Order inventory
    stockProducts = [];
    isLoadingStock = true;
    stockError = '';

    // Quick Order modal
    stockModalOpen = false;
    selectedProduct = null;
    selectedBatchId = '';
    requestedTubes = 1;
    isAddingToCart = false;

    // Stores the complete wire result for refreshApex()
    wiredStockResult;

    // ----------------------------------------
    // Retrieve logged-in user's Contact ID
    // ----------------------------------------
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [CONTACT_ID]
    })
    wiredUser({ data, error }) {
        if (data) {
            this.contactId = getFieldValue(data, CONTACT_ID);

            if (this.contactId) {
                this.loadDashboardData();
            } else {
                this.recentOrders = [];
                this.setEmptySummary();
                this.isLoadingDashboard = false;
                this.dashboardError =
                    'Your portal user is not associated with a contact.';
            }
        } else if (error) {
            this.isLoadingDashboard = false;
            this.dashboardError =
                'Unable to retrieve your portal user information.';
            console.error('Error retrieving portal user:', error);
        }
    }

    // ----------------------------------------
    // Retrieve Lab Type through Contact > Account
    // ----------------------------------------
    @wire(getRecord, {
        recordId: '$contactId',
        fields: [CONTACT_ACCOUNT_LAB_TYPE]
    })
    wiredContact({ data, error }) {
        if (data) {
            this._labType = getFieldValue(data, CONTACT_ACCOUNT_LAB_TYPE);
        } else if (error) {
            this._labType = null;
            console.error('Error retrieving contact lab type:', error);
        }
    }

    get labType() {
        return this._labType;
    }

    get isInternalLab() {
        return (
            this.labType === 'Internal Subsidized' ||
            this.labType === 'Internal Non-Subsidized'
        );
    }

    get billingModalTitle() {
        return 'Choose a Billing Method';
    }

    // ----------------------------------------
    // Load dashboard data
    // ----------------------------------------
    async loadDashboardData() {
        this.isLoadingDashboard = true;
        this.dashboardError = '';

        try {
            const [recentData, summaryData] = await Promise.all([
                getRecentClientVirusOrders({ contactId: this.contactId }),
                getClientOrderSummary({ contactId: this.contactId })
            ]);

            this.recentOrders = (recentData || []).map((orderRecord) => ({
                ...orderRecord,
                displayOrderNumber:
                    orderRecord.OrderNumber || orderRecord.Name || 'Order',
                recordLink: `/s/detail/${orderRecord.Id}`,
                stageClass: this.getStageClass(orderRecord.Stage)
            }));

            this.orderSummary = {
                active: summaryData?.active ?? 0,
                inProduction: summaryData?.inProduction ?? 0,
                readyToShip: summaryData?.readyToShip ?? 0,
                completed: summaryData?.completed ?? 0
            };
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.dashboardError =
                'We could not load your order dashboard. Please refresh the page.';
            this.recentOrders = [];
            this.setEmptySummary();
        } finally {
            this.isLoadingDashboard = false;
        }
    }

    setEmptySummary() {
        this.orderSummary = {
            active: 0,
            inProduction: 0,
            readyToShip: 0,
            completed: 0
        };
    }

    // ----------------------------------------
    // Order stage styling
    // ----------------------------------------
    getStageClass(stage) {
        const normalizedStage = (stage || '').toLowerCase();

        if (
            normalizedStage === 'shipped' ||
            normalizedStage === 'completed'
        ) {
            return 'stage-badge stage-completed';
        }

        if (normalizedStage === 'production completed') {
            return 'stage-badge stage-ready';
        }

        if (
            normalizedStage === 'virus prep in progress' ||
            normalizedStage === 'qc in progress'
        ) {
            return 'stage-badge stage-production';
        }

        if (
            normalizedStage === 'on hold' ||
            normalizedStage === 'canceled' ||
            normalizedStage === 'cancelled'
        ) {
            return 'stage-badge stage-inactive';
        }

        return 'stage-badge stage-active';
    }

    get hasRecentOrders() {
        return this.recentOrders.length > 0;
    }

    // ----------------------------------------
    // Load and format featured stock products
    // ----------------------------------------
    
@wire(getStockViruses)
wiredStockProducts(result) {
    this.wiredStockResult = result;

    const { error, data } = result;

    if (data) {
        const featuredProducts = [
            'pAAV-CAG-dLight3.8: Capsid AAV9',
            'Rbv-CVS-N2c(dG)-H2B-eGFP(EnvA)',
            'Rbv-CVS-N2c(dG)-tdTomato(EnvA)',
            'pAAV-Syn-dLight3.8: Capsid AAV9',
            'hSyn-kLight1.3: Capsid AAV1'
        ];

        const featuredNames = new Set(
            featuredProducts.map(name => name.toLowerCase())
        );

        this.stockProducts = data
            .filter(prod =>
                featuredNames.has((prod.Name || '').toLowerCase())
            )
            .map(prod => {
                const batches = prod.Stock_Batch__r || [];

                const formattedBatches = batches.map(batch => {
                    const available =
                        Number(batch.Tubes_Remaining_num_val__c) || 0;

                    return {
                        ...batch,
                        AvailableTubes: available,

                        batchLabel:
                            batch.Transfection_ID__c ||
                            batch.Name ||
                            'Stock Batch',

                        displayTiter:
                            batch.Titer__c || 'Not specified',

                        displayVolume:
                            batch.End_Volume__c || 'Not specified',

                        displayTubes: available
                    };
                });

                // Calculate actual available inventory.
                const totalTubes = formattedBatches.reduce(
                    (total, batch) =>
                        total + batch.AvailableTubes,
                    0
                );

                // Only batches with remaining tubes count as available.
                const availableBatches = formattedBatches.filter(
                    batch => batch.AvailableTubes > 0
                );

                const hasAvailableBatches =
                    totalTubes > 0 && availableBatches.length > 0;

                return {
                    ...prod,

                    constructName:
                        prod.Construct__r?.Name || '',

                    capsidName:
                        prod.Capsid_Envelope__r?.Name || '',

                    cardDescription: [
                        prod.Construct__r?.Name,
                        prod.Capsid_Envelope__r?.Name
                    ].filter(Boolean).join(' · ') ||
                        'Stock virus preparation',

                    batches: availableBatches,

                    batchCount: availableBatches.length,

                    TubesRemaining: totalTubes,

                    // Both properties are used by the HTML.
                    hasAvailableBatches: hasAvailableBatches,

                    isUnavailable: !hasAvailableBatches
                };
            });

        this.stockError = '';
        this.isLoadingStock = false;

        console.log(
            'Featured stock products:',
            JSON.stringify(this.stockProducts)
        );

    } else if (error) {
        console.error('Error loading featured stock:', error);

        this.stockError =
            error.body?.message ||
            'Unable to load stock products.';

        this.stockProducts = [];
        this.isLoadingStock = false;
    }
}

async loadStockProducts() {
    if (!this.wiredStockResult) {
        return;
    }

    this.isLoadingStock = true;
    this.stockError = '';

    try {
        await refreshApex(this.wiredStockResult);
    } catch (error) {
        console.error('Error refreshing stock:', error);

        this.stockError =
            error.body?.message ||
            'Unable to refresh stock products.';

        this.isLoadingStock = false;
    }
}


    // ----------------------------------------
    // Quick Order: product selection and modal
    // ----------------------------------------
    handleSelectStockProduct(event) {
        const productId = event.currentTarget.dataset.id;

        const product = this.stockProducts.find(
            (item) => item.Id === productId
        );

        if (!product) {
            this.showToast(
                'Product unavailable',
                'Unable to load the selected product.',
                'error'
            );
            return;
        }

        if (!product.batches || product.batches.length === 0) {
            this.showToast(
                'No available stock',
                'There are currently no available batches for this product.',
                'info'
            );
            return;
        }

        this.selectedProduct = product;
        this.selectedBatchId = product.batches[0].Id;
        this.requestedTubes = 1;
        this.stockModalOpen = true;
    }

    get selectedBatch() {
        if (!this.selectedProduct || !this.selectedBatchId) {
            return null;
        }

        return this.selectedProduct.batches.find(
            (batch) => batch.Id === this.selectedBatchId
        );
    }

    get batchOptions() {
        if (!this.selectedProduct) {
            return [];
        }

        return this.selectedProduct.batches.map((batch) => ({
            label: `${batch.batchLabel} | Titer: ${batch.displayTiter} | Tubes: ${batch.displayTubes}`,
            value: batch.Id
        }));
    }

    get selectedProductTitle() {
        return this.selectedProduct?.Name || '';
    }

    get selectedProductConstruct() {
        return this.selectedProduct?.constructName || 'Not specified';
    }

    get selectedProductCapsid() {
        return this.selectedProduct?.capsidName || 'Not specified';
    }

    get selectedProductType() {
        return this.selectedProduct?.Virus_Type__c || 'Not specified';
    }

    get selectedProductEndUse() {
        return this.selectedProduct?.End_Use__c || 'Not specified';
    }

    get selectedBatchTiter() {
        return this.selectedBatch?.displayTiter || 'Not specified';
    }

    get selectedBatchVolume() {
        return this.selectedBatch?.displayVolume || 'Not specified';
    }

    get selectedBatchTubesRemaining() {
        return Number(this.selectedBatch?.Tubes_Remaining_num_val__c || 0);
    }

    get maxRequestedTubes() {
        return this.selectedBatchTubesRemaining || 1;
    }

    get isAddToCartDisabled() {
        return (
            this.isAddingToCart ||
            !this.selectedBatchId ||
            !Number.isInteger(Number(this.requestedTubes)) ||
            Number(this.requestedTubes) < 1 ||
            Number(this.requestedTubes) > this.maxRequestedTubes
        );
    }

    handleBatchChange(event) {
        this.selectedBatchId = event.detail.value;
        this.requestedTubes = 1;
    }

    handleTubeQuantityChange(event) {
        this.requestedTubes = Number(event.detail.value);
    }

    closeStockModal() {
        if (this.isAddingToCart) {
            return;
        }

        this.stockModalOpen = false;
        this.selectedProduct = null;
        this.selectedBatchId = '';
        this.requestedTubes = 1;
    }

    // ----------------------------------------
    // Add selected stock to cart
    // ----------------------------------------
    async handleAddStockToCart() {
        if (this.isAddToCartDisabled) {
            return;
        }

        this.isAddingToCart = true;

        try {
            const draftOrderId = await addStockToCart({
                stockBatchId: this.selectedBatchId,
                tubesRequested: Number(this.requestedTubes)
            });

            this.showToast(
                'Added to cart',
                `${this.selectedProductTitle} was added to your cart.`,
                'success'
            );

            this.stockModalOpen = false;
            this.selectedProduct = null;
            this.selectedBatchId = '';
            this.requestedTubes = 1;

            console.log('Created draft virus order:', draftOrderId);

            // Refresh the stock inventory after the successful cart addition.
            await refreshApex(this.wiredStockResult);

        } catch (error) {
            console.error('Error adding stock to cart:', error);

            this.showToast(
                'Unable to add to cart',
                this.getErrorMessage(error),
                'error'
            );
        } finally {
            this.isAddingToCart = false;
        }
    }

    // ----------------------------------------
    // Navigation
    // ----------------------------------------
    navigateTo(path) {
        if (path) {
            window.location.assign(path);
        }
    }

    showInfo(message) {
        this.showToast('NeuroTools Portal', message, 'info');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    getErrorMessage(error) {
        return (
            error?.body?.message ||
            error?.message ||
            'An unexpected error occurred. Please try again.'
        );
    }

    // ----------------------------------------
    // Downloads and dashboard actions
    // ----------------------------------------
    handleBulkOrderTemplate() {
        const downloadLink = document.createElement('a');
        downloadLink.href = BulkOrderDownloadTemplate;
        downloadLink.download = 'Bulk_Order_Template.xlsx';
        downloadLink.click();
    }

    handleCreateOrder() {
        this.navigateTo(this.routes.createOrder);
    }

    handleGetQuote() {
        this.navigateTo(this.routes.quoteRequest);
    }

    handleGetHelp() {
        this.navigateTo(this.routes.createCase);
    }

    handleViewAllOrders() {
        this.navigateTo(this.routes.allOrders);
    }

    // ----------------------------------------
    // Billing modal
    // ----------------------------------------
    openBillingModal() {
        if (!this.labType) {
            this.showInfo(
                'Your lab type is still loading or could not be retrieved. Please try again shortly or contact NeuroTools support.'
            );
            return;
        }

        const creditCardOption = {
            id: 'creditCard',
            label: 'Credit Card',
            description: 'Manage your credit card billing method.',
            icon: 'utility:credit_card',
            url: this.routes.creditCard
        };

        const chartfieldOption = {
            id: 'chartfield',
            label: 'Chartfield',
            description: 'Manage your internal Chartfield strings.',
            icon: 'utility:company',
            url: this.routes.chartfield
        };

        const purchaseOrderOption = {
            id: 'purchaseOrder',
            label: 'Purchase Order',
            description: 'Manage your purchase orders.',
            icon: 'utility:form',
            url: this.routes.purchaseOrder
        };

        if (this.isInternalLab) {
            this.billingOptions = [
                creditCardOption,
                chartfieldOption
            ];
        } else if (
            this.labType === 'External Subsidized' ||
            this.labType === 'External Non-Subsidized'
        ) {
            this.billingOptions = [
                creditCardOption,
                purchaseOrderOption
            ];
        } else {
            this.showInfo(
                'Your lab type is not recognized. Please contact NeuroTools support.'
            );
            return;
        }

        this.billingModalOpen = true;
    }

    closeBillingModal() {
        this.billingModalOpen = false;
    }

    handleBillingOption(event) {
        const selectedId = event.currentTarget.dataset.id;

        const selectedOption = this.billingOptions.find(
            (option) => option.id === selectedId
        );

        if (selectedOption) {
            this.navigateTo(selectedOption.url);
        }
    }

    handleBilling() {
        this.openBillingModal();
    }

    // ----------------------------------------
    // Resource actions
    // ----------------------------------------
    handleOrderingGuide() {
        this.navigateTo(this.routes.orderingGuide);
    }

    handleShippingInfo() {
        this.navigateTo(this.routes.shippingInfo);
    }

    handleFAQs() {
        this.navigateTo(this.routes.faqs);
    }

    handleProducts() {
        this.navigateTo(this.routes.products);
    }

    handlePublications() {
        this.navigateTo(this.routes.publications);
    }

    handleContactEmail() {
        window.location.href = 'mailto:neurotools@unc.edu';
    }
}
