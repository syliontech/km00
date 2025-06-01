// 右区TAB切换功能 - 简化版
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化右区TAB功能');
    
    // 获取右区面板
    const rightPanel = document.getElementById('rightPanel');
    
    // 如果右区面板不存在，则退出
    if (!rightPanel) {
        console.error('右区面板不存在');
        return;
    }
    
    console.log('找到右区面板:', rightPanel);
    
    // 获取所有TAB按钮
    const tabButtons = document.querySelectorAll('#tab-buttons button');
    console.log('找到TAB按钮数量:', tabButtons.length);
    
    const tabContents = document.querySelectorAll('.tab-content');
    console.log('找到TAB内容区域数量:', tabContents.length);
    
    // 为每个TAB按钮添加点击事件
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前TAB的数据属性
            const tabId = this.getAttribute('data-tab');
            console.log('点击了TAB:', tabId);
            
            // 切换TAB状态
            switchTab(tabId);
        });
    });
    
    // 切换TAB的函数
    function switchTab(tabId) {
        console.log('切换到TAB:', tabId);
        
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
            console.log('激活按钮:', activeButton);
        } else {
            console.error(`未找到TAB按钮: ${tabId}`);
        }
        
        // 显示当前TAB内容
        const activeContent = document.getElementById(`${tabId}-content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
            console.log('显示内容区域:', activeContent);
        } else {
            console.error(`未找到TAB内容: ${tabId}-content`);
        }
    }
    
    // 初始化显示规格TAB
    console.log('初始化显示规格TAB');
    // 确保在DOM完全加载后执行
    setTimeout(() => {
        const defaultTab = 'specs';
        const defaultButton = document.querySelector(`button[data-tab="${defaultTab}"]`);
        if (defaultButton) {
            defaultButton.click();
        } else {
            console.error('未找到默认TAB按钮');
            // 尝试获取第一个TAB按钮
            const firstButton = tabButtons[0];
            if (firstButton) {
                firstButton.click();
            } else {
                console.error('未找到任何TAB按钮');
            }
        }
    }, 100);
    
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
        });
    }
});
