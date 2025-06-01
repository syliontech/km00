/**
 * 移除供应商和客户Tab中的产品规格信息区域
 * 保留两列布局
 */
document.addEventListener('DOMContentLoaded', function() {
    // 查找所有规格信息区域
    const vendorTab = document.getElementById('vendor-tab');
    const clientTab = document.getElementById('client-tab');
    
    if (vendorTab) {
        // 在供应商Tab中查找规格信息区域
        const vendorSpecsInfo = vendorTab.querySelector('.product-specs-summary');
        if (vendorSpecsInfo) {
            // 找到规格信息的父元素并移除
            const parentDiv = vendorSpecsInfo.closest('.mb-3.p-3.bg-gray-50.border.border-gray-200.rounded');
            if (parentDiv) {
                parentDiv.remove();
            }
        }
    }
    
    if (clientTab) {
        // 在客户Tab中查找规格信息区域
        const clientSpecsInfo = clientTab.querySelector('.product-specs-summary');
        if (clientSpecsInfo) {
            // 找到规格信息的父元素并移除
            const parentDiv = clientSpecsInfo.closest('.mb-3.p-3.bg-gray-50.border.border-gray-200.rounded');
            if (parentDiv) {
                parentDiv.remove();
            }
        }
    }
    
    console.log('已移除供应商和客户Tab中的产品规格信息区域');
});
