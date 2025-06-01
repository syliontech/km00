/**
 * 分类管理应用脚本
 * 负责分类管理页面的交互逻辑
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    const categoryApp = new CategoryManagementApp();
    categoryApp.init();
});

class CategoryManagementApp {
    constructor() {
        // 初始化服务和状态
        try {
            // 确保 CategoryService 已经存在于全局作用域
            if (typeof window.CategoryService === 'undefined') {
                throw new Error('CategoryService 未定义，请确保已加载 category-service.js');
            }
            
            this.categoryService = new window.CategoryService();
            this.categories = [];
            this.filteredCategories = [];
            this.activeFilters = {};
            this.currentCategory = null;
            this.isEditing = false;
            
            // CSV导出列定义
            this.csvColumns = [
                { field: 'purpose_name', header: '用途' },
                { field: 'epurpose_name', header: '英文用途' },
                { field: 'category_name', header: '产品分类' },
                { field: 'ecategory_name', header: '英文产品分类' },
                { field: 'subcategory_name', header: '产品细分' },
                { field: 'esubcategory_name', header: '英文产品细分' },
                { field: 'detail_name', header: '细分说明' },
                { field: 'edetail_name', header: '英文细分说明' },
                { field: 'code', header: '分类编码' }
            ];
            
            // 字段中英文映射对象
            this.categoryFieldMap = {
                purpose_name: '用途',
                category_name: '产品分类',
                subcategory_name: '产品细分',
                detail_name: '细分说明',
                code: '分类编码',
                created_at: '创建时间',
                updated_at: '更新时间'
            };
            
            // DOM元素
            this.tableBody = document.getElementById('tableBody');
            this.searchInput = document.getElementById('searchInput');
            this.modal = document.getElementById('modal');
            this.modalTitle = document.getElementById('modalTitle');
            this.categoryForm = document.getElementById('categoryForm');
            this.addNewBtn = document.getElementById('addNewBtn');
            this.saveBtn = document.getElementById('saveBtn');
            this.regenerateCodeBtn = document.getElementById('regenerateCodeBtn');
            this.closeModalBtns = document.querySelectorAll('#closeModal');
            
            // 过滤器元素
            this.purposeFilter = document.getElementById('用途Filter');
            this.categoryFilter = document.getElementById('产品分类Filter');
            this.subcategoryFilter = document.getElementById('产品细分Filter');
            this.detailFilter = document.getElementById('细分说明Filter');
            this.activeFiltersContainer = document.getElementById('activeFilters');
        } catch (error) {
            console.error('初始化分类管理应用失败:', error);
            alert('初始化分类管理应用失败: ' + error.message);
        }
    }
    
    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化分类管理应用...');
            
            // 确保 Supabase 客户端已初始化
            if (!window.supabase && typeof window.initSupabase === 'function') {
                console.log('初始化 Supabase 客户端...');
                window.initSupabase();
            }
            
            // 初始化分类服务
            if (!this.categoryService.supabaseClient && window.supabase) {
                console.log('设置分类服务的 Supabase 客户端...');
                this.categoryService.supabaseClient = window.supabase;
            }
            
            // 加载分类数据
            await this.loadCategories();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 初始化过滤器
            this.initializeFilters();
            
            console.log('分类管理应用初始化完成');
        } catch (error) {
            console.error('初始化应用失败:', error);
            alert('初始化应用失败: ' + error.message);
        }
    }
    
    /**
     * 加载分类数据
     */
    async loadCategories() {
        try {
            // 使用 getCategories 方法而不是 getAllCategories
            this.categories = await this.categoryService.getCategories();
            this.filteredCategories = [...this.categories];
            this.renderTable();
        } catch (error) {
            console.error('加载分类数据失败:', error);
            // 失败时使用空数组，不抛出错误
            this.categories = [];
            this.filteredCategories = [];
            this.renderTable();
        }
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 搜索框事件
        this.searchInput.addEventListener('input', () => this.handleSearch());
        
        // 添加新分类按钮
        this.addNewBtn.addEventListener('click', () => this.openAddModal());
        
        // 保存按钮
        document.querySelectorAll('#saveBtn').forEach(btn => {
            btn.addEventListener('click', () => this.saveCategory());
        });
        
        
        // 全库编码一致性检查按钮
        document.getElementById('checkAllCodeConsistencyBtn').addEventListener('click', () => this.checkAllCodeConsistency());
        
        // 关闭模态框按钮
        document.querySelectorAll('#closeModal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        // 下拉框选择事件 - 用于逐级筛选和自动填充英文
        document.getElementById('用途').addEventListener('change', () => this.handleSelectChange('用途'));
        document.getElementById('产品分类').addEventListener('change', () => this.handleSelectChange('产品分类'));
        document.getElementById('产品细分').addEventListener('change', () => this.handleSelectChange('产品细分'));
        document.getElementById('细分说明').addEventListener('change', () => this.handleSelectChange('细分说明'));
        
        // 添加导出/导入CSV按钮事件
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.importFromCSV(e));
        
        // 添加模态框拖动功能
        this.setupModalDrag();
    }
    
    /**
     * 设置模态框拖动功能
     */
    setupModalDrag() {
        const modalContent = document.querySelector('.modal-content');
        const modalHeader = document.querySelector('.modal-header');
        
        if (!modalContent || !modalHeader) return;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        // 鼠标按下事件
        modalHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            
            // 计算鼠标与模态框的偏移量
            const rect = modalContent.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // 添加样式使模态框可以自由定位
            modalContent.style.position = 'absolute';
            modalContent.style.margin = '0';
            modalContent.style.zIndex = '1000';
            
            // 防止文本选中
            e.preventDefault();
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // 计算新位置
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            
            // 限制模态框不超出视口
            const maxX = window.innerWidth - modalContent.offsetWidth;
            const maxY = window.innerHeight - modalContent.offsetHeight;
            
            // 设置新位置
            modalContent.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            modalContent.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        });
        
        // 鼠标松开事件
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    /**
     * 初始化过滤器
     */
    initializeFilters() {
        // 清空当前的过滤器
        this.purposeFilter.innerHTML = '';
        this.categoryFilter.innerHTML = '';
        this.subcategoryFilter.innerHTML = '';
        this.detailFilter.innerHTML = '';
        
        // 获取当前选中的过滤条件
        const selectedPurposes = this.activeFilters['用途'] || [];
        const selectedCategories = this.activeFilters['产品分类'] || [];
        const selectedSubcategories = this.activeFilters['产品细分'] || [];
        
        // 渲染用途过滤器
        const uniquePurposes = [...new Set(this.categories.map(cat => cat.purpose_name))];
        this.renderFilterOptions('用途', uniquePurposes);
        
        // 根据选中的用途过滤产品分类
        let filteredCategories = this.categories;
        if (selectedPurposes.length > 0) {
            filteredCategories = filteredCategories.filter(cat => selectedPurposes.includes(cat.purpose_name));
        }
        
        // 渲染产品分类过滤器
        const uniqueCategories = [...new Set(filteredCategories.map(cat => cat.category_name))];
        this.renderFilterOptions('产品分类', uniqueCategories);
        
        // 根据选中的产品分类过滤产品细分
        if (selectedCategories.length > 0) {
            filteredCategories = filteredCategories.filter(cat => selectedCategories.includes(cat.category_name));
        }
        
        // 渲染产品细分过滤器
        const uniqueSubcategories = [...new Set(filteredCategories.map(cat => cat.subcategory_name))];
        this.renderFilterOptions('产品细分', uniqueSubcategories);
        
        // 根据选中的产品细分过滤细分说明
        if (selectedSubcategories.length > 0) {
            filteredCategories = filteredCategories.filter(cat => selectedSubcategories.includes(cat.subcategory_name));
        }
        
        // 渲染细分说明过滤器
        const uniqueDetails = [...new Set(filteredCategories.map(cat => cat.detail_name))];
        this.renderFilterOptions('细分说明', uniqueDetails);
    }
    
    /**
     * 渲染过滤器选项
     */
    renderFilterOptions(field, values) {
        const filterElement = document.getElementById(`${field}Filter`);
        filterElement.innerHTML = '';
        
        values.forEach(value => {
            if (!value) return;
            
            const checkbox = document.createElement('div');
            checkbox.className = 'filter-item';
            checkbox.innerHTML = `
                <label class="flex items-center">
                    <input type="checkbox" data-field="${field}" data-value="${value}">
                    <span class="ml-2">${value}</span>
                </label>
            `;
            
            // 添加事件监听器
            const input = checkbox.querySelector('input');
            input.addEventListener('change', () => this.handleFilterChange(field, value, input.checked));
            
            filterElement.appendChild(checkbox);
        });
    }
    
    /**
     * 处理过滤器变化
     */
    handleFilterChange(field, value, isChecked) {
        // 更新活动过滤器
        if (isChecked) {
            if (!this.activeFilters[field]) {
                this.activeFilters[field] = [];
            }
            this.activeFilters[field].push(value);
        } else {
            if (this.activeFilters[field]) {
                this.activeFilters[field] = this.activeFilters[field].filter(v => v !== value);
                if (this.activeFilters[field].length === 0) {
                    delete this.activeFilters[field];
                }
            }
        }
        
        // 如果更改了上级分类，清除下级分类的选择
        const hierarchy = ['用途', '产品分类', '产品细分', '细分说明'];
        const currentIndex = hierarchy.indexOf(field);
        
        // 如果不是最后一级，则清除所有下级的选择
        if (currentIndex < hierarchy.length - 1) {
            for (let i = currentIndex + 1; i < hierarchy.length; i++) {
                if (this.activeFilters[hierarchy[i]]) {
                    delete this.activeFilters[hierarchy[i]];
                }
            }
        }
        
        // 重新初始化过滤器选项，实现逐级过滤
        this.initializeFilters();
        
        // 更新活动过滤器显示
        this.renderActiveFilters();
        
        // 应用过滤器
        this.applyFilters();
    }
    
    /**
     * 渲染活动过滤器
     */
    renderActiveFilters() {
        this.activeFiltersContainer.innerHTML = '';
        
        for (const field in this.activeFilters) {
            this.activeFilters[field].forEach(value => {
                const filterTag = document.createElement('div');
                filterTag.className = 'filter-tag bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center';
                filterTag.innerHTML = `
                    <span>${field}: ${value}</span>
                    <button class="ml-2 text-blue-600 hover:text-blue-800" data-field="${field}" data-value="${value}">&times;</button>
                `;
                
                // 添加删除过滤器的事件
                const removeBtn = filterTag.querySelector('button');
                removeBtn.addEventListener('click', () => {
                    // 更新复选框状态
                    const checkbox = document.querySelector(`input[data-field="${field}"][data-value="${value}"]`);
                    if (checkbox) checkbox.checked = false;
                    
                    // 移除过滤器
                    this.handleFilterChange(field, value, false);
                });
                
                this.activeFiltersContainer.appendChild(filterTag);
            });
        }
    }
    
    /**
     * 应用过滤器
     */
    applyFilters() {
        // 首先应用搜索过滤
        const searchTerm = this.searchInput.value.toLowerCase();
        let filtered = this.categories;
        
        if (searchTerm) {
            filtered = filtered.filter(cat => 
                // 中文字段搜索
                (cat.purpose_name && cat.purpose_name.toLowerCase().includes(searchTerm)) ||
                (cat.category_name && cat.category_name.toLowerCase().includes(searchTerm)) ||
                (cat.subcategory_name && cat.subcategory_name.toLowerCase().includes(searchTerm)) ||
                (cat.detail_name && cat.detail_name.toLowerCase().includes(searchTerm)) ||
                // 英文字段搜索
                (cat.epurpose_name && cat.epurpose_name.toLowerCase().includes(searchTerm)) ||
                (cat.ecategory_name && cat.ecategory_name.toLowerCase().includes(searchTerm)) ||
                (cat.esubcategory_name && cat.esubcategory_name.toLowerCase().includes(searchTerm)) ||
                (cat.edetail_name && cat.edetail_name.toLowerCase().includes(searchTerm)) ||
                // 编码搜索
                (cat.code && cat.code.toLowerCase().includes(searchTerm))
            );
        }
        
        // 应用类别过滤器
        // 定义字段映射，将中文字段名映射到数据库字段名
        const fieldMapping = {
            '用途': 'purpose_name',
            '产品分类': 'category_name',
            '产品细分': 'subcategory_name',
            '细分说明': 'detail_name'
        };
        
        for (const field in this.activeFilters) {
            if (this.activeFilters[field].length > 0) {
                const dbField = fieldMapping[field] || field;
                filtered = filtered.filter(cat => this.activeFilters[field].includes(cat[dbField]));
            }
        }
        
        this.filteredCategories = filtered;
        this.renderTable();
    }
    
    /**
     * 处理搜索
     */
    handleSearch() {
        this.applyFilters();
    }
    
    /**
     * 渲染表格
     */
    renderTable() {
        this.tableBody.innerHTML = '';
        
        if (this.filteredCategories.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="6" class="text-center py-4">没有找到匹配的分类数据</td>`;
            this.tableBody.appendChild(emptyRow);
            return;
        }
        
        this.filteredCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.purpose_name || '-'}</td>
                <td>${category.category_name || '-'}</td>
                <td>${category.subcategory_name || '-'}</td>
                <td>${category.detail_name || '-'}</td>
                <td>${category.code || '-'}</td>
                <td>
                    <button class="btn-edit" data-id="${category.category_pkey}">编辑</button>
                    <button class="btn-delete" data-id="${category.category_pkey}">删除</button>
                </td>
            `;
            
            // 添加按钮事件
            const editBtn = row.querySelector('.btn-edit');
            const deleteBtn = row.querySelector('.btn-delete');
            
            editBtn.addEventListener('click', () => this.openEditModal(category.category_pkey));
            deleteBtn.addEventListener('click', () => this.deleteCategory(category.category_pkey));
            
            // 将行添加到表格
            this.tableBody.appendChild(row);
        });
    }
    
    /**
     * 打开添加模态框
     */
    openAddModal() {
        this.isEditing = false;
        this.currentCategory = null;
        this.modalTitle.textContent = '添加新分类';
        this.categoryForm.reset();
        
        // 加载用途下拉框选项
        this.loadDropdownOptions();
        
        // 确保分类编码输入框为只读（分类编码一旦生成不能更改）
        const codeInput = document.getElementById('code');
        codeInput.readOnly = true;
        
        // 显示添加模式按钮组
        document.getElementById('addModeButtons').style.display = 'block';
        document.getElementById('editModeButtons').style.display = 'none';
        
        this.modal.style.display = 'block';
        
        // 初始化模态框拖动功能
        this.setupModalDrag();
    }
    
    /**
     * 加载下拉框选项
     */
    loadDropdownOptions() {
        // 加载用途下拉框
        const purposeSelect = document.getElementById('用途');
        purposeSelect.innerHTML = '<option value="">请选择用途</option>';
        
        // 添加“添加新内容”选项
        const newOption = document.createElement('option');
        newOption.value = '_new_';
        newOption.textContent = '添加新内容';
        newOption.className = 'text-blue-600 font-semibold';
        purposeSelect.appendChild(newOption);
        
        // 获取唯一的用途值
        const uniquePurposes = [...new Set(this.categories.map(cat => cat.purpose_name))];
        uniquePurposes.forEach(purpose => {
            if (purpose) {
                const option = document.createElement('option');
                option.value = purpose;
                option.textContent = purpose;
                purposeSelect.appendChild(option);
            }
        });
        
        // 清空其他下拉框
        document.getElementById('产品分类').innerHTML = '<option value="">请选择产品分类</option>';
        document.getElementById('产品细分').innerHTML = '<option value="">请选择产品细分</option>';
        document.getElementById('细分说明').innerHTML = '<option value="">请选择细分说明</option>';
    }
    
    /**
     * 打开编辑模态框
     */
    async openEditModal(categoryId) {
        try {
            this.isEditing = true;
            // 使用 getCategory 方法而不是 getCategoryById
            this.currentCategory = await this.categoryService.getCategory(categoryId);
            
            if (!this.currentCategory) {
                throw new Error('未找到分类数据');
            }
            
            this.modalTitle.textContent = '编辑分类';
            
            // 加载下拉框选项
            this.loadDropdownOptions();
            
            // 填充表单
            document.getElementById('categoryId').value = this.currentCategory.category_pkey;

            document.getElementById('用途').value = this.currentCategory.purpose_name || '';
            document.getElementById('产品分类').value = this.currentCategory.category_name || '';
            document.getElementById('产品细分').value = this.currentCategory.subcategory_name || '';
            document.getElementById('细分说明').value = this.currentCategory.detail_name || '';

            document.getElementById('epurpose_name').value = this.currentCategory.epurpose_name || '';
            document.getElementById('ecategory_name').value = this.currentCategory.ecategory_name || '';
            document.getElementById('esubcategory_name').value = this.currentCategory.esubcategory_name || '';
            document.getElementById('edetail_name').value = this.currentCategory.edetail_name || '';

            document.getElementById('code').value = this.currentCategory.code || '';

            // 显示编辑模式按钮组
            document.getElementById('addModeButtons').style.display = 'none';
            document.getElementById('editModeButtons').style.display = 'block';

            this.modal.style.display = 'block';
        } catch (error) {
            console.error('打开编辑模态框失败:', error);
            alert('打开编辑模态框失败: ' + error.message);
        }
    }
    
    /**
     * 编码一致性检查
     */
    checkCodeConsistency() {
        try {
            // 如果在编辑模式下，分类编码不应该被修改
            if (this.isEditing) {
                const existingCode = document.getElementById('code').value;
                if (existingCode) {
                    alert('编辑模式下不允许修改分类编码。分类编码一旦创建即锁止。');
                    return;
                }
            }
            
            // 获取当前选择的分类值
            const purpose = document.getElementById('用途').value;
            const category = document.getElementById('产品分类').value;
            const subcategory = document.getElementById('产品细分').value;
            const detail = document.getElementById('细分说明').value;
            
            if (!purpose || !category || !subcategory || !detail) {
                alert('请先选择所有分类字段');
                return;
            }
            
            // 字段映射到数据库字段
            const dbFieldMap = {
                '用途': 'purpose_name',
                '产品分类': 'category_name',
                '产品细分': 'subcategory_name',
                '细分说明': 'detail_name'
            };
            
            // 字段映射到ID字段
            const idFieldMap = {
                'purpose': '用途ID',
                'category': '产品分类ID',
                'subcategory': '产品细分ID',
                'detail': '细分说明ID'
            };
            
            // 字段类型映射
            const fieldTypeMap = {
                '用途': 'purpose',
                '产品分类': 'category',
                '产品细分': 'subcategory',
                '细分说明': 'detail'
            };
            
            // 检查每个字段的ID是否一致
            let inconsistentFields = [];
            const fields = ['用途', '产品分类', '产品细分', '细分说明'];
            
            fields.forEach(field => {
                const value = document.getElementById(field).value;
                const fieldType = fieldTypeMap[field];
                const idField = idFieldMap[fieldType];
                
                // 使用CategoryService的getOrCreateId方法获取或生成ID
                const consistentId = this.categoryService.getOrCreateId(fieldType, value);
                const currentId = document.getElementById(idField).value;
                
                if (currentId !== consistentId) {
                    inconsistentFields.push({
                        field: field,
                        currentId: currentId,
                        consistentId: consistentId
                    });
                }
            });
            
            // 如果发现不一致的ID，先询问用户是否要修改
            if (inconsistentFields.length > 0) {
                let message = '发现以下字段的ID不一致:\n';
                
                inconsistentFields.forEach(item => {
                    message += `${item.field}: 当前ID=${item.currentId}, 一致ID=${item.consistentId}\n`;
                });
                
                message += '\n是否要更新这些ID以保持一致性？';
                
                if (confirm(message)) {
                    // 用户确认更新，则更新ID
                    inconsistentFields.forEach(item => {
                        document.getElementById(idFieldMap[fieldTypeMap[item.field]]).value = item.consistentId;
                    });
                    
                    // 如果不在编辑模式下，才重新生成编码
                    if (!this.isEditing) {
                        this.updateCode();
                        alert('编码一致性检查完成，已更新ID和编码');
                    } else {
                        alert('编码一致性检查完成，已更新ID。分类编码保持不变。');
                    }
                } else {
                    // 用户取消更新，不做任何更改
                    alert('用户取消更新，保持原有ID不变。');
                }
            } else {
                alert('编码一致性检查完成，所有ID已是一致的');
            }
        } catch (error) {
            console.error('编码一致性检查失败:', error);
            alert('编码一致性检查失败: ' + error.message);
        }
    }
    
    /**
     * 全库编码一致性检查
     */
    async checkAllCodeConsistency() {
        try {
            console.log('开始全库编码一致性检查');
            
            // 确认用户是否要进行全库检查
            if (!confirm('即将对所有分类进行编码一致性检查\n\n这将检查所有分类的ID是否与其名称一致\n\n是否继续？')) {
                return;
            }
            
            // 先确保数据已加载
            if (!this.categories || this.categories.length === 0) {
                await this.loadCategories();
            }
            
            console.log(`当前分类数量: ${this.categories.length}`);
            
            // 字段映射
            const fieldTypeMap = {
                'purpose_name': 'purpose',
                'category_name': 'category',
                'subcategory_name': 'subcategory',
                'detail_name': 'detail'
            };
            
            // 强制重新加载所有分类数据，确保数据是最新的
            await this.categoryService.loadAllCategories();
            
            // 收集不一致的分类
            let inconsistentCategories = [];
            
            // 检查每个分类
            for (const category of this.categories) {
                console.log(`检查分类: ${category.purpose_name} > ${category.category_name} > ${category.subcategory_name} > ${category.detail_name}`);
                
                let hasInconsistency = false;
                let inconsistentFields = [];
                
                // 检查每个字段
                for (const field of ['purpose_name', 'category_name', 'subcategory_name', 'detail_name']) {
                    const value = category[field];
                    if (!value) {
                        console.log(`字段 ${field} 为空，跳过`);
                        continue; // 跳过空值
                    }
                    
                    const fieldType = fieldTypeMap[field];
                    const idField = field.replace('_name', '_id');
                    
                    // 检查ID字段是否存在
                    if (category[idField] === undefined || category[idField] === null) {
                        console.log(`警告: 分类中没有 ${idField} 字段或字段为空`);
                        
                        // 如果字段不存在，我们将其视为不一致
                        hasInconsistency = true;
                        inconsistentFields.push({
                            field: field,
                            value: value,
                            currentId: null,
                            consistentId: this.categoryService.getOrCreateId(fieldType, value)
                        });
                        continue;
                    }
                    
                    // 获取一致的ID
                    console.log(`检查字段: ${field}, 值: ${value}, 类型: ${fieldType}`);
                    const consistentId = this.categoryService.getOrCreateId(fieldType, value);
                    const currentId = category[idField];
                    
                    console.log(`字段 ${field} 的当前ID: ${currentId}, 一致ID: ${consistentId}`);
                    
                    // 检查ID是否一致
                    if (currentId !== consistentId) {
                        hasInconsistency = true;
                        inconsistentFields.push({
                            field: field,
                            value: value,
                            currentId: currentId,
                            consistentId: consistentId
                        });
                    }
                }
                
                if (hasInconsistency) {
                    inconsistentCategories.push({
                        category: category,
                        inconsistentFields: inconsistentFields
                    });
                }
            }
            
            // 如果没有不一致的分类
            if (inconsistentCategories.length === 0) {
                alert('全库编码一致性检查完成\n\n所有分类的ID均与其名称一致');
                return;
            }
            
            // 显示不一致的分类信息
            let message = `发现 ${inconsistentCategories.length} 个分类的ID不一致:\n\n`;
            
            // 限制显示的数量，避免对话框过大
            const maxDisplay = 10;
            const displayCount = Math.min(inconsistentCategories.length, maxDisplay);
            
            for (let i = 0; i < displayCount; i++) {
                const item = inconsistentCategories[i];
                message += `分类: ${item.category.purpose_name} > ${item.category.category_name} > ${item.category.subcategory_name} > ${item.category.detail_name}\n`;
                message += `编码: ${item.category.code}\n`;
                
                item.inconsistentFields.forEach(field => {
                    message += `  - ${field.field}: 当前ID=${field.currentId}, 一致ID=${field.consistentId}\n`;
                });
                
                message += '\n';
            }
            
            if (inconsistentCategories.length > maxDisplay) {
                message += `... 及其他 ${inconsistentCategories.length - maxDisplay} 个分类\n\n`;
            }
            
            message += '是否要修复这些不一致的ID？\n\n注意: 这将更新数据库中的ID字段，但不会改变分类编码。';
            
            if (confirm(message)) {
                // 用户确认修复，开始更新数据库中的不一致ID
                let updatedCount = 0;
                
                for (const item of inconsistentCategories) {
                    const category = item.category;
                    const updates = {};
                    
                    // 在控制台中输出不一致的字段信息
                    console.log(`准备修复不一致的分类记录: ${category.purpose_name} > ${category.category_name} > ${category.subcategory_name} > ${category.detail_name}`);
                    
                    // 根据表结构，数据库中实际不存在purpose_id、category_id等字段
                    // 所以我们只记录不一致的字段，但不尝试更新它们
                    console.log('检测到不一致的字段，但数据库中不存在这些字段，无法更新');
                    item.inconsistentFields.forEach(field => {
                        const idField = field.field.replace('_name', '_id');
                        console.log(`不一致的字段: ${field.field} -> ${idField}, 当前ID: ${field.currentId}, 应为: ${field.consistentId}`);
                        // 不再尝试更新这些不存在的字段
                        // updates[idField] = field.consistentId;
                    });
                    
                    // 不再尝试更新不存在的字段，而是直接跳过这个记录
                    console.log('跳过该记录，因为无法更新不存在的字段');
                    continue;
                    
                    // 如果没有要更新的内容，则跳过
                    if (Object.keys(updates).length === 0) {
                        console.log('没有要更新的内容，跳过该记录');
                        continue;
                    }
                    
                    try {
                        // 根据实际表结构，主键字段名是category_pkey
                        const primaryKeyField = 'category_pkey';
                        const primaryKeyValue = category.category_pkey;
                        
                        console.log('使用主键字段category_pkey:', primaryKeyValue);
                        
                        if (!primaryKeyValue) {
                            console.error('分类主键为空，无法更新记录:', category);
                            throw new Error('分类主键为空');
                        }
                        
                        console.log('数据库连接状态:', window.supabase ? '可用' : '不可用');
                        console.log('表名:', 'category');
                        console.log('主键值:', primaryKeyValue);
                        console.log('更新内容:', updates);
                        
                        // 尝试获取当前记录
                        const { data: checkData, error: checkError } = await window.supabase
                            .from('category')
                            .select('*')
                            .eq(primaryKeyField, primaryKeyValue)
                            .single();
                            
                        if (checkError) {
                            console.error(`获取分类 ID=${primaryKeyValue} 失败:`, checkError);
                            throw checkError;
                        }
                        
                        if (!checkData) {
                            console.error(`分类 ID=${primaryKeyValue} 不存在`);
                            throw new Error(`分类 ID=${primaryKeyValue} 不存在`);
                        }
                        
                        console.log(`准备更新的记录:`, checkData);
                        
                        // 使用Supabase更新数据库中的记录
                        const { data, error } = await window.supabase
                            .from('category')
                            .update(updates)
                            .eq(primaryKeyField, primaryKeyValue)
                            .select();
                        
                        if (error) {
                            console.error(`更新分类 ID=${primaryKeyValue} 失败:`, error);
                            throw error;
                        }
                        
                        if (data && data.length > 0) {
                            updatedCount++;
                            console.log(`成功更新分类 ID=${primaryKeyValue}, 更新字段:`, updates, '返回数据:', data[0]);
                        } else {
                            console.error(`更新分类 ID=${primaryKeyValue} 返回空结果`);
                        }
                    } catch (error) {
                        console.error(`更新分类失败:`, error);
                    }
                }
                
                // 重新加载数据
                await this.loadCategories();
                this.renderTable();
                
                alert(`全库编码一致性检查完成\n\n成功更新了 ${updatedCount} 个分类的ID`);
            } else {
                alert('用户取消了更新操作，所有分类保持不变');
            }
        } catch (error) {
            console.error('全库编码一致性检查失败:', error);
            alert('全库编码一致性检查失败: ' + error.message);
        }
    }
    
    /**
     * 打开复制修改模态框
     */
    async openCopyModal(categoryId) {
        try {
            // 获取原始分类数据
            const originalCategory = await this.categoryService.getCategory(categoryId);
            
            if (!originalCategory) {
                throw new Error('未找到分类数据');
            }
            
            // 设置为添加模式，但填充原始数据
            this.isEditing = false;
            this.currentCategory = null;
            this.modalTitle.textContent = '复制新建分类';
            
            // 清除ID字段，但保留其他数据
            document.getElementById('categoryId').value = '';
            document.getElementById('用途').value = originalCategory.purpose_name || '';
            document.getElementById('用途ID').value = this.generateRandomChar();
            document.getElementById('产品分类').value = originalCategory.category_name || '';
            document.getElementById('产品分类ID').value = this.generateRandomChar();
            document.getElementById('产品细分').value = originalCategory.subcategory_name || '';
            document.getElementById('产品细分ID').value = this.generateRandomChar();
            document.getElementById('细分说明').value = originalCategory.detail_name || '';
            document.getElementById('细分说明ID').value = this.generateRandomChar();
            
            // 填充英文字段
            document.getElementById('epurpose_name').value = originalCategory.epurpose_name || '';
            document.getElementById('ecategory_name').value = originalCategory.ecategory_name || '';
            document.getElementById('esubcategory_name').value = originalCategory.esubcategory_name || '';
            document.getElementById('edetail_name').value = originalCategory.edetail_name || '';
            
            // 生成新的分类编码
            this.regenerateCode();
            
            this.modal.style.display = 'block';
        } catch (error) {
            console.error('打开复制模态框失败:', error);
            alert('打开复制模态框失败: ' + error.message);
        }
    }
    
    /**
     * 关闭模态框
     */
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    /**
     * 处理下拉框选择变化 - 逐级筛选和自动填充英文
     */
    handleSelectChange(field) {
        const select = document.getElementById(field);
        const value = select.value.trim();
        const category_pkeyField = document.getElementById(`${field}ID`);
        
        // 如果选择了“添加新内容”选项
        if (value === '_new_') {
            // 将下拉框替换为输入框
            this.replaceSelectWithInput(field);
            return;
        }
        
        if (value) {
            // 生成或获取ID
            if (!category_pkeyField.value) {
                // 使用CategoryService的getOrCreateId方法获取或生成ID
                const fieldTypeMap = {
                    '用途': 'purpose',
                    '产品分类': 'category',
                    '产品细分': 'subcategory',
                    '细分说明': 'detail'
                };
                
                const fieldType = fieldTypeMap[field];
                category_pkeyField.value = this.categoryService.getOrCreateId(fieldType, value);
            }
            
            // 自动填充英文字段
            this.autoFillEnglishField(field, value);
            
            // 更新下级下拉框选项
            this.updateDependentDropdowns(field);
            
            // 更新编码
            this.updateCode();
        } else {
            category_pkeyField.value = '';
            
            // 清空下级下拉框
            this.clearDependentDropdowns(field);
        }
    }
    
    /**
     * 将下拉框替换为输入框
     */
    replaceSelectWithInput(field) {
        const select = document.getElementById(field);
        const parent = select.parentNode;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.id = field;
        input.name = field;
        input.className = 'form-control';
        input.placeholder = `请输入新的${field}`;
        input.required = true;
        input.dataset.isNewInput = 'true'; // 标记这是一个新输入框
        
        // 替换下拉框
        parent.replaceChild(input, select);
        
        // 设置焦点
        input.focus();
        
        // 添加失去焦点事件，当用户输入完成时更新ID和编码
        input.addEventListener('blur', () => {
            const value = input.value.trim();
            if (value) {
                // 生成新ID
                const fieldTypeMap = {
                    '用途': 'purpose',
                    '产品分类': 'category',
                    '产品细分': 'subcategory',
                    '细分说明': 'detail'
                };
                
                const fieldType = fieldTypeMap[field];
                const category_pkeyField = document.getElementById(`${field}ID`);
                category_pkeyField.value = this.categoryService.getOrCreateId(fieldType, value);
                
                // 更新下级下拉框
                this.updateDependentDropdowns(field);
                
                // 更新编码
                this.updateCode();
            }
        });
        
        // 添加回车键事件
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // 触发blur事件
            }
        });
    }
    
    /**
     * 在保存前将输入框恢复为下拉框
     */
    restoreSelectFromInput() {
        // 查找所有标记为新输入框的元素
        const newInputs = document.querySelectorAll('input[data-is-new-input="true"]');
        
        newInputs.forEach(input => {
            const field = input.id;
            const value = input.value.trim();
            
            if (value) {
                // 创建新的下拉框
                const select = document.createElement('select');
                select.id = field;
                select.name = field;
                select.className = 'form-select';
                select.required = true;
                
                // 添加默认选项
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `请选择${field}`;
                select.appendChild(defaultOption);
                
                // 添加“添加新内容”选项
                const newOption = document.createElement('option');
                newOption.value = '_new_';
                newOption.textContent = '添加新内容';
                newOption.className = 'text-blue-600 font-semibold';
                select.appendChild(newOption);
                
                // 添加当前输入的值作为选项
                const valueOption = document.createElement('option');
                valueOption.value = value;
                valueOption.textContent = value;
                valueOption.selected = true;
                select.appendChild(valueOption);
                
                // 替换输入框
                const parent = input.parentNode;
                parent.replaceChild(select, input);
                
                // 为新下拉框添加事件监听器
                select.addEventListener('change', () => this.handleSelectChange(field));
            }
        });
    }
    
    /**
     * 自动填充英文字段
     */
    autoFillEnglishField(field, value) {
        if (!value) return;
        
        // 字段映射
        const englishFieldMap = {
            '用途': 'epurpose_name',
            '产品分类': 'ecategory_name',
            '产品细分': 'esubcategory_name',
            '细分说明': 'edetail_name'
        };
        
        const englishField = englishFieldMap[field];
        const englishInput = document.getElementById(englishField);
        
        if (!englishInput) return;
        
        // 字段映射到数据库字段
        const dbFieldMap = {
            '用途': 'purpose_name',
            '产品分类': 'category_name',
            '产品细分': 'subcategory_name',
            '细分说明': 'detail_name'
        };
        
        const dbField = dbFieldMap[field];
        
        // 查找具有相同中文值的分类
        const matchingCategory = this.categories.find(cat => cat[dbField] === value && cat[englishField]);
        
        // 如果找到匹配的分类，则填充英文字段
        if (matchingCategory) {
            // 无论是编辑模式还是新增模式，只要中文字段发生了变化，就自动填充英文字段
            englishInput.value = matchingCategory[englishField];
            console.log(`自动填充英文字段: ${field} -> ${englishField}, 值: ${matchingCategory[englishField]}`);
        }
    }
    
    /**
     * 更新下级下拉框选项
     */
    updateDependentDropdowns(field) {
        const hierarchy = ['用途', '产品分类', '产品细分', '细分说明'];
        const currentIndex = hierarchy.indexOf(field);
        
        // 如果不是最后一级，则更新下一级下拉框
        if (currentIndex < hierarchy.length - 1) {
            // 获取当前选择的值
            const selectedValues = {};
            for (let i = 0; i <= currentIndex; i++) {
                const fieldName = hierarchy[i];
                selectedValues[fieldName] = document.getElementById(fieldName).value;
            }
            
            // 字段映射到数据库字段
            const dbFieldMap = {
                '用途': 'purpose_name',
                '产品分类': 'category_name',
                '产品细分': 'subcategory_name',
                '细分说明': 'detail_name'
            };
            
            // 过滤分类数据
            let filteredCategories = [...this.categories];
            for (let i = 0; i <= currentIndex; i++) {
                const fieldName = hierarchy[i];
                const dbField = dbFieldMap[fieldName];
                const selectedValue = selectedValues[fieldName];
                
                if (selectedValue) {
                    filteredCategories = filteredCategories.filter(cat => cat[dbField] === selectedValue);
                }
            }
            
            // 更新下一级下拉框
            const nextField = hierarchy[currentIndex + 1];
            const nextDbField = dbFieldMap[nextField];
            const nextSelect = document.getElementById(nextField);
            
            // 清空当前选项
            nextSelect.innerHTML = '<option value="">请选择' + nextField + '</option>';
            
            // 添加“添加新内容”选项
            const newOption = document.createElement('option');
            newOption.value = '_new_';
            newOption.textContent = '添加新内容';
            newOption.className = 'text-blue-600 font-semibold';
            nextSelect.appendChild(newOption);
            
            // 添加新选项
            const uniqueValues = [...new Set(filteredCategories.map(cat => cat[nextDbField]))];
            uniqueValues.forEach(value => {
                if (value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    nextSelect.appendChild(option);
                }
            });
            
            // 清空下级下拉框
            for (let i = currentIndex + 2; i < hierarchy.length; i++) {
                const fieldName = hierarchy[i];
                const select = document.getElementById(fieldName);
                select.innerHTML = '<option value="">请选择' + fieldName + '</option>';
            }
        }
    }
    
    /**
     * 清空下级下拉框
     */
    clearDependentDropdowns(field) {
        const hierarchy = ['用途', '产品分类', '产品细分', '细分说明'];
        const currentIndex = hierarchy.indexOf(field);
        
        // 清空当前级别及以下的所有下拉框
        for (let i = currentIndex; i < hierarchy.length; i++) {
            const fieldName = hierarchy[i];
            const select = document.getElementById(fieldName);
            
            if (i === currentIndex) {
                // 当前级别保留默认选项
                select.innerHTML = '<option value="">请选择' + fieldName + '</option>';
                
                // 添加“添加新内容”选项
                const newOption = document.createElement('option');
                newOption.value = '_new_';
                newOption.textContent = '添加新内容';
                newOption.className = 'text-blue-600 font-semibold';
                select.appendChild(newOption);
                
                // 如果是第一级，重新加载所有选项
                if (i === 0) {
                    const uniqueValues = [...new Set(this.categories.map(cat => cat.purpose_name))];
                    uniqueValues.forEach(value => {
                        if (value) {
                            const option = document.createElement('option');
                            option.value = value;
                            option.textContent = value;
                            select.appendChild(option);
                        }
                    });
                }
            } else {
                // 下级只保留默认选项
                select.innerHTML = '<option value="">请选择' + fieldName + '</option>';
                
                // 添加“添加新内容”选项
                const newOption = document.createElement('option');
                newOption.value = '_new_';
                newOption.textContent = '添加新内容';
                newOption.className = 'text-blue-600 font-semibold';
                select.appendChild(newOption);
            }
            
            // 清空对应的ID和英文字段
            document.getElementById(`${fieldName}ID`).value = '';
            
            const englishFieldMap = {
                '用途': 'epurpose_name',
                '产品分类': 'ecategory_name',
                '产品细分': 'esubcategory_name',
                '细分说明': 'edetail_name'
            };
            
            const englishField = englishFieldMap[fieldName];
            document.getElementById(englishField).value = '';
        }
    }
    
    /**
     * 从中文生成ID（拼音首字母）
     */
    generateIdFromChinese(text) {
        // 简单实现 - 实际应用中可能需要使用拼音库
        // 这里假设每个中文字符生成一个随机字母作为示例
        const category_pkey = Array.from(text)
            .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
            .join('');
        
        return category_pkey.substring(0, 3); // 限制为3个字符
    }
    
    /**
     * 更新编码
     */
    updateCode() {
        const 用途ID = document.getElementById('用途ID').value;
        const 产品分类ID = document.getElementById('产品分类ID').value;
        const 产品细分ID = document.getElementById('产品细分ID').value;
        const 细分说明ID = document.getElementById('细分说明ID').value;
        
        if (用途ID && 产品分类ID && 产品细分ID && 细分说明ID) {
            // 生成随机变码（2位数字）
            const 变码 = Math.floor(10 + Math.random() * 90);
            
            // 组合编码
            const 分类编码 = `${用途ID}${产品分类ID}${产品细分ID}${细分说明ID}${变码}`;
            document.getElementById('code').value = 分类编码;
        }
    }
    
    /**
     * 重新生成编码
     */
    regenerateCode() {
        this.updateCode();
    }
    
    /**
     * 保存分类
     */
    async saveCategory() {
        try {
            // 在保存前将所有输入框恢复为下拉框
            this.restoreSelectFromInput();
            
            // 收集表单数据
            const formData = {
                category_pkey: document.getElementById('categoryId').value || null,
                purpose_name: document.getElementById('用途').value,
                category_name: document.getElementById('产品分类').value,
                subcategory_name: document.getElementById('产品细分').value,
                detail_name: document.getElementById('细分说明').value,
                epurpose_name: document.getElementById('epurpose_name').value,
                ecategory_name: document.getElementById('ecategory_name').value,
                esubcategory_name: document.getElementById('esubcategory_name').value,
                edetail_name: document.getElementById('edetail_name').value,
                code: document.getElementById('code').value
            };

            let result;
            if (this.isEditing && formData.category_pkey) {
                // 更新现有分类
                console.log('更新分类:', formData.category_pkey);
                result = await this.categoryService.updateCategory(formData.category_pkey, formData);
            } else {
                // 添加新分类
                console.log('添加新分类');
                result = await this.categoryService.addCategory(formData);
            }

            if (!result) {
                throw new Error('服务器返回空结果，操作可能失败');
            }

            console.log('操作结果:', result);

            // 关闭模态框并刷新数据
            this.closeModal();
            await this.loadCategories();
            this.initializeFilters(); // 刷新过滤器

            // 显示成功消息
            alert(this.isEditing ? '分类更新成功' : '分类添加成功');
        } catch (error) {
            console.error('保存分类失败:', error);
            alert('保存分类失败: ' + error.message);
        }
    }
    
    /**
     * 生成随机字符
     */
    generateRandomChar() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    }
    
    /**
     * 生成分类编码
     */
    generateCode(category) {
        const 用途ID = category.用途ID || this.generateRandomChar();
        const 产品分类ID = category.产品分类ID || this.generateRandomChar();
        const 产品细分ID = category.产品细分ID || this.generateRandomChar();
        const 细分说明ID = category.细分说明ID || this.generateRandomChar();
        const 变码 = Math.floor(10 + Math.random() * 90);
        
        return `${用途ID}${产品分类ID}${产品细分ID}${细分说明ID}${变码}`;
    }
    
    /**
     * 删除分类
     */
    async deleteCategory(categoryId) {
        if (confirm('确定要删除这个分类吗？此操作不可撤销。')) {
            try {
                await this.categoryService.deleteCategory(categoryId);
                
                // 刷新数据
                await this.loadCategories();
                this.initializeFilters(); // 刷新过滤器
                
                // 显示成功消息
                alert('分类删除成功');
            } catch (error) {
                console.error('删除分类失败:', error);
                alert('删除分类失败: ' + error.message);
            }
        }
    }
    
    /**
     * 导出分类数据到CSV
     */
    exportToCSV() {
        try {
            // 准备CSV内容
            const headers = this.csvColumns.map(col => col.header).join(',');
            const rows = this.categories.map(category => {
                return this.csvColumns.map(col => {
                    const value = category[col.field] || '';
                    // 处理可能包含逗号的值
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',');
            });
            
            // 组合成完整的CSV内容
            const csvContent = [headers, ...rows].join('\n');
            
            // 添加UTF-8 BOM标记，解决中文乱码问题
            const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
            const csvContentWithBOM = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8;' });
            
            // 创建下载链接
            const link = document.createElement('a');
            const url = URL.createObjectURL(csvContentWithBOM);
            link.setAttribute('href', url);
            link.setAttribute('download', `分类数据_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            
            // 模拟点击下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('导出成功！');
        } catch (error) {
            console.error('导出CSV失败:', error);
            alert('导出CSV失败: ' + error.message);
        }
    }
    
    /**
     * 从上传的CSV文件导入分类数据
     */
    importFromCSV(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    
                    // 解析标题行
                    const headers = this.parseCSVLine(lines[0]);
                    
                    // 创建字段映射
                    const fieldMap = {};
                    headers.forEach((header, index) => {
                        const column = this.csvColumns.find(col => col.header === header);
                        if (column) {
                            fieldMap[index] = column.field;
                        }
                    });
                    
                    // 解析数据行
                    const importedCategories = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue; // 跳过空行
                        
                        const values = this.parseCSVLine(lines[i]);
                        const category = {};
                        
                        // 根据映射填充字段
                        values.forEach((value, index) => {
                            if (fieldMap[index]) {
                                category[fieldMap[index]] = value;
                            }
                        });
                        
                        // 生成必要的ID字段
                        // 对于新导入的数据，我们总是生成新的ID
                        category.category_pkey = Math.floor(1000 + Math.random() * 9000);
                        
                        // 确保所有必要字段都存在
                        const requiredFields = ['purpose_name', 'category_name', 'subcategory_name', 'detail_name'];
                        let missingFields = false;
                        
                        for (const field of requiredFields) {
                            if (!category[field]) {
                                console.warn(`导入数据缺少必要字段: ${field}`);
                                missingFields = true;
                                break;
                            }
                        }
                        
                        // 如果缺少必要字段，跳过这条数据
                        if (missingFields) {
                            continue;
                        }
                        
                        // 添加到导入列表
                        importedCategories.push(category);
                    }
                    
                    // 确认导入
                    if (importedCategories.length > 0) {
                        if (confirm(`已解析 ${importedCategories.length} 条分类数据，是否导入？`)) {
                            // 开始导入
                            let successCount = 0;
                            let errorCount = 0;
                            
                            for (const category of importedCategories) {
                                try {
                                    // 尝试添加分类
                                    await this.categoryService.addCategory(category);
                                    successCount++;
                                } catch (error) {
                                    console.error('导入分类失败:', error, category);
                                    errorCount++;
                                }
                            }
                            
                            // 刷新数据
                            await this.loadCategories();
                            this.initializeFilters();
                            
                            // 显示结果
                            alert(`导入完成！\n成功: ${successCount} 条\n失败: ${errorCount} 条`);
                        }
                    } else {
                        alert('没有解析到有效的分类数据');
                    }
                    
                    // 重置文件输入框
                    event.target.value = '';
                } catch (error) {
                    console.error('解析CSV文件失败:', error);
                    alert('解析CSV文件失败: ' + error.message);
                    event.target.value = '';
                }
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('导入CSV失败:', error);
            alert('导入CSV失败: ' + error.message);
            event.target.value = '';
        }
    }
    
    /**
     * 解析CSV行
     */
    parseCSVLine(line) {
        const result = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (i < line.length - 1 && line[i + 1] === '"') {
                    // 处理转义引号
                    currentValue += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 遇到分隔符，保存当前值
                result.push(currentValue);
                currentValue = '';
            } else {
                // 添加到当前值
                currentValue += char;
            }
        }
        
        // 添加最后一个值
        result.push(currentValue);
        
        return result;
    }
}

