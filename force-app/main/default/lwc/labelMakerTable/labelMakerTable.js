import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';
import getActiveVirusOrdersJson from '@salesforce/apex/VirusOrderHelper.getActiveVirusOrdersJson';
import SHEETJS from '@salesforce/resourceUrl/sheetjs';
import { loadScript } from 'lightning/platformResourceLoader';

export default class LabelMakerTable extends LightningElement {
    @track internalData = [];
    _editableDataJson = '[]';
    @track searchTerm = '';
    @track selectedVirusType = '';  


    labelTypeOptions = [
        { label: 'Aliquot', value: 'Aliquot' },
        { label: 'Custom', value: 'Custom' }
    ];

    virusTypeOptions = [
        { label: 'All', value: '' },
        { label: 'AAV', value: 'AAV' },
        { label: 'Rabies', value: 'Rabies' },
        { label: 'Lenti', value: 'Lenti' },
        { label: 'HSV', value: 'HSV' }
    ];
    @api
    get editableDataJson() {
        return this._editableDataJson;
    }
    set editableDataJson(value) {
        this._editableDataJson = value || '[]';
        try {
            this.internalData = JSON.parse(this._editableDataJson);
            this.internalData = this.internalData.map(order => ({
                ...order,
                isLabelCountDisabled: order.labelType === 'Custom',
                selected: order.selected || false  
            }));
        } catch {
            this.internalData = [];
        }
    }
@track currentPage = 1;
    pageSize = 20;

    get paginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredData.slice(start, end);
    }

    get totalPages() {
        return Math.ceil(this.filteredData.length / this.pageSize) || 1;
    }

    get isPrevDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage === this.totalPages;
    }

    handlePrevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1; 
    }

    handleVirusTypeChange(event) {
    this.selectedVirusType = event.detail.value;
    this.currentPage = 1;
}

    connectedCallback() {
    Promise.all([loadScript(this, SHEETJS)])
        .then(() => {
            console.log('SheetJS loaded');
            return getActiveVirusOrdersJson();
        })
        .then(resultJson => {
    console.log('Data fetched from Apex:', resultJson);
    this.internalData = JSON.parse(resultJson).map((order, index) => {
    let displayTiter = '';

    // Use the exact property names from JSON
    if (!order.Prep_to_send__c || order.Prep_to_send__c === 'Concentrated') {
        displayTiter = order.Titer || '';
    } else if (order.Prep_to_send__c === 'Unconcentrated') {
        displayTiter = order.Unconcentrated_Titer__c || '';
    }

    return {
        ...order,
        index,
        labelType: 'Custom',
        labelCount: 1,
        selected: false,
        isLabelCountDisabled: true,
        displayTiter: displayTiter
    };
});

    this._editableDataJson = JSON.stringify(this.internalData);
})
;
}


handleDownloadExcel() {
    const selected = this.internalData.filter(row => row.selected);
    if (selected.length === 0) {
        alert('Please select at least one row.');
        return;
    }

    const exportData = [];

    selected.forEach(row => {
        const repeatCount = row.labelCount || 1;

        for (let i = 0; i < repeatCount; i++) {
            exportData.push({
                'Order Number': row.OrderNumber,
                'Requestor': row.Requestor,
                'Organization': row.Organization,
                'Construct + Capsid': row.ConstructCapsid,
                'Titer': row.displayTiter,
                'Transfection Date': row.TransfectionDate,
                'Unit': row.Unit,
                'Quantity Ordered': row.QuantityOrdered,
                'Label Type': row.labelType,
            });
        }
    });

    const worksheet = XLSX.utils.json_to_sheet([], { origin: 'A1' });

    // Add header manually in row 1
    const headers = Object.keys(exportData[0]);
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

    // Add the data starting from row 2 without headers
    XLSX.utils.sheet_add_json(worksheet, exportData, {
        skipHeader: true,
        origin: 'A2'
    });

    // Optional: Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Labels');

    XLSX.writeFile(workbook, 'Virus_Label_List.xlsx');
}

    get filteredData() {
        let data = this.internalData;

        // Filter by search term
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            data = data.filter(order =>
                (order.Name && order.Name.toLowerCase().includes(term)) ||
                (order.Order_Number__c && order.Order_Number__c.toLowerCase().includes(term))
            );
        }

        // Filter by virus type if selected
        if (this.selectedVirusType) {
            data = data.filter(order => order.Type === this.selectedVirusType);
        }

        return data;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleChange(event) {
    const id = event.target.dataset.id;
    const field = event.target.dataset.field;
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    const rowIndex = this.internalData.findIndex(row => row.OrderNumber === id);
    if (rowIndex === -1) return;

    if (field === 'labelCount') {
        value = parseInt(value, 10) || 1;
    }

    this.internalData[rowIndex][field] = value;

    if (field === 'labelType') {
        if (value === 'Custom') {
            this.internalData[rowIndex].labelCount = 1;
            this.internalData[rowIndex].isLabelCountDisabled = true;
        } else {
            this.internalData[rowIndex].isLabelCountDisabled = false;
        }
    }

    this.internalData = [...this.internalData]; // refresh tracked state
    this._editableDataJson = JSON.stringify(this.internalData);
}


    handleNext() {
        // Optional: filter internalData for only selected rows before next step
        const selectedData = this.internalData.filter(order => order.selected);
        this._editableDataJson = JSON.stringify(selectedData);
        this.dispatchEvent(new FlowAttributeChangeEvent('editableDataJson', this._editableDataJson));
        this.dispatchEvent(new FlowNavigationNextEvent());
    }
}