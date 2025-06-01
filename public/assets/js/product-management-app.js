/**
 * 产品管理应用
 * 处理产品页面的交互逻辑
 */
class ProductManagementApp {
    constructor() {
        // 服务实例
        this.productService = new ProductService();
        this.categoryService = new CategoryService();
        
        // DOM元素
        this.productFormModal = document.getElementById('productFormModal');
        this.productForm = document.getElementById('productForm');
        this.modalTitle = document.getElementById('modalTitle');
        
        // 产品属性和规格相关
        this.productType = document.getElementById('productType');
        this.productUnit = document.getElementById('productUnit');
        this.specFields = document.getElementById('specFields');
        this.addSpecFieldBtn = document.getElementById('addSpecFieldBtn');
        this.specChangeAlert = document.getElementById('specChangeAlert');
        this.saveAsNewBtn = document.getElementById('saveAsNewBtn');
        this.cancelSpecChangeBtn = document.getElementById('cancelSpecChangeBtn');
        
        // 组套产品管理
        this.groupProductSection = document.getElementById('groupProductSection');
        this.addGroupProductBtn = document.getElementById('addGroupProductBtn');
        this.groupProductList = document.getElementById('groupProductList');
        
        // 供应商和客户产品管理
        this.supplierFilter = document.getElementById('supplierFilter');
        this.addSupplierProductBtn = document.getElementById('addSupplierProductBtn');
        this.supplierProductList = document.getElementById('supplierProductList');
        this.customerFilter = document.getElementById('customerFilter');
        this.addCustomerProductBtn = document.getElementById('addCustomerProductBtn');
        this.customerProductList = document.getElementById('customerProductList');
        
        // 筛选相关元素
        this.categoryFilter = document.getElementById('category_filter');
        this.filterCategoryBtn = document.getElementById('filterCategoryBtn');
        this.clientFilter = document.getElementById('client_filter');
        this.filterClientBtn = document.getElementById('filterClientBtn');
        this.vendorFilter = document.getElementById('vendor_filter');
        this.filterVendorBtn = document.getElementById('filterVendorBtn');
        
        // 按钮
        this.addProductBtn = document.getElementById('addProductBtn');
        this.copyProductBtn = document.getElementById('copyProductBtn');
        this.editProductBtn = document.getElementById('editProductBtn');
        this.deleteProductBtn = document.getElementById('deleteProductBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // 文件上传相关
        this.fileUploadContainers = document.querySelectorAll('.file-upload-container');
        this.filePreviewModal = document.getElementById('filePreviewModal');
        this.closeFilePreviewBtn = document.getElementById('closeFilePreviewBtn');
        
        // 状态
        this.isEditMode = false;
        this.isCopyMode = false;
        this.currentProductId = null;
        this.originalSpecValues = {}; // 用于跟踪规格字段的原始值
        this.hasSpecChanged = false; // 规格是否发生变化
        this.customSpecFields = []; // 自定义规格字段
        this.groupProducts = []; // 组套产品列表
        this.supplierProducts = []; // 供应商产品列表
        this.customerProducts = []; // 客户产品列表
        this.uploadedFiles = {
            productImages: [],
            productDocuments: []
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        console.log('初始化产品管理应用...');
        
        try {
            // 初始化Supabase
            if (typeof initSupabase === 'function') {
                console.log('尝试初始化Supabase...');
                initSupabase();
                
                // 等待一下，确保Supabase客户端初始化完成
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 初始化产品服务
            const productInitResult = await this.productService.init();
            if (!productInitResult) {
                console.warn('产品服务初始化失败，但将继续尝试加载数据');
            }
            
            // 加载产品数据
            await this.loadProducts();
            
            // 加载分类数据到下拉框
            await this.loadCategoryOptions();
            
            // 绑定事件
            this.bindEvents();
            
            console.log('产品管理应用初始化成功');
            
            // 显示提示信息
            if (!productInitResult) {
                this.showNotification('产品管理应用已加载，但可能需要创建产品表', 'info');
            }
        } catch (error) {
            console.error('产品管理应用初始化失败:', error);
            this.showNotification('初始化失败: ' + error.message, 'error');
            
            // 尝试创建通知容器，即使初始化失败
            this.createNotificationContainer();
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 产品管理按钮
        this.addProductBtn.addEventListener('click', () => this.openAddProductModal());
        this.copyProductBtn.addEventListener('click', () => this.copyProductAsNew());
        this.editProductBtn.addEventListener('click', () => this.editSelectedProduct());
        this.deleteProductBtn.addEventListener('click', () => this.deleteSelectedProduct());
        
        // 关闭模态框按钮
        this.closeModalBtn.addEventListener('click', () => this.closeProductModal());
        this.cancelBtn.addEventListener('click', () => this.closeProductModal());
        
        // 表单提交
        this.productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        // 产品属性变化
        if (this.productType) {
            this.productType.addEventListener('change', () => this.handleProductTypeChange());
        }
        
        // 规格字段变化
        document.querySelectorAll('.spec-field').forEach(field => {
            field.addEventListener('change', () => this.checkSpecFieldChanges());
        });
        
        // 添加规格字段
        if (this.addSpecFieldBtn) {
            this.addSpecFieldBtn.addEventListener('click', () => this.addCustomSpecField());
        }
        
        // 规格变化提示按钮
        if (this.saveAsNewBtn) {
            this.saveAsNewBtn.addEventListener('click', () => this.saveAsNewProduct());
        }
        if (this.cancelSpecChangeBtn) {
            this.cancelSpecChangeBtn.addEventListener('click', () => this.cancelSpecChange());
        }
        
        // 组套产品管理
        if (this.addGroupProductBtn) {
            this.addGroupProductBtn.addEventListener('click', () => this.addGroupProductRow());
        }
        
        // 供应商产品管理
        if (this.addSupplierProductBtn) {
            this.addSupplierProductBtn.addEventListener('click', () => this.addSupplierProductRow());
        }
        if (this.supplierFilter) {
            this.supplierFilter.addEventListener('change', () => this.filterSupplierProducts());
        }
        
        // 客户产品管理
        if (this.addCustomerProductBtn) {
            this.addCustomerProductBtn.addEventListener('click', () => this.addCustomerProductRow());
        }
        if (this.customerFilter) {
            this.customerFilter.addEventListener('change', () => this.filterCustomerProducts());
        }
        
        // 产品选择事件
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('product-select')) {
                this.updateProductSelectionButtons();
            }
        });
        
        // 分类选择变化时生成产品编码
        const categorySelect = document.getElementById('category_select');
        categorySelect.addEventListener('change', () => this.handleCategoryChange());
        categorySelect.addEventListener('dblclick', () => this.openCategoryManagement());
        
        // 分类筛选事件
        if (this.filterCategoryBtn) {
            this.filterCategoryBtn.addEventListener('click', () => this.filterCategories());
        }
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.filterCategories();
                }
            });
        }
        
        // 客户筛选事件
        if (this.filterClientBtn) {
            this.filterClientBtn.addEventListener('click', () => this.filterClients());
        }
        if (this.clientFilter) {
            this.clientFilter.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.filterClients();
                }
            });
        }
        
        // 供应商筛选事件
        if (this.filterVendorBtn) {
            this.filterVendorBtn.addEventListener('click', () => this.filterVendors());
        }
        if (this.vendorFilter) {
            this.vendorFilter.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.filterVendors();
                }
            });
        }
        
        // 客户选择双击事件
        const clientsSelect = document.getElementById('clients_ID');
        if (clientsSelect) {
            clientsSelect.addEventListener('dblclick', () => this.handleClientDblClick());
        }
        
        // 供应商选择双击事件
        const vendorsSelect = document.getElementById('vendors_ID');
        if (vendorsSelect) {
            vendorsSelect.addEventListener('dblclick', () => this.handleVendorDblClick());
        }
        
        // 文件上传区域点击事件
        this.fileUploadContainers.forEach(container => {
            container.addEventListener('click', () => {
                const inputId = container.dataset.input;
                const fileInput = document.getElementById(inputId);
                if (fileInput) {
                    fileInput.click();
                }
            });
        });
        
        // 文件输入变化事件
        document.querySelectorAll('.file-input').forEach(input => {
            input.addEventListener('change', (e) => this.handleFileInputChange(e));
        });
        
        // 关闭文件预览模态框
        this.closeFilePreviewBtn.addEventListener('click', () => {
            this.filePreviewModal.classList.add('hidden');
        });
    }
    
    /**
     * 加载产品数据
     */
    async loadProducts() {
        try {
            const products = await this.productService.getAllProducts();
            this.renderProductTable(products);
        } catch (error) {
            console.error('加载产品数据失败:', error);
            this.showNotification('加载产品数据失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 渲染产品表格
     * @param {Array} products 产品数组
     */
    renderProductTable(products) {
        // 获取表格体元素
        const productTableBody = document.querySelector('table tbody');
        if (!productTableBody) {
            console.error('找不到产品表格体元素');
            return;
        }
        
        // 清空表格
        productTableBody.innerHTML = '';
        
        if (!products || products.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="12" class="py-4 text-center text-gray-500">
                    暂无产品数据
                </td>
            `;
            productTableBody.appendChild(emptyRow);
            return;
        }
        
        // 添加产品行
        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.dataset.productId = product.id || product.products_pkey || '';
            
            // 产品属性类型
            const productType = product.product_type || 'single';
            const productTypeText = productType === 'group' ? '组套' : '单件';
            const productTypeClass = productType === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
            
            // 图片路径
            const imagePath = product.image_url || 'assets/images/placeholder.jpg';
            
            row.innerHTML = `
                <td class="py-2 px-2"><input type="checkbox" class="product-select"></td>
                <td class="py-2 px-2"><img src="${imagePath}" alt="产品图片" class="w-16 h-16 object-contain"></td>
                <td class="py-2 px-2">${this.getCategoryName(product.category_id || product.category_ID) || ''}</td>
                <td class="py-2 px-2">${product.code || product.product_code || ''}</td>
                <td class="py-2 px-2">${product.name || product.品描 || ''}</td>
                <td class="py-2 px-2">${product.material || ''}</td>
                <td class="py-2 px-2">${product.color || ''}</td>
                <td class="py-2 px-2">${product.size || ''}</td>
                <td class="py-2 px-2">${product.other_spec || ''}</td>
                <td class="py-2 px-2">${product.unit || (productType === 'group' ? '套/set' : '件/pc')}</td>
                <td class="py-2 px-2"><span class="${productTypeClass} text-xs px-2 py-1 rounded">${productTypeText}</span></td>
                <td class="py-2 px-2">
                    <button class="text-blue-500 hover:underline text-xs mr-2 edit-btn" data-id="${product.id || product.products_pkey}">编辑</button>
                    <button class="text-red-500 hover:underline text-xs delete-btn" data-id="${product.id || product.products_pkey}">删除</button>
                </td>
            `;
            
            // 将行添加到表格中
            productTableBody.appendChild(row);
        });
        
        // 绑定行操作按钮事件
        this.bindTableRowEvents();
    }
}

/**
 * 渲染产品表格
 * @param {Array} products 产品数组
 */
renderProductTable(products) {
    // 获取表格体元素
    const productTableBody = document.querySelector('table tbody');
    if (!productTableBody) {
        console.error('找不到产品表格体元素');
        return;
    }

    // 清空表格
    productTableBody.innerHTML = '';

    if (!products || products.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="12" class="py-4 text-center text-gray-500">
                暂无产品数据
            </td>
        `;
        productTableBody.appendChild(emptyRow);
        return;
    }

    // 添加产品行
    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-100';
        row.dataset.productId = product.id || product.products_pkey || '';

        // 产品属性类型
        const productType = product.product_type || 'single';
        const productTypeText = productType === 'group' ? '组套' : '单件';
        const productTypeClass = productType === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

        // 图片路径
        const imagePath = product.image_url || 'assets/images/placeholder.jpg';

        row.innerHTML = `
            <td class="py-2 px-2"><input type="checkbox" class="product-select"></td>
            <td class="py-2 px-2"><img src="${imagePath}" alt="产品图片" class="w-16 h-16 object-contain"></td>
            <td class="py-2 px-2">${this.getCategoryName(product.category_id || product.category_ID) || ''}</td>
            <td class="py-2 px-2">${product.code || product.product_code || ''}</td>
            <td class="py-2 px-2">${product.name || product.品描 || ''}</td>
            <td class="py-2 px-2">${product.material || ''}</td>
            <td class="py-2 px-2">${product.color || ''}</td>
            <td class="py-2 px-2">${product.size || ''}</td>
            <td class="py-2 px-2">${product.other_spec || ''}</td>
            <td class="py-2 px-2">${product.unit || (productType === 'group' ? '套/set' : '件/pc')}</td>
            <td class="py-2 px-2"><span class="${productTypeClass} text-xs px-2 py-1 rounded">${productTypeText}</span></td>
            <td class="py-2 px-2">
                <button class="text-blue-500 hover:underline text-xs mr-2 edit-btn" data-id="${product.id || product.products_pkey}">编辑</button>
                <button class="text-red-500 hover:underline text-xs delete-btn" data-id="${product.id || product.products_pkey}">删除</button>
            </td>
        `;

        // 将行添加到表格中
        productTableBody.appendChild(row);
    });

    // 绑定行操作按钮事件
    this.bindTableRowEvents();
}

/**
 * 绑定表格行操作按钮事件
 */
bindTableRowEvents() {
    // 获取表格体元素
    const productTableBody = document.querySelector('table tbody');
    if (!productTableBody) {
        console.error('找不到产品表格体元素');
        return;
    }

    // 绑定编辑按钮
    productTableBody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.id;
            if (productId) {
                this.editProduct(productId);
            }
        });
    });

    // 绑定删除按钮
    productTableBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.id;
            if (productId) {
                if (window.ProductManagementUtils && window.ProductManagementUtils.deleteProductWithRelations) {
                    if (confirm('确定要删除此产品吗？此操作不可撤销，产品相关的所有文件也将被删除。')) {
                        window.ProductManagementUtils.deleteProductWithRelations(productId)
                            .then(() => {
                                alert('产品删除成功');
                                window.location.reload();
                            })
                            .catch(error => {
                                console.error('删除产品失败:', error);
                                alert('删除产品失败: ' + error.message);
                            });
                    }
                } else {
                    this.confirmDeleteProduct(productId);
                }
            }
        });
    });
}

