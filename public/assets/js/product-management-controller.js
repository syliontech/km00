/**
 * 产品管理控制器
 * 处理产品管理页面的交互逻辑
 */
class ProductManagementController {
    constructor() {
        // DOM元素
        this.addProductBtn = document.getElementById('addProductBtn');
        this.copyProductBtn = document.getElementById('copyProductBtn');
        this.editProductBtn = document.getElementById('editProductBtn');
        this.deleteProductBtn = document.getElementById('deleteProductBtn');
        this.productCategory = document.getElementById('productCategory');
        this.newCategoryBtn = document.getElementById('newCategoryBtn');
        this.newCategoryForm = document.getElementById('newCategoryForm');
        this.newCategoryName = document.getElementById('newCategoryName');
        this.saveCategoryBtn = document.getElementById('saveCategoryBtn');
        this.tempCategoryNotice = document.getElementById('tempCategoryNotice');
        this.productCode = document.getElementById('productCode');
        this.productType = document.getElementById('productType');
        this.productUnit = document.getElementById('productUnit');
        this.productImages = document.getElementById('productImages');
        this.productDocuments = document.getElementById('productDocuments');
        this.permissionAlert = document.getElementById('permissionAlert');
        this.permissionMessage = document.getElementById('permissionMessage');
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        console.log('初始化产品管理控制器...');
        this.loadCategories();
        this.bindEvents();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 添加新产品按钮
        this.addProductBtn.addEventListener('click', () => this.showAddProductForm());
        
        // 复制为新产品按钮
        this.copyProductBtn.addEventListener('click', () => this.copyProductAsNew());
        
        // 编辑产品按钮
        this.editProductBtn.addEventListener('click', () => this.editProduct());
        
        // 删除产品按钮
        this.deleteProductBtn.addEventListener('click', () => this.deleteProduct());
        
        // 新建分类按钮
        this.newCategoryBtn.addEventListener('click', () => this.toggleNewCategoryForm());
        
        // 保存分类按钮
        this.saveCategoryBtn.addEventListener('click', () => this.saveCategory());
        
        // 产品分类选择
        this.productCategory.addEventListener('change', () => this.generateProductCode());
        
        // 产品类型选择
        this.productType.addEventListener('change', () => this.updateProductUnit());
        
        // 图片上传
        this.productImages.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // 文档上传
        this.productDocuments.addEventListener('change', (e) => this.handleDocumentUpload(e));
    }
    
