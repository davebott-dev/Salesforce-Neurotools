import { LightningElement } from 'lwc';

import createPublication from '@salesforce/apex/PublicationController.createPublication';

export default class NeurotoolsPublicationForm extends LightningElement {

    /*
     * ============================================================
     * FORM VALUES
     * ============================================================
     */

    title = '';

    journal = '';

    publicationYear = '';

    doi = '';

    publicationUrl = '';

    citation = '';

    abstractText = '';


    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    isSubmitting = false;

    errorMessage = '';

    successMessage = '';


    /*
     * ============================================================
     * INPUT HANDLING
     * ============================================================
     */

    handleInputChange(event) {

        const field =
            event.target.dataset.field;

        this[field] =
            event.target.value;

        /*
         * Clear previous errors as the user edits.
         */
        this.errorMessage = '';

        this.successMessage = '';
    }


    /*
     * ============================================================
     * SUBMIT
     * ============================================================
     */

    async handleSubmit() {

        this.errorMessage = '';

        this.successMessage = '';


        /*
         * Validate the Lightning inputs first.
         */
        const inputs =
            this.template.querySelectorAll(
                'lightning-input, lightning-textarea'
            );


        let isValid = true;


        inputs.forEach(input => {

            if (!input.reportValidity()) {
                isValid = false;
            }
        });


        if (!isValid) {
            return;
        }


        /*
         * Additional title validation.
         */
        if (!this.title || !this.title.trim()) {

            this.errorMessage =
                'Publication title is required.';

            return;
        }


        this.isSubmitting = true;


        try {

            await createPublication({

                title:
                    this.title.trim(),

                citation:
                    this.citation,

                abstractText:
                    this.abstractText,

                doi:
                    this.doi,

                journal:
                    this.journal,

                publicationYear:
                    this.publicationYear,

                publicationUrl:
                    this.publicationUrl
            });


            /*
             * Publication was successfully created.
             */
            this.successMessage =
                'Publication submitted for review.';


            /*
             * Notify the parent component.
             */
            this.dispatchEvent(
                new CustomEvent(
                    'publicationcreated'
                )
            );


        } catch (error) {

            this.errorMessage =
                this.getErrorMessage(error);

        } finally {

            this.isSubmitting = false;
        }
    }


    /*
     * ============================================================
     * CANCEL
     * ============================================================
     */

    handleCancel() {

        if (this.isSubmitting) {
            return;
        }


        this.dispatchEvent(
            new CustomEvent('cancel')
        );
    }


    /*
     * ============================================================
     * ERROR HANDLING
     * ============================================================
     */

    getErrorMessage(error) {

        if (
            error &&
            error.body &&
            error.body.message
        ) {

            return error.body.message;
        }


        if (
            error &&
            error.message
        ) {

            return error.message;
        }


        return 'An unexpected error occurred while submitting the publication.';
    }
}