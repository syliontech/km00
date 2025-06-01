// 产品管理Tab栏功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Tab切换功能
    initTabSystem();
    
    // 初始化规格字段变化监听
    initSpecFieldsListener();
    
    // 初始化组套产品功能
    initGroupProducts();
    
    // 初始化供应商功能
    initSuppliers();
    
    // 初始化客户功能
    initCustomers();
});

// Tab切换功能
function initTabSystem() {
    const tabButtons = document.querySelectorAll('#productTabs button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有tab的active状态
            tabButtons.forEach(btn => {
                btn.classList.remove('text-blue-500', 'border-blue-500');
                btn.classList.add('text-gray-500', 'border-transparent');
            });
            
            // 隐藏所有tab内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // 激活当前tab
            button.classList.remove('text-gray-500', 'border-transparent');
            button.classList.add('text-blue-500', 'border-blue-500');
            
            // 显示对应的内容
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.style.display = 'block';
            }
        });
    });
}

// 规格字段变化监听
function initSpecFieldsListener() {
    const specFields = document.querySelectorAll('.spec-field');
    
    specFields.forEach(field => {
        field.addEventListener('input', function() {
            const originalValue = this.getAttribute('data-original');
            const currentValue = this.value;
            
            // 如果值发生变化，字体变红色
            if (originalValue !== currentValue) {
                this.classList.add('modified');
                // 显示规格变化提示
                document.getElementById('specChangeAlert').classList.remove('hidden');
            } else {
                this.classList.remove('modified');
                // 检查是否还有其他变化的字段
                const hasChanges = Array.from(specFields).some(f => 
                    f.getAttribute('data-original') !== f.value
                );
                
                if (!hasChanges) {
                    document.getElementById('specChangeAlert').classList.add('hidden');
                }
            }
        });
    });
    
    // 保存为新产品按钮事件
    const saveAsNewBtn = document.getElementById('saveAsNewBtn');
    if (saveAsNewBtn) {
        saveAsNewBtn.addEventListener('click', function() {
            // 收集规格字段数据
            const specData = {};
            specFields.forEach(field => {
                const fieldName = field.previousElementSibling.textContent.trim();
                specData[fieldName] = field.value;
                
                // 更新原始值
                field.setAttribute('data-original', field.value);
                field.classList.remove('modified');
            });
            
            // 隐藏规格变化提示
            document.getElementById('specChangeAlert').classList.add('hidden');
            
            // 这里可以添加保存新产品的逻辑
            alert('已保存为新产品！');
        });
    }
    
    // 取消规格变化按钮事件
    const cancelSpecChangeBtn = document.getElementById('cancelSpecChangeBtn');
    if (cancelSpecChangeBtn) {
        cancelSpecChangeBtn.addEventListener('click', function() {
            // 恢复所有字段的原始值
            specFields.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            // 隐藏规格变化提示
            document.getElementById('specChangeAlert').classList.add('hidden');
        });
    }
}

