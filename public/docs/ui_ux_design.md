# UI/UX Design for Product Management

This document outlines the User Interface (UI) and User Experience (UX) design for key product management features: Product Listing (with search and filtering) and the Product Input/Edit Form.

## General Considerations

*   **Target User:** Internal users managing product inventory and details.
*   **Design Philosophy:** Clean, intuitive, and efficient. Prioritize ease of use for common tasks.
*   **Responsiveness:** While not explicitly detailed here, the design should be adaptable to various screen sizes (desktop-first for this PIM).
*   **Component Library:** Assumes use of a modern JavaScript framework (e.g., Vue, React, or Svelte) and a UI component library (e.g., TailwindCSS UI, Bootstrap, Material Design components) for standard elements like buttons, forms, tables, modals, etc.

## 1. Product Listing Page

*   **Route:** `/products` (or a similar route within the application's frontend routing)
*   **Purpose:** Allow users to view, search, filter, and navigate to product variants. Provide access to create new products or edit/delete existing ones.

### 1.1. Layout

```
+--------------------------------------------------------------------------+
| Top Navigation Bar (App-wide)                                            |
+--------------------------------------------------------------------------+
| Page Title: "Products"                               [Add New Product] Button |
+--------------------------------------------------------------------------+
| Search Bar: [Enter SKU, Name, Family, Description...]                    |
+--------------------------------------------------------------------------+
| Filters Section (Collapsible or Sidebar)            | Product Table/Grid   |
| - Category: [Dropdown/Multi-select]                 |                      |
| - Product Family: [Dropdown/Multi-select]           | [Image] SKU   Name   |
| - (Advanced) Attribute: [Select Attribute]          | Family Cat.  Specs  |
|   - Value: [Input based on Attribute Type]          | Actions              |
| [Apply Filters] [Clear Filters]                     | ... (more rows) ...  |
|                                                     |                      |
|                                                     | Pagination Controls  |
|                                                     | < Prev | 1 | 2 | 3 | Next > |
+--------------------------------------------------------------------------+
```

*   **Main Title:** Prominently displayed (e.g., "Products").
*   **"Add New Product" Button:** Clearly visible, typically in the top-right of the content area. Navigates to the Product Input/Edit Form (`/products/new`).
*   **Search Bar:** A text input field allowing users to type search queries.
*   **Filter Section:**
    *   Can be a collapsible section above the table or a persistent sidebar.
    *   Contains various filter controls.
    *   "Apply Filters" and "Clear Filters" buttons.
*   **Product Table/Grid:** The main area displaying product variant information.
    *   Users might be able to toggle between a table view (dense information) and a grid view (more visual with larger images).
*   **Pagination Controls:** Standard pagination for navigating through large sets of products.

### 1.2. Product Table/Grid Columns

For each product variant:

1.  **Thumbnail Image:**
    *   Source: `ProductVariants.ImageURL`.
    *   Displays a small preview image.
    *   Placeholder if no image is available.
2.  **Variant SKU:**
    *   Source: `ProductVariants.VariantSKU`.
    *   Clickable, navigating to the Product Edit Form (`/products/{variant_sku}/edit`).
3.  **Variant Name:**
    *   Source: `ProductVariants.VariantName`.
4.  **Product Family Name:**
    *   Source: `ProductFamilies.FamilyName` (fetched via relation from `ProductVariants.ProductFamilyID` -> `ProductFamilies`).
5.  **Category Name:**
    *   Source: `Categories.CategoryName` (fetched via `ProductVariants.ProductFamilyID` -> `ProductFamilies.CategoryID` -> `Categories`).
6.  **Key Specifications (Summary):**
    *   Source: `ProductVariantSpecifications`.
    *   Displays a concise summary of important specs. E.g., "Color: Red, Size: XL".
    *   This might involve fetching the first 2-3 specifications by `DisplayOrder` or a predefined set of "key" attributes for display in the table.
    *   Alternatively, a "View Specs" popover/modal on hover/click.
7.  **Status:** (Optional, but good for visibility)
    *   Source: `ProductVariants.Status`
    *   Displayed as a badge or text (e.g., "Active", "Draft", "Discontinued").
8.  **Actions:**
    *   **Edit Button:** Icon button (e.g., pencil). Navigates to `/products/{variant_sku}/edit`.
    *   **Delete Button:** Icon button (e.g., trash can). Prompts for confirmation before deleting.
        *   API Call: `DELETE /productvariants/{variant_sku}`.
        *   On success, refresh product list.

### 1.3. Search Functionality

*   **User Interaction:** User types into the search bar. Search can be triggered on type (with debounce) or on pressing Enter/clicking a search icon.
*   **API Interaction:**
    *   An API call is made to `GET /productvariants?q={searchText}&page={page_num}&limit={page_size}`.
    *   The `q` parameter is used by the backend to perform the search.
*   **Backend Search Logic (Conceptual):**
    *   The backend should search across multiple relevant fields:
        *   `ProductVariants.VariantSKU`
        *   `ProductVariants.VariantName`
        *   `ProductVariants.Description`
        *   `ProductFamilies.FamilyName` (requires a join)
        *   `Categories.CategoryName` (requires joins)
        *   Potentially `ProductVariantSpecifications.AttributeValue` (more complex, may require dedicated search capabilities or a search index).
    *   Supabase Edge Functions could be used to implement complex search logic if direct table queries become inefficient.

### 1.4. Filtering Functionality

*   **Category Filter:**
    *   UI: Dropdown or multi-select list.
    *   Data: Populated by `GET /categories`.
    *   API: `GET /productvariants?category_id={selected_category_ids}`.
*   **Product Family Filter:**
    *   UI: Dropdown or multi-select list.
    *   Data: Populated by `GET /productfamilies`.
    *   Dependency: Optionally, this filter can be dependent on the Category filter. If a category is selected, only product families belonging to that category are shown/selectable.
        *   Client-side filtering of families after fetching all, or
        *   API: `GET /productfamilies?category_id={selected_category_id}` to populate.
    *   API: `GET /productvariants?product_family_id={selected_family_ids}`.
*   **Status Filter:** (If status column is prominent)
    *   UI: Dropdown with values like "Any", "Draft", "Active", "Discontinued".
    *   API: `GET /productvariants?status={selected_status}`.
*   **Advanced - Suggested Attribute Filtering (Example: "Material: Steel"):**
    *   UI:
        1.  User selects a "Filter by Attribute" option.
        2.  A dropdown appears, populated by `GET /suggestedattributes` (possibly filtered by selected Category/Product Family to narrow down relevant attributes).
        3.  Once an attribute is selected (e.g., "Material"), another input appears for the value (e.g., text input for "Steel"). The type of input could adapt based on `SuggestedAttributes.AttributeType`.
    *   API: This is more complex. It might require:
        *   `GET /productvariants?spec_attribute_id={attr_id}&spec_value={attr_value}`.
        *   The backend would need to join `ProductVariants` with `ProductVariantSpecifications` to filter.
*   **Applying Filters:**
    *   User configures filter controls.
    *   Clicks "Apply Filters" button (or filters apply on change with debounce).
    *   The product list re-fetches from `GET /productvariants` with all active filter parameters combined (e.g., `?category_id=1&product_family_id=5&q=searchTerm`).
*   **"Clear Filters" Button:** Resets all filter controls to their default state and re-fetches the product list without filter parameters.

### 1.5. API Interaction Summary for Listing Page

*   **Initial Load:** `GET /productvariants?page=1&limit=20` (or default pagination).
    *   Also, `GET /categories` and `GET /productfamilies` to populate filter dropdowns.
*   **Search:** `GET /productvariants?q={searchText}&{other_filters}&page=1&limit=20`.
*   **Filtering:** `GET /productvariants?{filter_params}&q={searchText_if_any}&page=1&limit=20`.
*   **Pagination:** `GET /productvariants?{current_filters_and_search}&page={newPageNum}&limit=20`.
*   **Delete Action:** `DELETE /productvariants/{variant_sku}`. Refresh list on success.

## 2. Product Input/Edit Form

*   **Routes:**
    *   Create: `/products/new`
    *   Edit: `/products/{variant_sku}/edit` (or `/products/{variant_id}/edit`)
*   **Purpose:** Allow users to create new product variants or modify existing ones, including their specifications.

### 2.1. Layout

```
+--------------------------------------------------------------------------+
| Top Navigation Bar (App-wide)                                            |
+--------------------------------------------------------------------------+
| Form Title: "Create New Product" / "Edit Product: [SKU]"                 |
+--------------------------------------------------------------------------+
| Section: Basic Information                                               |
|   Product Family: [Searchable Select/Dropdown ProductFamilyID]           |
|     (Auto-display: Category of selected Product Family)                  |
|   Variant Name*: [Text Input]                                            |
|   Variant SKU: [Text Input - Readonly if auto-generated on edit]         |
|   Description: [Text Area]                                               |
+--------------------------------------------------------------------------+
| Section: Specifications                                                  |
|   [Spec Attribute Name 1] [Spec Value 1] [Order] [Delete Spec Button]    |
|   [Spec Attribute Name 2] [Spec Value 2] [Order] [Delete Spec Button]    |
|   ... (existing specs if editing)                                        |
|   [Add Specification] Button                                             |
+--------------------------------------------------------------------------+
| Section: Image Management                                                |
|   Image URL: [Text Input / File Upload Component]                        |
|   [Image Preview]                                                        |
+--------------------------------------------------------------------------+
| Section: Image Management                                                |
|   Image URL: [Text Input / File Upload Component]                        |
|   [Image Preview]                                                        |
+--------------------------------------------------------------------------+
| Tabs: [Basic Info] [Specifications] [Images] [Costs] [BOM] (etc.)        |
+--------------------------------------------------------------------------+
| Section: Costs (Displayed if "Costs" tab is active)                      |
|   Table: List of Cost Entries                                            |
|     [Vendor] [Cost Price] [Currency] [From] [To] [Actions]               |
|   [Add Cost Entry] Button                                                |
|   (Read-only) Calculated Total Cost for BOM: [Value]                     |
+--------------------------------------------------------------------------+
| Section: (Future - Other aspects like Inventory, etc.)                   |
+--------------------------------------------------------------------------+
|                                                 [Save] Button [Cancel] Button |
+--------------------------------------------------------------------------+
```

*   **Form Title:** Dynamically changes based on create or edit mode.
*   **Sections / Tabs:** Logical grouping of fields. For a complex form like this, using Tabs for different aspects (Basic Info, Specifications, Images, Costs, BOM) is highly recommended to keep the UI clean. The main layout description above is simplified; in reality, fields from 2.2, 2.3, 2.4, and the new 2.x (Costs) would be within their respective tabs.
*   **Action Buttons:** "Save" (or "Create"), "Cancel". The "Save" button would save all changes across all tabs.

### 2.2. Basic Information Section (within "Basic Info" Tab)

*   **`ProductFamilyID` (Product Family):**
    *   UI: Searchable select or dropdown.
    *   Data: Populated by `GET /productfamilies`. User can search by family name or ID.
    *   On Selection:
        *   The system should display the Category associated with the selected Product Family (read-only display). This helps confirm the selection.
        *   This selection is critical as it determines the available suggested attributes for the "Specifications" section.
    *   Required.
*   **`VariantName`:**
    *   UI: Text input.
    *   Required.
*   **`VariantSKU`:**
    *   UI: Text input.
    *   Create Mode: Optional. If left blank, backend generates it (as per `ProductVariantSKU` Generation Logic). If filled, backend validates uniqueness.
    *   Edit Mode: Typically read-only if the SKU is system-generated and immutable, or editable if SKUs can be changed (less common for primary identifiers).
*   **`Description`:**
    *   UI: Text area.

### 2.3. Specifications Section (Dynamic)

This section allows users to manage `ProductVariantSpecifications`.

*   **Display (Edit Mode):**
    *   When editing a product, existing specifications are fetched and displayed as rows.
    *   Each row represents one `ProductVariantSpecification`.
*   **Each Specification Row:**
    *   **`AttributeName` (Attribute Name):**
        *   UI: Text input, ideally with an autocomplete/dropdown feature.
        *   Data Source for Autocomplete: `GET /suggestedattributes?product_family_id={selectedProductFamilyID}`. This provides relevant attribute suggestions.
        *   User can type a custom attribute name if it's not in the suggestions (backend will create a new `SuggestedAttribute` or link to existing if name matches for that family).
        *   Associated hidden field for `AttributeID` if an existing suggested attribute is selected.
    *   **`AttributeValue` (Value):**
        *   UI: Text input. (Future enhancement: input type could change based on `SuggestedAttribute.AttributeType`, e.g., a checkbox for Boolean).
    *   **`DisplayOrder` (Order):** (Optional)
        *   UI: Number input or drag-and-drop reordering of spec rows.
        *   Determines the display order of specifications on product detail pages or listings.
    *   **Delete Button (for each spec row):**
        *   UI: Icon button (trash can).
        *   Removes the specification from the form. On save, this spec will be removed from the variant.
*   **"Add Specification" Button:**
    *   UI: Button.
    *   Action: Adds a new empty/template row to the specifications list for the user to fill in.

### 2.4. Image Management Section

*   **`ImageURL`:**
    *   UI: Text input for pasting an image URL.
    *   Alternatively, a File Upload component.
        *   File upload would interact with Supabase Storage:
            1.  User selects file.
            2.  Frontend uploads file to a designated Supabase Storage bucket (e.g., `product-images`).
            3.  On successful upload, Supabase returns the public URL or a path to construct it.
            4.  This URL is then stored in the `ImageURL` field of the `ProductVariants` table.
*   **Image Preview:**
    *   UI: Displays the current image if `ImageURL` is populated and valid.

### 2.5. API Interaction

*   **Loading Form (Edit Mode):**
    *   `GET /productvariants/{variant_sku_or_id}`: Fetches the main product variant data and its associated `ProductVariantSpecifications`.
    *   `GET /productfamilies`: To populate the Product Family dropdown.
    *   If a product family is already selected (on load of edit form), `GET /suggestedattributes?product_family_id={currentFamilyID}` to prime suggestions.
*   **Saving (Create Mode - `POST /productvariants`):**
    *   Frontend collects data from all fields:
        *   `ProductFamilyID`
        *   `VariantName`
        *   `VariantSKU` (if provided by user)
        *   `Description`
        *   `ImageURL`
        *   An array of `specifications`, where each object is:
            ```json
            {
              // If user selected a suggested attribute:
              "AttributeID": 123, // ID of the selected SuggestedAttribute
              "AttributeValue": "Red"
              // If user typed a new attribute name for this family:
              // "AttributeName": "New Custom Spec", // Backend handles creating/finding SuggestedAttribute
              // "AttributeValue": "Custom Value"
              // For simplicity, the POST /productvariants API defined earlier expects AttributeID.
              // The frontend/service layer might need a pre-processing step if new attribute names are submitted
              // to create/resolve SuggestedAttributes before forming the final payload.
              // Or, the API could be designed to accept AttributeName directly.
              // Given current API:
              // "AttributeID": existing_or_newly_created_id,
              // "AttributeValue": "Value"
            }
            ```
            The API design for `POST /productvariants` included a `Specifications` array:
            `{ "AttributeID": ..., "AttributeValue": ... }`. The frontend needs to ensure `AttributeID` is resolved. If a user types a new attribute name not in `SuggestedAttributes` for that family, the frontend or a dedicated endpoint might first need to ensure that `SuggestedAttribute` exists or is created for that `ProductFamilyID` to get an `AttributeID`. A simpler approach for v1 is that the `AttributeName` input for specs *must* select from or match an existing `SuggestedAttribute` for the family.
    *   Payload sent to `POST /productvariants`. Backend handles creation of `ProductVariant` and `ProductVariantSpecifications` records in a transaction.
*   **Saving (Edit Mode - `PUT /productvariants/{variant_sku_or_id}`):**
    *   Frontend collects all (potentially modified) data.
    *   For specifications, the simplest approach (full replacement) is to send the complete list of current specifications in the form.
        *   The backend then deletes all existing `ProductVariantSpecifications` for that variant and inserts the new set. This must be transactional.
        *   A more granular API (e.g., `POST/PUT/DELETE /productvariants/{id}/specifications/{spec_id}`) is more complex to implement and manage on the frontend but more efficient for small changes. Full replacement is often acceptable for v1.
    *   Payload sent to `PUT /productvariants/{variant_sku_or_id}`.

### 2.6. Costs Tab (within Product Input/Edit Form)

*   **Purpose:** Manage `CostEntries` associated with the current product variant.
*   **Location:** A dedicated "Costs" tab within the Product Input/Edit Form.
*   **Layout:**
    ```
    +----------------------------------------------------------------------+
    | Costs Tab                                                            |
    +----------------------------------------------------------------------+
    | [Add Cost Entry] Button                                              |
    +----------------------------------------------------------------------+
    | Table: Cost Entries                                                  |
    |----------------------------------------------------------------------|
    | Vendor   | Cost Price | Currency | Valid From | Valid To   | Actions |
    |----------|------------|----------|------------|------------|---------|
    | Vendor A | 10.50      | USD      | 2023-01-01 | 2023-12-31 | Edit Del|
    | Vendor B | 12.00      | USD      | 2023-06-01 |            | Edit Del|
    | ...      | ...        | ...      | ...        | ...        | ...     |
    +----------------------------------------------------------------------+
    | (For BOM Assemblies) Calculated Total Cost: [Value]                  |
    +----------------------------------------------------------------------+
    ```
*   **Display:**
    *   A table listing existing `CostEntries` for the current `ProductVariantSKU`.
    *   Columns:
        *   `VendorName` (fetched by `VendorID` from `CostEntries` -> `Vendors` table)
        *   `CostPrice` (`CostEntries.CostPrice`)
        *   `Currency` (`CostEntries.Currency`)
        *   `ValidFrom` (`CostEntries.ValidFrom`)
        *   `ValidTo` (`CostEntries.ValidTo`)
        *   (Optional: `CostType`, `CostDescription`, `QuantityForPrice`, `Notes` if these are commonly needed at a glance, or visible in edit modal)
        *   Actions: "Edit" and "Delete" buttons for each cost entry.
*   **"Add/Edit Cost Entry" Form (Modal):**
    *   Triggered by "Add Cost Entry" button or "Edit" button in the table.
    *   `ProductVariantSKU` (or `VariantID`) is pre-filled and likely read-only in this context.
    *   Form Fields:
        *   `VendorID` (Vendor): Searchable Select/Dropdown populated from `GET /vendors`. Required.
        *   `CostPrice`: Number input. Required.
        *   `Currency`: Text input or Dropdown (e.g., "USD", "EUR"). Default to "USD". Required.
        *   `ValidFrom`: Date picker. Defaults to today.
        *   `ValidTo`: Date picker. Optional.
        *   `Notes`: Text area. Optional.
        *   (Optional fields from schema: `CostType` as a dropdown e.g. "Purchase", "Landed"; `CostDescription` as text input; `QuantityForPrice` as number input if cost varies by volume)
    *   Buttons: "Save Cost", "Cancel".
*   **API Interactions (Costs Tab):**
    *   **Load Cost Entries:** When the "Costs" tab is opened, or when the product form loads:
        *   `GET /costentries?variant_id={current_variant_id}` (or `variant_sku={current_variant_sku}`).
    *   **Create Cost Entry:** `POST /costentries` with data from the modal form. Refresh cost entries table on success.
        *   Payload includes `VariantID`, `VendorID`, `CostPrice`, `Currency`, etc.
    *   **Update Cost Entry:** `PUT /costentries/{cost_entry_id}` with data from the modal form. Refresh table on success.
    *   **Delete Cost Entry:** `DELETE /costentries/{cost_entry_id}` after confirmation. Refresh table on success.
*   **Calculated Total Cost Display (Read-only, for BOMs/Assemblies):**
    *   If the `ProductVariant` being edited is an assembly (i.e., it has components in `BillOfMaterials`):
    *   A read-only field could display a "Calculated Total Cost" or "Sum of Component Costs".
    *   **Conceptual Calculation Flow:**
        1.  Fetch the BOM for the current assembly variant: `GET /boms?assembly_variant_id={current_variant_id}`.
        2.  For each `ComponentVariantID` in the BOM:
            *   Fetch its most relevant/current cost: `GET /costentries?variant_id={component_variant_id}&active_date={current_date}` (or a similar query to get the best cost, e.g., from a preferred vendor or latest valid). This might involve some backend logic or a more specific API endpoint if cost selection is complex.
            *   Multiply the component's cost by `BOM.Quantity`.
        3.  Sum these calculated costs for all components.
    *   This is a complex read operation and might be better handled by a dedicated API endpoint like `GET /productvariants/{variant_id}/calculated-bom-cost` if it's a common requirement, to encapsulate the logic on the backend. For UI display, it provides valuable information.

### 2.7. Client-Side Validation

*   Implement client-side checks for:
    *   Required fields (e.g., Product Family, Variant Name).
    *   Data formats (e.g., valid URL for Image URL if not using file upload).
    *   Basic logic (e.g., ensure specification attribute name/value are filled if a row is added).
*   This provides immediate feedback to the user.
*   Server-side validation (as per `validation_strategy.md`) is the authoritative source of truth.

## 3. Mock Flow Example: Creating a New Product

1.  **User navigates to `/products`**.
    *   API: `GET /productvariants`, `GET /categories`, `GET /productfamilies`.
2.  **User clicks "Add New Product"**.
    *   Navigates to `/products/new`.
    *   API: `GET /productfamilies` (to populate dropdown).
3.  **User selects "Electronics Components" (a Product Family) from the dropdown.**
    *   Frontend stores the selected `ProductFamilyID`.
    *   Frontend makes `GET /suggestedattributes?product_family_id={selectedFamilyID}` to populate attribute suggestions for later.
    *   (UI displays the Category "Electronics" associated with the family).
4.  **User fills in:**
    *   Variant Name: "Resistor 10k Ohm"
    *   Variant SKU: (leaves blank for auto-generation)
    *   Description: "Standard 1/4W 10k Ohm resistor."
5.  **User adds specifications:**
    *   Clicks "Add Specification".
    *   Row 1:
        *   Attribute Name: Selects "Resistance" (an existing `SuggestedAttribute` for this family, `AttributeID=55`).
        *   Value: "10k Ohm"
    *   Clicks "Add Specification".
    *   Row 2:
        *   Attribute Name: Selects "Tolerance" (`AttributeID=56`).
        *   Value: "5%"
6.  **User sets Image URL (e.g., pastes a URL or uploads a file).**
7.  **User clicks "Save".**
    *   Client-side validation runs.
    *   Frontend constructs payload:
        ```json
        {
          "ProductFamilyID": "ELEC_COMP-001", // ID for "Electronics Components"
          "VariantName": "Resistor 10k Ohm",
          "Description": "Standard 1/4W 10k Ohm resistor.",
          "ImageURL": "...",
          "Specifications": [
            { "AttributeID": 55, "AttributeValue": "10k Ohm" },
            { "AttributeID": 56, "AttributeValue": "5%" }
          ]
        }
        ```
    *   API: `POST /productvariants` with the payload.
8.  **Backend processes:**
    *   Validates data.
    *   Generates `VariantSKU` (e.g., "VAR-0000123").
    *   Creates `ProductVariants` record.
    *   Creates `ProductVariantSpecifications` records.
    *   Returns `201 Created` with the new product variant object.
9.  **Frontend receives success response.**
    *   Redirects to the product listing page (`/products`) or the edit page for the new product (`/products/VAR-0000123/edit`).
    *   Displays a success notification.
    *   The new product appears in the list (if redirected to listing).

This detailed description should cover the UI/UX design and its mapping to the API for the specified features.## Mock Flow Example: Creating a New Product

1.  **User navigates to `/products`**.
    *   API: `GET /productvariants`, `GET /categories`, `GET /productfamilies`.
2.  **User clicks "Add New Product"**.
    *   Navigates to `/products/new`.
    *   API: `GET /productfamilies` (to populate dropdown).
3.  **User selects "Electronics Components" (a Product Family) from the dropdown.**
    *   Frontend stores the selected `ProductFamilyID`.
    *   Frontend makes `GET /suggestedattributes?product_family_id={selectedFamilyID}` to populate attribute suggestions for later.
    *   (UI displays the Category "Electronics" associated with the family).
4.  **User fills in:**
    *   Variant Name: "Resistor 10k Ohm"
    *   Variant SKU: (leaves blank for auto-generation)
    *   Description: "Standard 1/4W 10k Ohm resistor."
5.  **User adds specifications:**
    *   Clicks "Add Specification".
    *   Row 1:
        *   Attribute Name: Selects "Resistance" (an existing `SuggestedAttribute` for this family, `AttributeID=55`).
        *   Value: "10k Ohm"
    *   Clicks "Add Specification".
    *   Row 2:
        *   Attribute Name: Selects "Tolerance" (`AttributeID=56`).
        *   Value: "5%"
6.  **User sets Image URL (e.g., pastes a URL or uploads a file).**
7.  **User clicks "Save".**
    *   Client-side validation runs.
    *   Frontend constructs payload:
        ```json
        {
          "ProductFamilyID": "ELEC_COMP-001", // ID for "Electronics Components"
          "VariantName": "Resistor 10k Ohm",
          "Description": "Standard 1/4W 10k Ohm resistor.",
          "ImageURL": "...",
          "Specifications": [
            { "AttributeID": 55, "AttributeValue": "10k Ohm" },
            { "AttributeID": 56, "AttributeValue": "5%" }
          ]
        }
        ```
    *   API: `POST /productvariants` with the payload.
8.  **Backend processes:**
    *   Validates data.
    *   Generates `VariantSKU` (e.g., "VAR-0000123").
    *   Creates `ProductVariants` record.
    *   Creates `ProductVariantSpecifications` records.
    *   Returns `201 Created` with the new product variant object.
9.  **Frontend receives success response.**
    *   Redirects to the product listing page (`/products`) or the edit page for the new product (`/products/VAR-0000123/edit`).
    *   Displays a success notification.
    *   The new product appears in the list (if redirected to listing).

This detailed description should cover the UI/UX design and its mapping to the API for the specified features.

## 4. Category Management

*   **Route:** `/categories` (or a similar route, e.g., `/admin/categories`)
*   **Purpose:** Allow users to create, view, edit, and delete product categories, managing their hierarchical structure.

### 4.1. Category Management Page Layout

```
+--------------------------------------------------------------------------+
| Top Navigation Bar (App-wide)                                            |
+--------------------------------------------------------------------------+
| Page Title: "Manage Categories"                     [Add New Category] Button |
+--------------------------------------------------------------------------+
|                                                                          |
| Category Display Area (Tree View Preferred)                              |
|                                                                          |
|  [-] Electronics (ELEC)                                                  |
|      L Edit | Delete                                                     |
|      |                                                                   |
|      +-- [-] Computers & Laptops (COMP)                                  |
|      |   L Edit | Delete                                                 |
|      |   |                                                               |
|      |   +-- [ ] Desktops (DESK)                                         |
|      |   |   L Edit | Delete                                             |
|      |   +-- [ ] Laptops (LAPT)                                          |
|      |       L Edit | Delete                                             |
|      |                                                                   |
|      +-- [ ] Mobile Phones (PHONE)                                       |
|          L Edit | Delete                                                 |
|                                                                          |
|  [ ] Apparel (APRL)                                                      |
|      L Edit | Delete                                                     |
|                                                                          |
|  ... (other top-level categories) ...                                    |
|                                                                          |
+--------------------------------------------------------------------------+
```

*   **Main Title:** "Manage Categories".
*   **"Add New Category" Button:** Prominently displayed. Opens the "Add New Category" modal/form.
*   **Display Area for Categories:**
    *   **Preferred Method: Tree View:**
        *   Visually represents the parent-child hierarchy.
        *   Each node in the tree displays `CategoryName` and `CategoryCode` (e.g., "Electronics (ELEC)").
        *   Nodes can be expanded/collapsed to show/hide child categories.
        *   Each node should have "Edit" and "Delete" action buttons/icons associated with it. Clicking "Edit" opens the edit modal for that category. Clicking "Delete" initiates the delete process.
    *   **Alternative Method (Table View):**
        *   If a tree view component is too complex for the initial version.
        *   Columns: `CategoryName`, `CategoryCode`, `ParentCategoryName` (derived by looking up `ParentCategoryID` in the list of categories), `Description`.
        *   Action buttons ("Edit", "Delete") per row.
        *   Sorting by columns could be useful (e.g., by `CategoryName` or `ParentCategoryName`).
        *   Representing hierarchy in a flat table can be less intuitive but is functional. Indentation or path strings (e.g., "Electronics > Computers") could be used to suggest hierarchy.

### 4.2. "Add New Category" / "Edit Category" Form (Modal Dialog)

Using a modal dialog is preferred for quick create/edit operations without full page navigation.

*   **Form Title:** "Add New Category" or "Edit Category: [CategoryName]".
*   **Form Fields:**
    *   **`CategoryName`:**
        *   UI: Text input.
        *   Validation: Required, String.
    *   **`CategoryCode`:**
        *   UI: Text input.
        *   Validation: Required, String, unique. Frontend can check format (e.g., alphanumeric, max 10 chars). Backend enforces uniqueness via API (`409 Conflict` if code exists).
        *   Note: For editing, `CategoryCode` might be read-only if it's a critical identifier that shouldn't change, or editable with warnings about potential impact.
    *   **`ParentCategoryID` (Parent Category):**
        *   UI: Dropdown or searchable select list.
        *   Data: Populated by `GET /categories`. The list should display category names.
        *   Options:
            *   Include an option like "-- None --" or "-- Top-Level Category --" which maps to `null` for `ParentCategoryID`.
        *   Validation:
            *   If a category is selected as parent, its `CategoryID` is used.
            *   When editing a category, this dropdown should not list the category itself or any ofits descendants as potential parents (to prevent circular dependencies). This requires some client-side logic to filter the list.
    *   **`Description`:**
        *   UI: Text area.
        *   Validation: Optional, String.
*   **Action Buttons:**
    *   "Save" Button: Submits the form.
    *   "Cancel" Button: Closes the modal without saving.

### 4.3. API Interactions

*   **Loading Categories (for Tree/Table View):**
    *   `GET /categories`: Fetches all categories.
    *   The frontend then processes this flat list to build the hierarchical tree structure (if using a tree view) by linking `CategoryID` with `ParentCategoryID`.
*   **Creating a Category:**
    *   User fills the "Add New Category" form.
    *   On Save, `POST /categories` with the payload:
        ```json
        {
          "CategoryName": "Digital Cameras",
          "CategoryCode": "DCAM",
          "ParentCategoryID": 123, // ID of "Electronics" or null
          "Description": "All types of digital cameras."
        }
        ```
    *   On success (e.g., `201 Created`), refresh the category list/tree and close the modal.
*   **Updating a Category:**
    *   User edits an existing category via the form.
    *   On Save, `PUT /categories/{category_id}` with the payload (similar to create).
    *   On success (e.g., `200 OK`), refresh the category list/tree (or update the specific node) and close the modal.
*   **Deleting a Category:**
    *   User clicks the "Delete" button for a category.
    *   **UI Confirmation:** Display a confirmation dialog (e.g., "Are you sure you want to delete the category '[CategoryName]'? This action cannot be undone.").
    *   If confirmed, `DELETE /categories/{category_id}`.
    *   **Backend Logic & UI Response:**
        *   If successful (`204 No Content`): Refresh the category list/tree.
        *   If deletion is restricted by the backend (e.g., `ON DELETE RESTRICT` due to `ProductFamilies` or child `Categories` referencing it, resulting in a `409 Conflict`):
            *   The UI should catch this error and display a user-friendly message (e.g., "Cannot delete category '[CategoryName]' because it is currently in use by product families or contains sub-categories. Please reassign or remove these links before deleting.").
            *   The `ON DELETE SET NULL` for `ParentCategoryID` in the `Categories` table means child categories themselves won't prevent deletion of a parent (they'd become top-level), but `ProductFamilies` have `ON DELETE RESTRICT` on `CategoryID`.

