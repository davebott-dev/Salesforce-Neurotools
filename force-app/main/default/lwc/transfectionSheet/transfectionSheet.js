import { LightningElement, track, wire } from 'lwc';
import getOrdersWithProductionDetails from '@salesforce/apex/ProductionDetailSelector.getOrdersWithProductionDetails';
import updateProductionDetails from '@salesforce/apex/ProductionDetailSelector.updateProductionDetails';
import updateVirusOrders from '@salesforce/apex/ProductionDetailSelector.updateVirusOrders';

const assignedToOptions = [
    { label: 'Kimberly Ritola', value: 'Kimberly Ritola' },
    { label: "Aaliyah O'Dell", value: "Aaliyah O'Dell" },
    { label: 'Carli Opland', value: 'Carli Opland' },
    { label: 'Xiaojing Chen', value: 'Xiaojing Chen' },
    { label: 'Simna SP', value: 'Simna SP' },
    { label: 'Sean Brown', value: 'Sean Brown' }
];

const transfectionCalculationOptions = [
    { label: 'Regular', value: 'Regular' },
    { label: 'Toxic', value: 'Toxic' },
    { label: 'pUCmini', value: 'pUCmini' }
];


const columns = [
    { 
        label: 'Order Name', 
        fieldName: 'orderLink', 
        type: 'url', 
        sortable: true,
        typeAttributes: { 
            label: { fieldName: 'orderName' }, 
            target: '_blank'  
        }
    },
    { 
        label: 'Assigned To', 
        fieldName: 'assignedTo', 
        type: 'text',
        editable: true,
    },
    { label: 'Plates Used', fieldName: 'platesUsed', type: 'number', editable: true },
    { label: 'Tfxn Calculation', fieldName: 'transfectionCalculation', type: 'text', editable: true },
    { label: 'Transfection Date Lot', fieldName: 'transfectionDateLot', type: 'text', sortable: true, editable: true },
    { label: 'VO Construct', fieldName: 'voConstruct' },
    { label: 'Capsid', fieldName: 'capsid', sortable: true },
    { label: 'Order Date', fieldName: 'orderDate', type: 'date', sortable: true },
    { label: 'End Volume', fieldName: 'endVolume' },
    { label: 'End Use', fieldName: 'endUse' },
    { label: 'High Titer Required', fieldName: 'highTiterRequired', type: 'text' }
];

export default class TransfectionSheet extends LightningElement {
    @track orders = [];
    @track columns = columns;
    @track selectedOrders = [];
    @track selectedOrderIds = [];
    @track plateTotal = 0;
    @track platesRemaining = 0;
    @track showScreen1 = true;
    @track showScreen2 = false;
    @track draftValues = [];
    @track errorMsg = '';
    @track saveMessage = '';
    @track highlightedCells = {};

    @track sortBy = 'orderName';
    @track sortDirection = 'asc';
    @track successMessage = '';

    @track columnsScreen2 = [
    { label: 'Order Name', fieldName: 'orderName', type: 'text', sortable: true },
    { label: 'Assigned To', fieldName: 'assignedTo', type: 'text' }, 
    { label: 'Calculation', fieldName: 'transfectionCalculation', type: 'text' },
    { label: 'Transfection Date', fieldName: 'transfectionDateLot', type: 'text' },
    { label: 'VO Construct', fieldName: 'voConstruct', type: 'text' },
    { label: 'VO Construct Tube Location', fieldName: 'voConstructTubeLocation', type: 'text' },
    { label: 'Construct Tfx Volume', fieldName: 'constructTfxVol', type: 'number' },
    { label: 'Capsid', fieldName: 'capsid', type: 'text' },
    { label: 'Capsid Location', fieldName: 'capsidLocation', type: 'text' },
    { label: 'Capsid Tfxn Volume', fieldName: 'capsidTfxVol', type: 'number' },
    { label: 'Phelper Location', fieldName: 'phelperLocation', type: 'text' },
    { label: 'Phelper Tfxn Volume', fieldName: 'phelperVol', type: 'number' },
    { label: 'SFM', fieldName: 'sfm', type: 'number' },
    { label: 'PEI', fieldName: 'pei', type: 'number' },
    { label: 'Plates Used', fieldName: 'platesUsed', type: 'number' }
];

    @wire(getOrdersWithProductionDetails)
    wiredOrders({ error, data }) {
        if (data) {
            this.orders = this.processOrders(data);
            this.sortData(this.sortBy, this.sortDirection);
        } else if (error) {
            this.errorMsg = 'Error loading orders: ' + error.body.message;
        }
    }

