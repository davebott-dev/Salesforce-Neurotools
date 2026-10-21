import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProductionDetails from
    '@salesforce/apex/RotorSchedulerController.getProductionDetails';

const PERIOD_OPTIONS = [
    { label: 'AM — Morning', value: 'AM' },
    { label: 'PM — Afternoon', value: 'PM' }
];

const ROTOR_OPTIONS = [
    { label: 'Ultra 1', value: 'Ultra 1' },
    { label: 'Ultra 2', value: 'Ultra 2' }
];

const ROTOR_SIZE_OPTIONS = [
    { label: 'Down / Unavailable', value: 'Down' },
    { label: '65K', value: '65K' },
    { label: '90K', value: '90K' }
];

export default class RotorScheduler extends LightningElement {
    availableOrders = [];
    sessions = [];
    assignments = [];

    isLoading = true;
    loadError = '';
    searchTerm = '';

    selectedDetailId = '';
    selectedSessionId = '';
    selectedRotor = 'Ultra 1';

    newSessionDate = '';
    newSessionPeriod = 'AM';

    _idCounter = 0;

    @wire(getProductionDetails)
    wiredProductionDetails({ data, error }) {
        this.isLoading = false;

        if (data) {
            this.loadError = '';
            this.availableOrders = data.map((detail) => {
                const order = detail.Virus_Order__r || {};

                return {
                    id: detail.Id,
                    lotLabel: detail.Name || 'Unnamed lot',
                    orderNumber: order.Order_Number__c ||
                        order.Name || '—',
                    assignedTo: order.Assigned_To__r?.Name ||
                        detail.Assigned_To__r?.Name || '',
                    transfectionDate: this.formatDate(
                        detail.Lot_Transfection_Date__c
                    ),
                    plates: detail.Plates_Used__c ?? '—',
                    construct: detail.Expression_Construct_Name__c ||
                        order.Expression_Construct_Name__c || ''
                };
            });
        } else if (error) {
            this.loadError = this.getErrorMessage(error);
            this.availableOrders = [];
            // eslint-disable-next-line no-console
            console.error('Error loading production details:', error);
        }
    }

    connectedCallback() {
        this.newSessionDate = this.getLocalDateString();
    }

    get periodOptions() {
        return PERIOD_OPTIONS;
    }

    get rotorOptions() {
        return ROTOR_OPTIONS;
    }

    get rotorSizeOptions() {
        return ROTOR_SIZE_OPTIONS;
    }

    get filteredOrders() {
        const term = (this.searchTerm || '').trim().toLowerCase();

        return this.availableOrders
            .filter((order) => {
                if (!term) {
                    return true;
                }

                return [
                    order.lotLabel,
                    order.orderNumber,
                    order.construct,
                    order.assignedTo
                ].some((value) =>
                    String(value || '').toLowerCase().includes(term)
                );
            })
            .map((order) => {
                const isSelected = order.id === this.selectedDetailId;

                return {
                    ...order,
                    isSelected,
                    cardClass: isSelected
                        ? 'lot-card lot-card-selected'
                        : 'lot-card',
                    selectButtonLabel: isSelected
                        ? 'Selected'
                        : 'Select Lot',
                    selectButtonVariant: isSelected
                        ? 'brand'
                        : 'neutral'
                };
            });
    }

    get hasFilteredOrders() {
        return this.filteredOrders.length > 0;
    }

    get availableCount() {
        return this.availableOrders.length;
    }

    get selectedLot() {
        return this.availableOrders.find(
            (order) => order.id === this.selectedDetailId
        ) || null;
    }

    get hasSelectedLot() {
        return Boolean(this.selectedLot);
    }

    get sessionOptions() {
        return this.sessions.map((session) => ({
            label: session.label,
            value: session.id
        }));
    }

    get noSessions() {
        return this.sessions.length === 0;
    }

    get hasSessions() {
        return this.sessions.length > 0;
    }

    get addSessionDisabled() {
        return !this.newSessionDate || !this.newSessionPeriod;
    }

    get assignDisabled() {
        if (
            !this.selectedDetailId ||
            !this.selectedSessionId ||
            !this.selectedRotor
        ) {
            return true;
        }

        const session = this.sessions.find(
            (item) => item.id === this.selectedSessionId
        );

        if (!session) {
            return true;
        }

        const rotorSize = this.getRotorSize(
            session,
            this.selectedRotor
        );

        return rotorSize === 'Down';
    }

    get resetDisabled() {
        return this.sessions.length === 0 &&
            this.assignments.length === 0;
    }

    get exportDisabled() {
        return this.assignments.length === 0;
    }

    get lotOptions() {
        // Keep the selected lot available even when the search is filtering
        // it out of the visible lot cards.
        const visibleOrders = this.filteredOrders;
        const selected = this.selectedLot;
        const options = visibleOrders.map((order) => ({
            label: `${order.lotLabel} — ${order.orderNumber}`,
            value: order.id
        }));

        if (
            selected &&
            !options.some((option) => option.value === selected.id)
        ) {
            options.unshift({
                label: `${selected.lotLabel} — ${selected.orderNumber}`,
                value: selected.id
            });
        }

        return options;
    }

