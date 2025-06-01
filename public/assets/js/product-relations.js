// 产品关系管理模块 - 处理组套、供应商和客户关系
document.addEventListener('DOMContentLoaded', function() {
    // 初始化组套功能
    initGroupProducts();
    
    // 初始化供应商功能
    initSuppliers();
    
    // 初始化客户功能
    initCustomers();
});

// 组套产品功能
function initGroupProducts() {
    // 组套产品类型切换
    const productTypeSelect = document.getElementById('productTypeSelect');
    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', function() {
            const singleProductNotice = document.getElementById('singleProductNotice');
            const groupProductContent = document.getElementById('groupProductContent');
            const addGroupProductBtn = document.getElementById('addGroupProductBtn');
            
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
    
    // 组套产品选择和添加
    const groupProductSelect = document.getElementById('groupProductSelect');
    const confirmAddGroupProductBtn = document.getElementById('confirmAddGroupProductBtn');
    
    if (confirmAddGroupProductBtn && groupProductSelect) {
        confirmAddGroupProductBtn.addEventListener('click', function() {
            const productCode = groupProductSelect.value;
            
            if (!productCode) {
                alert('请选择要添加的产品');
                return;
            }
            
            // 添加组套产品
            addGroupProduct(productCode);
        });
    }
    
    // 绑定编辑按钮事件
    const groupProductTableBody = document.getElementById('groupProductTableBody');
    if (groupProductTableBody) {
        groupProductTableBody.addEventListener('click', function(e) {
            // 删除按钮
            if (e.target.closest('.delete-group-btn')) {
                const row = e.target.closest('tr');
                if (confirm('确定要删除该组套产品吗？')) {
                    row.remove();
                    showGroupContentChangeAlert();
                }
            }
            
            // 编辑按钮
            if (e.target.closest('.edit-group-btn')) {
                const row = e.target.closest('tr');
                const quantityInput = row.querySelector('.group-product-quantity');
                const discountInput = row.querySelector('.group-product-discount');
                
                if (quantityInput && discountInput) {
                    // 将输入框设置为可编辑状态
                    quantityInput.focus();
                    quantityInput.select();
                }
            }
        });
        
        // 监听数量和折扣变化
        groupProductTableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('group-product-quantity') || 
                e.target.classList.contains('group-product-discount')) {
                
                const original = e.target.getAttribute('data-original');
                const current = e.target.value;
                
                if (original !== current) {
                    showGroupContentChangeAlert();
                }
            }
        });
    }
    
    // 组套产品变化提示处理
    const createNewGroupProductBtn = document.getElementById('createNewGroupProductBtn');
    const cancelGroupChangeBtn = document.getElementById('cancelGroupChangeBtn');
    
    if (createNewGroupProductBtn) {
        createNewGroupProductBtn.addEventListener('click', function() {
            alert('已创建新的组套产品');
            hideGroupContentChangeAlert();
        });
    }
    
    if (cancelGroupChangeBtn) {
        cancelGroupChangeBtn.addEventListener('click', function() {
            hideGroupContentChangeAlert();
        });
    }
}

// 显示组套产品变化提示
function showGroupContentChangeAlert() {
    const alert = document.getElementById('groupContentChangeAlert');
    if (alert) {
        alert.classList.remove('hidden');
    }
}

// 隐藏组套产品变化提示
function hideGroupContentChangeAlert() {
    const alert = document.getElementById('groupContentChangeAlert');
    if (alert) {
        alert.classList.add('hidden');
    }
}

