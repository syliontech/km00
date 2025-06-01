// 右区功能完整实现 - 预览版
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化右区功能 - 完整版');
    
    // 获取右区面板
    const rightPanel = document.getElementById('rightPanel');
    
    // 如果右区面板不存在，则退出
    if (!rightPanel) {
        console.error('右区面板不存在');
        return;
    }
    
    // 获取所有TAB按钮和内容区域
    const tabButtons = document.querySelectorAll('#tab-buttons button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 全局变量
    let activeTab = 'specs'; // 当前激活的TAB
    let workflowState = 'idle'; // 工作流状态：idle(待机), new(新建), edit(编辑), modify(修改)
    let workflowLoopStarted = false; // 工作流闭环是否已启动
    let productAttributes = []; // 产品属性数组
    let productType = 'single'; // 产品类型：single(单件), kit(组套)
    let vendors = []; // 供应商数组
    let clients = []; // 客户数组
    let defaultVendor = null; // 默认供应商
    let defaultClient = null; // 默认客户
    let currentProductCode = ''; // 当前产品编码
    let currentRecordNumber = ''; // 当前记录编号
    
    // 为每个TAB按钮添加点击事件
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log('点击了TAB:', tabId);
            
            // 如果工作流状态为待机，则不允许切换TAB
            if (workflowState === 'idle') {
                console.log('待机状态，无法切换TAB');
                return;
            }
            
            // 切换TAB状态
            switchTab(tabId);
        });
    });
    
    // 切换TAB的函数
    function switchTab(tabId) {
        console.log('切换到TAB:', tabId);
        activeTab = tabId;
        
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
        const activeButton = document.querySelector(`button[data-tab="${tabId}"]`);
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
    
    // 初始化规格管理功能
    function initSpecsManagement() {
        console.log('初始化规格管理功能');
        
        // 获取添加和删除属性按钮
        const addSpecBtn = document.getElementById('add-spec-btn');
        const removeSpecBtn = document.getElementById('remove-spec-btn');
        const saveDescBtn = document.getElementById('save-spec-description-btn');
        
        // 添加属性按钮点击事件
        if (addSpecBtn) {
            addSpecBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 创建属性名称和值输入对话框
                const specName = prompt('请输入属性名称：');
                if (!specName) return;
                
                const specValue = prompt('请输入属性值：');
                if (!specValue) return;
                
                // 添加属性到列表
                addSpecToList(specName, specValue);
                
                // 属性内容新添加时不启动工作流闭环
                console.log('添加属性不启动闭环');
                
                // 更新下区的记录配置摘要
                updateSummary();
            });
        }
        
        // 删除属性按钮点击事件
        if (removeSpecBtn) {
            removeSpecBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 获取当前选中的属性
                const selectedSpec = document.querySelector('#specs-list .spec-item.selected');
                if (!selectedSpec) {
                    alert('请先选择要删除的属性');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除属性"${selectedSpec.querySelector('div:first-child').textContent}"吗？`)) {
                    selectedSpec.remove();
                    
                    // 删除属性不启动工作流闭环
                    console.log('删除属性不启动闭环');
                    
                    // 更新下区的记录配置摘要
                    updateSummary();
                }
            });
        }
        
        // 编辑按钮点击事件
        if (saveDescBtn) {
            saveDescBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 获取当前选中的属性和说明文本
                const selectedSpec = document.querySelector('#specs-list .spec-item.selected');
                const descriptionText = document.getElementById('spec-description').value;
                
                if (!selectedSpec) {
                    alert('请先选择要编辑的属性');
                    return;
                }
                
                if (!descriptionText.trim()) {
                    alert('请输入说明内容');
                    return;
                }
                
                // 获取属性名称和原始值
                const specName = selectedSpec.querySelector('div:first-child').textContent;
                const specValueElement = selectedSpec.querySelector('.spec-value');
                const originalValue = specValueElement.textContent;
                
                // 更新说明
                specValueElement.textContent = descriptionText;
                specValueElement.style.color = 'red'; // 修改的内容显示为红色
                
                // 启动工作流闭环
                startWorkflowLoop('添加/修改说明');
                
                // 启用供应商和客户Tab
                enableVendorClientTabs();
                
                // 清空说明文本框
                document.getElementById('spec-description').value = '';
                
                // 将属性和说明内容传递到下区
                addSpecToRecordArea(specName, descriptionText);
                
                // 更新下区的记录配置摘要
                updateSummary();
            });
        }
        
        // 为规格列表中的每个项目添加点击事件（选中效果）
        document.querySelectorAll('#specs-list .spec-item').forEach(item => {
            item.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 移除其他项目的选中状态
                document.querySelectorAll('#specs-list .spec-item').forEach(i => {
                    i.classList.remove('selected', 'bg-blue-50');
                });
                
                // 添加当前项目的选中状态
                this.classList.add('selected', 'bg-blue-50');
                
                // 显示说明编辑区域
                const specName = this.querySelector('div:first-child').textContent;
                const specValue = this.querySelector('.spec-value').textContent;
                
                // 填充说明文本框
                const specDescription = document.getElementById('spec-description');
                if (specDescription) {
                    specDescription.value = specValue;
                }
                
                console.log('选中属性:', specName, '值:', specValue);
            });
        });
    }
    
    // 添加属性到列表
    function addSpecToList(name, value) {
        const specsList = document.getElementById('specs-list');
        if (!specsList) return;
        
        // 创建新的属性项
        const specItem = document.createElement('div');
        specItem.className = 'grid grid-cols-2 gap-2 p-2 border-b spec-item';
        specItem.setAttribute('data-spec-name', name.toLowerCase().replace(/\s+/g, '-'));
        specItem.innerHTML = `
            <div class="text-sm">${name}</div>
            <div class="text-sm spec-value">${value}</div>
        `;
        
        // 添加点击事件
        specItem.addEventListener('click', function() {
            if (workflowState === 'idle') return;
            
            // 移除其他项目的选中状态
            document.querySelectorAll('#specs-list .spec-item').forEach(item => {
                item.classList.remove('selected', 'bg-blue-50');
            });
            
            // 添加当前项目的选中状态
            this.classList.add('selected', 'bg-blue-50');
        });
        
        // 添加到列表
        specsList.appendChild(specItem);
        
        // 更新摘要信息
        updateSummary();
    }
    
    // 启用供应商和客户Tab
    function enableVendorClientTabs() {
        const vendorTab = document.getElementById('vendor-tab');
        const clientTab = document.getElementById('client-tab');
        
        if (vendorTab) {
            vendorTab.classList.remove('text-gray-500');
            vendorTab.classList.add('text-green-600');
        }
        
        if (clientTab) {
            clientTab.classList.remove('text-gray-500');
            clientTab.classList.add('text-green-600');
        }
    }
    
    // 初始化组套管理功能
    function initKitManagement() {
        console.log('初始化组套管理功能');
        
        // 获取添加和删除组套产品按钮
        const addKitBtn = document.getElementById('add-kit-btn');
        const removeKitBtn = document.getElementById('remove-kit-btn');
        
        // 添加组套产品按钮点击事件
        if (addKitBtn) {
            addKitBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 模拟进入产品管理页面选择产品
                const productName = prompt('请输入产品名称:');
                if (!productName) return;
                
                const productCode = prompt('请输入产品编码:');
                if (!productCode) return;
                
                const vendorName = prompt('请输入供应商名称:');
                if (!vendorName) return;
                
                const quantity = prompt('请输入数量:');
                if (!quantity) return;
                
                // 添加组套产品到列表
                addKitItemToList(productName, productCode, vendorName, quantity);
                
                // 启动工作流闭环
                startWorkflowLoop('添加组套产品');
            });
        }
        
        // 删除组套产品按钮点击事件
        if (removeKitBtn) {
            removeKitBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 获取当前选中的组套产品
                const selectedKit = document.querySelector('#kit-list .kit-item.selected');
                if (!selectedKit) {
                    alert('请先选择要删除的组套产品');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除组套产品"${selectedKit.querySelector('div:first-child').textContent}"吗？`)) {
                    selectedKit.remove();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('删除组套产品');
                }
            });
        }
    }
    
    // 添加组套产品到列表
    function addKitItemToList(name, code, vendorName, quantity) {
        const kitList = document.getElementById('kit-list');
        if (!kitList) return;
        
        // 创建新的组套产品项
        const kitItem = document.createElement('div');
        kitItem.className = 'grid grid-cols-2 gap-2 p-2 border-b kit-item';
        kitItem.setAttribute('data-product-code', code);
        kitItem.innerHTML = `
            <div class="text-sm">${name}</div>
            <div class="text-sm">${vendorName} (×${quantity})</div>
        `;
        
        // 添加点击事件
        kitItem.addEventListener('click', function() {
            if (workflowState === 'idle') return;
            
            // 移除其他项目的选中状态
            document.querySelectorAll('#kit-list .kit-item').forEach(item => {
                item.classList.remove('selected', 'bg-blue-50');
            });
            
            // 添加当前项目的选中状态
            this.classList.add('selected', 'bg-blue-50');
            
            // 更新产品明细信息
            updateKitDetailInfo(name, code, vendorName, quantity);
        });
        
        // 添加到列表
        kitList.appendChild(kitItem);
        
        // 更新摘要信息
        updateSummary();
    }
    
    // 更新产品明细信息
    function updateKitDetailInfo(name, code, vendorName, quantity) {
        // 在这里可以添加更新产品明细信息的代码
        console.log('更新产品明细信息:', name, code, vendorName, quantity);
    }
    
    // 初始化供应商管理功能
    function initVendorManagement() {
        console.log('初始化供应商管理功能');
        
        // 获取添加供应商按钮
        const addVendorBtn = document.getElementById('add-vendor-btn');
        
        // 添加供应商按钮点击事件 - 跳转到供应商管理
        if (addVendorBtn) {
            addVendorBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 模拟跳转到供应商管理页面
                alert('跳转到供应商管理页面，选择供应商后返回');
                
                // 模拟从供应商管理页面选择并返回一个供应商
                const vendorName = prompt('请选择供应商：');
                if (!vendorName) return;
                
                // 生成随机供应商ID
                const vendorId = 'V' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                
                // 添加供应商到列表
                addVendorToList(vendorName, vendorId, false);
                
                // 启动工作流闭环
                startWorkflowLoop('添加供应商');
            });
        }
        
        // 初始化默认供应商
        initDefaultVendor();
        
        // 为所有删除供应商按钮添加点击事件
        document.querySelectorAll('.delete-vendor-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                
                const vendorItem = this.closest('.vendor-item');
                const vendorName = vendorItem.querySelector('div:first-child').textContent;
                const isDefault = vendorItem.getAttribute('data-is-default') === 'true';
                
                // 如果是默认供应商，不允许删除
                if (isDefault) {
                    alert('默认供应商不能删除，请先设置其他供应商为默认');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除供应商"${vendorName}"吗？`)) {
                    vendorItem.remove();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('删除供应商');
                    
                    // 更新摘要信息
                    updateSummary();
                }
            });
        });
        
        // 为所有设置默认供应商按钮添加点击事件
        document.querySelectorAll('.set-default-vendor-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                if (this.disabled) return;
                
                const vendorItem = this.closest('.vendor-item');
                const vendorId = vendorItem.getAttribute('data-vendor-id');
                const vendorName = vendorItem.querySelector('div:first-child').textContent;
                
                // 将所有供应商设置为非默认
                document.querySelectorAll('#vendor-list .vendor-item').forEach(item => {
                    item.setAttribute('data-is-default', 'false');
                    item.querySelector('div:first-child').classList.remove('text-blue-600', 'font-medium');
                    const defaultBtn = item.querySelector('.set-default-vendor-btn');
                    if (defaultBtn) {
                        defaultBtn.disabled = false;
                    }
                });
                
                // 设置当前供应商为默认
                vendorItem.setAttribute('data-is-default', 'true');
                vendorItem.querySelector('div:first-child').classList.add('text-blue-600', 'font-medium');
                this.disabled = true;
                
                // 更新默认供应商显示区域
                updateDefaultVendorDisplay(vendorName, vendorId);
                
                // 将默认供应商信息传递到下方记录，并删除旧记录
                addDefaultVendorToRecordArea(vendorName, vendorId);
                
                // 启动工作流闭环
                startWorkflowLoop('设置默认供应商');
            });
        });
    }
    
    // 初始化默认供应商
    function initDefaultVendor() {
        // 获取已设置为默认的供应商
        const defaultVendor = document.querySelector('#vendor-list .vendor-item[data-is-default="true"]');
        if (defaultVendor) {
            const vendorName = defaultVendor.querySelector('div:first-child').textContent;
            const vendorId = defaultVendor.getAttribute('data-vendor-id');
            
            // 更新默认供应商显示区域
            updateDefaultVendorDisplay(vendorName, vendorId);
            
            // 将默认供应商信息传递到下方记录
            addDefaultVendorToRecordArea(vendorName, vendorId);
        } else {
            // 如果没有默认供应商，显示未选择状态
            const defaultVendorStatus = document.getElementById('default-vendor-status');
            if (defaultVendorStatus) {
                defaultVendorStatus.textContent = '未选择';
            }
            
            const defaultVendorDisplay = document.getElementById('default-vendor-display');
            if (defaultVendorDisplay) {
                defaultVendorDisplay.innerHTML = `
                    <div class="text-gray-500">请从下方列表选择一个默认供应商</div>
                `;
            }
        }
    }
    
    // 更新默认供应商显示区域
    function updateDefaultVendorDisplay(vendorName, vendorId) {
        const defaultVendorStatus = document.getElementById('default-vendor-status');
        if (defaultVendorStatus) {
            defaultVendorStatus.textContent = '已选择';
        }
        
        const defaultVendorName = document.getElementById('default-vendor-name');
        if (defaultVendorName) {
            defaultVendorName.textContent = vendorName;
        }
        
        const defaultVendorInfo = document.getElementById('default-vendor-info');
        if (defaultVendorInfo) {
            defaultVendorInfo.textContent = `供应商编号: ${vendorId}`;
        }
    }
    
    // 将默认供应商信息传递到下方记录
    function addDefaultVendorToRecordArea(vendorName, vendorId) {
        console.log('将默认供应商信息传递到下方记录:', vendorName, vendorId);
        
        // 生成随机记录编码（如果不存在）
        const recordCodeInput = document.getElementById('record-code');
        if (recordCodeInput && (!recordCodeInput.value || recordCodeInput.value === '自动生成')) {
            const randomCode = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            recordCodeInput.value = randomCode;
        }
        
        // 显示记录配置信息区域
        const recordConfigInfo = document.getElementById('record-config-info');
        if (recordConfigInfo) {
            recordConfigInfo.classList.remove('hidden');
        }
        
        // 添加到下区的记录配置区域
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            // 移除之前的供应商标记
            const oldVendorMarkers = recordConfigSummary.querySelectorAll('.vendor-marker');
            oldVendorMarkers.forEach(marker => marker.remove());
            
            // 创建新的供应商标记
            const vendorMarker = document.createElement('div');
            vendorMarker.className = 'flex justify-between items-center p-2 bg-green-50 rounded text-sm mt-2 vendor-marker';
            vendorMarker.setAttribute('data-vendor-id', vendorId);
            vendorMarker.innerHTML = `
                <div>
                    <i class="fas fa-building text-green-600 mr-1"></i>默认供应商: ${vendorName}
                </div>
                <button class="text-red-500 hover:text-red-700 delete-vendor-marker" data-vendor-id="${vendorId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // 添加删除按钮事件
            const deleteBtn = vendorMarker.querySelector('.delete-vendor-marker');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`确定要移除默认供应商"${vendorName}"吗？`)) {
                        vendorMarker.remove();
                    }
                });
            }
            
            // 添加到记录配置区域
            recordConfigSummary.appendChild(vendorMarker);
            
            // 更新记录配置摘要
            const summaryVendors = recordConfigSummary.querySelector('#summary-vendors');
            if (summaryVendors) {
                summaryVendors.textContent = `1个供应商`;
                summaryVendors.style.color = 'red'; // 标记为已更新
            }
        }
    }
    
    // 添加供应商到列表
    function addVendorToList(name, vendorId, isDefault = false) {
        const vendorList = document.getElementById('vendor-list');
        if (!vendorList) return;
        
        // 创建新的供应商项
        const vendorItem = document.createElement('div');
        vendorItem.className = 'grid grid-cols-2 gap-2 p-2 border-b vendor-item';
        vendorItem.setAttribute('data-vendor-id', vendorId);
        vendorItem.setAttribute('data-is-default', isDefault.toString());
        
        // 设置供应商名称样式
        const nameClass = isDefault ? 'text-sm text-blue-600 font-medium' : 'text-sm';
        
        // 设置默认按钮状态
        const defaultBtnDisabled = isDefault ? 'disabled' : '';
        
        vendorItem.innerHTML = `
            <div class="${nameClass}">${name}</div>
            <div class="text-sm flex space-x-2">
                <button class="bg-green-500 text-white px-2 py-1 rounded-sm text-xs hover:bg-green-600 set-default-vendor-btn" ${defaultBtnDisabled}>
                    <i class="fas fa-check"></i> 默认
                </button>
                <button class="bg-red-500 text-white px-2 py-1 rounded-sm text-xs hover:bg-red-600 delete-vendor-btn">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        `;
        
        // 添加设置默认供应商按钮点击事件
        const defaultBtn = vendorItem.querySelector('.set-default-vendor-btn');
        if (defaultBtn) {
            defaultBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                if (this.disabled) return;
                
                // 将所有供应商设置为非默认
                document.querySelectorAll('#vendor-list .vendor-item').forEach(item => {
                    item.setAttribute('data-is-default', 'false');
                    item.querySelector('div:first-child').classList.remove('text-blue-600', 'font-medium');
                    const btn = item.querySelector('.set-default-vendor-btn');
                    if (btn) {
                        btn.disabled = false;
                    }
                });
                
                // 设置当前供应商为默认
                vendorItem.setAttribute('data-is-default', 'true');
                vendorItem.querySelector('div:first-child').classList.add('text-blue-600', 'font-medium');
                this.disabled = true;
                
                // 更新默认供应商显示区域
                updateDefaultVendorDisplay(name, vendorId);
                
                // 将默认供应商信息传递到下方记录，并删除旧记录
                addDefaultVendorToRecordArea(name, vendorId);
                
                // 启动工作流闭环
                startWorkflowLoop('设置默认供应商');
            });
        }
        
        // 添加删除供应商按钮点击事件
        const deleteBtn = vendorItem.querySelector('.delete-vendor-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                
                const isDefault = vendorItem.getAttribute('data-is-default') === 'true';
                
                // 如果是默认供应商，不允许删除
                if (isDefault) {
                    alert('默认供应商不能删除，请先设置其他供应商为默认');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除供应商"${name}"吗？`)) {
                    vendorItem.remove();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('删除供应商');
                    
                    // 更新摘要信息
                    updateSummary();
                }
            });
        }
        
        // 添加到列表
        vendorList.appendChild(vendorItem);
        
        // 更新摘要信息
        updateSummary();
        
        // 如果是默认供应商，更新显示区域并传递到下方记录
        if (isDefault) {
            updateDefaultVendorDisplay(name, vendorId);
            addDefaultVendorToRecordArea(name, vendorId);
        }
    }
    
    // 初始化客户管理功能
    function initClientManagement() {
        console.log('初始化客户管理功能');
        
        // 获取添加客户按钮
        const addClientBtn = document.getElementById('add-client-btn');
        
        // 添加客户按钮点击事件 - 跳转到客户管理
        if (addClientBtn) {
            addClientBtn.addEventListener('click', function() {
                if (workflowState === 'idle') return;
                
                // 模拟跳转到客户管理页面
                alert('跳转到客户管理页面，选择客户后返回');
                
                // 模拟从客户管理页面选择并返回一个客户
                const clientName = prompt('请选择客户：');
                if (!clientName) return;
                
                // 生成随机客户ID
                const clientId = 'C' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                
                // 添加客户到列表
                addClientToList(clientName, clientId, false);
                
                // 启动工作流闭环
                startWorkflowLoop('添加客户');
            });
        }
        
        // 初始化默认客户
        initDefaultClient();
        
        // 为所有删除客户按钮添加点击事件
        document.querySelectorAll('.delete-client-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                
                const clientItem = this.closest('.client-item');
                const clientName = clientItem.querySelector('div:first-child').textContent;
                const isDefault = clientItem.getAttribute('data-is-default') === 'true';
                
                // 如果是默认客户，不允许删除
                if (isDefault) {
                    alert('默认客户不能删除，请先设置其他客户为默认');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除客户"${clientName}"吗？`)) {
                    clientItem.remove();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('删除客户');
                    
                    // 更新摘要信息
                    updateSummary();
                }
            });
        });
        
        // 为所有设置默认客户按钮添加点击事件
        document.querySelectorAll('.set-default-client-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                if (this.disabled) return;
                
                const clientItem = this.closest('.client-item');
                const clientId = clientItem.getAttribute('data-client-id');
                const clientName = clientItem.querySelector('div:first-child').textContent;
                
                // 将所有客户设置为非默认
                document.querySelectorAll('#client-list .client-item').forEach(item => {
                    item.setAttribute('data-is-default', 'false');
                    item.querySelector('div:first-child').classList.remove('text-blue-600', 'font-medium');
                    const defaultBtn = item.querySelector('.set-default-client-btn');
                    if (defaultBtn) {
                        defaultBtn.disabled = false;
                    }
                });
                
                // 设置当前客户为默认
                clientItem.setAttribute('data-is-default', 'true');
                clientItem.querySelector('div:first-child').classList.add('text-blue-600', 'font-medium');
                this.disabled = true;
                
                // 更新默认客户显示区域
                updateDefaultClientDisplay(clientName, clientId);
                
                // 将默认客户信息传递到下方记录，并删除旧记录
                addDefaultClientToRecordArea(clientName, clientId);
                
                // 启动工作流闭环
                startWorkflowLoop('设置默认客户');
            });
        });
    }
    
    // 初始化默认客户
    function initDefaultClient() {
        // 获取已设置为默认的客户
        const defaultClient = document.querySelector('#client-list .client-item[data-is-default="true"]');
        if (defaultClient) {
            const clientName = defaultClient.querySelector('div:first-child').textContent;
            const clientId = defaultClient.getAttribute('data-client-id');
            
            // 更新默认客户显示区域
            updateDefaultClientDisplay(clientName, clientId);
            
            // 将默认客户信息传递到下方记录
            addDefaultClientToRecordArea(clientName, clientId);
        } else {
            // 如果没有默认客户，显示未选择状态
            const defaultClientStatus = document.getElementById('default-client-status');
            if (defaultClientStatus) {
                defaultClientStatus.textContent = '未选择';
            }
            
            const defaultClientDisplay = document.getElementById('default-client-display');
            if (defaultClientDisplay) {
                defaultClientDisplay.innerHTML = `
                    <div class="text-gray-500">请从下方列表选择一个默认客户</div>
                `;
            }
        }
    }
    
    // 更新默认客户显示区域
    function updateDefaultClientDisplay(clientName, clientId) {
        const defaultClientStatus = document.getElementById('default-client-status');
        if (defaultClientStatus) {
            defaultClientStatus.textContent = '已选择';
        }
        
        const defaultClientName = document.getElementById('default-client-name');
        if (defaultClientName) {
            defaultClientName.textContent = clientName;
        }
        
        const defaultClientInfo = document.getElementById('default-client-info');
        if (defaultClientInfo) {
            defaultClientInfo.textContent = `客户编号: ${clientId}`;
        }
    }
    
    // 将默认客户信息传递到下方记录
    function addDefaultClientToRecordArea(clientName, clientId) {
        console.log('将默认客户信息传递到下方记录:', clientName, clientId);
        
        // 生成随机记录编码（如果不存在）
        const recordCodeInput = document.getElementById('record-code');
        if (recordCodeInput && (!recordCodeInput.value || recordCodeInput.value === '自动生成')) {
            const randomCode = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            recordCodeInput.value = randomCode;
        }
        
        // 显示记录配置信息区域
        const recordConfigInfo = document.getElementById('record-config-info');
        if (recordConfigInfo) {
            recordConfigInfo.classList.remove('hidden');
        }
        
        // 添加到下区的记录配置区域
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            // 移除之前的客户标记
            const oldClientMarkers = recordConfigSummary.querySelectorAll('.client-marker');
            oldClientMarkers.forEach(marker => marker.remove());
            
            // 创建新的客户标记
            const clientMarker = document.createElement('div');
            clientMarker.className = 'flex justify-between items-center p-2 bg-purple-50 rounded text-sm mt-2 client-marker';
            clientMarker.setAttribute('data-client-id', clientId);
            clientMarker.innerHTML = `
                <div>
                    <i class="fas fa-user-tie text-purple-600 mr-1"></i>默认客户: ${clientName}
                </div>
                <button class="text-red-500 hover:text-red-700 delete-client-marker" data-client-id="${clientId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // 添加删除按钮事件
            const deleteBtn = clientMarker.querySelector('.delete-client-marker');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`确定要移除默认客户"${clientName}"吗？`)) {
                        clientMarker.remove();
                    }
                });
            }
            
            // 添加到记录配置区域
            recordConfigSummary.appendChild(clientMarker);
            
            // 更新记录配置摘要
            const summaryClients = recordConfigSummary.querySelector('#summary-clients');
            if (summaryClients) {
                summaryClients.textContent = `1个客户`;
                summaryClients.style.color = 'red'; // 标记为已更新
            }
        }
    }
    
    // 添加客户到列表
    function addClientToList(name, clientId, isDefault = false) {
        const clientList = document.getElementById('client-list');
        if (!clientList) return;
        
        // 创建新的客户项
        const clientItem = document.createElement('div');
        clientItem.className = 'grid grid-cols-2 gap-2 p-2 border-b client-item';
        clientItem.setAttribute('data-client-id', clientId);
        clientItem.setAttribute('data-is-default', isDefault.toString());
        
        // 设置客户名称样式
        const nameClass = isDefault ? 'text-sm text-blue-600 font-medium' : 'text-sm';
        
        // 设置默认按钮状态
        const defaultBtnDisabled = isDefault ? 'disabled' : '';
        
        clientItem.innerHTML = `
            <div class="${nameClass}">${name}</div>
            <div class="text-sm flex space-x-2">
                <button class="bg-green-500 text-white px-2 py-1 rounded-sm text-xs hover:bg-green-600 set-default-client-btn" ${defaultBtnDisabled}>
                    <i class="fas fa-check"></i> 默认
                </button>
                <button class="bg-red-500 text-white px-2 py-1 rounded-sm text-xs hover:bg-red-600 delete-client-btn">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        `;
        
        // 添加设置默认客户按钮点击事件
        const defaultBtn = clientItem.querySelector('.set-default-client-btn');
        if (defaultBtn) {
            defaultBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                if (this.disabled) return;
                
                // 将所有客户设置为非默认
                document.querySelectorAll('#client-list .client-item').forEach(item => {
                    item.setAttribute('data-is-default', 'false');
                    item.querySelector('div:first-child').classList.remove('text-blue-600', 'font-medium');
                    const btn = item.querySelector('.set-default-client-btn');
                    if (btn) {
                        btn.disabled = false;
                    }
                });
                
                // 设置当前客户为默认
                clientItem.setAttribute('data-is-default', 'true');
                clientItem.querySelector('div:first-child').classList.add('text-blue-600', 'font-medium');
                this.disabled = true;
                
                // 更新默认客户显示区域
                updateDefaultClientDisplay(name, clientId);
                
                // 将默认客户信息传递到下方记录，并删除旧记录
                addDefaultClientToRecordArea(name, clientId);
                
                // 启动工作流闭环
                startWorkflowLoop('设置默认客户');
            });
        }
        
        // 添加删除客户按钮点击事件
        const deleteBtn = clientItem.querySelector('.delete-client-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                
                if (workflowState === 'idle') return;
                
                const isDefault = clientItem.getAttribute('data-is-default') === 'true';
                
                // 如果是默认客户，不允许删除
                if (isDefault) {
                    alert('默认客户不能删除，请先设置其他客户为默认');
                    return;
                }
                
                // 确认删除
                if (confirm(`确定要删除客户"${name}"吗？`)) {
                    clientItem.remove();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('删除客户');
                    
                    // 更新摘要信息
                    updateSummary();
                }
            });
        }
        
        // 添加到列表
        clientList.appendChild(clientItem);
        
        // 更新摘要信息
        updateSummary();
        
        // 如果是默认客户，更新显示区域并传递到下方记录
        if (isDefault) {
            updateDefaultClientDisplay(name, clientId);
            addDefaultClientToRecordArea(name, clientId);
        }
    }
    
    // 将属性和说明内容传递到下区
    function addSpecToRecordArea(specName, specValue) {
        console.log('将属性和说明内容传递到下区:', specName, specValue);
        
        // 生成随机记录编码（如果不存在）
        const recordCodeInput = document.getElementById('record-code');
        if (recordCodeInput && (!recordCodeInput.value || recordCodeInput.value === '自动生成')) {
            const randomCode = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            recordCodeInput.value = randomCode;
        }
        
        // 将属性和说明内容添加到下区的记录配置区域
        // 这里我们可以将属性和说明内容添加到一个列表中，或者更新现有的记录
        
        // 例如，我们可以将属性和说明内容添加到Mfr.Nr.和SKU字段
        const mfrNrInput = document.getElementById('record-mfr-nr');
        const skuInput = document.getElementById('record-sku');
        
        if (mfrNrInput && !mfrNrInput.value) {
            mfrNrInput.value = `${specName}-${Math.floor(Math.random() * 1000)}`;
        }
        
        if (skuInput && !skuInput.value) {
            skuInput.value = `SKU-${specName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // 添加到下区的记录配置区域
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            // 更新记录配置摘要
            const summarySpecs = recordConfigSummary.querySelector('#summary-specs');
            if (summarySpecs) {
                const specsCount = document.querySelectorAll('#specs-list .spec-item').length;
                summarySpecs.textContent = `${specsCount}项属性`;
                summarySpecs.style.color = 'red'; // 标记为已更新
            }
        }
    }
    
    // 更新摘要信息
    function updateSummary() {
        // 规格数量
        const specsCount = document.querySelectorAll('#specs-list .spec-item').length;
        const summarySpecs = document.getElementById('summary-specs');
        if (summarySpecs) {
            summarySpecs.textContent = `${specsCount}项属性`;
        }
        
        // 组套数量
        const kitCount = document.querySelectorAll('#kit-list .kit-item').length;
        const summaryKit = document.getElementById('summary-kit');
        if (summaryKit) {
            summaryKit.textContent = `${kitCount}个产品`;
        }
        
        // 客户数量
        const clientCount = document.querySelectorAll('#client-list .client-item').length;
        const summaryClients = document.getElementById('summary-clients');
        if (summaryClients) {
            summaryClients.textContent = `${clientCount}个客户`;
        }
        
        // 供应商数量
        const vendorCount = document.querySelectorAll('#vendor-list .vendor-item').length;
        const summaryVendors = document.getElementById('summary-vendors');
        if (summaryVendors) {
            summaryVendors.textContent = `${vendorCount}个供应商`;
        }
    }
    
    // 检测工作流闭环条件
    function checkWorkflowLoop(tabId) {
        console.log('检测工作流闭环条件:', tabId);
        
        // 如果工作流闭环已启动，显示提交区域
        if (workflowLoopStarted) {
            const submitArea = document.getElementById('submit-area');
            if (submitArea) {
                submitArea.classList.remove('hidden');
            }
        }
    }
    
    // 启动工作流闭环
    function startWorkflowLoop(reason) {
        console.log('启动工作流闭环，原因:', reason);
        workflowLoopStarted = true;
        
        // 显示提交区域
        const submitArea = document.getElementById('submit-area');
        if (submitArea) {
            submitArea.classList.remove('hidden');
        }
    }
    
    // 初始化上传图片和文件功能
    function initUploadFunctions() {
        console.log('初始化上传图片和文件功能');
        
        // 上传图片功能
        const uploadImageInput = document.getElementById('upload-image');
        if (uploadImageInput) {
            uploadImageInput.addEventListener('change', function(e) {
                if (workflowState === 'idle') {
                    alert('请先点击新建按钮开始配置产品信息');
                    return;
                }
                
                const file = e.target.files[0];
                if (!file) return;
                
                // 检查文件类型
                if (!file.type.startsWith('image/')) {
                    alert('请选择图片文件');
                    return;
                }
                
                // 模拟上传图片
                const reader = new FileReader();
                reader.onload = function(event) {
                    // 更新主图片
                    const mainImage = document.getElementById('product-main-image');
                    if (mainImage) {
                        mainImage.src = event.target.result;
                    }
                    
                    // 添加新的缩略图
                    addThumbnail(event.target.result, file.name);
                    
                    // 更新图片计数器
                    updateImageCounter();
                    
                    // 启动工作流闭环
                    startWorkflowLoop('上传产品图片');
                    
                    // 将图片信息传递到下区
                    addImageToRecordArea(file.name, event.target.result);
                };
                reader.readAsDataURL(file);
                
                // 清空输入框，允许再次选择同一个文件
                uploadImageInput.value = '';
            });
        }
        
        // 上传文件功能
        const uploadFileInput = document.getElementById('upload-file');
        if (uploadFileInput) {
            uploadFileInput.addEventListener('change', function(e) {
                if (workflowState === 'idle') {
                    alert('请先点击新建按钮开始配置产品信息');
                    return;
                }
                
                const file = e.target.files[0];
                if (!file) return;
                
                // 生成随机文件ID
                const fileId = 'file-' + Math.floor(Math.random() * 10000);
                
                // 根据文件类型选择图标
                let fileIcon = 'fa-file';
                let iconColor = 'text-gray-500';
                
                if (file.name.endsWith('.pdf')) {
                    fileIcon = 'fa-file-pdf';
                    iconColor = 'text-red-500';
                } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                    fileIcon = 'fa-file-word';
                    iconColor = 'text-blue-500';
                } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                    fileIcon = 'fa-file-excel';
                    iconColor = 'text-green-500';
                } else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png')) {
                    fileIcon = 'fa-file-image';
                    iconColor = 'text-purple-500';
                }
                
                // 添加文件到列表
                const filesList = document.getElementById('uploaded-files-list');
                if (filesList) {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'cursor-pointer hover:bg-gray-100 p-1 rounded flex justify-between items-center';
                    fileItem.setAttribute('data-file-id', fileId);
                    fileItem.innerHTML = `
                        <div>
                            <i class="fas ${fileIcon} ${iconColor} mr-1"></i>${file.name}
                        </div>
                        <button class="text-red-500 hover:text-red-700 delete-file-btn" data-file-id="${fileId}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    filesList.appendChild(fileItem);
                    
                    // 为删除按钮添加事件
                    const deleteBtn = fileItem.querySelector('.delete-file-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function(e) {
                            e.stopPropagation(); // 阻止事件冒泡
                            if (confirm(`确定要删除文件"${file.name}"吗？`)) {
                                fileItem.remove();
                                // 启动工作流闭环
                                startWorkflowLoop('删除上传文件');
                            }
                        });
                    }
                }
                
                // 启动工作流闭环
                startWorkflowLoop('上传文件');
                
                // 将文件信息传递到下区
                addFileToRecordArea(file.name, fileId);
                
                // 清空输入框，允许再次选择同一个文件
                uploadFileInput.value = '';
            });
        }
        
        // 为现有的删除文件按钮添加事件
        document.querySelectorAll('.delete-file-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                const fileId = this.getAttribute('data-file-id');
                const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
                if (fileItem) {
                    const fileName = fileItem.querySelector('div').textContent.trim();
                    if (confirm(`确定要删除文件"${fileName}"吗？`)) {
                        fileItem.remove();
                        // 启动工作流闭环
                        startWorkflowLoop('删除上传文件');
                    }
                }
            });
        });
    }
    
    // 添加缩略图
    function addThumbnail(imageSrc, imageName) {
        const thumbnailContainer = document.querySelector('.flex.justify-center.space-x-2.mt-2');
        if (!thumbnailContainer) return;
        
        // 移除所有缩略图的选中状态
        thumbnailContainer.querySelectorAll('.border-2').forEach(thumb => {
            thumb.classList.remove('border-blue-500');
            thumb.classList.add('border-gray-200');
        });
        
        // 创建新的缩略图
        const newThumb = document.createElement('div');
        newThumb.className = 'border-2 border-blue-500 p-1 w-12 h-12 flex items-center justify-center';
        newThumb.innerHTML = `<img src="${imageSrc}" alt="${imageName}" class="max-h-full max-w-full">`;
        
        // 添加点击事件
        newThumb.addEventListener('click', function() {
            // 更新主图片
            const mainImage = document.getElementById('product-main-image');
            if (mainImage) {
                mainImage.src = imageSrc;
            }
            
            // 移除所有缩略图的选中状态
            thumbnailContainer.querySelectorAll('.border-2').forEach(thumb => {
                thumb.classList.remove('border-blue-500');
                thumb.classList.add('border-gray-200');
            });
            
            // 添加选中状态
            newThumb.classList.remove('border-gray-200');
            newThumb.classList.add('border-blue-500');
        });
        
        // 添加到容器
        thumbnailContainer.appendChild(newThumb);
    }
    
    // 更新图片计数器
    function updateImageCounter() {
        const counter = document.getElementById('image-counter');
        const thumbnails = document.querySelectorAll('.flex.justify-center.space-x-2.mt-2 > div');
        if (counter) {
            counter.textContent = `${thumbnails.length}/10`;
        }
    }
    
    // 将图片信息传递到下区
    function addImageToRecordArea(imageName, imageSrc) {
        console.log('将图片信息传递到下区:', imageName);
        
        // 生成随机记录编码（如果不存在）
        const recordCodeInput = document.getElementById('record-code');
        if (recordCodeInput && (!recordCodeInput.value || recordCodeInput.value === '自动生成')) {
            const randomCode = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            recordCodeInput.value = randomCode;
        }
        
        // 添加到下区的记录配置区域
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            // 添加一个图片标记
            const imageMarker = document.createElement('div');
            imageMarker.className = 'mt-2 p-1 bg-blue-100 rounded text-sm flex justify-between items-center';
            imageMarker.innerHTML = `
                <div>
                    <i class="fas fa-image text-blue-500 mr-1"></i>产品图片: ${imageName}
                </div>
                <button class="text-red-500 hover:text-red-700 delete-image-marker">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // 添加删除按钮事件
            const deleteBtn = imageMarker.querySelector('.delete-image-marker');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`确定要移除图片"${imageName}"吗？`)) {
                        imageMarker.remove();
                    }
                });
            }
            
            // 添加到记录配置区域
            recordConfigSummary.appendChild(imageMarker);
        }
    }
    
    // 将文件信息传递到下区
    function addFileToRecordArea(fileName, fileId) {
        console.log('将文件信息传递到下区:', fileName, fileId);
        
        // 生成随机记录编码（如果不存在）
        const recordCodeInput = document.getElementById('record-code');
        if (recordCodeInput && (!recordCodeInput.value || recordCodeInput.value === '自动生成')) {
            const randomCode = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            recordCodeInput.value = randomCode;
        }
        
        // 根据文件类型选择图标
        let fileIcon = 'fa-file';
        let iconColor = 'text-gray-500';
        
        if (fileName.endsWith('.pdf')) {
            fileIcon = 'fa-file-pdf';
            iconColor = 'text-red-500';
        } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
            fileIcon = 'fa-file-word';
            iconColor = 'text-blue-500';
        } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
            fileIcon = 'fa-file-excel';
            iconColor = 'text-green-500';
        } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
            fileIcon = 'fa-file-image';
            iconColor = 'text-purple-500';
        }
        
        // 添加到下区的记录配置区域
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            // 添加一个文件标记
            const fileMarker = document.createElement('div');
            fileMarker.className = 'mt-2 p-1 bg-green-100 rounded text-sm flex justify-between items-center';
            fileMarker.setAttribute('data-file-id', fileId);
            fileMarker.innerHTML = `
                <div>
                    <i class="fas ${fileIcon} ${iconColor} mr-1"></i>上传文件: ${fileName}
                </div>
                <button class="text-red-500 hover:text-red-700 delete-file-marker" data-file-id="${fileId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // 添加删除按钮事件
            const deleteBtn = fileMarker.querySelector('.delete-file-marker');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`确定要移除文件"${fileName}"吗？`)) {
                        fileMarker.remove();
                    }
                });
            }
            
            // 添加到记录配置区域
            recordConfigSummary.appendChild(fileMarker);
        }
    }
    
    // 添加新建按钮事件
    const startNewBtn = document.getElementById('start-new-btn');
    if (startNewBtn) {
        startNewBtn.addEventListener('click', function() {
            console.log('点击了新建按钮');
            
            // 隐藏待机状态遮罩
            const idleOverlay = document.getElementById('idle-overlay');
            if (idleOverlay) {
                idleOverlay.classList.add('hidden');
            }
            
            // 更新工作流状态
            workflowState = 'new';
            
            // 初始化显示规格TAB
            switchTab('specs');
        });
    }
    
    // 添加取消按钮事件
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('点击了取消按钮');
            
            // 确认取消
            if (confirm('确定要取消当前操作吗？所有未保存的数据将丢失。')) {
                // 显示待机状态遮罩
                const idleOverlay = document.getElementById('idle-overlay');
                if (idleOverlay) {
                    idleOverlay.classList.remove('hidden');
                }
                
                // 更新工作流状态
                workflowState = 'idle';
                workflowLoopStarted = false;
                
                // 隐藏提交区域
                const submitArea = document.getElementById('submit-area');
                if (submitArea) {
                    submitArea.classList.add('hidden');
                }
            }
        });
    }
    
    // 添加提交按钮事件
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            console.log('点击了提交按钮');
            
            // 检查必要的字段
            const recordCode = document.getElementById('record-code').value;
            const productCode = document.getElementById('record-product-code').value;
            
            if (!recordCode || !productCode) {
                alert('请填写记录编码和产品货号');
                return;
            }
            
            // 获取其他字段值
            const mfrNr = document.getElementById('record-mfr-nr').value;
            const sku = document.getElementById('record-sku').value;
            const defaultPrice = document.getElementById('record-default-price').value;
            const minPrice = document.getElementById('record-min-price').value;
            const defaultForeignPrice = document.getElementById('record-default-foreign-price').value;
            const maxForeignPrice = document.getElementById('record-max-foreign-price').value;
            const currency = document.getElementById('record-currency').value;
            
            // 确认提交
            if (confirm('确定要保存当前记录吗？')) {
                // 收集记录数据
                const recordData = {
                    recordCode: recordCode,
                    productCode: productCode,
                    mfrNr: mfrNr,
                    sku: sku,
                    defaultPrice: defaultPrice,
                    minPrice: minPrice,
                    defaultForeignPrice: defaultForeignPrice,
                    maxForeignPrice: maxForeignPrice,
                    currency: currency,
                    specs: [],
                    images: [],
                    files: [],
                    vendor: null,
                    client: null,
                    timestamp: new Date().toISOString()
                };
                
                // 收集规格信息
                document.querySelectorAll('#specs-list .spec-item').forEach(item => {
                    const specName = item.querySelector('div:first-child').textContent;
                    const specValue = item.querySelector('.spec-value').textContent;
                    recordData.specs.push({ name: specName, value: specValue });
                });
                
                // 收集默认供应商信息
                const vendorMarker = document.querySelector('.vendor-marker');
                if (vendorMarker) {
                    const vendorName = vendorMarker.textContent.replace('默认供应商: ', '').trim();
                    const vendorId = vendorMarker.getAttribute('data-vendor-id');
                    recordData.vendor = { id: vendorId, name: vendorName };
                }
                
                // 收集默认客户信息
                const clientMarker = document.querySelector('.client-marker');
                if (clientMarker) {
                    const clientName = clientMarker.textContent.replace('默认客户: ', '').trim();
                    const clientId = clientMarker.getAttribute('data-client-id');
                    recordData.client = { id: clientId, name: clientName };
                }
                
                // 收集图片信息
                document.querySelectorAll('.image-marker').forEach(marker => {
                    const imageName = marker.textContent.trim().replace('上传图片: ', '');
                    recordData.images.push({ name: imageName });
                });
                
                // 收集文件信息
                document.querySelectorAll('.file-marker').forEach(marker => {
                    const fileName = marker.textContent.trim().replace('上传文件: ', '');
                    const fileId = marker.getAttribute('data-file-id');
                    recordData.files.push({ id: fileId, name: fileName });
                });
                
                // 将记录数据添加到左区
                addRecordToLeftPanel(recordData);
                
                // 显示成功消息
                alert(`记录已成功保存！\n记录编码: ${recordCode}\n产品货号: ${productCode}`);
                
                // 显示待机状态遮罩
                const idleOverlay = document.getElementById('idle-overlay');
                if (idleOverlay) {
                    idleOverlay.classList.remove('hidden');
                }
                
                // 更新工作流状态
                workflowState = 'idle';
                workflowLoopStarted = false;
                
                // 隐藏提交区域
                const submitArea = document.getElementById('submit-area');
                if (submitArea) {
                    submitArea.classList.add('hidden');
                }
                
                // 清空右区表单
                clearRightPanel();
            }
        });
    }
    
    // 将记录添加到左区
    function addRecordToLeftPanel(recordData) {
        // 获取左区记录列表
        const leftRecordsList = document.getElementById('left-records-list');
        if (!leftRecordsList) {
            console.error('左区记录列表不存在');
            return;
        }
        
        // 创建新的记录项
        const recordItem = document.createElement('div');
        recordItem.className = 'p-3 border-b hover:bg-gray-50 cursor-pointer record-item';
        recordItem.setAttribute('data-record-code', recordData.recordCode);
        recordItem.setAttribute('data-product-code', recordData.productCode);
        
        // 格式化时间
        const timestamp = new Date(recordData.timestamp);
        const formattedDate = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')}`;
        
        // 设置记录项内容
        recordItem.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="font-medium text-blue-600">${recordData.recordCode}</div>
                <div class="text-xs text-gray-500">${formattedDate}</div>
            </div>
            <div class="text-sm mt-1">产品货号: ${recordData.productCode}</div>
            <div class="text-xs text-gray-600 mt-1">
                <span class="mr-2">规格: ${recordData.specs.length}项</span>
                <span class="mr-2">图片: ${recordData.images.length}张</span>
                <span>文件: ${recordData.files.length}个</span>
            </div>
        `;
        
        // 添加点击事件
        recordItem.addEventListener('click', function() {
            // 在这里可以添加点击记录项的处理逻辑
            alert(`点击了记录: ${recordData.recordCode}`);
        });
        
        // 添加到左区记录列表
        leftRecordsList.prepend(recordItem); // 添加到列表头部
    }
    
    // 清空右区表单
    function clearRightPanel() {
        // 清空记录配置信息
        document.getElementById('record-code').value = '';
        document.getElementById('record-product-code').value = '';
        document.getElementById('record-mfr-nr').value = '';
        document.getElementById('record-sku').value = '';
        document.getElementById('record-default-price').value = '';
        document.getElementById('record-min-price').value = '';
        document.getElementById('record-default-foreign-price').value = '';
        document.getElementById('record-max-foreign-price').value = '';
        document.getElementById('record-currency').value = 'USD';
        
        // 清空规格列表
        const specsList = document.getElementById('specs-list');
        if (specsList) {
            while (specsList.firstChild) {
                specsList.removeChild(specsList.firstChild);
            }
        }
        
        // 清空组套列表
        const kitList = document.getElementById('kit-list');
        if (kitList) {
            while (kitList.firstChild) {
                kitList.removeChild(kitList.firstChild);
            }
        }
        
        // 清空主图片
        const mainImage = document.getElementById('product-main-image');
        if (mainImage) {
            mainImage.src = 'assets/img/no-image.png';
        }
        
        // 清空缩略图列表
        const thumbnailContainer = document.querySelector('.flex.justify-center.space-x-2.mt-2');
        if (thumbnailContainer) {
            while (thumbnailContainer.firstChild) {
                thumbnailContainer.removeChild(thumbnailContainer.firstChild);
            }
        }
        
        // 清空上传文件列表
        const filesList = document.getElementById('uploaded-files-list');
        if (filesList) {
            while (filesList.firstChild) {
                filesList.removeChild(filesList.firstChild);
            }
        }
        
        // 清空记录配置区域的标记
        const recordConfigSummary = document.querySelector('.mt-4.p-3.bg-gray-50.rounded');
        if (recordConfigSummary) {
            const markers = recordConfigSummary.querySelectorAll('.vendor-marker, .client-marker, .image-marker, .file-marker');
            markers.forEach(marker => marker.remove());
        }
        
        // 重置摘要信息
        updateSummary();
    }
    
    // 初始化所有功能
    initSpecsManagement();
    initKitManagement();
    initVendorManagement();
    initClientManagement();
    
    // 更新摘要信息
    updateSummary();
    
    // 初始化上传图片和文件功能
    initUploadFunctions();
    
    // 初始化上区编辑/展示状态切换
    initDisplayEditModeSwitch();
    
    // 初始化工作流状态管理
    initWorkflowStateManagement();
    
    // 初始化产品类型处理
    initProductTypeHandler();
});

// 初始化产品类型处理功能
function initProductTypeHandler() {
    // 初始化UI状态
    updateUIByProductType();
}

// 设置产品类型（从产品管理传递过来）
function setProductType(type) {
    // 记录旧类型
    const oldType = productType;
    
    // 更新产品类型
    productType = type;
    console.log(`产品类型设置为 ${type}`);
    
    // 更新显示
    const typeDisplay = document.getElementById('product-type-display');
    const typeBadge = document.getElementById('product-type-badge');
    
    if (typeDisplay) {
        typeDisplay.textContent = type === 'single' ? '单件' : '组套';
    }
    
    if (typeBadge) {
        typeBadge.textContent = type === 'single' ? '单件' : '组套';
        
        // 更新标签样式
        if (type === 'single') {
            typeBadge.className = 'ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full';
        } else {
            typeBadge.className = 'ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full';
        }
    }
    
    // 根据新类型更新UI
    updateUIByProductType();
    
    
    // 取消按钮点击事件
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // 取消当前操作并返回待机状态
            if (confirm('确定要取消当前操作吗？所有未保存的数据将丢失。')) {
                // 清空右区数据
                clearRightPanel();
                
                // 切换到待机状态
                changeWorkflowState('idle');
            }
        });
    }
    
    // 初始化UI状态
    updateUIByWorkflowState();
}

// 切换工作流状态
function changeWorkflowState(newState) {
    // 记录旧状态
    const oldState = workflowState;
    
    // 更新工作流状态
    workflowState = newState;
    console.log(`工作流状态从 ${oldState} 切换到 ${newState}`);
    
    // 根据新状态更新UI
    updateUIByWorkflowState();
    
    // 如果是从待机状态切换到新建或编辑状态，启动工作流闭环
    if (oldState === 'idle' && (newState === 'new' || newState === 'edit')) {
        startWorkflowLoop();
    }
}

// 根据工作流状态更新UI
function updateUIByWorkflowState() {
    // 获取相关按钮和区域
    const newBtn = document.getElementById('new-btn');
    const editBtn = document.getElementById('edit-btn');
    const saveRecordBtn = document.getElementById('save-record-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const tabButtons = document.querySelectorAll('#tab-buttons button');
    const attributeInputs = document.querySelectorAll('.attribute-input');
    const vendorInputs = document.querySelectorAll('.vendor-input');
    const clientInputs = document.querySelectorAll('.client-input');
    
    // 根据工作流状态更新按钮状态
    if (newBtn && editBtn && saveRecordBtn && cancelBtn) {
        switch (workflowState) {
            case 'idle':
                // 待机状态：只有新建按钮可用
                newBtn.disabled = false;
                editBtn.disabled = true;
                saveRecordBtn.disabled = true;
                cancelBtn.disabled = true;
                
                // 禁用所有TAB按钮
                tabButtons.forEach(button => {
                    button.disabled = true;
                });
                
                // 禁用所有输入框
                disableAllInputs();
                break;
                
            case 'new':
                // 新建状态：新建按钮不可用，其他按钮可用
                newBtn.disabled = true;
                editBtn.disabled = true;
                saveRecordBtn.disabled = false;
                cancelBtn.disabled = false;
                
                // 启用所有TAB按钮
                tabButtons.forEach(button => {
                    button.disabled = false;
                });
                
                // 启用所有输入框
                enableAllInputs();
                break;
                
            case 'edit':
                // 编辑状态：编辑按钮不可用，其他按钮可用
                newBtn.disabled = true;
                editBtn.disabled = true;
                saveRecordBtn.disabled = false;
                cancelBtn.disabled = false;
                
                // 启用所有TAB按钮
                tabButtons.forEach(button => {
                    button.disabled = false;
                });
                
                // 启用所有输入框
                enableAllInputs();
                break;
                
            case 'modify':
                // 修改状态：新建和编辑按钮不可用，其他按钮可用
                newBtn.disabled = true;
                editBtn.disabled = true;
                saveRecordBtn.disabled = false;
                cancelBtn.disabled = false;
                
                // 启用所有TAB按钮
                tabButtons.forEach(button => {
                    button.disabled = false;
                });
                
                // 启用所有输入框
                enableAllInputs();
                break;
        }
    }
    
    // 更新上区编辑/展示状态
    updateUpperAreaByWorkflowState();
}

// 更新上区编辑/展示状态
function updateUpperAreaByWorkflowState() {
    const upperArea = document.querySelector('.mb-4.flex.flex-col.md\\:flex-row.gap-4');
    if (!upperArea) return;
    
    const imagesArea = upperArea.querySelector('.w-2/3');
    const filesArea = upperArea.querySelector('.w-1/3');
    
    if (!imagesArea || !filesArea) return;
    
    // 根据工作流状态更新上区显示
    switch (workflowState) {
        case 'idle':
            // 待机状态：只显示展示模式
            if (imagesArea) {
                imagesArea.querySelector('.display-mode').classList.remove('hidden');
                imagesArea.querySelector('.edit-mode').classList.add('hidden');
            }
            
            if (filesArea) {
                filesArea.querySelector('.display-mode').classList.remove('hidden');
                filesArea.querySelector('.edit-mode').classList.add('hidden');
            }
            break;
            
        case 'new':
        case 'edit':
        case 'modify':
            // 新建/编辑/修改状态：默认显示展示模式，但可以切换到编辑模式
            // 这里不做任何改变，因为用户可以通过编辑按钮自行切换
            break;
    }
}

// 启用所有输入框
function enableAllInputs() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // 排除特定的输入框，如产品编码等
        if (!input.classList.contains('no-edit')) {
            input.disabled = false;
        }
    });
}

// 禁用所有输入框
function disableAllInputs() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

// 启动工作流闭环
function startWorkflowLoop() {
    workflowLoopStarted = true;
    console.log('工作流闭环已启动');
    
    // 这里可以添加工作流闭环的初始化逻辑
    // 例如清空之前的数据，准备新的数据等
}

// 保存记录
function saveRecord() {
    // 生成记录编号
    currentRecordNumber = generateRecordNumber();
    
    // 收集当前配置的所有数据
    const recordData = collectRecordData();
    
    // 将记录添加到左区
    addRecordToLeftPanel(recordData);
    
    // 清空右区数据
    clearRightPanel();
    
    // 切换到待机状态
    changeWorkflowState('idle');
    
    // 提示保存成功
    alert(`记录已保存，记录编号：${currentRecordNumber}`);
}

// 生成记录编号
function generateRecordNumber() {
    // 生成格式为 YYYYMMDD-XXX 的记录编号
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${year}${month}${day}-${random}`;
}

