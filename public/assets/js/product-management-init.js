/**
 * 产品管理页面初始化脚本
 * 负责在页面加载后初始化所有产品管理功能
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('初始化产品管理页面...');
    
    // 绑定删除产品按钮
    const deleteProductBtn = document.getElementById('deleteProductBtn');
    if (deleteProductBtn) {
        deleteProductBtn.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.product-select:checked');
            if (selectedCheckboxes.length === 0) {
                alert('请选择要删除的产品');
                return;
            }
            
            // 确认删除
            if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个产品吗？删除后将同时删除关联的供应商/客户产品。`)) {
                try {
                    // 创建加载中提示
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    loadingDiv.innerHTML = `
                        <div class="bg-white p-4 rounded-lg shadow-lg">
                            <p class="text-lg font-semibold">正在删除产品...</p>
                            <div class="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                <div class="bg-blue-600 h-2.5 rounded-full w-0" id="deleteProgress"></div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(loadingDiv);
                    
                    const progressBar = document.getElementById('deleteProgress');
                    const totalItems = selectedCheckboxes.length;
                    let completedItems = 0;
                    
                    // 删除每个选中的产品
                    for (const checkbox of selectedCheckboxes) {
                        const row = checkbox.closest('tr');
                        const productId = row.dataset.productId;
                        
                        if (productId && window.ProductManagementUtils) {
                            try {
                                await window.ProductManagementUtils.deleteProductWithRelations(productId);
                                // 更新进度条
                                completedItems++;
                                const progress = (completedItems / totalItems) * 100;
                                if (progressBar) {
                                    progressBar.style.width = `${progress}%`;
                                }
                            } catch (error) {
                                console.error(`删除产品 ID: ${productId} 失败:`, error);
                            }
                        }
                    }
                    
                    // 删除完成后移除加载提示并刷新页面
                    document.body.removeChild(loadingDiv);
                    alert('产品删除完成');
                    window.location.reload();
                } catch (error) {
                    console.error('删除产品失败:', error);
                    alert(`删除产品失败: ${error.message}`);
                }
            }
        });
    }
    
    // 绑定产品类型变化事件
    const productType = document.getElementById('productType');
    if (productType) {
        productType.addEventListener('change', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.handleProductTypeChange();
            }
        });
    }
    
    // 绑定规格字段变化事件
    document.querySelectorAll('.spec-field').forEach(field => {
        field.addEventListener('change', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.checkSpecFieldChanges();
            }
        });
        
        // 保存原始值
        field.dataset.original = field.value;
    });
    
    // 绑定添加规格字段按钮
    const addSpecFieldBtn = document.getElementById('addSpecFieldBtn');
    if (addSpecFieldBtn) {
        addSpecFieldBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.addCustomSpecField();
            }
        });
    }
    
    // 绑定规格变化提示按钮
    const saveAsNewBtn = document.getElementById('saveAsNewBtn');
    if (saveAsNewBtn) {
        saveAsNewBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.saveAsNewProduct();
            }
        });
    }
    
    const cancelSpecChangeBtn = document.getElementById('cancelSpecChangeBtn');
    if (cancelSpecChangeBtn) {
        cancelSpecChangeBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.cancelSpecChange();
            }
        });
    }
    
    // 绑定组套产品管理按钮
    const addGroupProductBtn = document.getElementById('addGroupProductBtn');
    if (addGroupProductBtn) {
        addGroupProductBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.addGroupProductRow();
            }
        });
    }
    
    // 绑定供应商产品管理按钮
    const addSupplierProductBtn = document.getElementById('addSupplierProductBtn');
    if (addSupplierProductBtn) {
        addSupplierProductBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.addSupplierProductRow();
            }
        });
    }
    
    const supplierFilter = document.getElementById('supplierFilter');
    if (supplierFilter) {
        supplierFilter.addEventListener('change', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.filterSupplierProducts();
            }
        });
    }
    
    // 绑定客户产品管理按钮
    const addCustomerProductBtn = document.getElementById('addCustomerProductBtn');
    if (addCustomerProductBtn) {
        addCustomerProductBtn.addEventListener('click', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.addCustomerProductRow();
            }
        });
    }
    
    const customerFilter = document.getElementById('customerFilter');
    if (customerFilter) {
        customerFilter.addEventListener('change', () => {
            if (window.ProductManagementUtils) {
                window.ProductManagementUtils.filterCustomerProducts();
            }
        });
    }
    
    // 绑定产品选择事件
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('product-select')) {
            const editProductBtn = document.getElementById('editProductBtn');
            const copyProductBtn = document.getElementById('copyProductBtn');
            const deleteProductBtn = document.getElementById('deleteProductBtn');
            
            const selectedCheckboxes = document.querySelectorAll('.product-select:checked');
            const count = selectedCheckboxes.length;
            
            // 更新按钮状态
            if (editProductBtn) {
                editProductBtn.disabled = count !== 1;
                editProductBtn.classList.toggle('bg-gray-400', count !== 1);
                editProductBtn.classList.toggle('bg-blue-500', count === 1);
            }
            
            if (copyProductBtn) {
                copyProductBtn.disabled = count !== 1;
                copyProductBtn.classList.toggle('bg-gray-400', count !== 1);
                copyProductBtn.classList.toggle('bg-blue-500', count === 1);
            }
            
            if (deleteProductBtn) {
                deleteProductBtn.disabled = count === 0;
                deleteProductBtn.classList.toggle('bg-gray-400', count === 0);
                deleteProductBtn.classList.toggle('bg-red-500', count > 0);
            }
        }
    });
    
    console.log('产品管理页面初始化完成');
});