    /**
     * 加载产品分类
     * 静态展示，后续连接数据库
     */
    loadCategories() {
        // 清空选项
        this.productCategory.innerHTML = '<option value="">选择分类</option>';
        
        // 添加示例分类
        const demoCategories = [
            { id: 'A001', name: '电子产品' },
            { id: 'B002', name: '家居用品' },
            { id: 'C003', name: '办公用品' }
        ];
        
        demoCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            this.productCategory.appendChild(option);
        });
    }
    
    /**
     * 显示/隐藏新建分类表单
     */
    toggleNewCategoryForm() {
        this.newCategoryForm.classList.toggle('hidden');
        
        // 检查用户权限（静态演示）
        const hasPermission = false; // 假设用户没有权限
        if (!hasPermission) {
            this.tempCategoryNotice.classList.remove('hidden');
        } else {
            this.tempCategoryNotice.classList.add('hidden');
        }
    }
    
    /**
     * 保存新分类
     * 静态展示，后续连接数据库
     */
    saveCategory() {
        const categoryName = this.newCategoryName.value.trim();
        if (!categoryName) {
            alert('请输入分类名称');
            return;
        }
        
        // 检查用户权限（静态演示）
        const hasPermission = false; // 假设用户没有权限
        
        // 生成临时分类ID
        const tempId = 'T' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        // 添加到下拉菜单
        const option = document.createElement('option');
        option.value = tempId;
        option.textContent = categoryName + (hasPermission ? '' : ' (临时)');
        option.className = hasPermission ? '' : 'text-red-500';
        this.productCategory.appendChild(option);
        
        // 选中新添加的分类
        this.productCategory.value = tempId;
        
        // 生成产品编码
        this.generateProductCode();
        
        // 隐藏表单
        this.newCategoryForm.classList.add('hidden');
        this.newCategoryName.value = '';
    }
    
    /**
     * 生成产品编码
     * 静态展示，后续连接数据库确保唯一性
     */
    generateProductCode() {
        const categoryId = this.productCategory.value;
        if (!categoryId) {
            this.productCode.value = '';
            return;
        }
        
        // 生成随机2位数
        const randomCode = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        // 组合产品编码
        this.productCode.value = categoryId + randomCode;
    }
    
    /**
     * 更新产品单位
     */
    updateProductUnit() {
        const isGroup = this.productType.value === 'group';
        this.productUnit.value = isGroup ? '套/set' : '件/pc';
    }
    
    /**
     * 处理图片上传
     * 静态展示，后续实现文件上传功能
     */
    handleImageUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // 限制最多上传3张图片
        if (files.length > 3) {
            alert('最多只能上传3张图片');
            event.target.value = '';
            return;
        }
        
        // 清空预览容器
        const previewContainer = document.getElementById('imagePreviewContainer');
        previewContainer.innerHTML = '';
        
        // 创建预览
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'relative';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="预览" class="w-full h-24 object-cover rounded">
                    <span class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer delete-preview">×</span>
                `;
                previewContainer.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 处理文档上传
     * 静态展示，后续实现文件上传功能
     */
    handleDocumentUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // 清空预览容器
        const previewContainer = document.getElementById('documentPreviewContainer');
        previewContainer.innerHTML = '';
        
        // 创建预览
        Array.from(files).forEach(file => {
            const preview = document.createElement('div');
            preview.className = 'flex items-center justify-between bg-gray-100 p-1 rounded mt-1';
            
            // 根据文件类型选择图标
            let icon = 'fa-file';
            if (file.name.endsWith('.pdf')) icon = 'fa-file-pdf';
            else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) icon = 'fa-file-word';
            else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) icon = 'fa-file-excel';
            else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) icon = 'fa-file-powerpoint';
            
            preview.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${icon} text-gray-500 mr-2"></i>
                    <span class="text-xs truncate" style="max-width: 200px;">${file.name}</span>
                </div>
                <span class="text-red-500 cursor-pointer delete-preview">×</span>
            `;
            previewContainer.appendChild(preview);
        });
    }
    
    /**
     * 显示添加产品表单
     */
    showAddProductForm() {
        // 打开模态框
        const modal = document.getElementById('productFormModal');
        modal.classList.remove('hidden');
        
        // 设置标题
        document.getElementById('modalTitle').textContent = '添加新产品';
        
        // 重置表单
        document.getElementById('productForm').reset();
        
        // 清空预览
        document.getElementById('imagePreviewContainer').innerHTML = '';
        document.getElementById('documentPreviewContainer').innerHTML = '';
        
        // 清空供应商和客户信息
        document.getElementById('supplierInfoList').innerHTML = '<tr class="text-gray-500"><td colspan="2" class="py-1 px-1 text-center">无供应商信息</td></tr>';
        document.getElementById('customerInfoList').innerHTML = '<tr class="text-gray-500"><td colspan="2" class="py-1 px-1 text-center">无客户信息</td></tr>';
    }
    
    /**
     * 复制产品为新产品
     * 静态展示，后续连接数据库
     */
    copyProductAsNew() {
        // 检查是否选中了产品
        alert('请先选择要复制的产品');
        
        // 后续实现：
        // 1. 复制产品基本信息
        // 2. 生成新的产品编码
        // 3. 清除供应商/客户数据
        // 4. 清除上传数据
    }
    
    /**
     * 编辑产品
     * 静态展示，后续连接数据库
     */
    editProduct() {
        // 检查是否选中了产品
        alert('请先选择要编辑的产品');
        
        // 检查权限（静态演示）
        const hasPermission = false; // 假设用户没有权限
        if (!hasPermission) {
            this.permissionAlert.classList.remove('hidden');
            this.permissionMessage.textContent = '您没有权限编辑产品';
            setTimeout(() => {
                this.permissionAlert.classList.add('hidden');
            }, 3000);
            return;
        }
        
        // 后续实现：
        // 1. 加载产品数据
        // 2. 填充表单
        // 3. 显示模态框
    }
    
    /**
     * 删除产品
     * 静态展示，后续连接数据库
     */
    deleteProduct() {
        // 检查是否选中了产品
        alert('请先选择要删除的产品');
        
        // 检查权限（静态演示）
        const hasPermission = false; // 假设用户没有权限
        if (!hasPermission) {
            this.permissionAlert.classList.remove('hidden');
            this.permissionMessage.textContent = '您没有权限删除产品';
            setTimeout(() => {
                this.permissionAlert.classList.add('hidden');
            }, 3000);
            return;
        }
        
        // 后续实现：
        // 1. 确认删除
        // 2. 删除产品及关联数据
        // 3. 删除上传文件
    }
}

// 页面加载完成后初始化控制器
document.addEventListener('DOMContentLoaded', () => {
    const controller = new ProductManagementController();
});
<script src="assets/js/product-management-controller.js"></script>