// 收集记录数据
function collectRecordData() {
    return {
        recordNumber: currentRecordNumber,
        productCode: currentProductCode,
        productType: productType,
        attributes: productAttributes,
        vendors: vendors,
        clients: clients,
        defaultVendor: defaultVendor,
        defaultClient: defaultClient,
        // 添加其他需要保存的数据
    };
}

// 将记录添加到左区
function addRecordToLeftPanel(recordData) {
    // 获取左区记录列表
    const recordsList = document.getElementById('records-list');
    if (!recordsList) return;
    
    // 创建记录项
    const recordItem = document.createElement('div');
    recordItem.className = 'bg-white p-3 rounded shadow mb-2 cursor-pointer hover:bg-gray-50';
    recordItem.setAttribute('data-record-id', recordData.recordNumber);
    
    // 设置记录内容
    recordItem.innerHTML = `
        <div class="font-bold">${recordData.recordNumber}</div>
        <div class="text-sm text-gray-600">产品编码: ${recordData.productCode}</div>
        <div class="text-sm text-gray-600">类型: ${recordData.productType === 'single' ? '单件' : '组套'}</div>
        <div class="text-sm text-gray-600">供应商: ${recordData.defaultVendor ? recordData.defaultVendor.name : '无'}</div>
        <div class="text-sm text-gray-600">客户: ${recordData.defaultClient ? recordData.defaultClient.name : '无'}</div>
    `;
    
    // 添加点击事件
    recordItem.addEventListener('click', function() {
        // 加载记录详情
        loadRecordDetails(recordData.recordNumber);
    });
    
    // 添加到记录列表
    recordsList.appendChild(recordItem);
}

