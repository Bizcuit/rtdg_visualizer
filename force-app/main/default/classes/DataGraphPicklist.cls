global class DataGraphPicklist extends VisualEditor.DynamicPickList {

    global override VisualEditor.DataRow getDefaultValue() {
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('- Not Selected -', '');
        return defaultValue;
    }

    global override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows dataGraphList = new VisualEditor.DynamicPickListRows();

        try {
            // Query all active Real-Time Data Graphs
            List<SObject> dataGraphs = Database.query(
                'SELECT DataGraphApiName, Name ' +
                'FROM DataGraph ' +
                'WHERE DataGraphType = \'REALTIME\' ' +
                'ORDER BY DataGraphApiName ASC'
            );

            // Add data graphs to the picklist
            for (SObject dg : dataGraphs) {
                String label = (String)dg.get('Name');
                String apiName = (String)dg.get('DataGraphApiName');
                VisualEditor.DataRow dgRow = new VisualEditor.DataRow(label, apiName);
                dataGraphList.addRow(dgRow);
            }
        } catch (Exception e) {
            // If DataGraph object is not available or query fails, return empty list
            System.debug('Error querying DataGraphs: ' + e.getMessage());
        }

        return dataGraphList;
    }
}
