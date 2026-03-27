import { LightningElement, api } from 'lwc';

export default class RtdgVisualizerUtilityBar extends LightningElement {
    // Configuration properties from rtdgVisualizer
    @api selectedDataGraph;
    @api lookupKey = 'IndividualIdentityLink__dlm.SourceRecordId__c=RECORD_ID';
    @api componentConfig = '[]';

    // Internal state
    individualId = '';
    recordIdToPass = null;
    showVisualizer = false;
    targetLookupKey = this.lookupKey;

    handleIndividualIdChange(event) {
        this.individualId = event.target.value;
    }

    handleSubmit() {
        if (this.individualId && this.individualId.trim()) {
            this.recordIdToPass = this.individualId.trim();
            this.targetLookupKey = this.lookupKey.replace("RECORD_ID", this.recordIdToPass);
            this.showVisualizer = true;
        }
    }

    handleReset() {
        this.individualId = '';
        this.recordIdToPass = null;
        this.showVisualizer = false;
    }

    get isSubmitDisabled() {
        return !this.individualId || !this.individualId.trim();
    }
}
