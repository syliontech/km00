/**
 * 产品数据库管理系统 (PDDB) - 主应用脚本
 * 提供通用功能和Supabase初始化
 */

// 全局应用对象
const App = {
    // Supabase客户端实例
    supabaseClient: null,
    
    // 初始化应用
    init: function() {
        console.log('初始化应用...');
        this.initSupabase();
        this.bindEvents();
    },
    
    // 初始化Supabase连接
    initSupabase: function() {
        try {
            // 检查全局初始化函数是否存在
            if (typeof window.initSupabase === 'function') {
                console.log('使用全局Supabase初始化函数');
                
                // 调用全局初始化函数
                const initialized = window.initSupabase();
                
                if (initialized && window.supabase) {
                    this.supabaseClient = window.supabase;
                    this.showToast('数据库连接成功', 'success');
                    return;
                }
            }
            
            // 检查Supabase是否已经初始化
            if (window.supabase) {
                console.log('Supabase已经初始化，使用现有客户端');
                this.supabaseClient = window.supabase;
                this.showToast('数据库已连接', 'success');
                return;
            }
            
            // 确保Supabase配置已加载
            if (typeof window.SUPABASE_URL === 'undefined' || typeof window.SUPABASE_KEY === 'undefined') {
                throw new Error('Supabase配置未加载');
            }
            
            // 检查supabase对象是否可用
            if (typeof supabase === 'undefined' || !supabase.createClient) {
                throw new Error('Supabase库未正确加载');
            }
            
            // 创建Supabase客户端
            this.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
            
            // 测试连接
            this.supabaseClient.auth.getSession().then(({ data, error }) => {
                if (error) {
                    console.error('Supabase连接失败:', error);
                    this.showToast('数据库连接失败，将使用本地数据', 'error');
                    return;
                }
                console.log('Supabase连接成功');
                this.showToast('数据库连接成功', 'success');
            });
            
            // 导出到全局作用域，方便其他模块使用
            window.supabase = this.supabaseClient;
            
        } catch (error) {
            console.error('初始化Supabase失败:', error);
            this.showToast('数据库初始化失败，将使用本地数据', 'error');
        }
    },
    
    // 绑定全局事件
    bindEvents: function() {
        // 这里可以添加全局事件监听器
        console.log('绑定全局事件...');
    },
    
    // 显示提示消息
    showToast: function(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`;
        
        // 设置内容
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    },
    
    // 生成随机ID（1位英文或数字）
    generateSingleId: function() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    },
    
    // 生成随机字符
    generateRandomChar: function() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    },
    
    // 生成变码
    generateVariationCode: function() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
