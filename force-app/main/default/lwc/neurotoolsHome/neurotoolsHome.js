
import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NeurotoolsHome extends LightningElement {
    // These are the relative paths you supplied.
    // If your Experience site uses the /partners base path,
    // update these to include /partners before the /s route.
    routes = {
        createOrder: '/s/createorder',
        quoteRequest: '/s/quoterequest',
        createCase: '/s/createcase',
        allOrders: '/s/orders'
    };

    navigateTo(path) {
        if (!path) {
            return;
        }

        window.location.assign(path);
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

    handleBilling() {
        this.showInfo(
            'The Billing page destination has not been configured yet.'
        );
    }

    handleFAQs() {
        this.showInfo(
            'The FAQ page destination has not been configured yet.'
        );
    }

    handleBulkOrderTemplate() {
        this.showInfo(
            'Add the uploaded Bulk Order Template static resource URL to enable this download.'
        );
    }

    handlePublications() {
        this.showInfo(
            'Add the Publications page destination when it is available.'
        );
    }

    handleQuickOrder(event) {
        const productName = event.currentTarget.dataset.product;

        this.showInfo(
            `${productName} selected. Review the product and complete the order on the order page.`
        );

        this.navigateTo(this.routes.createOrder);
    }
}