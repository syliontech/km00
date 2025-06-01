// JavaScript for New Category Management (v2)
console.log('category-management-v2-app.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements and event listeners here

    const addNewItemBtn = document.getElementById('addNewItemBtn');
    const itemModal = document.getElementById('itemModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const itemForm = document.getElementById('itemForm');

    if (addNewItemBtn) {
        addNewItemBtn.addEventListener('click', async () => {
            itemModal.style.display = 'flex';
            document.getElementById('modalTitle').textContent = '添加新条目 (L5)';
            itemForm.reset(); // Clear form for new entry
            document.getElementById('itemId').value = ''; // Ensure no ID from previous edit
            
            // Initialize dropdowns
            await initializeDropdowns();
        });
    }

    // Initialize dropdowns with data
    async function initializeDropdowns() {
        // Get all select elements
        const l1Select = document.getElementById(ELEMENTS.LEVEL_1.id);
        const l2Select = document.getElementById(ELEMENTS.LEVEL_2.id);
        const l3Select = document.getElementById(ELEMENTS.LEVEL_3.id);
        const l4Select = document.getElementById(ELEMENTS.LEVEL_4.id);
        const filterL1Select = document.getElementById(ELEMENTS.FILTERS.LEVEL_1);
        
        // Validate all required elements exist
        const requiredElements = [
            { element: l1Select, name: 'L1 Select' },
            { element: l2Select, name: 'L2 Select' },
            { element: l3Select, name: 'L3 Select' },
            { element: l4Select, name: 'L4 Select' },
            { element: filterL1Select, name: 'Filter L1 Select' }
        ];
        
        const missingElements = requiredElements.filter(item => !item.element);
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements.map(e => e.name).join(', '));
            return;
        }
        
        // Verify label associations
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
                const input = document.getElementById(forAttr);
                if (!input) {
                    console.warn(`Label with for="${forAttr}" has no associated form field`);
                }
            }
        });

        try {
            // 加载L1分类
            const l1Categories = await CategoryV2Service.getCategories({ level: 1 });
            console.log('Loaded L1 categories for add form:', l1Categories);
            
            if (!l1Categories || l1Categories.length === 0) {
                console.warn('No L1 categories found in the database');
            }
            
            // 初始化L1下拉框
            populateSelectWithOptions(l1Select, l1Categories, '请选择用途...', true);
            
            // 初始化L1筛选器
            if (filterL1Select) {
                populateSelectWithOptions(filterL1Select, l1Categories, '请选择用途...', false);
                filterL1Select.disabled = false;
                console.log('L1 filter initialized successfully');
            }
            
            // L1选择变化事件
            l1Select.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                if (!l2Select) return;
                
                if (selectedValue) {
                    try {
                        const l2Categories = await CategoryV2Service.getCategories({ 
                            parent_code: selectedValue, 
                            level: 2 
                        });
                        console.log('Loaded L2 categories:', l2Categories);
                        
                        populateSelectWithOptions(l2Select, l2Categories, '请选择产品分类...', true);
                        l2Select.disabled = false;
                        
                        // 清空下级下拉框
                        if (l3Select) {
                            l3Select.innerHTML = '<option value="">请选择产品细分...</option>';
                            l3Select.disabled = true;
                        }
                        if (l4Select) {
                            l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                            l4Select.disabled = true;
                        }
                    } catch (error) {
                        console.error('加载L2分类失败:', error);
                        alert('加载L2分类失败');
                    }
                } else {
                    l2Select.innerHTML = '<option value="">请选择产品分类...</option>';
                    l2Select.disabled = true;
                    
                    if (l3Select) {
                        l3Select.innerHTML = '<option value="">请选择产品细分...</option>';
                        l3Select.disabled = true;
                    }
                    if (l4Select) {
                        l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                        l4Select.disabled = true;
                    }
                }
            });
            
            // L2选择变化事件
            if (l2Select) {
                l2Select.addEventListener('change', async (event) => {
                    const selectedValue = event.target.value;
                    if (!l3Select) return;
                    
                    if (selectedValue) {
                        try {
                            const l3Categories = await CategoryV2Service.getCategories({ 
                                parent_code: selectedValue, 
                                level: 3 
                            });
                            console.log('Loaded L3 categories:', l3Categories);
                            
                            populateSelectWithOptions(l3Select, l3Categories, '请选择产品细分...', true);
                            l3Select.disabled = false;
                            
                            // 清空下级下拉框
                            if (l4Select) {
                                l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                                l4Select.disabled = true;
                            }
                        } catch (error) {
                            console.error('加载L3分类失败:', error);
                            alert('加载L3分类失败');
                        }
                    } else {
                        l3Select.innerHTML = '<option value="">请选择产品细分...</option>';
                        l3Select.disabled = true;
                        
                        if (l4Select) {
                            l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                            l4Select.disabled = true;
                        }
                    }
                });
            }
            
            // L3选择变化事件
            if (l3Select) {
                l3Select.addEventListener('change', async (event) => {
                    const selectedValue = event.target.value;
                    if (!l4Select) return;
                    
                    if (selectedValue) {
                        try {
                            const l4Categories = await CategoryV2Service.getCategories({ 
                                parent_code: selectedValue, 
                                level: 4 
                            });
                            console.log('Loaded L4 categories:', l4Categories);
                            
                            populateSelectWithOptions(l4Select, l4Categories, '请选择细分说明...', true);
                            l4Select.disabled = false;
                        } catch (error) {
                            console.error('加载L4分类失败:', error);
                            alert('加载L4分类失败');
                        }
                    } else {
                        l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                        l4Select.disabled = true;
                    }
                });
            }
            
            // L4选择变化事件（新增分类）
            if (l4Select) {
                l4Select.addEventListener('change', (event) => {
                    if (event.target.value === 'new') {
                        const l3Select = document.getElementById('产品细分');
                        if (l3Select && l3Select.value) {
                            handleNewCategory(4, l3Select.value, '细分说明', '请选择细分说明...');
                        } else {
                            alert('请先选择产品细分 (L3)');
                            event.target.value = '';
                        }
                    }
                });
            }
            
        } catch (error) {
            console.error('加载L1分类失败:', error);
            alert('加载L1分类失败');
        }
    } // End of initializeDropdowns

    // Initialize filter dropdowns
    const filterL1Select = document.getElementById('filterPurpose');
    const filterL2Select = document.getElementById('filterCategoryLevel');
    const filterL3Select = document.getElementById('filterSubcategory');
    const filterL4Select = document.getElementById('filterDetailLevel');

    // Function to initialize filter dropdowns
    async function initializeFilterDropdowns() {
        console.log('Initializing filter dropdowns...');
        
        // Initialize L1 filter
        if (filterL1Select) {
            try {
                console.log('Loading L1 categories for filter...');
                const l1Categories = await CategoryV2Service.getCategories({ level: 1 });
                console.log('Loaded L1 categories for filter:', l1Categories);
                
                // Populate L1 dropdown
                populateSelectWithOptions(filterL1Select, l1Categories, '请选择用途...', false);
                filterL1Select.disabled = false;
                
                // Add event listener for L1 changes
                filterL1Select.addEventListener('change', handleL1FilterChange);
                
                console.log('L1 filter initialized');
            } catch (error) {
                console.error('Failed to initialize L1 filter:', error);
                if (filterL1Select) {
                    filterL1Select.innerHTML = '<option value="">加载失败，请刷新重试</option>';
                    filterL1Select.disabled = true;
                }
            }
        }
        
        // Initialize L2-L4 dropdowns as disabled
        if (filterL2Select) {
            filterL2Select.innerHTML = '<option value="">请先选择L1分类</option>';
            filterL2Select.disabled = true;
            filterL2Select.addEventListener('change', handleL2FilterChange);
        }
        
        if (filterL3Select) {
            filterL3Select.innerHTML = '<option value="">请先选择L2分类</option>';
            filterL3Select.disabled = true;
            filterL3Select.addEventListener('change', handleL3FilterChange);
        }
        
        if (filterL4Select) {
            filterL4Select.innerHTML = '<option value="">请先选择L3分类</option>';
            filterL4Select.disabled = true;
        }
    }
    
    // L1 Filter Change Handler
    async function handleL1FilterChange(event) {
        const selectedValue = event.target.value;
        console.log('L1 filter changed:', selectedValue);
        
        // Clear and disable L2-L4 filters
        if (filterL2Select) {
            filterL2Select.innerHTML = '<option value="">加载中...</option>';
            filterL2Select.disabled = true;
        }
        if (filterL3Select) {
            filterL3Select.innerHTML = '<option value="">请先选择L2分类</option>';
            filterL3Select.disabled = true;
        }
        if (filterL4Select) {
            filterL4Select.innerHTML = '<option value="">请先选择L3分类</option>';
            filterL4Select.disabled = true;
        }
        
        if (selectedValue) {
            try {
                // Load L2 categories
                const l2Categories = await CategoryV2Service.getCategories({ 
                    parent_code: selectedValue, 
                    level: 2 
                });
                
                console.log('Loaded L2 categories for filter:', l2Categories);
                
                if (filterL2Select) {
                    // Clear and populate L2 dropdown
                    populateSelectWithOptions(filterL2Select, l2Categories, '请选择产品分类...', false);
                    filterL2Select.disabled = false;
                    
                    // If we have L2 categories, trigger change to load L3
                    if (l2Categories && l2Categories.length > 0) {
                        filterL2Select.dispatchEvent(new Event('change'));
                    }
                }
            } catch (error) {
                console.error('加载L2筛选分类失败:', error);
                if (filterL2Select) {
                    filterL2Select.innerHTML = '<option value="">加载失败，请重试</option>';
                    filterL2Select.disabled = true;
                }
            }
        }
        
        // Update the display
        await displayCategoriesBasedOnFilters();
    }
    
    // L2 Filter Change Handler
    async function handleL2FilterChange(event) {
        const selectedValue = event.target.value;
        console.log('L2 filter changed:', selectedValue);
        
        // Clear and disable L3-L4 filters
        if (filterL3Select) {
            filterL3Select.innerHTML = '<option value="">加载中...</option>';
            filterL3Select.disabled = true;
        }
        if (filterL4Select) {
            filterL4Select.innerHTML = '<option value="">请先选择L3分类</option>';
            filterL4Select.disabled = true;
        }
        
        if (selectedValue) {
            try {
                // Load L3 categories
                const l3Categories = await CategoryV2Service.getCategories({ 
                    parent_code: selectedValue, 
                    level: 3 
                });
                
                console.log('Loaded L3 categories for filter:', l3Categories);
                
                if (filterL3Select) {
                    // Clear and populate L3 dropdown
                    populateSelectWithOptions(filterL3Select, l3Categories, '请选择产品细分...', false);
                    filterL3Select.disabled = false;
                    
                    // If we have L3 categories, trigger change to load L4
                    if (l3Categories && l3Categories.length > 0) {
                        filterL3Select.dispatchEvent(new Event('change'));
                    }
                }
            } catch (error) {
                console.error('加载L3筛选分类失败:', error);
                if (filterL3Select) {
                    filterL3Select.innerHTML = '<option value="">加载失败，请重试</option>';
                    filterL3Select.disabled = true;
                }
            }
        }
        
        // Update the display
        await displayCategoriesBasedOnFilters();
    }
    
    // L3 Filter Change Handler
    async function handleL3FilterChange(event) {
        const selectedValue = event.target.value;
        console.log('L3 filter changed:', selectedValue);
        
        // Clear and disable L4 filter
        if (filterL4Select) {
            filterL4Select.innerHTML = '<option value="">加载中...</option>';
            filterL4Select.disabled = true;
        }
        
        if (selectedValue) {
            try {
                // Load L4 categories
                const l4Categories = await CategoryV2Service.getCategories({ 
                    parent_code: selectedValue, 
                    level: 4 
                });
                
                console.log('Loaded L4 categories for filter:', l4Categories);
                
                if (filterL4Select) {
                    // Clear and populate L4 dropdown
                    populateSelectWithOptions(filterL4Select, l4Categories, '请选择细分说明...', false);
                    filterL4Select.disabled = false;
                }
            } catch (error) {
                console.error('加载L4筛选分类失败:', error);
                if (filterL4Select) {
                    filterL4Select.innerHTML = '<option value="">加载失败，请重试</option>';
                    filterL4Select.disabled = true;
                }
            }
        }
        
        // Update the display
        await displayCategoriesBasedOnFilters();
async function handleNewCategory(level, parentCode, selectElementId, defaultText) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`Element with ID ${selectElementId} not found`);
        return;
    }

    const levelInfo = getLevelInfo(level);
    const inputContainer = document.getElementById(levelInfo.id)?.parentNode;
    
    if (!inputContainer) {
        console.error(`Input container for ${levelInfo.label} not found`);
        return;
    }

    // Create input field UI
    inputContainer.innerHTML = `
        <label for="${levelInfo.id}" class="block text-sm font-medium text-gray-700">
            ${levelInfo.label} (直接输入)
        </label>
        <div class="mt-1 flex rounded-md shadow-sm">
            <input type="text" id="${levelInfo.id}" name="${levelInfo.id}" 
                class="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                placeholder="请输入新的${levelInfo.label}..." 
                autofocus
                required>
            <button type="button" id="saveNew${level}" class="ml-2 px-3 py-2 border border-green-600 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                保存
            </button>
            <button type="button" id="cancelNew${level}" class="ml-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                取消
            </button>
        </div>
    `;
                    
    const newInput = document.getElementById(levelInfo.id);
    const saveBtn = document.getElementById(`saveNew${level}`);
    const cancelBtn = document.getElementById(`cancelNew${level}`);
    
    if (!newInput || !saveBtn || !cancelBtn) {
        console.error('Failed to initialize new category UI elements');
        return;
    }
    
    // Focus the input field
    newInput.focus();
    
    // Save on save button click
    saveBtn.addEventListener('click', async () => {
        await saveNewCategory(level, parentCode, selectElementId, defaultText, newInput);
    });
    
    // Save on Enter key
    newInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await saveNewCategory(level, parentCode, selectElementId, defaultText, newInput);
        }
    });
    
    // Handle cancel button
    cancelBtn.addEventListener('click', async () => {
        await loadFilterWithOptions(level, parentCode, selectElementId, defaultText);
    });
    
    // Function to save a new category
    async function saveNewCategory(level, parentCode, selectElementId, defaultText, inputElement) {
        const newName = inputElement.value.trim();
        if (!newName) {
            alert('请输入有效的名称');
            inputElement.focus();
            return;
        }
        
        try {
            const result = await CategoryV2Service.saveCategory({
                name: newName,
                parent_code: level > 1 ? parentCode : null,
                level: level
            });
            
            if (result && result.code) {
                await loadFilterWithOptions(level, parentCode, selectElementId, defaultText);
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存新分类失败:', error);
            alert('保存新分类时发生错误，请重试。');
            inputElement.focus();
        }
    }

    // Add event listener for add item L1 dropdown
    const l1Select = document.getElementById('addItem用途');
    if (l1Select) {
        l1Select.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            
            if (selectedValue === 'new') {
                await handleNewCategory(1, null, 'addItem用途', '请选择用途...');
                return;
            }
            
            const l2Select = document.getElementById('addItem产品分类');
            
            if (selectedValue) {
                try {
                    const l2Categories = await CategoryV2Service.getCategories({ parent_code: selectedValue, level: 2 });
                    populateSelectWithOptions(l2Select, l2Categories, '请选择产品分类...', true);
                    
                    // Clear L3 and L4 dropdowns
                    const l3Select = document.getElementById('addItem产品细分');
                    const l4Select = document.getElementById('addItem细分说明');
                    if (l3Select) l3Select.innerHTML = '<option value="">请选择产品细分...</option>';
                    if (l4Select) l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                } catch (error) {
                    console.error('Error loading L2 categories:', error);
                    alert('加载L2分类失败');
                }
            } else if (l2Select) {
                l2Select.innerHTML = '<option value="">请选择产品分类...</option>';
            }
        });
    }

    // Add event listener for add item L2 dropdown
    const l2Select = document.getElementById('addItem产品分类');
    if (l2Select) {
        l2Select.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            
            if (selectedValue === 'new') {
                const l1Select = document.getElementById('addItem用途');
                if (l1Select && l1Select.value) {
                    await handleNewCategory(2, l1Select.value, 'addItem产品分类', '请选择产品分类...');
                } else {
                    alert('请先选择用途 (L1)');
                    event.target.value = '';
                }
                return;
            }
            
            const l3Select = document.getElementById('addItem产品细分');
            
            if (selectedValue) {
                try {
                    const l3Categories = await CategoryV2Service.getCategories({ parent_code: selectedValue, level: 3 });
                    populateSelectWithOptions(l3Select, l3Categories, '请选择产品细分...', true);
                    
                    // Clear L4 dropdown
                    const l4Select = document.getElementById('addItem细分说明');
                    if (l4Select) l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
                } catch (error) {
                    console.error('Error loading L3 categories:', error);
                    alert('加载L3分类失败');
                }
            } else if (l3Select) {
                l3Select.innerHTML = '<option value="">请选择产品细分...</option>';
            }
        });
    }

    // Add event listener for add item L3 dropdown
    const l3Select = document.getElementById('addItem产品细分');
    if (l3Select) {
        l3Select.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            
            if (selectedValue === 'new') {
                const l2Select = document.getElementById('addItem产品分类');
                if (l2Select && l2Select.value) {
                    await handleNewCategory(3, l2Select.value, 'addItem产品细分', '请选择产品细分...');
                } else {
                    alert('请先选择产品分类 (L2)');
                    event.target.value = '';
                }
                return;
            }
            
            const l4Select = document.getElementById('addItem细分说明');
            
            if (selectedValue) {
                try {
                    const l4Categories = await CategoryV2Service.getCategories({ parent_code: selectedValue, level: 4 });
                    populateSelectWithOptions(l4Select, l4Categories, '请选择细分说明...', true);
                } catch (error) {
                    console.error('Error loading L4 categories:', error);
                    alert('加载L4分类失败');
                }
            } else if (l4Select) {
                l4Select.innerHTML = '<option value="">请选择细分说明...</option>';
            }
        });
    }
    
    // Add event listener for add item L4 dropdown
    const l4Select = document.getElementById('addItem细分说明');
    if (l4Select) {
        l4Select.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            
            if (selectedValue === 'new') {
                const l3Select = document.getElementById('addItem产品细分');
                if (l3Select && l3Select.value) {
                    await handleNewCategory(4, l3Select.value, 'addItem细分说明', '请选择细分说明...');
                } else {
                    alert('请先选择产品细分 (L3)');
                    event.target.value = '';
                }
            }
        });
    }

    function closeModal() {
        itemModal.style.display = 'none';
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }

    // Close modal if clicked outside of it
    window.addEventListener('click', (event) => {
        if (event.target === itemModal) {
            closeModal();
        }
    });

    if(itemForm){
        itemForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Form submitted');

            // Get data from form fields using correct IDs
            const level1Name = document.getElementById('用途')?.value.trim();
            const level2Name = document.getElementById('产品分类')?.value.trim();
            const level3Name = document.getElementById('产品细分')?.value.trim();
            const level4Name = document.getElementById('细分说明')?.value.trim();
            const level5ItemName = document.getElementById('modalItemName')?.value.trim();

            if (!level1Name || !level2Name || !level3Name || !level4Name || !level5ItemName) {
                console.error('All L1-L5 names are required.');
                alert('请填写所有层级 (L1-L4) 的名称以及L5项目名称。'); // Please fill all level (L1-L4) names and the L5 item name.
                return;
            }

            const itemData = {
                level1Name,
                level2Name,
                level3Name,
                level4Name,
                level5ItemName
            };

            console.log('Attempting to save item:', itemData);

            try {
                const result = await CategoryV2Service.saveItem(itemData);
                if (result && result.code) {
                    console.log('Item saved successfully:', result);
                    alert(`条目已保存！新代码: ${result.code}`); // Item saved! New code: ...
                    closeModal();
                    await displayCategoriesBasedOnFilters(); // Refresh the category display
                    itemForm.reset(); // Reset form after successful submission
                } else {
                    console.error('Failed to save item. Result:', result);
                    alert('保存条目失败，请检查控制台获取更多信息。'); // Failed to save item, check console for more info.
                }
            } catch (error) {
                console.error('Error saving item:', error);
                alert(`保存条目时出错: ${error.message}`); // Error saving item: ...
            }
        });
    }

    // Helper function to populate a select dropdown
    function populateSelectWithOptions(selectElement, options, defaultOptionText = '请选择...', showNewOption = false) {
        if (!selectElement) return;
        
        // Store the current value to restore it after repopulating
        const currentValue = selectElement.value;
        
        // Clear existing options
        selectElement.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultOptionText;
        selectElement.appendChild(defaultOption);

        // Add all category options
        if (options && Array.isArray(options)) {
            options.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.code || option.value || '';
                optElement.textContent = option.name || option.text || '';
                selectElement.appendChild(optElement);
            });
        }

        // Add "新建" option at the bottom if showNewOption is true
        if (showNewOption) {
            const newOption = document.createElement('option');
            newOption.value = 'new';
            newOption.textContent = '新建';
            newOption.className = 'text-blue-600 font-semibold';
            selectElement.appendChild(newOption);
        }
        
        // Restore the previous value if it still exists in the options
        if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
            selectElement.value = currentValue;
        }
    }

    // Function to load filter options (compatibility function, not used in new implementation)
    async function loadFilterWithOptions(level, parentCode, selectElementId, defaultText) {
        console.log(`[Deprecated] loadFilterWithOptions called for L${level} with parent ${parentCode}`);
        
        // This function is kept for backward compatibility but the actual implementation
        // is now handled by the individual filter change handlers
        
        try {
            const filterElement = document.getElementById(selectElementId);
            if (!filterElement) {
                console.error(`Filter dropdown ${selectElementId} not found.`);
                return [];
            }
            
            // Just return the current options if any
            const options = Array.from(filterElement.options)
                .filter(opt => opt.value)
                .map(opt => ({
                    code: opt.value,
                    name: opt.text,
                    level: parseInt(selectElementId.replace(/\D/g, '')) || 1
                }));
                
            return options;
        } catch (error) {
            console.error(`Error in loadFilterWithOptions:`, error);
            return [];
        }
    }

    // Function to load purpose filter (kept for backward compatibility)
    async function loadPurposeFilter() {
        console.log('[Deprecated] loadPurposeFilter called - using new filter implementation');
        
        // This function is kept for backward compatibility but the actual implementation
        // is now handled by initializeFilterDropdowns and handleL1FilterChange
        
        try {
            const purposeElement = document.getElementById('filterPurpose');
            if (!purposeElement) {
                console.error('Purpose filter dropdown not found.');
                return [];
            }
            
            // Just return the current L1 options if any
            const options = Array.from(purposeElement.options)
                .filter(opt => opt.value)
                .map(opt => ({
                    code: opt.value,
                    name: opt.text,
                    level: 1
                }));
                
            return options;
        } catch (error) {
            console.error('Error in loadPurposeFilter:', error);
            return [];
        }
    }

    // Helper function to recursively fetch ancestors of a category
    async function getAncestors(categoryCode) {
        const ancestors = [];
        let currentCode = categoryCode;
        while (currentCode) {
            try {
                // Fetch the category by its code
                const category = await CategoryV2Service.getCategories({ code: currentCode });
                if (category && category.length > 0) {
                    const currentCategory = category[0];
                    if (currentCategory.level > 1) {
                        ancestors.unshift(currentCategory); // Add to the beginning of the array
                        currentCode = currentCategory.parent_code;
                    } else {
                        ancestors.unshift(currentCategory); // Add L1 and stop
                        currentCode = null;
                    }
                } else {
                    currentCode = null; // Stop if category not found
                }
            } catch (error) {
                console.error(`Error fetching ancestor with code ${currentCode}:`, error);
                currentCode = null; // Stop on error
            }
        }
        return ancestors;
    }

    async function displayCategoriesBasedOnFilters() {
        console.log('Displaying categories based on filters...');
        const displayArea = document.getElementById('categoryDisplayArea');
        if (!displayArea) {
            console.error('Category display area not found.');
            return;
        }
        
        // Show loading state
        displayArea.innerHTML = '<p class="text-gray-500">正在加载分类...</p>';

        // Get current filter values safely with optional chaining
        const filterPurpose = document.getElementById('filterPurpose')?.value || '';
        const filterCategoryLevel = document.getElementById('filterCategoryLevel')?.value || '';
        const filterSubcategory = document.getElementById('filterSubcategory')?.value || '';
        const filterDetailLevel = document.getElementById('filterDetailLevel')?.value || '';

        console.log('Current filter values:', {
            filterPurpose,
            filterCategoryLevel,
            filterSubcategory,
            filterDetailLevel
        });

        let categoriesToDisplay = [];
        let query = {};
        let targetLevel = 1; // Default to L1

        try {
            // Determine the query based on the most specific filter selected
            if (filterDetailLevel) {
                // If L4 is selected, show L5 items
                query = { parent_code: filterDetailLevel };
                targetLevel = 5;
            } else if (filterSubcategory) {
                // If L3 is selected, show L4 items
                query = { parent_code: filterSubcategory };
                targetLevel = 4;
            } else if (filterCategoryLevel) {
                // If L2 is selected, show L3 items
                query = { parent_code: filterCategoryLevel };
                targetLevel = 3;
            } else if (filterPurpose) {
                // If L1 is selected, show L2 items
                query = { parent_code: filterPurpose };
                targetLevel = 2;
            } else {
                // If no filter is selected, show L1 items
                query = { level: 1 };
                targetLevel = 1;
            }

            // Check if CategoryV2Service is available
            if (typeof CategoryV2Service === 'undefined' || typeof CategoryV2Service.getCategories !== 'function') {
                throw new Error('CategoryV2Service or getCategories function is not available.');
            }

            // Show loading state
            displayArea.innerHTML = `
                <div class="flex items-center justify-center p-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    <span class="text-gray-600">正在加载分类数据...</span>
                </div>
            `;

            const response = await CategoryV2Service.getCategories(query);
            categoriesToDisplay = response && Array.isArray(response.data) ? response.data : [];
            
            if (categoriesToDisplay.length === 0) {
                    displayArea.innerHTML = `
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">
                                        当前筛选条件下没有找到分类。请尝试其他筛选条件。
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                // Clear loading/previous content
                displayArea.innerHTML = '';
                
                // Create responsive table with scrollable content
                const tableContainer = document.createElement('div');
                tableContainer.className = 'overflow-x-auto mb-4';

                const tableElement = document.createElement('table');
                tableElement.className = 'min-w-full divide-y divide-gray-200';
                tableElement.setAttribute('aria-label', '分类数据表');

                // Create table header
                const theadElement = document.createElement('thead');
                theadElement.className = 'bg-gray-50';
                
                // Create header row with appropriate columns based on the current filter level
                let headerRowHTML = '<tr>';
                
                // Always show ID column
                headerRowHTML += `
                    <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        ID
                    </th>`;
                
                // Add level-specific headers based on the current filter context
                if (targetLevel === 1) {
                    // L1 view - show L1 columns
                    headerRowHTML += `
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 英文名称
                        </th>`;
                } else if (targetLevel === 2) {
                    // L2 view - show L1 and L2 columns
                    headerRowHTML += `
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 英文名称
                        </th>`;
                } else if (targetLevel === 3) {
                    // L3 view - show L1, L2, and L3 columns
                    headerRowHTML += `
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 英文名称
                        </th>`;
                } else if (targetLevel === 4) {
                    // L4 view - show L1, L2, L3, and L4 columns
                    headerRowHTML += `
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L4 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L4 英文名称
                        </th>`;
                } else if (targetLevel === 5) {
                    // L5 view - show all columns including L5
                    headerRowHTML += `
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L1 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L2 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L3 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L4 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L4 英文名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L5 编码
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L5 名称
                        </th>
                        <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            L5 英文名称
                        </th>`;
                }
                
                // Add action column header
                headerRowHTML += `
                    <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        操作
                    </th>
                </tr>`;
                
                // Set the header row HTML
                theadElement.innerHTML = headerRowHTML;
                tableElement.appendChild(theadElement);
                tableContainer.appendChild(tableElement);

                // Create table body
                const tbodyElement = document.createElement('tbody');
                
                // Process each category and add it to the table
                for (const category of categoriesToDisplay) {
                    try {
                        // Get all ancestors for the current category
                        const ancestors = await getAncestors(category.parent_code);
                        const allLevels = [...ancestors, category];

                        // Extract category data for each level
                        const l1 = allLevels.find(cat => cat.level === 1) || {};
                        const l2 = allLevels.find(cat => cat.level === 2) || {};
                        const l3 = allLevels.find(cat => cat.level === 3) || {};
                        const l4 = allLevels.find(cat => cat.level === 4) || {};
                        const l5 = allLevels.find(cat => cat.level === 5) || {};

                        const row = document.createElement('tr');
                        const rowClass = category.is_new ? 'bg-green-50' : '';
                        
                        // Start building the row HTML
                        let rowHTML = '';
                        
                        // Add ID column
                        rowHTML += `
                            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                ${category.category_pkey || ''}
                            </td>`;
                        
                        // Add columns based on the current target level
                        if (targetLevel >= 1) {
                            // L1 columns
                            rowHTML += `
                                <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                    ${l1.name || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                    ${l1.ename || ''}
                                </td>`;
                        }
                        
                        if (targetLevel >= 2) {
                            // L2 columns
                            rowHTML += `
                                <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                    ${l2.name || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                    ${l2.ename || ''}
                                </td>`;
                        }
                        
                        if (targetLevel >= 3) {
                            // L3 columns
                            rowHTML += `
                                <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                    ${l3.name || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                    ${l3.ename || ''}
                                </td>`;
                        }
                        
                        if (targetLevel >= 4) {
                            // L4 columns
                            rowHTML += `
                                <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                    ${l4.name || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                    ${l4.ename || ''}
                                </td>`;
                        }
                        
                        if (targetLevel === 5) {
                            // L5 columns (only show for L5 view)
                            rowHTML += `
                                <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900 ${rowClass}">
                                    ${l5.code || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                    ${l5.name || ''}
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${rowClass}">
                                    ${l5.ename || ''}
                                </td>`;
                        }
                        
                        // Add action buttons
                        rowHTML += `
                            <td class="px-4 py-4 whitespace-nowrap text-sm ${rowClass}">
                                <div class="flex space-x-2">
                                    <button class="btn-edit px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
                                            data-id="${category.category_pkey}" 
                                            title="编辑">
                                        <i class="fas fa-edit"></i> 编辑
                                    </button>
                                    <button class="btn-delete px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors" 
                                            data-id="${category.category_pkey}"
                                            title="删除">
                                        <i class="fas fa-trash"></i> 删除
                                    </button>
                                    <button class="btn-copy px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" 
                                            data-id="${category.category_pkey}"
                                            title="复制新建">
                                        <i class="far fa-copy"></i> 复制
                                    </button>
                                </div>
                            </td>
                        `;
                        
                        // Set the row HTML and add it to the table
                        row.innerHTML = rowHTML;
                        tbodyElement.appendChild(row);
                        
                    } catch (error) {
                        console.error('Error processing category:', category, error);
                        // Add an error row if there's an issue with a specific category
                        const errorRow = document.createElement('tr');
                        errorRow.innerHTML = `
                            <td colspan="10" class="px-4 py-2 text-sm text-red-600 bg-red-50">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                加载分类数据时出错: ${error.message || '未知错误'}
                            </td>
                        `;
                        tbodyElement.appendChild(errorRow);
                    }
                }

                // Append the table body to the table
                tableElement.appendChild(tbodyElement);
                
                // Clear the display area and append the table container
                displayArea.innerHTML = '';
                displayArea.appendChild(tableContainer);

                // Add event listeners for action buttons
                const setupButtonListeners = () => {
                    // Handle all button clicks in the display area using event delegation
                    displayArea.addEventListener('click', async (event) => {
                        const target = event.target;
                        
                        // Handle Edit button click
                        if (target.classList.contains('btn-edit')) {
                            await handleEditClick(event, target);
                        }
                        // Handle Delete button click
                        else if (target.classList.contains('btn-delete')) {
                            await handleDeleteClick(event, target);
                        }
                        // Handle Copy button click
                        else if (target.classList.contains('btn-copy')) {
                            await handleCopyClick(event, target);
                        }
                    });
                };

                // Handle Edit button click
                const handleEditClick = async (event, button) => {
                    event.preventDefault();
                    const itemId = button.dataset.id;
                    
                    if (!itemId) {
                        console.error('Edit button clicked but no data-id found.');
                        return;
                    }

                    let originalText = '';
                    
                    try {
                        // Show loading state
                        originalText = button.innerHTML;
                        button.disabled = true;
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
                        
                        const category = await CategoryV2Service.getCategoryById(itemId);
                        if (!category) {
                            throw new Error('未找到分类数据');
                        }

                        // Get the modal elements
                        const modal = document.getElementById('itemModal');
                        const modalTitle = document.getElementById('modalTitle');
                        const itemIdInput = document.getElementById('itemId');
                        const itemNameInput = document.getElementById('modalItemName');
                        const form = document.getElementById('itemForm');
                        
                        // Validate required elements
                        if (!modal || !modalTitle || !itemIdInput || !itemNameInput || !form) {
                            throw new Error('无法加载编辑表单，请刷新页面后重试');
                        }
                        
                        // Set modal title and reset form
                        modalTitle.textContent = '编辑分类';
                        form.reset();
                        
                        // Set basic fields
                        itemIdInput.value = itemId;
                        itemNameInput.value = category.name || '';
                        
                        // Set code if available
                        const codeInput = document.getElementById('code');
                        if (codeInput) {
                            codeInput.value = category.code || '';
                            codeInput.disabled = true; // Disable code editing
                        }
                        
                        // Set level-specific fields
                        const level = parseInt(category.level) || 1;
                        
                        // Reset all level selects
                        const levelSelects = [
                            document.getElementById('用途'),
                            document.getElementById('产品分类'),
                            document.getElementById('产品细分'),
                            document.getElementById('细分说明')
                        ];
                        
                        levelSelects.forEach(select => {
                            if (select) {
                                select.value = '';
                                select.disabled = true;
                            }
                        });
                        
                        // Enable and set values for parent levels
                        for (let i = 0; i < level - 1 && i < levelSelects.length; i++) {
                            if (levelSelects[i]) {
                                levelSelects[i].disabled = false;
                                // Here you would set the actual parent values
                                // For now, we'll just enable the appropriate selects
                            }
                        }
                        
                        // Show the modal
                        modal.style.display = 'flex';
                        
                        // Initialize dropdowns if needed
                        await initializeDropdowns();
                        
                        // Focus the first input field
                        setTimeout(() => {
                            itemNameInput.focus();
                        }, 100);
                        
                    } catch (error) {
                        console.error('编辑分类加载失败:', error);
                        alert(`加载分类信息失败: ${error.message || '请稍后再试'}`);
                    } finally {
                        // Always restore button state
                        if (button) {
                            button.disabled = false;
                            button.innerHTML = originalText;
                        }
                    }
                };

                // Handle Delete button click
                const handleDeleteClick = async (event, button) => {
                    event.preventDefault();
                    const itemId = button.dataset.id;
                    
                    if (!itemId) {
                        console.error('Delete button clicked but no data-id found.');
                        return;
                    }
                    
                    if (!confirm('确定要删除此分类吗？此操作不可撤销。')) {
                        return;
                    }
                    
                    let originalText = '';
                    
                    try {
                        // Show loading state
                        originalText = button.innerHTML;
                        button.disabled = true;
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 删除中...';
                        
                        // Call the delete API
                        const result = await CategoryV2Service.deleteCategory(itemId);
                        
                        if (result && result.success) {
                            // Show success message
                            alert('分类删除成功');
                            // Refresh the category list
                            await displayCategoriesBasedOnFilters();
                        } else {
                            throw new Error(result?.error || '删除失败');
                        }
                    } catch (error) {
                        console.error('Error deleting category:', error);
                        alert(`删除分类失败: ${error.message || '未知错误'}`);
                    } finally {
                        // Reset button state
                        if (button) {
                            button.disabled = false;
                            button.innerHTML = originalText;
                        }
                    }
                };
                
                // Handle Copy button click
                const handleCopyClick = async (event, button) => {
                    event.preventDefault();
                    const itemId = button.dataset.id;
                    
                    if (!itemId) {
                        console.error('Copy button clicked but no data-id found.');
                        return;
                    }
                    
                    let originalText = '';
                    
                    try {
                        // Show loading state
                        originalText = button.innerHTML;
                        button.disabled = true;
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 复制中...';
                        
                        // Get the category data
                        const category = await CategoryV2Service.getCategoryById(itemId);
                        if (!category) {
                            throw new Error('无法加载分类数据');
                        }
                        
                        // Get the modal elements
                        const modal = document.getElementById('itemModal');
                        const modalTitle = document.getElementById('modalTitle');
                        const itemIdInput = document.getElementById('itemId');
                        const itemNameInput = document.getElementById('modalItemName');
                        const form = document.getElementById('itemForm');
                        
                        if (!modal || !modalTitle || !itemIdInput || !itemNameInput || !form) {
                            throw new Error('无法加载复制表单，请刷新页面后重试');
                        }
                        
                        // Set modal title (empty ID for new item)
                        modalTitle.textContent = '复制新建分类';
                        itemIdInput.value = ''; // Empty for new item
                        
                        // Set category name with "(复制)" suffix
                        itemNameInput.value = `${category.name || '新分类'} (复制)`;
                        
                        // Set code if available (clear for new item)
                        const codeInput = document.getElementById('code');
                        if (codeInput) {
                            codeInput.value = ''; // Clear code for new item
                            codeInput.disabled = false; // Enable code editing for new item
                        }
                        
                        // Set parent category based on the copied item's level
                        const level = parseInt(category.level) || 1;
                        
                        // Reset all level selects
                        const levelSelects = [
                            document.getElementById('用途'),
                            document.getElementById('产品分类'),
                            document.getElementById('产品细分'),
                            document.getElementById('细分说明')
                        ];
                        
                        // Enable and set values for parent levels
                        for (let i = 0; i < level - 1 && i < levelSelects.length; i++) {
                            if (levelSelects[i]) {
                                levelSelects[i].disabled = false;
                                // Here you would set the actual parent values
                                // For now, we'll just enable the appropriate selects
                            }
                        }
                        
                        // Show the modal
                        modal.style.display = 'flex';
                        
                        // Initialize dropdowns if needed
                        await initializeDropdowns();
                        
                        // Focus the first input field
                        if (itemNameInput) {
                            setTimeout(() => {
                                itemNameInput.focus();
                                itemNameInput.select();
                            }, 100);
                        }
                        
                    } catch (error) {
                        console.error('Error preparing to copy category:', error);
                        alert(`准备复制分类时出错: ${error.message || '未知错误'}`);
                    } finally {
                        // Reset button state
                        if (button) {
                            button.disabled = false;
                            button.innerHTML = originalText;
                        }
                    }
                };
                
                // Set up all button listeners
                setupButtonListeners();

                // Delete button click handler is now part of setupButtonListeners
                // Copy button click handler is now part of setupButtonListeners
            } // End of if (categoriesToDisplay.length > 0)
        } catch (error) {
            console.error('Error in displayCategoriesBasedOnFilters:', error);
            displayArea.innerHTML = '<p class="text-red-500">加载分类时发生错误: ' + (error.message || '未知错误') + '</p>';
        }
    }

    // Load initial data and set up filter dropdowns
    async function loadInitialData() {
        console.log('Loading initial data (filters, categories)...');
        try {
            // Initialize all dropdowns
            await initializeDropdowns();
            initializeL2Dropdown();
            initializeL3Dropdown();
            initializeL4Dropdown();
            await initializeFilterDropdowns();
            
            // Get the L1 filter select element
            const filterL1Select = document.getElementById('filterPurpose');
            
            // Initial display of categories based on current filters (which should be empty)
            await displayCategoriesBasedOnFilters();
            
            // If there's a selected L1 value, trigger the change event to load L2
            if (filterL1Select && filterL1Select.value) {
                console.log('Triggering initial L1 change event...');
                const event = new Event('change', { bubbles: true });
                filterL1Select.dispatchEvent(event);
            } else {
                // If no L1 is selected, just display all top-level categories
                await displayCategoriesBasedOnFilters();
            }
            
            // Add event listeners for filter changes
            if (filterL1Select) {
                filterL1Select.addEventListener('change', handleL1FilterChange);
                
                // Also set up the other filter change handlers
                const filterL2Select = document.getElementById('filterCategoryLevel');
                if (filterL2Select) {
                    filterL2Select.addEventListener('change', handleL2FilterChange);
                }
                
                const filterL3Select = document.getElementById('filterSubcategory');
                if (filterL3Select) {
                    filterL3Select.addEventListener('change', handleL3FilterChange);
                }
            }
        } catch (error) {
            console.error('Error in loadInitialData:', error);
        }
    }

    loadInitialData();
});

// End of file
