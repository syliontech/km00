document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const categoryIdDisplayInput = document.getElementById('category_id_display');
    const categoryIdInput = document.getElementById('category_id'); // Hidden input for actual code
    const productCodeInput = document.getElementById('product_code');
    const selectCategoryBtn = document.getElementById('selectCategoryBtn');
    const categorySelectorPanel = document.getElementById('categorySelectorPanel');
    const categorySearchInput = document.getElementById('categorySearchInput');
    const categoryBreadcrumbsEl = document.getElementById('categoryBreadcrumbs');
    const categoryListContainerUl = categorySelectorPanel.querySelector('#categoryListContainer ul');
    const categoryBackBtn = document.getElementById('categoryBackBtn');
    const closeCategorySelectorBtn = document.getElementById('closeCategorySelectorBtn');

    // Mock category data (hierarchical)
    const mockCategories = [
        {
            code: 'A0000', name: '五金工具 (Hardware Tools)', children: [
                {
                    code: 'A1000', name: '手动工具 (Hand Tools)', children: [
                        { code: 'A1B00', name: '扳手 (Wrenches)', children: [
                            { code: 'A1B1C', name: '活动扳手 (Adjustable Wrench)', children: [] },
                            { code: 'A1B2D', name: '梅花扳手 (Box Wrench)', children: [] }
                        ]},
                        { code: 'A1C00', name: '螺丝刀 (Screwdrivers)', children: [] }
                    ]
                },
                {
                    code: 'A2000', name: '电动工具 (Power Tools)', children: [
                        { code: 'A2D00', name: '电钻 (Drills)', children: [] }
                    ]
                }
            ]
        },
        {
            code: 'B0000', name: '办公用品 (Office Supplies)', children: [
                { code: 'B1000', name: '书写工具 (Writing Instruments)', children: [] },
                { code: 'B2000', name: '纸制品 (Paper Products)', children: [] }
            ]
        }
    ];

    let currentCategoryLevel = mockCategories;
    let categoryNavigationStack = []; // To store path for breadcrumbs and back button

    function renderCategories(categoriesToRender, searchTerm = '') {
        categoryListContainerUl.innerHTML = '';
        const filteredCategories = categoriesToRender.filter(cat => 
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredCategories.length === 0) {
            categoryListContainerUl.innerHTML = '<li>没有找到匹配的分类 (No matching categories found)</li>';
            return;
        }

        filteredCategories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = `${category.name} (${category.code})`;
            li.dataset.code = category.code;
            li.dataset.hasChildren = category.children && category.children.length > 0;

            li.addEventListener('click', function() { // Single click to navigate if it has children
                if (category.children && category.children.length > 0) {
                    categoryNavigationStack.push({ name: category.name, level: currentCategoryLevel });
                    currentCategoryLevel = category.children;
                    renderCategories(currentCategoryLevel);
                    updateBreadcrumbs();
                }
            });

            li.addEventListener('dblclick', function() { // Double click to select
                categoryIdDisplayInput.value = `${category.code} (${category.name})`;
                categoryIdInput.value = category.code; // Store actual code in hidden field
                hideCategorySelector();
            });

            categoryListContainerUl.appendChild(li);
        });
        categoryBackBtn.style.display = categoryNavigationStack.length > 0 ? 'inline-block' : 'none';
    }

    function updateBreadcrumbs() {
        categoryBreadcrumbsEl.innerHTML = '';
        const homeSpan = document.createElement('span');
        homeSpan.textContent = '顶级 (Top Level)';
        homeSpan.addEventListener('click', () => {
            currentCategoryLevel = mockCategories;
            categoryNavigationStack = [];
            renderCategories(currentCategoryLevel);
            updateBreadcrumbs();
        });
        categoryBreadcrumbsEl.appendChild(homeSpan);

        categoryNavigationStack.forEach((level, index) => {
            categoryBreadcrumbsEl.appendChild(document.createTextNode(' > '));
            const levelSpan = document.createElement('span');
            levelSpan.textContent = level.name;
            levelSpan.addEventListener('click', () => {
                currentCategoryLevel = level.level;
                categoryNavigationStack = categoryNavigationStack.slice(0, index); // Go back to this level
                // Need to find the correct children array for 'currentCategoryLevel'
                // This part is tricky if level.level was a snapshot. Let's re-evaluate 'currentCategoryLevel' from stack
                let tempLevel = mockCategories;
                for(let i=0; i < index; i++) {
                    const parent = tempLevel.find(cat => cat.name === categoryNavigationStack[i].name);
                    if(parent && parent.children) tempLevel = parent.children;
                }
                currentCategoryLevel = tempLevel.find(cat => cat.name === level.name)?.children || tempLevel;

                renderCategories(currentCategoryLevel);
                updateBreadcrumbs();
            });
            categoryBreadcrumbsEl.appendChild(levelSpan);
        });
    }

    function showCategorySelector() {
        categorySelectorPanel.style.display = 'block';
        currentCategoryLevel = mockCategories; // Reset to top level
        categoryNavigationStack = [];
        renderCategories(currentCategoryLevel);
        updateBreadcrumbs();
        categorySearchInput.value = '';
    }

    function hideCategorySelector() {
        categorySelectorPanel.style.display = 'none';
    }

    if (selectCategoryBtn) {
        selectCategoryBtn.addEventListener('click', showCategorySelector);
    }

    if (closeCategorySelectorBtn) {
        closeCategorySelectorBtn.addEventListener('click', hideCategorySelector);
    }

    if (categorySearchInput) {
        categorySearchInput.addEventListener('input', function() {
            renderCategories(currentCategoryLevel, this.value);
        });
    }

    if (categoryBackBtn) {
        categoryBackBtn.addEventListener('click', function() {
            if (categoryNavigationStack.length > 0) {
                const previousLevelData = categoryNavigationStack.pop();
                currentCategoryLevel = previousLevelData.level;
                renderCategories(currentCategoryLevel);
                updateBreadcrumbs();
            }
        });
    }

    // --- Suggest a temporary product code (client-side, not guaranteed unique) ---
    function suggestProductCode() {
        // Simple suggestion: 'P-' + timestamp + 3 random chars
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `P-${timestamp}${randomChars}`;
    }

    // --- Initialize form for new product ---
    function initializeNewProductForm() {
        if (productCodeInput && !productCodeInput.value) { // Only if no value (e.g. not editing)
            productCodeInput.value = suggestProductCode();
        }
        // Clear category selection
        if (categoryIdDisplayInput) categoryIdDisplayInput.value = '';
        if (categoryIdInput) categoryIdInput.value = '';
    }

    // --- Original Form Submission Logic ---
    if (productForm) {
        productForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent actual form submission for now
            
            const formData = new FormData(productForm);
            const productData = {};
            formData.forEach((value, key) => {
                productData[key] = value;
            });

            // Ensure the actual category_id (from hidden field) is used if selected
            if (categoryIdInput.value) {
                productData['category_id'] = categoryIdInput.value;
            }
            // The 'category_id_display' field will also be in formData but can be ignored by backend

            console.log('Product Data Submitted:', productData);
            alert('产品数据已记录到控制台 (Product data logged to console). 后续将实现保存到数据库 (Saving to database will be implemented later).');
        });
    }

    // Initialize for a new product scenario
    initializeNewProductForm();

    console.log('product-form.js loaded and initialized for category selection and product code suggestion.');
});
