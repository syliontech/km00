/**
 * 规格管理模块
 * 负责处理规格管理功能、添加属性到列表和将属性传递到记录区域
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// 规格管理模块
ProductSystem.SpecsManager = (function() {
    // 私有变量
    let productAttributes = []; // 产品属性数组 - 属性名称和说明的数组
    let attributeDescriptions = {}; // 属性说明字典 - 存储属性名称对应的多个说明
    let specsList = null;
    let addSpecBtn = null; // 添加属性按钮
    let specNameInput = null; // 属性名称输入框
    let specDescriptionInput = null; // 属性说明输入框
    let currentEditingAttr = null; // 当前正在编辑的属性
    
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
            specNameInput = document.getElementById('spec-name');
            specDescriptionInput = document.getElementById('spec-description');
            
            // 初始化属性说明字典
            attributeDescriptions = {};
            
            // 注册事件监听器
            this.registerEventListeners();
            
            // 初始化现有规格行
            this.initExistingSpecs();
            
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
                    currentEditingAttr = null;
                    
                    // 注意：添加属性按钮不启动工作流闭环
                });
            }
            
            // 属性名称输入框变更事件
            if (specNameInput) {
                specNameInput.addEventListener('change', function() {
                    // 属性名称可以为空，但不启动工作流闭环
                    const newName = this.value.trim();
                    currentEditingAttr = newName;
                });
            }
            
            // 属性说明输入框变更事件 - 启动工作流闭环
            if (specDescriptionInput) {
                specDescriptionInput.addEventListener('change', function() {
                    const newValue = this.value.trim();
                    
                    // 如果没有当前编辑的属性名称，则不处理
                    if (!currentEditingAttr) return;
                    
                    // 添加或修改说明启动工作流闭环
                    if (window.workflowState !== 'idle') {
                        // 将说明添加到属性说明字典
                        if (!attributeDescriptions[currentEditingAttr]) {
                            attributeDescriptions[currentEditingAttr] = [];
                        }
                        
                        // 如果说明不为空，添加到说明数组
                        if (newValue) {
                            attributeDescriptions[currentEditingAttr].push(newValue);
                            
                            // 添加到列表中
                            self.addSpecToList(currentEditingAttr, newValue);
                            
                            // 添加到记录区域
                            self.addSpecToRecordArea(currentEditingAttr, newValue);
                            
                            // 启动工作流闭环
                            if (typeof window.startWorkflowLoop === 'function' && !window.workflowLoopStarted) {
                                window.startWorkflowLoop();
                            }
                            
                            if (typeof window.changeWorkflowState === 'function') {
                                window.changeWorkflowState('modify');
                            }
                        }
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
         * 初始化现有规格行
         */
        initExistingSpecs: function() {
            if (!specsList) return;
            
            // 获取现有的规格行
            const existingSpecItems = specsList.querySelectorAll('.spec-item');
            
            // 清空属性数组和属性说明字典
            productAttributes = [];
            attributeDescriptions = {};
            
            // 遍历现有规格行
            existingSpecItems.forEach((item, index) => {
                // 获取属性名和值
                const nameCell = item.querySelector('div:first-child');
                const valueCell = item.querySelector('div:nth-child(2)');
                
                if (nameCell && valueCell) {
                    const name = nameCell.textContent.trim();
                    const value = valueCell.textContent.trim();
                    
                    // 添加到属性数组
                    productAttributes.push({
                        name: name,
                        value: value
                    });
                    
                    // 添加到属性说明字典
                    if (!attributeDescriptions[name]) {
                        attributeDescriptions[name] = [];
                    }
                    if (value) {
                        attributeDescriptions[name].push(value);
                    }
                    
                    // 添加编辑和删除按钮
                    this.addControlButtons(item, name, value, index);
                    
                    // 设置索引
                    item.setAttribute('data-index', index);
                    item.setAttribute('data-name', name);
                    item.setAttribute('data-value', value);
                }
            });
        },
        
        /**
         * 添加控制按钮（编辑和删除）
         * @param {HTMLElement} item - 规格行元素
         * @param {string} name - 属性名称
         * @param {string} value - 属性说明
         * @param {number} index - 行索引
         */
        addControlButtons: function(item, name, value, index) {
            // 创建操作按钮容器
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'flex items-center space-x-2 ml-2';
            
            // 创建编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'text-blue-600 hover:text-blue-800 p-1';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = '编辑说明';
            
            // 添加编辑按钮点击事件
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                
                // 设置当前编辑的属性
                currentEditingAttr = name;
                
                // 填充输入框
                specNameInput.value = name;
                specDescriptionInput.value = '';
                specDescriptionInput.focus();
                
                // 高亮当前行
                document.querySelectorAll('.spec-item').forEach(row => {
                    row.classList.remove('bg-blue-50');
                });
                item.classList.add('bg-blue-50');
            });
            
            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-red-600 hover:text-red-800 p-1';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = '删除规格';
            
            // 添加删除按钮点击事件
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                
                // 确认删除
                if (confirm(`确定要删除属性"${name}"及其说明"${value}"吗？`)) {
                    // 从属性数组中删除
                    const itemIndex = parseInt(item.getAttribute('data-index'));
                    if (itemIndex >= 0 && itemIndex < productAttributes.length) {
                        productAttributes.splice(itemIndex, 1);
                    }
                    
                    // 从属性说明字典中删除该说明
                    if (attributeDescriptions[name]) {
                        const valueIndex = attributeDescriptions[name].indexOf(value);
                        if (valueIndex >= 0) {
                            attributeDescriptions[name].splice(valueIndex, 1);
                        }
                        
                        // 如果该属性没有说明了，删除该属性
                        if (attributeDescriptions[name].length === 0) {
                            delete attributeDescriptions[name];
                        }
                    }
                    
                    // 从DOM中删除
                    item.remove();
                    
                    // 更新规格索引
                    this.updateSpecIndices();
                    
                    // 清空输入框
                    specNameInput.value = '';
                    specDescriptionInput.value = '';
                    currentEditingAttr = null;
                }
            });
            
            // 添加按钮到操作容器
            actionsContainer.appendChild(editBtn);
            actionsContainer.appendChild(deleteBtn);
            
            // 添加操作容器到规格行
            // 找到值单元格并添加按钮
            const valueCell = item.querySelector('div:nth-child(2)');
            if (valueCell) {
                valueCell.appendChild(actionsContainer);
            } else {
                item.appendChild(actionsContainer);
            }
            
            // 添加点击事件用于选择行
            item.addEventListener('click', () => {
                // 设置当前编辑的属性
                currentEditingAttr = name;
                
                // 填充输入框
                specNameInput.value = name;
                specDescriptionInput.value = '';
                
                // 高亮当前行
                document.querySelectorAll('.spec-item').forEach(row => {
                    row.classList.remove('bg-blue-50');
                });
                item.classList.add('bg-blue-50');
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
            
            // 添加到属性说明字典
            if (!attributeDescriptions[name]) {
                attributeDescriptions[name] = [];
            }
            if (value) {
                attributeDescriptions[name].push(value);
            }
            
            // 添加到规格列表
            this.addSpecToList(name, value);
            
            // 添加到记录区域
            if (value) {
                this.addSpecToRecordArea(name, value);
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
            specItem.className = 'spec-item grid grid-cols-2 gap-4 p-3 border-t border-gray-200 hover:bg-gray-50 relative';
            specItem.setAttribute('data-index', productAttributes.length - 1);
            specItem.setAttribute('data-name', name);
            specItem.setAttribute('data-value', value || '');
            
            // 创建属性名称单元格
            const nameCell = document.createElement('div');
            nameCell.className = 'font-medium text-gray-800';
            nameCell.textContent = name;
            
            // 创建属性说明单元格
            const valueCell = document.createElement('div');
            valueCell.className = 'flex items-center justify-between';
            
            // 创建说明文本元素
            const valueText = document.createElement('span');
            valueText.className = value ? 'text-red-600' : 'text-gray-600';
            valueText.textContent = value || '';
            valueCell.appendChild(valueText);
            
            // 添加到规格项
            specItem.appendChild(nameCell);
            specItem.appendChild(valueCell);
            
            // 添加控制按钮（编辑和删除）
            this.addControlButtons(specItem, name, value, productAttributes.length - 1);
            
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
