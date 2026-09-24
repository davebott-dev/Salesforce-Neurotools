import { LightningElement } from 'lwc';

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

        const scannedBarcode = (this.barcode || '').trim();

        if (!scannedBarcode || this.scanInProgress) {
            return;
        }

        this.scanInProgress = true;
        this.isProcessing = true;


        try {

            /*
             * TEMPORARY MOCK SCAN
             *
             * Apex will replace this later.
             */

            await this.mockScan(scannedBarcode);

        } finally {

            this.barcode = '';

            this.isProcessing = false;

            this.scanInProgress = false;


            setTimeout(() => {
                this.focusScanner();
            }, 100);

        }

    }


    mockScan(scannedBarcode) {

        return new Promise((resolve) => {

            setTimeout(() => {

                const now = new Date();

                const number =
                    this.getMockNumber(scannedBarcode);


                const mockResult = {

                    success: true,

                    alreadyChecked: false,

                    message:
                        'Tube successfully checked.',

                    shipmentName:
                        this.getMockShipment(scannedBarcode),

                    virusOrderName:
                        `Virus Order ${number}`,

                    productionLotName:
                        scannedBarcode,

                    checkedDate:
                        this.formatDateTime(now),

                    checkedByName:
                        'Current User'

                };


                this.successfulScans++;

                this.lastScan = mockResult;


                this.addToHistory(
                    mockResult,
                    'success'
                );


                resolve();

            }, 350);

        });

    }


    getMockNumber(value) {

        const digits =
            (value || '').replace(/\D/g, '');

        return digits || '001';

    }


    getMockShipment(value) {

        const number =
            parseInt(
                this.getMockNumber(value),
                10
            ) || 1;


        const shipmentNumber =
            ((number - 1) % 5) + 1;


        return `SHIP-${String(shipmentNumber).padStart(4, '0')}`;

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


    formatDateTime(date) {

        return date.toLocaleString([], {

            month: 'short',

            day: 'numeric',

            year: 'numeric',

            hour: 'numeric',

            minute: '2-digit',

            second: '2-digit'

        });

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