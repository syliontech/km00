console.log("Product Management App script loaded.");

// Supabase Project Configuration
const SUPABASE_URL = 'http://192.168.10.18:8001';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM5OTgwODAwLAogICJleHAiOiAxODk3NzQ3MjAwCn0.UsUZbPq7y6Lk7pytc6ij5NiHpf5kk_hqas8C_HKBVJQ';

let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized.");
    } else {
        console.error("Supabase client library not found.");
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
}

// --- Global State ---
let currentEditCategoryCode = null;
let selectedProductIdForConfig = null;

// --- DOM Elements ---
const categoriesListDiv = document.getElementById('categories-list');
const addCategoryForm = document.getElementById('add-category-form');
const categoryFormSubmitButton = addCategoryForm ? addCategoryForm.querySelector('button[type="submit"]') : null;
const categoryCodeInput = addCategoryForm ? addCategoryForm['category-code'] : null;
const categoryNameInput = addCategoryForm ? addCategoryForm['category-name'] : null;
const categoryLevelInput = addCategoryForm ? addCategoryForm['category-level'] : null;
const parentCategorySelect = document.getElementById('category-parent-code');

const addProductForm = document.getElementById('add-product-form');
const productsListDiv = document.getElementById('products-list');
const productCategoryCodeSelect = document.getElementById('product-category-code');

const configIdleOverlay = document.getElementById('config-idle-overlay');
const configActiveContent = document.getElementById('config-active-content');
const selectedProductForConfigHeader = document.getElementById('selected-product-for-config');

// === HELPER FUNCTIONS ===
function getNextChar(existingChars = []) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let char of alphabet) { if (!existingChars.includes(char)) return char; }
    return null;
}
function getNextAlphanumericSuffix(existingSuffixes = []) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < chars.length; i++) {
        for (let j = 0; j < chars.length; j++) {
            const suffix = chars[i] + chars[j];
            if (!existingSuffixes.includes(suffix)) return suffix;
        }
    }
    return null;
}
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * characters.length)); }
    return result;
}

// === CATEGORY MANAGEMENT ===
async function generateL1Code() { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('category').select('code').eq('level', 1);
    if (error) throw error;
    const existingCodes = data.map(c => c.code);
    const nextL1Char = getNextChar(existingCodes);
    if (!nextL1Char) throw new Error("Exhausted L1 category codes (A-Z). Add support for AA-ZZ if needed.");
    return nextL1Char;
}
async function generateL2toL4Code(parentCode) { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('category').select('code').eq('parent_code', parentCode);
    if (error) throw error;
    const existingSuffixes = data.map(c => c.code.substring(parentCode.length));
    const nextSuffixChar = getNextChar(existingSuffixes);
    if (!nextSuffixChar) throw new Error(`Exhausted L2-L4 category codes for parent ${parentCode}.`);
    return parentCode + nextSuffixChar;
}
async function generateL5Code(parentCode) { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('category').select('code').eq('parent_code', parentCode).eq('level', 5);
    if (error) throw error;
    const existingSuffixes = data.map(c => c.code.substring(parentCode.length));
    const nextSuffix = getNextAlphanumericSuffix(existingSuffixes);
    if (!nextSuffix) throw new Error(`Exhausted L5 category codes for parent ${parentCode}.`);
    return parentCode + nextSuffix;
}
async function generateCategoryCode(parentCode, level, categoryName) { /* Unchanged */
    if (level === 1) {
        return await generateL1Code();
    } else if (level > 1 && level < 5) {
        if (!parentCode) throw new Error("Parent code is required for L2-L4 categories.");
        return await generateL2toL4Code(parentCode);
    } else if (level === 5) {
        if (!parentCode) throw new Error("Parent code is required for L5 categories.");
        return await generateL5Code(parentCode);
    } else {
        throw new Error(`Invalid category level for code generation: ${level}`);
    }
}
async function populateParentCategoryDropdown(currentCategoryCodeToExclude = null) { /* Unchanged */
    if (!supabase || !parentCategorySelect) return;
    const { data, error } = await supabase.from('category').select('code, name, level').order('level').order('name');
    if (error) {
        console.error('Error fetching categories for parent dropdown:', error);
        parentCategorySelect.innerHTML = '<option value="">-- Error Loading --</option>';
        return;
    }
    const currentSelectedParent = parentCategorySelect.value;
    parentCategorySelect.innerHTML = '<option value="">-- None --</option>';
    data.forEach(category => {
        if (category.code === currentCategoryCodeToExclude) return;
        const option = document.createElement('option');
        option.value = category.code;
        option.textContent = `${category.name} (Code: ${category.code}, Lvl: ${category.level})`;
        parentCategorySelect.appendChild(option);
    });
    if (Array.from(parentCategorySelect.options).some(opt => opt.value === currentSelectedParent)) {
        parentCategorySelect.value = currentSelectedParent;
    } else if (currentCategoryCodeToExclude && currentSelectedParent === currentCategoryCodeToExclude) {
        parentCategorySelect.value = "";
    }
}

