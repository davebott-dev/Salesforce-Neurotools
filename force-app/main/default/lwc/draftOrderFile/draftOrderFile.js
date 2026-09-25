import { LightningElement, api, track, wire } from 'lwc';
import getFilesForDraftOrder from '@salesforce/apex/DraftOrderFileController.getFilesForDraftOrder';
import deleteFile from '@salesforce/apex/DraftOrderFileController.deleteFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    {
        label: 'File Name',
        fieldName: 'fileUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'fileName' },
            target: '_blank'
        }
    },
    { label: 'File Type', fieldName: 'fileType', type: 'text' },
    {
        type: 'button',
        typeAttributes: {
            label: 'Delete',
            name: 'delete',
            title: 'Delete File',
            variant: 'destructive'
        }
    }
];

export default class DraftOrderFiles extends LightningElement {
    @api draftOrderId; // Draft order Id from Flow or parent
    @track files = [];
    @track columns = COLUMNS;
    wiredFilesResult;

    // Load files from Apex
    @wire(getFilesForDraftOrder, { draftOrderId: '$draftOrderId' })
    wiredFiles(result) {
        this.wiredFilesResult = result;
        if (result.data) {
            this.files = result.data.map(f => ({
                ...f,
                fileUrl: `/sfc/servlet.shepherd/document/download/${f.contentDocumentId}`,
                fileName: f.fileName
            }));
        } else if (result.error) {
            this.showToast('Error', result.error.body?.message || result.error.message, 'error');
        }
    }

    // Handle delete button in datatable
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'delete') {
            if (confirm(`Are you sure you want to delete "${row.fileName}"?`)) {
                deleteFile({ contentDocumentId: row.contentDocumentId, draftOrderId: this.draftOrderId })
                    .then(() => {
                        this.showToast('Success', 'File deleted successfully', 'success');
                        return refreshApex(this.wiredFilesResult);
                    })
                    .catch(error => {
                        this.showToast('Error', error.body?.message || error.message, 'error');
                    });
            }
        }
    }

    // Handle file upload via lightning-file-upload
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles.length > 0) {
            const names = uploadedFiles.map(f => f.name).join(', ');
            this.showToast('Success', `${names} uploaded successfully`, 'success');
            refreshApex(this.wiredFilesResult);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}