### 4.4. Managing Hierarchy

*   **Presentation:** The tree view is the most intuitive way to display the hierarchy. Each node's children are categories where `ParentCategoryID` matches the node's `CategoryID`.
*   **Modification:**
    *   Changing a category's parent is done by selecting a new parent in the "Edit Category" form's `ParentCategoryID` dropdown.
    *   The frontend logic for the `ParentCategoryID` dropdown in edit mode must be careful to exclude the category itself and its descendants to prevent circular dependencies. This involves:
        1.  Identifying the category being edited (`currentCategoryID`).
        2.  Building a list of all its descendant `CategoryID`s by traversing the category tree.
        3.  Filtering the list of potential parents to exclude `currentCategoryID` and all its descendants.

This design provides a comprehensive approach to managing hierarchical categories within the application.

## 5. Client Management

*   **Route:** `/clients`
*   **Purpose:** Allow users to create, view, edit, search, and delete client records.

### 5.1. Client Listing Page Layout

```
+--------------------------------------------------------------------------+
| Top Navigation Bar (App-wide)                                            |
+--------------------------------------------------------------------------+
| Page Title: "Clients"                                  [Add New Client] Button |
+--------------------------------------------------------------------------+
| Search Bar: [Enter Name, Email, Client Code...]                          |
+--------------------------------------------------------------------------+
| Filters (Optional - e.g., by Client Type/Group)       | Client Table/Grid |
|   - Client Type: [Dropdown]                           |                   |
| [Apply Filters] [Clear Filters]                     | [ClientCode] Name |
|                                                     | Contact Email Ph. |
|                                                     | City Country Actions|
|                                                     | ... (more rows) ...|
|                                                     |                    |
|                                                     | Pagination Controls|
+--------------------------------------------------------------------------+
```