// 组套产品功能
function initGroupProducts() {
    const productTypeSelect = document.getElementById('productTypeSelect');
    const singleProductNotice = document.getElementById('singleProductNotice');
    const groupProductContent = document.getElementById('groupProductContent');
    const addGroupProductBtn = document.getElementById('addGroupProductBtn');
    
    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', function() {
            if (this.value === 'group') {
                singleProductNotice.classList.add('hidden');
                groupProductContent.classList.remove('hidden');
                addGroupProductBtn.removeAttribute('disabled');
            } else {
                singleProductNotice.classList.remove('hidden');
                groupProductContent.classList.add('hidden');
                addGroupProductBtn.setAttribute('disabled', 'disabled');
            }
        });
    }
    
    // 组套产品数量和折扣变化监听
    const groupProductQuantities = document.querySelectorAll('.group-product-quantity');
    const groupProductDiscounts = document.querySelectorAll('.group-product-discount');
    
    function addGroupProductChangeListener(elements) {
        elements.forEach(element => {
            element.addEventListener('input', function() {
                const originalValue = this.getAttribute('data-original');
                const currentValue = this.value;
                
                if (originalValue !== currentValue) {
                    this.classList.add('modified');
                    document.getElementById('groupContentChangeAlert').classList.remove('hidden');
                } else {
                    this.classList.remove('modified');
                    
                    // 检查是否还有其他变化的字段
                    const allGroupFields = [...groupProductQuantities, ...groupProductDiscounts];
                    const hasChanges = Array.from(allGroupFields).some(f => 
                        f.getAttribute('data-original') !== f.value
                    );
                    
                    if (!hasChanges) {
                        document.getElementById('groupContentChangeAlert').classList.add('hidden');
                    }
                }
            });
        });
    }
    
    addGroupProductChangeListener(groupProductQuantities);
    addGroupProductChangeListener(groupProductDiscounts);
    
    // 创建新组套产品按钮事件
    const createNewGroupProductBtn = document.getElementById('createNewGroupProductBtn');
    if (createNewGroupProductBtn) {
        createNewGroupProductBtn.addEventListener('click', function() {
            // 收集组套产品数据
            const groupProductItems = document.querySelectorAll('.group-product-item');
            const groupProductData = [];
            
            groupProductItems.forEach(item => {
                const productId = item.getAttribute('data-product-id');
                const quantity = item.querySelector('.group-product-quantity').value;
                const discount = item.querySelector('.group-product-discount').value;
                
                groupProductData.push({
                    productId,
                    quantity,
                    discount
                });
                
                // 更新原始值
                item.querySelector('.group-product-quantity').setAttribute('data-original', quantity);
                item.querySelector('.group-product-quantity').classList.remove('modified');
                item.querySelector('.group-product-discount').setAttribute('data-original', discount);
                item.querySelector('.group-product-discount').classList.remove('modified');
            });
            
            // 隐藏组套产品变化提示
            document.getElementById('groupContentChangeAlert').classList.add('hidden');
            
            // 这里可以添加创建新组套产品的逻辑
            alert('已创建新组套产品！');
        });
    }
    
    // 取消组套产品变化按钮事件
    const cancelGroupChangeBtn = document.getElementById('cancelGroupChangeBtn');
    if (cancelGroupChangeBtn) {
        cancelGroupChangeBtn.addEventListener('click', function() {
            // 恢复所有字段的原始值
            groupProductQuantities.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            groupProductDiscounts.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            // 隐藏组套产品变化提示
            document.getElementById('groupContentChangeAlert').classList.add('hidden');
        });
    }
}

// 供应商功能
function initSuppliers() {
    // 供应商字段变化监听
    const supplierMfrs = document.querySelectorAll('.supplier-mfr');
    const supplierPrices = document.querySelectorAll('.supplier-price');
    
    function addSupplierChangeListener(elements) {
        elements.forEach(element => {
            element.addEventListener('input', function() {
                const originalValue = this.getAttribute('data-original');
                const currentValue = this.value;
                
                if (originalValue !== currentValue) {
                    this.classList.add('modified');
                    document.getElementById('supplierChangeAlert').classList.remove('hidden');
                } else {
                    this.classList.remove('modified');
                    
                    // 检查是否还有其他变化的字段
                    const allSupplierFields = [...supplierMfrs, ...supplierPrices];
                    const hasChanges = Array.from(allSupplierFields).some(f => 
                        f.getAttribute('data-original') !== f.value
                    );
                    
                    if (!hasChanges) {
                        document.getElementById('supplierChangeAlert').classList.add('hidden');
                    }
                }
            });
        });
    }
    
    addSupplierChangeListener(supplierMfrs);
    addSupplierChangeListener(supplierPrices);
    
    // 保存供应商变化按钮事件
    const saveSupplierChangesBtn = document.getElementById('saveSupplierChangesBtn');
    if (saveSupplierChangesBtn) {
        saveSupplierChangesBtn.addEventListener('click', function() {
            // 收集供应商数据
            const supplierItems = document.querySelectorAll('.supplier-item');
            const supplierData = [];
            
            supplierItems.forEach(item => {
                const supplierId = item.getAttribute('data-supplier-id');
                const mfr = item.querySelector('.supplier-mfr').value;
                const price = item.querySelector('.supplier-price').value;
                
                supplierData.push({
                    supplierId,
                    mfr,
                    price
                });
                
                // 更新原始值
                item.querySelector('.supplier-mfr').setAttribute('data-original', mfr);
                item.querySelector('.supplier-mfr').classList.remove('modified');
                item.querySelector('.supplier-price').setAttribute('data-original', price);
                item.querySelector('.supplier-price').classList.remove('modified');
            });
            
            // 隐藏供应商变化提示
            document.getElementById('supplierChangeAlert').classList.add('hidden');
            
            // 这里可以添加保存供应商变化的逻辑
            alert('已保存供应商变更！');
        });
    }
    
    // 取消供应商变化按钮事件
    const cancelSupplierChangesBtn = document.getElementById('cancelSupplierChangesBtn');
    if (cancelSupplierChangesBtn) {
        cancelSupplierChangesBtn.addEventListener('click', function() {
            // 恢复所有字段的原始值
            supplierMfrs.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            supplierPrices.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            // 隐藏供应商变化提示
            document.getElementById('supplierChangeAlert').classList.add('hidden');
        });
    }
}

