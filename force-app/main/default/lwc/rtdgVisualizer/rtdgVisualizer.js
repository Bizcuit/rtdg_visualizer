import { LightningElement, api } from 'lwc';
import executeFlowAndGetOutput from '@salesforce/apex/FlowExecutionController.executeFlowAndGetOutput';
import getDataSpaceApiName from '@salesforce/apex/DataGraphHelper.getDataSpaceApiName';

export default class RtdgVisualizer extends LightningElement {
    // Configuration parameters
    @api componentConfig;
    @api selectedFlow;
    @api selectedDataGraph;
    @api lookupKey;
    @api componentTitle = 'RTDG Visualizer';
    @api autoExecute = false;

    // Component state
    flowResult;
    error;
    isLoading = false;
    outputVariableName = 'output'; // Default output variable name, can be overridden by JSON config
    config = {};

    connectedCallback() {
        this.parseConfig();

        if (this.autoExecute && this.selectedFlow && this.selectedDataGraph && this.outputVariableName) {
            this.executeFlowHandler();
        }
    }

    // Parse JSON configuration
    parseConfig() {
        try {
            if (this.componentConfig) {
                this.config = JSON.parse(this.componentConfig);
            } else {
                this.config = {};
            }
        } catch (e) {
            this.error = 'Invalid JSON configuration: ' + e.message;
            console.error('Error parsing component config:', e);
        }
    }

    // Execute flow using configured parameters
    async executeFlowHandler() {
        if (!this.selectedFlow || !this.selectedDataGraph || !this.outputVariableName) {
            this.error = 'Flow, Data Graph, and output variable name must be configured: ' + this.selectedFlow + ', ' + this.selectedDataGraph + ', ' + this.outputVariableName;
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

            console.log('DataSpace API Name:', dataSpaceApiName);
            console.log('Selected Data Graph:', this.selectedDataGraph);
            console.log('Lookup Key:', this.lookupKey);

            // Prepare input variables for the flow
            const inputVariables = {
                dataspace: dataSpaceApiName,
                dgName: this.selectedDataGraph,
                dgLookupKey: this.lookupKey
            };

            // Execute the flow with the dataspace as input
            this.flowResult = await executeFlowAndGetOutput({
                flowApiName: this.selectedFlow,
                outputVariableName: this.outputVariableName,
                inputVariables: inputVariables
            });

            if(this.flowResult){
                this.flowResult = JSON.stringify(JSON.parse(this.flowResult), null, 2); // Pretty print JSON result
            }

            console.log('Flow result:', this.flowResult);
        } catch (error) {
            this.error = error.body?.message || 'An error occurred while executing the flow';
            console.error('Error executing flow:', error);
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
        return this.selectedFlow || 'Not configured';
    }

    get dataGraphName() {
        return this.selectedDataGraph || 'Not configured';
    }

    get outputVariableName() {
        return this.outputVariableName || 'Not configured';
    }
}
