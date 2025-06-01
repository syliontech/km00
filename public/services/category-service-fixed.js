/**
 * 产品数据库管理系统 (PDDB) - 分类服务
 * 负责与Supabase数据库交互，管理产品分类数据
 */

class CategoryService {
    constructor() {
        this.tableName = 'category'; // 修正为小写，与数据库表名一致
        
        // 初始化ID缓存，用于存储已生成的ID
        this.idCache = {
            purpose: {}, // 用途ID缓存，格式：{'用途名称': 'ID'}
            category: {}, // 产品分类ID缓存
            subcategory: {}, // 产品细分ID缓存
            detail: {} // 细分说明ID缓存
        };
        
        console.log('分类服务创建完成');
    }
    
    /**
     * 初始化服务
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async init() {
        try {
            console.log('初始化分类服务...');
            
            // 尝试初始化 Supabase 客户端
            if (!window.supabase) {
                console.log('Supabase客户端未初始化，尝试初始化...');
                
                // 检查是否有初始化函数
                if (typeof window.initSupabase === 'function') {
                    console.log('调用全局 initSupabase 函数...');
                    window.initSupabase();
                } else if (typeof supabase !== 'undefined' && typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_KEY !== 'undefined') {
                    // 如果 initSupabase 不可用但有必要的变量，手动创建客户端
                    console.log('手动创建 Supabase 客户端...');
                    window.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
                }
                
                // 再次检查是否初始化成功
                if (!window.supabase) {
                    console.warn('无法初始化 Supabase 客户端，将使用模拟数据');
                    // 继续执行，但会在 getCategories 中使用模拟数据
                }
            }
            
            // 设置 Supabase 客户端（如果可用）
            if (window.supabase) {
                this.supabaseClient = window.supabase;
                console.log('Supabase 客户端设置成功');
            }
            
            // 预加载所有分类数据
            await this.loadAllCategories();
            
            console.log('分类服务初始化完成');
            return true;
        } catch (error) {
            console.error('分类服务初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 预加载所有分类数据，并将其存储在全局变量中
     */
    async loadAllCategories() {
        try {
            console.log('预加载所有分类数据...');
            
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                console.log('使用模拟数据');
                window.allCategories = window.CONFIG.mockCategories || [];
                return;
            }
            
            // 使用简单的查询，避免中文字段名问题
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .order('category_pkey', { ascending: true });

            if (error) {
                console.error('预加载分类数据失败:', error);
                window.allCategories = [];
                return;
            }

            // 将数据存储在全局变量中
            window.allCategories = data || [];
            console.log('成功预加载分类数据:', window.allCategories.length, '条记录');
            
            // 预填充ID缓存
            this.populateIdCache();
        } catch (error) {
            console.error('预加载分类数据时发生错误:', error);
            window.allCategories = [];
        }
    }

    /**
     * 根据预加载的分类数据填充ID缓存
     */
    populateIdCache() {
        try {
            const categories = window.allCategories || [];
            
            for (const category of categories) {
                // 填充用途ID缓存
                if (category.purpose_name && category.purpose_id) {
                    if (!this.idCache.purpose) this.idCache.purpose = {};
                    this.idCache.purpose[category.purpose_name] = category.purpose_id;
                }
                
                // 填充产品分类ID缓存
                if (category.category_name && category.category_id) {
                    if (!this.idCache.category) this.idCache.category = {};
                    this.idCache.category[category.category_name] = category.category_id;
                }
                
                // 填充产品细分ID缓存
                if (category.subcategory_name && category.subcategory_id) {
                    if (!this.idCache.subcategory) this.idCache.subcategory = {};
                    this.idCache.subcategory[category.subcategory_name] = category.subcategory_id;
                }
                
                // 填充细分说明ID缓存
                if (category.detail_name && category.detail_id) {
                    if (!this.idCache.detail) this.idCache.detail = {};
                    this.idCache.detail[category.detail_name] = category.detail_id;
                }
            }
            
            console.log('ID缓存填充完成');
        } catch (error) {
            console.error('填充ID缓存时发生错误:', error);
        }
    }

    /**
     * 获取所有分类
     * @returns {Promise<Array>} 分类数据数组
     */
    async getCategories() {
        try {
            console.log('获取分类数据...');
            
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                console.log('使用模拟数据');
                return window.CONFIG.mockCategories || [];
            }
            
            // 检查 Supabase 客户端是否可用
            if (!this.supabaseClient) {
                console.warn('没有可用的 Supabase 客户端，尝试使用全局实例');
                
                // 尝试使用全局 Supabase 客户端
                if (window.supabase) {
                    this.supabaseClient = window.supabase;
                    console.log('使用全局 Supabase 客户端');
                } else {
                    console.warn('无法获取 Supabase 客户端，将返回空数组');
                    return [];
                }
            }
            
            console.log('尝试从数据库获取分类数据...');
            
            // 使用简单的查询，避免中文字段名问题
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .order('category_pkey', { ascending: true });

            if (error) {
                console.error('获取分类数据失败:', error);
                throw new Error(`获取分类数据失败: ${error.message}`);
            }

            // 更新全局缓存
            window.allCategories = data || [];
            console.log('成功获取分类数据:', data ? data.length : 0, '条记录');
            return data || [];
        } catch (error) {
            console.error('获取分类数据时发生错误:', error);
            alert('获取分类数据失败: ' + error.message);
            // 返回空数组而不是抛出错误，以便前端可以正常显示
            return [];
        }
    }
    
    /**
     * 获取所有分类
     * @returns {Promise<Array>} 分类数据数组
     */
    async getAllCategories() {
        return this.getCategories();
    }
    
    /**
     * 获取单个分类
     * @param {number} category_pkey 分类ID
     * @returns {Promise<Object|null>} 分类对象或null
     */
    async getCategory(category_pkey) {
        console.log('获取单个分类:', category_pkey);
        
        if (!category_pkey) {
            console.error('获取分类失败: ID不能为空');
            return null;
        }
        
        try {
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                // 查找模拟数据
                const category = (window.CONFIG.mockCategories || []).find(c => c.category_pkey === Number(category_pkey));
                if (!category) {
                    console.error(`获取分类失败: 未找到ID为${category_pkey}的分类`);
                    return null;
                }
                return category;
            }
            
            // 使用预加载的分类数据
            if (window.allCategories && window.allCategories.length > 0) {
                const category = window.allCategories.find(c => c.category_pkey === Number(category_pkey));
                if (category) {
                    return category;
                }
            }
            
            // 如果预加载数据中没有找到，从数据库查询
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('category_pkey', category_pkey)
                .single();
            
            if (error) {
                console.error('获取分类失败:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('获取分类时发生错误:', error);
            return null;
        }
    }
    
    /**
     * 获取单个分类
     * @param {number} category_pkey 分类ID
     * @returns {Promise<Object|null>} 分类对象或null
     */
    async getCategoryById(category_pkey) {
        return this.getCategory(category_pkey);
    }
    
    /**
     * 根据编码获取分类
     * @param {string} code 分类编码
     * @returns {Promise<Object|null>} 分类对象或null
     */
    async getCategoryByCode(code) {
        console.log('根据编码获取分类:', code);
        
        if (!code) {
            console.error('获取分类失败: 编码不能为空');
            return null;
        }
        
        try {
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                // 查找模拟数据
                const category = (window.CONFIG.mockCategories || []).find(c => c.code === code);
                if (!category) {
                    console.error(`获取分类失败: 未找到编码为${code}的分类`);
                    return null;
                }
                return category;
            }
            
            // 使用预加载的分类数据
            if (window.allCategories && window.allCategories.length > 0) {
                const category = window.allCategories.find(c => c.code === code);
                if (category) {
                    return category;
                }
            }
            
            // 如果预加载数据中没有找到，从数据库查询
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('code', code)
                .single();
            
            if (error) {
                console.error('获取分类失败:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('获取分类时发生错误:', error);
            return null;
        }
    }
    
    /**
     * 生成随机字符作为ID
     * 注意：由于数据库结构变化，我们不再查找已存在的ID
     * @param {string} field 字段名称，如'purpose_name'
     * @param {string} value 字段值
     * @returns {Promise<string>} 随机生成的字符
     */
    async findExistingId(field, value) {
        // 简单返回一个随机字符
        return this.generateRandomChar();
    }
    
    /**
     * 添加新分类
     * @param {Object} category 分类对象
     * @returns {Promise<Object|null>} 添加后的分类对象或null
     */
    async addCategory(category) {
        console.log('添加分类:', category);
        
        if (!category) {
            console.error('添加分类失败: 分类对象不能为空');
            return null;
        }
        
        try {
            // 验证必填字段
            const requiredFields = ['purpose_name', 'category_name', 'subcategory_name', 'detail_name'];
            const fieldNameMap = {
                'purpose_name': '用途',
                'category_name': '产品分类',
                'subcategory_name': '产品细分',
                'detail_name': '细分说明'
            };
            
            for (const field of requiredFields) {
                if (!category[field]) {
                    console.error(`添加分类失败: ${fieldNameMap[field]}是必填字段`);
                    return null;
                }
            }
            
            // 生成分类编码
            const code = this.generateCategoryCode(category);
            
            // 检查编码是否已存在
            const existingCategory = await this.getCategoryByCode(code);
            if (existingCategory) {
                console.error(`添加分类失败: 编码${code}已存在`);
                return null;
            }
            
            // 更新对象，包含必要字段和英文字段
            const updatedCategory = {
                purpose_name: category.purpose_name,
                category_name: category.category_name,
                subcategory_name: category.subcategory_name,
                detail_name: category.detail_name,
                // 添加英文字段
                epurpose_name: category.epurpose_name || '',
                ecategory_name: category.ecategory_name || '',
                esubcategory_name: category.esubcategory_name || '',
                edetail_name: category.edetail_name || '',
                // 添加分类编码
                code: code
            };
            
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                // 生成一个新的ID
                const newId = window.CONFIG.mockCategories ? Math.max(...window.CONFIG.mockCategories.map(c => c.category_pkey), 0) + 1 : 1;
                
                // 添加ID和时间戳
                updatedCategory.category_pkey = newId;
                updatedCategory.created_at = new Date().toISOString();
                updatedCategory.updated_at = new Date().toISOString();
                
                // 添加到模拟数据
                if (!window.CONFIG.mockCategories) {
                    window.CONFIG.mockCategories = [];
                }
                window.CONFIG.mockCategories.push(updatedCategory);
                
                return updatedCategory;
            }
            
            // 添加到数据库
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .insert(updatedCategory)
                .select();
            
            if (error) {
                console.error('添加分类失败:', error);
                
                // 尝试使用upsert
                if (error.code === '23505') { // 唯一约束冲突
                    console.log('尝试使用upsert添加分类...');
                    
                    const { error: retryError } = await this.supabaseClient
                        .from(this.tableName)
                        .insert(updatedCategory);
                    
                    if (retryError) {
                        console.error('第二次尝试添加分类失败:', retryError);
                        throw new Error(`添加分类失败: ${retryError.message}`);
                    }
                    
                    // 获取新添加的分类
                    const newCategory = await this.getCategoryByCode(updatedCategory.code);
                    return newCategory;
                } else {
                    throw new Error(`添加分类失败: ${error.message}`);
                }
            }
            
            // 获取新添加的分类
            const newCategory = await this.getCategoryByCode(updatedCategory.code);
            return newCategory;
        } catch (error) {
            console.error('添加分类时发生错误:', error);
            alert('添加分类失败: ' + error.message);
            return null;
        }
    }
    
    /**
     * 更新分类
     * @param {number} category_pkey 分类ID
     * @param {Object} updates 更新内容
     * @returns {Promise<Object|null>} 更新后的分类对象或null
     */
    async updateCategory(category_pkey, updates) {
        console.log('更新分类:', category_pkey, updates);
        
        if (!category_pkey || !updates) {
            console.error('更新分类失败: ID或更新内容不能为空');
            return null;
        }
        
        try {
            // 验证必填字段
            const requiredFields = ['purpose_name', 'category_name', 'subcategory_name', 'detail_name'];
            const fieldNameMap = {
                'purpose_name': '用途',
                'category_name': '产品分类',
                'subcategory_name': '产品细分',
                'detail_name': '细分说明'
            };
            
            for (const field of requiredFields) {
                if (!updates[field]) {
                    console.error(`更新分类失败: ${fieldNameMap[field]}是必填字段`);
                    return null;
                }
            }
            
            // 获取当前分类
            const currentCategory = await this.getCategory(category_pkey);
            if (!currentCategory) {
                console.error(`更新分类失败: 未找到ID为${category_pkey}的分类`);
                return null;
            }
            
            // 更新对象，包含必要字段和英文字段
            const updatedUpdates = {
                purpose_name: updates.purpose_name,
                category_name: updates.category_name,
                subcategory_name: updates.subcategory_name,
                detail_name: updates.detail_name,
                // 添加英文字段
                epurpose_name: updates.epurpose_name || '',
                ecategory_name: updates.ecategory_name || '',
                esubcategory_name: updates.esubcategory_name || '',
                edetail_name: updates.edetail_name || ''
            };
            
            // 保留原有的分类编码，不重新生成
            updatedUpdates.code = currentCategory.code;
            
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                // 查找并更新模拟数据
                const index = (window.CONFIG.mockCategories || []).findIndex(c => c.category_pkey === Number(category_pkey));
                if (index === -1) {
                    console.error(`更新分类失败: 未找到ID为${category_pkey}的分类`);
                    return null;
                }
                
                window.CONFIG.mockCategories[index] = {
                    ...window.CONFIG.mockCategories[index],
                    ...updatedUpdates
                };
                
                return window.CONFIG.mockCategories[index];
            }
            
            console.log(`准备更新分类 ID=${category_pkey}, 更新内容:`, updatedUpdates);
            
            // 04C版本修复: 移除ID字段检查，因为数据库结构已经改变，
            // 不再使用 purpose_id, category_id 等字段
            
            try {
                const { data, error } = await this.supabaseClient
                    .from(this.tableName)
                    .update(updatedUpdates)
                    .eq('category_pkey', category_pkey)
                    .select();
                
                if (error) {
                    console.error('更新分类失败:', error);
                    throw new Error(`更新分类失败: ${error.message}`);
                }
                
                if (!data || data.length === 0) {
                    console.error(`更新分类失败: 数据库返回空结果`);
                    return null;
                }
                
                console.log(`成功更新分类 ID=${category_pkey}, 返回数据:`, data[0]);
                return data[0];
            } catch (innerError) {
                console.error('执行更新操作时出错:', innerError);
                throw innerError;
            }
        } catch (error) {
            console.error('更新分类时发生错误:', error);
            return null;
        }
    }
    
    /**
     * 删除分类
     * @param {number} category_pkey 分类ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteCategory(category_pkey) {
        console.log('删除分类:', category_pkey);
        
        if (!category_pkey) {
            console.error('删除分类失败: ID不能为空');
            return false;
        }
        
        try {
            // 使用配置中的模拟数据标志
            if (window.CONFIG && window.CONFIG.FORCE_MOCK_DATA) {
                // 查找并删除模拟数据
                const index = (window.CONFIG.mockCategories || []).findIndex(c => c.category_pkey === Number(category_pkey));
                if (index === -1) {
                    console.error(`删除分类失败: 未找到ID为${category_pkey}的分类`);
                    return false;
                }
                
                window.CONFIG.mockCategories.splice(index, 1);
                return true;
            }
            
            // 从数据库删除
            const { error } = await this.supabaseClient
                .from(this.tableName)
                .delete()
                .eq('category_pkey', category_pkey);
            
            if (error) {
                console.error('删除分类失败:', error);
                throw new Error(`删除分类失败: ${error.message}`);
            }
            
            return true;
        } catch (error) {
            console.error('删除分类时发生错误:', error);
            alert('删除分类失败: ' + error.message);
            return false;
        }
    }
    
    /**
     * 生成分类编码
     * @param {Object} category 分类对象
     * @returns {string} 分类编码
     */
    generateCategoryCode(category) {
        console.log('生成分类编码:', category);
        
        if (!category) {
            console.error('生成分类编码失败: 分类对象不能为空');
            return '';
        }
        
        // 检查必要字段
        if (!category.purpose_name || !category.category_name || !category.subcategory_name || !category.detail_name) {
            console.error('生成分类编码失败: 缺少必要字段');
            return '';
        }
        
        // 获取或生成用途ID
        const purposeId = this.getOrCreateId('purpose', category.purpose_name);
        
        // 获取或生成产品分类ID
        const categoryId = this.getOrCreateId('category', category.category_name);
        
        // 获取或生成产品细分ID
        const subcategoryId = this.getOrCreateId('subcategory', category.subcategory_name);
        
        // 获取或生成细分说明ID
        const detailId = this.getOrCreateId('detail', category.detail_name);
        
        // 生成变码（1位英文或数字）
        const variationCode = this.generateRandomChar();
        
        // 组合成分类编码
        return `${purposeId}${categoryId}${subcategoryId}${detailId}${variationCode}`;
    }
    
    /**
     * 获取或创建分类ID
     * @param {string} type 分类类型（purpose, category, subcategory, detail）
     * @param {string} name 分类名称
     * @returns {string} 分类ID（1位英文或数字）
     */
    getOrCreateId(type, name) {
        console.log(`获取或创建 ID - 类型: ${type}, 名称: ${name}`);
        
        if (!name) {
            console.log(`名称为空，返回随机字符`);
            return this.generateRandomChar();
        }
        
        // 如果该名称已有对应的ID，直接返回
        if (this.idCache[type] && this.idCache[type][name]) {
            console.log(`从缓存中找到ID: ${this.idCache[type][name]}`);
            return this.idCache[type][name];
        }
        
        // 从数据库中查找已存在的ID
        // 根据分类类型确定要查询的字段名
        const nameField = `${type}_name`;
        const idField = `${type}_id`;
        
        console.log(`查询字段: ${nameField} = ${name}, 对应ID字段: ${idField}`);
        
        // 查询数据库中已存在的记录
        try {
            // 使用预加载的分类数据
            const existingCategories = window.allCategories || [];
            console.log(`预加载的分类数据数量: ${existingCategories.length}`);
            
            // 查找匹配的记录
            for (const category of existingCategories) {
                // 检查字段是否存在
                if (category[nameField] === undefined) {
                    console.log(`警告: 记录中没有 ${nameField} 字段`);
                    continue;
                }
                
                if (category[idField] === undefined) {
                    console.log(`警告: 记录中没有 ${idField} 字段`);
                    continue;
                }
                
                // 检查字段值是否匹配
                if (category[nameField] === name) {
                    console.log(`找到匹配记录: ${nameField}=${name}, ${idField}=${category[idField]}`);
                    
                    // 将找到的ID存入缓存
                    if (!this.idCache[type]) {
                        this.idCache[type] = {};
                    }
                    this.idCache[type][name] = category[idField];
                    return category[idField];
                }
            }
            
            console.log(`没有找到匹配的记录: ${nameField}=${name}`);
        } catch (error) {
            console.error(`从数据库查询${type}ID时出错:`, error);
        }
        
        // 如果数据库中没有找到，生成新的ID（1位英文或数字）
        const newId = this.generateRandomChar();
        console.log(`生成新ID: ${newId} 用于 ${type}: ${name}`);
        
        // 将新ID存入缓存
        if (!this.idCache[type]) {
            this.idCache[type] = {};
        }
        this.idCache[type][name] = newId;
        
        return newId;
    }
    
    /**
     * 生成变码（不再使用，保留兼容性）
     * @returns {string} 变码
     */
    generateVariationCode() {
        // 现在只生成一位英文或数字作为变码
        return this.generateRandomChar();
    }
    
    /**
     * 生成随机字符
     * @returns {string} 随机字符
     */
    generateRandomChar() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    }
}

// 将分类服务添加到全局作用域
window.CategoryService = CategoryService;
