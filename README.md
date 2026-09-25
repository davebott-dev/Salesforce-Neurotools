# UNC NeuroTools Salesforce — Project Collaboration & Partner Portal

## Overview

The UNC NeuroTools Salesforce implementation provides an Experience Cloud partner portal for laboratories to browse NeuroTools inventory, create virus orders, manage carts, submit orders, and participate in collaborative research projects.

The system is built on Salesforce Experience Cloud with custom Lightning Web Components (LWCs), Apex controllers, Screen Flows, custom objects, and Salesforce CLI/VS Code development.

The current architecture supports:

* Experience Cloud partner authentication
* Lab/organization-based access
* NeuroTools inventory selection
* Client-specific inventory permissions
* Stock-virus ordering
* Custom virus ordering
* Shopping cart functionality
* Multi-order checkout
* Purchase order, credit card, and chartfield billing
* Shipping calculations
* Order submission
* Packing-list generation
* Project collaboration between laboratories
* Per-lab collaboration approval
* Project-level access control
* Responsive Experience Cloud interfaces

---

# 1. Salesforce Architecture

## Salesforce Org

The Salesforce implementation is maintained in the **UNC Core Facilities / UNC NeuroTools** Salesforce org.

The Experience Cloud site is used as the client-facing NeuroTools portal.

### Primary portal

The Experience Cloud site uses the Partner Central template and provides authenticated partner users with access to NeuroTools ordering and collaboration functionality.

The general architecture is:

```text
Experience Cloud Partner Portal
        |
        +-- Authentication
        |
        +-- Lab / Organization
        |
        +-- NeuroTools Inventory
        |
        +-- Order Form
        |
        +-- Construct Selector
        |
        +-- Order Review
        |
        +-- Cart
        |
        +-- Checkout
        |
        +-- Order Submission
        |
        +-- Virus Orders
        |
        +-- Packing List
        |
        +-- Project Collaboration
```

---

# 2. Development Architecture

The project is developed using:

* Salesforce DX
* VS Code
* Salesforce CLI
* Apex
* Lightning Web Components
* Salesforce Flows
* Custom Objects
* Custom Fields
* Experience Cloud

Metadata is stored under:

```text
force-app/main/default/
```

Deployment can be performed with Salesforce CLI:

```bash
sf project deploy start --source-path force-app/main/default
```

Individual metadata components can also be deployed independently.

---

# 3. Experience Cloud User Architecture

Experience Cloud users represent external laboratory users.

Users are associated with an organization/lab through their Contact and Account relationships.

The general relationship is:

```text
User
 |
 +-- Contact
       |
       +-- Account / Organization
```

The Account represents the laboratory or organization.

The organization is used throughout the application to determine what inventory, projects, orders, and collaboration records the user can access.

## Partner Access

Partner users are authenticated through the Experience Cloud site.

The current partner access model uses Salesforce Experience Cloud users associated with NeuroTools laboratory accounts.

Access is controlled through:

* Experience Cloud membership
* Profiles/permission sets
* Object permissions
* Field-level security
* Sharing rules
* Apex `with sharing`
* Organization/lab relationships
* Application-level filtering

---

# 4. Core Data Model

## Account

`Account`

Represents a laboratory or organization.

Important usage:

* Identifies the user's laboratory
* Stores organization information
* Provides the organizational relationship for Contacts
* Controls access to lab-specific inventory and collaboration records

---

# 5. Virus Ordering Architecture

The NeuroTools ordering system supports both custom virus production and stock-virus ordering.

The high-level order process is:

```text
Experience Cloud
      |
      v
Order Form
      |
      v
Construct / Inventory Selection
      |
      v
Order Review
      |
      v
Cart
      |
      v
Checkout
      |
      v
Order Submission
      |
      v
Virus Order / Opportunity
```

---

# 6. Neuro Inventory

## NeuroInventory__c

The NeuroTools inventory system stores available constructs and inventory information.

Inventory can be filtered based on:

* Virus type
* Inventory family
* Promoter/enhancer
* Permissions
* Requesting lab

### Inventory permissions

Inventory records can be available globally or to a specific laboratory.

The Construct Selector uses logic equivalent to:

```text
Permissions = Global
OR
Requesting_Lab = Current User's Lab
```

This allows NeuroTools to maintain both globally available constructs and lab-specific inventory.

---

# 7. Construct Selector

## ConstructSelector LWC

The Construct Selector allows users to select an available construct during the ordering process.