*   **Main Title:** "Clients".
*   **"Add New Client" Button:** Navigates to the "Add/Edit Client" form/page.
*   **Search Bar:** Text input for searching clients.
*   **Filter Options (Optional):**
    *   By `ClientType` (e.g., "Individual", "Business") if this field is actively used.
*   **Client Table/Grid:** Displays client information.
*   **Pagination Controls.**

### 5.2. Client Table/Grid Columns

1.  **`ClientID` (or `ClientCode` if implemented and preferred for display):** `Clients.ClientID`.
2.  **`ClientName`:** `Clients.ClientName`. Clickable to edit page.
3.  **`ContactName`:** `Clients.ContactName`.
4.  **`ContactEmail`:** `Clients.ContactEmail`.
5.  **`ContactPhone`:** `Clients.ContactPhone`.
6.  **`City`:** `Clients.City`.
7.  **`Country`:** `Clients.Country`.
8.  **Actions:** "Edit", "Delete" buttons.

### 5.3. "Add New Client" / "Edit Client" Form (Page or Modal)

*   **Form Title:** "Add New Client" or "Edit Client: [ClientName]".
*   **Form Fields (based on `Clients` table):**
    *   `ClientName` (Text input, required)
    *   `ContactName` (Text input)
    *   `ContactEmail` (Email input, unique)
    *   `ContactPhone` (Text input)
    *   `Address` (Text area)
    *   `City` (Text input)
    *   `State` (Text input)
    *   `Country` (Text input or dropdown)
    *   `PostalCode` (Text input)
    *   `ClientType` (Dropdown, e.g., "Individual", "Business")
    *   `RegistrationDate` (Date picker, defaults to today, optional)
    *   `Notes` (Text area)
