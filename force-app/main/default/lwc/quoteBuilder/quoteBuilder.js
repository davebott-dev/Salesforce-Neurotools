import { LightningElement, track } from 'lwc';

export default class QuoteBuilder extends LightningElement {

    // =========================================================
    // PRODUCT DATA
    // Temporary mock data.
    // Later this will come from Apex.
    // =========================================================

    @track products = [

        // =====================================================
        // AAV
        // =====================================================

        {
            id: 'aav-standard',
            name: 'AAV Standard',
            category: 'AAV',
            description: 'Standard AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },

        {
            id: 'aav-medium',
            name: 'AAV Medium',
            category: 'AAV',
            description: 'Medium-scale AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },

        {
            id: 'aav-large',
            name: 'AAV Large',
            category: 'AAV',
            description: 'Large-scale AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },


        // =====================================================
        // HSV
        // =====================================================

        {
            id: 'hsv-standard',
            name: 'HSV Standard',
            category: 'HSV',
            description: 'Standard HSV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },


        // =====================================================
        // LENTIVIRUS
        // =====================================================

        {
            id: 'lenti-standard',
            name: 'Lentivirus',
            category: 'Lentivirus',
            description: 'Standard lentivirus preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },


        // =====================================================
        // RABIES
        // =====================================================

        {
            id: 'rabies-standard',
            name: 'Rabies Virus',
            category: 'Rabies',
            description: 'Standard rabies virus preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false,
            quantity: 1
        },


        // =====================================================
        // ADDITIONAL SERVICES
        // =====================================================

        {
            id: 'endotoxin',
            name: 'Endotoxin Testing',
            category: 'Additional Services',
            description: 'Additional endotoxin testing',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false,
            quantity: 1
        },

        {
            id: 'enriched',
            name: 'Enriched Full Prep',
            category: 'Additional Services',
            description: 'Additional purification',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false,
            quantity: 1
        },

        {
            id: 'three-cscl',
            name: '3x CsCl Purification',
            category: 'Additional Services',
            description: 'Additional CsCl purification',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false,
            quantity: 1
        }
    ];


    // =========================================================
    // STATE
    // =========================================================

    @track selectedProducts = [];


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


            return {
                ...product,
                selected: !product.selected,
                quantity: product.selected
                    ? product.quantity
                    : 1
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
                selected: event.target.checked,
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
                .map(product => ({

                    id: product.id,

                    name: product.name,

                    quantity: product.quantity,

                    detail:
                        `Quantity: ${product.quantity}`,

                    price:
                        product.price *
                        product.quantity,

                    displayPrice:
                        product.price > 0
                            ? this.formatCurrency(
                                product.price *
                                product.quantity
                            )
                            : product.displayPrice
                }));
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
                quantity: 1
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
            quantity: 1
        }));


        this.selectedProducts = [];
    }


    // =========================================================
    // PRODUCT CARD STYLING
    // =========================================================

    getProductClass(product) {

        return product.selected
            ? 'product-card selected'
            : 'product-card';
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