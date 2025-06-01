// 右区工作流管理
document.addEventListener('DOMContentLoaded', function() {
    // 获取右区面板
    const rightPanel = document.getElementById('right-panel');
    
    // 如果右区面板不存在，则退出
    if (!rightPanel) return;
    
    // 当前工作流状态
    let currentWorkflowState = 'idle'; // idle, new, edit, modify
    
    // 获取按钮元素
    const newRecordBtn = document.getElementById('new-record-btn');
    const editBtn = document.getElementById('edit-btn');
    const modifyBtn = document.getElementById('modify-btn');
    const saveRecordBtn = document.getElementById('save-record-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const startNewBtn = document.getElementById('start-new-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // 获取其他UI元素
    const idleOverlay = document.getElementById('idle-overlay');
    const currentStatus = document.getElementById('current-status');
    const submitArea = document.getElementById('submit-area');
    const recordConfigInfo = document.getElementById('record-config-info');
    
    // 初始化工作流状态
    setWorkflowState('idle');
    
    // 添加按钮事件监听器
    if (startNewBtn) {
        startNewBtn.addEventListener('click', function() {
            setWorkflowState('new');
        });
    }
    
    if (newRecordBtn) {
        newRecordBtn.addEventListener('click', function() {
            setWorkflowState('new');
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            setWorkflowState('edit');
        });
    }
    
    if (modifyBtn) {
        modifyBtn.addEventListener('click', function() {
            setWorkflowState('modify');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // 确认取消
            if (confirm('确定要取消当前操作吗？所有未保存的数据将丢失。')) {
                setWorkflowState('idle');
                resetAllData();
            }
        });
    }
    
    if (saveRecordBtn) {
        saveRecordBtn.addEventListener('click', function() {
            // 模拟保存记录
            if (validateRecordData()) {
                alert('记录已保存，已绑定到产品编号');
                setWorkflowState('idle');
                resetAllData();
            }
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            // 模拟提交数据
            if (validateRecordData()) {
                alert('数据已提交并绑定到产品编号，闭环完成');
                setWorkflowState('idle');
                resetAllData();
            }
        });
    }
    
    // 验证记录数据
    function validateRecordData() {
        // 获取必填字段
        const mfrNr = document.getElementById('mfr-nr').value;
        const sku = document.getElementById('sku').value;
        const defaultPrice = document.getElementById('default-price').value;
        
        // 简单验证
        if (!mfrNr.trim()) {
            alert('请输入Mfr.Nr.');
            return false;
        }
        
        if (!sku.trim()) {
            alert('请输入SKU');
            return false;
        }
        
        if (!defaultPrice.trim() || isNaN(parseFloat(defaultPrice))) {
            alert('请输入有效的默认人民币价格');
            return false;
        }
        
        return true;
    }
    
    // 重置所有数据
    function resetAllData() {
        // 重置记录配置信息
        if (recordConfigInfo) {
            recordConfigInfo.classList.add('hidden');
        }
        
        // 重置输入字段
        document.getElementById('mfr-nr').value = '';
        document.getElementById('sku').value = '';
        document.getElementById('default-price').value = '';
        document.getElementById('foreign-price').value = '';
        document.getElementById('currency').selectedIndex = 0;
        
        // 重置规格列表
        const specsList = document.getElementById('specs-list');
        if (specsList) {
            // 保留表头和默认项
            const tableHeader = specsList.querySelector('.grid.grid-cols-2.gap-2.p-2.bg-gray-200');
            const defaultItems = Array.from(specsList.querySelectorAll('.spec-item')).slice(0, 3); // 保留前三个默认属性
            
            specsList.innerHTML = '';
            if (tableHeader) specsList.appendChild(tableHeader);
            defaultItems.forEach(item => specsList.appendChild(item));
            
            // 移除红色标记
            specsList.querySelectorAll('.text-red-500').forEach(el => {
                el.classList.remove('text-red-500');
            });
        }
        
        // 重置组套列表
        const kitItemsList = document.getElementById('kit-items-list');
        if (kitItemsList) {
            // 保留表头
            const tableHeader = kitItemsList.querySelector('.grid.grid-cols-2.gap-2.p-2.bg-gray-200');
            kitItemsList.innerHTML = '';
            if (tableHeader) kitItemsList.appendChild(tableHeader);
        }
        
        // 重置供应商和客户Tab颜色
        const vendorTab = document.getElementById('vendor-tab');
        const clientTab = document.getElementById('client-tab');
        
        if (vendorTab) {
            vendorTab.classList.remove('text-green-500', 'font-semibold');
            vendorTab.classList.add('text-gray-500');
        }
        
        if (clientTab) {
            clientTab.classList.remove('text-green-500', 'font-semibold');
            clientTab.classList.add('text-gray-500');
        }
        
        // 清空产品明细信息
        const kitDetailInfo = document.getElementById('kit-detail-info');
        if (kitDetailInfo) {
            document.getElementById('kit-detail-code').textContent = '--';
            document.getElementById('kit-detail-name').textContent = '--';
            document.getElementById('kit-detail-spec').textContent = '--';
            document.getElementById('kit-detail-quantity').textContent = '--';
        }
    }
    
    // 设置工作流状态
    function setWorkflowState(state) {
        currentWorkflowState = state;
        rightPanel.dataset.state = state;
        
        // 更新UI状态
        if (currentStatus) {
            currentStatus.textContent = getStatusText(state);
        }
        
        // 显示/隐藏待机遮罩
        if (idleOverlay) {
            idleOverlay.style.display = state === 'idle' ? 'flex' : 'none';
        }
        
        // 显示/隐藏提交区域
        if (submitArea) {
            submitArea.style.display = state === 'idle' ? 'none' : 'block';
        }
        
        // 更新按钮状态
        updateButtonStates(state);
    }
    
    // 更新按钮状态
    function updateButtonStates(state) {
        switch (state) {
            case 'idle':
                // 在待机状态下，只有新建按钮可用
                newRecordBtn.disabled = false;
                editBtn.disabled = true;
                modifyBtn.disabled = true;
                saveRecordBtn.disabled = true;
                break;
            case 'new':
                // 在新建状态下，编辑和修改按钮不可用
                newRecordBtn.disabled = true;
                editBtn.disabled = true;
                modifyBtn.disabled = true;
                saveRecordBtn.disabled = false;
                break;
            case 'edit':
                // 在编辑状态下，新建按钮不可用
                newRecordBtn.disabled = true;
                editBtn.disabled = true;
                modifyBtn.disabled = false;
                saveRecordBtn.disabled = false;
                break;
            case 'modify':
                // 在修改状态下，新建和编辑按钮不可用
                newRecordBtn.disabled = true;
                editBtn.disabled = true;
                modifyBtn.disabled = true;
                saveRecordBtn.disabled = false;
                break;
        }
        
        // 更新按钮样式
        updateButtonStyles();
    }
    
    // 更新按钮样式
    function updateButtonStyles() {
        const buttons = [newRecordBtn, editBtn, modifyBtn, saveRecordBtn];
        buttons.forEach(button => {
            if (button) {
                if (button.disabled) {
                    button.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    button.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    }
    
    // 开始新建记录
    function startNewRecord() {
        // 设置状态为新建
        setWorkflowState('new');
        
        // 清空表单
        clearFormData();
        
        // 激活规格TAB
        activateTab('specs');
    }
    
    // 开始编辑记录
    function startEditRecord() {
        // 设置状态为编辑
        setWorkflowState('edit');
    }
    
    // 开始修改记录
    function startModifyRecord() {
        // 设置状态为修改
        setWorkflowState('modify');
    }
    
    // 保存为记录
    function saveAsRecord() {
        // 验证数据
        if (!validateData()) {
            alert('请填写必要的信息');
            return;
        }
        
        // 收集数据
        const data = collectFormData();
        
        // 模拟保存数据
        console.log('保存记录数据:', data);
        
        // 显示成功消息
        alert('记录已保存，工作流闭环完成');
        
        // 重置状态
        setWorkflowState('idle');
    }
    
    // 取消操作
    function cancelOperation() {
        // 确认取消
        if (confirm('确定要取消当前操作吗？所有未保存的更改将丢失。')) {
            // 重置状态
            setWorkflowState('idle');
        }
    }
    
    // 提交数据
    function submitData() {
        // 验证数据
        if (!validateData()) {
            alert('请填写必要的信息');
            return;
        }
        
        // 收集数据
        const data = collectFormData();
        
        // 模拟提交数据
        console.log('提交数据:', data);
        
        // 显示成功消息
        alert('数据已提交');
        
        // 根据当前状态决定下一步
        switch (currentWorkflowState) {
            case 'new':
                // 新建状态下提交后，转为编辑状态
                setWorkflowState('edit');
                break;
            case 'edit':
            case 'modify':
                // 编辑或修改状态下提交后，保持当前状态
                break;
        }
    }
    
    // 清空表单数据
    function clearFormData() {
        // 清空供应商详细信息
        document.getElementById('mfr-nr').value = '';
        document.getElementById('default-price').value = '';
        
        // 清空客户详细信息
        document.getElementById('sku').value = '';
        document.getElementById('last-transaction-price').value = '';
        document.getElementById('latest-quote').value = '';
        document.getElementById('profit-margin').value = '';
        
        // 清空组套额外信息
        document.getElementById('kit-total-price').value = '0.00';
        document.getElementById('packaging-fee').value = '0.00';
        document.getElementById('material-fee').value = '0.00';
        document.getElementById('labor-fee').value = '0.00';
        document.getElementById('other-fee').value = '0.00';
    }
    
    // 验证表单数据
    function validateData() {
        // 根据当前激活的TAB进行验证
        const activeTabId = document.querySelector('#tab-buttons button.text-blue-600').id;
        
        switch (activeTabId) {
            case 'specs-tab':
                // 验证规格信息
                return validateSpecsData();
            case 'kit-tab':
                // 验证组套信息
                return validateKitData();
            case 'vendor-tab':
                // 验证供应商信息
                return validateVendorData();
            case 'client-tab':
                // 验证客户信息
                return validateClientData();
            default:
                return true;
        }
    }
    
    // 验证规格信息
    function validateSpecsData() {
        // 这里添加规格信息的验证逻辑
        return true;
    }
    
    // 验证组套信息
    function validateKitData() {
        // 这里添加组套信息的验证逻辑
        return true;
    }
    
    // 验证供应商信息
    function validateVendorData() {
        // 验证供应商Mfr.Nr.和默认价格
        const mfrNr = document.getElementById('mfr-nr').value;
        const defaultPrice = document.getElementById('default-price').value;
        
        return mfrNr.trim() !== '' && defaultPrice.trim() !== '';
    }
    
    // 验证客户信息
    function validateClientData() {
        // 验证客户SKU和最新报价
        const sku = document.getElementById('sku').value;
        const latestQuote = document.getElementById('latest-quote').value;
        
        return sku.trim() !== '' && latestQuote.trim() !== '';
    }
    
    // 收集表单数据
    function collectFormData() {
        // 收集基本信息
        const data = {
            productCode: document.getElementById('product-code').textContent,
            productCategory: document.getElementById('product-category').textContent,
            specs: collectSpecsData(),
            kitItems: collectKitData(),
            vendor: collectVendorData(),
            client: collectClientData()
        };
        
        return data;
    }
    
    // 收集规格数据
    function collectSpecsData() {
        const specs = [];
        const specItems = document.querySelectorAll('#specs-list .spec-item');
        
        specItems.forEach(item => {
            const name = item.querySelector('span:first-child').textContent;
            const value = item.querySelector('.spec-value').textContent;
            
            specs.push({ name, value });
        });
        
        return specs;
    }
    
    // 收集组套数据
    function collectKitData() {
        const kitItems = [];
        const items = document.querySelectorAll('#kit-items-list .kit-item');
        
        items.forEach(item => {
            const name = item.querySelector('span:first-child').textContent;
            const quantity = item.querySelector('span:last-child').textContent.replace('数量: ', '');
            
            kitItems.push({ name, quantity });
        });
        
        // 收集组套额外信息
        if (kitItems.length > 0) {
            const kitExtraInfo = {
                totalPrice: document.getElementById('kit-total-price').value,
                packagingFee: document.getElementById('packaging-fee').value,
                materialFee: document.getElementById('material-fee').value,
                laborFee: document.getElementById('labor-fee').value,
                otherFee: document.getElementById('other-fee').value
            };
            
            return { items: kitItems, extraInfo: kitExtraInfo };
        }
        
        return { items: kitItems };
    }
    
    // 收集供应商数据
    function collectVendorData() {
        return {
            name: document.querySelector('#vendor-details h3').textContent,
            mfrNr: document.getElementById('mfr-nr').value,
            defaultPrice: document.getElementById('default-price').value,
            lowestPrice: document.getElementById('lowest-price').value
        };
    }
    
    // 收集客户数据
    function collectClientData() {
        return {
            name: document.querySelector('#client-details h3').textContent,
            sku: document.getElementById('sku').value,
            lastTransactionPrice: document.getElementById('last-transaction-price').value,
            latestQuote: document.getElementById('latest-quote').value,
            profitMargin: document.getElementById('profit-margin').value
        };
    }
    
    // 激活指定的TAB
    function activateTab(tabName) {
        const tabButton = document.getElementById(`${tabName}-tab`);
        if (tabButton) {
            tabButton.click();
        }
    }
    
    // 检测工作流闭环条件
    function checkWorkflowLoop() {
        // 根据当前激活的TAB检测是否需要启动工作流闭环
        const activeTabId = document.querySelector('#tab-buttons button.text-blue-600').id;
        
        switch (activeTabId) {
            case 'specs-tab':
                // 规格TAB：属性内容新添加或修改时启动工作流闭环
                // 这里通过监听属性值的变化来实现
                break;
            case 'kit-tab':
                // 组套TAB：添加/删除产品时启动工作流闭环
                // 这里通过监听组套产品列表的变化来实现
                break;
        }
    }
    
    // 全局对象，允许其他脚本调用工作流函数
    window.rightPanelWorkflow = {
        startWorkflowLoop: function(reason) {
            console.log(`启动工作流闭环，原因：${reason}`);
            
            // 更新工作流状态显示
            if (currentStatus) {
                currentStatus.textContent = `工作流闭环中（${reason}）`;
            }
            
            // 显示提交区域
            if (submitArea) {
                submitArea.classList.remove('hidden');
            }
            
            // 显示记录配置信息
            if (recordConfigInfo) {
                recordConfigInfo.classList.remove('hidden');
            }
        },
        
        updateSummary: function() {
            // 更新配置摘要
            const specsCount = document.querySelectorAll('#specs-list .spec-item').length;
            const kitCount = document.querySelectorAll('#kit-items-list .kit-item').length;
            const clientsCount = document.querySelectorAll('#current-clients-list div').length;
            const vendorsCount = document.querySelectorAll('#current-vendors-list div').length;
            
            const summarySpecs = document.getElementById('summary-specs');
            const summaryKit = document.getElementById('summary-kit');
            const summaryClients = document.getElementById('summary-clients');
            const summaryVendors = document.getElementById('summary-vendors');
            
            if (summarySpecs) summarySpecs.textContent = `${specsCount}项属性`;
            if (summaryKit) summaryKit.textContent = `${kitCount}个产品`;
            if (summaryClients) summaryClients.textContent = `${clientsCount}个客户`;
            if (summaryVendors) summaryVendors.textContent = `${vendorsCount}个供应商`;
        }
    };
});

// 初始化工作流状态管理
// 这个函数在HTML文件中被调用，用于初始化工作流状态管理模块
function initWorkflowStateManagement() {
    console.log('初始化工作流状态管理模块');
    
    // 获取工作流相关元素
    const idleOverlay = document.getElementById('idle-overlay');
    const statusIndicator = document.getElementById('status-indicator');
    const newRecordBtn = document.getElementById('new-record-btn');
    const editBtn = document.getElementById('edit-btn');
    const modifyBtn = document.getElementById('modify-btn');
    const saveRecordBtn = document.getElementById('save-record-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    // 设置初始状态为待机状态
    if (idleOverlay) {
        idleOverlay.style.display = 'flex';
    }
    
    if (statusIndicator) {
        statusIndicator.innerHTML = '<i class="fas fa-clock mr-2"></i>待机状态';
    }
    
    // 禁用按钮
    if (saveRecordBtn) saveRecordBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    
    // 返回成功状态
    return true;
}

// 根据工作流状态更新UI
function updateUIByWorkflowState(state = 'idle') {
    console.log(`根据工作流状态更新UI: ${state}`);
    
    // 获取工作流相关元素
    const idleOverlay = document.getElementById('idle-overlay');
    const statusIndicator = document.getElementById('status-indicator');
    const saveRecordBtn = document.getElementById('save-record-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const configVendor = document.getElementById('config-vendor');
    const configClient = document.getElementById('config-client');
    const recordSelectors = document.querySelectorAll('input[type="radio"].record-selector');
    
    // 全局变量记录当前选中的记录
    window.selectedRecord = null;
    
    switch (state) {
        case 'idle':
            // 待机状态
            if (idleOverlay) idleOverlay.style.display = 'flex';
            if (statusIndicator) statusIndicator.innerHTML = '<i class="fas fa-clock mr-2"></i>待机状态';
            if (saveRecordBtn) saveRecordBtn.disabled = true;
            if (cancelBtn) cancelBtn.disabled = true;
            
            // 隐藏配置区域
            if (configVendor) configVendor.style.display = 'none';
            if (configClient) configClient.style.display = 'none';
            
            // 重置选择器
            resetRecordSelectors();
            break;
            
        case 'new':
            // 新建状态
            if (idleOverlay) idleOverlay.style.display = 'none';
            if (statusIndicator) statusIndicator.innerHTML = '<i class="fas fa-plus-circle mr-2"></i>新建中';
            if (saveRecordBtn) saveRecordBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            
            // 启用选择器
            enableRecordSelectors();
            break;
            
        case 'edit':
            // 编辑状态
            if (idleOverlay) idleOverlay.style.display = 'none';
            if (statusIndicator) statusIndicator.innerHTML = '<i class="fas fa-edit mr-2"></i>编辑中';
            if (saveRecordBtn) saveRecordBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            break;
            
        case 'modify':
            // 修改状态
            if (idleOverlay) idleOverlay.style.display = 'none';
            if (statusIndicator) statusIndicator.innerHTML = '<i class="fas fa-pen mr-2"></i>修改中';
            if (saveRecordBtn) saveRecordBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            break;
    }
    
    // 返回成功状态
    return true;
}

// 启用记录选择器
function enableRecordSelectors() {
    const recordSelectors = document.querySelectorAll('input[type="radio"].record-selector');
    
    recordSelectors.forEach(selector => {
        selector.disabled = false;
        
        // 添加事件监听器
        selector.addEventListener('change', handleRecordSelection);
    });
}

// 重置记录选择器
function resetRecordSelectors() {
    const recordSelectors = document.querySelectorAll('input[type="radio"].record-selector');
    
    // 重置全局选中记录
    window.selectedRecord = null;
    
    recordSelectors.forEach(selector => {
        selector.checked = false;
        selector.disabled = true;
    });
    
    // 重置输入框
    const inputFields = [
        'config-mfr-nr', 'config-vendor-price', 'config-vendor-quote-date',
        'config-sku', 'config-client-price', 'config-client-quote-date'
    ];
    
    inputFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // 重置下拉菜单
    const selectFields = ['config-vendor-currency', 'config-client-currency'];
    
    selectFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.selectedIndex = 0;
    });
}

// 处理记录选择
function handleRecordSelection(event) {
    const selector = event.target;
    const recordType = selector.getAttribute('data-type');
    const recordId = selector.getAttribute('data-id');
    const recordName = selector.nextElementSibling ? selector.nextElementSibling.textContent : '';
    
    // 设置选中的记录
    window.selectedRecord = {
        type: recordType,
        id: recordId,
        name: recordName
    };
    
    console.log(`选择了${recordType} ID: ${recordId}, 名称: ${recordName}`);
    
    // 显示对应的配置区域
    const configVendor = document.getElementById('config-vendor');
    const configClient = document.getElementById('config-client');
    const configVendorName = document.getElementById('config-vendor-name');
    const configClientName = document.getElementById('config-client-name');
    
    if (recordType === 'vendor') {
        if (configVendor) configVendor.style.display = 'block';
        if (configClient) configClient.style.display = 'none';
        if (configVendorName) configVendorName.textContent = recordName;
    } else if (recordType === 'client') {
        if (configVendor) configVendor.style.display = 'none';
        if (configClient) configClient.style.display = 'block';
        if (configClientName) configClientName.textContent = recordName;
    }
}
