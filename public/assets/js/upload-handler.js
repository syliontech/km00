/**
 * 上传处理模块
 * 负责处理图片和文件上传的相关逻辑
 * 与FileUploadService集成，实现将文件上传到指定文件夹并保存URL到数据库
 */

// 确保全局命名空间存在
window.ProductSystem = window.ProductSystem || {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化上传处理模块');
    
    // 初始化上传处理
    initUploadHandlers();
});

/**
 * 初始化上传处理程序
 */
function initUploadHandlers() {
    // 初始化图片上传
    initImageUpload();
    
    // 初始化文件上传
    initFileUpload();
    
    // 初始化编辑按钮事件
    initEditButtons();
    
    // 初始化产品编码监听
    initProductCodeListener();
}

/**
 * 初始化产品编码监听
 */
function initProductCodeListener() {
    // 监听产品编码输入框变更
    const productCodeInput = document.getElementById('product-code');
    if (productCodeInput) {
        productCodeInput.addEventListener('change', function() {
            const productCode = this.value.trim();
            if (productCode) {
                // 设置当前产品编码
                if (ProductSystem.FileUploadService) {
                    ProductSystem.FileUploadService.setProductCode(productCode);
                }
                
                // 触发产品编码变更事件
                document.dispatchEvent(new CustomEvent('product-code-changed', {
                    detail: { productCode: productCode }
                }));
                
                // 加载产品的图片和文件
                loadProductMedia(productCode);
            }
        });
    }
    
    // 监听产品选择事件
    document.addEventListener('product-selected', function(e) {
        if (e.detail && e.detail.productCode) {
            const productCode = e.detail.productCode;
            
            // 设置当前产品编码
            if (ProductSystem.FileUploadService) {
                ProductSystem.FileUploadService.setProductCode(productCode);
            }
            
            // 加载产品的图片和文件
            loadProductMedia(productCode);
        }
    });
}

/**
 * 加载产品的图片和文件
 * @param {string} productCode 产品编码
 */
async function loadProductMedia(productCode) {
    if (!ProductSystem.FileUploadService) return;
    
    try {
        // 加载产品图片
        const images = await ProductSystem.FileUploadService.getProductImages(productCode);
        displayProductImages(images);
        
        // 加载产品文件
        const files = await ProductSystem.FileUploadService.getProductFiles(productCode);
        displayProductFiles(files);
    } catch (error) {
        console.error('加载产品媒体文件失败:', error);
    }
}

/**
 * 显示产品图片
 * @param {Array} images 图片数组
 */
function displayProductImages(images) {
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    if (!uploadedImagesPreview) return;
    
    // 清空预览区域
    uploadedImagesPreview.innerHTML = '';
    
    // 添加图片到预览区域
    images.forEach(image => {
        // 创建图片预览容器
        const previewContainer = document.createElement('div');
        previewContainer.className = 'relative w-24 h-24 border rounded overflow-hidden m-1';
        previewContainer.setAttribute('data-image-id', image.id);
        
        // 创建图片元素
        const img = document.createElement('img');
        img.src = image.image_url;
        img.alt = image.file_name;
        img.className = 'w-full h-full object-cover';
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center';
        deleteBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
        
        // 删除按钮点击事件
        deleteBtn.addEventListener('click', async function() {
            if (confirm('确定要删除此图片吗？')) {
                // 删除图片
                if (ProductSystem.FileUploadService) {
                    const success = await ProductSystem.FileUploadService.deleteProductImage(image.id);
                    if (success) {
                        previewContainer.remove();
                        
                        // 更新图片链接文本域
                        updateImageLinks();
                        
                        // 更新缩略图列表
                        if (typeof window.updateThumbnailsList === 'function') {
                            window.updateThumbnailsList();
                        }
                        
                        // 如果工作流闭环已启动，则切换到修改状态
                        if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                            if (typeof window.changeWorkflowState === 'function') {
                                window.changeWorkflowState('modify');
                            }
                        }
                    }
                }
            }
        });
        
        // 添加元素到预览容器
        previewContainer.appendChild(img);
        previewContainer.appendChild(deleteBtn);
        
        // 添加预览容器到预览区域
        uploadedImagesPreview.appendChild(previewContainer);
    });
    
    // 更新图片链接文本域
    updateImageLinks();
}

/**
 * 显示产品文件
 * @param {Array} files 文件数组
 */