    processOrders(data) {
        return data.map(row => {
            const virusOrder = row.virusOrder || {};
            const productionDetail = row.productionDetail || {};
            const assignedTo = virusOrder.Assigned_To__c || '';

            return {
                ...row,
                orderName: virusOrder.Name || '',
                orderLink: `/lightning/r/Opportunity/${virusOrder.Id}/view`,
                platesUsed: Number(productionDetail.Plates_Used__c) || 0,
                assignedTo: assignedTo,
                productionDetailId: productionDetail.Id || '',
                transfectionDateLot: productionDetail.Lot_Transfection_Date__c || '',
                voConstruct: virusOrder.VO_Construct__r ? virusOrder.VO_Construct__r.Name : '',
                voConstructTubeLocation: productionDetail.DNA_Tube_Construct_Location__c || '',
                constructTfxVol: productionDetail.Construct_Tfxn_Vol__c || 0,
                capsid: virusOrder.Capsid_Envelope__r ? virusOrder.Capsid_Envelope__r.Name : '',
                capsidLocation: productionDetail.DNA_Tube_Capsid_Location__c || '',
                capsidTfxVol: productionDetail.Capsid_Tfxn_Vol__c || 0,
                phelperLocation: productionDetail.DNA_Tube_pHelper_Location__c || '',
                phelperVol: productionDetail.pHelper_Tfxn_Vol__c || 0,
                sfm: productionDetail.SFM__c || false,
                pei: productionDetail.PEI__c || false,
                orderDate: virusOrder.Order_Date__c ? new Date(virusOrder.Order_Date__c) : null,
                endVolume: virusOrder.AAV_prep_size__c || '',
                endUse: virusOrder.End_Use__c || 'N/A',
                highTiterRequired: virusOrder.High_Titer_Required__c === "True" ? "true" : "false",
                transfectionCalculation: productionDetail.Tfxn_Calculation__c || '',
                expectedFluorescence: productionDetail.Expected_Fluorescence__c || '',
            };
        });
    }

    handlePlateInputChange(event) {
        this.plateTotal = parseInt(event.target.value, 10) || 0;
        this.updatePlatesRemaining();
    }

    handleRowSelection(event) {
    this.selectedOrders = event.detail.selectedRows.map(row => ({
        ...row,
        constructClass: 'clickable-cell',
        capsidClass: 'clickable-cell',
        phelperClass: 'clickable-cell',
        rowClass: ''
    }));
    this.selectedOrderIds = this.selectedOrders.map(r => r.productionDetailId);
    this.updatePlatesRemaining();
}


    updatePlatesRemaining() {
        const usedPlates = this.selectedOrders.reduce((sum, row) => sum + (row.platesUsed || 0), 0);
        this.platesRemaining = this.plateTotal - usedPlates;
        this.errorMsg = this.platesRemaining < 0 ? 'Plate usage exceeds available plates!' : '';
    }

    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    handleCellClick(event) {
    const rowId = event.currentTarget.dataset.id;
    const type = event.currentTarget.dataset.type;

    const index = this.selectedOrders.findIndex(r => r.productionDetailId === rowId);
    if (index === -1) return;

    const row = { ...this.selectedOrders[index] }; 

    const toggleKey = `${type}Class`;
    row[toggleKey] = row[toggleKey] === 'highlighted-cell' ? 'clickable-cell' : 'highlighted-cell';

    if (row.constructClass === 'highlighted-cell' &&
        row.capsidClass === 'highlighted-cell' &&
        row.phelperClass === 'highlighted-cell') {
        row.rowClass = 'highlighted-row';
    } else {
        row.rowClass = '';
    }

    this.selectedOrders = [
        ...this.selectedOrders.slice(0, index),
        row,
        ...this.selectedOrders.slice(index + 1)
    ];
}


getCellClass(rowId, type) {
    return this.highlightedCells[rowId]?.[type] 
        ? 'highlighted-cell' 
        : 'clickable-cell';
}

getRowClass(rowId) {
    const row = this.highlightedCells[rowId];
    if (row && row.construct && row.capsid && row.phelper) {
        return 'highlighted-row';
    }
    return '';
}

    sortData(fieldname, direction) {
        let parseData = [...this.orders];
        parseData.sort((a, b) => {
            let valA = a[fieldname];
            let valB = b[fieldname];

            valA = valA === null || valA === undefined ? '' : valA;
            valB = valB === null || valB === undefined ? '' : valB;

            if(valA instanceof Date) valA = valA.getTime();
            if(valB instanceof Date) valB = valB.getTime();

            if(valA > valB) return direction === 'asc' ? 1 : -1;
            if(valA < valB) return direction === 'asc' ? -1 : 1;
            return 0;
        });
        this.orders = parseData;
    }