    get scheduleSessions() {
        return [...this.sessions]
            .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);

                if (dateCompare !== 0) {
                    return dateCompare;
                }

                return a.period.localeCompare(b.period);
            })
            .map((session) => {
                const ultra1Assignments = this.getSessionAssignments(
                    session.id,
                    'Ultra 1'
                );
                const ultra2Assignments = this.getSessionAssignments(
                    session.id,
                    'Ultra 2'
                );

                return {
                    ...session,
                    formattedDate: this.formatDate(session.date),
                    ultra1Assignments,
                    ultra2Assignments,
                    ultra1HasAssignments: ultra1Assignments.length > 0,
                    ultra2HasAssignments: ultra2Assignments.length > 0,
                    ultra1IsDown: session.ultra1Size === 'Down',
                    ultra2IsDown: session.ultra2Size === 'Down'
                };
            });
    }

    handleSearchChange(event) {
        this.searchTerm = event.detail.value || '';
    }

    handleSelectLot(event) {
        this.selectedDetailId = event.currentTarget.dataset.id;
    }

    handleLotChange(event) {
        this.selectedDetailId = event.detail.value;
    }

    handleSessionDateChange(event) {
        this.newSessionDate = event.detail.value;
    }

    handleSessionPeriodChange(event) {
        this.newSessionPeriod = event.detail.value;
    }

    handleAssignmentSessionChange(event) {
        this.selectedSessionId = event.detail.value;
    }

    handleRotorChange(event) {
        this.selectedRotor = event.detail.value;
    }

    handleAddSession() {
        if (!this.newSessionDate || !this.newSessionPeriod) {
            this.showToast(
                'Missing information',
                'Choose a date and a session period.',
                'warning'
            );
            return;
        }

        const duplicate = this.sessions.some(
            (session) =>
                session.date === this.newSessionDate &&
                session.period === this.newSessionPeriod
        );

        if (duplicate) {
            this.showToast(
                'Session already exists',
                'A session has already been added for that date and period.',
                'warning'
            );
            return;
        }

        const id = this.makeId('session');
        const session = {
            id,
            date: this.newSessionDate,
            period: this.newSessionPeriod,
            label: `${this.newSessionPeriod === 'AM' ? 'Morning' : 'Afternoon'} Session`,
            ultra1Size: '65K',
            ultra2Size: '90K'
        };

        this.sessions = [...this.sessions, session];
        this.selectedSessionId = id;

        this.showToast(
            'Session added',
            `${this.formatDate(session.date)} ${session.label.toLowerCase()} is ready.`,
            'success'
        );
    }

    handleAssignLot() {
        const lot = this.selectedLot;
        const session = this.sessions.find(
            (item) => item.id === this.selectedSessionId
        );

        if (!lot || !session || !this.selectedRotor) {
            this.showToast(
                'Missing information',
                'Select a production lot, processing session, and ultracentrifuge.',
                'warning'
            );
            return;
        }

        if (this.getRotorSize(session, this.selectedRotor) === 'Down') {
            this.showToast(
                'Ultracentrifuge unavailable',
                `${this.selectedRotor} is marked Down for this session.`,
                'error'
            );
            return;
        }

        const assignment = {
            id: this.makeId('assignment'),
            lotId: lot.id,
            lotLabel: lot.lotLabel,
            orderNumber: lot.orderNumber,
            construct: lot.construct,
            sessionId: session.id,
            date: session.date,
            period: session.period,
            sessionLabel: session.label,
            rotor: this.selectedRotor,
            rotorSize: this.getRotorSize(session, this.selectedRotor)
        };

        this.assignments = [...this.assignments, assignment];

        this.showToast(
            'Lot assigned',
            `${lot.lotLabel} assigned to ${this.selectedRotor} for ${this.formatDate(session.date)} (${session.period}).`,
            'success'
        );
    }

    handleRotorSizeChange(event) {
        const sessionId = event.currentTarget.dataset.sessionId;
        const rotor = event.currentTarget.dataset.rotor;
        const rotorSize = event.detail.value;

        const currentSession = this.sessions.find(
            (session) => session.id === sessionId
        );

        if (!currentSession) {
            return;
        }

        const hasAssignments = this.assignments.some(
            (assignment) =>
                assignment.sessionId === sessionId &&
                assignment.rotor === rotor
        );

        if (rotorSize === 'Down' && hasAssignments) {
            this.showToast(
                'Remove assignments first',
                `Remove the lots assigned to ${rotor} before marking it Down.`,
                'warning'
            );
            return;
        }

        this.sessions = this.sessions.map((session) => {
            if (session.id !== sessionId) {
                return session;
            }

            if (rotor === 'Ultra 1') {
                return { ...session, ultra1Size: rotorSize };
            }

            return { ...session, ultra2Size: rotorSize };
        });

        // Keep the assignment size aligned with the session's rotor setting.
        this.assignments = this.assignments.map((assignment) => {
            if (
                assignment.sessionId === sessionId &&
                assignment.rotor === rotor
            ) {
                return { ...assignment, rotorSize };
            }

            return assignment;
        });
    }

    handleRemoveAssignment(event) {
        const assignmentId = event.currentTarget.dataset.id;

        this.assignments = this.assignments.filter(
            (assignment) => assignment.id !== assignmentId
        );
    }

    handleRemoveSession(event) {
        const sessionId = event.currentTarget.dataset.id;
        const session = this.sessions.find(
            (item) => item.id === sessionId
        );

        this.sessions = this.sessions.filter(
            (item) => item.id !== sessionId
        );

        this.assignments = this.assignments.filter(
            (assignment) => assignment.sessionId !== sessionId
        );

        if (this.selectedSessionId === sessionId) {
            this.selectedSessionId = '';
        }

        this.showToast(
            'Session removed',
            `The session${session ? ` "${session.label}"` : ''} and its assignments were removed.`,
            'info'
        );
    }

    handleResetPlan() {
        this.sessions = [];
        this.assignments = [];
        this.selectedSessionId = '';

        this.showToast(
            'Plan reset',
            'All sessions and assignments have been cleared.',
            'success'
        );
    }

    handleExportCsv() {
        if (this.assignments.length === 0) {
            this.showToast(
                'Nothing to export',
                'Assign at least one production lot before exporting.',
                'warning'
            );
            return;
        }

        try {
            const headers = [
                'Processing Date',
                'Session',
                'Ultracentrifuge',
                'Rotor Size',
                'Production Lot',
                'Order Number',
                'Construct',
                'Assigned To',
                'Transfection Date',
                'Plates Used'
            ];

            const rows = this.assignments
                .map((assignment) => {
                    const lot = this.availableOrders.find(
                        (order) => order.id === assignment.lotId
                    );

                    return [
                        assignment.date,
                        assignment.period === 'AM'
                            ? 'Morning'
                            : 'Afternoon',
                        assignment.rotor,
                        this.getRotorSize(
                            this.sessions.find(
                                (session) =>
                                    session.id === assignment.sessionId
                            ) || {},
                            assignment.rotor
                        ) || assignment.rotorSize,
                        assignment.lotLabel,
                        assignment.orderNumber,
                        assignment.construct,
                        lot?.assignedTo || '',
                        lot?.transfectionDate || '',
                        lot?.plates ?? ''
                    ];
                })
                .sort((a, b) => {
                    const dateCompare = String(a[0]).localeCompare(
                        String(b[0])
                    );

                    if (dateCompare !== 0) {
                        return dateCompare;
                    }

                    const sessionCompare = String(a[1]).localeCompare(
                        String(b[1])
                    );

                    if (sessionCompare !== 0) {
                        return sessionCompare;
                    }

                    return String(a[2]).localeCompare(String(b[2]));
                });

            const escapeCsv = (value) => {
                const text = String(value ?? '');
                return `"${text.replace(/"/g, '""')}"`;
            };

            const csvContent = [
                headers.map(escapeCsv).join(','),
                ...rows.map((row) => row.map(escapeCsv).join(','))
            ].join('\r\n');

            // A UTF-8 BOM helps Excel display CSV text correctly.
            const dataUrl =
                'data:text/csv;charset=utf-8,\uFEFF' +
                encodeURIComponent(csvContent);

            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = 'Rotor_Schedule.csv';
            downloadLink.target = '_self';
            downloadLink.style.display = 'none';

            // Append and click synchronously in the button handler.
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            this.showToast(
                'Export started',
                'Your rotor schedule CSV download has been requested.',
                'success'
            );
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Rotor schedule CSV export failed:', error);

            this.showToast(
                'Export failed',
                'The schedule could not be exported. Check the browser console for details.',
                'error'
            );
        }
    }

    getSessionAssignments(sessionId, rotor) {
        return this.assignments
            .filter(
                (assignment) =>
                    assignment.sessionId === sessionId &&
                    assignment.rotor === rotor
            )
            .map((assignment) => ({
                ...assignment,
                rotorSize: this.getRotorSize(
                    this.sessions.find(
                        (session) => session.id === sessionId
                    ) || {},
                    rotor
                )
            }));
    }

    getRotorSize(session, rotor) {
        if (rotor === 'Ultra 1') {
            return session.ultra1Size || '';
        }

        return session.ultra2Size || '';
    }

    makeId(prefix) {
        this._idCounter += 1;
        return `${prefix}-${Date.now()}-${this._idCounter}`;
    }

    getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    formatDate(value) {
        if (!value || value === '—') {
            return '—';
        }

        // Avoid UTC conversion shifting a date-only Salesforce value.
        const parts = String(value).slice(0, 10).split('-');

        if (parts.length !== 3) {
            return String(value);
        }

        const [year, month, day] = parts.map(Number);

        if (!year || !month || !day) {
            return String(value);
        }

        return new Date(year, month - 1, day).toLocaleDateString(
            undefined,
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }
        );
    }

    getErrorMessage(error) {
        if (Array.isArray(error?.body)) {
            return error.body.map((item) => item.message).join(', ');
        }

        return error?.body?.message ||
            error?.message ||
            'An unexpected error occurred while loading production lots.';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}