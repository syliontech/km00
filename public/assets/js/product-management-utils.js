/**
 * 产品管理工具函数
 * 处理产品管理页面的辅助功能
 */

/**
 * 删除产品及其关联数据
 * @param {string} productId 产品ID
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteProductWithRelations(productId) {
    try {
        if (!window.supabaseClient) {
            throw new Error('数据库连接未初始化');
        }
        
        console.log(`开始删除产品 ID: ${productId} 及其关联数据...`);
        
        // 1. 删除客户产品关联
        const { error: deleteCustomerProductsError } = await window.supabaseClient
            .from('customer_products')
            .delete()
            .eq('product_id', productId);
            
        if (deleteCustomerProductsError) {
            console.error(`删除客户产品关联失败:`, deleteCustomerProductsError);
        }
        
        // 2. 删除供应商产品关联
        const { error: deleteSupplierProductsError } = await window.supabaseClient
            .from('supplier_products')
            .delete()
            .eq('product_id', productId);
            
        if (deleteSupplierProductsError) {
            console.error(`删除供应商产品关联失败:`, deleteSupplierProductsError);
        }
        
        // 3. 删除组套产品关联
        const { error: deleteGroupProductsError } = await window.supabaseClient
            .from('group_products')
            .delete()
            .eq('product_id', productId);
            
        if (deleteGroupProductsError) {
            console.error(`删除组套产品关联失败:`, deleteGroupProductsError);
        }
        
        // 4. 删除产品文件
        const { error: deleteFilesError } = await window.supabaseClient
            .from('product_files')
            .delete()
            .eq('product_id', productId);
            
        if (deleteFilesError) {
            console.error(`删除产品文件失败:`, deleteFilesError);
        }
        
        // 5. 删除产品
        const { error: deleteProductError } = await window.supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (deleteProductError) {
            throw new Error(`删除产品失败: ${deleteProductError.message}`);
        }
        
        console.log(`产品 ID: ${productId} 及其关联数据已成功删除`);
        return true;
    } catch (error) {
        console.error(`删除产品 ID: ${productId} 及其关联数据失败:`, error);
        throw error;
    }
}

/**
 * 处理产品类型变化
 * 根据产品类型（单件/组套）更新相关UI和功能
 */
function handleProductTypeChange() {
    const productType = document.getElementById('productType');
    const productUnit = document.getElementById('productUnit');
    const groupProductSection = document.getElementById('groupProductSection');
    
    if (productType && productUnit && groupProductSection) {
        const isGroup = productType.value === 'group';
        
        // 更新单位
        productUnit.value = isGroup ? '套/set' : '件/pc';
        
        // 显示/隐藏组套产品管理区域
        if (isGroup) {
            groupProductSection.classList.remove('hidden');
        } else {
            groupProductSection.classList.add('hidden');
        }
    }
}

/**
 * 检查规格字段变化
 * 比较当前规格字段值与原始值，如有变化则显示提示
 */
function checkSpecFieldChanges() {
    const specFields = document.querySelectorAll('.spec-field');
    const specChangeAlert = document.getElementById('specChangeAlert');
    let hasChanged = false;
    
    specFields.forEach(field => {
        const originalValue = field.dataset.original || '';
        const currentValue = field.value || '';
        
        if (originalValue !== currentValue) {
            hasChanged = true;
        }
    });
    
    // 显示/隐藏规格变化提示
    if (hasChanged && specChangeAlert) {
        specChangeAlert.classList.remove('hidden');
    } else if (specChangeAlert) {
        specChangeAlert.classList.add('hidden');
    }
    
    return hasChanged;
}

/**
 * 添加自定义规格字段
 */
