// In public/assets/js/services/product-service.js
import { supabase } from '../../config/supabase-config.js';
import { getCategoryWithAncestry } from './category-service.js'; // For getProductById

console.log('product-service.js loaded (for Product Search & Display).');

function generateUniqueProductCodeSuffix(length) { /* Unchanged */
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
async function checkProductCodeUniqueness(productCode) { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized.");
    try {
        const { data, error } = await supabase.from('products').select('product_code').eq('product_code', productCode).limit(1);
        if (error) throw error;
        return data.length === 0;
    } catch (error) { console.error(`Error checking product code uniqueness for ${productCode}:`, error); throw error; }
}
async function generateProductCode(l3Code, l4Code) { /* Unchanged */
    if (!l3Code || !l4Code) throw new Error("L3 and L4 category codes are required for product code generation.");
    if (!supabase) throw new Error("Supabase client not initialized.");
    const prefix = l3Code + l4Code; const MAX_ATTEMPTS = 10; let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
        attempts++; const suffix = generateUniqueProductCodeSuffix(5);
        const tentativeProductCode = prefix + suffix;
        try {
            const isUnique = await checkProductCodeUniqueness(tentativeProductCode);
            if (isUnique) { console.log(`Generated unique product code: ${tentativeProductCode}`); return tentativeProductCode; }
        } catch (error) {
            console.error(`Attempt ${attempts}: Error during uniqueness check for ${tentativeProductCode}`, error);
            if (attempts >= MAX_ATTEMPTS) throw new Error(`Failed to check uniqueness after multiple attempts: ${error.message}`);
        }
        console.warn(`Product code ${tentativeProductCode} (attempt ${attempts}) already exists or failed check. Regenerating...`);
    }
    throw new Error(`Failed to generate a unique product code for prefix ${prefix} after ${MAX_ATTEMPTS} attempts.`);
}
async function addProduct(productData) { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized.");
    const requiredFields = ['product_code', 'category_code', 'name', 'product_type'];
    for (const field of requiredFields) { if (!productData[field]) throw new Error(`Missing required product data: ${field} is required.`); }
    try {
        const { data, error } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error; return data;
    } catch (error) {
        console.error('Error adding product to database:', error);
        if (error.message.includes('foreign key constraint') && error.message.includes('products_category_code_fkey')) {
             throw new Error(`Invalid Category Code: The category code "${productData.category_code}" does not exist.`);
        } throw error;
    }
}

/**
 * Fetches products based on parameters.
 * @param {object} params - Object containing filter parameters.
 *   - {string} name_ilike - Filter by product name (case-insensitive like).
 *   - {string} product_code_ilike - Filter by product code (case-insensitive like).
 *   - {string} category_code_eq - Filter by exact category code (L5).
 * @returns {Promise<Array<object>>} - Array of product objects.
 */
async function getProducts(params = {}) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
    }
    try {
        let query = supabase
            .from('products')
            .select(`
                id, product_code, name, description, cdescription, detail, cdetail,
                image1_url, image2_url, image3_url, files_folder, product_type,
                category_code,
                category:category_code ( name, name_en )
            `) // Assuming 'id' is the primary key for products
            .order('name'); // Default order

        if (params.name_ilike && params.name_ilike.trim() !== "") {
            query = query.ilike('name', `%${params.name_ilike}%`);
        }
        if (params.product_code_ilike && params.product_code_ilike.trim() !== "") {
            query = query.ilike('product_code', `%${params.product_code_ilike}%`);
        }
        if (params.category_code_eq && params.category_code_eq.trim() !== "") {
            query = query.eq('category_code', params.category_code_eq);
        }
        // Add limit for safety, can be parameterized later
        query = query.limit(100);


        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching products with params:', params, error);
        return [];
    }
}

/**
 * Fetches a single product by its primary key (id) and its category ancestry.
 * @param {string|number} productId - The primary key of the product.
 * @returns {Promise<object|null>} - A comprehensive product object including its category path, or null if not found.
 */
async function getProductById(productId) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
    }
    if (!productId) {
        console.error('Product ID is required to fetch product details.');
        return null;
    }

    try {
        const { data: product, error: productError } = await supabase
            .from('products')
            .select(`
                *,
                category:category_code ( name, name_en, code, level )
            `) // Select all product fields and basic category info
            .eq('id', productId) // Assuming 'id' is the primary key
            .single();

        if (productError) {
            if (productError.code === 'PGRST116') return null; // Not found
            throw productError;
        }
        if (!product) return null;

        // Fetch category ancestry if category_code exists
        if (product.category_code) {
            const ancestry = await getCategoryWithAncestry(product.category_code);
            product.categoryPath = ancestry; // Attach the resolved path
        } else {
            product.categoryPath = [];
        }

        return product;
    } catch (error) {
        console.error(`Error fetching product by ID ${productId}:`, error);
        return null;
    }
}


export {
    generateProductCode,
    addProduct,
    checkProductCodeUniqueness,
    getProducts,
    getProductById
};
