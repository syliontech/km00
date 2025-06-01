/**
 * 规格管理模块
 * 负责处理规格管理功能、添加属性到列表和将属性传递到记录区域
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// 规格管理模块
ProductSystem.SpecsManager = (function() {
    // 私有变量
    let productAttributes = []; // 产品属性数组
    let specsList = null;
    let addSpecBtn = null; // 添加属性按钮
    let addSpecRowBtn = null; // 增加一栏按钮
    let deleteSpecRowBtn = null; // 删除一栏按钮
    let specNameInput = null; // 属性名称输入框
    let specDescriptionInput = null; // 属性说明输入框
    
    // 公共接口
    return {
        /**
         * 初始化规格管理器
         */
        init: function() {
            console.log('初始化规格管理模块');
            
            // 获取规格列表和按钮
            specsList = document.getElementById('specs-list');
            addSpecBtn = document.getElementById('add-spec-btn');
            addSpecRowBtn = document.getElementById('add-spec-row-btn');
            deleteSpecRowBtn = document.getElementById('delete-spec-row-btn');
            specNameInput = document.getElementById('spec-name');
            specDescriptionInput = document.getElementById('spec-description');
            
            // 注册事件监听器
            this.registerEventListeners();
            
            console.log('规格管理模块初始化完成');
        },
        
        /**
         * 注册事件监听器
         */
        registerEventListeners: function() {
            const self = this;
            
            // 添加属性按钮点击事件 - 不启动工作流闭环
            if (addSpecBtn) {
                addSpecBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 获取输入框中的值
                    const specName = specNameInput.value.trim();
                    const specDescription = specDescriptionInput.value.trim();
                    
                    if (!specName) {
                        alert('请输入属性名称');
                        return;
                    }
                    
                    // 添加规格
                    this.addSpec(specName, specDescription);
                    
                    // 清空输入框
                    specNameInput.value = '';
                    specDescriptionInput.value = '';
                    
                    // 注意：添加属性按钮不启动工作流闭环
                });
            }
            
            // 增加一栏按钮点击事件 - 不启动工作流闭环
            if (addSpecRowBtn) {
                addSpecRowBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 创建一个空白的规格行
                    const emptyRow = document.createElement('div');
                    emptyRow.className = 'spec-item grid grid-cols-2 gap-4 p-3 border-t border-gray-200 hover:bg-gray-50';
                    emptyRow.setAttribute('data-index', productAttributes.length);
                    
                    // 创建属性名称单元格
                    const nameCell = document.createElement('div');
                    nameCell.className = 'font-medium text-gray-800';
                    nameCell.textContent = '新属性';
                    
                    // 创建属性说明单元格
                    const descriptionCell = document.createElement('div');
                    descriptionCell.className = 'text-gray-600';
                    descriptionCell.textContent = '请点击编辑';
                    
                    // 添加到行
                    emptyRow.appendChild(nameCell);
                    emptyRow.appendChild(descriptionCell);
                    
                    // 添加到规格列表
                    specsList.appendChild(emptyRow);
                    
                    // 添加到属性数组
                    productAttributes.push({
                        name: '新属性',
                        value: '请点击编辑'
                    });
                    
                    // 更新规格索引
                    this.updateSpecIndices();
                    
                    // 添加点击事件用于编辑
                    emptyRow.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        const attr = productAttributes[index];
                        
                        // 填充输入框
                        specNameInput.value = attr.name;
                        specDescriptionInput.value = attr.value;
                        
                        // 标记当前编辑的行
                        document.querySelectorAll('.spec-item').forEach(item => {
                            item.classList.remove('bg-blue-50');
                        });
                        this.classList.add('bg-blue-50');
                        
                        // 保存当前编辑的索引
                        specNameInput.setAttribute('data-editing-index', index);
                        specDescriptionInput.setAttribute('data-editing-index', index);
                    });
                    
                    // 注意：增加一栏按钮不启动工作流闭环
                });
            }
            
            // 删除一栏按钮点击事件 - 不启动工作流闭环
            if (deleteSpecRowBtn) {
                deleteSpecRowBtn.addEventListener('click', () => {
                    // 检查工作流状态
                    if (window.workflowState === 'idle') return;
                    
                    // 获取当前选中的行
                    const selectedRow = document.querySelector('.spec-item.bg-blue-50');
                    if (!selectedRow) {
                        alert('请先选择要删除的属性行');
                        return;
                    }
                    
                    // 获取索引
                    const index = parseInt(selectedRow.getAttribute('data-index'));
                    
                    // 从数组中删除
                    productAttributes.splice(index, 1);
                    
                    // 从DOM中删除
                    selectedRow.remove();
                    
                    // 更新规格索引
                    this.updateSpecIndices();
                    
                    // 清空输入框
                    specNameInput.value = '';
                    specDescriptionInput.value = '';
                    specNameInput.removeAttribute('data-editing-index');
                    specDescriptionInput.removeAttribute('data-editing-index');
                    
                    // 注意：删除一栏按钮不启动工作流闭环
                });
            }
            
            // 属性名称输入框变更事件
            if (specNameInput) {
                specNameInput.addEventListener('change', function() {
                    const editingIndex = this.getAttribute('data-editing-index');
                    if (editingIndex !== null && editingIndex !== undefined) {
                        const index = parseInt(editingIndex);
                        const newName = this.value.trim();
                        
                        if (newName && index >= 0 && index < productAttributes.length) {
                            // 更新数组中的值
                            productAttributes[index].name = newName;
                            
                            // 更新DOM中的显示
                            const specItems = document.querySelectorAll('.spec-item');
                            if (specItems[index]) {
                                const nameCell = specItems[index].querySelector('div:first-child');
                                if (nameCell) nameCell.textContent = newName;
                            }
                        }
                    }
                });
            }
            
            // 属性说明输入框变更事件 - 启动工作流闭环
            if (specDescriptionInput) {
                specDescriptionInput.addEventListener('change', function() {
                    const editingIndex = this.getAttribute('data-editing-index');
                    if (editingIndex !== null && editingIndex !== undefined) {
                        const index = parseInt(editingIndex);
                        const newValue = this.value.trim();
                        
                        if (index >= 0 && index < productAttributes.length) {
                            // 更新数组中的值
                            productAttributes[index].value = newValue;
                            
                            // 更新DOM中的显示
                            const specItems = document.querySelectorAll('.spec-item');
                            if (specItems[index]) {
                                const valueCell = specItems[index].querySelector('div:nth-child(2)');
                                if (valueCell) {
                                    valueCell.textContent = newValue;
                                    // 将修改的内容显示为红色
                                    valueCell.className = 'text-red-600';
                                }
                            }
                            
                            // 添加或修改说明启动工作流闭环
                            if (window.workflowState !== 'idle') {
                                if (typeof window.startWorkflowLoop === 'function' && !window.workflowLoopStarted) {
                                    window.startWorkflowLoop();
                                }
                                
                                if (typeof window.changeWorkflowState === 'function') {
                                    window.changeWorkflowState('modify');
                                }
                            }
                        }
                    }
                });
            }
            
            // 为规格列表中的每一行添加点击事件
            if (specsList) {
                // 初始化现有的规格行
                const existingSpecItems = specsList.querySelectorAll('.spec-item');
                existingSpecItems.forEach((item, index) => {
                    // 获取属性名和值
                    const nameCell = item.querySelector('div:first-child');
                    const valueCell = item.querySelector('div:nth-child(2)');
                    
                    if (nameCell && valueCell) {
                        const name = nameCell.textContent.trim();
                        const value = valueCell.textContent.trim();
                        
                        // 添加到属性数组
                        if (index >= productAttributes.length) {
                            productAttributes.push({
                                name: name,
                                value: value
                            });
                        }
                        
                        // 设置索引
                        item.setAttribute('data-index', index);
                        
                        // 添加点击事件
                        item.addEventListener('click', function() {
                            const clickedIndex = parseInt(this.getAttribute('data-index'));
                            const attr = productAttributes[clickedIndex];
                            
                            // 填充输入框
                            specNameInput.value = attr.name;
                            specDescriptionInput.value = attr.value;
                            
                            // 标记当前编辑的行
                            document.querySelectorAll('.spec-item').forEach(item => {
                                item.classList.remove('bg-blue-50');
                            });
                            this.classList.add('bg-blue-50');
                            
                            // 保存当前编辑的索引
                            specNameInput.setAttribute('data-editing-index', clickedIndex);
                            specDescriptionInput.setAttribute('data-editing-index', clickedIndex);
                        });
                    }
                });
            }
            
            // 监听工作流状态变更事件
            document.addEventListener('workflow-state-changed', (e) => {
                const { newState } = e.detail;
                
                // 如果进入新建状态，清空规格
                if (newState === 'new') {
                    this.clearSpecs();
                }
            });
        },
        
        /**
         * 添加规格
         * @param {string} name - 规格名称
         * @param {string} value - 规格值
         */
        addSpec: function(name, value) {
            // 检查名称是否有效
            if (!name) return;
            
            // 添加到属性数组
            productAttributes.push({
                name: name,
                value: value || ''
            });
            
            // 添加到规格列表
            this.addSpecToList(name, value || '');
            
            // 添加到记录区域
            this.addSpecToRecordArea(name, value || '');
            
            // 触发规格变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('specs-changed', { productAttributes });
            } else {
                document.dispatchEvent(new CustomEvent('specs-changed', { detail: { productAttributes } }));
            }
        },
        
        /**
         * 添加规格到列表
         * @param {string} name - 规格名称
         * @param {string} value - 规格值
         */
        addSpecToList: function(name, value) {
            if (!specsList) return;
            
            // 创建规格项 - 使用两列网格布局
            const specItem = document.createElement('div');
            specItem.className = 'spec-item grid grid-cols-2 gap-4 p-3 border-t border-gray-200 hover:bg-gray-50';
            specItem.setAttribute('data-index', productAttributes.length - 1);
            
            // 创建属性名称单元格
            const nameCell = document.createElement('div');
            nameCell.className = 'font-medium text-gray-800';
            nameCell.textContent = name;
            
            // 创建属性说明单元格
            const valueCell = document.createElement('div');
            // 如果是新添加的内容，显示为红色
            valueCell.className = value ? 'text-red-600' : 'text-gray-600';
            valueCell.textContent = value || '';
            
            // 添加到规格项
            specItem.appendChild(nameCell);
            specItem.appendChild(valueCell);
            
            // 添加点击事件
            specItem.addEventListener('click', () => {
                const index = parseInt(specItem.getAttribute('data-index'));
                const attr = productAttributes[index];
                
                // 填充输入框
                if (specNameInput && specDescriptionInput) {
                    specNameInput.value = attr.name;
                    specDescriptionInput.value = attr.value;
                    
                    // 标记当前编辑的行
                    document.querySelectorAll('.spec-item').forEach(item => {
                        item.classList.remove('bg-blue-50');
                    });
                    specItem.classList.add('bg-blue-50');
                    
                    // 保存当前编辑的索引
                    specNameInput.setAttribute('data-editing-index', index);
                    specDescriptionInput.setAttribute('data-editing-index', index);
                }
            });
            
            // 添加到规格列表
            specsList.appendChild(specItem);
        },
        
        /**
         * 添加规格到记录区域
         * @param {string} specName - 规格名称
         * @param {string} specValue - 规格值
         */
        addSpecToRecordArea: function(specName, specValue) {
            // 获取记录属性列表
            const recordAttributesList = document.getElementById('record-attributes-list');
            if (!recordAttributesList) return;
            
            // 创建属性项
            const attributeItem = document.createElement('div');
            attributeItem.className = 'grid grid-cols-2 gap-2 p-1 border-b';
            
            // 创建属性名称
            const nameElement = document.createElement('div');
            nameElement.className = 'text-xs font-medium';
            nameElement.textContent = specName;
            
            // 创建属性值
            const valueElement = document.createElement('div');
            valueElement.className = 'text-xs';
            valueElement.textContent = specValue;
            
            // 组装属性项
            attributeItem.appendChild(nameElement);
            attributeItem.appendChild(valueElement);
            
            // 添加到记录属性列表
            recordAttributesList.appendChild(attributeItem);
        },
        
        /**
         * 获取所有规格
         * @returns {Array} 规格数组
         */
        getSpecs: function() {
            return productAttributes;
        },
        
        /**
         * 清空规格
         */
        clearSpecs: function() {
            // 清空属性数组
            productAttributes = [];
            
            // 清空规格列表
            if (specsList) {
                specsList.innerHTML = '';
            }
            
            // 清空记录属性列表
            const recordAttributesList = document.getElementById('record-attributes-list');
            if (recordAttributesList) {
                recordAttributesList.innerHTML = '';
            }
            
            // 触发规格变更事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('specs-changed', { productAttributes });
            } else {
                document.dispatchEvent(new CustomEvent('specs-changed', { detail: { productAttributes } }));
            }
        },
        
        /**
         * 更新规格列表
         */
        updateSpecsList: function() {
            if (!specsList) return;
            
            // 清空规格列表
            specsList.innerHTML = '';
            
            // 重新添加所有规格
            productAttributes.forEach((attr, index) => {
                this.addSpecToList(attr.name, attr.value);
            });
            
            // 更新规格索引
            this.updateSpecIndices();
        },
        
        /**
         * 更新规格索引
         */
        updateSpecIndices: function() {
            // 获取所有规格项
            const specItems = document.querySelectorAll('.spec-item');
            
            // 更新索引
            specItems.forEach((item, index) => {
                item.setAttribute('data-index', index);
            });
        }
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化规格管理模块
    ProductSystem.SpecsManager.init();
});
