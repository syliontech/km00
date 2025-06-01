/**
 * 组套管理模块
 * 负责处理组套管理功能、添加组套产品到列表和更新产品明细信息
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// 组套管理模块
ProductSystem.KitManager = (function() {
    // 私有变量
    let kitItems = []; // 组套产品数组
    let kitList = null;
    let addKitBtn = null;
    let removeKitBtn = null;
    let kitTab = null;
    let totalPriceElement = null;
    let productSearchBtn = null;
    
    // 公共接口
    return {
        /**
         * 初始化组套管理器
         */
        init: function() {
            console.log('初始化组套管理模块');
            
            // 获取组套列表和按钮
            kitList = document.getElementById('kit-list');
            addKitBtn = document.getElementById('add-kit-btn');
            removeKitBtn = document.getElementById('remove-kit-btn');
            kitTab = document.querySelector('button[data-tab="kit"]');
            totalPriceElement = document.getElementById('kit-total-price');
            productSearchBtn = document.getElementById('product-search-btn');
            
            // 注册事件监听器
            this.registerEventListeners();
            
            console.log('组套管理模块初始化完成');
        },
        
        /**
         * 注册事件监听器
         */
        registerEventListeners: function() {
            // 添加组套产品按钮点击事件
            if (addKitBtn) {
                addKitBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 模拟打开产品选择对话框
                    this.openProductSelectionDialog();
                    
                    // 如果工作流闭环已启动，切换到修改状态
                    if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                        if (typeof window.changeWorkflowState === 'function') {
                            window.changeWorkflowState('modify');
                        }
                    }
                });
            }
            
            // 删除组套产品按钮点击事件
            if (removeKitBtn) {
                removeKitBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 获取选中的组套产品
                    const selectedItems = document.querySelectorAll('.kit-item.selected');
                    if (selectedItems.length === 0) {
                        alert('请先选择要删除的产品');
                        return;
                    }
                    
                    // 确认删除
                    if (confirm(`确定要删除选中的 ${selectedItems.length} 个产品吗？`)) {
                        // 删除选中的组套产品
                        selectedItems.forEach(item => {
                            const index = parseInt(item.getAttribute('data-index'));
                            kitItems.splice(index, 1);
                            item.remove();
                        });
                        
                        // 更新组套产品索引
                        this.updateKitIndices();
                        
                        // 更新总价
                        this.updateTotalPrice();
                        
                        // 如果工作流闭环已启动，切换到修改状态
                        if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                            if (typeof window.changeWorkflowState === 'function') {
                                window.changeWorkflowState('modify');
                            }
                        }
                    }
                });
            }
            
            // 产品搜索按钮点击事件
            if (productSearchBtn) {
                productSearchBtn.addEventListener('click', () => {
                    this.openProductSelectionDialog();
                });
            }
            
            // 监听产品类型变更事件
            document.addEventListener('product-type-changed', (e) => {
                const { type } = e.detail;
                
                // 如果产品类型为组套，启用组套TAB
                if (type === 'kit') {
                    this.enableKitTab();
                } else {
                    this.disableKitTab();
                }
            });
            
            // 监听工作流状态变更事件
            document.addEventListener('workflow-state-changed', (e) => {
                const { newState } = e.detail;
                
                // 如果进入新建状态，清空组套产品
                if (newState === 'new') {
                    this.clearKitItems();
                }
            });
        },
        
        /**
         * 打开产品选择对话框
         */
        openProductSelectionDialog: function() {
            console.log('打开产品选择对话框');
            
            // 这里模拟从产品管理系统中选择产品
            // 在实际应用中，这里应该打开一个产品选择对话框
            
            // 模拟用户选择了一个产品
            setTimeout(() => {
                const productName = '组套产品' + (kitItems.length + 1);
                const productCode = 'KIT-' + Math.floor(Math.random() * 10000);
                const vendorName = '供应商' + Math.floor(Math.random() * 10);
                const quantity = Math.floor(Math.random() * 5) + 1;
                const price = Math.floor(Math.random() * 1000) + 100;
                
                // 添加组套产品
                this.addKitItem(productName, productCode, vendorName, quantity, price);
            }, 500);
        },
        
        /**
         * 添加组套产品
         * @param {string} name - 产品名称
         * @param {string} code - 产品编码
         * @param {string} vendorName - 供应商名称
         * @param {number} quantity - 数量
         * @param {number} price - 价格
         */
        addKitItem: function(name, code, vendorName, quantity, price) {
            console.log(`添加组套产品: ${name}, ${code}, ${vendorName}, ${quantity}, ${price}`);
            
            // 添加到组套产品数组
            kitItems.push({ name, code, vendorName, quantity, price });
            
            // 添加到组套列表
            this.addKitItemToList(name, code, vendorName, quantity, price);
            
            // 更新产品明细信息
            this.updateKitDetailInfo(name, code, vendorName, quantity, price);
            
            // 更新总价
            this.updateTotalPrice();
            
            // 触发组套产品变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('kit-items-changed', { kitItems });
            } else {
                document.dispatchEvent(new CustomEvent('kit-items-changed', { detail: { kitItems } }));
            }
            
            // 启动工作流闭环
            if (!window.workflowLoopStarted && typeof window.startWorkflowLoop === 'function') {
                window.startWorkflowLoop('添加组套产品');
            }
            
            // 如果工作流闭环已启动，切换到修改状态
            if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                if (typeof window.changeWorkflowState === 'function') {
                    window.changeWorkflowState('modify');
                }
            }
        },
        
        /**
         * 添加组套产品到列表
         * @param {string} name - 产品名称
         * @param {string} code - 产品编码
         * @param {string} vendorName - 供应商名称
         * @param {number} quantity - 数量
         * @param {number} price - 价格
         */
        addKitItemToList: function(name, code, vendorName, quantity, price) {
            if (!kitList) return;
            
            // 创建组套产品项容器
            const kitItem = document.createElement('div');
            kitItem.className = 'kit-item flex items-center justify-between p-2 border-b hover:bg-gray-50';
            kitItem.setAttribute('data-index', kitItems.length - 1);
            
            // 创建组套产品信息容器
            const kitInfo = document.createElement('div');
            kitInfo.className = 'flex items-center space-x-2';
            
            // 创建选择框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mr-2';
            
            // 创建产品名称
            const nameElement = document.createElement('div');
            nameElement.className = 'w-32 truncate';
            nameElement.textContent = name;
            nameElement.title = name;
            
            // 创建产品编码
            const codeElement = document.createElement('div');
            codeElement.className = 'w-24 text-gray-500 text-sm';
            codeElement.textContent = code;
            codeElement.title = code;
            
            // 创建供应商名称
            const vendorElement = document.createElement('div');
            vendorElement.className = 'w-24 text-gray-500 text-sm';
            vendorElement.textContent = vendorName;
            vendorElement.title = vendorName;
            
            // 创建数量输入框
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.className = 'w-16 border rounded px-2 py-1 text-sm';
            quantityInput.value = quantity;
            quantityInput.min = 1;
            
            // 创建价格显示
            const priceElement = document.createElement('div');
            priceElement.className = 'w-20 text-right';
            priceElement.textContent = `¥${price.toFixed(2)}`;
            priceElement.title = `¥${price.toFixed(2)}`;
            
            // 创建小计显示
            const subtotalElement = document.createElement('div');
            subtotalElement.className = 'w-24 text-right font-medium';
            subtotalElement.textContent = `¥${(price * quantity).toFixed(2)}`;
            subtotalElement.title = `¥${(price * quantity).toFixed(2)}`;
            
            // 创建操作按钮容器
            const actions = document.createElement('div');
            actions.className = 'flex items-center space-x-2';
            
            // 创建编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'text-blue-500 hover:text-blue-700';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = '编辑';
            
            // 添加编辑按钮点击事件
            editBtn.addEventListener('click', () => {
                // 这里可以添加编辑组套产品的逻辑
                alert(`编辑组套产品: ${name}`);
            });
            
            // 添加数量输入框变更事件
            quantityInput.addEventListener('change', () => {
                const newQuantity = parseInt(quantityInput.value);
                if (isNaN(newQuantity) || newQuantity < 1) {
                    quantityInput.value = 1;
                    return;
                }
                
                // 更新组套产品数组
                const index = parseInt(kitItem.getAttribute('data-index'));
                if (kitItems[index]) {
                    kitItems[index].quantity = newQuantity;
                    
                    // 更新小计
                    subtotalElement.textContent = `¥${(price * newQuantity).toFixed(2)}`;
                    subtotalElement.title = `¥${(price * newQuantity).toFixed(2)}`;
                    
                    // 更新总价
                    this.updateTotalPrice();
                    
                    // 如果工作流闭环已启动，切换到修改状态
                    if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                        if (typeof window.changeWorkflowState === 'function') {
                            window.changeWorkflowState('modify');
                        }
                    }
                }
            });
            
            // 添加选择框点击事件
            checkbox.addEventListener('click', function() {
                if (this.checked) {
                    kitItem.classList.add('selected');
                } else {
                    kitItem.classList.remove('selected');
                }
            });
            
            // 组装组套产品信息
            kitInfo.appendChild(checkbox);
            kitInfo.appendChild(nameElement);
            kitInfo.appendChild(codeElement);
            kitInfo.appendChild(vendorElement);
            kitInfo.appendChild(quantityInput);
            kitInfo.appendChild(priceElement);
            kitInfo.appendChild(subtotalElement);
            
            // 添加编辑按钮到操作容器
            actions.appendChild(editBtn);
            
            // 组装组套产品项
            kitItem.appendChild(kitInfo);
            kitItem.appendChild(actions);
            
            // 添加到组套列表
            kitList.appendChild(kitItem);
        },
        
        /**
         * 更新产品明细信息
         * @param {string} name - 产品名称
         * @param {string} code - 产品编码
         * @param {string} vendorName - 供应商名称
         * @param {number} quantity - 数量
         * @param {number} price - 价格
         */
        updateKitDetailInfo: function(name, code, vendorName, quantity, price) {
            // 获取记录区域的组套产品列表
            const recordKitList = document.getElementById('record-kit-list');
            if (!recordKitList) return;
            
            // 创建组套产品项
            const kitItem = document.createElement('div');
            kitItem.className = 'grid grid-cols-5 gap-2 p-1 border-b text-xs';
            
            // 创建产品名称
            const nameElement = document.createElement('div');
            nameElement.textContent = name;
            
            // 创建产品编码
            const codeElement = document.createElement('div');
            codeElement.textContent = code;
            
            // 创建供应商名称
            const vendorElement = document.createElement('div');
            vendorElement.textContent = vendorName;
            
            // 创建数量
            const quantityElement = document.createElement('div');
            quantityElement.textContent = quantity;
            
            // 创建价格
            const priceElement = document.createElement('div');
            priceElement.textContent = `¥${price.toFixed(2)}`;
            
            // 组装组套产品项
            kitItem.appendChild(nameElement);
            kitItem.appendChild(codeElement);
            kitItem.appendChild(vendorElement);
            kitItem.appendChild(quantityElement);
            kitItem.appendChild(priceElement);
            
            // 添加到记录区域的组套产品列表
            recordKitList.appendChild(kitItem);
            
            // 更新客户信息
            this.updateClientInfo();
            
            // 更新记录区域的总价
            this.updateRecordTotalPrice();
        },
        
        /**
         * 更新客户信息
         */
        updateClientInfo: function() {
            // 获取客户名称输入框
            const clientNameInput = document.getElementById('record-client-name');
            if (!clientNameInput) return;
            
            // 如果客户名称为空，设置默认值
            if (!clientNameInput.value) {
                clientNameInput.value = '默认客户';
            }
        },
        
        /**
         * 更新总价
         */
        updateTotalPrice: function() {
            if (!totalPriceElement) return;
            
            // 计算总价
            let total = 0;
            kitItems.forEach(item => {
                total += item.price * item.quantity;
            });
            
            // 更新总价显示
            totalPriceElement.textContent = `¥${total.toFixed(2)}`;
            
            // 更新记录区域的总价
            this.updateRecordTotalPrice();
        },
        
        /**
         * 更新记录区域的总价
         */
        updateRecordTotalPrice: function() {
            // 获取记录区域的总价元素
            const recordTotalPrice = document.getElementById('record-total-price');
            if (!recordTotalPrice) return;
            
            // 计算总价
            let total = 0;
            kitItems.forEach(item => {
                total += item.price * item.quantity;
            });
            
            // 更新总价显示
            recordTotalPrice.textContent = `¥${total.toFixed(2)}`;
        },
        
        /**
         * 获取所有组套产品
         * @returns {Array} 组套产品数组
         */
        getKitItems: function() {
            return kitItems;
        },
        
        /**
         * 清空组套产品
         */
        clearKitItems: function() {
            // 清空组套产品数组
            kitItems = [];
            
            // 清空组套列表
            if (kitList) {
                kitList.innerHTML = '';
            }
            
            // 清空记录区域的组套产品列表
            const recordKitList = document.getElementById('record-kit-list');
            if (recordKitList) {
                recordKitList.innerHTML = '';
            }
            
            // 更新总价
            this.updateTotalPrice();
            
            // 触发组套产品变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('kit-items-changed', { kitItems });
            } else {
                document.dispatchEvent(new CustomEvent('kit-items-changed', { detail: { kitItems } }));
            }
        },
        
        /**
         * 更新组套产品索引
         */
        updateKitIndices: function() {
            // 获取所有组套产品项
            const kitItems = document.querySelectorAll('.kit-item');
            
            // 更新索引
            kitItems.forEach((item, index) => {
                item.setAttribute('data-index', index);
            });
        },
        
        /**
         * 启用组套TAB
         */
        enableKitTab: function() {
            if (kitTab) {
                kitTab.disabled = false;
                kitTab.classList.remove('opacity-50');
            }
            
            // 如果当前是规格TAB，可以考虑自动切换到组套TAB
            if (ProductSystem.TabHandler && ProductSystem.TabHandler.getActiveTab() === 'specs') {
                ProductSystem.TabHandler.switchTab('kit');
            }
        },
        
        /**
         * 禁用组套TAB
         */
        disableKitTab: function() {
            if (kitTab) {
                kitTab.disabled = true;
                kitTab.classList.add('opacity-50');
            }
            
            // 如果当前是组套TAB，切换到规格TAB
            if (ProductSystem.TabHandler && ProductSystem.TabHandler.getActiveTab() === 'kit') {
                ProductSystem.TabHandler.switchTab('specs');
            }
        }
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化组套管理模块
    ProductSystem.KitManager.init();
});
