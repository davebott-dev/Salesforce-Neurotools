import { api, LightningElement, track } from 'lwc';

export default class VirusOrderForm extends LightningElement {
  @api virusType = '';
  @api dnaName = '';
  @api isEditable = false;
  @api selectedRowId = null; // For Flow output
  @api selectedRowName = ''; // For Flow output
  @track endVolume = '';
  @track needCloning = '';
  @track endUse = '';

  @track expressionConstructName = '';
  @track constructFullLength = '';
  @track expectedFluorescence = '';
  @track expectedFluorescenceOther = '';
  @track expressionConstructAlias = '';
  @track itrLength = '';

  @track capsid = '';
  @track notes = '';

  @track clientNotes = '';

  @track chartfieldString = '';

  @track selectedDnaId = null;
  @track selectedDnaName = '';

  virusTypeOptions = [
    { label: 'AAV', value: 'AAV' },
    { label: 'Lentivirus', value: 'Lentivirus' },
    { label: 'Rabies', value: 'Rabies' }
  ];

  yesNoOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ];

  fluorescenceOptions = [
    { label: 'Red', value: 'Red' },
    { label: 'Blue', value: 'Blue' },
    { label: 'Green', value: 'Green' },
    { label: 'None', value: 'None' },
    { label: 'Other', value: 'Other' }
  ];

  capsidOptions = [
    { label: 'Capsid 1', value: 'Capsid1' },
    { label: 'Capsid 2', value: 'Capsid2' },
    { label: 'Capsid 3', value: 'Capsid3' }
  ];

  get showCloningOptions() {
    return this.virusType === 'AAV' || this.virusType === 'Lentivirus';
  }

  get showFluorescence() {
    return this.expressionConstructName.trim().length > 0;
  }

  get showOtherFluorescence() {
    return this.expectedFluorescence === 'Other';
  }

  get virusOrderTotal() {
    if (this.virusType === 'AAV' && this.endVolume > 0) {
      if (this.endVolume <= 100) return '$495';
      if (this.endVolume > 100) return '$1000';
    }
    return '$0';
  }


  handleInputChange(event) {
    const field = event.target.name;
    this[field] = event.target.value;
  }

  handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.clientNotes = reader.result; // Store file content as client notes
      };
      reader.readAsText(file);
    }
  }

  handleDnaSelectionChange(event) {
    this.selectedDnaId = event.detail.selectedRowId;
    this.selectedDnaName = event.detail.selectedRowName;

    this.expressionConstructName = this.selectedDnaName || '';
  }

  handleDnaNameUpdate(event) {
    this.selectedDnaName = event.detail.dnaName;
    this.expressionConstructName = event.detail.dnaName;
    this.selectedDnaId = null; // Clear selected ID if typed manually
  }
}
