# Testing Strategy

This document outlines the comprehensive testing strategy for the Product Information Management (PIM) system. The goal is to ensure the application is reliable, functional, performs well, and meets user requirements.

## 1. Levels of Testing

### 1.1. Unit Tests

*   **Objective:** To test individual, isolated units of code (e.g., functions, components, modules) to ensure they work correctly.
*   **Scope & Key Areas:**
    *   **Supabase Edge Functions:**
        *   Item number generation logic (e.g., `ProductFamilyID`, `ProductVariantSKU` generation).
        *   Data validation functions within Edge Functions (if complex).
        *   Any specific data transformation logic (e.g., for import/export).
        *   Security rule logic if implemented within functions.
    *   **Frontend Components (e.g., React, Vue, Svelte):**
        *   Critical utility functions or hooks (e.g., complex data formatting, state management logic).
        *   Validation functions used within forms (client-side).
        *   Components with complex conditional rendering or internal logic.
    *   **Tools:**
        *   Backend (Edge Functions): Deno's built-in testing tools, or Jest/Vitest if preferred and compatible.
        *   Frontend: Jest, Vitest, React Testing Library, Vue Test Utils, Svelte Testing Library.

### 1.2. Integration Tests

*   **Objective:** To test the interaction between different parts of the system.
*   **Scope & Scenarios:**
    *   **Frontend - API Interaction:**
        *   Verify that frontend components correctly call Supabase API endpoints (CRUD operations for each entity).
        *   Test response handling (success and error cases).
        *   Ensure data fetched from APIs is correctly displayed in UI components.
        *   Test form submissions and data persistence.
    *   **Edge Function - Database Interaction:**
        *   Verify that Edge Functions correctly interact with the Supabase database (e.g., creating, reading, updating, deleting records as expected).
        *   Test data integrity after Edge Function operations (e.g., foreign key relationships, constraints).
        *   Test behavior of RLS policies when accessed by Edge Functions under different roles.
    *   **Tools:**
        *   Frontend: Mocking API calls (e.g., using `msw` - Mock Service Worker, or Jest/Vitest mocks for Supabase client).
        *   Backend: Testing Edge Functions by invoking them with mock data or against a test Supabase instance/schema.

### 1.3. End-to-End (E2E) Tests

*   **Objective:** To test complete user workflows from the user's perspective, simulating real user scenarios.
*   **Scope & Critical Scenarios (Examples):**
    1.  **Full Product Creation Workflow:**
        *   Create a new Category.
        *   Create a new Product Family within that Category.
        *   Create a new Product Variant within that Product Family, including adding multiple specifications.
        *   Add at least two Cost Entries for the Product Variant from different Vendors.
        *   Verify the Product Variant appears correctly in the product listing page with accurate family, category, and summarized spec info.
        *   Verify the cost entries are listed correctly on the Product Variant's "Costs" tab.
    2.  **Product Edit Workflow:**
        *   Open an existing Product Variant for editing.
        *   Modify its name, description, and status.
        *   Add a new specification and delete an existing one.
        *   Update a Cost Entry.
        *   Save changes and verify all updates are reflected in the product list and detail views.
    3.  **Category Management Workflow:**
        *   Create a top-level category.
        *   Create a sub-category under it.
        *   Edit the sub-category's name and code.
        *   Re-parent the sub-category to another existing category (or make it top-level).
        *   Delete a category (ensure confirmation and handling of restrictions if in use).
    4.  **Client & Vendor CRUD:**
        *   Successfully create a new Client. View it in the list. Edit its details. Delete it.
        *   Successfully create a new Vendor. View it in the list. Edit its details. Delete it (consider restrictions if linked to costs).
    5.  **Data Import (Product Variants):**
        *   Download the Product Variants CSV template.
        *   Fill it with 2-3 new product variants (including specifications) and 1-2 existing variants to update (identified by SKU).
        *   Upload the CSV, map columns (if necessary).
        *   Review validation preview (expecting success for new, update for existing).
        *   Confirm and run the import.
        *   Verify new products are created and existing ones are updated in the system.
    6.  **Data Export (Product Variants):**
        *   Navigate to the product listing page.
        *   Apply a filter (e.g., by Category).
        *   Click "Export" and download the CSV.
        *   Verify the CSV contains the correct filtered data and columns (including specifications).
    7.  **Search and Filtering on Product List:**
        *   Search for a product by name/SKU. Verify results.
        *   Filter products by Category and then by Product Family. Verify results.
        *   Combine search and filter. Verify results.
*   **Tools:** Cypress, Playwright, Puppeteer.

### 1.4. User Acceptance Testing (UAT)

*   **Objective:** To validate that the system meets the business requirements and is acceptable to the end-users.
*   **Process:**
    *   Driven by the client and key end-users.
    *   A UAT plan should be created, outlining specific test cases and scenarios based on the documented requirements, UI/UX designs, and user stories.
    *   Users execute these test cases in a staging environment that closely mirrors production.
    *   Feedback, bugs, and change requests are collected and prioritized.
    *   Sign-off from UAT participants is required before production deployment.
*   **Key UAT Participants:**
    *   (Placeholder for client to list names/roles of their UAT team members)
    *   Example: Product Manager, Data Entry Lead, Sales Representative (if using client data).
*   **Deliverables:** UAT Plan, UAT Test Cases, UAT Feedback Log, UAT Sign-off.

## 2. Non-Functional Testing

### 2.1. Performance Testing (Basic)

*   **Objective:** To ensure the application performs acceptably under expected load.
*   **Key Operations to Monitor:**
    1.  **Product List Load Time:** Time taken to load the main product listing page, especially with a significant number of product variants (e.g., 1,000+ if applicable).
    2.  **Complex Search/Filter Response Time:** Time taken to get results for searches with multiple terms or filters applied on large datasets.
    3.  **Data Import Processing Time:** Time taken to import a moderately sized CSV file (e.g., 100-500 rows).
*   **Approach:**
    *   Manual observation during development and testing phases.
    *   Use browser developer tools (Network tab, Performance tab) to identify bottlenecks.
    *   Supabase dashboard can provide insights into query performance.
    *   For more formal testing, tools like k6 or JMeter could be used, but this might be out of scope for basic performance checks.

### 2.2. Security Testing (Basic)

*   **Objective:** To identify and mitigate basic security vulnerabilities.
*   **Key Areas:**
    *   **Supabase Row Level Security (RLS):**
        *   Review RLS policies for all critical tables to ensure users can only access and modify data they are permitted to.
        *   Test policies with different user roles (if applicable).
    *   **Supabase Edge Function Security:**
        *   Ensure Edge Functions have appropriate security measures (e.g., validating user authentication, input sanitization if handling raw user input directly, though most input comes from trusted frontend).
        *   Ensure sensitive operations are protected.
    *   **Frontend:**
        *   Ensure Supabase client is used correctly (anon key is public, service key is kept secret on backend).
        *   Basic checks for XSS if user-generated content is displayed without proper sanitization (though modern frameworks often handle this).
*   **Approach:** Manual review and testing of RLS policies and Edge Function access.

## 3. Test Environment

*   A dedicated **Staging Environment** (a separate Supabase project or schema, and a separate frontend deployment) that mirrors the production setup is crucial for UAT and pre-production testing.
*   Test data should be representative of real data, if possible (anonymized).

This testing strategy provides a framework for ensuring the quality and reliability of the PIM system. It should be adapted and expanded as the project evolves.