// 加载记录详情
function loadRecordDetails(recordNumber) {
    // 这里可以添加加载记录详情的逻辑
    // 例如从数据库中获取记录详情，然后显示在右区
    console.log(`加载记录详情: ${recordNumber}`);
    
    // 切换到编辑状态
    changeWorkflowState('edit');
}

// 清空右区
function clearRightPanel() {
    // 清空产品属性
    productAttributes = [];
    
    // 清空供应商和客户
    vendors = [];
    clients = [];
    defaultVendor = null;
    defaultClient = null;
    
    // 清空当前产品编码和记录编号
    currentProductCode = '';
    currentRecordNumber = '';
    
    // 清空属性表格
    const attributesTable = document.getElementById('attributes-table');
    if (attributesTable) {
        attributesTable.querySelector('tbody').innerHTML = '';
    }
    
    // 清空供应商列表
    const vendorsList = document.getElementById('vendors-list');
    if (vendorsList) {
        vendorsList.innerHTML = '';
    }
    
    // 清空客户列表
    const clientsList = document.getElementById('clients-list');
    if (clientsList) {
        clientsList.innerHTML = '';
    }
    
    // 清空上传的图片和文件
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    if (uploadedImagesPreview) {
        uploadedImagesPreview.innerHTML = '';
    }
    
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    if (uploadedFilesList) {
        uploadedFilesList.innerHTML = '';
    }
    
    // 更新展示区域
    updateFilesDisplayList();
    updateThumbnailsList();
    
    // 重置TAB到规格TAB
    switchTab('specs');
}