// 添加组套产品
function addGroupProduct(productCode) {
    const groupProductTableBody = document.getElementById('groupProductTableBody');
    if (!groupProductTableBody) return;
    
    // 检查是否已存在
    const existingRow = groupProductTableBody.querySelector(`tr[data-product-id="${productCode}"]`);
    if (existingRow) {
        alert('该产品已添加到组套中');
        return;
    }
    
    // 模拟产品数据
    let productData = {};
    
    switch(productCode) {
        case 'T001-A':
            productData = {
                name: '主刀架 (带刀片)',
                mfrNr: 'SH-FK001',
                price: '3.50'
            };
            break;
        case 'T001-B':
            productData = {
                name: '备用刀片 5片装',
                mfrNr: 'SZ-BK005',
                price: '1.20'
            };
            break;
        case 'T002-A':
            productData = {
                name: '工具箱 (小型)',
                mfrNr: 'HZ-GJX001',
                price: '12.80'
            };
            break;
        default:
            productData = {
                name: '未知产品',
                mfrNr: 'UNKNOWN-' + Math.floor(Math.random() * 1000),
                price: (Math.random() * 10 + 1).toFixed(2)
            };
    }
    
    // 创建新行
    const row = document.createElement('tr');
    row.className = 'group-product-item';
    row.setAttribute('data-product-id', productCode);
    row.setAttribute('data-original-data', `${productCode},1,0`);
    
    row.innerHTML = `
        <td class="px-2 py-1 text-xs">${productData.name}</td>
        <td class="px-2 py-1 text-xs">${productData.mfrNr}</td>
        <td class="px-2 py-1 text-xs">¥${productData.price}</td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="w-12 border rounded px-1 py-0.5 text-xs group-product-quantity" value="1" min="1" data-original="1">
        </td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="w-12 border rounded px-1 py-0.5 text-xs group-product-discount" value="0" min="0" max="100" data-original="0">%
        </td>
        <td class="px-2 py-1 text-xs">
            <button class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-1 py-0.5 rounded mr-1 edit-group-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded delete-group-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    groupProductTableBody.appendChild(row);
    
    // 显示变化提示
    showGroupContentChangeAlert();
    
    // 清空选择
    const groupProductSelect = document.getElementById('groupProductSelect');
    if (groupProductSelect) groupProductSelect.value = '';
}

// 供应商功能
function initSuppliers() {
    // 供应商选择和添加
    const supplierSelect = document.getElementById('supplierSelect');
    const confirmAddSupplierBtn = document.getElementById('confirmAddSupplierBtn');
    
    if (confirmAddSupplierBtn && supplierSelect) {
        confirmAddSupplierBtn.addEventListener('click', function() {
            const supplierId = supplierSelect.value;
            
            if (!supplierId) {
                alert('请选择要添加的供应商');
                return;
            }
            
            // 添加供应商
            addSupplier(supplierId);
        });
    }
    
    // 绑定编辑按钮事件
    const supplierTableBody = document.getElementById('supplierTableBody');
    if (supplierTableBody) {
        supplierTableBody.addEventListener('click', function(e) {
            // 删除按钮
            if (e.target.closest('.delete-supplier-btn')) {
                const row = e.target.closest('tr');
                if (confirm('确定要删除该供应商吗？')) {
                    row.remove();
                    showSupplierChangeAlert();
                }
            }
            
            // 编辑按钮
            if (e.target.closest('.edit-supplier-btn')) {
                const row = e.target.closest('tr');
                const mfrInput = row.querySelector('.supplier-mfr');
                const priceInput = row.querySelector('.supplier-price');
                const historyPriceInput = row.querySelector('.supplier-history-price');
                
                if (mfrInput && priceInput && historyPriceInput) {
                    // 将输入框设置为可编辑状态
                    mfrInput.focus();
                    mfrInput.select();
                }
            }
        });
        
        // 监听供应商信息变化
        supplierTableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('supplier-mfr') || 
                e.target.classList.contains('supplier-price') || 
                e.target.classList.contains('supplier-history-price') || 
                e.target.classList.contains('supplier-type')) {
                
                const original = e.target.getAttribute('data-original');
                const current = e.target.value;
                
                if (original !== current) {
                    showSupplierChangeAlert();
                }
            }
        });
    }
    
    // 供应商变化提示处理
    const dismissSupplierAlertBtn = document.getElementById('dismissSupplierAlertBtn');
    
    if (dismissSupplierAlertBtn) {
        dismissSupplierAlertBtn.addEventListener('click', function() {
            hideSupplierChangeAlert();
        });
    }
}

// 显示供应商变化提示
function showSupplierChangeAlert() {
    const alert = document.getElementById('supplierChangeAlert');
    if (alert) {
        alert.classList.remove('hidden');
    }
}

// 隐藏供应商变化提示
function hideSupplierChangeAlert() {
    const alert = document.getElementById('supplierChangeAlert');
    if (alert) {
        alert.classList.add('hidden');
    }
}

// 添加供应商
function addSupplier(supplierId) {
    const supplierTableBody = document.getElementById('supplierTableBody');
    if (!supplierTableBody) return;
    
    // 检查是否已存在
    const existingRow = supplierTableBody.querySelector(`tr[data-supplier-id="${supplierId}"]`);
    if (existingRow) {
        alert('该供应商已添加');
        return;
    }
    
    // 模拟供应商数据
    let supplierData = {};
    
    switch(supplierId) {
        case '1':
            supplierData = {
                name: '上海工具厂',
                mfrNr: 'SH-FK001',
                price: '3.50',
                historyPrice: '3.60',
                type: 'primary'
            };
            break;
        case '2':
            supplierData = {
                name: '深圳电子有限公司',
                mfrNr: 'SZ-BK005',
                price: '3.80',
                historyPrice: '3.95',
                type: 'secondary'
            };
            break;
        case '3':
            supplierData = {
                name: '杭州五金制造厂',
                mfrNr: 'HZ-GJX001',
                price: '3.65',
                historyPrice: '3.75',
                type: 'secondary'
            };
            break;
        default:
            supplierData = {
                name: '未知供应商',
                mfrNr: 'UNKNOWN-' + Math.floor(Math.random() * 1000),
                price: (Math.random() * 5 + 1).toFixed(2),
                historyPrice: (Math.random() * 5 + 2).toFixed(2),
                type: 'secondary'
            };
    }
    
    // 创建新行
    const row = document.createElement('tr');
    row.className = 'supplier-item';
    row.setAttribute('data-supplier-id', supplierId);
    row.setAttribute('data-original-data', `${supplierData.mfrNr},${supplierData.price},${supplierData.historyPrice},${supplierData.type === 'primary'}`);
    
    row.innerHTML = `
        <td class="px-2 py-1 text-xs">${supplierData.name}</td>
        <td class="px-2 py-1 text-xs">
            <input type="text" class="border rounded px-1 py-0.5 text-xs w-24 supplier-mfr" value="${supplierData.mfrNr}" data-original="${supplierData.mfrNr}">
        </td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="border rounded px-1 py-0.5 text-xs w-16 supplier-price" value="${supplierData.price}" step="0.01" data-original="${supplierData.price}">元
        </td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="border rounded px-1 py-0.5 text-xs w-16 supplier-history-price" value="${supplierData.historyPrice}" step="0.01" data-original="${supplierData.historyPrice}">元
        </td>
        <td class="px-2 py-1 text-xs">
            <select class="text-xs bg-gray-100 px-1 rounded supplier-type">
                <option value="primary" ${supplierData.type === 'primary' ? 'selected' : ''}>主要供应商</option>
                <option value="secondary" ${supplierData.type === 'secondary' ? 'selected' : ''}>备选供应商</option>
            </select>
        </td>
        <td class="px-2 py-1 text-xs">
            <button class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-1 py-0.5 rounded mr-1 edit-supplier-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded delete-supplier-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    supplierTableBody.appendChild(row);
    
    // 显示变化提示
    showSupplierChangeAlert();
    
    // 清空选择
    const supplierSelect = document.getElementById('supplierSelect');
    if (supplierSelect) supplierSelect.value = '';
}