*   **Action Buttons:** "Save", "Cancel".

### 5.4. API Interactions

*   **Load Clients:** `GET /clients` (with pagination, search, filter query parameters).
    *   Example: `GET /clients?page=1&limit=20&q=searchTerm&client_type=Business`
*   **Get Single Client (for edit form):** `GET /clients/{client_id}`.
*   **Create Client:** `POST /clients` with form data.
*   **Update Client:** `PUT /clients/{client_id}` with form data.
*   **Delete Client:** `DELETE /clients/{client_id}` (with confirmation dialog).

## 6. Vendor Management

*   **Route:** `/vendors`
*   **Purpose:** Allow users to create, view, edit, search, and delete vendor records.

### 6.1. Vendor Listing Page Layout

```
+--------------------------------------------------------------------------+
| Top Navigation Bar (App-wide)                                            |
+--------------------------------------------------------------------------+
| Page Title: "Vendors"                                   [Add New Vendor] Button |
+--------------------------------------------------------------------------+
| Search Bar: [Enter Name, Email, Vendor Code...]                          |
+--------------------------------------------------------------------------+
| Filters (Optional - e.g., by Preferred Vendor)        | Vendor Table/Grid  |
|   - Preferred: [Checkbox/Dropdown]                    |                    |
| [Apply Filters] [Clear Filters]                     | [VendorCode] Name  |
|                                                     | Contact Email Ph.  |
|                                                     | City Country Actions|
|                                                     | ... (more rows) ...|
|                                                     |                    |
|                                                     | Pagination Controls|
+--------------------------------------------------------------------------+
```

