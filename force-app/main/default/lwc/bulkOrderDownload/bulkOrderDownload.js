import { LightningElement } from 'lwc';
import BulkOrderDownloadTemplate from '@salesforce/resourceUrl/BulkOrderTemplate';

export default class BulkOrderDownload extends LightningElement {

    handleDownload() {
        const link = document.createElement('a');
        link.href = BulkOrderDownloadTemplate;
        link.download = 'Neurotools_Bulk_Order_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

}