### Inputs

The component receives the virus type from the Flow.

### Outputs

The selected inventory record is returned to the Flow.

### Features

* Virus-type filtering
* NeuroTools/client inventory tabs
* Search
* Promoter/enhancer filtering
* Lab-specific inventory permissions
* Global inventory visibility
* Selected-row highlighting
* Non-selected row dimming
* Clear-selection functionality

The component uses:

```text
ConstructSelectorController
```

to retrieve inventory records.

The Apex controller uses `with sharing`.

---

# 8. Stock Virus Ordering

The system also supports ordering existing stock virus products.

The stock inventory architecture is:

```text
Product2
   |
   +-- Stock_Batch__c
          |
          +-- Tubes Remaining
          |
          +-- Titer
          |
          +-- Transfection ID
```

## Product2

Stock products are identified through the Product2 record.

Important fields include:

* `Family`
* `Virus_Type__c`
* `End_Use__c`
* `Construct__c`
* `Capsid_Envelope__c`

Stock products use:

```text
Family = Stock
```

---

## Stock_Batch__c

Tracks individual stock batches.

Important fields include:

* `Stock_Product__c`
* `Titer__c`
* `Tubes_Remaining__c`
* `Tubes_Remaining_num_val__c`
* `Transfection_ID__c`

Stock ordering checks the number of tubes available before adding inventory to the cart.

---

# 9. Draft Virus Orders

## Draft_Virus_Order__c

Draft orders are created before the final order is submitted.

Important fields include:

* `Contact__c`
* `Custom_or_Stock__c`
* `Base_Product__c`
* `Expression_Construct_Name__c`
* `Capsid_Envelope_Name__c`
* `Type__c`
* `End_Use__c`
* `Quantity__c`
* `stock_tubes_requested__c`
* `Selected_AAV_Stock_Batch_ID__c`
* `Shipping_Address__c`

Additional ordering fields support requirements such as:

* Endotoxin testing
* Enriched full preparation
* DNA submission
* Construct information
* Production quantities

---

# 10. Cart Architecture

## Cart__c

The cart is used as an intermediate stage between creating draft orders and submitting orders.

Important fields include:

* `Contact__c`
* `Status__c`
* `Last_Submission_Time__c`
* `Shipping_Preference__c`

## Cart_Item__c

`Cart_Item__c` acts as the bridge between the cart and individual draft virus orders.

The relationship is approximately:

```text
Cart__c
   |
   +-- Cart_Item__c
           |
           +-- Draft_Virus_Order__c
```

This allows multiple virus orders to exist within the same shopping cart.

---

# 11. Cart and Order Components

Current LWCs include:

### `ConstructSelector`

Allows the client to select an eligible NeuroTools construct.

### `OrderReviewScreen`

Displays selected order information and allows the user to review order details before adding them to the cart.

### `cartCheckout`

Handles checkout and billing.

### `CartSubmissionScreen`

Handles final cart submission.

### `VirusOrderExport`

Generates the post-submission packing-list/export workflow.

---

# 12. Checkout

The checkout component supports multiple billing methods.

Supported billing types include:

* Purchase Order
* Credit Card
* Chartfield

The checkout process also supports:

* Add PO Later
* Multiple orders
* Billing assignments
* Shipping preference
* Lab-specific pricing
* Shipping charges
* Order total validation

The checkout LWC receives information from Flow including:

```text
flowContactId
labType
contactCountry
contactOrganization
selectedRowsInput
PO records
Credit Card records
Chartfield records
```

---

# 13. Purchase Orders

Purchase orders can be uploaded during checkout.

The current implementation supports validation that:

* A PO file has been provided
* The selected file is appropriate for the PO workflow
* The PO information is associated with the appropriate order
* The PO amount covers the applicable order cost

The checkout process supports **Add PO Later** for applicable orders.

When selected, the billing type is represented as:

```text
PO
```

with the PO-later flag enabled.

---

# 14. Credit Card Checkout

Credit card billing includes additional validation for large orders.

Orders above the configured threshold require confirmation before proceeding.

The current validation uses:

```text
$5,000
```

as the threshold requiring confirmation.

---

# 15. Chartfield Billing

Chartfield billing is supported through the checkout workflow.

The system allows billing information to be associated with individual orders rather than requiring every order in a cart to use the same billing method.

This is important because users may select different billing methods for different virus orders in the same cart.

---

# 16. Shipping

Shipping costs are calculated based on the laboratory and destination.

