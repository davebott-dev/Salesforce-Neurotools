import { LightningElement, track } from 'lwc';

export default class QuoteBuilder extends LightningElement {

    // =========================================================
    // PRODUCT DATA
    // =========================================================

    @track aavProducts = [
        {
            id: 'aav-standard',
            name: 'AAV Standard',
            description: 'Standard AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        },
        {
            id: 'aav-medium',
            name: 'AAV Medium',
            description: 'Medium-scale AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        },
        {
            id: 'aav-large',
            name: 'AAV Large',
            description: 'Large-scale AAV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        }
    ];


    @track hsvProducts = [
        {
            id: 'hsv-standard',
            name: 'HSV Standard',
            description: 'Standard HSV preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        }
    ];


    @track lentiProducts = [
        {
            id: 'lenti-standard',
            name: 'Lentivirus',
            description: 'Standard lentivirus preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        }
    ];


    @track rabiesProducts = [
        {
            id: 'rabies-standard',
            name: 'Rabies Virus',
            description: 'Standard rabies virus preparation',
            price: 0,
            displayPrice: 'Pricing available upon quote',
            selected: false
        }
    ];


    @track addOnProducts = [
        {
            id: 'endotoxin',
            name: 'Endotoxin Testing',
            description: 'Additional endotoxin testing',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false
        },
        {
            id: 'enriched',
            name: 'Enriched Full Prep',
            description: 'Additional purification',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false
        },
        {
            id: 'three-cscl',
            name: '3x CsCl Purification',
            description: 'Additional CsCl purification',
            price: 0,
            displayPrice: 'Additional charge',
            selected: false
        }
    ];


    // =========================================================
    // STATE
    // =========================================================

    selectedProducts = [];

    aavQuantity = 1;



    // =========================================================
    // AAV QUANTITY
    // =========================================================

    get showAAVQuantity() {

        return this.aavProducts.some(
            product => product.selected
        );
    }


    handleAAVQuantityChange(event) {

        this.aavQuantity =
            Number(event.target.value) || 1;

        this.rebuildSummary();
    }



    // =========================================================
    // PRODUCT SELECTION
    // =========================================================

    handleProductSelect(event) {

        const productId =
            event.currentTarget.dataset.id;

        const allProducts = [
            ...this.aavProducts,
            ...this.hsvProducts,
            ...this.lentiProducts,
            ...this.rabiesProducts
        ];


        const selectedProduct =
            allProducts.find(
                product =>
                    product.id === productId
            );


        if (!selectedProduct) {
            return;
        }


        /*
         * AAV products are mutually exclusive.
         *
         * Selecting Standard, Medium, or Large
         * removes the previous AAV selection.
         */

        if (
            this.aavProducts.some(
                product =>
                    product.id === productId
            )
        ) {

            this.aavProducts =
                this.aavProducts.map(product => ({
                    ...product,
                    selected:
                        product.id === productId
                }));
        }

        else {

            selectedProduct.selected =
                !selectedProduct.selected;
        }


        this.refreshProductClasses();

        this.rebuildSummary();
    }



    // =========================================================
    // ADD-ONS
    // =========================================================

    handleAddOnChange(event) {

        const productId =
            event.target.dataset.id;

        this.addOnProducts =
            this.addOnProducts.map(product => {

                if (product.id === productId) {

                    return {
                        ...product,
                        selected:
                            event.target.checked
                    };
                }

                return product;
            });


        this.rebuildSummary();
    }



    // =========================================================
    // SUMMARY
    // =========================================================

    rebuildSummary() {

        const selected = [];


        const allProducts = [
            ...this.aavProducts,
            ...this.hsvProducts,
            ...this.lentiProducts,
            ...this.rabiesProducts,
            ...this.addOnProducts
        ];


        allProducts.forEach(product => {

            if (!product.selected) {
                return;
            }


            let quantity = 1;


            if (
                product.id.startsWith('aav-')
            ) {

                quantity =
                    this.aavQuantity;
            }


            selected.push({

                id: product.id,

                name: product.name,

                detail:
                    quantity > 1
                        ? `Quantity: ${quantity}`
                        : 'Quantity: 1',

                price:
                    product.price * quantity,

                displayPrice:
                    product.price > 0
                        ? this.formatCurrency(
                            product.price * quantity
                        )
                        : 'Pricing available upon quote'

            });

        });


        this.selectedProducts =
            selected;
    }



    // =========================================================
    // REMOVE
    // =========================================================

    handleRemove(event) {

        const productId =
            event.currentTarget.dataset.id;


        this.aavProducts =
            this.aavProducts.map(product => ({
                ...product,
                selected:
                    product.id === productId
                        ? false
                        : product.selected
            }));


        this.hsvProducts =
            this.hsvProducts.map(product => ({
                ...product,
                selected:
                    product.id === productId
                        ? false
                        : product.selected
            }));


        this.lentiProducts =
            this.lentiProducts.map(product => ({
                ...product,
                selected:
                    product.id === productId
                        ? false
                        : product.selected
            }));


        this.rabiesProducts =
            this.rabiesProducts.map(product => ({
                ...product,
                selected:
                    product.id === productId
                        ? false
                        : product.selected
            }));


        this.addOnProducts =
            this.addOnProducts.map(product => ({
                ...product,
                selected:
                    product.id === productId
                        ? false
                        : product.selected
            }));


        this.refreshProductClasses();

        this.rebuildSummary();
    }



    // =========================================================
    // CLEAR
    // =========================================================

    handleClear() {

        this.aavProducts =
            this.aavProducts.map(product => ({
                ...product,
                selected: false
            }));


        this.hsvProducts =
            this.hsvProducts.map(product => ({
                ...product,
                selected: false
            }));


        this.lentiProducts =
            this.lentiProducts.map(product => ({
                ...product,
                selected: false
            }));


        this.rabiesProducts =
            this.rabiesProducts.map(product => ({
                ...product,
                selected: false
            }));


        this.addOnProducts =
            this.addOnProducts.map(product => ({
                ...product,
                selected: false
            }));


        this.aavQuantity = 1;

        this.selectedProducts = [];

        this.refreshProductClasses();
    }



    // =========================================================
    // PRODUCT CARD STYLING
    // =========================================================

    refreshProductClasses() {

        const update =
            product => ({

                ...product,

                cardClass:
                    product.selected
                        ? 'product-card selected'
                        : 'product-card'

            });


        this.aavProducts =
            this.aavProducts.map(update);

        this.hsvProducts =
            this.hsvProducts.map(update);

        this.lentiProducts =
            this.lentiProducts.map(update);

        this.rabiesProducts =
            this.rabiesProducts.map(update);
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

        /*
         * Later we can replace this with:
         *
         * - Apex
         * - Quote__c creation
         * - PDF generation
         * - Navigation to Quote record
         * - Flow
         *
         * For now this simply logs the selections.
         */

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