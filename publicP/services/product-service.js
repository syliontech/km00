/**
 * 产品服务类
 * 负责产品数据的CRUD操作和文件上传功能
 */
class ProductService {
    constructor() {
        this.tableName = 'products';
        this.storageBasePath = 'product_files';
        this.productCache = null;
        this.categoryService = new CategoryService();
    }

    /**
     * 初始化服务
     */
    async init() {
        console.log('初始化产品服务...');
        try {
            // 确保Supabase已初始化
            if (!window.supabase) {
                if (typeof initSupabase === 'function') {
                    console.log('尝试初始化Supabase...');
                    initSupabase();
                } else {
                    console.error('Supabase客户端未初始化，且无法自动初始化');
                    return false;
                }
            }
            
            // 初始化分类服务
            await this.categoryService.init();
            
            // 加载所有产品数据到缓存
            await this.loadAllProducts();
            
            console.log('产品服务初始化成功');
            return true;
        } catch (error) {
            console.error('产品服务初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载所有产品数据
     */
    async loadAllProducts() {
        try {
            // 确保Supabase已初始化
            if (!window.supabase) {
                console.error('Supabase客户端未初始化');
                this.productCache = [];
                return [];
            }
            
            try {
                const { data, error } = await window.supabase
                    .from(this.tableName)
                    .select('*')
                    .order('product_code', { ascending: true });

                if (error) {
                    // 如果是404错误，可能是表不存在
                    if (error.code === '404' || error.message.includes('Not Found')) {
                        console.warn(`表 ${this.tableName} 不存在，返回空数组`);
                        this.productCache = [];
                        return [];
                    }
                    throw error;
                }

                this.productCache = data || [];
                console.log(`成功加载 ${data ? data.length : 0} 个产品`);
                return data || [];
            } catch (error) {
                // 如果是网络错误或服务器错误，返回空数组
                console.error('加载产品数据失败:', error);
                this.productCache = [];
                return [];
            }
        } catch (error) {
            console.error('加载产品数据时发生未知错误:', error);
            this.productCache = [];
            return [];
        }
    }

    /**
     * 获取所有产品
     */
    async getAllProducts() {
        if (!this.productCache) {
            await this.loadAllProducts();
        }
        return this.productCache;
    }

    /**
     * 根据ID获取产品
     * @param {string} productId 产品ID
     */
    async getProductById(productId) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('products_pkey', productId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`获取产品 ID: ${productId} 失败:`, error);
            throw error;
        }
    }

    /**
     * 根据产品编码获取产品
     * @param {string} productCode 产品编码
     */
    async getProductByCode(productCode) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('product_code', productCode)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`获取产品编码: ${productCode} 失败:`, error);
            throw error;
        }
    }

    /**
     * 生成产品编码
     * @param {string} categoryCode 分类编码
     */
    async generateProductCode(categoryCode) {
        // 产品编码格式: 分类编码-随机数2位
        const randomSuffix = Math.floor(10 + Math.random() * 90); // 生成10-99之间的随机数
        const productCode = `${categoryCode}-${randomSuffix}`;
        
        // 检查编码是否已存在
        try {
            const { data } = await supabase
                .from(this.tableName)
                .select('product_code')
                .eq('product_code', productCode);
            
            // 如果已存在，递归重新生成
            if (data && data.length > 0) {
                return this.generateProductCode(categoryCode);
            }
            
            return productCode;
        } catch (error) {
            console.error('生成产品编码失败:', error);
            throw error;
        }
    }

    /**
     * 创建产品
     * @param {Object} productData 产品数据
     * @param {Array} files 产品文件
     */
    async createProduct(productData, files = []) {
        try {
            console.log('准备创建产品:', productData);
            
            // 确保 Supabase 客户端已初始化
            if (!window.supabase) {
                throw new Error('Supabase 客户端未初始化');
            }
            
            // 准备产品数据，确保字段名称正确
            const formattedData = {};
            
            // 处理必填字段
            formattedData.category_ID = productData.category_ID || '';
            formattedData.product_code = productData.product_code || '';
            formattedData.clients_ID = productData.clients_ID || '';
            
            // 处理可选字段
            if (productData.clients_products_ID) formattedData.clients_products_ID = productData.clients_products_ID;
            if (productData.vendors_ID) formattedData.vendors_ID = productData.vendors_ID;
            if (productData.vendors_products_ID) formattedData.vendors_products_ID = productData.vendors_products_ID;
            
            // 处理中英文描述字段
            formattedData.Description = productData.Description || productData.description_en || '';
            formattedData.cdescription = productData['品描'] || productData.description_cn || '';
            formattedData.Detail = productData.Detail || productData.detail_en || '';
            formattedData.cdetail = productData['说明'] || productData.detail_cn || '';
            
            // 处理图片字段
            if (productData.image1_url) formattedData.image1_url = productData.image1_url;
            if (productData.image2_url) formattedData.image2_url = productData.image2_url;
            if (productData.image3_url) formattedData.image3_url = productData.image3_url;
            
            // 添加文件夹字段
            formattedData.files_folder = productData.files_folder || productData.product_code;
            
            console.log('格式化后的产品数据:', formattedData);
            
            // 验证必填字段
            if (!formattedData.category_ID) throw new Error('分类 ID 不能为空');
            if (!formattedData.product_code) throw new Error('产品编码不能为空');
            if (!formattedData.clients_ID) throw new Error('客户 ID 不能为空');
            
            // 1. 插入产品基本信息
            const { data, error } = await window.supabase
                .from(this.tableName)
                .insert([formattedData])
                .select();

            if (error) {
                console.error('插入产品数据失败:', error);
                throw error;
            }
            
            if (!data || data.length === 0) {
                throw new Error('插入成功但未返回数据');
            }
            
            const createdProduct = data[0];

            // 2. 上传文件（如果有）
            if (files && files.length > 0) {
                await this.uploadProductFiles(createdProduct.product_code, files);
            }

            // 3. 更新缓存
            await this.loadAllProducts();

            console.log('产品创建成功:', createdProduct);
            return createdProduct;
        } catch (error) {
            console.error('创建产品失败:', error);
            throw error;
        }
    }

    /**
     * 更新产品
     * @param {string} productId 产品ID
     * @param {Object} productData 产品数据
     * @param {Array} files 产品文件
     */
    async updateProduct(productId, productData, files = []) {
        try {
            // 1. 更新产品基本信息
            const { data, error } = await supabase
                .from(this.tableName)
                .update(productData)
                .eq('products_pkey', productId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            // 2. 上传新文件（如果有）
            if (files && files.length > 0) {
                await this.uploadProductFiles(data.product_code, files);
            }

            // 3. 更新缓存
            await this.loadAllProducts();

            console.log('产品更新成功:', data);
            return data;
        } catch (error) {
            console.error(`更新产品 ID: ${productId} 失败:`, error);
            throw error;
        }
    }

    /**
     * 删除产品
     * @param {string} productId 产品ID
     */
    async deleteProduct(productId) {
        try {
            // 1. 获取产品信息
            const product = await this.getProductById(productId);
            
            if (!product) {
                throw new Error(`未找到ID为 ${productId} 的产品`);
            }
            
            // 2. 删除产品文件
            await this.deleteProductFiles(product.product_code);
            
            // 3. 删除产品记录
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('products_pkey', productId);

            if (error) {
                throw error;
            }

            // 4. 更新缓存
            await this.loadAllProducts();

            console.log(`产品 ID: ${productId} 删除成功`);
            return true;
        } catch (error) {
            console.error(`删除产品 ID: ${productId} 失败:`, error);
            throw error;
        }
    }

    /**
     * 上传产品文件
     * @param {string} productCode 产品编码
     * @param {Array} files 文件数组
     */
    async uploadProductFiles(productCode, files) {
        if (!files || files.length === 0) {
            return [];
        }

        const uploadResults = [];
        const folderPath = `${this.storageBasePath}/${productCode}`;

        try {
            for (const file of files) {
                const fileName = `${Date.now()}_${file.name}`;
                const filePath = `${folderPath}/${fileName}`;
                
                // 上传文件到存储
                const { data, error } = await supabase.storage
                    .from('public')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error(`上传文件 ${fileName} 失败:`, error);
                    uploadResults.push({
                        fileName,
                        success: false,
                        error: error.message
                    });
                } else {
                    // 获取公共URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('public')
                        .getPublicUrl(filePath);
                    
                    uploadResults.push({
                        fileName,
                        filePath,
                        publicUrl,
                        success: true
                    });
                }
            }

            return uploadResults;
        } catch (error) {
            console.error('上传产品文件失败:', error);
            throw error;
        }
    }

    /**
     * 删除产品文件
     * @param {string} productCode 产品编码
     */
    async deleteProductFiles(productCode) {
        const folderPath = `${this.storageBasePath}/${productCode}`;
        
        try {
            // 列出文件夹中的所有文件
            const { data, error } = await supabase.storage
                .from('public')
                .list(folderPath);

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                // 构建文件路径数组
                const filePaths = data.map(file => `${folderPath}/${file.name}`);
                
                // 删除文件
                const { error: deleteError } = await supabase.storage
                    .from('public')
                    .remove(filePaths);

                if (deleteError) {
                    throw deleteError;
                }
            }

            console.log(`产品 ${productCode} 的所有文件已删除`);
            return true;
        } catch (error) {
            console.error(`删除产品 ${productCode} 的文件失败:`, error);
            throw error;
        }
    }

    /**
     * 获取产品文件列表
     * @param {string} productCode 产品编码
     */
    async getProductFiles(productCode) {
        const folderPath = `${this.storageBasePath}/${productCode}`;
        
        try {
            const { data, error } = await supabase.storage
                .from('public')
                .list(folderPath);

            if (error) {
                throw error;
            }

            // 为每个文件添加公共URL
            const filesWithUrls = data.map(file => {
                const filePath = `${folderPath}/${file.name}`;
                const { data: { publicUrl } } = supabase.storage
                    .from('public')
                    .getPublicUrl(filePath);
                
                return {
                    ...file,
                    filePath,
                    publicUrl
                };
            });

            return filesWithUrls;
        } catch (error) {
            console.error(`获取产品 ${productCode} 的文件列表失败:`, error);
            throw error;
        }
    }

    /**
     * 根据分类ID查询产品
     * @param {string} categoryId 分类ID
     */
    async getProductsByCategory(categoryId) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('category_ID', categoryId)
                .order('product_code', { ascending: true });

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`获取分类 ID: ${categoryId} 的产品失败:`, error);
            throw error;
        }
    }

    /**
     * 根据关键字搜索产品
     * @param {string} keyword 搜索关键字
     */
    async searchProducts(keyword) {
        if (!keyword) {
            return this.getAllProducts();
        }

        try {
            const searchTerm = keyword.toLowerCase();
            
            // 在内存中过滤产品
            if (this.productCache) {
                return this.productCache.filter(product => 
                    product.product_code.toLowerCase().includes(searchTerm) ||
                    (product.Description && product.Description.toLowerCase().includes(searchTerm)) ||
                    (product.品描 && product.品描.toLowerCase().includes(searchTerm)) ||
                    (product.Detail && product.Detail.toLowerCase().includes(searchTerm)) ||
                    (product.说明 && product.说明.toLowerCase().includes(searchTerm))
                );
            }
            
            // 如果缓存不可用，从数据库搜索
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .or(`product_code.ilike.%${keyword}%,Description.ilike.%${keyword}%,品描.ilike.%${keyword}%,Detail.ilike.%${keyword}%,说明.ilike.%${keyword}%`)
                .order('product_code', { ascending: true });

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`搜索产品关键字: ${keyword} 失败:`, error);
            throw error;
        }
    }

    /**
     * 导出产品数据为CSV
     */
    async exportProductsToCSV() {
        try {
            const products = await this.getAllProducts();
            
            if (!products || products.length === 0) {
                throw new Error('没有产品数据可导出');
            }
            
            // 定义CSV表头
            const headers = [
                'product_code', 'category_ID', 'clients_ID', 'clients_products_ID',
                'vendors_ID', 'vendors_products_ID', 'Description', '品描',
                'Detail', '说明'
            ];
            
            // 将产品数据转换为CSV行
            const csvRows = [];
            csvRows.push(headers.join(','));
            
            for (const product of products) {
                const values = headers.map(header => {
                    const value = product[header] || '';
                    // 处理包含逗号、引号等特殊字符的字段
                    return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvRows.push(values.join(','));
            }
            
            // 添加UTF-8 BOM标记，解决中文乱码问题
            const BOM = '\uFEFF';
            const csvString = BOM + csvRows.join('\n');
            
            return csvString;
        } catch (error) {
            console.error('导出产品数据失败:', error);
            throw error;
        }
    }

    /**
     * 导入CSV产品数据
     * @param {string} csvContent CSV内容
     */
    async importProductsFromCSV(csvContent) {
        try {
            // 移除可能的BOM标记
            const content = csvContent.replace(/^\uFEFF/, '');
            
            // 解析CSV内容
            const rows = content.split('\n');
            const headers = rows[0].split(',').map(header => 
                header.trim().replace(/^"(.*)"$/, '$1') // 移除引号
            );
            
            const products = [];
            const results = {
                total: rows.length - 1, // 减去表头
                success: 0,
                failed: 0,
                errors: []
            };
            
            // 从第二行开始处理数据行
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue; // 跳过空行
                
                try {
                    const values = this.parseCSVLine(rows[i]);
                    const product = {};
                    
                    // 将值映射到对应的字段
                    headers.forEach((header, index) => {
                        if (values[index] !== undefined) {
                            product[header] = values[index].trim().replace(/^"(.*)"$/, '$1');
                        }
                    });
                    
                    // 验证必填字段
                    if (!product.product_code || !product.category_ID) {
                        throw new Error('缺少必填字段: product_code 或 category_ID');
                    }
                    
                    products.push(product);
                } catch (error) {
                    results.failed++;
                    results.errors.push(`行 ${i+1}: ${error.message}`);
                    continue;
                }
            }
            
            // 批量插入产品数据
            if (products.length > 0) {
                const { data, error } = await supabase
                    .from(this.tableName)
                    .upsert(products, { 
                        onConflict: 'product_code',
                        returning: 'minimal'
                    });
                
                if (error) {
                    throw error;
                }
                
                results.success = products.length;
                
                // 更新缓存
                await this.loadAllProducts();
            }
            
            return results;
        } catch (error) {
            console.error('导入产品数据失败:', error);
            throw error;
        }
    }

    /**
     * 解析CSV行，正确处理引号内的逗号
     * @param {string} line CSV行
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // 处理双引号转义 (""表示一个引号)
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 遇到逗号且不在引号内，添加当前值到结果
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // 添加最后一个值
        result.push(current);
        
        return result;
    }
}

// 导出到全局作用域
window.ProductService = ProductService;
