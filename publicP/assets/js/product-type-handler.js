/**
 * 产品类型处理模块
 * 负责处理产品类型（单件/组套）的相关逻辑
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化产品类型处理模块');
    
    // 初始化产品类型UI
    initProductTypeUI();
});

// 全局变量
let productType = 'single'; // 默认为单件

/**
 * 初始化产品类型UI
 */
function initProductTypeUI() {
    // 更新UI显示
    updateUIByProductType();
}

/**
 * 设置产品类型（从产品管理传递过来）
 * @param {string} type - 产品类型：'single'(单件) 或 'kit'(组套)
 */
function setProductType(type) {
    // 记录旧类型
    const oldType = productType;
    
    // 更新产品类型
    productType = type;
    console.log(`产品类型设置为 ${type}`);
    
    // 更新显示
    const typeDisplay = document.getElementById('product-type-display');
    const typeBadge = document.getElementById('product-type-badge');
    
    if (typeDisplay) {
        typeDisplay.textContent = type === 'single' ? '单件' : '组套';
    }
    
    if (typeBadge) {
        typeBadge.textContent = type === 'single' ? '单件' : '组套';
        
        // 更新标签样式
        if (type === 'single') {
            typeBadge.className = 'ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full';
        } else {
            typeBadge.className = 'ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full';
        }
    }
    
    // 根据新类型更新UI
    updateUIByProductType();
    
    // 如果工作流闭环已启动且类型发生变化，则切换工作流状态变为修改状态
    if (window.workflowLoopStarted && window.workflowState !== 'idle' && oldType !== type) {
        if (typeof window.changeWorkflowState === 'function') {
            window.changeWorkflowState('modify');
        }
    }
}

/**
 * 根据产品类型更新UI
 */
function updateUIByProductType() {
    // 获取组套TAB和相关区域
    const kitTab = document.querySelector('button[data-tab="kit"]');
    const kitTabContent = document.getElementById('kit-tab-content');
    
    // 获取规格TAB和相关区域
    const specsTab = document.querySelector('button[data-tab="specs"]');
    const specsTabContent = document.getElementById('specs-tab-content');
    
    if (!kitTab || !specsTab) return;
    
    // 根据产品类型更新UI
    if (productType === 'single') {
        // 单件产品：禁用组套TAB，启用规格TAB
        kitTab.disabled = true;
        kitTab.classList.add('opacity-50');
        
        // 如果当前是组套TAB，切换到规格TAB
        if (window.activeTab === 'kit' && typeof window.switchTab === 'function') {
            window.switchTab('specs');
        }
        
        // 更新上区显示
        updateUpperAreaForSingleProduct();
    } else if (productType === 'kit') {
        // 组套产品：启用组套TAB
        kitTab.disabled = false;
        kitTab.classList.remove('opacity-50');
        
        // 更新上区显示
        updateUpperAreaForKitProduct();
    }
}

/**
 * 更新单件产品的上区显示
 */
function updateUpperAreaForSingleProduct() {
    // 单件产品的上区显示：图片、产品分类、属性、供应商、客户
    console.log('更新单件产品的上区显示');
    
    // 显示单件产品相关字段
    const singleProductFields = document.querySelectorAll('.single-product-field');
    const kitProductFields = document.querySelectorAll('.kit-product-field');
    
    singleProductFields.forEach(field => {
        field.classList.remove('hidden');
    });
    
    kitProductFields.forEach(field => {
        field.classList.add('hidden');
    });
}

/**
 * 更新组套产品的上区显示
 */
function updateUpperAreaForKitProduct() {
    // 组套产品的上区显示：图片、产品详细信息、供应商、客户
    console.log('更新组套产品的上区显示');
    
    // 显示组套产品相关字段
    const singleProductFields = document.querySelectorAll('.single-product-field');
    const kitProductFields = document.querySelectorAll('.kit-product-field');
    
    singleProductFields.forEach(field => {
        field.classList.add('hidden');
    });
    
    kitProductFields.forEach(field => {
        field.classList.remove('hidden');
    });
}

// 导出函数到全局作用域
window.setProductType = setProductType;
window.getProductType = function() { return productType; };
