import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getLabOrganizations from '@salesforce/apex/LabController.getLabOrganizations';
import getProjectDetails from '@salesforce/apex/ProjectDetailController.getProjectDetails';

import saveProjectLabs from '@salesforce/apex/ProjectDetailController.saveProjectLabs';
import saveVirusOrdersApex from '@salesforce/apex/ProjectDetailController.saveVirusOrders';
export default class ProjectDetail extends NavigationMixin(LightningElement) {

    recordId;
    data;
    error;

    wiredProjectResult;

    loading = true;

    // =========================
    // MODAL STATE
    // =========================
    showLabModal = false;
    showVirusOrderModal = false;

    // =========================
    // LABS
    // =========================
    labOptions = [];
    selectedLabs = [];

    // =========================
    // VIRUS ORDERS
    // =========================
    selectedVirusOrders = [];

    // TABLE DATA
    availableVirusOrders = [];

    // =========================
    // SEARCH (NEW BUT SAFE ADDITION)
    // =========================
    virusSearchKey = '';

    
    // =========================
    // FLOW INPUT
    // =========================
    flowInputs = [];

    connectedCallback() {
        this.flowInputs = [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

handleFlowStatusChange(event) {
    const status = event.detail.status;

    if (status === 'FINISHED') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Your changes have been saved',
                variant: 'success'
            })
        );

        refreshApex(this.wiredProjectResult);
    }
}

    // =========================
    // RECORD ID
    // =========================
    @wire(CurrentPageReference)
    getPageRef(pageRef) {

        if (pageRef) {
            this.recordId = pageRef.attributes.recordId;
        }
    }

    // =========================
    // PROJECT DATA
    // =========================
    @wire(getProjectDetails, { projectId: '$recordId' })
    wiredProject(result) {

        this.wiredProjectResult = result;

        const { data, error } = result;

        this.loading = false;

        if (data) {

            this.data = data;
            this.error = undefined;

            this.selectedLabs =
                (data.labs || []).map(l => l.accountId);

            this.selectedVirusOrders =
                (data.virusOrders || []).map(o => o.orderId);

        } else if (error) {

            this.error = error;
            this.data = undefined;

            console.error(error);
        }
    }

    // =========================
    // LAB OPTIONS
    // =========================
    @wire(getLabOrganizations)
    wiredLabs({ data, error }) {

        if (data) {
            this.labOptions = data;
        }
    }

    // =========================
    // LAB MODAL
    // =========================
    handleAddLab() {

        this.selectedLabs =
            (this.data?.labs || []).map(l => l.accountId);

        this.showLabModal = true;
    }

    closeLabModal() {
        this.showLabModal = false;
    }

    handleLabChange(event) {
        this.selectedLabs = event.detail.value;
    }

    async handleSaveLabs() {

        await saveProjectLabs({
            projectId: this.recordId,
            selectedLabIds: this.selectedLabs
        });

        await refreshApex(this.wiredProjectResult);

        this.showLabModal = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Labs updated successfully',
                variant: 'success'
            })
        );
    }

    // =========================
    // VIRUS ORDER MODAL
    // =========================
    handleAddVirusOrder() {

        const selectedIds =
            (this.data?.virusOrders || []).map(o => o.orderId);

        this.selectedVirusOrders = [...selectedIds];

        this.availableVirusOrders =
            (this.data?.availableVirusOrders || []).map(order => ({
                ...order,
                selected: selectedIds.includes(order.orderId)
            }));

        this.showVirusOrderModal = true;
    }

    closeVirusOrderModal() {
        this.showVirusOrderModal = false;
    }

    // =========================
    // SEARCH (SAFE ADDITION)
    // =========================
    handleSearch(event) {

        this.virusSearchKey =
            (event.target.value || '').toLowerCase();

        const base =
            (this.data?.availableVirusOrders || []);

        const filtered =
            base.filter(o =>
                (o.orderName || '').toLowerCase().includes(this.virusSearchKey) ||
                (o.capsid || '').toLowerCase().includes(this.virusSearchKey) ||
                (o.construct || '').toLowerCase().includes(this.virusSearchKey)
            );

        this.availableVirusOrders =
            filtered.map(order => ({
                ...order,
                selected: this.selectedVirusOrders.includes(order.orderId)
            }));
    }

    // =========================
    // CHECKBOX SELECT
    // =========================
    handleVirusOrderSelect(event) {

        const orderId =
            event.target.dataset.id;

        const checked =
            event.target.checked;

        if (checked) {

            if (!this.selectedVirusOrders.includes(orderId)) {
                this.selectedVirusOrders = [
                    ...this.selectedVirusOrders,
                    orderId
                ];
            }

        } else {

            this.selectedVirusOrders =
                this.selectedVirusOrders.filter(id => id !== orderId);
        }

        this.availableVirusOrders =
            this.availableVirusOrders.map(order => ({
                ...order,
                selected: this.selectedVirusOrders.includes(order.orderId)
            }));
    }

    // =========================
    // SAVE VIRUS ORDERS
    // =========================
async saveVirusOrders() {

    try {

        console.log('Saving orders:', this.selectedVirusOrders);

        if (!this.selectedVirusOrders || this.selectedVirusOrders.length === 0) {
            throw new Error('No virus orders selected');
        }

        await saveVirusOrdersApex({
            projectId: this.recordId,
            orderIds: this.selectedVirusOrders
        });

        await refreshApex(this.wiredProjectResult);

        this.showVirusOrderModal = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Virus orders added to project',
                variant: 'success'
            })
        );

    } catch (error) {

    console.error('FULL ERROR OBJECT:', JSON.stringify(error, null, 2));

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Save Failed',
            message: error?.body?.message || error.message,
            variant: 'error'
        })
    );
}
}
get isSaveDisabled() {
    return !this.selectedVirusOrders.length;
}

    // =========================
    // NAVIGATION
    // =========================
    handleOpenOrder(event) {

        const orderId =
            event.currentTarget.dataset.id;

        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: orderId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }

    handleCreateNewVirusOrder() {

        window.location.href =
            'https://unc-neurotools.my.site.com/partners/s/createorder';
    }
}