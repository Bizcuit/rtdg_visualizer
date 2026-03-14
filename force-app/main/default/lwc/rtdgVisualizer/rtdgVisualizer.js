import { LightningElement, api } from 'lwc';
import executeFlowAndGetOutput from '@salesforce/apex/FlowExecutionController.executeFlowAndGetOutput';
import getDataSpaceApiName from '@salesforce/apex/DataGraphHelper.getDataSpaceApiName';
import { renderConfig, getTestConfig } from './renderUtils';

export default class RtdgVisualizer extends LightningElement {
    // Configuration parameters
    @api componentConfig;
    @api selectedDataGraph;
    @api lookupKey;
    @api componentTitle = 'RTDG Visualizer';
    @api autoExecute = false;
    @api recordId; // Current record ID (automatically available on record pages)

    // Static flow API name
    FLOW_API_NAME = 'dgLookup';
    FLOW_OUTPUT_VAR = 'output'; // Default output variable name, can be overridden by JSON config

    // Component state
    flowResult;
    htmlResult;
    error;
    isLoading = false;
    config = {};

    connectedCallback() {
        this.parseConfig();

        if (this.autoExecute && this.selectedDataGraph && this.FLOW_OUTPUT_VAR) {
            this.executeFlowHandler();
        }
    }

    renderedCallback() {
        const el = this.template.querySelector('.my-class');
        console.log(el); // Now it exists!
    }

    // Parse JSON configuration
    parseConfig() {
        try {
            if (this.componentConfig) {
                this.config = JSON.parse(this.componentConfig);
                // this.config = getTestConfig();
            } else {
                this.config = getTestConfig();
            }
        } catch (e) {
            this.error = 'Invalid JSON configuration: ' + e.message;
            console.error('Error parsing component config:', e);
        }
    }

    // Execute flow using configured parameters
    async executeFlowHandler() {
        if (!this.selectedDataGraph || !this.FLOW_OUTPUT_VAR) {
            this.error = 'Data Graph and output variable name must be configured: ' + this.selectedDataGraph + ', ' + this.FLOW_OUTPUT_VAR;
            return;
        }

        this.isLoading = true;
        this.error = null;
        this.flowResult = null;

        try {
            // First, get the DataSpace API name for the selected Data Graph
            const dataSpaceApiName = await getDataSpaceApiName({
                dataGraphApiName: this.selectedDataGraph
            });

            // Prepare input variables for the flow
            const inputVariables = {
                dataspace: dataSpaceApiName,
                dgName: this.selectedDataGraph,
                dgLookupKey: this.lookupKey.replace("RECORD_ID", this.recordId)
            };

            console.log('Input variables being passed to flow:', JSON.stringify(inputVariables));

            // Execute the flow with the dataspace as input
            this.flowResult = await executeFlowAndGetOutput({
                flowApiName: this.FLOW_API_NAME,
                outputVariableName: this.FLOW_OUTPUT_VAR,
                inputVariables: inputVariables
            });

            if(!this.flowResult) return "";
           
            const profile = JSON.parse(this.flowResult)?.[0];

            this.template.querySelector('.container').innerHTML = await renderConfig(profile, this.config);
        } catch (error) {
            this.errorMessage = error.body?.message || error.message || 'An error occurred while executing the flow';
        } finally {
            this.isLoading = false;
        }
    }

    handleExecuteClick() {
        this.executeFlowHandler();
    }

    get hasResult() {
        return this.flowResult !== null && this.flowResult !== undefined;
    }

    get hasError() {
        return this.error !== null && this.error !== undefined;
    }

    get flowApiName() {
        return this.FLOW_API_NAME || 'Not configured';
    }

    get dataGraphName() {
        return this.selectedDataGraph || 'Not configured';
    }

    get outputVariableName() {
        return this.FLOW_OUTPUT_VAR || 'Not configured';
    }
}
