/**
 * 产品表格处理
 * 负责产品表格的渲染和事件绑定
 */

// 产品表格处理器
const ProductTableHandler = {
    /**
     * 初始化表格处理器
     */
    init() {
        console.log('初始化产品表格处理器...');
        this.bindTableEvents();
    },
    
    /**
     * 绑定表格相关事件
     */
    bindTableEvents() {
        // 绑定产品选择事件
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('product-select')) {
                this.updateProductSelectionButtons();
            }
        });
        
        // 绑定删除产品按钮
        const deleteProductBtn = document.getElementById('deleteProductBtn');
        if (deleteProductBtn) {
            deleteProductBtn.addEventListener('click', () => this.handleDeleteSelectedProducts());
        }
        
        // 绑定编辑产品按钮
        const editProductBtn = document.getElementById('editProductBtn');
        if (editProductBtn) {
            editProductBtn.addEventListener('click', () => this.handleEditSelectedProduct());
        }
        
        // 绑定复制产品按钮
        const copyProductBtn = document.getElementById('copyProductBtn');
        if (copyProductBtn) {
            copyProductBtn.addEventListener('click', () => this.handleCopySelectedProduct());
        }
    },
    
    /**
     * 渲染产品表格
     * @param {Array} products 产品数组
     */
    renderProductTable(products) {
        // 获取表格体元素
        const productTableBody = document.querySelector('table tbody');
        if (!productTableBody) {
            console.error('找不到产品表格体元素');
            return;
        }
        
        // 清空表格
        productTableBody.innerHTML = '';
        
        if (!products || products.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="12" class="py-4 text-center text-gray-500">
                    暂无产品数据
                </td>
            `;
            productTableBody.appendChild(emptyRow);
            return;
        }
        
        // 添加产品行
        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.dataset.productId = product.id || product.products_pkey || '';
            
            // 产品属性类型
            const productType = product.product_type || 'single';
            const productTypeText = productType === 'group' ? '组套' : '单件';
            const productTypeClass = productType === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
            
            // 图片路径
            const imagePath = product.image_url || 'assets/images/placeholder.jpg';
            
            row.innerHTML = `
                <td class="py-2 px-2"><input type="checkbox" class="product-select"></td>
                <td class="py-2 px-2"><img src="${imagePath}" alt="产品图片" class="w-16 h-16 object-contain"></td>
                <td class="py-2 px-2">${product.category_name || ''}</td>
                <td class="py-2 px-2">${product.code || product.product_code || ''}</td>
                <td class="py-2 px-2">${product.name || product.品描 || ''}</td>
                <td class="py-2 px-2">${product.material || ''}</td>
                <td class="py-2 px-2">${product.color || ''}</td>
                <td class="py-2 px-2">${product.size || ''}</td>
                <td class="py-2 px-2">${product.other_spec || ''}</td>
                <td class="py-2 px-2">${product.unit || (productType === 'group' ? '套/set' : '件/pc')}</td>
                <td class="py-2 px-2"><span class="${productTypeClass} text-xs px-2 py-1 rounded">${productTypeText}</span></td>
                <td class="py-2 px-2">
                    <button class="text-blue-500 hover:underline text-xs mr-2 edit-btn" data-id="${product.id || product.products_pkey}">编辑</button>
                    <button class="text-red-500 hover:underline text-xs delete-btn" data-id="${product.id || product.products_pkey}">删除</button>
                </td>
            `;
            
            // 将行添加到表格中
            productTableBody.appendChild(row);
        });
        
        // 绑定行操作按钮事件
        this.bindRowEvents();
    },
    
    /**
     * 绑定表格行事件
     */
    bindRowEvents() {
        // 获取表格体元素
        const productTableBody = document.querySelector('table tbody');
        if (!productTableBody) {
            console.error('找不到产品表格体元素');
            return;
        }
        
        // 绑定编辑按钮
        productTableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const productId = btn.dataset.id;
                if (productId) {
                    this.editProduct(productId);
                }
            });
        });
        
        // 绑定删除按钮
        productTableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const productId = btn.dataset.id;
                if (productId) {
                    this.deleteProduct(productId);
                }
            });
        });
    },
    
    /**
     * 更新产品选择按钮状态
     */
    updateProductSelectionButtons() {
        const selectedCheckboxes = document.querySelectorAll('.product-select:checked');
        const count = selectedCheckboxes.length;
        
        // 获取按钮元素
        const editProductBtn = document.getElementById('editProductBtn');
        const copyProductBtn = document.getElementById('copyProductBtn');
        const deleteProductBtn = document.getElementById('deleteProductBtn');
        
        // 更新编辑按钮状态
        if (editProductBtn) {
            editProductBtn.disabled = count !== 1;
            editProductBtn.classList.toggle('bg-gray-400', count !== 1);
            editProductBtn.classList.toggle('bg-blue-500', count === 1);
        }
        
        // 更新复制按钮状态
        if (copyProductBtn) {
            copyProductBtn.disabled = count !== 1;
            copyProductBtn.classList.toggle('bg-gray-400', count !== 1);
            copyProductBtn.classList.toggle('bg-blue-500', count === 1);
        }
        
        // 更新删除按钮状态
        if (deleteProductBtn) {
            deleteProductBtn.disabled = count === 0;
            deleteProductBtn.classList.toggle('bg-gray-400', count === 0);
            deleteProductBtn.classList.toggle('bg-red-500', count > 0);
        }
    },
    
    /**
     * 获取选中的产品ID
     * @returns {string|null} 选中的产品ID或null
     */
    getSelectedProductId() {
        const selectedCheckbox = document.querySelector('.product-select:checked');
        if (!selectedCheckbox) return null;
        
        const row = selectedCheckbox.closest('tr');
        return row ? row.dataset.productId : null;
    },
    
    /**
     * 获取所有选中的产品ID
     * @returns {Array} 选中的产品ID数组
     */
    getSelectedProductIds() {
        const selectedIds = [];
        const selectedCheckboxes = document.querySelectorAll('.product-select:checked');
        
        selectedCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row && row.dataset.productId) {
                selectedIds.push(row.dataset.productId);
            }
        });
        
        return selectedIds;
    },
    
    /**
     * 处理编辑选中的产品
     */
    handleEditSelectedProduct() {
        const productId = this.getSelectedProductId();
        if (!productId) {
            alert('请选择要编辑的产品');
            return;
        }
        
        this.editProduct(productId);
    },
    
    /**
     * 处理复制选中的产品
     */
    handleCopySelectedProduct() {
        const productId = this.getSelectedProductId();
        if (!productId) {
            alert('请选择要复制的产品');
            return;
        }
        
        this.copyProduct(productId);
    },
    
    /**
     * 处理删除选中的产品
     */
    handleDeleteSelectedProducts() {
        const selectedIds = this.getSelectedProductIds();
        if (selectedIds.length === 0) {
            alert('请选择要删除的产品');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${selectedIds.length} 个产品吗？删除后将同时删除关联的供应商/客户产品。`)) {
            this.deleteMultipleProducts(selectedIds);
        }
    },
    
    /**
     * 编辑产品
     * @param {string} productId 产品ID
     */
    editProduct(productId) {
        console.log(`编辑产品 ID: ${productId}`);
        // 这里需要调用产品编辑功能
        if (window.openEditProductModal) {
            window.openEditProductModal(productId);
        } else {
            alert('编辑功能尚未实现');
        }
    },
    
    /**
     * 复制产品
     * @param {string} productId 产品ID
     */
    copyProduct(productId) {
        console.log(`复制产品 ID: ${productId}`);
        // 这里需要调用产品复制功能
        if (window.copyProductAsNew) {
            window.copyProductAsNew(productId);
        } else {
            alert('复制功能尚未实现');
        }
    },
    
    /**
     * 删除产品
     * @param {string} productId 产品ID
     */
    deleteProduct(productId) {
        if (confirm('确定要删除此产品吗？此操作不可撤销，产品相关的所有文件也将被删除。')) {
            console.log(`删除产品 ID: ${productId}`);
            
            if (window.ProductManagementUtils && window.ProductManagementUtils.deleteProductWithRelations) {
                // 显示加载中提示
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                loadingDiv.innerHTML = `
                    <div class="bg-white p-4 rounded-lg shadow-lg">
                        <p class="text-lg font-semibold">正在删除产品...</p>
                    </div>
                `;
                document.body.appendChild(loadingDiv);
                
                // 执行删除
                window.ProductManagementUtils.deleteProductWithRelations(productId)
                    .then(() => {
                        // 删除成功
                        document.body.removeChild(loadingDiv);
                        alert('产品删除成功');
                        window.location.reload();
                    })
                    .catch(error => {
                        // 删除失败
                        document.body.removeChild(loadingDiv);
                        console.error('删除产品失败:', error);
                        alert('删除产品失败: ' + error.message);
                    });
            } else {
                alert('删除功能尚未实现');
            }
        }
    },
    
    /**
     * 删除多个产品
     * @param {Array} productIds 产品ID数组
     */
    deleteMultipleProducts(productIds) {
        if (!productIds || productIds.length === 0) return;
        
        // 显示加载中提示
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
        const totalItems = productIds.length;
        let completedItems = 0;
        let hasErrors = false;
        
        // 逐个删除产品
        const deleteNextProduct = (index) => {
            if (index >= productIds.length) {
                // 所有产品已处理完毕
                document.body.removeChild(loadingDiv);
                if (hasErrors) {
                    alert('部分产品删除失败，请刷新页面查看结果');
                } else {
                    alert('所有选中的产品已成功删除');
                }
                window.location.reload();
                return;
            }
            
            const productId = productIds[index];
            
            if (window.ProductManagementUtils && window.ProductManagementUtils.deleteProductWithRelations) {
                window.ProductManagementUtils.deleteProductWithRelations(productId)
                    .then(() => {
                        // 更新进度
                        completedItems++;
                        const progress = (completedItems / totalItems) * 100;
                        if (progressBar) {
                            progressBar.style.width = `${progress}%`;
                        }
                        
                        // 处理下一个产品
                        deleteNextProduct(index + 1);
                    })
                    .catch(error => {
                        console.error(`删除产品 ID: ${productId} 失败:`, error);
                        hasErrors = true;
                        
                        // 更新进度
                        completedItems++;
                        const progress = (completedItems / totalItems) * 100;
                        if (progressBar) {
                            progressBar.style.width = `${progress}%`;
                        }
                        
                        // 处理下一个产品
                        deleteNextProduct(index + 1);
                    });
            } else {
                hasErrors = true;
                
                // 更新进度
                completedItems++;
                const progress = (completedItems / totalItems) * 100;
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                
                // 处理下一个产品
                deleteNextProduct(index + 1);
            }
        };
        
        // 开始删除第一个产品
        deleteNextProduct(0);
    }
};

// 页面加载完成后初始化表格处理器
document.addEventListener('DOMContentLoaded', () => {
    ProductTableHandler.init();
});

// 导出表格处理器
window.ProductTableHandler = ProductTableHandler;
