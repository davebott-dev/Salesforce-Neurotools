import { LightningElement, wire } from 'lwc';

import getPublications from '@salesforce/apex/PublicationController.getPublications';
import getPublication from '@salesforce/apex/PublicationController.getPublication';

export default class NeurotoolsPublications extends LightningElement {

    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    publications = [];

    filteredPublications = [];

    selectedPublication = null;

    searchTerm = '';

    isLoading = true;

    isDetailsOpen = false;

    isFormOpen = false;

    errorMessage = '';


    /*
     * ============================================================
     * GET PUBLICATIONS
     * ============================================================
     */

    @wire(getPublications)
    wiredPublications({ data, error }) {

        this.isLoading = false;

        if (data) {

            this.publications = data;

            this.applyFilter();

            this.errorMessage = '';

        } else if (error) {

            this.publications = [];

            this.filteredPublications = [];

            this.errorMessage =
                this.getErrorMessage(error);
        }
    }


    /*
     * ============================================================
     * SEARCH
     * ============================================================
     */

    handleSearch(event) {

        this.searchTerm =
            event.target.value;

        this.applyFilter();
    }


    /*
     * ============================================================
     * FILTER PUBLICATIONS
     * ============================================================
     */

    applyFilter() {

        const search =
            this.searchTerm
                ? this.searchTerm
                    .trim()
                    .toLowerCase()
                : '';


        if (!search) {

            this.filteredPublications =
                [...this.publications];

            return;
        }


        this.filteredPublications =
            this.publications.filter(publication => {

                return (
                    this.contains(
                        publication.title,
                        search
                    ) ||

                    this.contains(
                        publication.journal,
                        search
                    ) ||

                    this.contains(
                        publication.citation,
                        search
                    ) ||

                    this.contains(
                        publication.doi,
                        search
                    ) ||

                    this.contains(
                        publication.publicationYear,
                        search
                    )
                );
            });
    }


    /*
     * ============================================================
     * OPEN PUBLICATION DETAILS
     * ============================================================
     */

    async handleViewPublication(event) {

        const publicationId =
            event.currentTarget.dataset.id;


        if (!publicationId) {
            return;
        }


        this.isLoading = true;

        this.errorMessage = '';


        try {

            this.selectedPublication =
                await getPublication({
                    publicationId
                });

            this.isDetailsOpen = true;

        } catch (error) {

            this.errorMessage =
                this.getErrorMessage(error);

        } finally {

            this.isLoading = false;
        }
    }


    /*
     * ============================================================
     * CLOSE DETAILS
     * ============================================================
     */

    handleCloseDetails() {

        this.isDetailsOpen = false;

        this.selectedPublication = null;
    }


    /*
     * ============================================================
     * OPEN ADD FORM
     * ============================================================
     */

    handleAddPublication() {

        this.isFormOpen = true;

        this.errorMessage = '';
    }


    /*
     * ============================================================
     * CLOSE ADD FORM
     * ============================================================
     */

    handleCloseForm() {

        this.isFormOpen = false;
    }


    /*
     * ============================================================
     * PUBLICATION CREATED
     * ============================================================
     *
     * Child form dispatches:
     *
     * publicationcreated
     */

    handlePublicationCreated() {

        this.isFormOpen = false;

        /*
         * Refreshing the wired method is something we'll add
         * when the final UI is connected to refreshApex.
         */

        this.dispatchEvent(
            new CustomEvent('publicationcreated')
        );
    }


    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    contains(value, search) {

        if (!value) {
            return false;
        }

        return String(value)
            .toLowerCase()
            .includes(search);
    }


    getErrorMessage(error) {

        if (
            error &&
            error.body &&
            error.body.message
        ) {
            return error.body.message;
        }

        return 'An unexpected error occurred.';
    }


    /*
     * ============================================================
     * TEMPLATE GETTERS
     * ============================================================
     */

    get hasPublications() {

        return this.filteredPublications.length > 0;
    }


    get noSearchResults() {

        return (
            !this.isLoading &&
            this.publications.length > 0 &&
            this.filteredPublications.length === 0
        );
    }


    get noPublications() {

        return (
            !this.isLoading &&
            this.publications.length === 0 &&
            !this.errorMessage
        );
    }
}