import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class OrderReviewScreen extends LightningElement {

    // ============================================================
    // PRODUCT INFORMATION
    // ============================================================

    @api productNames = [];
    @api productDescriptions = [];
    @api productPrices = [];


    // ============================================================
    // ORDER INFORMATION
    // ============================================================

    @api capsidEnvelope = '';
    @api virusType = '';
    @api endVolume = '';
    @api quantity = '';
    @api baselinePassingTiter = '';


    // ============================================================
    // CONSTRUCT NAME
    // Flow supplies this value.
    // ============================================================

    _constructName = '';

    @api
    get constructName() {
        return this._constructName;
    }

    set constructName(value) {
        this._constructName = value || '';
    }


    // ============================================================
    // DNA
    // ============================================================

    @api sendingDNA = false;


    // ============================================================
    // DEFAULT SHIPPING ADDRESS
    // These values come FROM FLOW
    // ============================================================

    _defaultShippingOrganization = '';
    _defaultShippingStreet = '';
    _defaultShippingCity = '';
    _defaultShippingState = '';
    _defaultShippingPostalCode = '';
    _defaultShippingCountry = '';

    @api
    get defaultShippingOrganization() {
        return this._defaultShippingOrganization;
    }

    set defaultShippingOrganization(value) {
        this._defaultShippingOrganization = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingOrganization =
                this._defaultShippingOrganization;
        }
    }


    @api
    get defaultShippingStreet() {
        return this._defaultShippingStreet;
    }

    set defaultShippingStreet(value) {
        this._defaultShippingStreet = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingStreet =
                this._defaultShippingStreet;
        }
    }


    @api
    get defaultShippingCity() {
        return this._defaultShippingCity;
    }

    set defaultShippingCity(value) {
        this._defaultShippingCity = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingCity =
                this._defaultShippingCity;
        }
    }


    @api
    get defaultShippingState() {
        return this._defaultShippingState;
    }

    set defaultShippingState(value) {
        this._defaultShippingState = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingState =
                this._defaultShippingState;
        }
    }


    @api
    get defaultShippingPostalCode() {
        return this._defaultShippingPostalCode;
    }

    set defaultShippingPostalCode(value) {
        this._defaultShippingPostalCode = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingPostalCode =
                this._defaultShippingPostalCode;
        }
    }


    @api
    get defaultShippingCountry() {
        return this._defaultShippingCountry;
    }

    set defaultShippingCountry(value) {
        this._defaultShippingCountry = value || '';

        if (!this.useDifferentShippingAddress) {
            this.shippingCountry =
                this._defaultShippingCountry;
        }
    }


    // ============================================================
    // OUTPUT SHIPPING ADDRESS
    // ============================================================

    @api shippingOrganization = '';
    @api shippingStreet = '';
    @api shippingCity = '';
    @api shippingState = '';
    @api shippingPostalCode = '';
    @api shippingCountry = '';
    @api shippingAddressChanged = false;


    // ============================================================
    // UI STATE
    // ============================================================

    useDifferentShippingAddress = false;


    // ============================================================
    // PRODUCT DISPLAY
    // ============================================================

    get displayProducts() {

        const names =
            Array.isArray(this.productNames)
                ? this.productNames
                : [];

        const descriptions =
            Array.isArray(this.productDescriptions)
                ? this.productDescriptions
                : [];

        const prices =
            Array.isArray(this.productPrices)
                ? this.productPrices
                : [];

        return names.map((name, index) => {

            const price =
                Number(prices[index]) || 0;

            return {
                id: `product-${index}`,
                name: name || 'Product',
                description: descriptions[index] || '',
                price: price,
                formattedPrice: this.formatPrice(price)
            };

        });

    }


    get hasProducts() {

        return (
            Array.isArray(this.productNames) &&
            this.productNames.length > 0
        );

    }


    get calculatedTotalPrice() {

        const prices =
            Array.isArray(this.productPrices)
                ? this.productPrices
                : [];

        return prices.reduce(
            (total, price) => {
                return total + (Number(price) || 0);
            },
            0
        );

    }


    get formattedTotal() {

        return this.formatPrice(
            this.calculatedTotalPrice
        );

    }


    // ============================================================
    // FORMAT CURRENCY
    // ============================================================

    formatPrice(value) {

        const numericValue =
            Number(value) || 0;

        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: 'USD'
            }
        ).format(numericValue);

    }


    // ============================================================
    // LIFECYCLE
    // ============================================================

    connectedCallback() {

        /*
         * Flow supplies the @api values before the component
         * renders. The setters above keep shipping values
         * synchronized with Flow.
         *
         * We only need to make sure the initial shipping
         * state is populated if Flow did not trigger the
         * setters first.
         */

        this.syncInitialShippingAddress();

    }


    // ============================================================
    // INITIAL SHIPPING SYNCHRONIZATION
    // ============================================================

    syncInitialShippingAddress() {

        if (this.useDifferentShippingAddress) {
            return;
        }

        this.shippingOrganization =
            this._defaultShippingOrganization || '';

        this.shippingStreet =
            this._defaultShippingStreet || '';

        this.shippingCity =
            this._defaultShippingCity || '';

        this.shippingState =
            this._defaultShippingState || '';

        this.shippingPostalCode =
            this._defaultShippingPostalCode || '';

        this.shippingCountry =
            this._defaultShippingCountry || '';

    }


    // ============================================================
    // DNA INSTRUCTIONS
    // ============================================================

    get showDnaInstructions() {

        return (
            this.sendingDNA === true ||
            this.sendingDNA === 'true' ||
            this.sendingDNA === 'Yes'
        );

    }


    get sendingDNADisplay() {

        return this.showDnaInstructions
            ? 'Yes'
            : 'No';

    }


    // ============================================================
    // BASELINE PASSING TITER
    // Flow is responsible for calculating this.
    // ============================================================

    get showBaselineTiter() {

        return !!this.baselinePassingTiter;

    }


    get baselineTiterDisplay() {

        return this.baselinePassingTiter || '';

    }


    // ============================================================
    // DEFAULT SHIPPING ADDRESS DISPLAY
    // ============================================================

    get defaultShippingAddressDisplay() {

        const lines = [];


        if (this.defaultShippingOrganization) {

            lines.push(
                this.defaultShippingOrganization
            );

        }


        if (this.defaultShippingStreet) {

            lines.push(
                this.defaultShippingStreet
            );

        }


        let cityStateZip = '';


        if (this.defaultShippingCity) {

            cityStateZip +=
                this.defaultShippingCity;

        }


        if (this.defaultShippingState) {

            cityStateZip +=
                cityStateZip
                    ? `, ${this.defaultShippingState}`
                    : this.defaultShippingState;

        }


        if (this.defaultShippingPostalCode) {

            cityStateZip +=
                cityStateZip
                    ? ` ${this.defaultShippingPostalCode}`
                    : this.defaultShippingPostalCode;

        }


        if (cityStateZip) {

            lines.push(
                cityStateZip
            );

        }


        if (this.defaultShippingCountry) {

            lines.push(
                this.defaultShippingCountry
            );

        }


        return lines;

    }


    // ============================================================
    // DIFFERENT SHIPPING ADDRESS
    // ============================================================

    get showDifferentShippingAddress() {

        return this.useDifferentShippingAddress;

    }


    handleDifferentAddressChange(event) {

        this.useDifferentShippingAddress =
            event.target.checked;


        this.shippingAddressChanged =
            this.useDifferentShippingAddress;


        if (!this.useDifferentShippingAddress) {

            /*
             * User unchecked "Ship to a different address".
             *
             * Restore the CURRENT values supplied by Flow.
             */

            this.shippingOrganization =
                this._defaultShippingOrganization || '';

            this.shippingStreet =
                this._defaultShippingStreet || '';

            this.shippingCity =
                this._defaultShippingCity || '';

            this.shippingState =
                this._defaultShippingState || '';

            this.shippingPostalCode =
                this._defaultShippingPostalCode || '';

            this.shippingCountry =
                this._defaultShippingCountry || '';

        }


        this.dispatchShippingValues();

    }


    // ============================================================
    // SHIPPING INPUT CHANGES
    // ============================================================

    handleShippingChange(event) {

        const field =
            event.target.dataset.field;

        const value =
            event.target.value || '';


        switch (field) {

            case 'organization':

                this.shippingOrganization =
                    value;

                break;


            case 'street':

                this.shippingStreet =
                    value;

                break;


            case 'city':

                this.shippingCity =
                    value;

                break;


            case 'state':

                this.shippingState =
                    value;

                break;


            case 'postalCode':

                this.shippingPostalCode =
                    value;

                break;


            case 'country':

                this.shippingCountry =
                    value;

                break;


            default:

                break;

        }


        /*
         * Once the user edits an address, this is considered
         * a different shipping address.
         */

        this.shippingAddressChanged = true;


        this.dispatchShippingValues();

    }


    // ============================================================
    // SEND SHIPPING VALUES TO FLOW
    // ============================================================

    dispatchShippingValues() {

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingOrganization',
                this.shippingOrganization
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingStreet',
                this.shippingStreet
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingCity',
                this.shippingCity
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingState',
                this.shippingState
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingPostalCode',
                this.shippingPostalCode
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingCountry',
                this.shippingCountry
            )
        );


        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'shippingAddressChanged',
                this.shippingAddressChanged
            )
        );

    }


    // ============================================================
    // FLOW VALIDATION
    // ============================================================

    @api
    validate() {

        if (this.useDifferentShippingAddress) {

            const inputs =
                this.template.querySelectorAll(
                    'lightning-input'
                );


            let isValid = true;


            inputs.forEach(input => {

                if (
                    input.required &&
                    !input.checkValidity()
                ) {

                    input.reportValidity();

                    isValid = false;

                }

            });


            if (!isValid) {

                return {
                    isValid: false,
                    errorMessage:
                        'Please complete the shipping address.'
                };

            }

        }


        return {
            isValid: true,
            errorMessage: ''
        };

    }

}
