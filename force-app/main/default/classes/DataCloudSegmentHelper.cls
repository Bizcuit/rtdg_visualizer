public with sharing class DataCloudSegmentHelper {

    /**
     * Gets the segment name for a given segment ID
     * @param segmentId The ID of the segment
     * @return The segment name or the ID if not found
     */
    @AuraEnabled(cacheable=true)
    public static String getSegmentName(String segmentId) {
        try {
            if (String.isBlank(segmentId)) {
                return '';
            }

            // Query the Segment object to get the name
            List<SObject> segments = Database.query(
                'SELECT Name FROM MarketSegment ' +
                'WHERE Id = :segmentId ' +
                'LIMIT 1'
            );

            if (!segments.isEmpty()) {
                return (String)segments[0].get('Name');
            }

            return segmentId; // Return ID if name not found

        } catch (Exception e) {
            System.debug('Error retrieving segment name: ' + e.getMessage());
            return segmentId;
        }
    }

    /**
     * Gets all segment names as a map (ID -> Name)
     * Useful for bulk lookups to avoid multiple server calls
     * @return Map of segment IDs to segment names
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllSegmentNames() {
        Map<String, String> segmentMap = new Map<String, String>();

        try {
            // Query all segments
            List<SObject> segments = Database.query(
                'SELECT Id, Name FROM Segment'
            );

            for (SObject segment : segments) {
                String segmentId = (String)segment.get('Id');
                String segmentName = (String)segment.get('Name');
                segmentMap.put(segmentId, segmentName);
            }

        } catch (Exception e) {
            System.debug('Error retrieving all segment names: ' + e.getMessage());
        }

        return segmentMap;
    }
}
