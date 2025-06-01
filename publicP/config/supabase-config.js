/**
 * Supabase配置文件
 */

// Supabase项目配置
// 注意：如果使用本地IP连接失败，请使用模拟数据进行测试
const SUPABASE_URL = 'http://192.168.10.18:8001';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3Mzk5ODA4MDAsCiAgImV4cCI6IDE4OTc3NDcyMDAKfQ.R-WtvrIqYWdRdxbJ-lbORwsc3xaGwByKo6pauxE7Iuw';

// 模拟数据配置
window.CONFIG = window.CONFIG || {};
window.CONFIG.FORCE_MOCK_DATA = false; // 不使用模拟数据，直接从数据库获取数据

// 模拟分类数据
window.CONFIG.mockCategories = [
  {
    category_pkey: 1,
    purpose_name: '电子产品',
    epurpose_name: 'Electronics',
    category_name: '手机',
    ecategory_name: 'Mobile Phone',
    subcategory_name: '智能手机',
    esubcategory_name: 'Smartphone',
    detail_name: '高端机型',
    edetail_name: 'High-end Model',
    code: 'E1S1H1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    category_pkey: 2,
    purpose_name: '电子产品',
    epurpose_name: 'Electronics',
    category_name: '电脑',
    ecategory_name: 'Computer',
    subcategory_name: '笔记本电脑',
    esubcategory_name: 'Laptop',
    detail_name: '商务本',
    edetail_name: 'Business Laptop',
    code: 'E2L1B1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    category_pkey: 3,
    purpose_name: '家居用品',
    epurpose_name: 'Home Goods',
    category_name: '家具',
    ecategory_name: 'Furniture',
    subcategory_name: '沙发',
    esubcategory_name: 'Sofa',
    detail_name: '皮质沙发',
    edetail_name: 'Leather Sofa',
    code: 'H1F1L1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// 将配置导出到全局作用域
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;

// 初始化Supabase客户端
function initSupabase() {
    console.log('开始初始化Supabase客户端...');
    
    // 确保Supabase库已加载
    if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.error('Supabase库未正确加载');
        return false;
    }

    try {
        // 初始化Supabase客户端
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 导出到全局作用域
        window.supabase = supabaseClient;
        
        console.log('Supabase客户端初始化成功');
        
        // 测试连接
        supabaseClient.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('Supabase连接失败:', error);
                return;
            }
            console.log('Supabase连接成功');
        });
        
        return true;
    } catch (error) {
        console.error('Supabase初始化失败:', error);
        return false;
    }
}

// 在页面加载后立即初始化
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initSupabase === 'function') {
        console.log('DOMContentLoaded: Calling initSupabase()...');
        initSupabase();
    } else {
        console.error('DOMContentLoaded: initSupabase is not defined or not a function. Ensure supabase-config.js is loaded correctly and initSupabase is globally available.');
    }
});

// 导出初始化函数
window.initSupabase = initSupabase;
