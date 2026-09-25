import { LightningElement, track, wire } from 'lwc';
import getCartItemCount from '@salesforce/apex/CartController.getCartItemCount';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

export default class CartIcon extends NavigationMixin(LightningElement) {
    @track cartCount = 0;
    wiredCartResult;

    @wire(getCartItemCount)
    wiredCartCount(result) {
        this.wiredCartResult = result;
        const { data, error } = result;
        if (data !== undefined) {
            this.cartCount = data;
        } else if (error) {
            console.error('Error fetching cart count:', error);
            this.cartCount = 0;
        }
    }

    connectedCallback() {
        // Poll every 5 seconds to refresh the cart count
        this.interval = setInterval(() => {
            if (this.wiredCartResult) {
                refreshApex(this.wiredCartResult);
            }
        }, 5000); // 5000 ms = 5 seconds
    }

    disconnectedCallback() {
        // Clear interval when component is removed from DOM
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    handleCartClick() {
        window.open(
            'https://unc-neurotools.my.site.com/partners/s/cart/Cart__c/Default?Cart__c-filterId=All', 
            '_self'
        );
    }
}