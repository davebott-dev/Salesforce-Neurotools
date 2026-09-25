// delayReasonPicklist.js
import { LightningElement, api } from 'lwc';

const OPTIONS = [
  { label: 'Waiting on supply', value: 'Waiting on supply' },
  { label: 'Increased Order Volume', value: 'Increased Order Volume' },
  { label: 'Other', value: 'Other' }
];

export default class DelayReasonPicklist extends LightningElement {
  @api row;
  @api column;

  get options() {
    // Use options from typeAttributes if passed, else fallback to OPTIONS
    return this.column?.typeAttributes?.options || OPTIONS;
  }

  get selectedValue() {
    return this.row && this.column
      ? this.row[this.column.fieldName]
      : '';
  }

  get placeholder() {
  return this.column && this.column.typeAttributes
    ? this.column.typeAttributes.placeholder
    : '';
}


  handleChange(event) {
    const selectedValue = event.target.value;
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: selectedValue },
      bubbles: true,
      composed: true
    }));
  }
}
