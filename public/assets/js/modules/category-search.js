// E:\product-system\new-structure\assets\js\modules\category-search.js

const CategorySearch = (function() {
    // --- Private Variables & DOM Elements ---
    let searchInput = null;
    let categoryListContainer = null;
    let selectedCategoriesDisplay = null;
    let backButton = null; // For navigating up the hierarchy

    const hierarchicalMockCategories = [
        { id: 1, name: '电子产品', children: [
            { id: 11, name: '电脑', children: [
                { id: 111, name: '笔记本电脑', children: [
                    { id: 1111, name: '游戏本' },
                    { id: 1112, name: '商务本' }
                ]},
                { id: 112, name: '台式机' }
            ]},
            { id: 12, name: '手机', children: [
                { id: 121, name: '智能手机' },
                { id: 122, name: '功能手机' }
            ]}
        ]},
        { id: 2, name: '图书音像', children: [
            { id: 21, name: '文学', children: [
                { id: 211, name: '小说' },
                { id: 212, name: '散文' }
            ]},
            { id: 22, name: '音乐', children: [
                { id: 221, name: '流行音乐CD' },
                { id: 222, name: '古典音乐LP' }
            ]}
        ]},
        { id: 3, name: '家居生活' }, // No children example
        { id: 4, name: '服装配饰', children: [
            { id: 41, name: '男装' },
            { id: 42, name: '女装' }
        ]}
    ];

    let currentDisplayCategories = [...hierarchicalMockCategories]; // Categories currently shown to the user
    let navigationStack = []; // Stack to hold parent categories for back navigation. Each item: {name, categories}
    let selectedCategoryPath = []; // Array of {id, name} representing the full path of final selection

    // --- Private Methods ---
    function renderCategories() {
        if (!categoryListContainer) return;
        categoryListContainer.innerHTML = ''; // Clear existing

        if (currentDisplayCategories.length === 0) {
            categoryListContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">此分类下无子分类。</p>';
            return;
        }

        const ul = document.createElement('ul');
        currentDisplayCategories.forEach(category => {
            const li = document.createElement('li');
            li.classList.add('p-2', 'hover:bg-gray-100', 'cursor-pointer', 'text-sm', 'border-b', 'border-gray-200', 'last:border-b-0');
            li.textContent = category.name;
            li.dataset.categoryId = category.id;
            if (category.children && category.children.length > 0) {
                li.innerHTML += ' <i class="fas fa-chevron-right text-xs text-gray-400 float-right mt-1"></i>';
            }
            ul.appendChild(li);
        });
        categoryListContainer.appendChild(ul);
        updateBackButtonState();
    }

    function updateSelectedCategoriesDisplay() {
        if (!selectedCategoriesDisplay) return;
        if (selectedCategoryPath.length === 0) {
            selectedCategoriesDisplay.innerHTML = '<p class="text-center text-gray-500 text-sm">请选择分类...</p>';
        } else {
            selectedCategoriesDisplay.innerHTML = selectedCategoryPath
                .map(cat => `<span class="inline-block bg-gray-200 text-gray-700 text-xs font-semibold mr-1 px-2 py-0.5 rounded">${cat.name}</span>`)
                .join('<span class="mx-1 text-gray-400">/</span>');
        }
    }

    function handleSearch() {
        if (!searchInput) return;
        const searchTerm = searchInput.value.toLowerCase();
        
        // Determine the source for filtering: current level from navigation stack or top level
        const sourceCategories = navigationStack.length > 0 
                               ? navigationStack[navigationStack.length - 1].originalChildren 
                               : hierarchicalMockCategories;
        
        if (!searchTerm) {
            currentDisplayCategories = [...sourceCategories];
        } else {
             currentDisplayCategories = sourceCategories.filter(category => 
                category.name.toLowerCase().includes(searchTerm)
            );
        }
        renderCategories();
    }

    function handleCategoryClick(event) {
        const listItem = event.target.closest('li');
        if (!listItem || !listItem.dataset.categoryId) return;

        const categoryId = parseInt(listItem.dataset.categoryId);
        // Find in the *currently displayed* list, which might be filtered by search
        const clickedCategoryInCurrentDisplay = findCategoryById(currentDisplayCategories, categoryId);

        if (clickedCategoryInCurrentDisplay) {
            // Find the true category object from the original structure to ensure we get its children
            const parentLevelCategories = navigationStack.length > 0 
                                        ? navigationStack[navigationStack.length - 1].originalChildren 
                                        : hierarchicalMockCategories;
            const actualClickedCategory = findCategoryById(parentLevelCategories, categoryId);

            if (!actualClickedCategory) { // Should not happen if logic is correct
                console.error("Clicked category not found in source structure!");
                return;
            }

            selectedCategoryPath.push({ id: actualClickedCategory.id, name: actualClickedCategory.name });
            
            if (actualClickedCategory.children && actualClickedCategory.children.length > 0) {
                // Save current level's full (unfiltered) children list for back navigation and for search context
                navigationStack.push({ 
                    name: actualClickedCategory.name, 
                    categories: [...currentDisplayCategories], // This was the displayed (possibly filtered) list
                    originalChildren: [...actualClickedCategory.children] // This is the full list of children to display next
                }); 
                currentDisplayCategories = [...actualClickedCategory.children];
                searchInput.value = ''; // Clear search on drill-down
                // renderCategories(); // Directly render the new level
            } else {
                // Leaf node selected, or category without children
                currentDisplayCategories = []; // No more sub-categories to show
                console.log('Final category selected:', selectedCategoryPath);
            }
            renderCategories(); // Render new level or empty state
            updateSelectedCategoriesDisplay();
            updateBackButtonState(); // Explicitly call after stack change
        }
    }

    function findCategoryById(categories, id) {
        for (let category of categories) {
            if (category.id === id) return category;
            // This simple find works because we are searching currentDisplayCategories
        }
        return null;
    }
    
    function goBack() {
        let needsRender = false;
        if (navigationStack.length > 0) {
            navigationStack.pop(); // Pop first to correctly determine the new current level
            selectedCategoryPath.pop(); 
            
            if (navigationStack.length > 0) {
                // We've gone back to an intermediate level
                currentDisplayCategories = [...navigationStack[navigationStack.length-1].originalChildren];
            } else {
                // We've gone back to the top level from a child
                currentDisplayCategories = [...hierarchicalMockCategories];
            }
            searchInput.value = '';
            needsRender = true;
        } else if (selectedCategoryPath.length > 0) { 
            // This means a top-level leaf was selected, and we are going "back" to the top-level list
            currentDisplayCategories = [...hierarchicalMockCategories];
            selectedCategoryPath = []; // Clear selection
            searchInput.value = '';
            needsRender = true;
        }
    
        if (needsRender) {
            renderCategories(); 
            updateSelectedCategoriesDisplay();
            updateBackButtonState(); 
        }
    }

    function updateBackButtonState() {
        if (!backButton) return;
        // Disable if at the very root (navigation stack empty AND nothing selected yet)
        if (navigationStack.length === 0 && selectedCategoryPath.length === 0) {
            backButton.disabled = true;
            backButton.classList.add('opacity-50', 'cursor-not-allowed');
            backButton.classList.remove('hover:bg-gray-100');
        } else { // Enable if navigated into children OR a top-level leaf is selected
            backButton.disabled = false;
            backButton.classList.remove('opacity-50', 'cursor-not-allowed');
            backButton.classList.add('hover:bg-gray-100');
        }
    }

    // --- Public Methods (API for this module) ---
    function init() {
        searchInput = document.getElementById('categorySearchInput');
        categoryListContainer = document.getElementById('categoryListContainer');
        selectedCategoriesDisplay = document.getElementById('selectedCategoriesDisplay');
        backButton = document.getElementById('categoryBackBtn'); // Assuming a back button with this ID

        if (!searchInput || !categoryListContainer || !selectedCategoriesDisplay) {
            console.error('CategorySearch: One or more essential DOM elements not found.');
            if(categoryListContainer) categoryListContainer.innerHTML = '<p class="text-sm text-red-500 text-center py-4">分类模块初始化错误。</p>';
            return;
        }
        if (!backButton) {
            console.warn('CategorySearch: Back button (#categoryBackBtn) not found. Back navigation will not work.');
        }
        
        console.log('CategorySearch module initialized for hierarchical selection.');
        currentDisplayCategories = [...hierarchicalMockCategories]; // Start with top-level
        navigationStack = [];
        selectedCategoryPath = [];

        renderCategories();
        updateSelectedCategoriesDisplay();
        updateBackButtonState(); // Initial state for back button

        searchInput.addEventListener('input', handleSearch);
        categoryListContainer.addEventListener('click', handleCategoryClick);
        if (backButton) {
            backButton.addEventListener('click', goBack);
        }
    }

    return {
        init: init,
        getSelectedCategoryPath: function() { return [...selectedCategoryPath]; }
    };
})();
