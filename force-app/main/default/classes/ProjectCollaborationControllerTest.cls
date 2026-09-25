@isTest
private class ProjectCollaborationControllerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test Account (Organization/Lab)
        Account testLab1 = new Account(Name = 'Test Lab 1');
        Account testLab2 = new Account(Name = 'Test Lab 2');
        insert new List<Account>{ testLab1, testLab2 };
        
        // Create test Projects (without Status__c - status is now on junction object)
        Project__c project1 = new Project__c(
            Name = 'Collaboration Project 1',
            Description__c = 'This is an approved collaboration project',
            Start_Date__c = Date.today().addDays(-30),
            End_Date__c = Date.today().addDays(30)
        );
        
        Project__c project2 = new Project__c(
            Name = 'Collaboration Project 2',
            Description__c = 'This is a pending collaboration request',
            Start_Date__c = Date.today().addDays(7),
            End_Date__c = Date.today().addDays(90)
        );
        
        Project__c project3 = new Project__c(
            Name = 'Collaboration Project 3',
            Description__c = 'This is a rejected collaboration',
            Start_Date__c = Date.today().addDays(-90),
            End_Date__c = Date.today().addDays(-10)
        );
        
        insert new List<Project__c>{ project1, project2, project3 };
        
        // Create Project_Organization__c junction records with Status__c
        // Project 1: Approved by Lab 1, Approved by Lab 2
        Project_Organization__c po1 = new Project_Organization__c(
            Project__c = project1.Id,
            Organization__c = testLab1.Id,
            Status__c = 'Approved'
        );
        
        Project_Organization__c po2 = new Project_Organization__c(
            Project__c = project1.Id,
            Organization__c = testLab2.Id,
            Status__c = 'Approved'
        );
        
        // Project 2: Pending for Lab 1
        Project_Organization__c po3 = new Project_Organization__c(
            Project__c = project2.Id,
            Organization__c = testLab1.Id,
            Status__c = 'Pending'
        );
        
        // Project 3: Rejected by Lab 1
        Project_Organization__c po4 = new Project_Organization__c(
            Project__c = project3.Id,
            Organization__c = testLab1.Id,
            Status__c = 'Rejected'
        );
        
        insert new List<Project_Organization__c>{ po1, po2, po3, po4 };
    }
    
    @isTest
    static void testGetApprovedProjects() {
        // Get test lab
        Account testLab = [SELECT Id FROM Account WHERE Name = 'Test Lab 1' LIMIT 1];
        
        // Create test user associated with the lab
        User testUser = createTestUser(testLab.Id);
        
        Test.startTest();
        System.runAs(testUser) {
            List<ProjectCollaborationController.ProjectWrapper> results = 
                ProjectCollaborationController.getProjects('Approved');
            
            System.assertNotEquals(null, results, 'Results should not be null');
            System.assertEquals(1, results.size(), 'Should return 1 approved project');
            System.assertEquals('Collaboration Project 1', results[0].name, 'Project name should match');
            System.assertEquals('Approved', results[0].collaborationStatus, 'Status should be Approved');
            System.assert(results[0].labNamesDisplay.contains('Test Lab 1'), 'Should contain Test Lab 1');
            System.assert(results[0].labNamesDisplay.contains('Test Lab 2'), 'Should contain Test Lab 2');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetPendingProjects() {
        // Get test lab
        Account testLab = [SELECT Id FROM Account WHERE Name = 'Test Lab 1' LIMIT 1];
        
        // Create test user associated with the lab
        User testUser = createTestUser(testLab.Id);
        
        Test.startTest();
        System.runAs(testUser) {
            List<ProjectCollaborationController.ProjectWrapper> results = 
                ProjectCollaborationController.getProjects('Pending');
            
            System.assertNotEquals(null, results, 'Results should not be null');
            System.assertEquals(1, results.size(), 'Should return 1 pending project');
            System.assertEquals('Collaboration Project 2', results[0].name, 'Project name should match');
            System.assertEquals('Pending', results[0].collaborationStatus, 'Status should be Pending');
            // Pending projects show only approved labs, so only approved labs appear
            System.assert(results[0].labNamesDisplay == null || results[0].labNamesDisplay == '', 
                'Should not show labs for pending collaboration');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetAllProjects() {
        // Get test lab
        Account testLab = [SELECT Id FROM Account WHERE Name = 'Test Lab 1' LIMIT 1];
        
        // Create test user associated with the lab
        User testUser = createTestUser(testLab.Id);
        
        Test.startTest();
        System.runAs(testUser) {
            // Pass null or empty string to get all projects (all statuses)
            List<ProjectCollaborationController.ProjectWrapper> results = 
                ProjectCollaborationController.getProjects(null);
            
            System.assertNotEquals(null, results, 'Results should not be null');
            System.assertEquals(3, results.size(), 'Should return all 3 projects for this lab');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetProjectsNoAccess() {
        // Create a user without any lab association
        User testUser = createTestUserWithoutAccount();
        
        Test.startTest();
        System.runAs(testUser) {
            List<ProjectCollaborationController.ProjectWrapper> results = 
                ProjectCollaborationController.getProjects('Approved');
            
            System.assertNotEquals(null, results, 'Results should not be null');
            System.assertEquals(0, results.size(), 'Should return 0 projects for user without lab');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testProjectWrapperFields() {
        // Get test lab
        Account testLab = [SELECT Id FROM Account WHERE Name = 'Test Lab 1' LIMIT 1];
        
        // Create test user associated with the lab
        User testUser = createTestUser(testLab.Id);
        
        Test.startTest();
        System.runAs(testUser) {
            List<ProjectCollaborationController.ProjectWrapper> results = 
                ProjectCollaborationController.getProjects('Approved');
            
            System.assertEquals(1, results.size(), 'Should return 1 project');
            
            ProjectCollaborationController.ProjectWrapper wrapper = results[0];
            System.assertNotEquals(null, wrapper.id, 'Project ID should not be null');
            System.assertNotEquals(null, wrapper.projectOrgId, 'Project Org ID should not be null');
            System.assertNotEquals(null, wrapper.name, 'Name should not be null');
            System.assertNotEquals(null, wrapper.collaborationStatus, 'Collaboration status should not be null');
            System.assertNotEquals(null, wrapper.description, 'Description should not be null');
            System.assertNotEquals(null, wrapper.startDate, 'Start date should not be null');
            System.assertNotEquals(null, wrapper.endDate, 'End date should not be null');
            System.assertNotEquals(null, wrapper.labNames, 'Lab names list should not be null');
            System.assertNotEquals(null, wrapper.labNamesDisplay, 'Lab names display should not be null');
            System.assertEquals(2, wrapper.labNames.size(), 'Should have 2 approved labs');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testErrorHandling() {
        // Test with invalid status filter (should still work, just return empty)
        User testUser = createTestUserWithoutAccount();
        
        Test.startTest();
        System.runAs(testUser) {
            try {
                List<ProjectCollaborationController.ProjectWrapper> results = 
                    ProjectCollaborationController.getProjects('InvalidStatus');
                System.assertNotEquals(null, results, 'Should return empty list, not null');
            } catch (Exception e) {
                System.assert(false, 'Should not throw exception for invalid status: ' + e.getMessage());
            }
        }
        Test.stopTest();
    }
    
    // Helper method to create a test user with account association
    private static User createTestUser(Id accountId) {
        Profile communityProfile = [SELECT Id FROM Profile WHERE Name = 'Customer Community User' OR Name LIKE '%Community%' LIMIT 1];
        
        Contact testContact = new Contact(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            AccountId = accountId
        );
        insert testContact;
        
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser' + DateTime.now().getTime() + '@example.com',
            Alias = 'tuser',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = communityProfile.Id,
            LanguageLocaleKey = 'en_US',
            ContactId = testContact.Id
        );
        insert testUser;
        
        return testUser;
    }
    
    // Helper method to create a test user without account association
    private static User createTestUserWithoutAccount() {
        Profile standardProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'NoAccount',
            Email = 'testnoaccount@example.com',
            Username = 'testnoaccount' + DateTime.now().getTime() + '@example.com',
            Alias = 'tnoacc',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = standardProfile.Id,
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;
        
        return testUser;
    }
}