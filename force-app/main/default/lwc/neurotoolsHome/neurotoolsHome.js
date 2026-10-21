import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import AAV_Bundle from '@salesforce/resourceUrl/aav_bundle';
import Rabies_Bundle from '@salesforce/resourceUrl/rabies_bundle';
import BulkOrderDownloadTemplate from '@salesforce/resourceUrl/BulkOrderTemplate';


import USER_ID from '@salesforce/user/Id';
import CONTACT_ID from '@salesforce/schema/User.ContactId';
import CONTACT_ACCOUNT_LAB_TYPE
    from '@salesforce/schema/Contact.Account.Lab_Type__c';

import getRecentClientVirusOrders
    from '@salesforce/apex/ClientOrderController.getRecentClientVirusOrders';
import getClientOrderSummary
    from '@salesforce/apex/ClientOrderController.getClientOrderSummary';

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

    bundleModalOpen = false;
selectedBundle = null;

    // ----------------------------------------
    // Retrieve the logged-in user's Contact ID
    // ----------------------------------------
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [CONTACT_ID]
    })
    wiredUser({ data, error }) {
        if (data) {
            this.contactId = data.fields.ContactId.value;

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
            this._labType = getFieldValue(
                data,
                CONTACT_ACCOUNT_LAB_TYPE
            );

            console.log('Retrieved lab type:', this._labType);
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
                getRecentClientVirusOrders({
                    contactId: this.contactId
                }),
                getClientOrderSummary({
                    contactId: this.contactId
                })
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
    // Navigation
    // ----------------------------------------
    navigateTo(path) {
        if (path) {
            window.location.assign(path);
        }
    }

    showInfo(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'NeuroTools Portal',
                message,
                variant: 'info'
            })
        );
    }

    
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

    // ----------------------------------------
    // Other dashboard actions
    // ----------------------------------------
    handleBilling() {
        this.openBillingModal();
    }

    
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


    handleQuickOrder(event) {
        const productName = event.currentTarget.dataset.product;

        this.showInfo(
            `${productName} selected. Review the product and complete the order on the order page.`
        );

        this.navigateTo(this.routes.createOrder);
    }



    // Bundle catalog
    bundleModalOpen = false;
    selectedBundle = null;

    bundles = {
        aav: {
            id: 'aav',
            title: 'AAV Research Bundle',
            description:
                'Explore AAV vector products and preparation options for your research project.',
            details: [
                {
                    id: 'products',
                    heading: 'Available AAV Preparations',
                    description:
                        'AAV products are available in Standard, Medium, and Large preparation sizes.'
                },
                {
                    id: 'testing',
                    heading: 'Additional Services',
                    description:
                        'Options include endotoxin testing, Enriched Full Prep, and 3x CsCl purification, subject to product eligibility.'
                },
                {
                    id: 'requirements',
                    heading: 'Before Ordering',
                    description:
                        'Confirm your construct, capsid, desired volume, preparation size, and any additional services.'
                }
            ]
        },
        rabies: {
            id: 'rabies',
            title: 'Rabies Helper Bundle',
            description:
                'Explore rabies virus ordering options and discuss the products needed for your research workflow.',
            details: [
                {
                    id: 'products',
                    heading: 'Product Information',
                    description:
                        'Review available rabies virus products and their specifications with the NeuroTools catalog.'
                },
                {
                    id: 'requirements',
                    heading: 'Research Requirements',
                    description:
                        'Identify the required construct, preparation, volume, and any project-specific requirements.'
                },
                {
                    id: 'confirmation',
                    heading: 'Confirm Bundle Contents',
                    description:
                        'The exact products, quantities, and included services for this bundle must be confirmed with NeuroTools.'
                }
            ]
        }
    };

    handleExploreBundle(event) {
        const bundleId = event.currentTarget.dataset.bundle;
        const bundle = this.bundles[bundleId];

        if (!bundle) {
            this.showInfo('Unable to load this bundle. Please try again.');
            return;
        }

        this.selectedBundle = bundle;
        this.bundleModalOpen = true;
    }

    closeBundleModal() {
        this.bundleModalOpen = false;
        this.selectedBundle = null;
    }

    get selectedBundleImage() {
        if (!this.selectedBundle) {
            return '';
        }

        return this.selectedBundle.id === 'aav'
            ? this.aavBundleImage
            : this.rabiesBundleImage;
    }

    get selectedBundleTitle() {
        return this.selectedBundle?.title || '';
    }

    get selectedBundleDescription() {
        return this.selectedBundle?.description || '';
    }

    get selectedBundleDetails() {
        return this.selectedBundle?.details || [];
    }

    handleOrderSelectedBundle() {
        if (!this.selectedBundle) {
            this.showInfo('Please select a bundle first.');
            return;
        }

        // Opens the existing order page. This does not prepopulate
        // the order with bundle products.
        this.navigateTo(this.routes.createOrder);
    }


// Bundle images
get aavBundleImage() {
    return AAV_Bundle;
}

get rabiesBundleImage() {
    return Rabies_Bundle;
}

get selectedBundleImage() {
    if (!this.selectedBundle) {
        return '';
    }

    return this.selectedBundle.id === 'aav'
        ? this.aavBundleImage
        : this.rabiesBundleImage;
}

get selectedBundleTitle() {
    return this.selectedBundle?.title || '';
}

get selectedBundleDescription() {
    return this.selectedBundle?.description || '';
}
}