*   **Main Title:** "Vendors".
*   **"Add New Vendor" Button:** Navigates to the "Add/Edit Vendor" form/page.
*   **Search Bar:** Text input for searching vendors.
*   **Filter Options (Optional):**
    *   `PreferredVendor` (Boolean: Yes/No/Any).
    *   `VendorRating` (e.g., 1-5 stars).
*   **Vendor Table/Grid:** Displays vendor information.
*   **Pagination Controls.**

### 6.2. Vendor Table/Grid Columns

1.  **`VendorID` (or `VendorCode` if implemented):** `Vendors.VendorID`.
2.  **`VendorName`:** `Vendors.VendorName`. Clickable to edit page.
3.  **`ContactName`:** `Vendors.ContactName`.
4.  **`ContactEmail`:** `Vendors.ContactEmail`.
5.  **`ContactPhone`:** `Vendors.ContactPhone`.
6.  **`City`:** `Vendors.City`.
7.  **`Country`:** `Vendors.Country`.
8.  **`PreferredVendor`:** `Vendors.PreferredVendor` (e.g., displayed as Yes/No or an icon).
9.  **`VendorRating`:** `Vendors.VendorRating` (e.g., displayed as stars).
10. **Actions:** "Edit", "Delete" buttons.

### 6.3. "Add New Vendor" / "Edit Vendor" Form (Page or Modal)