// 客户功能
function initCustomers() {
    // 客户选择和添加
    const customerSelect = document.getElementById('customerSelect');
    const confirmAddCustomerBtn = document.getElementById('confirmAddCustomerBtn');
    
    if (confirmAddCustomerBtn && customerSelect) {
        confirmAddCustomerBtn.addEventListener('click', function() {
            const customerId = customerSelect.value;
            
            if (!customerId) {
                alert('请选择要添加的客户');
                return;
            }
            
            // 添加客户
            addCustomer(customerId);
        });
    }
    
    // 绑定编辑按钮事件
    const customerTableBody = document.getElementById('customerTableBody');
    if (customerTableBody) {
        customerTableBody.addEventListener('click', function(e) {
            // 删除按钮
            if (e.target.closest('.delete-customer-btn')) {
                const row = e.target.closest('tr');
                if (confirm('确定要删除该客户吗？')) {
                    row.remove();
                    showCustomerChangeAlert();
                }
            }
            
            // 编辑按钮
            if (e.target.closest('.edit-customer-btn')) {
                const row = e.target.closest('tr');
                const skuInput = row.querySelector('.customer-sku');
                const priceInput = row.querySelector('.customer-price');
                const historyPriceInput = row.querySelector('.customer-history-price');
                
                if (skuInput && priceInput && historyPriceInput) {
                    // 将输入框设置为可编辑状态
                    skuInput.focus();
                    skuInput.select();
                }
            }
        });
        
        // 监听客户信息变化
        customerTableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('customer-sku') || 
                e.target.classList.contains('customer-price') || 
                e.target.classList.contains('customer-history-price') || 
                e.target.classList.contains('customer-type')) {
                
                const original = e.target.getAttribute('data-original');
                const current = e.target.value;
                
                if (original !== current) {
                    showCustomerChangeAlert();
                }
            }
        });
    }
    
    // 客户变化提示处理
    const dismissCustomerAlertBtn = document.getElementById('dismissCustomerAlertBtn');
    
    if (dismissCustomerAlertBtn) {
        dismissCustomerAlertBtn.addEventListener('click', function() {
            hideCustomerChangeAlert();
        });
    }
}

