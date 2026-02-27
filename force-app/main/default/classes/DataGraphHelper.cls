public with sharing class DataGraphHelper {

    /**
     * Gets the DataSpace API name for a given Data Graph
     * @param dataGraphApiName The API name (DeveloperName) of the Data Graph
     * @return The DataSpace API name (DeveloperName)
     */
    @AuraEnabled(cacheable=true)
    public static String getDataSpaceApiName(String dataGraphApiName) {
        try {
            if (String.isBlank(dataGraphApiName)) {
                return null;
            }

            // Query the DataGraph to get the associated DataSpace
            List<SObject> dataGraphs = Database.query(
                'SELECT DataSpaceId FROM DataGraph ' +
                'WHERE DataGraphApiName = :dataGraphApiName ' +
                'LIMIT 1'
            );

            if (dataGraphs.isEmpty()) {
                throw new AuraHandledException('Data Graph not found: ' + dataGraphApiName);
            }

            SObject dataGraph = dataGraphs[0];
            String dataSpaceId = (String)dataGraph.get('DataSpaceId');


            // Query the DataGraph to get the associated DataSpace
            List<SObject> dataSpaces = Database.query(
                'SELECT DataSpaceApiName FROM DataSpace ' +
                'WHERE Id = :dataSpaceId ' +
                'LIMIT 1'
            );

            if (dataSpaces.isEmpty()) {
                throw new AuraHandledException('Data Space not found for Data Graph: ' + dataGraphApiName);
            }

            SObject dataSpace = dataSpaces[0];
            String dataSpaceName = (String)dataSpace.get('DataSpaceApiName');

            if (String.isBlank(dataSpaceName)) {
                throw new AuraHandledException('DataSpace not found for Data Graph: ' + dataGraphApiName);
            }

            return dataSpaceName;

        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving DataSpace: ' + e.getMessage());
        }
    }
}