*   **Form Title:** "Add New Vendor" or "Edit Vendor: [VendorName]".
*   **Form Fields (based on `Vendors` table):**
    *   `VendorName` (Text input, required)
    *   `ContactName` (Text input)
    *   `ContactEmail` (Email input, unique)
    *   `ContactPhone` (Text input)
    *   `Address` (Text area)
    *   `City` (Text input)
    *   `State` (Text input)
    *   `Country` (Text input or dropdown)
    *   `PostalCode` (Text input)
    *   `PreferredVendor` (Checkbox)
    *   `VendorRating` (Number input 1-5, or star rating component)
    *   `Notes` (Text area)
*   **Action Buttons:** "Save", "Cancel".

### 6.4. API Interactions

*   **Load Vendors:** `GET /vendors` (with pagination, search, filter query parameters).
    *   Example: `GET /vendors?page=1&limit=20&q=searchTerm&preferred=true`
*   **Get Single Vendor (for edit form):** `GET /vendors/{vendor_id}`.
*   **Create Vendor:** `POST /vendors` with form data.
*   **Update Vendor:** `PUT /vendors/{vendor_id}` with form data.
*   **Delete Vendor:** `DELETE /vendors/{vendor_id}` (with confirmation dialog and error handling for restricted deletion if linked to `CostEntries`).
