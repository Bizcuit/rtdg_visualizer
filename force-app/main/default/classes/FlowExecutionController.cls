public with sharing class FlowExecutionController {

    /**
     * Executes a Salesforce Flow and returns the value of a specified output variable as a String
     * @param flowApiName The API name of the flow to execute
     * @param outputVariableName The name of the output variable to return
     * @param inputVariables Map of input variable names and their values
     * @return The value of the specified output variable as a String
     */
    @AuraEnabled
    public static String executeFlowAndGetOutput(
        String flowApiName,
        String outputVariableName,
        Map<String, Object> inputVariables
    ) {
        try {
            // Create input map for the flow
            Map<String, Object> flowInputs = inputVariables != null ? inputVariables : new Map<String, Object>();

            // Execute the flow
            Flow.Interview flowInterview = Flow.Interview.createInterview(flowApiName, flowInputs);
            flowInterview.start();

            // Get the output variable value
            Object outputValue = flowInterview.getVariableValue(outputVariableName);

            // Convert to String
            return outputValue != null ? String.valueOf(outputValue) : null;

        } catch (Exception e) {
            throw new AuraHandledException('Error executing flow: ' + e.getMessage());
        }
    }

    /**
     * Simplified method that executes a flow without input variables
     * @param flowApiName The API name of the flow to execute
     * @param outputVariableName The name of the output variable to return
     * @return The value of the specified output variable as a String
     */
    @AuraEnabled
    public static String executeFlow(String flowApiName, String outputVariableName) {
        return executeFlowAndGetOutput(flowApiName, outputVariableName, null);
    }
}
