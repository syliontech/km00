/**
 * TAB管理模块
 * 负责处理TAB切换功能、TAB按钮事件监听和TAB内容显示/隐藏控制
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// TAB管理模块
ProductSystem.TabHandler = (function() {
    // 私有变量
    let activeTab = 'specs'; // 当前激活的TAB
    let tabButtons = [];
    let tabContents = [];
    
    // 公共接口
    return {
        /**
         * 初始化TAB处理程序
         */
        init: function() {
            console.log('初始化TAB管理模块');
            
            // 获取TAB按钮和内容区域
            if (ProductSystem.RightPanel) {
                tabButtons = ProductSystem.RightPanel.getTabButtons();
                tabContents = ProductSystem.RightPanel.getTabContents();
            } else {
                tabButtons = document.querySelectorAll('#tab-buttons button');
                tabContents = document.querySelectorAll('.tab-content');
            }
            
            // 注册事件监听器
            this.registerEventListeners();
            
            // 默认显示规格TAB
            this.switchTab('specs');
            
            console.log('TAB管理模块初始化完成');
        },
        
        /**
         * 注册事件监听器
         */
        registerEventListeners: function() {
            // 监听TAB切换事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.addEventListener('tab-changed', (data) => {
                    this.switchTab(data.tabId);
                });
            }
            
            // 监听工作流状态变更事件
            document.addEventListener('workflow-state-changed', (e) => {
                const { newState } = e.detail;
                
                // 如果进入新建状态，切换到规格TAB
                if (newState === 'new') {
                    this.switchTab('specs');
                }
            });
        },
        
        /**
         * 切换TAB
         * @param {string} tabId - TAB ID
         */
        switchTab: function(tabId) {
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
            
            // 触发TAB已切换事件
            if (ProductSystem.RightPanel) {
                ProductSystem.RightPanel.triggerEvent('tab-switched', { tabId });
            } else {
                document.dispatchEvent(new CustomEvent('tab-switched', { detail: { tabId } }));
            }
        },
        
        /**
         * 获取当前激活的TAB
         * @returns {string} 当前激活的TAB ID
         */
        getActiveTab: function() {
            return activeTab;
        },
        
        /**
         * 启用所有TAB按钮
         */
        enableTabs: function() {
            tabButtons.forEach(button => {
                button.disabled = false;
            });
        },
        
        /**
         * 禁用所有TAB按钮
         */
        disableTabs: function() {
            tabButtons.forEach(button => {
                button.disabled = true;
            });
        },
        
        /**
         * 启用特定TAB
         * @param {string} tabId - TAB ID
         */
        enableTab: function(tabId) {
            const tab = document.querySelector(`button[data-tab="${tabId}"]`);
            if (tab) {
                tab.disabled = false;
                tab.classList.remove('opacity-50');
            }
        },
        
        /**
         * 禁用特定TAB
         * @param {string} tabId - TAB ID
         */
        disableTab: function(tabId) {
            const tab = document.querySelector(`button[data-tab="${tabId}"]`);
            if (tab) {
                tab.disabled = true;
                tab.classList.add('opacity-50');
            }
        }
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化TAB管理模块
    ProductSystem.TabHandler.init();
});
