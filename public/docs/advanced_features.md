# Advanced Features and Considerations

This document outlines the design for data import/export functionality and provides considerations for other advanced features that could enhance the Product Information Management (PIM) system.

## 1. Data Import

Data import is crucial for bulk creation and updating of product information, especially during initial setup or when migrating data from other systems.

### 1.1. Scope

*   **Priority for Initial Implementation:**
    *   **`ProductVariants` (including `ProductVariantSpecifications`):** This is often the most complex and voluminous data.
    *   **`CostEntries`:** Essential for associating costs with product variants.
*   **Future Enhancements (Other Entities):**
    *   `Categories`
    *   `ProductFamilies`
    *   `Clients`
    *   `Vendors`
    *   `BillOfMaterials`

### 1.2. UI/Process for Data Import

A dedicated "Data Import" section or page within the application (e.g., `/admin/import`).

**Step 1: Select Data Type to Import**
*   UI: Dropdown list.
*   Options: "Product Variants (with Specifications)", "Cost Entries". (Expands as more entities are supported).

**Step 2: Download CSV/Excel Template**
*   UI: A "Download Template" button appears after selecting the data type.
*   Functionality: Generates and downloads a template file with predefined columns.
*   **Template Columns (Examples):**
    *   **Product Variants (+ Specs) Template:**
        *   `ProductFamilyID` (Required; must exist)
        *   `VariantName` (Required)
        *   `VariantSKU` (Optional on create - system generates if blank; Required for update to identify record)
        *   `Description`
        *   `ImageURL`
        *   `Status` (e.g., Draft, Active)
        *   **Handling Specifications (Choose one approach):**
            *   **Dynamic Columns:** `Spec:Color`, `Spec:Size`, `Spec:Material`. The template could include common ones, or users add `Spec:<AttributeName>` columns as needed. Backend parses "Spec:" prefix.
            *   **Normalized Specs (Separate Rows/File - More Complex):** A separate CSV for specs like `VariantSKU, AttributeName, AttributeValue`. This is more robust for many specs but harder for users and requires linking.
            *   **JSON in a Column (Less User-Friendly for Excel):** A 'Specifications' column with JSON string `[{"AttributeName": "Color", "AttributeValue": "Red"}, ...]`.
            *   **Recommendation for v1:** Dynamic `Spec:<AttributeName>` columns for simplicity in a single file.
    *   **Cost Entries Template:**
        *   `VariantSKU` (Required; must exist in `ProductVariants`)
        *   `VendorName` (Required; must exist in `Vendors` - backend resolves to `VendorID`) or `VendorID`
        *   `CostPrice` (Required)
        *   `Currency` (Default: USD)
        *   `ValidFrom` (Format: YYYY-MM-DD, Default: Today)
        *   `ValidTo` (Format: YYYY-MM-DD, Optional)
        *   `Notes`

**Step 3: Upload File**
*   UI: A file input field (drag-and-drop support is a plus).
*   Accepts: CSV or Excel (e.g., XLSX) files.