// 取消操作
function cancelOperation() {
    // 提示用户确认取消
    if (confirm('确定要取消当前操作吗？所有未保存的数据将丢失。')) {
        // 清空右区数据
        clearRightPanel();
        
        // 切换到待机状态
        changeWorkflowState('idle');
    }
}

// 初始化上区编辑/展示状态切换
function initDisplayEditModeSwitch() {
    // 文件区域编辑按钮
    const editFilesBtn = document.querySelector('.edit-files-btn');
    const doneEditFilesBtn = document.querySelector('.done-edit-files-btn');
    
    // 图片区域编辑按钮
    const editImagesBtn = document.querySelector('.edit-images-btn');
    const doneEditImagesBtn = document.querySelector('.done-edit-images-btn');
    
    // 文件区域编辑/展示模式切换
    if (editFilesBtn && doneEditFilesBtn) {
        // 切换到编辑模式
        editFilesBtn.addEventListener('click', function() {
            if (workflowState === 'idle') {
                alert('请先点击新建按钮开始配置产品信息');
                return;
            }
            
            const filesArea = this.closest('.w-1/3');
            filesArea.querySelector('.display-mode').classList.add('hidden');
            filesArea.querySelector('.edit-mode').classList.remove('hidden');
        });
        
        // 切换回展示模式
        doneEditFilesBtn.addEventListener('click', function() {
            const filesArea = this.closest('.w-1/3');
            filesArea.querySelector('.edit-mode').classList.add('hidden');
            filesArea.querySelector('.display-mode').classList.remove('hidden');
            
            // 更新展示区域的文件列表
            updateFilesDisplayList();
        });
    }
    
    // 图片区域编辑/展示模式切换
    if (editImagesBtn && doneEditImagesBtn) {
        // 切换到编辑模式
        editImagesBtn.addEventListener('click', function() {
            if (workflowState === 'idle') {
                alert('请先点击新建按钮开始配置产品信息');
                return;
            }
            
            const imagesArea = this.closest('.w-2/3');
            imagesArea.querySelector('.display-mode').classList.add('hidden');
            imagesArea.querySelector('.edit-mode').classList.remove('hidden');
        });
        
        // 切换回展示模式
        doneEditImagesBtn.addEventListener('click', function() {
            const imagesArea = this.closest('.w-2/3');
            imagesArea.querySelector('.edit-mode').classList.add('hidden');
            imagesArea.querySelector('.display-mode').classList.remove('hidden');
            
            // 更新缩略图列表
            updateThumbnailsList();
        });
    }
}