Current business rules include:

* Internal lab shipping: `$0`
* Domestic shipping: `$100`
* International shipping: `$170`

The checkout flow also supports a shipping preference such as:

```text
SINGLE
```

for consolidating applicable orders.

---

# 17. Project Collaboration

## Project Collaboration View

The Project Collaboration functionality allows laboratories to participate in collaborative projects through the Experience Cloud portal.

Projects are displayed using a card-based Lightning Web Component.

The component separates projects into:

* Active Collaborations
* Pending Requests

---

# 18. Project__c

`Project__c` represents the collaborative project itself.

Important fields include:

* `Name`
* `Description__c`
* `Start_Date__c`
* `End_Date__c`

The Project record contains information about the project but does **not** contain the individual laboratory collaboration status.

---

# 19. Project_Organization__c

`Project_Organization__c` is the junction object between projects and laboratories.

It connects:

```text
Project__c
     |
     +-- Project_Organization__c
              |
              +-- Account
```

Important fields:

* `Project__c`
* `Organization__c`
* `Status__c`

---

# 20. Per-Lab Collaboration Status

A major architectural decision was moving collaboration status from the Project level to the Project/Organization junction level.

### Current design

```text
Project
 |
 +-- Lab A → Approved
 |
 +-- Lab B → Approved
 |
 +-- Lab C → Pending
 |
 +-- Lab D → Rejected
```

This allows each laboratory to independently manage its participation.

### Status values

| Status   | Meaning                                    |
| -------- | ------------------------------------------ |
| Pending  | Collaboration request is awaiting approval |
| Approved | Laboratory has approved participation      |
| Rejected | Laboratory has rejected participation      |

`Rejected` is optional depending on the final picklist configuration.

---

# 21. Project Collaboration Access

The Project Collaboration component uses the current user's laboratory to determine which project records are available.

The process is:

```text
Current User
     |
     v
Contact
     |
     v
Account / Lab
     |
     v
Project_Organization__c
     |
     +-- Pending
     |
     +-- Approved
```

Users only see projects for which their laboratory has a corresponding `Project_Organization__c` record.

---

# 22. Active Collaborations

The **Active Collaborations** tab displays projects where the user's laboratory has:

```text
Status__c = Approved
```

For each project, the component can display the other laboratories that also have:

```text
Status__c = Approved
```

This prevents laboratories with pending or rejected participation from appearing as active collaborators.

---

# 23. Pending Requests

The **Pending Requests** tab displays projects where the user's laboratory has:

```text
Status__c = Pending
```

This allows the laboratory to identify collaboration invitations awaiting approval.

Once the status changes to:

```text
Approved
```

the project moves into the user's active collaborations.

---

# 24. Project Collaboration LWC

## `projectCollaborationView`

The component provides:

* Card-based project display
* Active Collaboration tab
* Pending Requests tab
* Record counts
* Clickable project cards
* Project detail navigation
* Refresh functionality
* Loading spinner
* Empty states
* Responsive styling
* Multi-lab collaboration display

The component is configurable through Experience Builder.

### Configuration

Current configurable property:

```text
Show Refresh Button
```

Default:

```text
true
```

---

# 25. ProjectCollaborationController

The Apex controller is responsible for retrieving project collaboration information.

The controller:

1. Identifies the current user's laboratory
2. Finds `Project_Organization__c` records for that laboratory
3. Filters based on collaboration status
4. Retrieves associated projects
5. Retrieves approved collaborating laboratories
6. Builds wrapper objects for the LWC
7. Returns project information to the Experience Cloud component

The controller uses:

```apex
with sharing
```

and security enforcement.

---

# 26. Project Collaboration Testing

## ProjectCollaborationControllerTest

The test class covers:

* Active collaboration retrieval
* Pending collaboration retrieval
* All project retrieval
* No-access scenarios
* Wrapper field validation
* Error handling
* Collaboration status behavior

The goal is complete Apex code coverage for the controller.

---

# 27. Order Submission

The current submission architecture separates the cart from the final submitted virus orders.

The general process is:

```text
Cart
 |
 +-- Selected Draft Orders
 |
 v
CartSubmissionScreen
 |
 v
Submit_Cart
 |
 v
Virus Orders
```

The submission Flow passes selected order IDs and billing information into the submission process.

---

# 28. Virus Orders

The final virus order is represented by the Salesforce Opportunity architecture.

The ordering system uses Opportunities as the final Virus Order record.