function displayProductFiles(files) {
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    if (!uploadedFilesList) return;
    
    // 清空文件列表
    uploadedFilesList.innerHTML = '';
    
    // 添加文件到列表
    files.forEach(file => {
        // 创建文件项
        const fileItem = document.createElement('div');
        fileItem.className = 'cursor-pointer flex items-center justify-between p-2 hover:bg-gray-100 rounded';
        fileItem.setAttribute('data-file-id', file.id);
        
        // 创建文件图标和名称
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center';
        
        // 根据文件类型选择图标
        let iconClass = 'fas fa-file text-gray-500';
        if (file.file_type.startsWith('image/')) {
            iconClass = 'fas fa-file-image text-purple-500';
        } else if (file.file_type.includes('pdf')) {
            iconClass = 'fas fa-file-pdf text-red-500';
        } else if (file.file_type.includes('word') || file.file_type.includes('document')) {
            iconClass = 'fas fa-file-word text-blue-500';
        } else if (file.file_type.includes('excel') || file.file_type.includes('spreadsheet')) {
            iconClass = 'fas fa-file-excel text-green-500';
        }
        
        fileInfo.innerHTML = `<i class="${iconClass} mr-2"></i><div>${file.file_name}</div>`;
        
        // 创建文件大小和删除按钮
        const fileActions = document.createElement('div');
        fileActions.className = 'flex items-center';
        
        // 格式化文件大小
        const fileSize = formatFileSize(file.file_size);
        
        fileActions.innerHTML = `
            <span class="text-xs text-gray-500 mr-2">${fileSize}</span>
            <button class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        // 添加删除按钮点击事件
        const deleteBtn = fileActions.querySelector('button');
        deleteBtn.addEventListener('click', async function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            
            if (confirm('确定要删除此文件吗？')) {
                // 删除文件
                if (ProductSystem.FileUploadService) {
                    const success = await ProductSystem.FileUploadService.deleteProductFile(file.id);
                    if (success) {
                        fileItem.remove();
                        
                        // 更新文件链接文本域
                        updateFileLinks();
                        
                        // 如果工作流闭环已启动，则切换到修改状态
                        if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                            if (typeof window.changeWorkflowState === 'function') {
                                window.changeWorkflowState('modify');
                            }
                        }
                    }
                }
            }
        });
        
        // 添加文件点击事件（预览）
        fileItem.addEventListener('click', function(e) {
            if (e.target !== deleteBtn && !deleteBtn.contains(e.target)) {
                window.open(file.file_url, '_blank');
            }
        });
        
        // 组装文件项
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileActions);
        
        // 添加到文件列表
        uploadedFilesList.appendChild(fileItem);
    });
    
    // 更新文件链接文本域
    updateFileLinks();
}

/**
 * 格式化文件大小
 * @param {number} bytes 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 初始化图片上传
 */
function initImageUpload() {
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const imageFileInput = document.getElementById('image-file-input');
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    
    if (!uploadImageBtn || !imageFileInput || !uploadedImagesPreview) return;
    
    // 上传图片按钮点击事件
    uploadImageBtn.addEventListener('click', function() {
        imageFileInput.click();
    });
    
    // 图片文件选择事件
    imageFileInput.addEventListener('change', function() {
        if (this.files.length === 0) return;
        
        // 处理选择的图片文件
        Array.from(this.files).forEach(file => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return;
            }
            
            // 如果有文件上传服务，使用服务上传
            if (ProductSystem.FileUploadService) {
                // 显示上传中状态
                const loadingContainer = document.createElement('div');
                loadingContainer.className = 'relative w-24 h-24 border rounded overflow-hidden m-1 flex items-center justify-center bg-gray-100';
                loadingContainer.innerHTML = '<div class="text-sm text-gray-500">上传中...</div>';
                uploadedImagesPreview.appendChild(loadingContainer);
                
                // 上传图片
                ProductSystem.FileUploadService.uploadImage(file, function(url, error) {
                    // 移除上传中状态
                    loadingContainer.remove();
                    
                    if (error) {
                        alert('图片上传失败: ' + error.message);
                        return;
                    }
                    
                    // 创建图片预览
                    createImagePreview(file, url);
                });
            } else {
                // 使用本地预览
                createImagePreview(file);
            }
        });
        
        // 清空文件输入框，以便可以重复选择同一文件
        this.value = '';
    });
    
    // 创建图片预览
    function createImagePreview(file, url) {
        // 创建文件读取器
        const reader = new FileReader();
        
        // 文件读取完成事件
        reader.onload = function(e) {
            // 创建图片预览容器
            const previewContainer = document.createElement('div');
            previewContainer.className = 'relative w-24 h-24 border rounded overflow-hidden m-1';
            
            // 创建图片元素
            const img = document.createElement('img');
            img.src = url || e.target.result;
            img.alt = file.name;
            img.className = 'w-full h-full object-cover';
            
            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center';
            deleteBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
            
            // 删除按钮点击事件
            deleteBtn.addEventListener('click', function() {
                // 如果有URL，尝试从服务器删除
                if (url && ProductSystem.FileUploadService) {
                    const imageId = previewContainer.getAttribute('data-image-id');
                    if (imageId) {
                        ProductSystem.FileUploadService.deleteProductImage(imageId);
                    }
                }
                
                previewContainer.remove();
                
                // 更新图片链接文本域
                updateImageLinks();
                
                // 更新缩略图列表
                if (typeof window.updateThumbnailsList === 'function') {
                    window.updateThumbnailsList();
                }
                
                // 如果工作流闭环已启动，则切换到修改状态
                if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                    if (typeof window.changeWorkflowState === 'function') {
                        window.changeWorkflowState('modify');
                    }
                }
            });
            
            // 添加元素到预览容器
            previewContainer.appendChild(img);
            previewContainer.appendChild(deleteBtn);
            
            // 添加预览容器到预览区域
            uploadedImagesPreview.appendChild(previewContainer);
            
            // 更新图片链接文本域
            updateImageLinks();
            
            // 更新缩略图列表
            if (typeof window.updateThumbnailsList === 'function') {
                window.updateThumbnailsList();
            }
            
            // 如果工作流闭环已启动，则切换到修改状态
            if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                if (typeof window.changeWorkflowState === 'function') {
                    window.changeWorkflowState('modify');
                }
            }
        };
        
        // 开始读取文件
        reader.readAsDataURL(file);
    }
}

/**
 * 更新图片链接文本域
 */
function updateImageLinks() {
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    const imageLinksTextarea = document.getElementById('record-image-links');
    
    if (!uploadedImagesPreview || !imageLinksTextarea) return;
    
    // 获取所有图片
    const images = uploadedImagesPreview.querySelectorAll('img');
    const links = Array.from(images).map(img => img.src);
    
    // 更新文本域
    imageLinksTextarea.value = links.join('\n');
}

/**
 * 初始化文件上传
 */
function initFileUpload() {
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const fileInput = document.getElementById('file-input');
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    
    if (!uploadFileBtn || !fileInput || !uploadedFilesList) return;
    
    // 上传文件按钮点击事件
    uploadFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', function() {
        if (this.files.length === 0) return;
        
        // 处理选择的文件
        Array.from(this.files).forEach(file => {
            // 如果有文件上传服务，使用服务上传
            if (ProductSystem.FileUploadService) {
                // 显示上传中状态
                const loadingItem = document.createElement('div');
                loadingItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
                loadingItem.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        <div>${file.name}</div>
                    </div>
                    <div class="text-xs text-gray-500">上传中...</div>
                `;
                uploadedFilesList.appendChild(loadingItem);
                
                // 上传文件
                ProductSystem.FileUploadService.uploadFile(file, function(url, error) {
                    // 移除上传中状态
                    loadingItem.remove();
                    
                    if (error) {
                        alert('文件上传失败: ' + error.message);
                        return;
                    }
                    
                    // 创建文件项
                    createFileItem(file, url);
                });
            } else {
                // 使用本地预览
                createFileItem(file);
            }
        });
        
        // 清空文件输入框，以便可以重复选择同一文件
        this.value = '';
    });
    
    // 创建文件项
    function createFileItem(file, url) {
        // 生成文件ID
        const fileId = url ? '' : generateFileId();
        
        // 创建文件项
        const fileItem = document.createElement('div');
        fileItem.className = 'cursor-pointer flex items-center justify-between p-2 hover:bg-gray-100 rounded';
        fileItem.setAttribute('data-file-id', fileId);
        
        // 创建文件图标和名称
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center';
        
        // 根据文件类型选择图标
        let iconClass = 'fas fa-file text-gray-500';
        if (file.type.startsWith('image/')) {
            iconClass = 'fas fa-file-image text-purple-500';
        } else if (file.type.includes('pdf')) {
            iconClass = 'fas fa-file-pdf text-red-500';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            iconClass = 'fas fa-file-word text-blue-500';
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            iconClass = 'fas fa-file-excel text-green-500';
        }
        
        fileInfo.innerHTML = `<i class="${iconClass} mr-2"></i><div>${file.name}</div>`;
        
        // 创建文件大小和删除按钮
        const fileActions = document.createElement('div');
        fileActions.className = 'flex items-center';
        
        // 格式化文件大小
        const fileSize = formatFileSize(file.size);
        
        fileActions.innerHTML = `
            <span class="text-xs text-gray-500 mr-2">${fileSize}</span>
            <button class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        // 添加删除按钮点击事件
        const deleteBtn = fileActions.querySelector('button');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 如果有URL，尝试从服务器删除
            if (url && ProductSystem.FileUploadService) {
                const fileId = fileItem.getAttribute('data-file-id');
                if (fileId) {
                    ProductSystem.FileUploadService.deleteProductFile(fileId);
                }
            }
            
            fileItem.remove();
            
            // 更新文件链接文本域
            updateFileLinks();
            
            // 如果工作流闭环已启动，则切换到修改状态
            if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                if (typeof window.changeWorkflowState === 'function') {
                    window.changeWorkflowState('modify');
                }
            }
        });
        
        // 添加文件点击事件（预览）
        fileItem.addEventListener('click', function(e) {
            if (e.target !== deleteBtn && !deleteBtn.contains(e.target)) {
                if (url) {
                    window.open(url, '_blank');
                } else {
                    // 本地文件无法预览
                    alert('本地文件无法预览');
                }
            }
        });
        
        // 组装文件项
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileActions);
        
        // 添加到文件列表
        uploadedFilesList.appendChild(fileItem);
        
        // 更新文件链接文本域
        updateFileLinks();
        
        // 如果工作流闭环已启动，则切换到修改状态
        if (window.workflowLoopStarted && window.workflowState !== 'idle') {
            if (typeof window.changeWorkflowState === 'function') {
                window.changeWorkflowState('modify');
            }
        }
    }
}

/**
 * 生成文件ID
 * @returns {string} 文件ID
 */
function generateFileId() {
    return 'file_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 更新文件链接文本域
 */
function updateFileLinks() {
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    const fileLinksTextarea = document.getElementById('record-file-links');
    
    if (!uploadedFilesList || !fileLinksTextarea) return;
    
    // 获取所有文件名
    const files = uploadedFilesList.querySelectorAll('.cursor-pointer');
    const links = Array.from(files).map(file => {
        const fileName = file.querySelector('div').textContent.trim();
        const fileId = file.getAttribute('data-file-id');
        return `${fileName} (${fileId})`;
    });
    
    // 更新文本域
    fileLinksTextarea.value = links.join('\n');
}

/**
 * 初始化编辑按钮事件
 */
function initEditButtons() {
    // 初始化图片编辑按钮
    const editImagesBtn = document.querySelector('.edit-images-btn');
    if (editImagesBtn) {
        editImagesBtn.addEventListener('click', function() {
            // 获取图片区域
            const imagesArea = this.closest('.w-full.md\\:w-2\\/3');
            if (!imagesArea) return;
            
            // 获取展示模式和编辑模式
            const displayMode = imagesArea.querySelector('.display-mode');
            const editMode = imagesArea.querySelector('.edit-mode');
            
            if (!displayMode || !editMode) return;
            
            // 切换显示
            if (displayMode.classList.contains('hidden')) {
                // 切换到展示模式
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                this.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            } else {
                // 切换到编辑模式
                displayMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                this.innerHTML = '<i class="fas fa-eye"></i> 预览';
                
                // 如果工作流闭环已启动，则切换到修改状态
                if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                    if (typeof window.changeWorkflowState === 'function') {
                        window.changeWorkflowState('modify');
                    }
                }
            }
        });
    }
    
    // 初始化文件编辑按钮
    const editFilesBtn = document.querySelector('.edit-files-btn');
    if (editFilesBtn) {
        editFilesBtn.addEventListener('click', function() {
            // 获取文件区域
            const filesArea = this.closest('.w-full.md\\:w-1\\/3');
            if (!filesArea) return;
            
            // 获取展示模式和编辑模式
            const displayMode = filesArea.querySelector('.display-mode');
            const editMode = filesArea.querySelector('.edit-mode');
            
            if (!displayMode || !editMode) return;
            
            // 切换显示
            if (displayMode.classList.contains('hidden')) {
                // 切换到展示模式
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                this.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            } else {
                // 切换到编辑模式
                displayMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                this.innerHTML = '<i class="fas fa-eye"></i> 预览';
                
                // 如果工作流闭环已启动，则切换到修改状态
                if (window.workflowLoopStarted && window.workflowState !== 'idle') {
                    if (typeof window.changeWorkflowState === 'function') {
                        window.changeWorkflowState('modify');
                    }
                }
            }
        });
    }
}

// 导出函数到全局作用域
window.updateImageLinks = updateImageLinks;
window.updateFileLinks = updateFileLinks;
window.loadProductMedia = loadProductMedia;