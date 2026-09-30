import { LightningElement, track } from 'lwc';
import getProducts from '@salesforce/apex/QuoteBuilderController.getProducts';

export default class QuoteBuilder extends LightningElement {

    // =========================================================
    // PRODUCT DATA
    // Loaded from Apex
    // =========================================================

    @track products = [];

    @track selectedProducts = [];


    // =========================================================
    // STATE
    // =========================================================

    isLoading = false;
    errorMessage = '';


    // =========================================================
    // LIFECYCLE
    // =========================================================

    connectedCallback() {
        this.loadProducts();
    }


    // =========================================================
    // LOAD PRODUCTS
    // =========================================================

    loadProducts() {

        this.isLoading = true;
        this.errorMessage = '';

        getProducts()
            .then(result => {

                this.products = result.map(product => {

                    const displayCategory =
                        this.getDisplayCategory(
                            product.name,
                            product.category
                        );

                    return {
                        ...product,
                        category: displayCategory,
                        selected: false,
                        quantity: 1,
                        cssClass: 'product-card'
                    };
                });

                this.rebuildSummary();
            })
            .catch(error => {

                console.error(
                    'Error loading Quote Builder products:',
                    error
                );

                this.errorMessage =
                    this.getErrorMessage(error);

                this.products = [];
                this.selectedProducts = [];
            })
            .finally(() => {

                this.isLoading = false;
            });
    }


    // =========================================================
    // DISPLAY CATEGORY
    // =========================================================

    getDisplayCategory(name, apexCategory) {

        const productName =
            (name || '').toLowerCase();


        // AAV
        if (productName.includes('aav')) {
            return 'AAV';
        }


        // HSV
        if (productName.includes('hsv')) {
            return 'HSV';
        }


        // Lentivirus
        if (
            productName.includes('lenti') ||
            productName.includes('lentivirus')
        ) {
            return 'Lentivirus';
        }


        // Rabies
        if (productName.includes('rabies')) {
            return 'Rabies';
        }


        // Everything from the Add-on family
        if (apexCategory === 'Add-on') {
            return 'Additional Services';
        }


        return apexCategory || 'Other';
    }


    // =========================================================
    // CATEGORY GETTERS
    // =========================================================

    get aavProducts() {

        return this.products.filter(
            product => product.category === 'AAV'
        );
    }


    get hsvProducts() {

        return this.products.filter(
            product => product.category === 'HSV'
        );
    }


    get lentiProducts() {

        return this.products.filter(
            product => product.category === 'Lentivirus'
        );
    }


    get rabiesProducts() {

        return this.products.filter(
            product => product.category === 'Rabies'
        );
    }


    get addOnProducts() {

        return this.products.filter(
            product => product.category === 'Additional Services'
        );
    }


    // =========================================================
    // PRODUCT SELECTION
    // =========================================================

    handleProductSelect(event) {

        const productId =
            event.currentTarget.dataset.id;


        this.products = this.products.map(product => {

            if (product.id !== productId) {
                return product;
            }


            const selected =
                !product.selected;


            return {
                ...product,

                selected,

                quantity: selected
                    ? (product.quantity || 1)
                    : 1,

                cssClass: selected
                    ? 'product-card selected'
                    : 'product-card'
            };
        });


        this.rebuildSummary();
    }


    // =========================================================
    // QUANTITY
    // =========================================================

    handleQuantityChange(event) {

        const productId =
            event.target.dataset.id;


        let quantity =
            Number(event.target.value);


        if (!quantity || quantity < 1) {
            quantity = 1;
        }


        this.products = this.products.map(product => {

            if (product.id !== productId) {
                return product;
            }


            return {
                ...product,
                quantity
            };
        });


        this.rebuildSummary();
    }


    // =========================================================
    // ADD-ON SELECTION
    // =========================================================

    handleAddOnChange(event) {

        const productId =
            event.target.dataset.id;


        this.products = this.products.map(product => {

            if (product.id !== productId) {
                return product;
            }


            return {
                ...product,

                selected:
                    event.target.checked,

                quantity: 1
            };
        });


        this.rebuildSummary();
    }


    // =========================================================
    // SUMMARY
    // =========================================================

    rebuildSummary() {

        this.selectedProducts =
            this.products
                .filter(product => product.selected)
                .map(product => {

                    const totalPrice =
                        product.price
                            ? product.price *
                              product.quantity
                            : 0;


                    return {

                        id: product.id,

                        name: product.name,

                        quantity:
                            product.quantity,

                        detail:
                            `Quantity: ${product.quantity}`,

                        price:
                            totalPrice,

                        displayPrice:
                            product.price != null &&
                            product.price > 0

                                ? this.formatCurrency(
                                    totalPrice
                                )

                                : product.displayPrice
                    };
                });
    }


    // =========================================================
    // REMOVE
    // =========================================================

    handleRemove(event) {

        const productId =
            event.currentTarget.dataset.id;


        this.products = this.products.map(product => {

            if (product.id !== productId) {
                return product;
            }


            return {
                ...product,

                selected: false,

                quantity: 1,

                cssClass: 'product-card'
            };
        });


        this.rebuildSummary();
    }


    // =========================================================
    // CLEAR
    // =========================================================

    handleClear() {

        this.products = this.products.map(product => ({

            ...product,

            selected: false,

            quantity: 1,

            cssClass: 'product-card'

        }));


        this.selectedProducts = [];
    }


    // =========================================================
    // GETTERS
    // =========================================================

    get hasSelections() {

        return this.selectedProducts.length > 0;
    }


    get displayTotal() {

        const total =
            this.selectedProducts.reduce(
                (sum, product) =>
                    sum + product.price,
                0
            );


        if (total === 0) {

            return 'Available upon quote';
        }


        return this.formatCurrency(total);
    }


    get hasError() {

        return !!this.errorMessage;
    }


    get hasProducts() {

        return this.products.length > 0;
    }


    // =========================================================
    // VIEW / SAVE QUOTE
    // =========================================================

    handleViewQuote() {

        console.log(
            'Quote selections:',
            JSON.stringify(
                this.selectedProducts
            )
        );
    }


    // =========================================================
    // ERROR HANDLING
    // =========================================================

    getErrorMessage(error) {

        if (
            error &&
            error.body &&
            error.body.message
        ) {

            return error.body.message;
        }


        if (
            error &&
            error.message
        ) {

            return error.message;
        }


        return 'Unable to load products. Please try again.';
    }


    // =========================================================
    // UTILITIES
    // =========================================================

    formatCurrency(value) {

        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: 'USD'
            }
        ).format(value);
    }
}