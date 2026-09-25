import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class FlowFileUpload extends LightningElement {

    // ==========================================
    // INPUTS FROM FLOW
    // ==========================================

    @api fileUploadLabel = 'Upload Files';

    @api acceptedFormats = [];

    @api allowMultipleFiles;

    @api disabled;

    @api hoverText;

    @api relatedRecordId;


    // ==========================================
    // OUTPUTS TO FLOW
    // ==========================================

    @api contentDocumentIds = [];

    @api contentVersionIds = [];

    @api uploadedFileNames = [];


    // ==========================================
    // INTERNAL FILE LIST
    // ==========================================

    uploadedFiles = [];


    // ==========================================
    // UPLOAD FINISHED
    // ==========================================

    handleUploadFinished(event) {

        const files = event.detail.files;

        console.log(
            'Files uploaded:',
            JSON.stringify(files)
        );


        // ------------------------------------------
        // Add newly uploaded files to our list
        // ------------------------------------------

        const newFiles = files.map(file => ({
            name: file.name,
            documentId: file.documentId,
            contentVersionId: file.contentVersionId || null
        }));


        // ------------------------------------------
        // If multiple files are allowed,
        // preserve previously uploaded files.
        //
        // If multiple files are NOT allowed,
        // replace the previous file.
        // ------------------------------------------

        if (this.allowMultipleFiles) {

            this.uploadedFiles = [
                ...this.uploadedFiles,
                ...newFiles
            ];

        } else {

            this.uploadedFiles = [
                newFiles[0]
            ];

        }


        // ------------------------------------------
        // Content Document IDs
        // ------------------------------------------

        this.contentDocumentIds =
            this.uploadedFiles
                .map(file => file.documentId)
                .filter(id => id);


        // ------------------------------------------
        // Content Version IDs
        // ------------------------------------------

        this.contentVersionIds =
            this.uploadedFiles
                .map(file => file.contentVersionId)
                .filter(id => id);


        // ------------------------------------------
        // File Names
        // ------------------------------------------

        this.uploadedFileNames =
            this.uploadedFiles
                .map(file => file.name);


        // ------------------------------------------
        // Send Content Document IDs to Flow
        // ------------------------------------------

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'contentDocumentIds',
                this.contentDocumentIds
            )
        );


        // ------------------------------------------
        // Send Content Version IDs to Flow
        // ------------------------------------------

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'contentVersionIds',
                this.contentVersionIds
            )
        );


        // ------------------------------------------
        // Send File Names to Flow
        // ------------------------------------------

        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                'uploadedFileNames',
                this.uploadedFileNames
            )
        );


        // ------------------------------------------
        // Debugging
        // ------------------------------------------

        console.log(
            'Content Document IDs:',
            JSON.stringify(this.contentDocumentIds)
        );

        console.log(
            'Content Version IDs:',
            JSON.stringify(this.contentVersionIds)
        );

        console.log(
            'Uploaded File Names:',
            JSON.stringify(this.uploadedFileNames)
        );

    }


    // ==========================================
    // DISPLAY LOGIC
    // ==========================================

    get hasUploadedFiles() {

        return (
            this.uploadedFiles &&
            this.uploadedFiles.length > 0
        );

    }

}