// 显示客户变化提示
function showCustomerChangeAlert() {
    const alert = document.getElementById('customerChangeAlert');
    if (alert) {
        alert.classList.remove('hidden');
    }
}

// 隐藏客户变化提示
function hideCustomerChangeAlert() {
    const alert = document.getElementById('customerChangeAlert');
    if (alert) {
        alert.classList.add('hidden');
    }
}

// 添加客户
function addCustomer(customerId) {
    const customerTableBody = document.getElementById('customerTableBody');
    if (!customerTableBody) return;
    
    // 检查是否已存在
    const existingRow = customerTableBody.querySelector(`tr[data-customer-id="${customerId}"]`);
    if (existingRow) {
        alert('该客户已添加');
        return;
    }
    
    // 模拟客户数据
    let customerData = {};
    
    switch(customerId) {
        case '1':
            customerData = {
                name: '北京工具贸易有限公司',
                sku: 'ABC-001',
                price: '4.50',
                historyPrice: '4.65',
                type: 'primary'
            };
            break;
        case '2':
            customerData = {
                name: '上海工具贸易有限公司',
                sku: 'XYZ-002',
                price: '4.80',
                historyPrice: '4.95',
                type: 'secondary'
            };
            break;
        case '3':
            customerData = {
                name: '广州五金贸易有限公司',
                sku: 'GZ-003',
                price: '4.65',
                historyPrice: '4.85',
                type: 'secondary'
            };
            break;
        default:
            customerData = {
                name: '未知客户',
                sku: 'UNKNOWN-' + Math.floor(Math.random() * 1000),
                price: (Math.random() * 5 + 2).toFixed(2),
                historyPrice: (Math.random() * 5 + 3).toFixed(2),
                type: 'secondary'
            };
    }
    
    // 创建新行
    const row = document.createElement('tr');
    row.className = 'customer-item';
    row.setAttribute('data-customer-id', customerId);
    row.setAttribute('data-original-data', `${customerData.sku},${customerData.price},${customerData.historyPrice},${customerData.type === 'primary'}`);
    
    row.innerHTML = `
        <td class="px-2 py-1 text-xs">${customerData.name}</td>
        <td class="px-2 py-1 text-xs">
            <input type="text" class="border rounded px-1 py-0.5 text-xs w-24 customer-sku" value="${customerData.sku}" data-original="${customerData.sku}">
        </td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="border rounded px-1 py-0.5 text-xs w-16 customer-price" value="${customerData.price}" step="0.01" data-original="${customerData.price}">元
        </td>
        <td class="px-2 py-1 text-xs">
            <input type="number" class="border rounded px-1 py-0.5 text-xs w-16 customer-history-price" value="${customerData.historyPrice}" step="0.01" data-original="${customerData.historyPrice}">元
        </td>
        <td class="px-2 py-1 text-xs">
            <select class="text-xs bg-gray-100 px-1 rounded customer-type">
                <option value="primary" ${customerData.type === 'primary' ? 'selected' : ''}>主要客户</option>
                <option value="secondary" ${customerData.type === 'secondary' ? 'selected' : ''}>潜在客户</option>
            </select>
        </td>
        <td class="px-2 py-1 text-xs">
            <button class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-1 py-0.5 rounded mr-1 edit-customer-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded delete-customer-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    customerTableBody.appendChild(row);
    
    // 显示变化提示
    showCustomerChangeAlert();
    
    // 清空选择
    const customerSelect = document.getElementById('customerSelect');
    if (customerSelect) customerSelect.value = '';
}
