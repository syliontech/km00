// 右区TAB切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取右区面板
    const rightPanel = document.getElementById('rightPanel');
    
    // 如果右区面板不存在，则退出
    if (!rightPanel) return;
    
    // 获取所有TAB按钮
    const tabButtons = document.querySelectorAll('#tab-buttons button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 为每个TAB按钮添加点击事件
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前TAB的数据属性
            const tabId = this.getAttribute('data-tab');
            
            // 切换TAB状态
            switchTab(tabId);
            
            // 检测工作流闭环条件
            checkWorkflowLoop(tabId);
        });
    });
    
    // 切换TAB的函数
    function switchTab(tabId) {
        // 移除所有按钮的激活状态
        tabButtons.forEach(btn => {
            btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            btn.classList.add('text-gray-500', 'hover:text-gray-700');
        });
        
        // 隐藏所有TAB内容
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        // 激活当前TAB按钮
        const activeButton = document.getElementById(`${tabId}-tab`);
        if (activeButton) {
            activeButton.classList.remove('text-gray-500', 'hover:text-gray-700');
            activeButton.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        }
        
        // 显示当前TAB内容
        const activeContent = document.getElementById(`${tabId}-content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        // 如果是组套TAB，显示组套额外信息
        const kitExtraInfo = document.getElementById('kit-extra-info');
        if (kitExtraInfo) {
            if (tabId === 'kit') {
                kitExtraInfo.classList.remove('hidden');
            } else {
                kitExtraInfo.classList.add('hidden');
            }
        }
    }
    
    // 初始化显示规格TAB
    // 确保在DOM加载完成后执行
    setTimeout(() => {
        switchTab('specs');
    }, 100);
    
    // 添加属性和组套产品管理功能
    initSpecsManagement();
    initKitManagement();
    initVendorManagement();
    initClientManagement();
    
    // 初始化规格管理功能
    function initSpecsManagement() {
        // 获取添加和删除属性按钮
        const addSpecBtn = document.getElementById('add-spec-btn');
        const removeSpecBtn = document.getElementById('remove-spec-btn');
        const saveDescBtn = document.getElementById('save-spec-description-btn');
        
        // 添加属性按钮点击事件
        if (addSpecBtn) {
            addSpecBtn.addEventListener('click', function() {
                // 创建属性名称和值输入对话框
                const specName = prompt('请输入属性名称：');
                if (!specName) return;
                
                const specValue = prompt('请输入属性值：');
                if (!specValue) return;
                
                // 添加属性到列表
                addSpecToList(specName, specValue);
                
                // 属性内容新添加时不启动工作流闭环
                // 根据新需求，添加属性不启动闭环
            });
        }
        
        // 删除属性按钮点击事件
        if (removeSpecBtn) {
            removeSpecBtn.addEventListener('click', function() {
                // 获取当前选中的属性
                const selectedSpec = document.querySelector('#specs-list .spec-item.selected');
                if (!selectedSpec) {
                    alert('请先选择要删除的属性');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除属性“${selectedSpec.querySelector('div:first-child').textContent}”吗？`)) {
                    // 删除属性
                    selectedSpec.remove();
                    
                    // 属性内容删除时不启动工作流闭环
                    // 根据新需求，删除属性不启动闭环
                }
            });
        }
        
        // 保存说明按钮点击事件
        if (saveDescBtn) {
            saveDescBtn.addEventListener('click', function() {
                const descriptionText = document.getElementById('spec-description').value;
                if (!descriptionText.trim()) {
                    alert('请输入说明内容');
                    return;
                }
                
                // 添加说明到列表
                addSpecDescription(descriptionText);
                
                // 清空输入框
                document.getElementById('spec-description').value = '';
                
                // 添加/修改说明启动工作流闭环
                startWorkflowLoop('添加/修改说明');
                
                // 将供应商和客户Tab变为绿色可进入配置
                enableVendorClientTabs();
            });
        }
        
        // 为属性项添加点击事件，实现选中功能
        const specsList = document.getElementById('specs-list');
        if (specsList) {
            specsList.addEventListener('click', function(e) {
                const specItem = e.target.closest('.spec-item');
                if (!specItem) return;
                
                // 切换选中状态
                const allSpecItems = document.querySelectorAll('#specs-list .spec-item');
                allSpecItems.forEach(item => item.classList.remove('selected', 'bg-blue-100'));
                specItem.classList.add('selected', 'bg-blue-100');
            });
            
            // 添加属性值的双击编辑功能
            specsList.addEventListener('dblclick', function(e) {
                const specValue = e.target.closest('.spec-value');
                if (!specValue) return;
                
                // 获取当前值
                const currentValue = specValue.textContent;
                
                // 创建编辑对话框
                const newValue = prompt('请输入新的属性值：', currentValue);
                if (newValue === null || newValue === currentValue) return;
                
                // 更新属性值
                specValue.textContent = newValue;
                
                // 修改的内容显示为红色
                specValue.classList.add('text-red-500');
                
                // 属性内容修改时不启动工作流闭环
                // 根据新需求，修改属性不启动闭环
            });
        }
    }
    
    // 添加说明到列表
    function addSpecDescription(description) {
        const specsList = document.getElementById('specs-list');
        if (!specsList) return;
        
        // 创建新的说明项
        const descItem = document.createElement('div');
        descItem.className = 'grid grid-cols-2 gap-2 p-2 border-b spec-item';
        descItem.dataset.specName = 'description';
        descItem.innerHTML = `
            <div class="text-sm">说明</div>
            <div class="text-sm spec-value text-red-500">${description}</div>
        `;
        
        // 添加到列表
        specsList.appendChild(descItem);
    }
    
    // 启用供应商和客户Tab
    function enableVendorClientTabs() {
        // 将供应商和客户Tab变为绿色
        const vendorTab = document.getElementById('vendor-tab');
        const clientTab = document.getElementById('client-tab');
        
        if (vendorTab) {
            vendorTab.classList.remove('text-gray-500');
            vendorTab.classList.add('text-green-500', 'font-semibold');
        }
        
        if (clientTab) {
            clientTab.classList.remove('text-gray-500');
            clientTab.classList.add('text-green-500', 'font-semibold');
        }
        
        // 显示记录配置信息
        const recordConfigInfo = document.getElementById('record-config-info');
        if (recordConfigInfo) {
            recordConfigInfo.classList.remove('hidden');
        }
    }
    
    // 添加属性到列表
    function addSpecToList(name, value) {
        const specsList = document.getElementById('specs-list');
        if (!specsList) return;
        
        // 创建新的属性项
        const specItem = document.createElement('div');
        specItem.className = 'grid grid-cols-2 gap-2 p-2 border-b spec-item';
        specItem.dataset.specName = name.toLowerCase().replace(/\s+/g, '-');
        specItem.innerHTML = `
            <div class="text-sm">${name}</div>
            <div class="text-sm spec-value">${value}</div>
        `;
        
        // 添加到列表
        specsList.appendChild(specItem);
    }
    
    // 初始化组套管理功能
    function initKitManagement() {
        // 获取添加和删除组套产品按钮
        const addKitItemBtn = document.getElementById('add-kit-item-btn');
        const removeKitItemBtn = document.getElementById('remove-kit-item-btn');
        
        // 添加组套产品按钮点击事件
        if (addKitItemBtn) {
            addKitItemBtn.addEventListener('click', function() {
                // 模拟进入产品管理页面选择产品
                alert('进入产品管理页面选择产品');
                
                // 模拟产品选择对话框
                const productName = prompt('请输入产品名称：');
                if (!productName) return;
                
                const productCode = prompt('请输入产品编码：');
                if (!productCode) return;
                
                const vendorName = prompt('请输入供应商名称：');
                if (!vendorName) return;
                
                const quantity = prompt('请输入数量：', '1');
                if (!quantity) return;
                
                // 添加组套产品到列表
                addKitItemToList(productName, productCode, vendorName, quantity);
                
                // 显示产品明细信息
                updateKitDetailInfo(productName, productCode, '61*19*0.6mm', quantity);
                
                // 组套产品添加时启动工作流闭环
                startWorkflowLoop('组套产品添加');
            });
        }
        
        // 删除组套产品按钮点击事件
        if (removeKitItemBtn) {
            removeKitItemBtn.addEventListener('click', function() {
                // 获取当前选中的组套产品
                const selectedItem = document.querySelector('#kit-items-list .kit-item.selected');
                if (!selectedItem) {
                    alert('请先选择要删除的组套产品');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除组套产品“${selectedItem.querySelector('div:first-child').textContent}”吗？`)) {
                    // 删除组套产品
                    selectedItem.remove();
                    
                    // 清空产品明细信息
                    clearKitDetailInfo();
                    
                    // 组套产品删除时启动工作流闭环
                    startWorkflowLoop('组套产品删除');
                }
            });
        }
        
        // 为组套产品项添加点击事件，实现选中功能
        const kitItemsList = document.getElementById('kit-items-list');
        if (kitItemsList) {
            kitItemsList.addEventListener('click', function(e) {
                const kitItem = e.target.closest('.kit-item');
                if (!kitItem) return;
                
                // 切换选中状态
                const allKitItems = document.querySelectorAll('#kit-items-list .kit-item');
                allKitItems.forEach(item => item.classList.remove('selected', 'bg-blue-100'));
                kitItem.classList.add('selected', 'bg-blue-100');
                
                // 显示选中产品的明细信息
                const productName = kitItem.querySelector('div:first-child').textContent.split(' (')[0];
                const productCode = kitItem.dataset.productCode;
                updateKitDetailInfo(productName, productCode, '61*19*0.6mm', '1');
            });
            
            // 添加双击事件，模拟选择产品明细
            kitItemsList.addEventListener('dblclick', function(e) {
                const kitItem = e.target.closest('.kit-item');
                if (!kitItem) return;
                
                alert('双击添加产品明细，将显示在上区');
            });
        }
    }
    
    // 更新产品明细信息
    function updateKitDetailInfo(name, code, spec, quantity) {
        const codeElement = document.getElementById('kit-detail-code');
        const nameElement = document.getElementById('kit-detail-name');
        const specElement = document.getElementById('kit-detail-spec');
        const quantityElement = document.getElementById('kit-detail-quantity');
        
        if (codeElement) codeElement.textContent = code;
        if (nameElement) nameElement.textContent = name;
        if (specElement) specElement.textContent = spec;
        if (quantityElement) quantityElement.textContent = quantity;
    }
    
    // 清空产品明细信息
    function clearKitDetailInfo() {
        updateKitDetailInfo('--', '--', '--', '--');
    }
    
    // 添加组套产品到列表
    function addKitItemToList(name, code, vendorName, quantity) {
        const kitItemsList = document.getElementById('kit-items-list');
        if (!kitItemsList) return;
        
        // 创建新的组套产品项
        const kitItem = document.createElement('div');
        kitItem.className = 'grid grid-cols-2 gap-2 p-2 border-b kit-item';
        kitItem.dataset.productCode = code;
        kitItem.dataset.quantity = quantity;
        kitItem.innerHTML = `
            <div class="text-sm">${name} (${code})</div>
            <div class="text-sm">${vendorName}</div>
        `;
        
        // 添加到列表
        kitItemsList.appendChild(kitItem);
    }
    
    // 初始化供应商管理功能
    function initVendorManagement() {
        // 获取添加供应商按钮
        const addVendorBtn = document.getElementById('add-vendor-btn');
        
        // 添加供应商按钮点击事件
        if (addVendorBtn) {
            addVendorBtn.addEventListener('click', function() {
                // 模拟供应商选择对话框
                alert('打开供应商选择对话框');
                // 实际应用中，这里应该打开一个对话框或跳转到供应商选择页面
            });
        }
        
        // 为供应商列表添加点击事件，实现选中功能
        const vendorList = document.getElementById('vendor-list');
        if (vendorList) {
            vendorList.addEventListener('click', function(e) {
                const vendorItem = e.target.closest('.vendor-item');
                if (!vendorItem) return;
                
                // 切换选中状态
                const allVendorItems = document.querySelectorAll('#vendor-list .vendor-item');
                allVendorItems.forEach(item => item.classList.remove('selected', 'bg-blue-100'));
                vendorItem.classList.add('selected', 'bg-blue-100');
            });
        }
    }
    
    // 初始化客户管理功能
    function initClientManagement() {
        // 获取添加客户按钮
        const addClientBtn = document.getElementById('add-client-btn');
        
        // 添加客户按钮点击事件
        if (addClientBtn) {
            addClientBtn.addEventListener('click', function() {
                // 模拟客户选择对话框
                alert('打开客户选择对话框');
                // 实际应用中，这里应该打开一个对话框或跳转到客户选择页面
            });
        }
        
        // 为客户列表添加点击事件，实现选中功能
        const clientList = document.getElementById('client-list');
        if (clientList) {
            clientList.addEventListener('click', function(e) {
                const clientItem = e.target.closest('.client-item');
                if (!clientItem) return;
                
                // 切换选中状态
                const allClientItems = document.querySelectorAll('#client-list .client-item');
                allClientItems.forEach(item => item.classList.remove('selected', 'bg-blue-100'));
                clientItem.classList.add('selected', 'bg-blue-100');
            });
        }
    }
    
    // 检测工作流闭环条件
    function checkWorkflowLoop(tabId) {
        // 获取当前工作流状态
        const currentState = rightPanel.dataset.state;
        
        // 如果处于待机状态，不检测闭环条件
        if (currentState === 'idle') return;
        
        // 根据TAB类型和当前状态决定是否启动闭环
        switch (tabId) {
            case 'specs':
                // 规格TAB：属性内容新添加或修改时启动工作流闭环
                // 在属性编辑功能中实现
                break;
            case 'kit':
                // 组套TAB：添加/删除产品时启动工作流闭环
                // 在组套产品添加/删除功能中实现
                break;
        }
    }
    
    // 启动工作流闭环
    function startWorkflowLoop(reason) {
        console.log(`启动工作流闭环，原因：${reason}`);
        
        // 如果全局工作流对象存在，调用其方法
        if (window.rightPanelWorkflow && typeof window.rightPanelWorkflow.startWorkflowLoop === 'function') {
            window.rightPanelWorkflow.startWorkflowLoop(reason);
            window.rightPanelWorkflow.updateSummary();
            return;
        }
        
        // 如果全局对象不存在，使用本地实现
        // 更新工作流状态显示
        const currentStatus = document.getElementById('current-status');
        if (currentStatus) {
            currentStatus.textContent = `工作流闭环中（${reason}）`;
        }
        
        // 显示提交区域
        const submitArea = document.getElementById('submit-area');
        if (submitArea) {
            submitArea.classList.remove('hidden');
        }
        
        // 显示记录配置信息
        const recordConfigInfo = document.getElementById('record-config-info');
        if (recordConfigInfo) {
            recordConfigInfo.classList.remove('hidden');
        }
    }
    
    // 创建规格TAB内容
    function createSpecsTabContent() {
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">属性列表</h3>
                <div>
                    <button class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 mr-1">
                        <i class="fas fa-plus"></i> 添加属性
                    </button>
                    <button class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                        <i class="fas fa-minus"></i> 删除属性
                    </button>
                </div>
            </div>
            
            <!-- 属性列表 -->
            <div class="space-y-2 mb-4">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm">材料</span>
                    <span class="text-sm">铝合金手柄+锋合金刀头</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm">颜色</span>
                    <span class="text-sm">灰色</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm">尺寸</span>
                    <span class="text-sm">61*19*0.6mm</span>
                </div>
            </div>
        `;
        return content;
    }
    
    // 创建组套TAB内容
    function createKitTabContent() {
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">组套产品列表</h3>
                <div>
                    <button class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 mr-1">
                        <i class="fas fa-plus"></i> 添加产品
                    </button>
                    <button class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                        <i class="fas fa-minus"></i> 删除产品
                    </button>
                </div>
            </div>
            
            <!-- 组套产品列表 -->
            <div class="space-y-2 mb-4">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm">美工刀 (A-01-01)</span>
                    <span class="text-sm">数量: 1</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm">替换刀片 (A-01-02)</span>
                    <span class="text-sm">数量: 5</span>
                </div>
            </div>
            
            <!-- 组套总价信息 -->
            <div class="mt-4 p-3 bg-blue-50 rounded">
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span class="font-medium">组套总价:</span>
                        <span>¥25.00</span>
                    </div>
                    <div>
                        <span class="font-medium">包装费:</span>
                        <span>¥2.00</span>
                    </div>
                    <div>
                        <span class="font-medium">物料费:</span>
                        <span>¥1.50</span>
                    </div>
                    <div>
                        <span class="font-medium">人工费:</span>
                        <span>¥3.00</span>
                    </div>
                </div>
            </div>
        `;
        return content;
    }
    
    // 创建供应商TAB内容
    function createVendorTabContent() {
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">供应商列表</h3>
                <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
                    <i class="fas fa-plus"></i> 添加供应商
                </button>
            </div>
            
            <!-- 供应商列表 -->
            <div class="space-y-3 mb-4">
                <div class="border p-3 rounded hover:bg-blue-50 cursor-pointer">
                    <div class="flex justify-between">
                        <h4 class="font-medium text-sm">供应商A</h4>
                        <span class="text-xs text-gray-500">已选择</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div>
                            <span class="text-gray-500">Mfr.Nr.:</span>
                            <span>S12345</span>
                        </div>
                        <div>
                            <span class="text-gray-500">价格:</span>
                            <span>¥15.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="border p-3 rounded hover:bg-blue-50 cursor-pointer">
                    <div class="flex justify-between">
                        <h4 class="font-medium text-sm">供应商B</h4>
                        <span class="text-xs text-gray-500">未选择</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div>
                            <span class="text-gray-500">Mfr.Nr.:</span>
                            <span>S67890</span>
                        </div>
                        <div>
                            <span class="text-gray-500">价格:</span>
                            <span>¥16.50</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return content;
    }
    
    // 创建客户TAB内容
    function createClientTabContent() {
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">客户列表</h3>
                <button class="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600">
                    <i class="fas fa-plus"></i> 添加客户
                </button>
            </div>
            
            <!-- 客户列表 -->
            <div class="space-y-3 mb-4">
                <div class="border p-3 rounded hover:bg-blue-50 cursor-pointer">
                    <div class="flex justify-between">
                        <h4 class="font-medium text-sm">客户X</h4>
                        <span class="text-xs text-gray-500">已选择</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div>
                            <span class="text-gray-500">SKU:</span>
                            <span>C98765</span>
                        </div>
                        <div>
                            <span class="text-gray-500">价格:</span>
                            <span>¥25.00</span>
                        </div>
                        <div>
                            <span class="text-gray-500">最新报价:</span>
                            <span>¥24.50</span>
                        </div>
                        <div>
                            <span class="text-gray-500">利润率:</span>
                            <span>38%</span>
                        </div>
                    </div>
                </div>
                
                <div class="border p-3 rounded hover:bg-blue-50 cursor-pointer">
                    <div class="flex justify-between">
                        <h4 class="font-medium text-sm">客户Y</h4>
                        <span class="text-xs text-gray-500">未选择</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div>
                            <span class="text-gray-500">SKU:</span>
                            <span>C54321</span>
                        </div>
                        <div>
                            <span class="text-gray-500">价格:</span>
                            <span>¥24.00</span>
                        </div>
                        <div>
                            <span class="text-gray-500">最新报价:</span>
                            <span>¥23.50</span>
                        </div>
                        <div>
                            <span class="text-gray-500">利润率:</span>
                            <span>36%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return content;
    }
    
    // 初始化显示规格TAB内容
    const defaultTabButton = rightPanel.querySelector('.flex.border-b button:first-child');
    if (defaultTabButton) {
        defaultTabButton.click();
    }
    
    // 添加编辑、修改和保存为记录按钮的事件处理
    const editButton = rightPanel.querySelector('button:has(i.fa-edit)');
    const modifyButton = rightPanel.querySelector('button:has(i.fa-pen)');
    const saveButton = rightPanel.querySelector('button:has(i.fa-save)');
    
    if (editButton) {
        editButton.addEventListener('click', function() {
            alert('编辑功能已触发');
            // 这里添加编辑功能的逻辑
        });
    }
    
    if (modifyButton) {
        modifyButton.addEventListener('click', function() {
            alert('修改功能已触发');
            // 这里添加修改功能的逻辑
        });
    }
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            alert('保存为记录功能已触发，工作流闭环完成');
            // 这里添加保存为记录功能的逻辑
        });
    }
});