// 更新文件展示列表
function updateFilesDisplayList() {
    const filesDisplayList = document.getElementById('files-display-list');
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    
    if (!filesDisplayList || !uploadedFilesList) return;
    
    // 清空展示列表
    filesDisplayList.innerHTML = '';
    
    // 从上传文件列表复制文件到展示列表
    uploadedFilesList.querySelectorAll('.cursor-pointer').forEach(fileItem => {
        const fileIcon = fileItem.querySelector('i').cloneNode(true);
        const fileName = fileItem.querySelector('div').textContent.trim();
        const fileId = fileItem.getAttribute('data-file-id');
        
        const fileLink = document.createElement('a');
        fileLink.href = '#';
        fileLink.className = 'block hover:bg-gray-100 p-1 rounded';
        fileLink.setAttribute('data-file-id', fileId);
        fileLink.appendChild(fileIcon);
        fileLink.appendChild(document.createTextNode(' ' + fileName));
        
        // 添加点击事件以模拟文件下载
        fileLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert(`模拟下载文件: ${fileName}`);
        });
        
        filesDisplayList.appendChild(fileLink);
    });
    
    // 如果没有文件，显示提示信息
    if (filesDisplayList.children.length === 0) {
        const noFilesMsg = document.createElement('div');
        noFilesMsg.className = 'text-gray-500 text-center p-2';
        noFilesMsg.textContent = '暂无文件资料';
        filesDisplayList.appendChild(noFilesMsg);
    }
}

