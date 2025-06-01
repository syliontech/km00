/**
 * 供应商管理功能
 * 处理供应商及其产品关联的管理
 */

class SupplierManagement {
    constructor() {
        this.supabase = window.supabaseClient;
    }
    
    /**
     * 初始化供应商管理
     */
    async init() {
        try {
            console.log('初始化供应商管理...');
            return true;
        } catch (error) {
            console.error('供应商管理初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 删除供应商及其关联的产品
     * @param {string} supplierId 供应商ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteSupplierWithProducts(supplierId) {
        try {
            console.log(`开始删除供应商 ID: ${supplierId} 及其关联产品...`);
            
            // 1. 先删除供应商产品关联
            const { error: deleteProductsError } = await this.supabase
                .from('supplier_products')
                .delete()
                .eq('supplier_id', supplierId);
                
            if (deleteProductsError) {
                throw new Error(`删除供应商产品关联失败: ${deleteProductsError.message}`);
            }
            
            // 2. 删除供应商
            const { error: deleteSupplierError } = await this.supabase
                .from('suppliers')
                .delete()
                .eq('id', supplierId);
                
            if (deleteSupplierError) {
                throw new Error(`删除供应商失败: ${deleteSupplierError.message}`);
            }
            
            console.log(`供应商 ID: ${supplierId} 及其关联产品已成功删除`);
            return true;
        } catch (error) {
            console.error(`删除供应商 ID: ${supplierId} 及其关联产品失败:`, error);
            throw error;
        }
    }
    
    /**
     * 获取供应商列表
     * @returns {Promise<Array>} 供应商列表
     */
    async getSuppliers() {
        try {
            const { data, error } = await this.supabase
                .from('suppliers')
                .select('*')
                .order('name');
                
            if (error) {
                throw new Error(`获取供应商列表失败: ${error.message}`);
            }
            
            return data || [];
        } catch (error) {
            console.error('获取供应商列表失败:', error);
            throw error;
        }
    }
}

// 创建全局实例
window.supplierManagement = new SupplierManagement();
