
import { LightningElement } from 'lwc';

export default class NeurotoolsAnnouncements extends LightningElement {
    isExpanded = false;

    // Demo content only. Replace with Salesforce announcement records later.
    announcements = [
        {
            id: 'announcement-1',
            type: 'General',
            badgeClass: 'announcement-badge general-badge',
            date: 'Portal update',
            title: 'Welcome to the NeuroTools portal',
            message:
                'Use the dashboard to start orders, request quotes, review order progress, and contact the team.'
        },
        {
            id: 'announcement-2',
            type: 'Ordering',
            badgeClass: 'announcement-badge ordering-badge',
            date: 'Payment reminder',
            title: 'Review your payment options',
            message:
                'Credit cards and purchase orders are available. Keep your billing information current to help checkout go smoothly.'
        }
    ];

    get unreadCount() {
        // Both demo announcements are initially shown as unread.
        return this.announcements.length;
    }

    get launcherLabel() {
        return `Open announcements. ${this.unreadCount} announcements`;
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
    }

    minimize() {
        this.isExpanded = false;
    }
}