import { LightningElement, track } from 'lwc';
import getOrdersNeedingAttention from '@salesforce/apex/VirusOrderUtilityController.getOrdersNeedingAttention';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class VirusOrderUtility extends NavigationMixin(LightningElement) {
  @track orders = [];
  @track selectedType = 'All';

  typeOptions = [
    { label: 'All', value: 'All' },
    { label: 'AAV', value: 'AAV' },
    { label: 'HSV', value: 'HSV' },
    { label: 'Rabies', value: 'Rabies' },
    { label: 'Lenti', value: 'Lenti' }
  ];

  columns = [
    {
      label: 'Order Name',
      fieldName: 'Name',
      type: 'button',
      typeAttributes: {
        label: { fieldName: 'Name' },
        name: 'view_order',
        variant: 'base',
        class: 'slds-text-link'
      }
    },
    { label: 'Stage', fieldName: 'StageName', type: 'text' },
    { label: 'Estimated Ship Date', fieldName: 'CloseDate', type: 'text' },
    { label: 'Type', fieldName: 'Type', type: 'text' }
  ];

  connectedCallback() {
    this.loadOrders();
  }

  loadOrders() {
    getOrdersNeedingAttention()
      .then(result => {
        this.orders = result;
        setTimeout(()=> this.showToast(), 500);
      })
      .catch(() => {
        this.orders = [];
      });
  }

  showToast() {
  const count = this.filteredOrders.length;
  if (count > 0) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Review Needed',
        message: `${count} virus order${count === 1 ? '' : 's'} need your attention.`,
        variant: 'error',
        mode: 'sticky'
      })
    );
  }
}


  get filteredOrders() {
    if (this.selectedType === 'All') {
      return this.orders;
    }
    return this.orders.filter((o) => o.Type === this.selectedType);
  }

  handleTypeChange(event) {
    this.selectedType = event.detail.value;
  }

  // Banner logic
  get showBanner() {
    return this.filteredOrders.length > 0;
  }
  get bannerMessage() {
    const count = this.filteredOrders.length;
    return `${count} order${count === 1 ? '' : 's'} need review`;
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    if (actionName === 'view_order') {
      this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
          recordId: row.Id,
          objectApiName: 'Opportunity', 
          actionName: 'view'
        }
      });
    }
  }
}