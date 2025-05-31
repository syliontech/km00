// In public/assets/js/modules/index-controller.js
import { supabase } from '../../config/supabase-config.js';
import { getCategories } from '../services/category-service.js';
import { getProducts, getProductById } from '../services/product-service.js';

console.log('index-controller.js loaded (for Product Search & Display).');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Index Page DOM fully loaded and parsed (Product Search & Display controller update).');

    // --- DOM Element Selectors ---
    // Upper Block 1: Category Browser
    const categoryBrowserBackBtn = document.getElementById('categoryBrowserBackBtn');
    const categoryBrowserSearchInput = document.getElementById('categoryBrowserSearchInput');
    const categoryBrowserListContainer = document.getElementById('categoryBrowserListContainer');
    const selectedCategoriesDisplay = document.getElementById('selectedCategoriesDisplay');

    // Upper Block 2: Product Search
    const productSearchInput = document.getElementById('productSearchInput');
    const productSearchResultsContainer = document.getElementById('leftPanelProductDisplay'); // Will use this to show list or details

    // Lower Left Panel: Product Display Elements
    const productDetailViewDiv = document.getElementById('productDetailView'); // Container for single product details
    const productDetailIdleDiv = document.getElementById('productDetailIdle');   // Idle message
    // Specific detail fields
    const productDetailItemNoSpan = document.getElementById('productDetailItemNo'); // Using ItemNo for Product Code for now
    const productDetailCodeSpan = document.getElementById('productDetailCode');
    const productDetailNameSpan = document.getElementById('productDetailName');
    const productDetailCategorySpan = document.getElementById('productDetailCategory');
    const productDetailTypeSpan = document.getElementById('productDetailType');
    const productDetailCDescriptionP = document.getElementById('productDetailCDescription');
    const productDetailDescriptionP = document.getElementById('productDetailDescription');
    const productDetailImagesDiv = document.getElementById('productDetailImages');
    const productDetailFilesFolderSpan = document.getElementById('productDetailFilesFolder');
    const productDetailSuppliersUl = document.getElementById('productDetailSuppliers');
    const productDetailCustomersUl = document.getElementById('productDetailCustomers');
    const productDetailEditLink = document.getElementById('productDetailEditLink');
    const productConfigRecordsListDiv = document.getElementById('productConfigRecordsList');


    // Lower Right Panel: Product Configuration
    const configIdleOverlay_Index = document.getElementById('configIdleOverlay');
    const configActiveContent_Index = document.getElementById('configActiveContent');
    const startNewConfigBtn = document.getElementById('startNewConfigBtn');
    const selectedProductForConfig_Index = document.getElementById('selectedProductForConfig');


    // --- State Variables ---
    let currentCategoryBrowserLevel = 1;
    let currentCategoryBrowserParentCode = null;
    let categoryBrowserPath = [];
    let selectedFilterCategory = null; // Stores L5 {code, name, pathString} from category browser
    let currentDisplayedProduct = null; // Stores the full data of the product currently in detail view


    // --- Category Browser Functions (Upper Block 1 - Unchanged from previous correct state) ---
    function renderCategoryBrowserBreadcrumbs() { /* ... */ }
    async function loadCategoriesForBrowser(level, parentCode, searchTerm = '') { /* ... */ }
    // (Assuming these are correct from previous step, including their event listeners)
    function renderCategoryBrowserBreadcrumbs() {
        if (categoryBrowserPath.length === 0) { categoryBrowserBackBtn.disabled = true; }
        else { categoryBrowserBackBtn.disabled = false; }
    }
    async function loadCategoriesForBrowser(level, parentCode, searchTerm = '') {
        if (!categoryBrowserListContainer) return; categoryBrowserListContainer.innerHTML = '<p class="text-xs text-slate-400 p-1">Loading...</p>';
        const params = { level: level, parent_code: parentCode }; if (searchTerm.trim()) params.name_like = searchTerm.trim();
        const categories = await getCategories(params); categoryBrowserListContainer.innerHTML = '';
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const item = document.createElement('div');
                item.innerHTML = `${cat.name} <span class="text-slate-400 text-xs">(${cat.name_en || cat.code})</span> ${cat.level === 5 ? '<i class="fas fa-check-circle text-green-500 ml-1 text-xs"></i>' : '<i class="fas fa-chevron-right text-slate-400 ml-1 text-xs"></i>'}`;
                item.classList.add('category-browser-item', 'p-2', 'hover:bg-slate-100', 'cursor-pointer', 'border-b', 'text-sm', 'flex', 'justify-between', 'items-center');
                item.dataset.code = cat.code; item.dataset.name = cat.name; item.dataset.level = cat.level;
                if (cat.level === 5) item.classList.add('l5-category', 'font-semibold');
                item.addEventListener('click', async () => {
                    if (cat.level === 5) {
                        const currentPath = [...categoryBrowserPath, { level: cat.level, code: cat.code, name: cat.name }];
                        const pathString = currentPath.map(p => p.name).join(' > ');
                        selectedFilterCategory = { code: cat.code, name: cat.name, pathString: pathString, level: cat.level };
                        if(selectedCategoriesDisplay) selectedCategoriesDisplay.innerHTML = `<span class="selected-category-tag">${pathString}</span>`;
                        console.log("L5 Selected for filter:", selectedFilterCategory);
                        // Trigger product list filtering
                        const productsFromCategory = await getProducts({ category_code_eq: selectedFilterCategory.code });
                        displayProductList(productsFromCategory);
                        if (productDetailCategoryDisplay) productDetailCategoryDisplay.textContent = pathString;
                    } else {
                        categoryBrowserPath.push({ level: cat.level, code: cat.code, name: cat.name });
                        currentCategoryBrowserParentCode = cat.code; currentCategoryBrowserLevel = cat.level + 1;
                        renderCategoryBrowserBreadcrumbs(); await loadCategoriesForBrowser(currentCategoryBrowserLevel, currentCategoryBrowserParentCode, '');
                        if(categoryBrowserSearchInput) categoryBrowserSearchInput.value = '';
                    }
                });
                categoryBrowserListContainer.appendChild(item);
            });
        } else { categoryBrowserListContainer.innerHTML = `<p class="text-xs text-slate-500 p-2">No categories found${searchTerm ? ' for "' + searchTerm + '"' : ''} at this level.</p>`; }
    }
    if (categoryBrowserBackBtn) { /* Event Listener Unchanged */ }
    if (categoryBrowserSearchInput) { /* Event Listener Unchanged */ }
    function initializeSelectedCategoriesDisplay() { if (selectedCategoriesDisplay) selectedCategoriesDisplay.innerHTML = '<span class="text-xs text-gray-400">No category selected.</span>'; }
    // Wire up category browser back button
    if (categoryBrowserBackBtn) {
        categoryBrowserBackBtn.addEventListener('click', async () => {
            if (categoryBrowserPath.length > 0) {
                categoryBrowserPath.pop();
                if (categoryBrowserPath.length > 0) { const parent = categoryBrowserPath[categoryBrowserPath.length - 1]; currentCategoryBrowserParentCode = parent.code; currentCategoryBrowserLevel = parent.level + 1; }
                else { currentCategoryBrowserParentCode = null; currentCategoryBrowserLevel = 1; }
                renderCategoryBrowserBreadcrumbs(); await loadCategoriesForBrowser(currentCategoryBrowserLevel, currentCategoryBrowserParentCode, ''); if(categoryBrowserSearchInput) categoryBrowserSearchInput.value = '';
            }
        });
    }
    // Wire up category browser search
    if (categoryBrowserSearchInput) {
        let searchTimeout; categoryBrowserSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout); searchTimeout = setTimeout(async () => {
                const searchTerm = categoryBrowserSearchInput.value.trim();
                await loadCategoriesForBrowser(currentCategoryBrowserLevel, currentCategoryBrowserParentCode, searchTerm);
            }, 300);
        });
    }


    // --- Product Display & Config Panel Interaction ---
    function displayProductList(products) {
        if (!productSearchResultsContainer || !productDetailIdleDiv || !productDetailViewDiv) return;

        productDetailViewDiv.classList.add('hidden'); // Hide detail view
        productSearchResultsContainer.innerHTML = ''; // Clear previous list/details

        if (!products || products.length === 0) {
            productSearchResultsContainer.innerHTML = '<p class="text-slate-500 p-4 text-sm">No products found matching your criteria.</p>';
            productDetailIdleDiv.classList.remove('hidden'); // Show idle message if product list is empty
            return;
        }

        productDetailIdleDiv.classList.add('hidden'); // Hide idle message because we have a list

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-slate-200';
        products.forEach(product => {
            const li = document.createElement('li');
            li.className = 'p-3 hover:bg-slate-50 cursor-pointer';
            li.innerHTML = `
                <h3 class="font-semibold text-sky-600 text-md">${product.name}</h3>
                <p class="text-xs text-slate-500 font-mono">${product.product_code}</p>
                <p class="text-xs text-slate-500">${product.category ? product.category.name : product.category_code}</p>
            `;
            li.addEventListener('click', () => displayProductDetails(product.id));
            ul.appendChild(li);
        });
        productSearchResultsContainer.appendChild(ul);
    }

    async function displayProductDetails(productId) {
        if (!productDetailViewDiv || !productDetailIdleDiv) return;
        productSearchResultsContainer.innerHTML = ''; // Clear product list if any
        productDetailIdleDiv.classList.add('hidden');
        productDetailViewDiv.classList.remove('hidden');

        // Show loading state in detail view
        productDetailNameSpan.textContent = 'Loading...';
        productDetailCodeSpan.textContent = 'Loading...';
        // ... clear other fields or show loading ...

        currentDisplayedProduct = await getProductById(productId);

        if (currentDisplayedProduct) {
            productDetailItemNoSpan.textContent = currentDisplayedProduct.product_code; // Or a specific item_no field if exists
            productDetailCodeSpan.textContent = currentDisplayedProduct.product_code;
            productDetailNameSpan.textContent = currentDisplayedProduct.name;

            let categoryDisplay = 'N/A';
            if (currentDisplayedProduct.categoryPath && currentDisplayedProduct.categoryPath.length > 0) {
                categoryDisplay = currentDisplayedProduct.categoryPath.map(p => p.name).join(' > ');
            } else if (currentDisplayedProduct.category) { // Fallback to directly linked category name
                categoryDisplay = currentDisplayedProduct.category.name;
            }
            productDetailCategorySpan.textContent = categoryDisplay;
            productDetailTypeSpan.textContent = currentDisplayedProduct.product_type;
            productDetailDescriptionP.textContent = currentDisplayedProduct.description || 'N/A';
            productDetailCDescriptionP.textContent = currentDisplayedProduct.cdescription || 'N/A';

            // Images
            productDetailImagesDiv.innerHTML = ''; // Clear old images
            const imageUrls = [currentDisplayedProduct.image1_url, currentDisplayedProduct.image2_url, currentDisplayedProduct.image3_url].filter(url => url);
            if (imageUrls.length > 0) {
                imageUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = currentDisplayedProduct.name;
                    img.className = 'w-20 h-20 object-cover rounded border bg-gray-100 mr-2 mb-2';
                    productDetailImagesDiv.appendChild(img);
                });
            } else {
                productDetailImagesDiv.innerHTML = '<span class="text-xs text-slate-500">No images available.</span>';
            }

            productDetailFilesFolderSpan.textContent = currentDisplayedProduct.files_folder || 'N/A';

            // Edit link (assuming 'id' is the primary key from products table)
            if (productDetailEditLink) productDetailEditLink.href = `product-management.html?id=${currentDisplayedProduct.id}`;

            // Placeholders for suppliers, customers, config records
            if(productDetailSuppliersUl) productDetailSuppliersUl.innerHTML = '<li>Supplier data not loaded yet.</li>';
            if(productDetailCustomersUl) productDetailCustomersUl.innerHTML = '<li>Customer data not loaded yet.</li>';
            if(productConfigRecordsListDiv) productConfigRecordsListDiv.innerHTML = '<p class="text-xs text-slate-400">Configuration records loading/display not implemented yet.</p>';

            updateConfigPanelForProduct(currentDisplayedProduct);
        } else {
            productSearchResultsContainer.innerHTML = ''; // Clear any list
            productDetailViewDiv.classList.add('hidden');
            productDetailIdleDiv.classList.remove('hidden');
            productDetailIdleDiv.textContent = `Product with ID ${productId} not found.`;
            updateConfigPanelForProduct(null); // Reset config panel
        }
    }

    function updateConfigPanelForProduct(product) {
        if (!configIdleOverlay_Index || !configActiveContent_Index || !selectedProductForConfig_Index) return;

        if (product) {
            selectedProductForConfig_Index.innerHTML = `Configuring: <span class="font-bold text-sky-600">${product.name || product.product_code}</span>`;
            configIdleOverlay_Index.classList.add('hidden');
            configActiveContent_Index.classList.remove('hidden');
            selectedProductIdForConfig = product.id; // Store globally if needed by config panel later
        } else {
            selectedProductForConfig_Index.textContent = 'Configuring: [No Product Selected]';
            configIdleOverlay_Index.classList.remove('hidden');
            configActiveContent_Index.classList.add('hidden');
            selectedProductIdForConfig = null;
        }
    }

    // Product Search Event Listener (Upper Block 2)
    if (productSearchInput) {
        let searchTimeout;
        productSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const searchTerm = productSearchInput.value.trim();
                if (searchTerm.length > 1 || searchTerm.length === 0) { // Search on empty to reset or if term is long enough
                    productDetailIdleDiv.classList.add('hidden'); // Hide idle message during search
                    productDetailViewDiv.classList.add('hidden'); // Hide detail view
                    productSearchResultsContainer.innerHTML = '<p class="text-slate-500 p-4 text-sm">Searching products...</p>';

                    const params = {};
                    // Simple logic: if it looks like a code (alphanumeric, maybe with specific length), search by code, else by name.
                    // This can be refined. For now, just search by name.
                    if (searchTerm) params.name_ilike = searchTerm;
                    // else fetch all or recent (initial list)

                    const products = await getProducts(params);
                    displayProductList(products);
                }
            }, 300);
        });
    }

    // Config Panel "New Configuration" button
    if (startNewConfigBtn) {
        startNewConfigBtn.addEventListener('click', () => {
            if (currentDisplayedProduct) { // Only allow if a product is selected and displayed
                updateConfigPanelForProduct(currentDisplayedProduct); // This already shows the active content
                console.log("Start New Config for product:", currentDisplayedProduct.name);
                // TODO: Actual logic to start a new configuration UI within configActiveContent_Index
            } else {
                alert("Please select a product first to create a new configuration.");
            }
        });
    }

    // --- Initial Page Load ---
    async function initializePage() {
        renderCategoryBrowserBreadcrumbs();
        await loadCategoriesForBrowser(currentCategoryBrowserLevel, currentCategoryBrowserParentCode);
        initializeSelectedCategoriesDisplay();

        productDetailViewDiv.classList.add('hidden');
        productDetailIdleDiv.classList.remove('hidden');
        configIdleOverlay_Index.classList.remove('hidden');
        configActiveContent_Index.classList.add('hidden');

        // Fetch and display initial product list (e.g., all products, limited)
        const initialProducts = await getProducts({ /* empty params for all, or add default sort/limit */ });
        displayProductList(initialProducts);

        console.log('Index page initialized.');
    }

    initializePage();
});