async function fetchCategoriesAndPopulateDropdown() {
    if (!supabase || !categoriesListDiv) return;
    categoriesListDiv.innerHTML = `<p class="text-slate-500 text-sm">Fetching categories...</p>`;
    try {
        const { data, error } = await supabase.from('category').select('*').order('level', { ascending: true }).order('name', { ascending: true });
        if (error) throw error;
        if (data.length === 0) {
            categoriesListDiv.innerHTML = `<p class="text-slate-500 text-sm">No categories found. Add one above!</p>`;
        } else {
            categoriesListDiv.innerHTML = `<ul class="divide-y divide-slate-200">
                ${data.map(category => `
                    <li class="py-3 px-1 hover:bg-slate-50 rounded-md">
                        <div class="flex justify-between items-center space-x-2">
                            <div class="flex-grow min-w-0">
                                <strong class="text-sm font-medium text-slate-700 break-words">${category.name}</strong>
                                <p class="text-xs text-slate-500">Code: ${category.code} | Lvl: ${category.level}${category.parent_code ? ` | Parent: ${category.parent_code}` : ''}</p>
                                ${category.description ? `<p class="text-xs text-slate-600 mt-1 truncate" title="${category.description}">${category.description}</p>` : ''}
                            </div>
                            <div class="flex-shrink-0 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                                <button class="edit-category-btn text-xs py-1 px-2 rounded-md text-sky-600 hover:text-sky-800 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500" data-code="${category.code}"><i class="fas fa-edit mr-1 sm:mr-1"></i><span class="hidden sm:inline">Edit</span></button>
                                <button class="delete-category-btn text-xs py-1 px-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500" data-code="${category.code}"><i class="fas fa-trash mr-1 sm:mr-1"></i><span class="hidden sm:inline">Del</span></button>
                            </div>
                        </div>
                    </li>`).join('')}</ul>`;
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        if (categoriesListDiv) categoriesListDiv.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
    }
    document.querySelectorAll('.edit-category-btn').forEach(button => button.addEventListener('click', () => handleEditCategory(button.dataset.code)));
    document.querySelectorAll('.delete-category-btn').forEach(button => button.addEventListener('click', () => handleDeleteCategory(button.dataset.code)));
    await populateParentCategoryDropdown(currentEditCategoryCode);
}

function resetCategoryForm() { /* Unchanged */
    if (addCategoryForm) addCategoryForm.reset();
    if (categoryCodeInput) categoryCodeInput.value = "";
    if (categoryLevelInput) categoryLevelInput.readOnly = false;
    if (categoryFormSubmitButton) categoryFormSubmitButton.textContent = 'Add / Update Category'; // Match HTML
    if (parentCategorySelect) parentCategorySelect.value = "";
    currentEditCategoryCode = null;
}
async function handleCategoryFormSubmit(event) { /* Unchanged */
    event.preventDefault();
    if (!supabase || !parentCategorySelect || !categoryLevelInput || !categoryNameInput) {
        alert('Core category form elements or Supabase client not initialized.'); return;
    }
    const categoryName = categoryNameInput.value;
    const parentCode = parentCategorySelect.value || null;
    const categoryLevel = parseInt(categoryLevelInput.value);
    const description = addCategoryForm['category-description'].value || null;

    if (!categoryName || !categoryLevel) { alert('Name and Level are required.'); return; }
    if (categoryLevel < 1 || categoryLevel > 5) { alert('Level must be between 1 and 5.'); return; }
    if (categoryLevel > 1 && !parentCode) { alert(`Parent category is required for Level ${categoryLevel} categories.`); return; }
    if (categoryLevel === 1 && parentCode) { alert(`Level 1 categories cannot have a parent. Ensure Parent Category is "-- None --".`); return; }

    if (parentCode) {
        const { data: parentData, error: parentError } = await supabase.from('category').select('level').eq('code', parentCode).single();
        if (parentError || !parentData) {
            alert("Could not verify parent category level."); console.error("Error fetching parent for validation:", parentError); return;
        }
        if (parentData.level !== categoryLevel - 1) {
            alert(`Invalid level: Parent "${parentCode}" (L${parentData.level}) requires new category to be L${parentData.level + 1}. You selected L${categoryLevel}.`); return;
        }
    }
    const isLeaf = categoryLevel === 5;
    try {
        let responseData, responseError;
        let actualCategoryCode = currentEditCategoryCode;
        if (currentEditCategoryCode) { // UPDATE
            const updateData = { name: categoryName, parent_code: parentCode, description: description };
             // Ensure button text is for update
            if(categoryFormSubmitButton) categoryFormSubmitButton.textContent = 'Update Category';
            const { data, error } = await supabase.from('category').update(updateData).eq('code', currentEditCategoryCode).select();
            responseData = data; responseError = error;
        } else { // ADD
             // Ensure button text is for add
            if(categoryFormSubmitButton) categoryFormSubmitButton.textContent = 'Add Category';
            actualCategoryCode = await generateCategoryCode(parentCode, categoryLevel, categoryName);
            const insertData = { code: actualCategoryCode, name: categoryName, parent_code: parentCode, level: categoryLevel, is_leaf: isLeaf, description: description };
            const { data, error } = await supabase.from('category').insert([insertData]).select();
            responseData = data; responseError = error;
        }
        if (responseError) throw responseError;
        alert(`Category ${actualCategoryCode} ${currentEditCategoryCode ? 'updated' : 'added'} successfully!`);
        resetCategoryForm(); // This will also reset button text to Add/Update
        await fetchCategoriesAndPopulateDropdown();
    } catch (error) {
        console.error(`Error ${currentEditCategoryCode ? 'updating' : 'adding'} category:`, error);
        alert(`Error: ${error.message}`);
    } finally {
         // Default button text after operation if not in edit mode
        if (!currentEditCategoryCode && categoryFormSubmitButton) {
            categoryFormSubmitButton.textContent = 'Add / Update Category';
        }
    }
}
async function handleEditCategory(code) { /* Unchanged, but ensure button text matches form */
    if (!supabase || !parentCategorySelect || !categoryLevelInput || !categoryNameInput || !categoryCodeInput) {
        alert('Core category form elements or Supabase client not initialized for editing.'); return;
    }
    await populateParentCategoryDropdown(code);
    try {
        const { data, error } = await supabase.from('category').select('*').eq('code', code).single();
        if (error) throw error;
        if (data) {
            categoryNameInput.value = data.name || '';
            categoryCodeInput.value = data.code || '';
            parentCategorySelect.value = data.parent_code || '';
            categoryLevelInput.value = data.level || '';
            categoryLevelInput.readOnly = true;
            addCategoryForm['category-description'].value = data.description || '';
            if(categoryFormSubmitButton) categoryFormSubmitButton.textContent = 'Update Category'; // Specific for edit
            currentEditCategoryCode = code;
            addCategoryForm.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("Could not load category data for editing.");
        }
    } catch (error) {
        console.error('Error fetching category for edit:', error);
        alert(`Error fetching category details: ${error.message}`);
        await populateParentCategoryDropdown();
    }
}
async function handleDeleteCategory(code) { /* Unchanged */
    if (!supabase || !window.confirm(`Delete category "${code}"? This fails if it's a parent or linked to products.`)) return;
    try {
        const { data: childCheck, error: childCheckError } = await supabase.from('category').select('code').eq('parent_code', code).limit(1);
        if (childCheckError) { console.error('Error checking children:', childCheckError); alert("Error checking children. Deletion aborted."); return; }
        if (childCheck && childCheck.length > 0) { alert(`Cannot delete parent category "${code}" (e.g., child ${childCheck[0].code}). Reassign/delete children first.`); return; }

        const { error } = await supabase.from('category').delete().eq('code', code);
        if (error) {
            if (error.message.includes('foreign key constraint')) { alert(`Cannot delete category "${code}": referenced by products or other items.`); return; }
            throw error;
        }
        alert('Category deleted successfully!');
        await fetchCategoriesAndPopulateDropdown();
    } catch (error) {
        console.error('Error deleting category:', error);
        alert(`Error deleting category: ${error.message}`);
    }
}

// === PRODUCT MANAGEMENT ===
async function populateProductCategoryDropdown() { /* Unchanged */
    if (!supabase || !productCategoryCodeSelect) {
        console.log("Supabase or productCategoryCodeSelect not available.");
        if(productCategoryCodeSelect) productCategoryCodeSelect.innerHTML = '<option value="">-- Error --</option>';
        return;
    }
    const { data, error } = await supabase.from('category').select('code, name').eq('level', 5).order('name');
    if (error) {
        console.error('Error fetching L5 categories for product form:', error);
        productCategoryCodeSelect.innerHTML = '<option value="">-- Error Loading Categories --</option>';
        return;
    }
    productCategoryCodeSelect.innerHTML = '<option value="">-- Select Level 5 Category --</option>';
    data.forEach(category => {
        const option = document.createElement('option');
        option.value = category.code;
        option.textContent = `${category.name} (Code: ${category.code})`;
        productCategoryCodeSelect.appendChild(option);
    });
}
async function generateProductCode(l5CategoryCode) { /* Unchanged */
    if (!supabase) throw new Error("Supabase client not initialized for product code gen.");
    if (!l5CategoryCode) throw new Error("L5 category code is required.");

    const { data: l5Category, error: l5Error } = await supabase.from('category').select('parent_code, level').eq('code', l5CategoryCode).single();
    if (l5Error || !l5Category) throw new Error(`Failed to fetch L5 category (code: ${l5CategoryCode}): ${l5Error?.message || 'Not found'}`);
    if (l5Category.level !== 5) throw new Error(`Selected category ${l5CategoryCode} is not Level 5.`);

    const l4Code = l5Category.parent_code;
    if (!l4Code) throw new Error(`L5 category ${l5CategoryCode} does not have a parent_code (L4 code).`);

    const { data: l4Category, error: l4Error } = await supabase.from('category').select('parent_code, level').eq('code', l4Code).single();
    if (l4Error || !l4Category) throw new Error(`Failed to fetch L4 category (code: ${l4Code}): ${l4Error?.message || 'Not found'}`);
    if (l4Category.level !== 4) throw new Error(`Parent category ${l4Code} of L5 ${l5CategoryCode} is not Level 4.`);

    const l3Code = l4Category.parent_code;
    if (!l3Code) throw new Error(`L4 category ${l4Code} does not have a parent_code (L3 code).`);

    const { data: l3CategoryData, error: l3ValidationError } = await supabase.from('category').select('level').eq('code', l3Code).single();
    if (l3ValidationError || !l3CategoryData) throw new Error(`Failed to fetch L3 category (code: ${l3Code}) for validation: ${l3ValidationError?.message || 'Not found'}`);
    if (l3CategoryData.level !== 3) throw new Error(`Parent category ${l3Code} of L4 ${l4Code} is not Level 3.`);

    const productCodePrefix = l3Code + l4Code;
    let productCode = "";
    let isUnique = false;
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    while (!isUnique && attempts < MAX_ATTEMPTS) {
        attempts++;
        const randomSuffix = generateRandomString(5);
        productCode = productCodePrefix + randomSuffix;
        const { data: existingProduct, error: checkError } = await supabase.from('products').select('product_code').eq('product_code', productCode).limit(1);
        if (checkError) throw checkError;
        if (existingProduct.length === 0) isUnique = true;
        else console.warn(`Product code collision for ${productCode}, attempt ${attempts}. Regenerating...`);
    }
    if (!isUnique) throw new Error(`Failed to generate a unique product code after ${MAX_ATTEMPTS} attempts for prefix ${productCodePrefix}.`);
    return productCode;
}
async function handleAddProduct(event) { /* Unchanged */
    event.preventDefault();
    if (!supabase) { alert("Supabase not initialized."); return; }

    const form = event.target;
    const productName = form['product-name'].value;
    const categoryCode = form['product-category-code'].value;
    const productType = form['product-type'].value;

    if (!productName || !categoryCode || !productType) {
        alert("Product Name, Category (L5), and Product Type are required.");
        return;
    }

    try {
        const newProductCode = await generateProductCode(categoryCode);
        const productData = {
            product_code: newProductCode, name: productName, category_code: categoryCode, product_type: productType,
            description: form['product-description'].value || null, cdescription: form['product-cdescription'].value || null,
            detail: form['product-detail'].value || null, cdetail: form['product-cdetail'].value || null,
            image1_url: form['product-image1-url'].value || null, image2_url: form['product-image2-url'].value || null,
            image3_url: form['product-image3-url'].value || null, files_folder: form['product-files-folder'].value || null,
        };
        const { data, error } = await supabase.from('products').insert([productData]).select();
        if (error) throw error;
        alert(`Product "${productName}" (Code: ${newProductCode}) added successfully!`);
        form.reset();
        await fetchProducts();
    } catch (error) {
        console.error("Error adding product:", error);
        alert(`Error adding product: ${error.message}`);
    }
}

async function fetchProducts() {
    if (!supabase || !productsListDiv) {
        if(productsListDiv) productsListDiv.innerHTML = `<p class="text-red-500 text-sm">Supabase client not initialized or product list element not found.</p>`;
        return;
    }
    productsListDiv.innerHTML = `<p class="text-slate-500 text-sm">Loading products...</p>`;
    try {
        const { data, error } = await supabase.from('products').select('id, product_code, name, description, image1_url, product_type, category_code, category:category_code(name)')
                                    .order('name', {ascending: true});
        if (error) throw error;

        if (data.length === 0) {
            productsListDiv.innerHTML = `<p class="text-slate-500 text-sm">No products found. Add one above!</p>`;
        } else {
            productsListDiv.innerHTML = `<ul class="divide-y divide-slate-200">
                ${data.map(product => `
                    <li class="py-4 px-2 flex flex-col sm:flex-row items-start sm:items-center hover:bg-slate-50 rounded-md">
                        <div class="w-full sm:w-20 h-20 sm:h-auto mb-3 sm:mb-0 sm:mr-4 flex-shrink-0">
                            <img src="${product.image1_url || 'https://via.placeholder.com/100?text=No+Image'}" alt="${product.name || 'Product Image'}" class="w-full h-full object-cover rounded-md border border-slate-200">
                        </div>
                        <div class="flex-grow min-w-0">
                            <h4 class="text-md font-semibold text-sky-700 break-words">${product.name || 'N/A'}</h4>
                            <p class="text-xs text-slate-600"><strong>Code:</strong> ${product.product_code || 'N/A'}</p>
                            <p class="text-xs text-slate-500"><strong>Category:</strong> ${product.category ? product.category.name : (product.category_code || 'N/A')} (L5)</p>
                            <p class="text-xs text-slate-500"><strong>Type:</strong> ${product.product_type || 'N/A'}</p>
                            ${product.description ? `<p class="text-xs text-slate-600 mt-1 truncate" title="${product.description}">${product.description}</p>` : ''}
                        </div>
                        <div class="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 items-start">
                            <button class="manage-config-btn text-xs py-1 px-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"><i class="fas fa-cog mr-1"></i><span class="hidden sm:inline">Manage</span> Configs</button>
                            <button class="edit-product-btn text-xs py-1 px-2 rounded-md text-sky-600 hover:text-sky-800 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-auto" data-id="${product.id}"><i class="fas fa-edit mr-1"></i><span class="hidden sm:inline">Edit</span></button>
                            <button class="delete-product-btn text-xs py-1 px-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-auto" data-id="${product.id}"><i class="fas fa-trash mr-1"></i><span class="hidden sm:inline">Del</span></button>
                        </div>
                    </li>
                `).join('')}</ul>`;

            document.querySelectorAll('.manage-config-btn').forEach(button => {
                button.addEventListener('click', () => {
                    handleManageConfigurations(button.dataset.productId, button.dataset.productName);
                });
            });
            // TODO: Add event listeners for product edit/delete buttons (data-id="${product.id}")
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        productsListDiv.innerHTML = `<p class="text-red-500 text-sm">Error fetching products: ${error.message}</p>`;
    }
}

// === PRODUCT CONFIGURATION PANEL ===
function handleManageConfigurations(productId, productName) {
    if (!configIdleOverlay || !configActiveContent || !selectedProductForConfigHeader) {
        console.error("Configuration panel DOM elements not found."); return;
    }
    selectedProductIdForConfig = productId;
    selectedProductForConfigHeader.innerHTML = `Configuring: <span class="font-bold text-sky-600">${productName}</span> <span class="text-sm text-slate-500">(ID: ${productId})</span>`;
    configIdleOverlay.classList.add('hidden');
    configActiveContent.classList.remove('hidden');
    console.log(`Switched to configuration view for product ID: ${productId}, Name: ${productName}`);
}

// === INITIALIZATION ===
if (addCategoryForm) addCategoryForm.addEventListener('submit', handleCategoryFormSubmit);
else console.warn("Category form not found.");

if (addProductForm) addProductForm.addEventListener('submit', handleAddProduct);
else console.warn("Product form not found.");

document.addEventListener('DOMContentLoaded', () => {
    if (configIdleOverlay) configIdleOverlay.classList.remove('hidden');
    if (configActiveContent) configActiveContent.classList.add('hidden');

    if (supabase) {
       fetchCategoriesAndPopulateDropdown();
       populateProductCategoryDropdown();
       fetchProducts();
    } else {
        console.warn("Supabase not ready on DOMContentLoaded. Will attempt fetch after delay.");
        setTimeout(() => {
            if (supabase) {
                fetchCategoriesAndPopulateDropdown();
                populateProductCategoryDropdown();
                fetchProducts();
            } else {
                console.error("Supabase client still not available after timeout.");
                if(categoriesListDiv) categoriesListDiv.innerHTML = '<p class="text-red-500 text-sm">Supabase client error.</p>';
                if(parentCategorySelect) parentCategorySelect.innerHTML = '<option value="">-- Error --</option>';
                if(productCategoryCodeSelect) productCategoryCodeSelect.innerHTML = '<option value="">-- Error --</option>';
                if(productsListDiv) productsListDiv.innerHTML = '<p class="text-red-500 text-sm">Supabase client error.</p>';
            }
        }, 500);
    }
});
