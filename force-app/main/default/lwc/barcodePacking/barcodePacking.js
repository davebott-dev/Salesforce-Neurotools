import { LightningElement } from 'lwc';

import processBarcode
    from '@salesforce/apex/BarcodePackingController.processBarcode';


export default class BarcodePacking extends LightningElement {

    barcode = '';

    isProcessing = false;

    lastScan = null;

    scanHistory = [];

    successfulScans = 0;
    duplicateScans = 0;
    failedScans = 0;

    scanInProgress = false;


    connectedCallback() {

        setTimeout(() => {
            this.focusScanner();
        }, 500);

    }


    renderedCallback() {

        if (!this.isProcessing) {

            setTimeout(() => {
                this.focusScanner();
            }, 50);

        }

    }


    handleBarcodeChange(event) {

        this.barcode = event.target.value;

    }


    handleKeyDown(event) {

        if (event.key === 'Enter') {

            event.preventDefault();

            if (!this.scanInProgress) {
                this.processScan();
            }

        }

    }


    async processScan() {

        const scannedBarcode =
            (this.barcode || '').trim();


        if (!scannedBarcode || this.scanInProgress) {
            return;
        }


        this.scanInProgress = true;
        this.isProcessing = true;


        try {

            /*
             * Send the scanned Production Detail
             * identifier to Apex.
             */
            const apexResult =
                await processBarcode({
                    scannedIdentifier: scannedBarcode
                });


            /*
             * Convert the Apex ScanResult into the
             * structure used by the LWC.
             *
             * Apex calls this field productionDetailName.
             * The existing LWC uses productionLotName.
             */
            const scanResult = {

                success:
                    apexResult.success,

                alreadyChecked:
                    apexResult.alreadyChecked,

                message:
                    apexResult.message,

                shipmentName:
                    apexResult.shipmentName,

                virusOrderName:
                    apexResult.virusOrderName,

                productionLotName:
                    apexResult.productionDetailName,

                checkedDate:
                    apexResult.checkedDate,

                checkedByName:
                    apexResult.checkedByName

            };


            /*
             * Successful first-time scan.
             */
            if (scanResult.success) {

                this.successfulScans++;

                this.addToHistory(
                    scanResult,
                    'success'
                );

            }


            /*
             * Tube has already been checked.
             */
            else if (scanResult.alreadyChecked) {

                this.duplicateScans++;

                this.addToHistory(
                    scanResult,
                    'duplicate'
                );

            }


            /*
             * Any other error.
             */
            else {

                this.failedScans++;

                this.addToHistory(
                    scanResult,
                    'error'
                );

            }


            /*
             * Display the most recent scan.
             */
            this.lastScan = scanResult;


        } catch (error) {

            /*
             * Handle unexpected Apex errors.
             */
            console.error(
                'Barcode scan error:',
                error
            );


            const errorMessage =
                this.getErrorMessage(error);


            const errorResult = {

                success: false,

                alreadyChecked: false,

                message: errorMessage,

                shipmentName: null,

                virusOrderName: null,

                productionLotName:
                    scannedBarcode,

                checkedDate: null,

                checkedByName: null

            };


            this.failedScans++;

            this.lastScan = errorResult;


            this.addToHistory(
                errorResult,
                'error'
            );


        } finally {

            /*
             * Clear the scanner input and prepare
             * for the next barcode.
             */
            this.barcode = '';

            this.isProcessing = false;

            this.scanInProgress = false;


            setTimeout(() => {
                this.focusScanner();
            }, 100);

        }

    }


    addToHistory(result, status) {

        const historyItem = {

            id:
                `${Date.now()}-${Math.random()}`,

            productionLotName:
                result.productionLotName ||
                'Unknown Tube',

            shipmentName:
                result.shipmentName ||
                'Unknown Shipment',

            virusOrderName:
                result.virusOrderName ||
                'Unknown Order',

            time:
                new Date().toLocaleTimeString([], {

                    hour: 'numeric',

                    minute: '2-digit',

                    second: '2-digit'

                }),

            icon:
                this.getHistoryIcon(status)

        };


        this.scanHistory = [

            historyItem,

            ...this.scanHistory

        ].slice(0, 10);

    }


    getHistoryIcon(status) {

        switch (status) {

            case 'success':
                return 'utility:success';

            case 'duplicate':
                return 'utility:warning';

            default:
                return 'utility:error';

        }

    }


    focusScanner() {

        const input =
            this.template.querySelector(
                '.scanner-input'
            );


        if (input) {
            input.focus();
        }

    }


    getErrorMessage(error) {

        /*
         * Standard Apex/LWC error.
         */
        if (error?.body?.message) {
            return error.body.message;
        }


        /*
         * Multiple Apex errors.
         */
        if (
            Array.isArray(error?.body)
            && error.body.length > 0
        ) {

            return error.body
                .map(item => item.message)
                .join(', ');

        }


        /*
         * Generic JavaScript error.
         */
        if (error?.message) {
            return error.message;
        }


        return 'An unexpected error occurred while checking the tube.';

    }


    get lastScanClass() {

        if (!this.lastScan) {
            return '';
        }


        if (this.lastScan.alreadyChecked) {
            return 'scan-result duplicate';
        }


        if (this.lastScan.success) {
            return 'scan-result success';
        }


        return 'scan-result error';

    }


    get lastScanIcon() {

        if (this.lastScan?.alreadyChecked) {
            return 'utility:warning';
        }


        if (this.lastScan?.success) {
            return 'utility:success';
        }


        return 'utility:error';

    }


    get lastScanTitle() {

        if (this.lastScan?.alreadyChecked) {
            return 'Already Checked';
        }


        if (this.lastScan?.success) {
            return 'Tube Checked';
        }


        return 'Scan Error';

    }


    get hasScanHistory() {

        return this.scanHistory.length > 0;

    }

}