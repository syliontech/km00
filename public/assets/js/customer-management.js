/**
 * 客户管理功能
 * 处理客户及其产品关联的管理
 */

class CustomerManagement {
    constructor() {
        this.supabase = window.supabaseClient;
    }
    
    /**
     * 初始化客户管理
     */
    async init() {
        try {
            console.log('初始化客户管理...');
            return true;
        } catch (error) {
            console.error('客户管理初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 删除客户及其关联的产品
     * @param {string} customerId 客户ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteCustomerWithProducts(customerId) {
        try {
            console.log(`开始删除客户 ID: ${customerId} 及其关联产品...`);
            
            // 1. 先删除客户产品关联
            const { error: deleteProductsError } = await this.supabase
                .from('customer_products')
                .delete()
                .eq('customer_id', customerId);
                
            if (deleteProductsError) {
                throw new Error(`删除客户产品关联失败: ${deleteProductsError.message}`);
            }
            
            // 2. 删除客户
            const { error: deleteCustomerError } = await this.supabase
                .from('customers')
                .delete()
                .eq('id', customerId);
                
            if (deleteCustomerError) {
                throw new Error(`删除客户失败: ${deleteCustomerError.message}`);
            }
            
            console.log(`客户 ID: ${customerId} 及其关联产品已成功删除`);
            return true;
        } catch (error) {
            console.error(`删除客户 ID: ${customerId} 及其关联产品失败:`, error);
            throw error;
        }
    }
    
    /**
     * 获取客户列表
     * @returns {Promise<Array>} 客户列表
     */
    async getCustomers() {
        try {
            const { data, error } = await this.supabase
                .from('customers')
                .select('*')
                .order('name');
                
            if (error) {
                throw new Error(`获取客户列表失败: ${error.message}`);
            }
            
            return data || [];
        } catch (error) {
            console.error('获取客户列表失败:', error);
            throw error;
        }
    }
}

// 创建全局实例
window.customerManagement = new CustomerManagement();
