import { LightningElement, api, wire, track } from 'lwc';
import getVirusOrdersByProduct from '@salesforce/apex/ProductVirusOrdersController.getVirusOrdersByProduct';

export default class ProductVirusOrders extends LightningElement {
    @api recordId;

    @track virusOrders;
    @track error;

    @wire(getVirusOrdersByProduct, { productId: '$recordId' })
    wiredVirusOrders({ error, data }) {
        if (data) {
            this.virusOrders = data.map(order => ({
                id: order.id,
                name: order.name,
                stage: order.stage,
                closeDate: order.closeDate,
                recordUrl: `/lightning/r/Opportunity/${order.id}/view`,

                stockBatchLinks: order.productionDetails && order.productionDetails.length
    ? order.productionDetails
        .filter(detail => detail.stockBatch) // make sure lookup exists
        .map(detail => ({
            id: detail.stockBatch,
            url: `/lightning/r/Stock_Batch__c/${detail.stockBatch}/view`,
            label: detail.stockBatchName || 'View Batch'
        }))
    : []

            }));

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.virusOrders = undefined;
            console.error(error);
        }
    }
}