// 客户功能
function initCustomers() {
    // 客户字段变化监听
    const customerSkus = document.querySelectorAll('.customer-sku');
    const customerPrices = document.querySelectorAll('.customer-price');
    
    function addCustomerChangeListener(elements) {
        elements.forEach(element => {
            element.addEventListener('input', function() {
                const originalValue = this.getAttribute('data-original');
                const currentValue = this.value;
                
                if (originalValue !== currentValue) {
                    this.classList.add('modified');
                    document.getElementById('customerChangeAlert').classList.remove('hidden');
                } else {
                    this.classList.remove('modified');
                    
                    // 检查是否还有其他变化的字段
                    const allCustomerFields = [...customerSkus, ...customerPrices];
                    const hasChanges = Array.from(allCustomerFields).some(f => 
                        f.getAttribute('data-original') !== f.value
                    );
                    
                    if (!hasChanges) {
                        document.getElementById('customerChangeAlert').classList.add('hidden');
                    }
                }
            });
        });
    }
    
    addCustomerChangeListener(customerSkus);
    addCustomerChangeListener(customerPrices);
    
    // 保存客户变化按钮事件
    const saveCustomerChangesBtn = document.getElementById('saveCustomerChangesBtn');
    if (saveCustomerChangesBtn) {
        saveCustomerChangesBtn.addEventListener('click', function() {
            // 收集客户数据
            const customerItems = document.querySelectorAll('.customer-item');
            const customerData = [];
            
            customerItems.forEach(item => {
                const customerId = item.getAttribute('data-customer-id');
                const sku = item.querySelector('.customer-sku').value;
                const price = item.querySelector('.customer-price').value;
                
                customerData.push({
                    customerId,
                    sku,
                    price
                });
                
                // 更新原始值
                item.querySelector('.customer-sku').setAttribute('data-original', sku);
                item.querySelector('.customer-sku').classList.remove('modified');
                item.querySelector('.customer-price').setAttribute('data-original', price);
                item.querySelector('.customer-price').classList.remove('modified');
            });
            
            // 隐藏客户变化提示
            document.getElementById('customerChangeAlert').classList.add('hidden');
            
            // 这里可以添加保存客户变化的逻辑
            alert('已保存客户变更！');
        });
    }
    
    // 取消客户变化按钮事件
    const cancelCustomerChangesBtn = document.getElementById('cancelCustomerChangesBtn');
    if (cancelCustomerChangesBtn) {
        cancelCustomerChangesBtn.addEventListener('click', function() {
            // 恢复所有字段的原始值
            customerSkus.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            customerPrices.forEach(field => {
                const originalValue = field.getAttribute('data-original');
                field.value = originalValue;
                field.classList.remove('modified');
            });
            
            // 隐藏客户变化提示
            document.getElementById('customerChangeAlert').classList.add('hidden');
        });
    }
}
