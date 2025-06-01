/**
 * 右区面板核心结构
 * 负责初始化右区面板，协调各模块之间的交互，提供全局事件监听和触发
 */

// 兼容性检查
console.log('检查浏览器兼容性...');
try {
    // 检查CustomEvent支持
    if (typeof CustomEvent !== 'function') {
        console.warn('浏览器不支持CustomEvent，正在创建兼容层');
        window.CustomEvent = function(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: null };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
    }
    console.log('兼容性检查完成');
} catch (e) {
    console.error('兼容性检查失败:', e);
}

// 创建全局命名空间
window.ProductSystem = window.ProductSystem || {};

// 全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', message, 'at', source, lineno, colno);
    console.error('错误对象:', error);
    return false;
};

// 右区面板模块
ProductSystem.RightPanel = (function() {
    // 私有变量
    let rightPanel = null;
    let tabButtons = [];
    let tabContents = [];
    let eventListeners = {};
    
    // 公共接口
    return {
        /**
         * 初始化右区面板
         */
        init: function() {
            try {
                console.log('开始初始化右区面板核心结构');
                
                // 检查DOM是否已加载
                if (document.readyState === 'loading') {
                    console.warn('DOM尚未完全加载，延迟初始化');
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('DOM已加载，现在初始化');
                        this.initAfterDOMLoaded();
                    });
                    return;
                }
                
                this.initAfterDOMLoaded();
            } catch (e) {
                console.error('初始化右区面板时发生错误:', e);
            }
        },
        
        /**
         * DOM加载后初始化
         */
        initAfterDOMLoaded: function() {
            try {
                console.log('获取右区面板元素...');
                // 获取右区面板
                rightPanel = document.getElementById('rightPanel');
                
                // 如果右区面板不存在，则退出
                if (!rightPanel) {
                    console.error('右区面板不存在，请检查HTML结构');
                    // 尝试获取所有可能的容器
                    console.log('尝试查找其他可能的容器...');
                    const possibleContainers = document.querySelectorAll('.container, .main, .content, .right-panel');
                    console.log('找到可能的容器:', possibleContainers.length);
                    return;
                }
                
                console.log('获取TAB按钮和内容区域...');
                // 获取所有TAB按钮和内容区域
                tabButtons = document.querySelectorAll('#tab-buttons button');
                tabContents = document.querySelectorAll('.tab-content');
                
                console.log('找到TAB按钮:', tabButtons.length);
                console.log('找到TAB内容区域:', tabContents.length);
                
                // 初始化事件处理程序
                this.registerEventHandlers();
                
                // 初始化模块
                this.initModules();
                
                console.log('右区面板核心结构初始化完成');
            } catch (e) {
                console.error('DOM加载后初始化时发生错误:', e);
            }
        },
        
        /**
         * 注册事件处理程序
         */
        registerEventHandlers: function() {
            try {
                console.log('开始注册事件处理程序...');
                
                // 检查tabButtons是否存在
                if (!tabButtons || tabButtons.length === 0) {
                    console.warn('TAB按钮不存在或为空，请检查HTML结构');
                    // 尝试重新获取
                    tabButtons = document.querySelectorAll('#tab-buttons button');
                    console.log('重新获取到TAB按钮:', tabButtons.length);
                }
                
                // 为TAB按钮添加点击事件
                console.log('为', tabButtons.length, '个TAB按钮添加点击事件');
                tabButtons.forEach((button, index) => {
                    try {
                        const tabId = button.getAttribute('data-tab');
                        console.log(`添加事件到TAB按钮 ${index}: ${tabId}`);
                        
                        button.addEventListener('click', function() {
                            try {
                                const tabId = this.getAttribute('data-tab');
                                console.log('点击了TAB:', tabId);
                                
                                // 检查工作流状态
                                if (window.workflowState === 'idle') {
                                    console.log('待机状态，无法切换TAB');
                                    return;
                                }
                                
                                // 触发TAB切换事件
                                ProductSystem.RightPanel.triggerEvent('tab-changed', { tabId });
                            } catch (e) {
                                console.error(`TAB按钮点击事件处理错误:`, e);
                            }
                        });
                    } catch (e) {
                        console.error(`为TAB按钮 ${index} 添加事件时出错:`, e);
                    }
                });
                
                // 添加工作流状态变更监听
                console.log('添加工作流状态变更监听...');
                document.addEventListener('workflow-state-changed', function(e) {
                    try {
                        console.log('收到工作流状态变更事件:', e);
                        const detail = e.detail || {};
                        const oldState = detail.oldState || 'unknown';
                        const newState = detail.newState || 'unknown';
                        
                        console.log(`工作流状态从 ${oldState} 变更为 ${newState}`);
                        
                        // 更新UI
                        ProductSystem.RightPanel.updateUIByWorkflowState(newState);
                    } catch (e) {
                        console.error('工作流状态变更事件处理错误:', e);
                    }
                });
                
                console.log('事件处理程序注册完成');
            } catch (e) {
                console.error('注册事件处理程序时发生错误:', e);
            }
        },
        
        /**
         * 初始化模块
         */
        initModules: function() {
            try {
                console.log('开始初始化模块...');
                
                // 初始化TAB处理程序
                console.log('检查TabHandler模块...');
                if (ProductSystem.TabHandler) {
                    console.log('初始化TabHandler模块');
                    try {
                        ProductSystem.TabHandler.init();
                        console.log('TabHandler模块初始化成功');
                    } catch (e) {
                        console.error('TabHandler模块初始化失败:', e);
                    }
                } else {
                    console.warn('TabHandler模块不存在，请检查是否已加载tab-handler.js');
                }
                
                // 初始化规格管理器
                console.log('检查SpecsManager模块...');
                if (ProductSystem.SpecsManager) {
                    console.log('初始化SpecsManager模块');
                    try {
                        ProductSystem.SpecsManager.init();
                        console.log('SpecsManager模块初始化成功');
                    } catch (e) {
                        console.error('SpecsManager模块初始化失败:', e);
                    }
                } else {
                    console.warn('SpecsManager模块不存在，请检查是否已加载specs-manager.js');
                }
                
                // 初始化组套管理器
                console.log('检查KitManager模块...');
                if (ProductSystem.KitManager) {
                    console.log('初始化KitManager模块');
                    try {
                        ProductSystem.KitManager.init();
                        console.log('KitManager模块初始化成功');
                    } catch (e) {
                        console.error('KitManager模块初始化失败:', e);
                    }
                } else {
                    console.warn('KitManager模块不存在，请检查是否已加载kit-manager.js');
                }
                
                // 初始化供应商/客户管理器
                console.log('检查VendorClientManager模块...');
                if (ProductSystem.VendorClientManager) {
                    console.log('初始化VendorClientManager模块');
                    try {
                        ProductSystem.VendorClientManager.init();
                        console.log('VendorClientManager模块初始化成功');
                    } catch (e) {
                        console.error('VendorClientManager模块初始化失败:', e);
                    }
                } else {
                    console.warn('VendorClientManager模块不存在，请检查是否已加载vendor-client-manager.js');
                }
                
                console.log('所有模块初始化完成');
            } catch (e) {
                console.error('初始化模块时发生错误:', e);
            }
        },
        
        /**
         * 触发事件
         * @param {string} eventName - 事件名称
         * @param {Object} data - 事件数据
         */
        triggerEvent: function(eventName, data) {
            try {
                console.log(`开始触发事件: ${eventName}`, data);
                
                // 验证参数
                if (!eventName) {
                    console.error('事件名称不能为空');
                    return;
                }
                
                // 确保数据是对象
                if (!data) {
                    console.warn(`事件 ${eventName} 的数据为空，使用空对象`);
                    data = {};
                }
                
                // 创建自定义事件
                console.log(`创建自定义事件: ${eventName}`);
                let event;
                try {
                    event = new CustomEvent(eventName, { detail: data });
                } catch (e) {
                    console.error(`创建自定义事件失败: ${e.message}`);
                    // 尝试使用兼容方式
                    try {
                        event = document.createEvent('CustomEvent');
                        event.initCustomEvent(eventName, true, true, data);
                        console.log('使用兼容方式创建事件成功');
                    } catch (e2) {
                        console.error('兼容方式也失败，无法触发事件:', e2);
                        return;
                    }
                }
                
                // 分发事件
                console.log(`分发事件到document: ${eventName}`);
                try {
                    document.dispatchEvent(event);
                    console.log(`事件 ${eventName} 分发成功`);
                } catch (e) {
                    console.error(`分发事件失败: ${e.message}`);
                }
                
                // 调用注册的监听器
                if (eventListeners[eventName]) {
                    const listenerCount = eventListeners[eventName].length;
                    console.log(`调用 ${listenerCount} 个注册的监听器函数`);
                    
                    eventListeners[eventName].forEach((listener, index) => {
                        try {
                            console.log(`调用监听器 ${index + 1}/${listenerCount}`);
                            listener(data);
                        } catch (e) {
                            console.error(`监听器 ${index + 1} 执行失败:`, e);
                        }
                    });
                } else {
                    console.log(`没有找到事件 ${eventName} 的监听器`);
                }
                
                console.log(`事件 ${eventName} 触发完成`);
            } catch (e) {
                console.error(`触发事件 ${eventName} 时发生错误:`, e);
            }
        },
        
        /**
         * 添加事件监听器
         * @param {string} eventName - 事件名称
         * @param {Function} callback - 回调函数
         */
        addEventListener: function(eventName, callback) {
            try {
                console.log(`尝试添加事件监听器: ${eventName}`);
                
                // 验证参数
                if (!eventName) {
                    console.error('事件名称不能为空');
                    return;
                }
                
                if (!callback || typeof callback !== 'function') {
                    console.error(`为事件 ${eventName} 添加的回调必须是函数`);
                    return;
                }
                
                // 初始化事件监听器数组
                if (!eventListeners[eventName]) {
                    console.log(`创建新的事件监听器数组: ${eventName}`);
                    eventListeners[eventName] = [];
                }
                
                // 检查是否已经添加过相同的监听器
                const isDuplicate = eventListeners[eventName].some(listener => listener === callback);
                if (isDuplicate) {
                    console.warn(`该监听器已经添加到事件 ${eventName} 中，不重复添加`);
                    return;
                }
                
                // 添加监听器
                eventListeners[eventName].push(callback);
                console.log(`成功添加监听器到事件 ${eventName}，当前有 ${eventListeners[eventName].length} 个监听器`);
            } catch (e) {
                console.error(`添加事件监听器时发生错误:`, e);
            }
        },
        
        /**
         * 移除事件监听器
         * @param {string} eventName - 事件名称
         * @param {Function} callback - 回调函数
         */
        removeEventListener: function(eventName, callback) {
            try {
                console.log(`尝试移除事件监听器: ${eventName}`);
                
                // 验证参数
                if (!eventName) {
                    console.error('事件名称不能为空');
                    return;
                }
                
                if (!callback || typeof callback !== 'function') {
                    console.error(`移除的回调必须是函数`);
                    return;
                }
                
                // 检查事件监听器数组是否存在
                if (!eventListeners[eventName]) {
                    console.warn(`事件 ${eventName} 没有注册的监听器`);
                    return;
                }
                
                // 记录原始长度
                const originalLength = eventListeners[eventName].length;
                
                // 移除监听器
                eventListeners[eventName] = eventListeners[eventName].filter(
                    listener => listener !== callback
                );
                
                // 检查是否成功移除
                const newLength = eventListeners[eventName].length;
                if (originalLength === newLength) {
                    console.warn(`没有找到要移除的监听器`);
                } else {
                    console.log(`成功从事件 ${eventName} 移除监听器，当前还有 ${newLength} 个监听器`);
                }
                
                // 如果没有监听器了，清理数组
                if (eventListeners[eventName].length === 0) {
                    console.log(`事件 ${eventName} 没有监听器了，清理数组`);
                    delete eventListeners[eventName];
                }
            } catch (e) {
                console.error(`移除事件监听器时发生错误:`, e);
            }
        },
        
        /**
         * 根据工作流状态更新UI
         * @param {string} state - 工作流状态
         */
        updateUIByWorkflowState: function(state) {
            try {
                console.log(`开始根据工作流状态更新UI: ${state}`);
                
                // 验证状态参数
                if (!state) {
                    console.error('工作流状态为空，使用默认值“idle”');
                    state = 'idle';
                }
                
                // 检查状态是否有效
                const validStates = ['idle', 'new', 'edit', 'modify'];
                if (!validStates.includes(state)) {
                    console.warn(`无效的工作流状态: ${state}，使用默认值“idle”`);
                    state = 'idle';
                }
                
                console.log(`获取工作流相关按钮...`);
                // 获取相关按钮和区域
                const newBtn = document.getElementById('new-record-btn');
                const editBtn = document.getElementById('edit-btn');
                const modifyBtn = document.getElementById('modify-btn');
                const saveRecordBtn = document.getElementById('save-record-btn');
                const cancelBtn = document.getElementById('cancel-btn');
                
                // 检查按钮是否存在
                const missingButtons = [];
                if (!newBtn) missingButtons.push('new-record-btn');
                if (!editBtn) missingButtons.push('edit-btn');
                if (!modifyBtn) missingButtons.push('modify-btn');
                if (!saveRecordBtn) missingButtons.push('save-record-btn');
                if (!cancelBtn) missingButtons.push('cancel-btn');
                
                if (missingButtons.length > 0) {
                    console.warn(`以下按钮不存在: ${missingButtons.join(', ')}，请检查HTML结构`);
                }
                
                // 根据工作流状态更新按钮状态
                if (newBtn && editBtn && modifyBtn && saveRecordBtn && cancelBtn) {
                    console.log(`更新按钮状态为 ${state} 状态`);
                    switch (state) {
                        case 'idle':
                            console.log('设置为待机状态按钮配置');
                            // 待机状态：只有新建按钮可用
                            newBtn.disabled = false;
                            editBtn.disabled = true;
                            modifyBtn.disabled = true;
                            saveRecordBtn.disabled = true;
                            cancelBtn.disabled = true;
                            
                            // 禁用所有TAB按钮
                            console.log('禁用所有TAB按钮');
                            try {
                                if (!tabButtons || tabButtons.length === 0) {
                                    console.warn('TAB按钮列表为空，无法禁用');
                                } else {
                                    tabButtons.forEach((button, index) => {
                                        try {
                                            button.disabled = true;
                                        } catch (e) {
                                            console.error(`禁用TAB按钮 ${index} 时出错:`, e);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('禁用TAB按钮时出错:', e);
                            }
                            break;
                            
                        case 'new':
                            console.log('设置为新建状态按钮配置');
                            // 新建状态：新建按钮不可用，其他按钮可用
                            newBtn.disabled = true;
                            editBtn.disabled = true;
                            modifyBtn.disabled = true;
                            saveRecordBtn.disabled = false;
                            cancelBtn.disabled = false;
                            
                            // 启用所有TAB按钮
                            console.log('启用所有TAB按钮');
                            try {
                                if (!tabButtons || tabButtons.length === 0) {
                                    console.warn('TAB按钮列表为空，无法启用');
                                } else {
                                    tabButtons.forEach((button, index) => {
                                        try {
                                            button.disabled = false;
                                        } catch (e) {
                                            console.error(`启用TAB按钮 ${index} 时出错:`, e);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('启用TAB按钮时出错:', e);
                            }
                            break;
                            
                        case 'edit':
                            console.log('设置为编辑状态按钮配置');
                            // 编辑状态：编辑按钮不可用，其他按钮可用
                            newBtn.disabled = true;
                            editBtn.disabled = true;
                            modifyBtn.disabled = false;
                            saveRecordBtn.disabled = false;
                            cancelBtn.disabled = false;
                            
                            // 启用所有TAB按钮
                            console.log('启用所有TAB按钮');
                            try {
                                if (!tabButtons || tabButtons.length === 0) {
                                    console.warn('TAB按钮列表为空，无法启用');
                                } else {
                                    tabButtons.forEach((button, index) => {
                                        try {
                                            button.disabled = false;
                                        } catch (e) {
                                            console.error(`启用TAB按钮 ${index} 时出错:`, e);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('启用TAB按钮时出错:', e);
                            }
                            break;
                            
                        case 'modify':
                            console.log('设置为修改状态按钮配置');
                            // 修改状态：修改按钮不可用，其他按钮可用
                            newBtn.disabled = true;
                            editBtn.disabled = true;
                            modifyBtn.disabled = true;
                            saveRecordBtn.disabled = false;
                            cancelBtn.disabled = false;
                            
                            // 启用所有TAB按钮
                            console.log('启用所有TAB按钮');
                            try {
                                if (!tabButtons || tabButtons.length === 0) {
                                    console.warn('TAB按钮列表为空，无法启用');
                                } else {
                                    tabButtons.forEach((button, index) => {
                                        try {
                                            button.disabled = false;
                                        } catch (e) {
                                            console.error(`启用TAB按钮 ${index} 时出错:`, e);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('启用TAB按钮时出错:', e);
                            }
                            break;
                            
                        default:
                            console.warn(`未知的工作流状态: ${state}，使用默认待机状态配置`);
                            // 默认使用待机状态配置
                            newBtn.disabled = false;
                            editBtn.disabled = true;
                            modifyBtn.disabled = true;
                            saveRecordBtn.disabled = true;
                            cancelBtn.disabled = true;
                            break;
                    }
                } else {
                    console.error('缺少必要的按钮元素，无法更新UI');
                }
                
                // 触发UI更新事件
                console.log('触发UI更新事件');
                try {
                    this.triggerEvent('ui-updated', { state });
                } catch (e) {
                    console.error('触发UI更新事件时出错:', e);
                }
                
                console.log(`工作流状态UI更新完成: ${state}`);
            } catch (e) {
                console.error('更新UI时发生错误:', e);
            }
        },
        
        /**
         * 获取右区面板
         * @returns {HTMLElement} 右区面板元素
         */
        getRightPanel: function() {
            try {
                console.log('获取右区面板元素');
                
                if (!rightPanel) {
                    console.warn('右区面板元素不存在，尝试重新获取');
                    rightPanel = document.getElementById('rightPanel');
                    
                    if (!rightPanel) {
                        console.error('无法获取右区面板元素，请检查HTML结构');
                        return null;
                    }
                }
                
                return rightPanel;
            } catch (e) {
                console.error('获取右区面板元素时发生错误:', e);
                return null;
            }
        },
        
        /**
         * 获取TAB按钮
         * @returns {NodeList} TAB按钮列表
         */
        getTabButtons: function() {
            try {
                console.log('获取TAB按钮列表');
                
                if (!tabButtons || tabButtons.length === 0) {
                    console.warn('TAB按钮列表为空，尝试重新获取');
                    tabButtons = document.querySelectorAll('#tab-buttons button');
                    
                    if (!tabButtons || tabButtons.length === 0) {
                        console.error('无法获取TAB按钮列表，请检查HTML结构');
                    } else {
                        console.log(`重新获取到 ${tabButtons.length} 个TAB按钮`);
                    }
                } else {
                    console.log(`返回 ${tabButtons.length} 个TAB按钮`);
                }
                
                return tabButtons;
            } catch (e) {
                console.error('获取TAB按钮列表时发生错误:', e);
                return [];
            }
        },
        
        /**
         * 获取TAB内容
         * @returns {NodeList} TAB内容列表
         */
        getTabContents: function() {
            try {
                console.log('获取TAB内容列表');
                
                if (!tabContents || tabContents.length === 0) {
                    console.warn('TAB内容列表为空，尝试重新获取');
                    tabContents = document.querySelectorAll('.tab-content');
                    
                    if (!tabContents || tabContents.length === 0) {
                        console.error('无法获取TAB内容列表，请检查HTML结构');
                    } else {
                        console.log(`重新获取到 ${tabContents.length} 个TAB内容区域`);
                    }
                } else {
                    console.log(`返回 ${tabContents.length} 个TAB内容区域`);
                }
                
                return tabContents;
            } catch (e) {
                console.error('获取TAB内容列表时发生错误:', e);
                return [];
            }
        }
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化右区面板
    ProductSystem.RightPanel.init();
});