function addCustomSpecField() {
    const specFields = document.getElementById('specFields');
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'grid grid-cols-2 gap-4 mt-3 custom-spec-field';
    
    // 创建字段名称输入
    const nameField = document.createElement('div');
    nameField.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1">规格名称</label>
        <input type="text" class="w-full border rounded px-3 py-2 spec-field-name" placeholder="输入规格名称">
    `;
    
    // 创建字段值输入
    const valueField = document.createElement('div');
    valueField.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1">规格值</label>
        <div class="flex">
            <input type="text" class="w-full border rounded-l px-3 py-2 spec-field" data-original="" placeholder="输入规格值">
            <button type="button" class="bg-red-100 text-red-800 px-2 py-1 rounded-r delete-spec-field">删除</button>
        </div>
    `;
    
    // 添加到容器
    fieldContainer.appendChild(nameField);
    fieldContainer.appendChild(valueField);
    specFields.appendChild(fieldContainer);
    
    // 绑定删除按钮事件
    const deleteBtn = valueField.querySelector('.delete-spec-field');
    deleteBtn.addEventListener('click', () => {
        fieldContainer.remove();
        checkSpecFieldChanges();
    });
    
    // 绑定规格字段变化事件
    const specField = valueField.querySelector('.spec-field');
    specField.addEventListener('change', () => checkSpecFieldChanges());
}

/**
 * 保存为新产品
 * 当规格变化时，将当前产品保存为新产品
 */
function saveAsNewProduct() {
    // 隐藏规格变化提示
    const specChangeAlert = document.getElementById('specChangeAlert');
    if (specChangeAlert) {
        specChangeAlert.classList.add('hidden');
    }
    
    // 修改产品编码，添加复制标记
    const productCode = document.getElementById('product_code');
    if (productCode && !productCode.value.includes('-COPY')) {
        productCode.value = productCode.value + '-COPY';
    }
    
    // 设置为复制模式
    window.isCopyMode = true;
}

/**
 * 取消规格变化
 * 恢复原始规格值
 */
function cancelSpecChange() {
    const specFields = document.querySelectorAll('.spec-field');
    const specChangeAlert = document.getElementById('specChangeAlert');
    
    // 恢复原始值
    specFields.forEach(field => {
        const originalValue = field.dataset.original || '';
        field.value = originalValue;
    });
    
    // 隐藏规格变化提示
    if (specChangeAlert) {
        specChangeAlert.classList.add('hidden');
    }
}

/**
 * 添加组套产品行
 */
function addGroupProductRow() {
    const groupProductList = document.getElementById('groupProductList');
    if (!groupProductList) return;
    
    const row = document.createElement('tr');
    row.className = 'group-product-row';
    row.innerHTML = `
        <td class="py-2 px-2">
            <input type="text" class="border rounded px-2 py-1 w-full group-product-name" placeholder="产品名称">
        </td>
        <td class="py-2 px-2">
            <input type="number" step="0.01" class="border rounded px-2 py-1 w-full group-product-price" placeholder="价格">
        </td>
        <td class="py-2 px-2">
            <input type="number" class="border rounded px-2 py-1 w-full group-product-quantity" placeholder="数量" value="1" min="1">
        </td>
        <td class="py-2 px-2">
            <button type="button" class="text-red-500 hover:text-red-700 delete-group-product">删除</button>
        </td>
    `;
    
    groupProductList.appendChild(row);
    
    // 绑定删除按钮事件
    const deleteBtn = row.querySelector('.delete-group-product');
    deleteBtn.addEventListener('click', () => {
        row.remove();
    });
}

/**
 * 添加供应商产品行
 */
function addSupplierProductRow() {
    const supplierProductList = document.getElementById('supplierProductList');
    if (!supplierProductList) return;
    
    const row = document.createElement('tr');
    row.className = 'supplier-product-row';
    row.innerHTML = `
        <td class="py-2 px-2">
            <select class="border rounded px-2 py-1 w-full supplier-select">
                <option value="1">供应商A</option>
                <option value="2">供应商B</option>
            </select>
        </td>
        <td class="py-2 px-2">
            <input type="text" class="border rounded px-2 py-1 w-full supplier-product-name" placeholder="供应商产品名称">
        </td>
        <td class="py-2 px-2">
            <input type="text" class="border rounded px-2 py-1 w-full supplier-product-code" placeholder="供应商产品编码">
        </td>
        <td class="py-2 px-2">
            <input type="number" step="0.01" class="border rounded px-2 py-1 w-full supplier-price" placeholder="采购价格">
        </td>
        <td class="py-2 px-2">
            <textarea class="border rounded px-2 py-1 w-full supplier-desc" rows="1" placeholder="供应商产品描述"></textarea>
        </td>
        <td class="py-2 px-2">
            <button type="button" class="text-red-500 hover:text-red-700 delete-supplier-product">删除</button>
        </td>
    `;
    
    supplierProductList.appendChild(row);
    
    // 绑定删除按钮事件
    const deleteBtn = row.querySelector('.delete-supplier-product');
    deleteBtn.addEventListener('click', () => {
        row.remove();
    });
}

