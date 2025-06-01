/**
 * 供应商和客户管理模块
 * 负责处理供应商和客户管理功能、添加供应商和客户到列表、设置默认供应商和客户
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// 供应商和客户管理模块
ProductSystem.VendorClientManager = (function() {
    // 私有变量
    let vendors = []; // 供应商数组
    let clients = []; // 客户数组
    let defaultVendor = null; // 默认供应商
    let defaultClient = null; // 默认客户
    
    let vendorsList = null;
    let clientsList = null;
    let addVendorBtn = null;
    let removeVendorBtn = null;
    let addClientBtn = null;
    let removeClientBtn = null;
    let defaultVendorDisplay = null;
    let defaultClientDisplay = null;
    
    // 公共接口
    return {
        /**
         * 初始化供应商和客户管理器
         */
        init: function() {
            console.log('初始化供应商和客户管理模块');
            
            // 获取供应商和客户列表及按钮
            vendorsList = document.getElementById('vendors-list');
            clientsList = document.getElementById('clients-list');
            addVendorBtn = document.getElementById('add-vendor-btn');
            removeVendorBtn = document.getElementById('remove-vendor-btn');
            addClientBtn = document.getElementById('add-client-btn');
            removeClientBtn = document.getElementById('remove-client-btn');
            defaultVendorDisplay = document.getElementById('default-vendor-display');
            defaultClientDisplay = document.getElementById('default-client-display');
            
            // 注册事件监听器
            this.registerEventListeners();
            
            console.log('供应商和客户管理模块初始化完成');
        },
        
        /**
         * 注册事件监听器
         */
        registerEventListeners: function() {
            // 添加供应商按钮点击事件
            if (addVendorBtn) {
                addVendorBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 创建供应商名称和ID输入对话框
                    const vendorName = prompt('请输入供应商名称：');
                    if (!vendorName) return;
                    
                    const vendorId = 'V' + Math.floor(Math.random() * 10000);
                    
                    // 添加供应商
                    this.addVendor(vendorName, vendorId, vendors.length === 0);
                });
            }
            
            // 删除供应商按钮点击事件
            if (removeVendorBtn) {
                removeVendorBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 获取选中的供应商
                    const selectedVendors = document.querySelectorAll('.vendor-item.selected');
                    if (selectedVendors.length === 0) {
                        alert('请先选择要删除的供应商');
                        return;
                    }
                    
                    // 确认删除
                    if (confirm(`确定要删除选中的 ${selectedVendors.length} 个供应商吗？`)) {
                        // 删除选中的供应商
                        selectedVendors.forEach(item => {
                            const index = parseInt(item.getAttribute('data-index'));
                            const vendorId = vendors[index].id;
                            
                            // 如果删除的是默认供应商，需要重新设置默认供应商
                            if (defaultVendor && defaultVendor.id === vendorId) {
                                defaultVendor = null;
                                this.updateDefaultVendorDisplay(null, null);
                            }
                            
                            vendors.splice(index, 1);
                            item.remove();
                        });
                        
                        // 更新供应商索引
                        this.updateVendorIndices();
                    }
                });
            }
            
            // 添加客户按钮点击事件
            if (addClientBtn) {
                addClientBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 创建客户名称和ID输入对话框
                    const clientName = prompt('请输入客户名称：');
                    if (!clientName) return;
                    
                    const clientId = 'C' + Math.floor(Math.random() * 10000);
                    
                    // 添加客户
                    this.addClient(clientName, clientId, clients.length === 0);
                });
            }
            
            // 删除客户按钮点击事件
            if (removeClientBtn) {
                removeClientBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 获取选中的客户
                    const selectedClients = document.querySelectorAll('.client-item.selected');
                    if (selectedClients.length === 0) {
                        alert('请先选择要删除的客户');
                        return;
                    }
                    
                    // 确认删除
                    if (confirm(`确定要删除选中的 ${selectedClients.length} 个客户吗？`)) {
                        // 删除选中的客户
                        selectedClients.forEach(item => {
                            const index = parseInt(item.getAttribute('data-index'));
                            const clientId = clients[index].id;
                            
                            // 如果删除的是默认客户，需要重新设置默认客户
                            if (defaultClient && defaultClient.id === clientId) {
                                defaultClient = null;
                                this.updateDefaultClientDisplay(null, null);
                            }
                            
                            clients.splice(index, 1);
                            item.remove();
                        });
                        
                        // 更新客户索引
                        this.updateClientIndices();
                    }
                });
            }
            
            // 监听工作流状态变更事件
            document.addEventListener('workflow-state-changed', (e) => {
                const { newState } = e.detail;
                
                // 如果进入新建状态，清空供应商和客户
                if (newState === 'new') {
                    this.clearVendors();
                    this.clearClients();
                }
            });
        },
        
        /**
         * 添加供应商
         * @param {string} name - 供应商名称
         * @param {string} id - 供应商ID
         * @param {boolean} isDefault - 是否为默认供应商
         */
        addVendor: function(name, id, isDefault = false) {
            console.log(`添加供应商: ${name}, ${id}, isDefault: ${isDefault}`);
            
            // 添加到供应商数组
            vendors.push({ name, id });
            
            // 添加到供应商列表
            this.addVendorToList(name, id, isDefault);
            
            // 如果是默认供应商，更新默认供应商显示
            if (isDefault) {
                defaultVendor = { name, id };
                this.updateDefaultVendorDisplay(name, id);
                this.addDefaultVendorToRecordArea(name, id);
            }
            
            // 触发供应商变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('vendors-changed', { vendors, defaultVendor });
            } else {
                document.dispatchEvent(new CustomEvent('vendors-changed', { detail: { vendors, defaultVendor } }));
            }
        },
        
        /**
         * 添加供应商到列表
         * @param {string} name - 供应商名称
         * @param {string} id - 供应商ID
         * @param {boolean} isDefault - 是否为默认供应商
         */
        addVendorToList: function(name, id, isDefault = false) {
            if (!vendorsList) return;
            
            // 创建供应商项容器
            const vendorItem = document.createElement('div');
            vendorItem.className = 'vendor-item flex items-center justify-between p-2 border-b hover:bg-gray-50';
            vendorItem.setAttribute('data-index', vendors.length - 1);
            vendorItem.setAttribute('data-id', id);
            
            // 创建供应商信息容器
            const vendorInfo = document.createElement('div');
            vendorInfo.className = 'flex items-center space-x-2';
            
            // 创建选择框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mr-2';
            
            // 创建供应商名称
            const nameElement = document.createElement('div');
            nameElement.className = 'w-32 truncate';
            nameElement.textContent = name;
            nameElement.title = name;
            
            // 创建供应商ID
            const idElement = document.createElement('div');
            idElement.className = 'w-20 text-gray-500 text-sm';
            idElement.textContent = id;
            idElement.title = id;
            
            // 创建操作按钮容器
            const actions = document.createElement('div');
            actions.className = 'flex items-center space-x-2';
            
            // 创建设为默认按钮
            const setDefaultBtn = document.createElement('button');
            setDefaultBtn.className = 'text-blue-500 hover:text-blue-700';
            setDefaultBtn.innerHTML = '<i class="fas fa-star"></i>';
            setDefaultBtn.title = '设为默认';
            
            // 如果是默认供应商，添加默认标记
            if (isDefault) {
                vendorItem.classList.add('bg-blue-50');
                setDefaultBtn.classList.add('text-yellow-500');
                setDefaultBtn.title = '默认供应商';
            }
            
            // 添加设为默认按钮点击事件
            setDefaultBtn.addEventListener('click', () => {
                // 移除所有供应商的默认标记
                document.querySelectorAll('.vendor-item').forEach(item => {
                    item.classList.remove('bg-blue-50');
                    item.querySelector('button').classList.remove('text-yellow-500');
                    item.querySelector('button').title = '设为默认';
                });
                
                // 添加当前供应商的默认标记
                vendorItem.classList.add('bg-blue-50');
                setDefaultBtn.classList.add('text-yellow-500');
                setDefaultBtn.title = '默认供应商';
                
                // 更新默认供应商
                defaultVendor = { name, id };
                this.updateDefaultVendorDisplay(name, id);
                this.addDefaultVendorToRecordArea(name, id);
                
                // 触发供应商变更事件
                if (ProductSystem.RightPanel) {
                    ProductSystem.RightPanel.triggerEvent('vendors-changed', { vendors, defaultVendor });
                } else {
                    document.dispatchEvent(new CustomEvent('vendors-changed', { detail: { vendors, defaultVendor } }));
                }
            });
            
            // 添加选择框点击事件
            checkbox.addEventListener('click', function() {
                if (this.checked) {
                    vendorItem.classList.add('selected');
                } else {
                    vendorItem.classList.remove('selected');
                }
            });
            
            // 组装供应商信息
            vendorInfo.appendChild(checkbox);
            vendorInfo.appendChild(nameElement);
            vendorInfo.appendChild(idElement);
            
            // 添加设为默认按钮到操作容器
            actions.appendChild(setDefaultBtn);
            
            // 组装供应商项
            vendorItem.appendChild(vendorInfo);
            vendorItem.appendChild(actions);
            
            // 添加到供应商列表
            vendorsList.appendChild(vendorItem);
        },
        
        /**
         * 更新默认供应商显示
         * @param {string} name - 供应商名称
         * @param {string} id - 供应商ID
         */
        updateDefaultVendorDisplay: function(name, id) {
            if (!defaultVendorDisplay) return;
            
            if (name && id) {
                defaultVendorDisplay.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium">${name}</span>
                            <span class="text-gray-500 text-sm ml-2">${id}</span>
                        </div>
                        <div>
                            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">默认</span>
                        </div>
                    </div>
                `;
            } else {
                defaultVendorDisplay.innerHTML = `
                    <div class="text-gray-500 text-center">
                        <span>暂无默认供应商</span>
                    </div>
                `;
            }
        },
        
        /**
         * 将默认供应商信息传递到记录区域
         * @param {string} name - 供应商名称
         * @param {string} id - 供应商ID
         */
        addDefaultVendorToRecordArea: function(name, id) {
            // 获取记录区域的供应商名称输入框
            const vendorNameInput = document.getElementById('record-vendor-name');
            if (!vendorNameInput) return;
            
            // 设置供应商名称
            vendorNameInput.value = name;
        },
        
        /**
         * 添加客户
         * @param {string} name - 客户名称
         * @param {string} id - 客户ID
         * @param {boolean} isDefault - 是否为默认客户
         */
        addClient: function(name, id, isDefault = false) {
            console.log(`添加客户: ${name}, ${id}, isDefault: ${isDefault}`);
            
            // 添加到客户数组
            clients.push({ name, id });
            
            // 添加到客户列表
            this.addClientToList(name, id, isDefault);
            
            // 如果是默认客户，更新默认客户显示
            if (isDefault) {
                defaultClient = { name, id };
                this.updateDefaultClientDisplay(name, id);
                this.addDefaultClientToRecordArea(name, id);
            }
            
            // 触发客户变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('clients-changed', { clients, defaultClient });
            } else {
                document.dispatchEvent(new CustomEvent('clients-changed', { detail: { clients, defaultClient } }));
            }
        },
        
        /**
         * 添加客户到列表
         * @param {string} name - 客户名称
         * @param {string} id - 客户ID
         * @param {boolean} isDefault - 是否为默认客户
         */
        addClientToList: function(name, id, isDefault = false) {
            if (!clientsList) return;
            
            // 创建客户项容器
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item flex items-center justify-between p-2 border-b hover:bg-gray-50';
            clientItem.setAttribute('data-index', clients.length - 1);
            clientItem.setAttribute('data-id', id);
            
            // 创建客户信息容器
            const clientInfo = document.createElement('div');
            clientInfo.className = 'flex items-center space-x-2';
            
            // 创建选择框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mr-2';
            
            // 创建客户名称
            const nameElement = document.createElement('div');
            nameElement.className = 'w-32 truncate';
            nameElement.textContent = name;
            nameElement.title = name;
            
            // 创建客户ID
            const idElement = document.createElement('div');
            idElement.className = 'w-20 text-gray-500 text-sm';
            idElement.textContent = id;
            idElement.title = id;
            
            // 创建操作按钮容器
            const actions = document.createElement('div');
            actions.className = 'flex items-center space-x-2';
            
            // 创建设为默认按钮
            const setDefaultBtn = document.createElement('button');
            setDefaultBtn.className = 'text-blue-500 hover:text-blue-700';
            setDefaultBtn.innerHTML = '<i class="fas fa-star"></i>';
            setDefaultBtn.title = '设为默认';
            
            // 如果是默认客户，添加默认标记
            if (isDefault) {
                clientItem.classList.add('bg-blue-50');
                setDefaultBtn.classList.add('text-yellow-500');
                setDefaultBtn.title = '默认客户';
            }
            
            // 添加设为默认按钮点击事件
            setDefaultBtn.addEventListener('click', () => {
                // 移除所有客户的默认标记
                document.querySelectorAll('.client-item').forEach(item => {
                    item.classList.remove('bg-blue-50');
                    item.querySelector('button').classList.remove('text-yellow-500');
                    item.querySelector('button').title = '设为默认';
                });
                
                // 添加当前客户的默认标记
                clientItem.classList.add('bg-blue-50');
                setDefaultBtn.classList.add('text-yellow-500');
                setDefaultBtn.title = '默认客户';
                
                // 更新默认客户
                defaultClient = { name, id };
                this.updateDefaultClientDisplay(name, id);
                this.addDefaultClientToRecordArea(name, id);
                
                // 触发客户变更事件
                if (ProductSystem.RightPanel) {
                    ProductSystem.RightPanel.triggerEvent('clients-changed', { clients, defaultClient });
                } else {
                    document.dispatchEvent(new CustomEvent('clients-changed', { detail: { clients, defaultClient } }));
                }
            });
            
            // 添加选择框点击事件
            checkbox.addEventListener('click', function() {
                if (this.checked) {
                    clientItem.classList.add('selected');
                } else {
                    clientItem.classList.remove('selected');
                }
            });
            
            // 组装客户信息
            clientInfo.appendChild(checkbox);
            clientInfo.appendChild(nameElement);
            clientInfo.appendChild(idElement);
            
            // 添加设为默认按钮到操作容器
            actions.appendChild(setDefaultBtn);
            
            // 组装客户项
            clientItem.appendChild(clientInfo);
            clientItem.appendChild(actions);
            
            // 添加到客户列表
            clientsList.appendChild(clientItem);
        },
        
        /**
         * 更新默认客户显示
         * @param {string} name - 客户名称
         * @param {string} id - 客户ID
         */
        updateDefaultClientDisplay: function(name, id) {
            if (!defaultClientDisplay) return;
            
            if (name && id) {
                defaultClientDisplay.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium">${name}</span>
                            <span class="text-gray-500 text-sm ml-2">${id}</span>
                        </div>
                        <div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">默认</span>
                        </div>
                    </div>
                `;
            } else {
                defaultClientDisplay.innerHTML = `
                    <div class="text-gray-500 text-center">
                        <span>暂无默认客户</span>
                    </div>
                `;
            }
        },
        
        /**
         * 将默认客户信息传递到记录区域
         * @param {string} name - 客户名称
         * @param {string} id - 客户ID
         */
        addDefaultClientToRecordArea: function(name, id) {
            // 获取记录区域的客户名称输入框
            const clientNameInput = document.getElementById('record-client-name');
            if (!clientNameInput) return;
            
            // 设置客户名称
            clientNameInput.value = name;
        },
        
        /**
         * 获取默认供应商
         * @returns {Object} 默认供应商
         */
        getDefaultVendor: function() {
            return defaultVendor;
        },
        
        /**
         * 获取默认客户
         * @returns {Object} 默认客户
         */
        getDefaultClient: function() {
            return defaultClient;
        },
        
        /**
         * 清空供应商
         */
        clearVendors: function() {
            // 清空供应商数组
            vendors = [];
            
            // 清空默认供应商
            defaultVendor = null;
            
            // 清空供应商列表
            if (vendorsList) {
                vendorsList.innerHTML = '';
            }
            
            // 更新默认供应商显示
            this.updateDefaultVendorDisplay(null, null);
            
            // 触发供应商变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('vendors-changed', { vendors, defaultVendor });
            } else {
                document.dispatchEvent(new CustomEvent('vendors-changed', { detail: { vendors, defaultVendor } }));
            }
        },
        
        /**
         * 清空客户
         */
        clearClients: function() {
            // 清空客户数组
            clients = [];
            
            // 清空默认客户
            defaultClient = null;
            
            // 清空客户列表
            if (clientsList) {
                clientsList.innerHTML = '';
            }
            
            // 更新默认客户显示
            this.updateDefaultClientDisplay(null, null);
            
            // 触发客户变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('clients-changed', { clients, defaultClient });
            } else {
                document.dispatchEvent(new CustomEvent('clients-changed', { detail: { clients, defaultClient } }));
            }
        },
        
        /**
         * 更新供应商索引
         */
        updateVendorIndices: function() {
            // 获取所有供应商项
            const vendorItems = document.querySelectorAll('.vendor-item');
            
            // 更新索引
            vendorItems.forEach((item, index) => {
                item.setAttribute('data-index', index);
            });
        },
        
        /**
         * 更新客户索引
         */
        updateClientIndices: function() {
            // 获取所有客户项
            const clientItems = document.querySelectorAll('.client-item');
            
            // 更新索引
            clientItems.forEach((item, index) => {
                item.setAttribute('data-index', index);
            });
        }
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化供应商和客户管理模块
    ProductSystem.VendorClientManager.init();
});
