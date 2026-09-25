import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import getMyProjects from '@salesforce/apex/ProjectDashboardController.getMyProjects';
import createProject from '@salesforce/apex/ProjectDashboardController.createProject';
import updateProjectStatus from '@salesforce/apex/ProjectDashboardController.updateProjectStatus';
import getLabOrganizations from '@salesforce/apex/LabController.getLabOrganizations';

export default class ProjectDashboard extends NavigationMixin(LightningElement) {

    showProjectModal = false;

    projectName = '';
    budget = null;

    labOptions = [];
    selectedLabs = [];

    projects = [];
    filteredProjects = [];

    selectedTab = 'All';

    wiredProjectsResult;

    isLoading = false;

    // ==========================
    // WIRES
    // ==========================
    @wire(getMyProjects)
    wiredProjects(result) {

        this.wiredProjectsResult = result;

        if (result.data) {

            this.projects = result.data || [];
            this.applyFilter();

        } else if (result.error) {
            console.error(result.error);
        }
    }

    @wire(getLabOrganizations)
    wiredLabs({ data, error }) {

        if (data) {
            this.labOptions = data;
        } else if (error) {
            console.error(error);
        }
    }

    // ==========================
    // CREATE PROJECT
    // ==========================
    async handleCreateProjectSubmit() {

        this.isLoading = true;

        try {

            await createProject({
                projectName: this.projectName,
                budget: this.budget,
                labIds: this.selectedLabs
            });

            this.showProjectModal = false;

            this.projectName = '';
            this.budget = null;
            this.selectedLabs = [];

            await refreshApex(this.wiredProjectsResult);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Project created successfully',
                    variant: 'success'
                })
            );

        } catch (error) {

            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating project',
                    message: error.body?.message || error.message,
                    variant: 'error'
                })
            );

        } finally {
            this.isLoading = false;
        }
    }

    // ==========================
    // APPROVE PROJECT
    // ==========================
    async handleApprove(event) {

        event.stopPropagation();

        const projectId = event.currentTarget.dataset.id;

        if (!projectId) {
            console.error('Missing projectId in Approve handler');
            return;
        }

        try {

            await updateProjectStatus({
                projectId: projectId,
                status: 'Approved'
            });

            await refreshApex(this.wiredProjectsResult);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Project Approved',
                    message: 'Invitation accepted',
                    variant: 'success'
                })
            );

        } catch (error) {

            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || error.message,
                    variant: 'error'
                })
            );
        }
    }

    // ==========================
    // DENY PROJECT
    // ==========================
    async handleDeny(event) {

        event.stopPropagation();

        const projectId = event.currentTarget.dataset.id;

        if (!projectId) {
            console.error('Missing projectId in Deny handler');
            return;
        }

        try {

            await updateProjectStatus({
                projectId: projectId,
                status: 'Rejected'
            });

            await refreshApex(this.wiredProjectsResult);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Project Denied',
                    message: 'Invitation rejected',
                    variant: 'warning'
                })
            );

    } catch (error) {

    console.error('FULL ERROR:', JSON.stringify(error, null, 2));

    const msg =
        error?.body?.pageErrors?.[0]?.message ||
        error?.body?.message ||
        error.message;

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Approve Failed',
            message: msg,
            variant: 'error'
        })
    );
}
    }

    // ==========================
    // MODAL
    // ==========================
    handleCreateProject() {
        this.showProjectModal = true;
    }

    closeProjectModal() {
        this.showProjectModal = false;
    }

    handleProjectName(event) {
        this.projectName = event.target.value;
    }

    handleBudget(event) {
        this.budget = event.target.value;
    }

    handleLabChange(event) {
        this.selectedLabs = event.detail.value;
    }

    // ==========================
    // NAVIGATION
    // ==========================
handleCardClick(event) {

    const projectId = event.currentTarget.dataset.id;

    const project = this.filteredProjects.find(
        p => p.projectId === projectId
    );

    if (!project) return;

    // BLOCK ONLY PENDING
    if (this.normalizeStatus(project.status) === 'Pending') {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Pending Approval',
                message: 'You must approve this project before viewing details.',
                variant: 'warning'
            })
        );

        return;
    }

    // ALLOW APPROVED NAVIGATION
    this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: projectId,
            objectApiName: 'Project__c',
            actionName: 'view'
        }
    });
}

    // ==========================
    // FILTERING
    // ==========================
    normalizeStatus(status) {

        if (!status) return '';

        const s = status.toLowerCase().trim();

        if (s === 'approved') return 'Approved';
        if (s === 'pending') return 'Pending';
        if (s === 'rejected') return 'Rejected';

        return '';
    }

applyFilter() {

    const base = this.projects || [];

    // ALL TAB (approved only view)
    if (this.selectedTab === 'All') {

        this.filteredProjects = base
            .filter(p => this.normalizeStatus(p.status) === 'Approved')
            .map(p => ({
                ...p,
                isClickable: true,
                showActions: false
            }));

        return;
    }

    // PENDING TAB
    if (this.selectedTab === 'Pending') {

        this.filteredProjects = base
            .filter(p =>
                this.normalizeStatus(p.status) === 'Pending'
            )
            .map(p => ({
                ...p,
                isClickable: this.normalizeStatus(p.status) === 'Approved',
                showActions: this.normalizeStatus(p.status) === 'Pending'
            }));

        return;
    }
}

    showAll() {
        this.selectedTab = 'All';
        this.applyFilter();
    }

    showPending() {
        this.selectedTab = 'Pending';
        this.applyFilter();
    }

    get allCount() {
        return (this.projects || []).filter(
            p => this.normalizeStatus(p.status) === 'Approved'
        ).length;
    }

    get pendingCount() {
        return (this.projects || []).filter(
            p => this.normalizeStatus(p.status) === 'Pending'
        ).length;
    }

    get hasProjects() {
        return (this.filteredProjects || []).length > 0;
    }

    get allTabClass() {
        return this.selectedTab === 'All' ? 'tab active' : 'tab';
    }

    get pendingTabClass() {
        return this.selectedTab === 'Pending' ? 'tab active' : 'tab';
    }
}