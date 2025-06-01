// 右区 Tab 切换功能
document.addEventListener('DOMContentLoaded', function() {
    // Tab切换功能
    const tabButtons = document.querySelectorAll('[data-tab]');
    if (tabButtons.length > 0) {
        tabButtons.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的激活状态
                tabButtons.forEach(t => {
                    t.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600', '-mb-px');
                    t.classList.add('text-gray-500');
                });
                
                // 激活当前标签
                this.classList.remove('text-gray-500');
                this.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', '-mb-px');
                
                // 隐藏所有内容
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                
                // 显示当前标签对应的内容
                const tabName = this.getAttribute('data-tab');
                const tabContent = document.getElementById(tabName + 'TabContent');
                if (tabContent) {
                    tabContent.classList.remove('hidden');
                }
            });
        });
    }

    // 规格分类添加功能
    const addSpecBtn = document.getElementById('addSpecBtn');
    if (addSpecBtn) {
        addSpecBtn.addEventListener('click', function() {
            const tbody = document.querySelector('#specsTabContent table tbody');
            if (tbody) {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td class="px-2 py-1 border"><input type="text" class="w-full text-xs p-1 border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="输入属性名称"></td>
                    <td class="px-2 py-1 border"><input type="text" class="w-full text-xs p-1 border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="输入属性值"></td>
                `;
                tbody.appendChild(newRow);
                
                // 激活删除按钮
                const deleteSpecBtn = document.getElementById('deleteSpecBtn');
                if (deleteSpecBtn) {
                    deleteSpecBtn.removeAttribute('disabled');
                    deleteSpecBtn.classList.remove('bg-gray-300', 'text-gray-700');
                    deleteSpecBtn.classList.add('bg-red-500', 'text-white');
                }
                
                // 绑定输入事件，当用户输入时文字变红
                const inputs = newRow.querySelectorAll('input');
                inputs.forEach(input => {
                    input.addEventListener('input', function() {
                        this.style.color = 'red';
                        // 显示确认对话框
                        if (this.value.trim() !== '') {
                            setTimeout(() => {
                                if (confirm('您已修改了属性值，是否要增加新记录？')) {
                                    // 激活供应商和客户按钮
                                    const addVendorBtn = document.getElementById('addVendorBtn');
                                    const addCustomerBtn = document.getElementById('addCustomerBtn');
                                    
                                    if (addVendorBtn) {
                                        addVendorBtn.removeAttribute('disabled');
                                        addVendorBtn.classList.remove('bg-gray-300', 'text-gray-700');
                                        addVendorBtn.classList.add('bg-green-500', 'text-white');
                                    }
                                    
                                    if (addCustomerBtn) {
                                        addCustomerBtn.removeAttribute('disabled');
                                        addCustomerBtn.classList.remove('bg-gray-300', 'text-gray-700');
                                        addCustomerBtn.classList.add('bg-green-500', 'text-white');
                                    }
                                    
                                    // 模拟在左侧产品区添加一条新记录
                                    const productList = document.querySelector('#productListContainer table tbody');
                                    if (productList) {
                                        const newProduct = document.createElement('tr');
                                        const uniqueId = 'C' + Math.floor(Math.random() * 1000) + '-' + Math.floor(Math.random() * 100);
                                        newProduct.innerHTML = `
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${uniqueId}</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">新产品</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">电子产品</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">单件</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">0</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">0</td>
                                            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                <button class="text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-edit"></i></button>
                                                <button class="text-green-500 hover:text-green-700 mr-2"><i class="fas fa-copy"></i></button>
                                                <button class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                                            </td>
                                        `;
                                        productList.prepend(newProduct);
                                        
                                        // 为新添加的行绑定双击事件
                                        bindProductRowEvents(newProduct);
                                    }
                                }
                            }, 500);
                        }
                    });
                });
            }
        });
    }
    
    // 删除规格分类
    const deleteSpecBtn = document.getElementById('deleteSpecBtn');
    if (deleteSpecBtn) {
        deleteSpecBtn.addEventListener('click', function() {
            const tbody = document.querySelector('#specsTabContent table tbody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                if (rows.length > 0) {
                    tbody.removeChild(rows[rows.length - 1]);
                }
                
                // 如果没有自定义行了，禁用删除按钮
                if (tbody.querySelectorAll('tr').length <= 4) { // 假设默认有4行
                    this.setAttribute('disabled', 'disabled');
                    this.classList.remove('bg-red-500', 'text-white');
                    this.classList.add('bg-gray-300', 'text-gray-700');
                }
            }
        });
    }
    
    // 添加供应商按钮事件
    const addVendorBtn = document.getElementById('addVendorBtn');
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', function() {
            // 切换到供应商Tab
            const vendorTab = document.querySelector('[data-tab="vendor"]');
            if (vendorTab) {
                vendorTab.click();
            }
        });
    }
    
    // 添加客户按钮事件
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            // 切换到客户Tab
            const customerTab = document.querySelector('[data-tab="customer"]');
            if (customerTab) {
                customerTab.click();
            }
        });
    }
    
    // 产品类型切换事件
    const productType = document.getElementById('productType');
    if (productType) {
        productType.addEventListener('click', function() {
            if (this.textContent === '单件') {
                this.textContent = '组套';
                // 激活组套功能
                updateBundleTabForGroupProduct();
            } else {
                this.textContent = '单件';
                // 禁用组套功能
                updateBundleTabForSingleProduct();
            }
        });
    }
    
    // 更新组套Tab为组套产品
    function updateBundleTabForGroupProduct() {
        const bundleTabContent = document.getElementById('bundleTabContent');
        if (bundleTabContent) {
            bundleTabContent.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-medium">组套产品信息</h4>
                    <div class="flex space-x-1">
                        <button class="bg-blue-500 text-white text-xs px-2 py-1 rounded" id="addBundleItemBtn">
                            <i class="fas fa-plus"></i> 添加产品
                        </button>
                        <button class="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded" id="deleteBundleItemBtn" disabled>
                            <i class="fas fa-trash"></i> 删除产品
                        </button>
                    </div>
                </div>
                
                <!-- 组套产品列表 -->
                <table class="w-full text-xs border">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-2 py-1 border text-left">产品编码</th>
                            <th class="px-2 py-1 border text-left">产品名称</th>
                            <th class="px-2 py-1 border text-left">数量</th>
                            <th class="px-2 py-1 border text-left">单位</th>
                            <th class="px-2 py-1 border text-left">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- 空表格，等待添加产品 -->
                    </tbody>
                </table>
            `;
            
            // 重新绑定按钮事件
            const addBundleItemBtn = document.getElementById('addBundleItemBtn');
            if (addBundleItemBtn) {
                addBundleItemBtn.addEventListener('click', function() {
                    const tbody = document.querySelector('#bundleTabContent table tbody');
                    if (tbody) {
                        const newRow = document.createElement('tr');
                        newRow.innerHTML = `
                            <td class="px-2 py-1 border">A001-01</td>
                            <td class="px-2 py-1 border">折叠美工刀</td>
                            <td class="px-2 py-1 border"><input type="number" class="w-full text-xs p-1 border" value="1" min="1"></td>
                            <td class="px-2 py-1 border">件</td>
                            <td class="px-2 py-1 border">
                                <button class="text-red-500 hover:text-red-700 text-xs">删除</button>
                            </td>
                        `;
                        tbody.appendChild(newRow);
                        
                        // 激活删除按钮
                        const deleteBundleItemBtn = document.getElementById('deleteBundleItemBtn');
                        if (deleteBundleItemBtn) {
                            deleteBundleItemBtn.removeAttribute('disabled');
                            deleteBundleItemBtn.classList.remove('bg-gray-300', 'text-gray-700');
                            deleteBundleItemBtn.classList.add('bg-red-500', 'text-white');
                        }
                    }
                });
            }
        }
    }
    
    // 更新组套Tab为单件产品
    function updateBundleTabForSingleProduct() {
        const bundleTabContent = document.getElementById('bundleTabContent');
        if (bundleTabContent) {
            bundleTabContent.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-medium">组套产品信息</h4>
                    <div class="flex space-x-1">
                        <button class="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded" id="addBundleItemBtn" disabled>
                            <i class="fas fa-plus"></i> 添加产品
                        </button>
                        <button class="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded" id="deleteBundleItemBtn" disabled>
                            <i class="fas fa-trash"></i> 删除产品
                        </button>
                    </div>
                </div>
                
                <!-- 组套产品列表 -->
                <div class="text-xs text-gray-500 italic mb-2">当前产品属性为"单件"，组套功能不可用。请先将产品属性修改为"组套"。</div>
            `;
        }
    }
    
    // 供应商和客户管理功能
    const addNewVendorBtn = document.getElementById('addNewVendorBtn');
    if (addNewVendorBtn) {
        addNewVendorBtn.addEventListener('click', function() {
            const vendorList = document.querySelector('#vendorTabContent .space-y-2');
            if (vendorList) {
                const newVendor = document.createElement('div');
                newVendor.className = 'border rounded p-2';
                newVendor.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium text-sm">新供应商</span>
                            <span class="text-xs text-gray-500 ml-2">Mfr. Nr.: <input type="text" class="border px-1 w-24" placeholder="输入编号"></span>
                        </div>
                        <span class="text-blue-600 text-sm">¥<input type="text" class="border px-1 w-16" placeholder="输入价格"></span>
                    </div>
                    <div class="flex justify-end mt-1">
                        <button class="text-xs text-blue-600 mr-2">保存</button>
                        <button class="text-xs text-red-600">取消</button>
                    </div>
                `;
                vendorList.appendChild(newVendor);
            }
        });
    }
    
    const addNewCustomerBtn = document.getElementById('addNewCustomerBtn');
    if (addNewCustomerBtn) {
        addNewCustomerBtn.addEventListener('click', function() {
            const customerList = document.querySelector('#customerTabContent .space-y-2');
            if (customerList) {
                const newCustomer = document.createElement('div');
                newCustomer.className = 'border rounded p-2';
                newCustomer.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium text-sm">新客户</span>
                            <span class="text-xs text-gray-500 ml-2">SKU: <input type="text" class="border px-1 w-24" placeholder="输入SKU"></span>
                        </div>
                        <span class="text-green-600 text-sm">¥<input type="text" class="border px-1 w-16" placeholder="输入价格"></span>
                    </div>
                    <div class="flex justify-end mt-1">
                        <button class="text-xs text-blue-600 mr-2">保存</button>
                        <button class="text-xs text-red-600">取消</button>
                    </div>
                `;
                customerList.appendChild(newCustomer);
            }
        });
    }
    
    // 绑定产品行双击事件
    function bindProductRowEvents(row) {
        row.addEventListener('dblclick', function() {
            // 更新右区信息
            const cells = this.cells;
            if (cells.length >= 6) {
                const productCode = cells[0].textContent;
                const productName = cells[1].textContent;
                const productCategory = cells[2].textContent;
                const productType = cells[3].textContent;
                const vendorCount = cells[4].textContent;
                const customerCount = cells[5].textContent;
                
                // 更新上区信息
                const productTitleEl = document.getElementById('productTitle');
                const productCodeEl = document.getElementById('productCode');
                const productCategoryEl = document.getElementById('productCategory');
                const productTypeEl = document.getElementById('productType');
                const vendorCountEl = document.getElementById('vendorCount');
                const customerCountEl = document.getElementById('customerCount');
                
                if (productTitleEl) productTitleEl.textContent = productName;
                if (productCodeEl) productCodeEl.textContent = productCode;
                if (productCategoryEl) productCategoryEl.textContent = productCategory;
                if (productTypeEl) productTypeEl.textContent = productType;
                if (vendorCountEl) vendorCountEl.textContent = vendorCount;
                if (customerCountEl) customerCountEl.textContent = customerCount;
                
                // 模拟切换到规格标签
                const specsTab = document.querySelector('[data-tab="specs"]');
                if (specsTab) specsTab.click();
            }
        });
    }
    
    // 初始化产品行双击事件
    const productRows = document.querySelectorAll('#productListContainer table tbody tr');
    productRows.forEach(row => {
        bindProductRowEvents(row);
    });
});
