// 产品管理Tab栏功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Tab切换功能
    initTabSystem();
    
    // 初始化规格字段变化监听
    initSpecFieldsListener();
    
    // 初始化按钮事件
    initButtonEvents();
    
    // 初始化产品数据
    initProductData();
});

// Tab切换功能
function initTabSystem() {
    const tabButtons = document.querySelectorAll('#productTabs button[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有tab的active状态
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                btn.classList.add('text-gray-500', 'border-transparent');
            });
            
            // 隐藏所有tab内容
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            // 激活当前tab
            button.classList.remove('text-gray-500', 'border-transparent');
            button.classList.add('active', 'text-blue-600', 'border-blue-600');
            
            // 显示对应的内容
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.remove('hidden');
                tabContent.classList.add('active');
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
                this.classList.add('text-red-500');
                // 显示规格变化提示
                document.getElementById('specChangeAlert').classList.remove('hidden');
            } else {
                this.classList.remove('text-red-500');
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
    document.getElementById('saveAsNewBtn').addEventListener('click', function() {
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
        document.getElementById('specChangeAlert').classList.add('hidden');
        
        // 启用添加供应商和添加客户按钮
        enableVendorClientButtons();
        
        // 提示用户
        alert('新产品已保存！');
    });
    
    // 取消按钮事件
    document.getElementById('cancelSpecChangeBtn').addEventListener('click', function() {
        // 恢复所有规格字段的原始值
        specFields.forEach(field => {
            field.value = field.getAttribute('data-original');
            field.classList.remove('text-red-500');
        });
        
        // 隐藏规格变化提示
        document.getElementById('specChangeAlert').classList.add('hidden');
    });
}

// 启用供应商和客户按钮
function enableVendorClientButtons() {
    const vendorBtn = document.getElementById('addVendorBtn');
    const clientBtn = document.getElementById('addClientBtn');
    
    // 移除禁用状态
    vendorBtn.removeAttribute('disabled');
    clientBtn.removeAttribute('disabled');
    
    // 更改按钮颜色为绿色
    vendorBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
    vendorBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    
    clientBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
    clientBtn.classList.add('bg-green-500', 'hover:bg-green-600');
}

// 初始化按钮事件
function initButtonEvents() {
    // 添加分类按钮
    document.getElementById('addSpecBtn').addEventListener('click', function() {
        const specFields = document.getElementById('specFields');
        const newField = document.createElement('div');
        newField.className = 'flex space-x-2';
        newField.innerHTML = `
            <input type="text" class="w-1/3 border rounded px-2 py-1 text-sm" value="新字段" readonly>
            <input type="text" class="w-2/3 border rounded px-2 py-1 text-sm spec-field" value="" data-original="">
        `;
        
        specFields.appendChild(newField);
        
        // 为新添加的字段添加事件监听
        const newSpecField = newField.querySelector('.spec-field');
        newSpecField.addEventListener('input', function() {
            const originalValue = this.getAttribute('data-original');
            const currentValue = this.value;
            
            if (originalValue !== currentValue) {
                this.classList.add('text-red-500');
                document.getElementById('specChangeAlert').classList.remove('hidden');
            } else {
                this.classList.remove('text-red-500');
                const allSpecFields = document.querySelectorAll('.spec-field');
                const hasChanges = Array.from(allSpecFields).some(f => 
                    f.getAttribute('data-original') !== f.value
                );
                
                if (!hasChanges) {
                    document.getElementById('specChangeAlert').classList.add('hidden');
                }
            }
        });
    });
    
    // 添加供应商按钮
    document.getElementById('addVendorBtn').addEventListener('click', function() {
        const vendorTableBody = document.getElementById('vendorTableBody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="px-2 py-1">
                <select class="border rounded w-full px-1 py-1 text-xs">
                    <option value="">选择供应商</option>
                    <option value="supplier1">供应商A</option>
                    <option value="supplier2">供应商B</option>
                </select>
            </td>
            <td class="px-2 py-1">
                <input type="text" class="border rounded w-full px-1 py-1 text-xs" placeholder="制造商料号">
            </td>
            <td class="px-2 py-1">
                <input type="text" class="border rounded w-full px-1 py-1 text-xs" placeholder="采购价格">
            </td>
            <td class="px-2 py-1">
                <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        vendorTableBody.appendChild(newRow);
        
        // 添加删除按钮事件
        const deleteBtn = newRow.querySelector('button');
        deleteBtn.addEventListener('click', function() {
            newRow.remove();
        });
    });
    
    // 添加客户按钮
    document.getElementById('addClientBtn').addEventListener('click', function() {
        const clientTableBody = document.getElementById('clientTableBody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="px-2 py-1">
                <select class="border rounded w-full px-1 py-1 text-xs">
                    <option value="">选择客户</option>
                    <option value="client1">客户A</option>
                    <option value="client2">客户B</option>
                </select>
            </td>
            <td class="px-2 py-1">
                <input type="text" class="border rounded w-full px-1 py-1 text-xs" placeholder="客户SKU">
            </td>
            <td class="px-2 py-1">
                <input type="text" class="border rounded w-full px-1 py-1 text-xs" placeholder="销售价格">
            </td>
            <td class="px-2 py-1">
                <button class="text-xs bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        clientTableBody.appendChild(newRow);
        
        // 添加删除按钮事件
        const deleteBtn = newRow.querySelector('button');
        deleteBtn.addEventListener('click', function() {
            newRow.remove();
        });
    });
    
    // 产品类型选择事件
    document.getElementById('productTypeSelect').addEventListener('change', function() {
        const singleProductNotice = document.getElementById('singleProductNotice');
        const groupProductConfig = document.getElementById('groupProductConfig');
        const addGroupProductBtn = document.getElementById('addGroupProductBtn');
        
        if (this.value === 'group') {
            singleProductNotice.classList.add('hidden');
            groupProductConfig.classList.remove('hidden');
            addGroupProductBtn.removeAttribute('disabled');
        } else {
            singleProductNotice.classList.remove('hidden');
            groupProductConfig.classList.add('hidden');
            addGroupProductBtn.setAttribute('disabled', 'disabled');
        }
    });
}
