global class FlowPicklist extends VisualEditor.DynamicPickList {

    global override VisualEditor.DataRow getDefaultValue() {
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('--None--', '');
        return defaultValue;
    }

    global override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows flowList = new VisualEditor.DynamicPickListRows();

        // Query all active flows
        List<FlowDefinitionView> flows = [
            SELECT ApiName, Label, DurableId
            FROM FlowDefinitionView
            WHERE IsActive = true
            AND ProcessType = 'AutoLaunchedFlow'
            ORDER BY Label ASC
        ];

        // Add flows to the picklist
        for (FlowDefinitionView flow : flows) {
            VisualEditor.DataRow flowRow = new VisualEditor.DataRow(flow.Label, flow.ApiName);
            flowList.addRow(flowRow);
        }

        return flowList;
    }
}