// 更新缩略图列表
function updateThumbnailsList() {
    const thumbnailsContainer = document.querySelector('.display-mode .flex.justify-center.space-x-2.mt-2');
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    
    if (!thumbnailsContainer || !uploadedImagesPreview) return;
    
    // 如果有上传的图片，更新缩略图列表
    if (uploadedImagesPreview.children.length > 0) {
        // 清空缩略图容器
        thumbnailsContainer.innerHTML = '';
        
        // 从上传图片预览复制图片到缩略图列表
        Array.from(uploadedImagesPreview.children).forEach((imgPreview, index) => {
            const imgSrc = imgPreview.querySelector('img').src;
            
            const thumbDiv = document.createElement('div');
            thumbDiv.className = index === 0 ? 'border-2 border-blue-500 p-1 w-12 h-12 flex items-center justify-center' : 'border p-1 w-12 h-12 flex items-center justify-center';
            
            const thumbImg = document.createElement('img');
            thumbImg.src = imgSrc;
            thumbImg.alt = `缩略图${index + 1}`;
            thumbImg.className = 'max-h-full max-w-full';
            
            thumbDiv.appendChild(thumbImg);
            thumbnailsContainer.appendChild(thumbDiv);
            
            // 添加点击事件以切换主图片
            thumbDiv.addEventListener('click', function() {
                // 移除所有缩略图的选中状态
                thumbnailsContainer.querySelectorAll('.border-2').forEach(thumb => {
                    thumb.classList.remove('border-blue-500');
                    thumb.classList.add('border-gray-200');
                });
                
                // 添加当前缩略图的选中状态
                this.classList.remove('border-gray-200');
                this.classList.add('border-blue-500');
                
                // 更新主图片
                const mainImage = document.getElementById('product-main-image');
                if (mainImage) {
                    mainImage.src = imgSrc;
                }
            });
        });
        
        // 更新主图片
        const mainImage = document.getElementById('product-main-image');
        const firstThumb = uploadedImagesPreview.querySelector('img');
        if (mainImage && firstThumb) {
            mainImage.src = firstThumb.src;
        }
        
        // 更新图片计数器
        const imageCounter = document.getElementById('image-counter');
        if (imageCounter) {
            imageCounter.textContent = `1/${uploadedImagesPreview.children.length}`;
        }
    }
}
<!-- 在页面底部的脚本引用部分添加以下内容 -->
<script src="assets/js/file-upload-service.js"></script>