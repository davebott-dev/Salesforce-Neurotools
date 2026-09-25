// backToCartButton.js
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class BackToCartButton extends NavigationMixin(LightningElement) {
    handleBackToCart() {
              window.location.href = '/s/cart/Cart__c/Default?Cart__c-filterId=All';
    }
}
