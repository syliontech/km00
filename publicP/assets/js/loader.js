// 动态加载UTF-8编码的index-tabs-utf8.js文件
document.addEventListener('DOMContentLoaded', function() {
    // 创建script元素
    const script = document.createElement('script');
    script.src = 'assets/js/index-tabs-utf8.js';
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    
    // 添加到页面
    document.head.appendChild(script);
    
    // 移除原始的index-tabs.js脚本（如果存在）
    const originalScript = document.querySelector('script[src="assets/js/index-tabs.js"]');
    if (originalScript) {
        originalScript.parentNode.removeChild(originalScript);
    }
});
