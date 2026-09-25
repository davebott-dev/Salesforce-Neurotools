public with sharing class ProjectCollaborationController {
    
    /**
     * Wrapper class for project data
     */
    public class ProjectWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String collaborationStatus;
        @AuraEnabled public String description;
        @AuraEnabled public Date startDate;
        @AuraEnabled public Date endDate;
        @AuraEnabled public List<String> labNames;
        @AuraEnabled public String labNamesDisplay;
        @AuraEnabled public Id projectOrgId;
    }
    
    /**
     * Get projects for the current user's organization
     * @param statusFilter - Filter by 'Approved' or 'Pending' (status of the collaboration)
     * @return List of ProjectWrapper objects
     */
    @AuraEnabled(cacheable=true)
    public static List<ProjectWrapper> getProjects(String statusFilter) {
        try {
            // Get current user's Account/Organization ID
            String currentUserId = UserInfo.getUserId();
            Id currentAccountId = getCurrentUserAccountId(currentUserId);
            
            if (currentAccountId == null) {
                return new List<ProjectWrapper>();
            }
            
            // Query Project_Organization__c records for user's organization
            String query = 'SELECT Id, Project__c, Project__r.Name, Project__r.Description__c, ' +
                          'Project__r.Start_Date__c, Project__r.End_Date__c, Status__c ' +
                          'FROM Project_Organization__c ' +
                          'WHERE Organization__c = :currentAccountId ';
            
            if (String.isNotBlank(statusFilter)) {
                query += 'AND Status__c = :statusFilter ';
            }
            
            query += 'ORDER BY Project__r.Start_Date__c DESC NULLS LAST, Project__r.Name ASC ' +
                    'WITH SECURITY_ENFORCED';
            
            List<Project_Organization__c> projectOrgs = Database.query(query);
            
            if (projectOrgs.isEmpty()) {
                return new List<ProjectWrapper>();
            }
            
            // Get project IDs
            Set<Id> projectIds = new Set<Id>();
            for (Project_Organization__c po : projectOrgs) {
                projectIds.add(po.Project__c);
            }
            
            // Get all labs for each project (including those with different statuses)
            Map<Id, List<String>> projectToLabsMap = getProjectLabsMap(projectIds);
            
            // Build wrapper list
            List<ProjectWrapper> wrapperList = new List<ProjectWrapper>();
            for (Project_Organization__c po : projectOrgs) {
                ProjectWrapper wrapper = new ProjectWrapper();
                wrapper.id = po.Project__c;
                wrapper.projectOrgId = po.Id;
                wrapper.name = po.Project__r.Name;
                wrapper.collaborationStatus = po.Status__c;
                wrapper.description = po.Project__r.Description__c;
                wrapper.startDate = po.Project__r.Start_Date__c;
                wrapper.endDate = po.Project__r.End_Date__c;
                wrapper.labNames = projectToLabsMap.get(po.Project__c);
                wrapper.labNamesDisplay = wrapper.labNames != null ? String.join(wrapper.labNames, ', ') : '';
                wrapperList.add(wrapper);
            }
            
            return wrapperList;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching projects: ' + e.getMessage());
        }
    }
    
    /**
     * Get current user's Account/Organization ID
     */
    private static Id getCurrentUserAccountId(String userId) {
        List<User> users = [
            SELECT AccountId, ContactId, Contact.AccountId
            FROM User
            WHERE Id = :userId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        
        if (!users.isEmpty()) {
            User currentUser = users[0];
            // Try AccountId first (for Partner/Customer portal users)
            if (currentUser.AccountId != null) {
                return currentUser.AccountId;
            }
            // Try Contact.AccountId (for Experience Cloud users)
            if (currentUser.ContactId != null && currentUser.Contact.AccountId != null) {
                return currentUser.Contact.AccountId;
            }
        }
        
        return null;
    }
    
    /**
     * Get map of Project ID to Lab Names (only approved labs)
     */
    private static Map<Id, List<String>> getProjectLabsMap(Set<Id> projectIds) {
        Map<Id, List<String>> projectLabsMap = new Map<Id, List<String>>();
        
        for (Project_Organization__c po : [
            SELECT Project__c, Organization__r.Name, Status__c
            FROM Project_Organization__c
            WHERE Project__c IN :projectIds
            AND Status__c = 'Approved'
            WITH SECURITY_ENFORCED
            ORDER BY Organization__r.Name
        ]) {
            if (!projectLabsMap.containsKey(po.Project__c)) {
                projectLabsMap.put(po.Project__c, new List<String>());
            }
            projectLabsMap.get(po.Project__c).add(po.Organization__r.Name);
        }
        
        return projectLabsMap;
    }
}