/**
 * 添加客户产品行
 */
function addCustomerProductRow() {
    const customerProductList = document.getElementById('customerProductList');
    if (!customerProductList) return;
    
    const row = document.createElement('tr');
    row.className = 'customer-product-row';
    row.innerHTML = `
        <td class="py-2 px-2">
            <select class="border rounded px-2 py-1 w-full customer-select">
                <option value="1">客户A</option>
                <option value="2">客户B</option>
            </select>
        </td>
        <td class="py-2 px-2">
            <input type="text" class="border rounded px-2 py-1 w-full customer-product-name" placeholder="客户产品名称">
        </td>
        <td class="py-2 px-2">
            <input type="text" class="border rounded px-2 py-1 w-full customer-product-code" placeholder="客户产品编码">
        </td>
        <td class="py-2 px-2">
            <input type="number" step="0.01" class="border rounded px-2 py-1 w-full customer-price" placeholder="销售价格">
        </td>
        <td class="py-2 px-2">
            <textarea class="border rounded px-2 py-1 w-full customer-desc" rows="1" placeholder="客户产品描述"></textarea>
        </td>
        <td class="py-2 px-2">
            <button type="button" class="text-red-500 hover:text-red-700 delete-customer-product">删除</button>
        </td>
    `;
    
    customerProductList.appendChild(row);
    
    // 绑定删除按钮事件
    const deleteBtn = row.querySelector('.delete-customer-product');
    deleteBtn.addEventListener('click', () => {
        row.remove();
    });
}

/**
 * 筛选供应商产品
 */
function filterSupplierProducts() {
    const supplierFilter = document.getElementById('supplierFilter');
    const supplierRows = document.querySelectorAll('.supplier-product-row');
    
    if (!supplierFilter || !supplierRows.length) return;
    
    const selectedSupplierId = supplierFilter.value;
    
    // 如果选择了"全部供应商"，显示所有行
    if (!selectedSupplierId) {
        supplierRows.forEach(row => {
            row.classList.remove('hidden');
        });
        return;
    }
    
    // 否则只显示匹配的供应商行
    supplierRows.forEach(row => {
        const supplierSelect = row.querySelector('.supplier-select');
        if (supplierSelect && supplierSelect.value === selectedSupplierId) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

/**
 * 筛选客户产品
 */
function filterCustomerProducts() {
    const customerFilter = document.getElementById('customerFilter');
    const customerRows = document.querySelectorAll('.customer-product-row');
    
    if (!customerFilter || !customerRows.length) return;
    
    const selectedCustomerId = customerFilter.value;
    
    // 如果选择了"全部客户"，显示所有行
    if (!selectedCustomerId) {
        customerRows.forEach(row => {
            row.classList.remove('hidden');
        });
        return;
    }
    
    // 否则只显示匹配的客户行
    customerRows.forEach(row => {
        const customerSelect = row.querySelector('.customer-select');
        if (customerSelect && customerSelect.value === selectedCustomerId) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

// 导出函数
window.ProductManagementUtils = {
    deleteProductWithRelations,
    handleProductTypeChange,
    checkSpecFieldChanges,
    addCustomSpecField,
    saveAsNewProduct,
    cancelSpecChange,
    addGroupProductRow,
    addSupplierProductRow,
    addCustomerProductRow,
    filterSupplierProducts,
    filterCustomerProducts
};
