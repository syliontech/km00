/**
 * 文件上传服务模块
 * 负责处理文件上传到服务器并保存URL到数据库的功能
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

// 文件上传服务模块
ProductSystem.FileUploadService = (function() {
    // 私有变量
    const API_BASE_URL = 'http://192.168.10.18:8001'; // Supabase API基础URL
    const STORAGE_BUCKET = 'product-files'; // 存储桶名称
    let supabaseClient = null; // Supabase客户端实例
    let currentProductCode = null; // 当前产品编码
    
    // 初始化函数
    function init() {
        console.log('初始化文件上传服务模块');
        
        // 初始化Supabase客户端
        initSupabaseClient();
        
        // 注册事件监听器
        registerEventListeners();
        
        console.log('文件上传服务模块初始化完成');
    }
    
    // 初始化Supabase客户端
    function initSupabaseClient() {
        // 检查全局Supabase客户端是否已初始化
        if (window.supabase) {
            supabaseClient = window.supabase;
            console.log('使用全局Supabase客户端');
            return;
        }
        
        // 如果没有全局客户端，尝试创建新的客户端
        try {
            // 从配置中获取Supabase URL和API密钥
            const supabaseUrl = window.SUPABASE_URL || API_BASE_URL;
            const supabaseKey = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 实际使用时应替换为真实的API密钥
            
            // 创建Supabase客户端
            supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            console.log('创建新的Supabase客户端');
        } catch (error) {
            console.error('初始化Supabase客户端失败:', error);
        }
    }
    
    // 注册事件监听器
    function registerEventListeners() {
        // 监听产品编码变更事件
        document.addEventListener('product-code-changed', function(e) {
            if (e.detail && e.detail.productCode) {
                currentProductCode = e.detail.productCode;
                console.log('当前产品编码已更新:', currentProductCode);
            }
        });
        
        // 监听图片上传事件
        document.addEventListener('image-selected', function(e) {
            if (e.detail && e.detail.file) {
                uploadImage(e.detail.file, e.detail.callback);
            }
        });
        
        // 监听文件上传事件
        document.addEventListener('file-selected', function(e) {
            if (e.detail && e.detail.file) {
                uploadFile(e.detail.file, e.detail.callback);
            }
        });
    }
    
    // 上传图片到服务器
    async function uploadImage(file, callback) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            if (callback) callback(null, new Error('Supabase客户端未初始化'));
            return;
        }
        
        if (!currentProductCode) {
            console.error('产品编码未设置');
            if (callback) callback(null, new Error('产品编码未设置'));
            return;
        }
        
        try {
            // 生成文件路径
            const filePath = `${currentProductCode}/images/${generateUniqueFileName(file.name)}`;
            
            // 上传文件到Supabase存储
            const { data, error } = await supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // 获取公共URL
            const { data: urlData } = supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);
            
            const publicUrl = urlData.publicUrl;
            
            // 保存URL到数据库
            await saveImageUrlToDatabase(currentProductCode, publicUrl, file.name);
            
            console.log('图片上传成功:', publicUrl);
            
            // 执行回调
            if (callback) callback(publicUrl);
            
            // 触发图片上传成功事件
            document.dispatchEvent(new CustomEvent('image-upload-success', {
                detail: {
                    url: publicUrl,
                    fileName: file.name,
                    productCode: currentProductCode
                }
            }));
        } catch (error) {
            console.error('图片上传失败:', error);
            if (callback) callback(null, error);
            
            // 触发图片上传失败事件
            document.dispatchEvent(new CustomEvent('image-upload-error', {
                detail: {
                    error: error,
                    fileName: file.name
                }
            }));
        }
    }
    
    // 上传文件到服务器
    async function uploadFile(file, callback) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            if (callback) callback(null, new Error('Supabase客户端未初始化'));
            return;
        }
        
        if (!currentProductCode) {
            console.error('产品编码未设置');
            if (callback) callback(null, new Error('产品编码未设置'));
            return;
        }
        
        try {
            // 生成文件路径
            const filePath = `${currentProductCode}/files/${generateUniqueFileName(file.name)}`;
            
            // 上传文件到Supabase存储
            const { data, error } = await supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // 获取公共URL
            const { data: urlData } = supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);
            
            const publicUrl = urlData.publicUrl;
            
            // 保存URL到数据库
            await saveFileUrlToDatabase(currentProductCode, publicUrl, file.name, file.type, file.size);
            
            console.log('文件上传成功:', publicUrl);
            
            // 执行回调
            if (callback) callback(publicUrl);
            
            // 触发文件上传成功事件
            document.dispatchEvent(new CustomEvent('file-upload-success', {
                detail: {
                    url: publicUrl,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    productCode: currentProductCode
                }
            }));
        } catch (error) {
            console.error('文件上传失败:', error);
            if (callback) callback(null, error);
            
            // 触发文件上传失败事件
            document.dispatchEvent(new CustomEvent('file-upload-error', {
                detail: {
                    error: error,
                    fileName: file.name
                }
            }));
        }
    }
    
    // 保存图片URL到数据库
    async function saveImageUrlToDatabase(productCode, imageUrl, fileName) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return;
        }
        
        try {
            // 查询产品记录
            const { data: productData, error: productError } = await supabaseClient
                .from('products')
                .select('products_pkey')
                .eq('product_code', productCode)
                .single();
            
            if (productError) throw productError;
            
            if (!productData) {
                throw new Error(`未找到产品编码为 ${productCode} 的记录`);
            }
            
            const productId = productData.products_pkey;
            
            // 保存图片URL到产品图片表
            const { data, error } = await supabaseClient
                .from('product_images')
                .insert([
                    {
                        product_id: productId,
                        image_url: imageUrl,
                        file_name: fileName,
                        upload_date: new Date().toISOString()
                    }
                ]);
            
            if (error) throw error;
            
            console.log('图片URL已保存到数据库');
            return data;
        } catch (error) {
            console.error('保存图片URL到数据库失败:', error);
            throw error;
        }
    }
    
    // 保存文件URL到数据库
    async function saveFileUrlToDatabase(productCode, fileUrl, fileName, fileType, fileSize) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return;
        }
        
        try {
            // 查询产品记录
            const { data: productData, error: productError } = await supabaseClient
                .from('products')
                .select('products_pkey')
                .eq('product_code', productCode)
                .single();
            
            if (productError) throw productError;
            
            if (!productData) {
                throw new Error(`未找到产品编码为 ${productCode} 的记录`);
            }
            
            const productId = productData.products_pkey;
            
            // 保存文件URL到产品文件表
            const { data, error } = await supabaseClient
                .from('product_files')
                .insert([
                    {
                        product_id: productId,
                        file_url: fileUrl,
                        file_name: fileName,
                        file_type: fileType,
                        file_size: fileSize,
                        upload_date: new Date().toISOString()
                    }
                ]);
            
            if (error) throw error;
            
            console.log('文件URL已保存到数据库');
            return data;
        } catch (error) {
            console.error('保存文件URL到数据库失败:', error);
            throw error;
        }
    }
    
    // 生成唯一文件名
    function generateUniqueFileName(originalName) {
        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `${timestamp}_${randomStr}.${extension}`;
    }
    
    // 设置当前产品编码
    function setProductCode(productCode) {
        currentProductCode = productCode;
        console.log('手动设置当前产品编码:', currentProductCode);
    }
    
    // 获取产品的所有图片
    async function getProductImages(productCode) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return [];
        }
        
        try {
            // 查询产品记录
            const { data: productData, error: productError } = await supabaseClient
                .from('products')
                .select('products_pkey')
                .eq('product_code', productCode)
                .single();
            
            if (productError) throw productError;
            
            if (!productData) {
                throw new Error(`未找到产品编码为 ${productCode} 的记录`);
            }
            
            const productId = productData.products_pkey;
            
            // 查询产品图片
            const { data, error } = await supabaseClient
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('upload_date', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('获取产品图片失败:', error);
            return [];
        }
    }
    
    // 获取产品的所有文件
    async function getProductFiles(productCode) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return [];
        }
        
        try {
            // 查询产品记录
            const { data: productData, error: productError } = await supabaseClient
                .from('products')
                .select('products_pkey')
                .eq('product_code', productCode)
                .single();
            
            if (productError) throw productError;
            
            if (!productData) {
                throw new Error(`未找到产品编码为 ${productCode} 的记录`);
            }
            
            const productId = productData.products_pkey;
            
            // 查询产品文件
            const { data, error } = await supabaseClient
                .from('product_files')
                .select('*')
                .eq('product_id', productId)
                .order('upload_date', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('获取产品文件失败:', error);
            return [];
        }
    }
    
    // 删除产品图片
    async function deleteProductImage(imageId) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return false;
        }
        
        try {
            // 查询图片记录
            const { data: imageData, error: imageError } = await supabaseClient
                .from('product_images')
                .select('image_url')
                .eq('id', imageId)
                .single();
            
            if (imageError) throw imageError;
            
            if (!imageData) {
                throw new Error(`未找到ID为 ${imageId} 的图片记录`);
            }
            
            // 从URL中提取存储路径
            const imageUrl = imageData.image_url;
            const storagePath = imageUrl.split(`${STORAGE_BUCKET}/`)[1];
            
            // 从存储中删除文件
            const { error: storageError } = await supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .remove([storagePath]);
            
            if (storageError) throw storageError;
            
            // 从数据库中删除记录
            const { error: dbError } = await supabaseClient
                .from('product_images')
                .delete()
                .eq('id', imageId);
            
            if (dbError) throw dbError;
            
            console.log('产品图片已删除');
            return true;
        } catch (error) {
            console.error('删除产品图片失败:', error);
            return false;
        }
    }
    
    // 删除产品文件
    async function deleteProductFile(fileId) {
        if (!supabaseClient) {
            console.error('Supabase客户端未初始化');
            return false;
        }
        
        try {
            // 查询文件记录
            const { data: fileData, error: fileError } = await supabaseClient
                .from('product_files')
                .select('file_url')
                .eq('id', fileId)
                .single();
            
            if (fileError) throw fileError;
            
            if (!fileData) {
                throw new Error(`未找到ID为 ${fileId} 的文件记录`);
            }
            
            // 从URL中提取存储路径
            const fileUrl = fileData.file_url;
            const storagePath = fileUrl.split(`${STORAGE_BUCKET}/`)[1];
            
            // 从存储中删除文件
            const { error: storageError } = await supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .remove([storagePath]);
            
            if (storageError) throw storageError;
            
            // 从数据库中删除记录
            const { error: dbError } = await supabaseClient
                .from('product_files')
                .delete()
                .eq('id', fileId);
            
            if (dbError) throw dbError;
            
            console.log('产品文件已删除');
            return true;
        } catch (error) {
            console.error('删除产品文件失败:', error);
            return false;
        }
    }
    
    // 公共接口
    return {
        init: init,
        uploadImage: uploadImage,
        uploadFile: uploadFile,
        setProductCode: setProductCode,
        getProductImages: getProductImages,
        getProductFiles: getProductFiles,
        deleteProductImage: deleteProductImage,
        deleteProductFile: deleteProductFile
    };
})();

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化文件上传服务模块
    ProductSystem.FileUploadService.init();
});
