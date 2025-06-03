-- Function to update UpdatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UpdatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Categories Table
CREATE TABLE "Categories" (
    "CategoryID" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(255) NOT NULL,
    "CategoryCode" VARCHAR(10) NOT NULL UNIQUE, -- e.g., HTOOL, SSERV
    "ParentCategoryID" INTEGER REFERENCES "Categories"("CategoryID") ON DELETE SET NULL, -- Allow NULL for top-level categories
    "Description" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON "Categories"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ProductFamilies Table
CREATE TABLE "ProductFamilies" (
    "ProductFamilyID" VARCHAR(50) PRIMARY KEY, -- Manually generated, e.g., HTOOL-0001
    "CategoryID" INTEGER NOT NULL REFERENCES "Categories"("CategoryID") ON DELETE RESTRICT, -- Restrict deletion if product families exist
    "FamilyName" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_product_families_updated_at
BEFORE UPDATE ON "ProductFamilies"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- SuggestedAttributes Table
CREATE TABLE "SuggestedAttributes" (
    "AttributeID" SERIAL PRIMARY KEY,
    "ProductFamilyID" VARCHAR(50) NOT NULL REFERENCES "ProductFamilies"("ProductFamilyID") ON DELETE CASCADE, -- Cascade delete if product family is deleted
    "AttributeName" VARCHAR(255) NOT NULL, -- e.g., "Color", "Size", "Material"
    "AttributeType" VARCHAR(50) DEFAULT 'Text', -- e.g., "Text", "Number", "Boolean", "Date"
    "IsRequired" BOOLEAN DEFAULT FALSE,
    "DefaultValue" VARCHAR(255),
    "Description" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("ProductFamilyID", "AttributeName") -- Ensure attribute names are unique within a product family
);

CREATE TRIGGER update_suggested_attributes_updated_at
BEFORE UPDATE ON "SuggestedAttributes"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ProductVariants Table
CREATE TABLE "ProductVariants" (
    "VariantID" SERIAL PRIMARY KEY,
    "ProductFamilyID" VARCHAR(50) NOT NULL REFERENCES "ProductFamilies"("ProductFamilyID") ON DELETE RESTRICT,
    "VariantSKU" VARCHAR(100) UNIQUE, -- Optional: Can be manually set or auto-generated
    "VariantName" VARCHAR(255) NOT NULL, -- e.g., "Red T-Shirt, Large"
    "Description" TEXT,
    "ImageURL" VARCHAR(2048),
    "Status" VARCHAR(50) DEFAULT 'Draft', -- e.g., Draft, Active, Discontinued
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON "ProductVariants"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ProductVariantSpecifications Table
-- This table stores the specific values for each attribute of a product variant.
CREATE TABLE "ProductVariantSpecifications" (
    "SpecificationID" SERIAL PRIMARY KEY,
    "VariantID" INTEGER NOT NULL REFERENCES "ProductVariants"("VariantID") ON DELETE CASCADE,
    "AttributeID" INTEGER NOT NULL REFERENCES "SuggestedAttributes"("AttributeID") ON DELETE RESTRICT, -- Restrict if specs point to it
    "AttributeValue" VARCHAR(255) NOT NULL, -- Value for the attribute, e.g., "Red", "XL"
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("VariantID", "AttributeID") -- Each attribute can only be specified once per variant
);

CREATE TRIGGER update_product_variant_specifications_updated_at
BEFORE UPDATE ON "ProductVariantSpecifications"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Clients Table
CREATE TABLE "Clients" (
    "ClientID" SERIAL PRIMARY KEY,
    "ClientName" VARCHAR(255) NOT NULL,
    "ContactName" VARCHAR(255),
    "ContactEmail" VARCHAR(255) UNIQUE,
    "ContactPhone" VARCHAR(50),
    "Address" TEXT,
    "City" VARCHAR(100),
    "State" VARCHAR(100),
    "Country" VARCHAR(100),
    "PostalCode" VARCHAR(20),
    "ClientType" VARCHAR(50), -- e.g., "Individual", "Business"
    "RegistrationDate" DATE DEFAULT CURRENT_DATE,
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON "Clients"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Vendors Table
CREATE TABLE "Vendors" (
    "VendorID" SERIAL PRIMARY KEY,
    "VendorName" VARCHAR(255) NOT NULL,
    "ContactName" VARCHAR(255),
    "ContactEmail" VARCHAR(255) UNIQUE,
    "ContactPhone" VARCHAR(50),
    "Address" TEXT,
    "City" VARCHAR(100),
    "State" VARCHAR(100),
    "Country" VARCHAR(100),
    "PostalCode" VARCHAR(20),
    "PreferredVendor" BOOLEAN DEFAULT FALSE,
    "VendorRating" INTEGER CHECK ("VendorRating" >= 1 AND "VendorRating" <= 5), -- Optional rating
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON "Vendors"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- CostEntries Table
-- Stores cost information for product variants from different vendors.
CREATE TABLE "CostEntries" (
    "CostEntryID" SERIAL PRIMARY KEY,
    "VariantID" INTEGER NOT NULL REFERENCES "ProductVariants"("VariantID") ON DELETE CASCADE,
    "VendorID" INTEGER NOT NULL REFERENCES "Vendors"("VendorID") ON DELETE RESTRICT,
    "CostPrice" DECIMAL(10, 2) NOT NULL CHECK ("CostPrice" >= 0),
    "Currency" VARCHAR(3) DEFAULT 'USD',
    "ValidFrom" DATE DEFAULT CURRENT_DATE,
    "ValidTo" DATE,
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("VariantID", "VendorID", "ValidFrom") -- Ensure one cost entry per variant, vendor, and effective date
);

CREATE TRIGGER update_cost_entries_updated_at
BEFORE UPDATE ON "CostEntries"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- BillOfMaterials (BOM) Table
-- Defines the components (other product variants) that make up a kit or assembly type product variant.
CREATE TABLE "BillOfMaterials" (
    "BOMEntryID" SERIAL PRIMARY KEY,
    "AssemblyVariantID" INTEGER NOT NULL REFERENCES "ProductVariants"("VariantID") ON DELETE CASCADE, -- The "parent" product that is a kit/assembly
    "ComponentVariantID" INTEGER NOT NULL REFERENCES "ProductVariants"("VariantID") ON DELETE RESTRICT, -- The "child" product that is part of the kit
    "Quantity" INTEGER NOT NULL CHECK ("Quantity" > 0),
    "UnitOfMeasure" VARCHAR(50), -- e.g., "pcs", "cm", "grams"
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("AssemblyVariantID", "ComponentVariantID"), -- A component can only be listed once per assembly
    CHECK ("AssemblyVariantID" <> "ComponentVariantID") -- Ensure a product cannot be a component of itself
);

CREATE TRIGGER update_bill_of_materials_updated_at
BEFORE UPDATE ON "BillOfMaterials"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for frequently queried columns
CREATE INDEX idx_categories_parent_id ON "Categories"("ParentCategoryID");
CREATE INDEX idx_product_families_category_id ON "ProductFamilies"("CategoryID");
CREATE INDEX idx_suggested_attributes_product_family_id ON "SuggestedAttributes"("ProductFamilyID");
CREATE INDEX idx_product_variants_product_family_id ON "ProductVariants"("ProductFamilyID");
CREATE INDEX idx_product_variant_specifications_variant_id ON "ProductVariantSpecifications"("VariantID");
CREATE INDEX idx_product_variant_specifications_attribute_id ON "ProductVariantSpecifications"("AttributeID");
CREATE INDEX idx_cost_entries_variant_id ON "CostEntries"("VariantID");
CREATE INDEX idx_cost_entries_vendor_id ON "CostEntries"("VendorID");
CREATE INDEX idx_bom_assembly_variant_id ON "BillOfMaterials"("AssemblyVariantID");
CREATE INDEX idx_bom_component_variant_id ON "BillOfMaterials"("ComponentVariantID");
CREATE INDEX idx_clients_email ON "Clients"("ContactEmail");
CREATE INDEX idx_vendors_email ON "Vendors"("ContactEmail");
