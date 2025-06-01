// 产品数据处理模块
document.addEventListener('DOMContentLoaded', function() {
    // 初始化产品数据
    initProductData();
    
    // 绑定保存新产品事件
    bindSaveNewProductEvent();
    
    // 绑定供应商和客户添加事件
    bindVendorClientEvents();
});

// 产品数据存储
let productsData = [];

// 初始化产品数据
function initProductData() {
    // 初始示例数据
    const sampleProducts = [
        {
            id: 1,
            code: 'P0001',
            category: '刀片类',
            description: '灰色 61*19*0.6mm 1+5片',
            specs: {
                '颜色': '灰色',
                '外形尺寸': '61*19*0.6mm',
                '刀片数量': '1+5片',
                '包装方式': '彩盒'
            },
            vendors: [],
            clients: []
        }
    ];
    
    // 将示例数据添加到产品列表
    productsData = sampleProducts;
    
    // 渲染产品表格
    renderProductTable();
    
    // 默认选中第一个产品
    if (productsData.length > 0) {
        setTimeout(() => {
            const firstRow = document.querySelector('#productTableBody tr');
            if (firstRow) {
                firstRow.click();
            }
        }, 100);
    }
}

// 渲染产品表格
function renderProductTable() {
    const productTableBody = document.getElementById('productTableBody');
    if (!productTableBody) return;
    
    productTableBody.innerHTML = '';
    
    productsData.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.setAttribute('data-product-id', product.id);
        
        row.innerHTML = `
            <td class="px-3 py-2">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600 product-checkbox">
            </td>
            <td class="px-3 py-2 text-sm">${product.code}</td>
            <td class="px-3 py-2 text-sm">${product.category}</td>
            <td class="px-3 py-2 text-sm">${product.description}</td>
            <td class="px-3 py-2 text-sm">${product.vendors.length > 0 ? product.vendors.length + '个供应商' : '无'}</td>
            <td class="px-3 py-2 text-sm">${product.clients.length > 0 ? product.clients.length + '个客户' : '无'}</td>
            <td class="px-3 py-2 text-sm">
                <button class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-1 view-btn">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-1 edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded delete-btn">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // 添加行点击事件
        row.addEventListener('click', function(e) {
            // 如果点击的是按钮或复选框，不触发行选中
            if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
                return;
            }
            
            // 移除所有行的选中状态
            document.querySelectorAll('#productTableBody tr').forEach(r => {
                r.classList.remove('bg-blue-50');
            });
            
            // 添加当前行的选中状态
            this.classList.add('bg-blue-50');
            
            // 显示产品详情
            const productId = parseInt(this.getAttribute('data-product-id'));
            displayProductDetails(productId);
        });
        
        // 添加查看按钮事件
        const viewBtn = row.querySelector('.view-btn');
        viewBtn.addEventListener('click', function() {
            const productId = parseInt(row.getAttribute('data-product-id'));
            displayProductDetails(productId);
            
            // 选中当前行
            document.querySelectorAll('#productTableBody tr').forEach(r => {
                r.classList.remove('bg-blue-50');
            });
            row.classList.add('bg-blue-50');
        });
        
        // 添加编辑按钮事件
        const editBtn = row.querySelector('.edit-btn');
        editBtn.addEventListener('click', function() {
            const productId = parseInt(row.getAttribute('data-product-id'));
            // 这里可以添加编辑产品的逻辑
            alert('编辑产品: ' + productId);
        });
        
        // 添加删除按钮事件
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            const productId = parseInt(row.getAttribute('data-product-id'));
            if (confirm('确定要删除此产品吗？')) {
                // 从数据中删除产品
                productsData = productsData.filter(p => p.id !== productId);
                // 重新渲染表格
                renderProductTable();
            }
        });
        
        productTableBody.appendChild(row);
    });
}

// 显示产品详情
function displayProductDetails(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // 填充规格字段
    const specFields = document.getElementById('specFields');
    if (specFields) {
        specFields.innerHTML = '';
        
        Object.entries(product.specs).forEach(([key, value]) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'flex space-x-2';
            fieldDiv.innerHTML = `
                <input type="text" class="w-1/3 border rounded px-2 py-1 text-sm" value="${key}" readonly>
                <input type="text" class="w-2/3 border rounded px-2 py-1 text-sm spec-field" value="${value}" data-original="${value}">
            `;
            specFields.appendChild(fieldDiv);
        });
        
        // 重新绑定规格字段变化事件
        bindSpecFieldsChangeEvent();
    }
    
    // 填充供应商信息
    const vendorTableBody = document.getElementById('vendorTableBody');
    if (vendorTableBody) {
        vendorTableBody.innerHTML = '';
        
        if (product.vendors.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="px-2 py-1 text-center text-gray-500 text-xs">无供应商信息</td>
            `;
            vendorTableBody.appendChild(emptyRow);
        } else {
            product.vendors.forEach(vendor => {
                const vendorRow = document.createElement('tr');
                vendorRow.innerHTML = `
                    <td class="px-2 py-1 text-xs">${vendor.name}</td>
                    <td class="px-2 py-1 text-xs">${vendor.partNumber}</td>
                    <td class="px-2 py-1 text-xs">${vendor.price}</td>
                    <td class="px-2 py-1 text-xs">
                        <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded delete-vendor-btn">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                vendorTableBody.appendChild(vendorRow);
                
                // 添加删除按钮事件
                const deleteBtn = vendorRow.querySelector('.delete-vendor-btn');
                deleteBtn.addEventListener('click', function() {
                    if (confirm('确定要删除此供应商信息吗？')) {
                        // 从产品数据中删除供应商
                        const vendorIndex = product.vendors.indexOf(vendor);
                        if (vendorIndex !== -1) {
                            product.vendors.splice(vendorIndex, 1);
                            // 更新显示
                            displayProductDetails(productId);
                            // 更新产品表格中的供应商数量
                            renderProductTable();
                        }
                    }
                });
            });
        }
    }
    
    // 填充客户信息
    const clientTableBody = document.getElementById('clientTableBody');
    if (clientTableBody) {
        clientTableBody.innerHTML = '';
        
        if (product.clients.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="px-2 py-1 text-center text-gray-500 text-xs">无客户信息</td>
            `;
            clientTableBody.appendChild(emptyRow);
        } else {
            product.clients.forEach(client => {
                const clientRow = document.createElement('tr');
                clientRow.innerHTML = `
                    <td class="px-2 py-1 text-xs">${client.name}</td>
                    <td class="px-2 py-1 text-xs">${client.sku}</td>
                    <td class="px-2 py-1 text-xs">${client.price}</td>
                    <td class="px-2 py-1 text-xs">
                        <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded delete-client-btn">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                clientTableBody.appendChild(clientRow);
                
                // 添加删除按钮事件
                const deleteBtn = clientRow.querySelector('.delete-client-btn');
                deleteBtn.addEventListener('click', function() {
                    if (confirm('确定要删除此客户信息吗？')) {
                        // 从产品数据中删除客户
                        const clientIndex = product.clients.indexOf(client);
                        if (clientIndex !== -1) {
                            product.clients.splice(clientIndex, 1);
                            // 更新显示
                            displayProductDetails(productId);
                            // 更新产品表格中的客户数量
                            renderProductTable();
                        }
                    }
                });
            });
        }
    }
    
    // 切换到规格Tab
    const specTab = document.getElementById('spec-tab');
    if (specTab) {
        specTab.click();
    }
}

// 绑定规格字段变化事件
function bindSpecFieldsChangeEvent() {
    const specFields = document.querySelectorAll('.spec-field');
    
    specFields.forEach(field => {
        field.addEventListener('input', function() {
            const originalValue = this.getAttribute('data-original');
            const currentValue = this.value;
            
            // 如果值发生变化，字体变红色
            if (originalValue !== currentValue) {
                this.classList.add('text-red-500');
                // 显示规格变化提示
                const specChangeAlert = document.getElementById('specChangeAlert');
                if (specChangeAlert) {
                    specChangeAlert.classList.remove('hidden');
                }
            } else {
                this.classList.remove('text-red-500');
                // 检查是否还有其他变化的字段
                const hasChanges = Array.from(specFields).some(f => 
                    f.getAttribute('data-original') !== f.value
                );
                
                if (!hasChanges) {
                    const specChangeAlert = document.getElementById('specChangeAlert');
                    if (specChangeAlert) {
                        specChangeAlert.classList.add('hidden');
                    }
                }
            }
        });
    });
}

// 绑定保存新产品事件
function bindSaveNewProductEvent() {
    const saveAsNewBtn = document.getElementById('saveAsNewBtn');
    if (!saveAsNewBtn) return;
    
    saveAsNewBtn.addEventListener('click', function() {
        // 收集规格字段数据
        const specData = {};
        const specFields = document.querySelectorAll('.spec-field');
        specFields.forEach(field => {
            const fieldName = field.previousElementSibling.value;
            specData[fieldName] = field.value;
            
            // 更新原始值
            field.setAttribute('data-original', field.value);
            field.classList.remove('text-red-500');
        });
        
        // 生成随机产品编码
        const productCode = 'P' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // 创建新产品并添加到左侧产品列表
        addProductToTable({
            id: Date.now(), // 使用时间戳作为临时ID
            code: productCode,
            category: '刀片类',
            description: specData['颜色'] + ' ' + specData['外形尺寸'] + ' ' + (specData['刀片数量'] || ''),
            specs: specData,
            vendors: [],
            clients: []
        });
        
        // 隐藏规格变化提示
        const specChangeAlert = document.getElementById('specChangeAlert');
        if (specChangeAlert) {
            specChangeAlert.classList.add('hidden');
        }
        
        // 启用添加供应商和添加客户按钮
        enableVendorClientButtons();
        
        // 提示用户
        alert('新产品已保存！');
    });
    
    // 取消按钮事件
    const cancelSpecChangeBtn = document.getElementById('cancelSpecChangeBtn');
    if (cancelSpecChangeBtn) {
        cancelSpecChangeBtn.addEventListener('click', function() {
            // 恢复所有规格字段的原始值
            const specFields = document.querySelectorAll('.spec-field');
            specFields.forEach(field => {
                field.value = field.getAttribute('data-original');
                field.classList.remove('text-red-500');
            });
            
            // 隐藏规格变化提示
            const specChangeAlert = document.getElementById('specChangeAlert');
            if (specChangeAlert) {
                specChangeAlert.classList.add('hidden');
            }
        });
    }
}

// 启用供应商和客户按钮
function enableVendorClientButtons() {
    const vendorBtn = document.getElementById('addVendorBtn');
    const clientBtn = document.getElementById('addClientBtn');
    
    if (vendorBtn) {
        // 移除禁用状态
        vendorBtn.removeAttribute('disabled');
        
        // 更改按钮颜色为绿色
        vendorBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        vendorBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
    
    if (clientBtn) {
        // 移除禁用状态
        clientBtn.removeAttribute('disabled');
        
        // 更改按钮颜色为绿色
        clientBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        clientBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}

// 绑定供应商和客户添加事件
function bindVendorClientEvents() {
    // 添加供应商按钮
    const addVendorBtn = document.getElementById('addVendorBtn');
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', function() {
            // 获取当前选中的产品
            const selectedRow = document.querySelector('#productTableBody tr.bg-blue-50');
            if (!selectedRow) {
                alert('请先选择一个产品');
                return;
            }
            
            const productId = parseInt(selectedRow.getAttribute('data-product-id'));
            const product = productsData.find(p => p.id === productId);
            if (!product) return;
            
            // 添加供应商信息
            product.vendors.push({
                name: '供应商' + (product.vendors.length + 1),
                partNumber: 'MFR-' + Math.floor(Math.random() * 1000),
                price: (Math.random() * 100).toFixed(2)
            });
            
            // 更新显示
            displayProductDetails(productId);
            // 更新产品表格中的供应商数量
            renderProductTable();
        });
    }
    
    // 添加客户按钮
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            // 获取当前选中的产品
            const selectedRow = document.querySelector('#productTableBody tr.bg-blue-50');
            if (!selectedRow) {
                alert('请先选择一个产品');
                return;
            }
            
            const productId = parseInt(selectedRow.getAttribute('data-product-id'));
            const product = productsData.find(p => p.id === productId);
            if (!product) return;
            
            // 添加客户信息
            product.clients.push({
                name: '客户' + (product.clients.length + 1),
                sku: 'SKU-' + Math.floor(Math.random() * 1000),
                price: (Math.random() * 200).toFixed(2)
            });
            
            // 更新显示
            displayProductDetails(productId);
            // 更新产品表格中的客户数量
            renderProductTable();
        });
    }
}

// 添加产品到表格
function addProductToTable(product) {
    // 添加到产品数据
    productsData.push(product);
    
    // 重新渲染产品表格
    renderProductTable();
    
    // 选中并显示新添加的产品
    setTimeout(() => {
        const newRow = document.querySelector(`#productTableBody tr[data-product-id="${product.id}"]`);
        if (newRow) {
            newRow.click();
        }
    }, 100);
}
