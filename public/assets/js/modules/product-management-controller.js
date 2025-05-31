// In public/assets/js/modules/product-management-controller.js
import { supabase } from '../../config/supabase-config.js';
import { getCategories } from '../services/category-service.js';
import { generateProductCode, addProduct } from '../services/product-service.js';

console.log('product-management-controller.js loaded (for Product Add).');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Product Management DOM fully loaded and parsed (Product Add controller update).');

    // Form and general elements
    const productForm = document.getElementById('productForm');
    const categoryIdDisplayInput = document.getElementById('category_id_display');
    const categoryIdInput = document.getElementById('category_id'); // Hidden input for L5 code
    const productCodeInput = document.getElementById('product_code'); // Read-only, auto-generated
    const productNameInput = document.getElementById('product_name');
    const productTypeSelect = document.getElementById('product_type');
    const selectCategoryBtn = document.getElementById('selectCategoryBtn');

    // Textareas for descriptions and details
    const productDescriptionInput = document.getElementById('product_description');
    const productCDescriptionInput = document.getElementById('product_cdescription');
    const productDetailInput = document.getElementById('product_detail');
    const productCDetailInput = document.getElementById('product_cdetail');

    // Image URL inputs
    const productImage1UrlInput = document.getElementById('product_image1_url');
    const productImage2UrlInput = document.getElementById('product_image2_url');
    const productImage3UrlInput = document.getElementById('product_image3_url');

    // Files folder input
    const productFilesFolderInput = document.getElementById('product_files_folder');

    const cancelProductFormBtn = document.getElementById('cancelProductFormBtn');


    // Category Selector Panel elements
    const categorySelectorPanel = document.getElementById('categorySelectorPanel');
    const categorySearchInput = document.getElementById('categorySearchInput');
    const categoryBreadcrumbsDiv = document.getElementById('categoryBreadcrumbs');
    const categoryListContainer = document.getElementById('categoryListContainer');
    const categoryBackBtn = document.getElementById('categoryBackBtn');
    const closeCategorySelectorBtn = document.getElementById('closeCategorySelectorBtn');

    // Category Selector Panel State
    let currentCategoryLevelInSelector = 1;
    let currentParentCodeInSelector = null;
    let categoryPath = []; // Array of {level, code, name}

    function toggleCategorySelector(show) { /* Unchanged */
        if (show) { categorySelectorPanel.classList.add('open'); categorySelectorPanel.classList.remove('hidden'); }
        else { categorySelectorPanel.classList.remove('open'); categorySelectorPanel.classList.add('hidden'); }
    }

    function renderBreadcrumbs() { /* Unchanged */
        categoryBreadcrumbsDiv.innerHTML = '';
        if (categoryPath.length === 0) { categoryBreadcrumbsDiv.innerHTML = '<span class="text-gray-500">Root</span>'; categoryBackBtn.disabled = true; return; }
        categoryBackBtn.disabled = false;
        categoryPath.forEach((item, index) => {
            if (index > 0) categoryBreadcrumbsDiv.appendChild(document.createTextNode(' > '));
            const anchor = document.createElement('a'); anchor.textContent = item.name; anchor.href = '#';
            anchor.classList.add('breadcrumb-item'); anchor.dataset.level = item.level; anchor.dataset.code = item.code;
            anchor.addEventListener('click', async (e) => {
                e.preventDefault(); categoryPath = categoryPath.slice(0, index + 1);
                currentCategoryLevelInSelector = item.level + 1; currentParentCodeInSelector = item.code;
                if (item.level === 1 && index === 0) currentParentCodeInSelector = item.code; // Special case for L1 click
                else if (index === 0 && item.level > 1) { /* Should not happen if path starts at L1 */ }

                renderBreadcrumbs();
                await loadCategoriesForSelector(currentCategoryLevelInSelector, currentParentCodeInSelector, categorySearchInput.value.trim());
            });
            categoryBreadcrumbsDiv.appendChild(anchor);
        });
    }

    async function loadCategoriesForSelector(level, parentCode, searchTerm = '') { /* Unchanged */
        if (!categoryListContainer) return; categoryListContainer.innerHTML = '<p class="text-gray-500">Loading...</p>';
        const params = { level: level, parent_code: parentCode }; if (searchTerm) params.name_like = searchTerm;
        const categories = await getCategories(params); categoryListContainer.innerHTML = '';
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const item = document.createElement('div'); item.textContent = `${cat.name} (${cat.name_en || cat.code})`;
                item.classList.add('category-list-item', 'p-2', 'hover:bg-gray-200', 'cursor-pointer', 'border-b');
                item.dataset.code = cat.code; item.dataset.name = cat.name; item.dataset.level = cat.level;
                const isL5 = cat.level === 5; if (isL5) item.classList.add('l5-category', 'font-semibold', 'text-green-600');
                item.addEventListener('click', async () => {
                    if (isL5) { selectL5Category(cat.code, cat.name, [...categoryPath, {level: cat.level, code: cat.code, name: cat.name}]); }
                    else if (cat.level < 5) {
                        categoryPath.push({ level: cat.level, code: cat.code, name: cat.name });
                        currentParentCodeInSelector = cat.code; currentCategoryLevelInSelector = cat.level + 1;
                        renderBreadcrumbs(); await loadCategoriesForSelector(currentCategoryLevelInSelector, currentParentCodeInSelector, '');
                        categorySearchInput.value = '';
                    }
                });
                categoryListContainer.appendChild(item);
            });
        } else { categoryListContainer.innerHTML = `<p class="text-gray-500 p-2">No categories found.</p>`; }
    }

    async function selectL5Category(code, name, path) {
        if (categoryIdDisplayInput && categoryIdInput && productCodeInput) {
            const fullPathString = path.map(p => p.name).join(' > ');
            categoryIdDisplayInput.value = `${fullPathString} (Code: ${code})`;
            categoryIdInput.value = code; // Store the L5 code

            // Generate Product Code
            if (path.length < 4) { // L1, L2, L3, L4, L5 - path needs at least 4 elements for L3 and L4 codes
                alert("Error: The selected L5 category does not have a complete parent path (L1-L4). Cannot generate product code.");
                productCodeInput.value = 'Error: Invalid category path';
                return;
            }
            // Path: [L1, L2, L3, L4, L5]
            // L3 code is path[2].code, L4 code is path[3].code
            const l3Code = path[2].code;
            const l4Code = path[3].code;

            if (!l3Code || !l4Code) {
                 alert("Error: Could not determine L3 or L4 codes from category path.");
                 productCodeInput.value = 'Error: Missing L3/L4 codes';
                 return;
            }

            try {
                productCodeInput.value = 'Generating...';
                const newProductCode = await generateProductCode(l3Code, l4Code);
                productCodeInput.value = newProductCode;
            } catch (error) {
                console.error("Error generating product code:", error);
                alert(`Error generating product code: ${error.message}`);
                productCodeInput.value = 'Error generating code';
            }
        }
        toggleCategorySelector(false);
        console.log(`L5 Category Selected: Code=${code}, Name=${name}, Path:`, path);
    }

    // Event Listeners for Category Selector (largely unchanged)
    if (selectCategoryBtn) { /* ... */ }
    if (closeCategorySelectorBtn) { /* ... */ }
    if (categoryBackBtn) { /* ... */ }
    if (categorySearchInput) { /* ... */ }
    // (Keeping existing category selector event listeners)
    if (selectCategoryBtn) {
        selectCategoryBtn.addEventListener('click', async () => {
            toggleCategorySelector(true); currentCategoryLevelInSelector = 1; currentParentCodeInSelector = null;
            categoryPath = []; renderBreadcrumbs(); await loadCategoriesForSelector(1, null, ''); categorySearchInput.value = '';
        });
    }
    if (closeCategorySelectorBtn) closeCategorySelectorBtn.addEventListener('click', () => toggleCategorySelector(false));
    if (categoryBackBtn) {
        categoryBackBtn.addEventListener('click', async () => {
            if (categoryPath.length > 0) {
                categoryPath.pop();
                if (categoryPath.length > 0) { const parent = categoryPath[categoryPath.length - 1]; currentParentCodeInSelector = parent.code; currentCategoryLevelInSelector = parent.level + 1; }
                else { currentParentCodeInSelector = null; currentCategoryLevelInSelector = 1; }
                renderBreadcrumbs(); await loadCategoriesForSelector(currentCategoryLevelInSelector, currentParentCodeInSelector, ''); categorySearchInput.value = '';
            }
        });
    }
    if (categorySearchInput) {
        let searchTimeout; categorySearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout); searchTimeout = setTimeout(async () => {
                const searchTerm = categorySearchInput.value.trim();
                await loadCategoriesForSelector(currentCategoryLevelInSelector, currentParentCodeInSelector, searchTerm);
            }, 300);
        });
    }


    // --- Product Form Submission ---
    async function handleProductFormSubmit(event) {
        event.preventDefault();
        const l5CategoryCode = categoryIdInput.value;
        const generatedProductCode = productCodeInput.value;
        const name = productNameInput.value.trim();
        const type = productTypeSelect.value;

        if (!l5CategoryCode || !generatedProductCode || !name || !type ) {
            alert("Please ensure Category (L5), Product Code (auto-generated), Product Name, and Product Type are filled.");
            return;
        }
        if (generatedProductCode.startsWith("Error") || generatedProductCode === "Generating...") {
            alert("Product code is not valid or not yet generated. Please re-select category if needed.");
            return;
        }

        const productData = {
            product_code: generatedProductCode,
            category_code: l5CategoryCode, // This is the L5 category code
            name: name,
            product_type: type,
            description: productDescriptionInput.value.trim() || null,
            cdescription: productCDescriptionInput.value.trim() || null,
            detail: productDetailInput.value.trim() || null,
            cdetail: productCDetailInput.value.trim() || null,
            image1_url: productImage1UrlInput.value.trim() || null,
            image2_url: productImage2UrlInput.value.trim() || null,
            image3_url: productImage3UrlInput.value.trim() || null,
            files_folder: productFilesFolderInput.value.trim() || null,
            // is_active, is_featured will use DB defaults or need separate UI controls
        };

        try {
            const newProduct = await addProduct(productData);
            alert(`Product "${newProduct.name}" (Code: ${newProduct.product_code}) added successfully!`);
            productForm.reset();
            categoryIdDisplayInput.value = '';
            categoryIdInput.value = '';
            productCodeInput.value = '';
            // Reset category selector state
            currentCategoryLevelInSelector = 1;
            currentParentCodeInSelector = null;
            categoryPath = [];
            // TODO: Optionally, refresh a product list if one is displayed on this page
        } catch (error) {
            console.error("Error adding product:", error);
            alert(`Failed to add product: ${error.message}`);
        }
    }

    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    if(cancelProductFormBtn) {
        cancelProductFormBtn.addEventListener('click', () => {
            productForm.reset();
            categoryIdDisplayInput.value = '';
            categoryIdInput.value = '';
            productCodeInput.value = '';
            currentCategoryLevelInSelector = 1;
            currentParentCodeInSelector = null;
            categoryPath = [];
            alert("Form cancelled and reset.");
        });
    }

    console.log('Product management controller initialized for product add.');
});
