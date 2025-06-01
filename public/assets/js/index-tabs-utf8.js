document.addEventListener('DOMContentLoaded', function() {
    // 右区工作流状态管理
    let rightPanelState = 'waiting'; // 可能的状态: waiting, editing, copying
    const rightPanel = document.getElementById('rightPanel');
    const rightPanelStatus = document.getElementById('rightPanelStatus');
    
    // 清空现有内容并添加结构
    initRightPanelStructure();
    
    // 创建并添加待机状态遮罩
    const waitingMask = document.createElement('div');
    waitingMask.id = 'waitingMask';
    waitingMask.className = 'absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-10';
    waitingMask.innerHTML = `
        <div class="text-gray-500 text-lg bg-white p-4 rounded shadow-md">
            <i class="fas fa-clock mr-2"></i>待机状态 - 点击"新建"开始
        </div>
    `;
    rightPanel.appendChild(waitingMask);
    
    // 初始化右区结构
    function initRightPanelStructure() {
        // 清空现有内容
        rightPanel.innerHTML = '';
        
        // 添加右区控制按钮和状态指示
        const controlButtons = document.createElement('div');
        controlButtons.className = 'flex justify-between items-center mb-4 border-b pb-2';
        controlButtons.innerHTML = `
            <div class="flex space-x-2">
                <button id="newRecordBtn" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    <i class="fas fa-plus mr-1"></i>新建
                </button>
                <button id="copyRecordBtn" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600" disabled>
                    <i class="fas fa-copy mr-1"></i>复制新建
                </button>
            </div>
            <div class="text-sm text-gray-500" id="rightPanelStatus">待机状态</div>
        `;
        rightPanel.appendChild(controlButtons);
        
        // 添加上区：产品展示区
        const productDisplayArea = document.createElement('div');
        productDisplayArea.className = 'mb-4 border rounded p-3';
        productDisplayArea.id = 'productDisplayArea';
        productDisplayArea.innerHTML = `
            <!-- 默认状态 - 单件产品 -->
            <div id="singleProductDisplay" class="mb-3">
                <h3 class="text-lg font-medium mb-2">产品信息</h3>
                
                <!-- 图片展示 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-1">产品图片</p>
                    <div class="h-40 bg-gray-100 flex items-center justify-center" id="productImage">
                        <img src="" alt="产品图片" class="max-h-full hidden" id="productImagePreview">
                        <span class="text-gray-400" id="noImageText">暂无图片</span>
                    </div>
                </div>
                
                <!-- 产品分类和属性 -->
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">产品分类</p>
                        <p class="font-medium" id="productCategory">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">产品属性</p>
                        <p class="font-medium" id="productAttribute">单件</p>
                    </div>
                </div>
                
                <!-- 供应商信息 (受权限控制) -->
                <div class="mb-3" id="vendorInfoDisplay">
                    <p class="text-sm text-gray-500 mb-1">供应商信息</p>
                    <div class="space-y-2" id="vendorList">
                        <!-- 供应商项目将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noVendorText">暂无供应商信息</p>
                    </div>
                </div>
                
                <!-- 客户信息 (受权限控制) -->
                <div class="mb-3" id="customerInfoDisplay">
                    <p class="text-sm text-gray-500 mb-1">客户信息</p>
                    <div class="space-y-2" id="customerList">
                        <!-- 客户项目将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noCustomerText">暂无客户信息</p>
                    </div>
                </div>
            </div>
            
            <!-- 默认状态 - 组套产品 -->
            <div id="kitProductDisplay" class="mb-3 hidden">
                <h3 class="text-lg font-medium mb-2">产品信息</h3>
                
                <!-- 图片展示 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-1">产品图片</p>
                    <div class="h-40 bg-gray-100 flex items-center justify-center" id="kitProductImage">
                        <img src="" alt="产品图片" class="max-h-full hidden" id="kitProductImagePreview">
                        <span class="text-gray-400" id="noKitImageText">暂无图片</span>
                    </div>
                </div>
                
                <!-- 产品详细信息 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-1">产品详细信息</p>
                    <p class="font-medium" id="kitProductDetails">-</p>
                </div>
                
                <!-- 供应商信息 (受权限控制) -->
                <div class="mb-3" id="kitVendorInfoDisplay">
                    <p class="text-sm text-gray-500 mb-1">供应商信息</p>
                    <div class="space-y-2" id="kitVendorList">
                        <!-- 供应商项目将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noKitVendorText">暂无供应商信息</p>
                    </div>
                </div>
                
                <!-- 客户信息 (受权限控制) -->
                <div class="mb-3" id="kitCustomerInfoDisplay">
                    <p class="text-sm text-gray-500 mb-1">客户信息</p>
                    <div class="space-y-2" id="kitCustomerList">
                        <!-- 客户项目将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noKitCustomerText">暂无客户信息</p>
                    </div>
                </div>
            </div>
            
            <!-- 新建或编辑状态 - 上传功能 -->
            <div id="productEditArea" class="hidden">
                <h3 class="text-lg font-medium mb-2">产品编辑</h3>
                
                <!-- 图片上传 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-1">上传产品图片</p>
                    <div class="flex items-center space-x-2">
                        <label class="cursor-pointer bg-blue-50 border border-blue-200 rounded p-2 flex items-center">
                            <i class="fas fa-upload text-blue-500 mr-1"></i>
                            <span class="text-sm">选择图片</span>
                            <input type="file" class="hidden" id="productImageUpload" accept="image/*">
                        </label>
                        <span class="text-xs text-gray-500" id="imageFileName">未选择文件</span>
                    </div>
                </div>
                
                <!-- 文件上传 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-1">上传产品文档</p>
                    <div class="flex items-center space-x-2">
                        <label class="cursor-pointer bg-blue-50 border border-blue-200 rounded p-2 flex items-center">
                            <i class="fas fa-file text-blue-500 mr-1"></i>
                            <span class="text-sm">选择文件</span>
                            <input type="file" class="hidden" id="productFileUpload">
                        </label>
                        <span class="text-xs text-gray-500" id="docFileName">未选择文件</span>
                    </div>
                </div>
                
                <!-- 组套产品明细 (仅组套产品显示) -->
                <div class="mb-3 hidden" id="kitProductDetailArea">
                    <p class="text-sm text-gray-500 mb-1">产品明细</p>
                    <div class="border rounded p-2 max-h-40 overflow-y-auto" id="kitProductItems">
                        <!-- 组套产品项目将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noKitItemsText">暂无产品明细</p>
                    </div>
                </div>
            </div>
        `;
        rightPanel.appendChild(productDisplayArea);
        
        // 添加中区：配置区
        const configArea = document.createElement('div');
        configArea.className = 'mb-4';
        configArea.id = 'configArea';
        configArea.innerHTML = `
            <!-- Tab导航 -->
            <div class="flex border-b">
                <button class="px-4 py-2 border-b-2 border-blue-500 text-blue-500 font-medium" id="specsTab">规格</button>
                <button class="px-4 py-2 text-gray-500 hover:text-gray-700" id="kitTab">组套</button>
                <button class="px-4 py-2 text-gray-500 hover:text-gray-700" id="vendorTab">供应商</button>
                <button class="px-4 py-2 text-gray-500 hover:text-gray-700" id="customerTab">客户</button>
            </div>
            
            <!-- Tab内容区域 -->
            <div class="p-3 border-l border-r border-b">
                <!-- 规格Tab内容 -->
                <div id="specsTabContent">
                    <!-- 添加/删除属性按钮 (受权限控制) -->
                    <div class="flex justify-end mb-3">
                        <button class="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2" id="addSpecBtn" disabled>
                            <i class="fas fa-plus mr-1"></i>添加属性
                        </button>
                        <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" id="removeSpecBtn" disabled>
                            <i class="fas fa-minus mr-1"></i>删除属性
                        </button>
                    </div>
                    
                    <!-- 规格属性列表 -->
                    <div class="space-y-3" id="specsList">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <input type="text" class="w-full border rounded px-2 py-1 text-sm" placeholder="属性名称" disabled>
                            </div>
                            <div>
                                <input type="text" class="w-full border rounded px-2 py-1 text-sm spec-field" placeholder="属性值" disabled>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 组套Tab内容 -->
                <div id="kitTabContent" class="hidden">
                    <!-- 添加/删除产品按钮 -->
                    <div class="flex justify-end mb-3">
                        <button class="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2" id="addProductBtn" disabled>
                            <i class="fas fa-plus mr-1"></i>添加产品
                        </button>
                        <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" id="removeProductBtn" disabled>
                            <i class="fas fa-minus mr-1"></i>删除产品
                        </button>
                    </div>
                    
                    <!-- 产品选择区域 -->
                    <div class="mb-3">
                        <p class="text-sm text-gray-500 mb-1">选择产品</p>
                        <div class="flex space-x-2">
                            <select class="w-full border rounded px-2 py-1" id="productSelect" disabled>
                                <option value="">-- 选择产品 --</option>
                            </select>
                            <button class="bg-green-500 text-white px-3 py-1 rounded" id="addSelectedProductBtn" disabled>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 供应商Tab内容 -->
                <div id="vendorTabContent" class="hidden">
                    <div class="mb-3">
                        <p class="text-sm text-gray-500 mb-1">选择供应商</p>
                        <div class="flex space-x-2">
                            <select class="w-full border rounded px-2 py-1" id="vendorSelect" disabled>
                                <option value="">-- 选择供应商 --</option>
                            </select>
                            <button class="bg-green-500 text-white px-3 py-1 rounded" id="addNewVendorBtn" disabled>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2" id="selectedVendorsList">
                        <!-- 选中的供应商将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noSelectedVendorsText">暂无选中的供应商</p>
                    </div>
                </div>
                
                <!-- 客户Tab内容 -->
                <div id="customerTabContent" class="hidden">
                    <div class="mb-3">
                        <p class="text-sm text-gray-500 mb-1">选择客户</p>
                        <div class="flex space-x-2">
                            <select class="w-full border rounded px-2 py-1" id="customerSelect" disabled>
                                <option value="">-- 选择客户 --</option>
                            </select>
                            <button class="bg-green-500 text-white px-3 py-1 rounded" id="addNewCustomerBtn" disabled>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2" id="selectedCustomersList">
                        <!-- 选中的客户将在这里动态添加 -->
                        <p class="text-gray-400 text-sm" id="noSelectedCustomersText">暂无选中的客户</p>
                    </div>
                </div>
            </div>
        `;
        rightPanel.appendChild(configArea);
        
        // 添加下区：修改区
        const editArea = document.createElement('div');
        editArea.className = 'mb-4';
        editArea.id = 'editArea';
        editArea.innerHTML = `
            <!-- 功能按钮 -->
            <div class="flex justify-end mb-3">
                <button class="bg-blue-500 text-white px-3 py-1 rounded mr-2" id="editBtn" disabled>
                    <i class="fas fa-edit mr-1"></i>编辑
                </button>
                <button class="bg-yellow-500 text-white px-3 py-1 rounded mr-2" id="modifyBtn" disabled>
                    <i class="fas fa-pencil-alt mr-1"></i>修改
                </button>
                <button class="bg-green-500 text-white px-3 py-1 rounded" id="saveAsRecordBtn" disabled>
                    <i class="fas fa-save mr-1"></i>保存为记录
                </button>
            </div>
            
            <!-- 供应商详细信息 -->
            <div class="mb-3 border rounded p-3 hidden" id="vendorDetailsArea">
                <h4 class="font-medium mb-2">供应商详细信息</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">供应商名称</p>
                        <p class="font-medium" id="selectedVendorName">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Mfr.Nr.</p>
                        <input type="text" class="w-full border rounded px-2 py-1" id="vendorMfrNr" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">默认价格</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="vendorDefaultPrice" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">历史最低价</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="vendorLowestPrice" disabled>
                    </div>
                </div>
            </div>
            
            <!-- 客户详细信息 -->
            <div class="mb-3 border rounded p-3 hidden" id="customerDetailsArea">
                <h4 class="font-medium mb-2">客户详细信息</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">客户名称</p>
                        <p class="font-medium" id="selectedCustomerName">-</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">SKU</p>
                        <input type="text" class="w-full border rounded px-2 py-1" id="customerSku" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">最近成交价</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="customerLastPrice" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">最新报价</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="customerLatestQuote" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">利润水平</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="customerProfitLevel" disabled>
                    </div>
                </div>
            </div>
            
            <!-- 组套产品特有字段 -->
            <div class="mb-3 border rounded p-3 hidden" id="kitProductDetailsArea">
                <h4 class="font-medium mb-2">组套产品费用明细</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">产品总价</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="kitTotalPrice" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">包装费</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="kitPackagingFee" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">物料费</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="kitMaterialFee" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">人工费</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="kitLaborFee" disabled>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">其他费用</p>
                        <input type="number" class="w-full border rounded px-2 py-1" id="kitOtherFee" disabled>
                    </div>
                </div>
            </div>
        `;
        rightPanel.appendChild(editArea);
        
        // 添加提交区域
        const submitArea = document.createElement('div');
        submitArea.id = 'submitArea';
        submitArea.className = 'flex justify-end space-x-3 mt-4 pt-3 border-t hidden';
        submitArea.innerHTML = `
            <button id="cancelBtn" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                <i class="fas fa-times mr-1"></i>取消
            </button>
            <button id="submitBtn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                <i class="fas fa-check mr-1"></i>提交数据
            </button>
        `;
        rightPanel.appendChild(submitArea);
    }
    
    // 初始化为待机状态
    function initWaitingState() {
        rightPanelState = 'waiting';
        waitingMask.classList.remove('hidden');
        rightPanelStatus.textContent = '待机状态';
        document.getElementById('submitArea').classList.add('hidden');
        document.getElementById('copyRecordBtn').setAttribute('disabled', 'disabled');
        
        // 禁用所有输入控件
        document.querySelectorAll('#rightPanel input:not([readonly]), #rightPanel select, #rightPanel textarea').forEach(el => {
            el.setAttribute('disabled', 'disabled');
        });
        
        // 禁用添加按钮
        document.querySelectorAll('#addSpecBtn, #addNewVendorBtn, #addNewCustomerBtn').forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
            btn.classList.add('bg-gray-300', 'text-gray-700');
            btn.classList.remove('bg-blue-500', 'text-white');
        });
    }
    
    // 进入编辑状态
    function enterEditState(mode = 'new') {
        rightPanelState = mode === 'new' ? 'editing' : 'copying';
        waitingMask.classList.add('hidden');
        rightPanelStatus.textContent = mode === 'new' ? '新建中' : '复制新建中';
        document.getElementById('submitArea').classList.remove('hidden');
        
        // 启用所有输入控件
        document.querySelectorAll('#rightPanel input:not([readonly]), #rightPanel select, #rightPanel textarea').forEach(el => {
            el.removeAttribute('disabled');
        });
        
        // 启用添加按钮
        document.querySelectorAll('#addSpecBtn, #addNewVendorBtn, #addNewCustomerBtn').forEach(btn => {
            btn.removeAttribute('disabled');
            btn.classList.remove('bg-gray-300', 'text-gray-700');
            btn.classList.add('bg-blue-500', 'text-white');
        });
        
        if (mode === 'new') {
            // 清空所有字段
            clearAllFields();
        } else {
            // 复制模式 - 保留当前数据但生成新ID
            // 这里可以添加生成新ID的逻辑
        }
    }
    
    // 提交并重置
    function submitAndReset() {
        // 收集所有数据
        const formData = collectFormData();
        
        // 显示提交确认
        if (confirm('确定要提交数据吗？')) {
            // 这里应该有数据提交的API调用
            console.log('提交的数据:', formData);
            
            // 提交成功后提示
            alert('数据提交成功！');
            
            // 重置为待机状态
            clearAllFields();
            initWaitingState();
        }
    }
    
    // 收集表单数据
    function collectFormData() {
        const data = {
            specs: [],
            vendors: [],
            customers: []
        };
        
        // 收集规格数据
        document.querySelectorAll('#specsTabContent .spec-field').forEach(field => {
            const name = field.previousElementSibling ? field.previousElementSibling.value : '';
            data.specs.push({
                name: name,
                value: field.value
            });
        });
        
        // 收集供应商数据
        document.querySelectorAll('#vendorTabContent .border.rounded.p-2').forEach(item => {
            const nameElement = item.querySelector('.font-medium.text-sm');
            const mfrElement = item.querySelector('.text-xs.text-gray-500.ml-2');
            const priceElement = item.querySelector('.text-blue-600.text-sm');
            
            if (nameElement && mfrElement && priceElement) {
                data.vendors.push({
                    name: nameElement.textContent,
                    mfrNr: mfrElement.textContent.replace('Mfr. Nr.: ', ''),
                    price: priceElement.textContent.replace('¥', '')
                });
            }
        });
        
        // 收集客户数据
        document.querySelectorAll('#customerTabContent .border.rounded.p-2').forEach(item => {
            const nameElement = item.querySelector('.font-medium.text-sm');
            const skuElement = item.querySelector('.text-xs.text-gray-500.ml-2');
            const priceElement = item.querySelector('.text-green-600.text-sm');
            
            if (nameElement && skuElement && priceElement) {
                data.customers.push({
                    name: nameElement.textContent,
                    sku: skuElement.textContent.replace('SKU: ', ''),
                    price: priceElement.textContent.replace('¥', '')
                });
            }
        });
        
        return data;
    }
    
    // 清空所有字段
    function clearAllFields() {
        // 清空规格字段
        document.querySelectorAll('#specsTabContent .spec-field').forEach(field => {
            field.value = '';
        });
        
        // 清空供应商列表
        const vendorList = document.querySelector('#vendorTabContent .space-y-2');
        if (vendorList) {
            vendorList.innerHTML = '';
        }
        
        // 清空客户列表
        const customerList = document.querySelector('#customerTabContent .space-y-2');
        if (customerList) {
            customerList.innerHTML = '';
        }
    }
    
    // 事件监听器
    document.getElementById('newRecordBtn').addEventListener('click', function() {
        enterEditState('new');
    });
    
    document.getElementById('copyRecordBtn').addEventListener('click', function() {
        enterEditState('copy');
    });
    
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm('确定要取消当前操作吗？所有未保存的数据将丢失。')) {
            clearAllFields();
            initWaitingState();
        }
    });
    
    document.getElementById('submitBtn').addEventListener('click', submitAndReset);
    
    // 初始化为待机状态
    initWaitingState();
    
    // Tab切换逻辑
    const tabs = ['specs', 'kit', 'vendor', 'customer'];
    tabs.forEach(tab => {
        document.getElementById(`${tab}Tab`).addEventListener('click', function() {
            // 隐藏所有内容
            tabs.forEach(t => {
                document.getElementById(`${t}TabContent`).classList.add('hidden');
                document.getElementById(`${t}Tab`).classList.remove('border-blue-500', 'text-blue-500');
                document.getElementById(`${t}Tab`).classList.add('text-gray-500');
            });
            
            // 显示当前内容
            document.getElementById(`${tab}TabContent`).classList.remove('hidden');
            this.classList.add('border-blue-500', 'text-blue-500');
            this.classList.remove('text-gray-500');
        });
    });
});