This allows NeuroTools to use Salesforce's existing opportunity functionality while exposing a custom ordering experience to external users.

---

# 29. Packing List

The `VirusOrderExport` LWC and related Apex controller support packing-list generation after order submission.

The packing-list process receives the submitted virus order IDs from Flow.

The server-side controller filters the orders before generating the packing list.

---

# 30. Client DNA Packing List Filtering

Packing lists only include orders where:

```text
Client_Sending_DNA__c = Yes
```

Orders where:

```text
Client_Sending_DNA__c = No
```

are excluded from the packing list.

The packing list includes relevant fields such as:

* Order number
* Expression construct
* Capsid/envelope
* Client DNA concentration
* Requestor
* Created date

The concentration field is formatted with:

```text
µg/µL
```

---

# 31. Packing List Controller

## VirusOrderPackingListController

The controller retrieves the submitted Virus Orders and filters them server-side.

Relevant fields include:

```text
Order_Number__c
Expression_Construct_Name__c
Capsid_Envelope_Name__c
Client_DNA_concentration__c
Client_Sending_DNA__c
Requestor__r.Name
CreatedDate
```

Records are ordered by:

```text
CreatedDate ASC
```

---

# 32. Flow Architecture

Flows are used heavily throughout the NeuroTools portal.

Flows coordinate:

* Order form screens
* Inventory selection
* Order review
* Cart creation
* Checkout
* Billing
* Order submission
* Packing-list generation

LWCs communicate with Flows through Flow inputs and outputs.

For example:

```text
Flow
 |
 +-- ConstructSelector
 |
 +-- OrderReviewScreen
 |
 +-- Cart
 |
 +-- cartCheckout
 |
 +-- CartSubmissionScreen
 |
 +-- VirusOrderExport
```

---

# 33. Flow/LWC Communication

LWCs use Flow attributes to pass data between screens.

Examples include:

```text
selectedOrderIds
billingAssignments
flowContactId
labType
contactCountry
shippingPreference
virusOrderIds
```

The system uses Flow attribute-change events when component outputs need to be updated.

This is especially important for multi-screen cart workflows where the selected rows can change as users move between screens.

---

# 34. Security Model

Security is implemented at multiple levels.

## Apex

Controllers use:

```apex
with sharing
```

where appropriate.

SOQL queries use Salesforce security enforcement where supported.

## Salesforce Security

Access is controlled using:

* Profiles
* Permission sets
* Object permissions
* Field-level security
* Sharing
* Experience Cloud membership
* Account/Contact relationships

## Application-Level Security

The application additionally restricts data based on the user's laboratory.

For example:

```text
Current User
     |
     v
Contact
     |
     v
Account
     |
     v
Lab-specific records
```

This is particularly important for:

* Inventory
* Project collaboration
* Orders
* Draft orders

---

# 35. Lab-Specific Inventory Security

The Construct Selector does not simply expose every inventory record.

Inventory visibility is based on permissions such as:

```text
Global
```

or the user's requesting laboratory.

This allows NeuroTools to maintain private or laboratory-specific constructs while still exposing globally available inventory.

---

# 36. Experience Cloud UI

The portal uses custom LWCs instead of relying exclusively on standard Salesforce components.

This provides a more application-like experience for external laboratories.

Current custom UI functionality includes:

* Order forms
* Inventory selectors
* Order review
* Cart
* Checkout
* Billing modals
* Project collaboration cards
* Packing-list export

---

# 37. Current LWC Components

Important current components include:

| Component                     | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `ConstructSelector`           | Select eligible inventory/construct   |
| `OrderReviewScreen`           | Review virus order information        |
| `cartCheckout`                | Checkout and billing                  |
| `CartSubmissionScreen`        | Submit cart                           |
| `VirusOrderExport`            | Generate packing-list/export workflow |
| `projectCollaborationView`    | Display collaborative projects        |
| `LWC_Purchase_Order_Modal`    | Purchase-order workflow               |
| `LWC_Credit_Card_Modal`       | Credit-card workflow                  |
| `LWC_Chartfield_String_Modal` | Chartfield billing workflow           |

---

# 38. Current Custom Objects

The NeuroTools implementation currently uses a number of custom objects supporting the ordering and collaboration architecture.

Important objects include:

```text
Project__c
Project_Organization__c
Cart__c
Cart_Item__c
Draft_Virus_Order__c
NeuroInventory__c
Stock_Batch__c
```