/**
 * 获取分类名称
 * @param {string} categoryId 分类ID
 */
getCategoryName(categoryId) {
    if (!categoryId) return '';

    try {
        // 尝试使用getAllCategories方法
        let categories = [];
        if (typeof this.categoryService.getAllCategories === 'function') {
            categories = this.categoryService.getAllCategories() || [];
        } else if (window.allCategories) {
            // 如果方法不存在，尝试使用全局变量
            categories = window.allCategories;
        }

        const category = categories.find(c => c.category_pkey === categoryId);

        if (category) {
            return `${category.purpose_name || ''} > ${category.category_name || ''} > ${category.subcategory_name || ''} > ${category.detail_name || ''}`;
        }
    } catch (error) {
        console.error('获取分类名称失败:', error);
    }

    return categoryId;
}

/**
 * 加载分类选项到下拉框
 */
async loadCategoryOptions() {
    try {
        console.log('加载分类选项...');

        // 初始化分类服务
        const categoryInitResult = await this.categoryService.init();
        if (!categoryInitResult) {
            console.warn('分类服务初始化失败，但将继续尝试加载数据');
        }

        // 尝试使用 getAllCategories 方法获取分类数据
        let categories = [];
     * 获取分类名称
     * @param {string} categoryId 分类ID
     */
    getCategoryName(categoryId) {
        if (!categoryId) return '';
        
        try {
            // 尝试使用getAllCategories方法
            let categories = [];
            if (typeof this.categoryService.getAllCategories === 'function') {
                categories = this.categoryService.getAllCategories() || [];
            } else if (window.allCategories) {
                // 如果方法不存在，尝试使用全局变量
                categories = window.allCategories;
            }
            
            const category = categories.find(c => c.category_pkey === categoryId);
            
            if (category) {
                return `${category.purpose_name || ''} > ${category.category_name || ''} > ${category.subcategory_name || ''} > ${category.detail_name || ''}`;
            }
        } catch (error) {
            console.error('获取分类名称失败:', error);
        }
        
        return categoryId;
    }
    
    /**
     * 加载分类选项到下拉框
     */
    async loadCategoryOptions() {
        try {
            console.log('加载分类选项...');
            
            // 初始化分类服务
            const categoryInitResult = await this.categoryService.init();
            if (!categoryInitResult) {
                console.warn('分类服务初始化失败，但将继续尝试加载数据');
            }
            
            // 尝试使用 getAllCategories 方法获取分类数据
            let categories = [];
            try {
                categories = await this.categoryService.getAllCategories();
            } catch (err) {
                console.warn('使用 getAllCategories 方法获取分类数据失败:', err);
                
                // 尝试使用 getCategories 方法
                try {
                    categories = await this.categoryService.getCategories();
                } catch (err2) {
                    console.warn('使用 getCategories 方法获取分类数据失败:', err2);
                }
            }
            
            // 如果上述方法失败，尝试使用全局变量
            if (!categories || categories.length === 0) {
                if (window.allCategories && window.allCategories.length > 0) {
                    console.log('使用全局分类数据');
                    categories = window.allCategories;
                }
            }
            
            if (!categories || categories.length === 0) {
                console.warn('没有找到分类数据');
                this.showNotification('没有找到分类数据，请先创建分类', 'info');
                return;
            }
            
            console.log('成功加载分类数据:', categories.length, '条记录');
            
            // 保存分类数据到实例，用于筛选
            this.allCategories = categories;
            
            // 获取分类下拉框
            const categorySelect = document.getElementById('category_select');
            
            // 清空现有选项（保留第一个默认选项）
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1);
            }
            
            // 按分类层级组织数据
            const purposeGroups = {};
            
            categories.forEach(category => {
                const purposeName = category.purpose_name || '';
                const categoryName = category.category_name || '';
                const subcategoryName = category.subcategory_name || '';
                const detailName = category.detail_name || '';
                
                // 英文名称（如果有）
                const epurposeName = category.epurpose_name || '';
                const ecategoryName = category.ecategory_name || '';
                const esubcategoryName = category.esubcategory_name || '';
                const edetailName = category.edetail_name || '';
                
                // 创建分组键
                if (!purposeGroups[purposeName]) {
                    purposeGroups[purposeName] = {
                        name: purposeName,
                        ename: epurposeName,
                        categories: {}
                    };
                }
                
                if (!purposeGroups[purposeName].categories[categoryName]) {
                    purposeGroups[purposeName].categories[categoryName] = {
                        name: categoryName,
                        ename: ecategoryName,
                        subcategories: {}
                    };
                }
                
                if (!purposeGroups[purposeName].categories[categoryName].subcategories[subcategoryName]) {
                    purposeGroups[purposeName].categories[categoryName].subcategories[subcategoryName] = {
                        name: subcategoryName,
                        ename: esubcategoryName,
                        details: []
                    };
                }
                
                // 添加详细信息
                purposeGroups[purposeName].categories[categoryName].subcategories[subcategoryName].details.push({
                    name: detailName,
                    ename: edetailName,
                    code: category.code,
                    category: category
                });
            });
            
            // 创建选项组并添加选项
            Object.keys(purposeGroups).sort().forEach(purposeKey => {
                const purposeGroup = purposeGroups[purposeKey];
                
                // 创建用途组
                const purposeOptgroup = document.createElement('optgroup');
                purposeOptgroup.label = purposeGroup.name + (purposeGroup.ename ? ` / ${purposeGroup.ename}` : '');
                
                // 添加分类
                Object.keys(purposeGroup.categories).sort().forEach(categoryKey => {
                    const categoryGroup = purposeGroup.categories[categoryKey];
                    
                    // 创建分类组
                    const categoryOptgroup = document.createElement('optgroup');
                    categoryOptgroup.label = '-- ' + categoryGroup.name + (categoryGroup.ename ? ` / ${categoryGroup.ename}` : '');
                    categoryOptgroup.className = 'ml-3';
                    
                    // 添加子分类
                    Object.keys(categoryGroup.subcategories).sort().forEach(subcategoryKey => {
                        const subcategoryGroup = categoryGroup.subcategories[subcategoryKey];
                        
                        // 创建子分类组
                        const subcategoryOptgroup = document.createElement('optgroup');
                        subcategoryOptgroup.label = '---- ' + subcategoryGroup.name + (subcategoryGroup.ename ? ` / ${subcategoryGroup.ename}` : '');
                        subcategoryOptgroup.className = 'ml-6';
                        
                        // 添加详细信息
                        subcategoryGroup.details.sort((a, b) => a.name.localeCompare(b.name)).forEach(detail => {
                            const option = document.createElement('option');
                            option.value = detail.code;
                            option.textContent = '------ ' + detail.name + (detail.ename ? ` / ${detail.ename}` : '') + ` (${detail.code})`;
                            option.dataset.category = JSON.stringify(detail.category);
                            subcategoryOptgroup.appendChild(option);
                        });
                        
                        categoryOptgroup.appendChild(subcategoryOptgroup);
                    });
                    
                    purposeOptgroup.appendChild(categoryOptgroup);
                });
                
                categorySelect.appendChild(purposeOptgroup);
            });
            
            console.log('分类选项加载完成');
        } catch (error) {
            console.error('加载分类选项失败:', error);
            this.showNotification('加载分类选项失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 处理分类选择变化
     */
    handleCategoryChange() {
        const categorySelect = document.getElementById('category_select');
        const productCodeInput = document.getElementById('product_code');
        
        if (categorySelect.value) {
            try {
                // 获取选中的分类
                const selectedOption = categorySelect.options[categorySelect.selectedIndex];
                const categoryData = JSON.parse(selectedOption.dataset.category || '{}');
                
                // 如果是编辑模式且已有产品编码，不重新生成
                if (this.isEditMode && productCodeInput.value) {
                    return;
                }
                
                // 生成产品编码：分类编码 + 随机2位数字
                const categoryCode = categorySelect.value;
                const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                const productCode = `${categoryCode}-${randomNum}`;
                
                // 设置产品编码
                productCodeInput.value = productCode;
                
                console.log(`已生成产品编码: ${productCode}`);
            } catch (error) {
                console.error('处理分类选择变化时出错:', error);
                this.showNotification('生成产品编码失败', 'error');
            }
        } else {
            // 清空产品编码
            productCodeInput.value = '';
        }
    }
    
    /**
     * 筛选分类
     */
    filterCategories() {
        const keyword = this.categoryFilter.value.trim().toLowerCase();
        if (!keyword) {
            // 如果关键字为空，重新加载所有分类
            this.loadCategoryOptions();
            return;
        }
        
        try {
            // 如果没有加载过分类数据，先加载
            if (!this.allCategories || this.allCategories.length === 0) {
                this.showNotification('没有可筛选的分类数据', 'info');
                return;
            }
            
            // 筛选匹配的分类
            const filteredCategories = this.allCategories.filter(category => {
                const purposeName = (category.purpose_name || '').toLowerCase();
                const categoryName = (category.category_name || '').toLowerCase();
                const subcategoryName = (category.subcategory_name || '').toLowerCase();
                const detailName = (category.detail_name || '').toLowerCase();
                const epurposeName = (category.epurpose_name || '').toLowerCase();
                const ecategoryName = (category.ecategory_name || '').toLowerCase();
                const esubcategoryName = (category.esubcategory_name || '').toLowerCase();
                const edetailName = (category.edetail_name || '').toLowerCase();
                const code = (category.code || '').toLowerCase();
                
                return purposeName.includes(keyword) ||
                       categoryName.includes(keyword) ||
                       subcategoryName.includes(keyword) ||
                       detailName.includes(keyword) ||
                       epurposeName.includes(keyword) ||
                       ecategoryName.includes(keyword) ||
                       esubcategoryName.includes(keyword) ||
                       edetailName.includes(keyword) ||
                       code.includes(keyword);
            });
            
            if (filteredCategories.length === 0) {
                this.showNotification(`没有找到包含关键字 "${keyword}" 的分类`, 'info');
                return;
            }
            
            // 获取分类下拉框
            const categorySelect = document.getElementById('category_select');
            
            // 清空现有选项（保留第一个默认选项）
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1);
            }
            
            // 添加筛选结果
            filteredCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code;
                
                // 构建选项文本，包含完整路径
                const displayText = [
                    category.purpose_name,
                    category.category_name,
                    category.subcategory_name,
                    category.detail_name
                ].filter(Boolean).join(' > ');
                
                // 如果有英文名称，添加英文名称
                const englishText = [
                    category.epurpose_name,
                    category.ecategory_name,
                    category.esubcategory_name,
                    category.edetail_name
                ].filter(Boolean).join(' > ');
                
                option.textContent = `${displayText}${englishText ? ` / ${englishText}` : ''} (${category.code})`;
                option.dataset.category = JSON.stringify(category);
                categorySelect.appendChild(option);
            });
            
            this.showNotification(`找到 ${filteredCategories.length} 个匹配的分类`, 'success');
        } catch (error) {
            console.error('筛选分类失败:', error);
            this.showNotification('筛选分类失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 筛选客户
     */
    filterClients() {
        const keyword = this.clientFilter.value.trim().toLowerCase();
        if (!keyword) {
            this.showNotification('请输入客户关键字进行筛选', 'info');
            return;
        }
        
        // TODO: 实现客户筛选功能
        // 这里需要添加客户服务和相关API调用
        this.showNotification(`客户筛选功能正在开发中，关键字: ${keyword}`, 'info');
    }
    
    /**
     * 筛选供应商
     */
    filterVendors() {
        const keyword = this.vendorFilter.value.trim().toLowerCase();
        if (!keyword) {
            this.showNotification('请输入供应商关键字进行筛选', 'info');
            return;
        }
        
        // TODO: 实现供应商筛选功能
        // 这里需要添加供应商服务和相关API调用
        this.showNotification(`供应商筛选功能正在开发中，关键字: ${keyword}`, 'info');
    }
    
    /**
     * 打开分类管理页面
     */
    openCategoryManagement() {
        // 打开分类管理页面
        window.open('category-management.html', '_blank');
    }
    
    /**
     * 处理客户双击事件
     */
    handleClientDblClick() {
        const clientsSelect = document.getElementById('clients_ID');
        const selectedValue = clientsSelect.value;
        
        if (selectedValue === 'new') {
            // TODO: 实现新建客户功能
            this.showNotification('新建客户功能正在开发中', 'info');
        } else if (selectedValue) {
            // TODO: 实现查看客户详情功能
            this.showNotification(`查看客户详情功能正在开发中，客户ID: ${selectedValue}`, 'info');
        }
    }
    
    /**
     * 处理供应商双击事件
     */
    handleVendorDblClick() {
        const vendorsSelect = document.getElementById('vendors_ID');
        const selectedValue = vendorsSelect.value;
        
        if (selectedValue === 'new') {
            // TODO: 实现新建供应商功能
            this.showNotification('新建供应商功能正在开发中', 'info');
        } else if (selectedValue) {
            // TODO: 实现查看供应商详情功能
            this.showNotification(`查看供应商详情功能正在开发中，供应商ID: ${selectedValue}`, 'info');
        }
    }
    
    /**
     * 打开添加产品模态框
     */
    openAddProductModal() {
        this.isEditMode = false;
        this.currentProductId = null;
        this.modalTitle.textContent = '添加产品';
        
        // 重置表单
        this.productForm.reset();
        document.getElementById('products_pkey').value = '';
        document.getElementById('product_code').value = '';
        
        // 清空文件预览
        document.querySelectorAll('.preview-container').forEach(container => {
            container.innerHTML = '';
        });
        
        // 重置上传文件状态
        this.uploadedFiles = {
            image1: null,
            image2: null,
            image3: null,
            productFiles: []
        };
        
        // 显示模态框
        this.productModal.classList.remove('hidden');
    }
    
    /**
     * 关闭产品模态框
     */
    closeProductModal() {
        this.productModal.classList.add('hidden');
    }
    
    /**
     * 查看产品
     * @param {string} productId 产品ID
     */
    async viewProduct(productId) {
        try {
            const product = await this.productService.getProductById(productId);
            
            if (!product) {
                throw new Error('未找到产品');
            }
            
            // 填充表单字段
            this.fillProductForm(product);
            
            // 设置为只读模式
            this.setFormReadOnly(true);
            
            // 更新模态框标题
            this.modalTitle.textContent = '查看产品';
            
            // 加载产品文件
            await this.loadProductFiles(product.product_code);
            
            // 显示模态框
            this.productModal.classList.remove('hidden');
        } catch (error) {
            console.error(`查看产品 ID: ${productId} 失败:`, error);
            this.showNotification('查看产品失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 编辑产品
     * @param {string} productId 产品ID
     */
    async editProduct(productId) {
        try {
            const product = await this.productService.getProductById(productId);
            
            if (!product) {
                throw new Error('未找到产品');
            }
            
            // 设置编辑模式
            this.isEditMode = true;
            this.currentProductId = productId;
            
            // 填充表单字段
            this.fillProductForm(product);
            
            // 设置为可编辑模式
            this.setFormReadOnly(false);
            
            // 产品编码字段保持只读
            document.getElementById('product_code').readOnly = true;
            
            // 更新模态框标题
            this.modalTitle.textContent = '编辑产品';
            
            // 加载产品文件
            await this.loadProductFiles(product.product_code);
            
            // 显示模态框
            this.productModal.classList.remove('hidden');
        } catch (error) {
            console.error(`编辑产品 ID: ${productId} 失败:`, error);
            this.showNotification('编辑产品失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 填充产品表单
     * @param {Object} product 产品数据
     */
    fillProductForm(product) {
        // 设置隐藏字段
        document.getElementById('products_pkey').value = product.products_pkey || '';
        
        // 设置基本信息字段
        document.getElementById('product_code').value = product.product_code || '';
        document.getElementById('description_cn').value = product.品描 || '';
        document.getElementById('description_en').value = product.Description || '';
        document.getElementById('detail_cn').value = product.说明 || '';
        document.getElementById('detail_en').value = product.Detail || '';
        
        // 设置分类选择
        const categorySelect = document.getElementById('category_select');
        if (product.category_ID) {
            categorySelect.value = product.category_ID;
        }
        
        // 设置关联字段
        if (document.getElementById('clients_ID')) {
            document.getElementById('clients_ID').value = product.clients_ID || '';
        }
        
        if (document.getElementById('clients_products_ID')) {
            document.getElementById('clients_products_ID').value = product.clients_products_ID || '';
        }
        
        if (document.getElementById('vendors_ID')) {
            document.getElementById('vendors_ID').value = product.vendors_ID || '';
        }
        
        if (document.getElementById('vendors_products_ID')) {
            document.getElementById('vendors_products_ID').value = product.vendors_products_ID || '';
        }
    }
    
    /**
     * 设置表单只读状态
     * @param {boolean} readOnly 是否只读
     */
    setFormReadOnly(readOnly) {
        // 设置所有输入字段的只读状态
        this.productForm.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.id !== 'products_pkey') { // 跳过隐藏字段
                element.readOnly = readOnly;
                
                if (element.tagName === 'SELECT') {
                    element.disabled = readOnly;
                }
            }
        });
        
        // 设置文件上传区域的禁用状态
        this.fileUploadContainers.forEach(container => {
            if (readOnly) {
                container.classList.add('opacity-50');
                container.style.pointerEvents = 'none';
            } else {
                container.classList.remove('opacity-50');
                container.style.pointerEvents = 'auto';
            }
        });
        
        // 显示或隐藏提交按钮
        const submitBtn = this.productForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.style.display = readOnly ? 'none' : 'block';
        }
    }
    
    /**
     * 加载产品文件
     * @param {string} productCode 产品编码
     */
    async loadProductFiles(productCode) {
        try {
            const files = await this.productService.getProductFiles(productCode);
            
            // 清空预览容器
            document.querySelectorAll('.preview-container').forEach(container => {
                container.innerHTML = '';
            });
            
            // 处理图片文件
            const imageFiles = files.filter(file => 
                file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            // 最多显示3张图片
            for (let i = 0; i < Math.min(imageFiles.length, 3); i++) {
                const imageFile = imageFiles[i];
                const previewContainer = document.getElementById(`image${i+1}Preview`);
                
                if (previewContainer) {
                    this.createFilePreviewItem(previewContainer, imageFile, true);
                }
            }
            
            // 处理其他文件
            const otherFiles = files.filter(file => 
                !file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            const filesPreviewContainer = document.getElementById('filesPreview');
            if (filesPreviewContainer) {
                otherFiles.forEach(file => {
                    this.createFilePreviewItem(filesPreviewContainer, file, true);
                });
            }
        } catch (error) {
            console.error(`加载产品 ${productCode} 的文件失败:`, error);
            this.showNotification('加载产品文件失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 处理文件输入变化
     * @param {Event} event 事件对象
     */
    handleFileInputChange(event) {
        const fileInput = event.target;
        const inputId = fileInput.id;
        const previewContainerId = inputId + 'Preview';
        const previewContainer = document.getElementById(previewContainerId);
        
        if (!previewContainer) return;
        
        // 清空预览容器
        previewContainer.innerHTML = '';
        
        // 处理单个文件上传 (图片)
        if (inputId.startsWith('image') && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // 保存文件到上传状态
            this.uploadedFiles[inputId] = file;
            
            // 创建预览
            this.createFilePreviewItem(previewContainer, file);
        }
        // 处理多文件上传
        else if (inputId === 'productFiles' && fileInput.files.length > 0) {
            // 保存文件到上传状态
            this.uploadedFiles.productFiles = Array.from(fileInput.files);
            
            // 创建预览
            for (const file of fileInput.files) {
                this.createFilePreviewItem(previewContainer, file);
            }
        }
    }
    
    /**
     * 创建文件预览项
     * @param {HTMLElement} container 预览容器
     * @param {File|Object} file 文件对象
     * @param {boolean} isStoredFile 是否是已存储的文件
     */
    createFilePreviewItem(container, file, isStoredFile = false) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        // 获取文件URL
        const fileUrl = isStoredFile ? file.publicUrl : URL.createObjectURL(file);
        const fileName = isStoredFile ? file.name : file.name;
        
        // 根据文件类型创建不同的预览
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            // 图片预览
            previewItem.innerHTML = `
                <img src="${fileUrl}" alt="${fileName}" title="${fileName}">
                <div class="remove-btn" data-file="${fileName}">
                    <i class="fas fa-times"></i>
                </div>
            `;
        } else {
            // 其他文件类型预览
            let iconClass = 'fa-file';
            
            // 根据文件扩展名设置不同的图标
            if (fileName.match(/\.pdf$/i)) {
                iconClass = 'fa-file-pdf';
            } else if (fileName.match(/\.(doc|docx)$/i)) {
                iconClass = 'fa-file-word';
            } else if (fileName.match(/\.(xls|xlsx)$/i)) {
                iconClass = 'fa-file-excel';
            } else if (fileName.match(/\.(ppt|pptx)$/i)) {
                iconClass = 'fa-file-powerpoint';
            } else if (fileName.match(/\.(zip|rar|7z)$/i)) {
                iconClass = 'fa-file-archive';
            } else if (fileName.match(/\.(mp4|avi|mov|wmv)$/i)) {
                iconClass = 'fa-file-video';
            }
            
            previewItem.innerHTML = `
                <div class="file-type-icon" data-file="${fileName}" data-url="${fileUrl}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="remove-btn" data-file="${fileName}">
                    <i class="fas fa-times"></i>
                </div>
            `;
        }
        
        container.appendChild(previewItem);
        
        // 绑定移除按钮事件
        const removeBtn = previewItem.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileName = removeBtn.dataset.file;
                
                // 从上传状态中移除文件
                if (container.id === 'image1Preview') {
                    this.uploadedFiles.image1 = null;
                } else if (container.id === 'image2Preview') {
                    this.uploadedFiles.image2 = null;
                } else if (container.id === 'image3Preview') {
                    this.uploadedFiles.image3 = null;
                } else if (container.id === 'filesPreview') {
                    this.uploadedFiles.productFiles = this.uploadedFiles.productFiles.filter(
                        f => f.name !== fileName
                    );
                }
                
                // 移除预览项
                previewItem.remove();
            });
        }
        
        // 绑定文件预览事件
        const fileTypeIcon = previewItem.querySelector('.file-type-icon');
        if (fileTypeIcon) {
            fileTypeIcon.addEventListener('click', () => {
                this.previewFile(fileTypeIcon.dataset.url, fileTypeIcon.dataset.file);
            });
        }
    }
    
    /**
     * 预览文件
     * @param {string} fileUrl 文件URL
     * @param {string} fileName 文件名
     */
    previewFile(fileUrl, fileName) {
        const previewFileName = document.getElementById('previewFileName');
        const filePreviewContent = document.getElementById('filePreviewContent');
        
        if (!previewFileName || !filePreviewContent) return;
        
        // 设置文件名
        previewFileName.textContent = fileName;
        
        // 清空预览内容
        filePreviewContent.innerHTML = '';
        
        // 根据文件类型创建不同的预览
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            // 图片预览
            filePreviewContent.innerHTML = `
                <img src="${fileUrl}" alt="${fileName}" class="max-w-full max-h-[70vh] mx-auto">
            `;
        } else if (fileName.match(/\.pdf$/i)) {
            // PDF预览
            filePreviewContent.innerHTML = `
                <iframe src="${fileUrl}" class="w-full h-[70vh]" frameborder="0"></iframe>
            `;
        } else if (fileName.match(/\.(mp4|webm|ogg)$/i)) {
            // 视频预览
            filePreviewContent.innerHTML = `
                <video src="${fileUrl}" controls class="max-w-full max-h-[70vh] mx-auto"></video>
            `;
        } else {
            // 其他文件类型，提供下载链接
            filePreviewContent.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-file-download text-gray-400 text-5xl mb-4"></i>
                    <p class="mb-4">无法直接预览此文件类型</p>
                    <a href="${fileUrl}" download="${fileName}" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
                        下载文件
                    </a>
                </div>
            `;
        }
        
        // 显示预览模态框
        this.filePreviewModal.classList.remove('hidden');
    }
    
    /**
     * 保存产品
     */
    async saveProduct() {
        try {
            // 收集表单数据
            const formData = new FormData(this.productForm);
            const productData = {};
            
            // 将FormData转换为对象
            for (const [key, value] of formData.entries()) {
                if (key !== 'image1' && key !== 'image2' && key !== 'image3' && key !== 'productFiles') {
                    productData[key] = value;
                }
            }
            
            // 验证必填字段
            if (!productData.category_ID) {
                throw new Error('请选择产品分类');
            }
            
            if (!productData.product_code) {
                throw new Error('产品编码不能为空');
            }
            
            // 收集上传文件
            const files = [];
            
            if (this.uploadedFiles.image1) {
                files.push(this.uploadedFiles.image1);
            }
            
            if (this.uploadedFiles.image2) {
                files.push(this.uploadedFiles.image2);
            }
            
            if (this.uploadedFiles.image3) {
                files.push(this.uploadedFiles.image3);
            }
            
            if (this.uploadedFiles.productFiles.length > 0) {
                files.push(...this.uploadedFiles.productFiles);
            }
            
            // 保存产品
            if (this.isEditMode && this.currentProductId) {
                // 更新产品
                await this.productService.updateProduct(this.currentProductId, productData, files);
                this.showNotification('产品更新成功', 'success');
            } else {
                // 创建产品
                await this.productService.createProduct(productData, files);
                this.showNotification('产品创建成功', 'success');
            }
            
            // 重新加载产品数据
            await this.loadProducts();
            
            // 关闭模态框
            this.closeProductModal();
        } catch (error) {
            console.error('保存产品失败:', error);
            this.showNotification('保存产品失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 确认删除产品
     * @param {string} productId 产品ID
     */
    confirmDeleteProduct(productId) {
        if (confirm('确定要删除此产品吗？此操作不可撤销，产品相关的所有文件也将被删除。')) {
            this.deleteProduct(productId);
        }
    }
    
    /**
     * 删除产品
     * @param {string} productId 产品ID
     */
    async deleteProduct(productId) {
        try {
            await this.productService.deleteProduct(productId);
            this.showNotification('产品删除成功', 'success');
            
            // 重新加载产品数据
            await this.loadProducts();
        } catch (error) {
            console.error(`删除产品 ID: ${productId} 失败:`, error);
            this.showNotification('删除产品失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 创建通知容器
     * @returns {HTMLElement} 通知容器元素
     */
    createNotificationContainer() {
        // 检查是否已存在通知容器
        let notificationContainer = document.getElementById('notificationContainer');
        
        if (!notificationContainer) {
            // 创建通知容器
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(notificationContainer);
        }
        
        return notificationContainer;
    }
    
    /**
     * 显示通知
     * @param {string} message 通知消息
     * @param {string} type 通知类型 (success, error, info)
     */
    showNotification(message, type = 'info') {
        try {
            // 获取或创建通知容器
            const notificationContainer = this.createNotificationContainer();
            
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = 'px-4 py-3 rounded-lg shadow-md transform transition-all duration-300 opacity-0 translate-x-full';
            
            // 根据类型设置样式
            switch (type) {
                case 'success':
                    notification.classList.add('bg-green-500', 'text-white');
                    break;
                case 'error':
                    notification.classList.add('bg-red-500', 'text-white');
                    break;
                default:
                    notification.classList.add('bg-blue-500', 'text-white');
            }
            
            // 设置通知内容
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
            
            // 添加到容器
            notificationContainer.appendChild(notification);
            
            // 显示通知
            setTimeout(() => {
                notification.classList.remove('opacity-0', 'translate-x-full');
            }, 10);
            
            // 自动关闭通知
            setTimeout(() => {
                notification.classList.add('opacity-0', 'translate-x-full');
                
                // 移除元素
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        } catch (error) {
            // 如果显示通知失败，使用控制台输出
            console.error('显示通知失败:', error);
            console.log(`通知消息 (${type}): ${message}`);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new ProductManagementApp();
});