**Step 4: Column Mapping (If file headers don't match template exactly)**
*   UI:
    *   Displays columns found in the uploaded file (first row headers).
    *   Next to each, a dropdown shows system fields for the selected data type.
    *   System attempts to auto-map based on header names matching template.
    *   User can manually adjust mappings or ignore columns from the uploaded file.
*   This step is crucial for flexibility if users upload files from other sources that don't perfectly match the template.

**Step 5: Data Validation & Preview**
*   Backend Process:
    *   The uploaded file (or a sample) is sent to a Supabase Edge Function.
    *   The Edge Function parses the file based on mappings.
    *   **Validation Logic:**
        *   Checks for required fields.
        *   Validates data types (e.g., numbers, dates).
        *   Checks for existence of foreign keys (e.g., `ProductFamilyID` must exist, `VariantSKU` for `CostEntries` must exist).
        *   For `ProductVariants` import:
            *   If `VariantSKU` is present, it's an **update** operation for that variant.
            *   If `VariantSKU` is absent (or a "Create New" column is TRUE), it's a **create** operation.
        *   For `Spec:<AttributeName>` columns: Backend identifies these, finds/creates `SuggestedAttributeID` for the family, then prepares `ProductVariantSpecification` data.
*   UI Feedback:
    *   Displays a preview of a few rows of interpreted data.
    *   Shows a summary: "X rows to be created", "Y rows to be updated", "Z rows with errors".
    *   Lists errors and warnings with row numbers and specific issues (e.g., "Row 5: ProductFamilyID 'INVALID-PF' not found.", "Row 8: CostPrice is not a valid number.").
    *   Option to download an error log file.
    *   User cannot proceed to import if critical errors exist.

**Step 6: Confirmation & Import**
*   UI: A "Start Import" button (enabled if no critical errors).
    *   A warning message about data changes.
*   Backend Process:
    *   The full file is processed by an Edge Function.
    *   For large files, this should be an **asynchronous background job**:
        1.  File uploaded to Supabase Storage.
        2.  Edge Function triggered, records import job status in a DB table.
        3.  Edge Function processes rows in batches, creating/updating records.
        4.  Updates import job status (e.g., "Processing X of Y rows", "Completed", "Failed").
        5.  Logs any errors encountered during import per row.
*   UI Feedback (for async import):
    *   Initial: "Import started. You will be notified upon completion."
    *   Progress indicator if possible (e.g., "Processing 500 of 2000 rows").
    *   Final: "Import Complete. X records successfully imported, Y records failed."
    *   Link to download a detailed error log for failed records.

### 1.3. Backend Considerations (Supabase Edge Function)

*   **Parsing:** Use libraries for parsing CSV (e.g., `papaparse`) or Excel files (e.g., `xlsx`).
*   **Data Validation:** Implement robust validation logic as outlined in `validation_strategy.md` and specific import checks.
*   **Database Operations:**
    *   Use Supabase client library for database interactions.
    *   Batch inserts/updates for better performance.
    *   Handle transactions carefully, especially for Product Variants + Specifications (all or nothing for a single variant's data).
*   **Error Handling & Logging:** Comprehensive logging of errors, linked to specific rows in the input file.
*   **Asynchronous Processing:** For large files, use Supabase Storage for temporary file storage and trigger Edge Functions that can run longer or manage a queue.

## 2. Data Export

Allows users to extract data from the system for external analysis, backup, or transfer.

### 2.1. Scope

*   **Priority:**
    *   `ProductVariants` (including their specifications).
    *   `CostEntries`.
*   **Future Enhancements:** Other entities as needed.

### 2.2. UI/Process for Data Export

*   **Location:**
    *   **Option 1 (Preferred):** "Export" button on the relevant listing pages (e.g., Product Listing, Cost Entries page if one exists). The export should respect any active filters and search terms on the list page.
    *   **Option 2 (Dedicated Section):** A dedicated "Data Export" section where users select entity type and apply filters before exporting.
*   **Steps:**
    1.  User navigates to the listing page (e.g., `/products`).
    2.  Applies any desired search or filters.
    3.  Clicks an "Export" button.
    4.  (Optional) A small modal appears to:
        *   Confirm number of records to be exported.
        *   Select export format (default to CSV; Excel could be an option).
        *   Select columns to export (defaults to all key columns, user can deselect some).
    5.  User confirms.
*   **File Download:** The browser initiates a file download.

### 2.3. Backend Considerations (Supabase Edge Function)

*   **Trigger:** Frontend calls an Edge Function, passing current filter parameters, selected columns, and desired format.
*   **Data Fetching:** The Edge Function queries the database based on the provided filters.
    *   For Product Variants with specifications, this involves fetching variants and then their related specifications, then denormalizing into a flat CSV structure (e.g., `Spec:<AttributeName>` columns).
*   **Formatting:** Formats data into CSV (or other selected format).
*   **Streaming (for large datasets):** For very large exports, the Edge Function should stream the data directly to the client to avoid memory issues and long delays, rather than generating the entire file in memory.
*   **Response Headers:** Set appropriate HTTP headers for file download (e.g., `Content-Disposition`, `Content-Type`).

## 3. Other Advanced Features (Brief Outline)

This section provides a brief outline of other advanced features that could be considered for future development.

### 3.1. Mimicking Power Query Logic (Data Transformation/Calculation)

*   The initial data modeling and API design aim to store data in a structured way, reducing the need for extensive Power Query-like transformations that were used for data cleaning in the Excel prototype.
*   **Candidates for specific calculations/transformations (if still needed):**
    *   **Calculated Fields:** If certain fields need to be derived from other fields consistently (e.g., a special pricing tier based on cost + margin percentage), these could be:
        *   Implemented as database generated columns (if simple).
        *   Calculated by Supabase Edge Functions and stored, or returned dynamically via API.
        *   Handled by database views or functions.
    *   **Data Aggregations:** For specific reporting needs not covered by direct queries (e.g., complex sales analytics if sales data were integrated).
*   **Focus:** Identify specific, recurring calculation or transformation needs as they arise post-MVP.

### 3.2. Enhanced UI/UX

*   **Responsive Design:**
    *   Ensure the application is usable on various screen sizes (tablets, potentially mobile for read-only scenarios). This is an ongoing refinement task.
*   **Dashboards:**
    *   A simple dashboard page could provide at-a-glance information.
    *   **Potential Widgets:**
        *   Counts: Number of Product Variants, Product Families, Categories, Clients, Vendors.
        *   Lists: Recently Modified Product Variants, Recently Added Cost Entries.
        *   Alerts: Products without any Cost Entries, Products with low stock (if inventory is added).
    *   API: Requires several `GET` calls with count aggregations or specific queries.
*   **Bulk Actions:**
    *   On listing pages (e.g., Product Listing), allow users to select multiple items via checkboxes.
    *   **Potential Bulk Actions:**
        *   Bulk Delete (with confirmation).
        *   Bulk Assign Category/Family to selected products.
        *   Bulk Update Status for selected products.
        *   Bulk Add/Remove from a "Collection" (if such a concept is introduced).
    *   API: Requires dedicated endpoints (e.g., `POST /productvariants/bulk-delete` with a list of IDs).

### 3.3. Reporting & Analytics

*   Basic reporting capabilities can provide valuable insights. Reports could be generated as downloadable CSVs or displayed in a simple UI table.
*   **Example Basic Reports:**
    1.  **Products per Category:** Lists categories and the count of product families/variants within each.
    2.  **CostEntries per Vendor:** Lists vendors and the number of active cost entries associated with them, perhaps with average cost price.
    3.  **Product Variants without Cost Entries:** Highlights products that may need pricing/costing attention.
    4.  **Product Variants by Status:** Counts of products in 'Draft', 'Active', 'Discontinued' status.
*   API: Backend (Edge Functions) would perform the necessary queries, aggregations, and formatting.

### 3.4. Advanced Search & Filtering

*   **Saving Search Presets/Filters:** Allow users to save complex filter combinations and search queries for quick reuse.
*   **Range Filtering:** For numeric specifications or dates (e.g., "CostPrice between X and Y", "EffectiveDate within last 30 days").
*   **Full-Text Search Enhancements:** Explore more advanced full-text search capabilities in PostgreSQL if basic `LIKE` queries become insufficient (e.g., using `tsvector` and `tsquery`). Supabase supports this.
*   **Faceted Search:** For product listings, allow users to progressively refine searches by clicking on attribute values (e.g., after searching "laptops", show counts of brands, screen sizes, RAM options from the results, and allow clicking on these to filter further). This is common in e-commerce.

These advanced features would significantly extend the PIM's capabilities beyond core data management, providing more powerful tools for users. Prioritization would depend on user feedback and business needs.