Salesforce standard objects are also used, including:

```text
Account
Contact
User
Product2
Opportunity
```

---

# 39. Deprecated Project Collaboration Architecture

The original Project Collaboration implementation placed the collaboration status directly on the Project.

### Deprecated

```text
Project__c
   |
   +-- Status__c
```

This architecture did not support independent approval status for each laboratory.

### Current

```text
Project__c
   |
   +-- Project_Organization__c
           |
           +-- Organization__c
           +-- Status__c
```

The current architecture should be used for all new development.

---

# 40. Project Collaboration Business Rules

The current business rules are:

1. A Project represents the collaborative research project.
2. A Project Organization record represents one laboratory's participation.
3. Each laboratory has its own collaboration status.
4. `Pending` means the laboratory has an outstanding collaboration request.
5. `Approved` means the laboratory has accepted participation.
6. `Rejected` means the laboratory has declined participation.
7. A laboratory can only access projects where it has a Project Organization record.
8. Only approved laboratories should appear as active collaborators.
9. Project collaboration status belongs on `Project_Organization__c`, not `Project__c`.

---

# 41. Example Collaboration

Suppose Lab A creates a project and invites Lab B and Lab C.

The records would look like:

```text
Project: Neural Circuit Mapping

Project Organization Records:

Lab A → Approved
Lab B → Pending
Lab C → Pending
```

Lab A sees the project as an active collaboration.

Lab B and Lab C see the project as a pending request.

If Lab B approves:

```text
Lab A → Approved
Lab B → Approved
Lab C → Pending
```

The active collaborators are now Lab A and Lab B.

Lab C remains pending and is not displayed as an approved collaborator.

---

# 42. Testing

Apex tests are maintained for custom controllers.

Example:

```bash
sf apex run test \
  --class-names ProjectCollaborationControllerTest \
  --result-format human \
  --code-coverage
```

Test results can be retrieved using:

```bash
sf apex get test --test-run-id <TEST_RUN_ID>
```

Tests should cover:

* Successful queries
* No-data conditions
* Security/access scenarios
* Status filtering
* Wrapper values
* Error handling
* Lab-specific access
* Stock inventory behavior
* Packing-list filtering

---

# 43. Deployment

The project is deployed using Salesforce CLI.

Full metadata deployment:

```bash
sf project deploy start \
  --source-path force-app/main/default
```

Individual components can also be deployed:

```bash
sf project deploy start \
  --source-path force-app/main/default/lwc/projectCollaborationView
```

Apex classes can be deployed individually:

```bash
sf project deploy start \
  --source-path force-app/main/default/classes/ProjectCollaborationController.cls
```

---

# 44. Source Control

Salesforce metadata is maintained in Git.

The repository contains the Salesforce DX project structure, including:

```text
force-app/
  main/
    default/
      classes/
      lwc/
      objects/
      flows/
      permissionsets/
      profiles/
      ...
```

The repository should contain source metadata rather than manually maintained copies of Salesforce configuration.

---

# 45. Development Workflow

The general development workflow is:

```text
Salesforce Org
      |
      v
Retrieve Metadata
      |
      v
VS Code
      |
      v
Modify Apex / LWC / Flow / Metadata
      |
      v
Test
      |
      v
Salesforce CLI
      |
      v
Deploy
      |
      v
Experience Cloud Testing
```

Changes should be tested with appropriate Salesforce users, particularly Experience Cloud partner users, because internal Salesforce users and external partner users can have different access.

---

# 46. Important Development Considerations

### Experience Cloud users

Do not assume that:

```apex
$User.ContactId
```

will always be populated in every execution context.

The ordering architecture therefore explicitly passes contact/user information through Flow where necessary.

### Record IDs

Do not hard-code sandbox or production Salesforce IDs into Apex, Flows, LWCs, or tests.

### Lab access

Always consider the user's Account/Organization when creating queries that return partner-facing data.

### Status fields

The location of a status field is important.

For project collaboration:

```text
Project_Organization__c.Status__c
```

is the authoritative collaboration status.

---

# 47. Troubleshooting

## No projects are displayed

Check:

1. The Experience Cloud user has an associated Contact.
2. The Contact has an Account.
3. The Account represents the correct laboratory.
4. A `Project_Organization__c` record exists.
5. `Project_Organization__c.Organization__c` points to the correct Account.
6. `Status__c` is `Approved` or `Pending`.
7. The user has the required object and field permissions.

---

## No inventory is displayed