    prepareSelectedOrdersForScreen2() {
    this.selectedOrders = this.selectedOrders.map(row => {
        const state = this.highlightedCells[row.productionDetailId] || {
            construct: false,
            capsid: false,
            phelper: false
        };

        return {
            ...row,
            constructClass: state.construct ? 'highlighted-cell' : 'clickable-cell',
            capsidClass: state.capsid ? 'highlighted-cell' : 'clickable-cell',
            phelperClass: state.phelper ? 'highlighted-cell' : 'clickable-cell',
            rowClass: (state.construct && state.capsid && state.phelper) ? 'highlighted-row' : ''
        };
    });
}

    handleNext() {
        if (this.platesRemaining < 0) {
            this.errorMsg = 'Cannot proceed, plate usage exceeds available plates.';
            return;
        }
        if (this.selectedOrders.length === 0) {
            this.errorMsg = 'Please select at least one order.';
            return;
        }
        this.errorMsg = '';

        this.prepareSelectedOrdersForScreen2();

        this.showScreen1 = false;
        this.showScreen2 = true;
    }

    handleBack() {
        this.showScreen2 = false;
        this.showScreen1 = true;
        this.saveMessage = '';
    }

    handleSaveDraftValues(event) {
    this.draftValues = event.detail.draftValues;

    const validAssignedToValues = assignedToOptions.map(opt => opt.value);
    const invalidAssignments = this.draftValues.filter(draft => 
        draft.assignedTo !== undefined && draft.assignedTo !== '' && !validAssignedToValues.includes(draft.assignedTo)
    );

    if (invalidAssignments.length > 0) {
        const validLabels = assignedToOptions
            .filter(opt => opt.value !== '')
            .map(opt => opt.label)
            .join(', ');

        this.errorMsg = `Invalid Assigned To value(s) detected. Please choose from: ${validLabels}`;
        this.saveMessage = '';
        return; 
    }

    const validTfxnValues = transfectionCalculationOptions.map(opt => opt.value);
    const invalidTfxn = this.draftValues.filter(draft =>
        draft.transfectionCalculation !== undefined &&
        draft.transfectionCalculation !== '' &&
        !validTfxnValues.includes(draft.transfectionCalculation)
    );

    if (invalidTfxn.length > 0) {
        const validTfxnLabels = transfectionCalculationOptions.map(opt => opt.label).join(', ');
        this.errorMsg = `Invalid Transfection Calculation value(s) detected. Please choose from: ${validTfxnLabels}`;
        this.saveMessage = '';
        return;
    }

    const pdUpdates = this.draftValues.map(draft => ({
        Id: draft.productionDetailId,
        Plates_Used__c: draft.platesUsed,
        Lot_Transfection_Date__c: draft.transfectionDateLot,
        Tfxn_Calculation__c: draft.transfectionCalculation
    }));

    const virusOrderUpdatesMap = new Map();

    this.draftValues.forEach(draft => {
        const matchingOrder = this.orders.find(o => o.productionDetailId === draft.productionDetailId);
        if (matchingOrder && (draft.assignedTo !== undefined || draft.transfectionCalculation !== undefined)) {
            virusOrderUpdatesMap.set(matchingOrder.virusOrder.Id, {
                Id: matchingOrder.virusOrder.Id,
                Assigned_To__c: draft.assignedTo,            });
        }
    });

    const voUpdates = Array.from(virusOrderUpdatesMap.values());

    this.errorMsg = '';
    this.saveMessage = '';

    updateProductionDetails({ updates: pdUpdates })
        .then(() => {
            if (voUpdates.length > 0) {
                return updateVirusOrders({ updates: voUpdates });
            }
            return Promise.resolve();
        })
        .then(() => {
            this.saveMessage = 'Changes saved successfully.';

            pdUpdates.forEach(updatedRec => {
                const index = this.orders.findIndex(order => order.productionDetailId === updatedRec.Id);
                if (index !== -1) {
                    this.orders[index] = {
                        ...this.orders[index],
                        platesUsed: updatedRec.Plates_Used__c !== undefined ? updatedRec.Plates_Used__c : this.orders[index].platesUsed,
                        transfectionDateLot: updatedRec.Lot_Transfection_Date__c !== undefined ? updatedRec.Lot_Transfection_Date__c : this.orders[index].transfectionDateLot,
                        transfectionCalculation: updatedRec.Tfxn_Calculation__c !== undefined ? updatedRec.Tfxn_Calculation__c : this
                    };
                }
            });

            voUpdates.forEach(updatedVo => {
                const index = this.orders.findIndex(order => order.virusOrder.Id === updatedVo.Id);
                if (index !== -1) {
                    this.orders[index] = {
                        ...this.orders[index],
                        assignedTo: updatedVo.Assigned_To__c !== undefined ? updatedVo.Assigned_To__c : this.orders[index].assignedTo
                    };
                }
            });

            this.draftValues = [];
            this.sortData(this.sortBy, this.sortDirection);
        })
        .catch(error => {
            this.errorMsg = 'Error saving changes: ' + (error.body ? error.body.message : error.message);
        });
}


exportToExcel() {
    if (!this.selectedOrders || this.selectedOrders.length === 0) {
        this.errorMsg = 'Please select at least one row to export.';
        return;
    }

    const headers = [
        'Order Name', 'Transfection Date', 'Assigned To', 'End Use', 'Expression Construct', 
        'Expected Flourescence','Construct Location', 'Construct Tfxn Vol', 'Capsid', 'Capsid Location', 'Capsid Tfxn Vol', 
        'Phelper Location', 'Phelper Tfxn Vol', 'SFM', 'PEI', 'Plates Used',
        'Order Date', 'End Volume', 'High Titer Required'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    this.selectedOrders.forEach(order => {
        const row = [
            `"${order.orderName}"`,
            `"${order.transfectionDateLot}"`,
            `"${order.assignedTo}"`,
            `"${order.endUse}"`,
            `"${order.voConstruct}"`,
            `"${order.expectedFluorescence}"`,
            `"${order.voConstructTubeLocation}"`,
            `"${order.constructTfxVol}"`,
            `"${order.capsid}"`,
            `"${order.capsidLocation}"`,
            `"${order.capsidTfxVol}"`,
            `"${order.phelperLocation}"`,
            `"${order.phelperVol}"`,
            order.sfm,
            order.pei,
            order.platesUsed,

            order.orderDate ? order.orderDate.toISOString().slice(0, 10) : '',
            `"${order.endVolume}"`,

            order.highTiterRequired==="true" ? 'TRUE' : 'FALSE'
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvString);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'transfection_sheet_selected.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.errorMsg = '';
}
exportDnaPullSheet() {
    if (!this.selectedOrders || this.selectedOrders.length === 0) {
        this.errorMsg = 'Please select at least one row to export DNA Pull Sheet.';
        return;
    }

    let dnaEntries = [];

    this.selectedOrders.forEach(order => {
        if (order.voConstruct) {
            dnaEntries.push({
                name: order.voConstruct,
                location: order.voConstructTubeLocation || ''
            });
        }
        if (order.capsid) {
            dnaEntries.push({
                name: order.capsid,
                location: order.capsidLocation || ''
            });
        }
        if (order.phelperLocation) {
            dnaEntries.push({
                name: 'Phelper', 
                location: order.phelperLocation
            });
        }
    });


const uniqueDnaEntries = [];
const seen = new Set();

dnaEntries.forEach(entry => {
    const key = entry.name + '|' + entry.location;
    if (!seen.has(key)) {
        seen.add(key);
        uniqueDnaEntries.push(entry);
    }
});

dnaEntries = uniqueDnaEntries;


    dnaEntries.sort((a, b) => a.location.localeCompare(b.location));

    const headers = ['DNA Name', 'Location'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    dnaEntries.forEach(entry => {
        const row = [`"${entry.name}"`, `"${entry.location}"`];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvString);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dna_pull_sheet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.errorMsg = '';
}

handleMoveToVirusPrep() {
    if (!this.selectedOrders || this.selectedOrders.length === 0) {
        this.errorMsg = 'No orders selected to move.';
        this.successMessage = '';
        return;
    }

    this.errorMsg = '';
    this.successMessage = '';

    const virusOrderIds = [...new Set(this.selectedOrders.map(order => order.virusOrder.Id))];

    const updates = virusOrderIds.map(id => ({
        Id: id,
        StageName: 'Virus Prep In Progress'  
    }));

    updateVirusOrders({ updates })
        .then(() => {
            this.successMessage = 'Selected orders moved to Virus Prep In Progress.';
            this.selectedOrders = [];
            this.selectedOrderIds = [];
            return refreshApex(this.wiredOrders);
        })
        .catch(error => {
            this.errorMsg = 'Error updating orders: ' + (error.body ? error.body.message : error.message);
            this.successMessage = '';
        });
}


    get platesRemainingClass() {
        return this.platesRemaining < 0 ? 'error' : '';
    }

    get isDisabled() {
        return this.platesRemaining < 0 || this.selectedOrders.length === 0;
    }


}