Check:

1. The virus type passed into the Construct Selector is correct.
2. The inventory record has the expected `Virus_Type__c`.
3. The record has the appropriate `Inventory_Family__c`.
4. The record's permissions allow the current laboratory to see it.
5. The current user has a Contact/Account relationship when lab-specific inventory is required.

---

## Checkout fails

Check:

1. Contact information
2. Organization information
3. Selected order IDs
4. Billing assignments
5. PO information
6. Credit-card validation
7. Chartfield information
8. Shipping country
9. Shipping preference
10. Draft order relationships

---

## Packing list contains unexpected orders

Check:

```text
Client_Sending_DNA__c
```

Only orders with:

```text
Client_Sending_DNA__c = Yes
```

should appear on the client-DNA packing list.

---

# 48. Current Architecture Summary

The current NeuroTools Salesforce architecture can be summarized as:

```text
                    EXPERIENCE CLOUD
                          |
                          v
                    Partner User
                          |
                          v
                   Contact / Account
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
      Inventory        Projects         Orders
          |               |               |
          v               v               v
 ConstructSelector   Project__c       Draft Order
          |               |               |
          |        Project_Organization  Cart
          |               |               |
          |               v               v
          |          Lab Status        Checkout
          |               |               |
          |               v               v
          |        Approved/Pending   Billing/Shipping
          |                               |
          +-------------------------------+
                          |
                          v
                    Virus Order
                    (Opportunity)
                          |
                          v
                    Packing List
```

---

# 49. Version History

## v2.0.0 — Current NeuroTools Portal Architecture

* Experience Cloud partner portal architecture documented
* Lab/account-based access documented
* Construct Selector and inventory permissions documented
* Stock-virus ordering documented
* Draft order architecture documented
* Cart architecture documented
* Checkout and billing workflows documented
* Purchase order workflow documented
* Credit-card validation documented
* Chartfield billing documented
* Shipping rules documented
* Cart submission architecture documented
* Virus Order/Opportunity architecture documented
* Packing-list generation documented
* Client DNA packing-list filtering documented
* Project collaboration architecture updated
* Per-lab collaboration status documented
* Experience Cloud security model documented
* Salesforce CLI/VS Code deployment documented
* Git/source-control workflow documented

## v1.1.0

* Per-lab collaboration status
* `Status__c` moved to `Project_Organization__c`
* Active Collaborations and Pending Requests tabs
* Approved collaborator filtering
* Card-based project display
* Click-to-navigate
* Refresh functionality
* Responsive UI

## v1.0.0 — Deprecated

* Project-level collaboration status
* `Status__c` previously stored on `Project__c`
* Did not support independent collaboration status for each laboratory

---

# 50. Key Design Principles

The current NeuroTools implementation follows several important architectural principles:

### Lab-based access

The laboratory/Account is a central part of determining what an external user can access.

### Junction-object status

Relationships between laboratories and projects require their own status rather than storing the status on the parent Project.

### Flow-driven orchestration

Flows coordinate multi-screen business processes while LWCs provide custom user interfaces.

### Apex for server-side logic

Apex handles data retrieval, security, aggregation, and business logic that cannot be handled efficiently in the client.

### Server-side filtering

Sensitive or business-critical filtering should occur server-side rather than relying solely on JavaScript.

### Reusable LWCs

The portal uses separate components for inventory selection, order review, checkout, submission, and export functionality.

### Salesforce-native data model

Salesforce standard objects such as Account, Contact, Product2, and Opportunity are integrated with custom objects rather than duplicating their functionality unnecessarily.

---

# 51. Support and Maintenance

When modifying the system:

1. Identify the Salesforce object and relationship involved.
2. Verify the current API names.
3. Check Experience Cloud user access.
4. Check object and field-level security.
5. Review Apex sharing behavior.
6. Test with an actual partner user when applicable.
7. Test Flow input/output variables.
8. Run Apex tests.
9. Deploy through Salesforce CLI.
10. Verify the Experience Cloud site after deployment.

The most important architectural reference for project collaboration is:

```text
Project__c
    ↓
Project_Organization__c
    ↓
Organization__c / Account
    ↓
Status__c
```

The most important architectural reference for ordering is:

```text
Inventory
    ↓
Draft_Virus_Order__c
    ↓
Cart__c / Cart_Item__c
    ↓
Checkout
    ↓
Submission
    ↓
Opportunity / Virus Order
    ↓
Packing List
```
