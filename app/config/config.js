/**
 * 全局配置文件
 * 包含系统配置和模拟数据
 */

// 全局配置对象
window.CONFIG = {
    // 是否强制使用模拟数据
    FORCE_MOCK_DATA: false,
    
    // 模拟分类数据
    mockCategories: [
        { id: 1, 分类编码: 'A1B2', 用途: '工业', 产品分类: '机械', 产品细分: '轴承', 细分说明: '滚珠' },
        { id: 2, 分类编码: 'A1C3', 用途: '工业', 产品分类: '机械', 产品细分: '齿轮', 细分说明: '直齿' },
        { id: 3, 分类编码: 'B2D4', 用途: '民用', 产品分类: '电器', 产品细分: '开关', 细分说明: '按钮' },
        { id: 4, 分类编码: 'C3E5', 用途: '工业', 产品分类: '电子', 产品细分: '传感器', 细分说明: '温度' },
        { id: 5, 分类编码: 'D4F6', 用途: '民用', 产品分类: '家居', 产品细分: '灯具', 细分说明: 'LED' }
    ],
    
    // 模拟产品数据
    mockProducts: [
        { 
            id: 1, 
            itemNr: 'B2C1', 
            categoryId: 1,
            categoryCode: 'A1B2',
            categoryName: '工业-机械-轴承-滚珠',
            description: '高精度滚珠轴承', 
            feature: '耐磨损，低噪音',
            descriptionEn: 'High Precision Ball Bearing', 
            featureEn: 'Wear resistant, low noise',
            files: [],
            createTime: '2025-03-30T10:00:00.000Z'
        },
        { 
            id: 2, 
            itemNr: 'C3D2', 
            categoryId: 2,
            categoryCode: 'A1C3',
            categoryName: '工业-机械-齿轮-直齿',
            description: '高强度直齿齿轮', 
            feature: '传动平稳，效率高',
            descriptionEn: 'High Strength Spur Gear', 
            featureEn: 'Smooth transmission, high efficiency',
            files: [],
            createTime: '2025-03-30T11:00:00.000Z'
        },
        { 
            id: 3, 
            itemNr: 'D4E3', 
            categoryId: 3,
            categoryCode: 'B2D4',
            categoryName: '民用-电器-开关-按钮',
            description: '防水按钮开关', 
            feature: '触感好，寿命长',
            descriptionEn: 'Waterproof Push Button Switch', 
            featureEn: 'Good touch, long life',
            files: [],
            createTime: '2025-03-30T12:00:00.000Z'
        }
    ],
    
    // 模拟VDR记录数据
    mockVdrRecords: [
        {
            id: 1,
            ItemNr: 'B2C1',
            PdID: 'PD001',
            MfrModel: 'BRG-001',
            规格尺寸: '10mm x 30mm',
            材料: '不锈钢',
            说明: '高精度工业轴承',
            供应商: '上海轴承厂',
            包装: '50个/盒',
            价格: 12.5,
            价格说明: 'USD/个',
            图片: null,
            资料上传: null,
            createTime: '2025-03-30T10:30:00.000Z'
        },
        {
            id: 2,
            ItemNr: 'B2C1',
            PdID: 'PD002',
            MfrModel: 'BRG-002',
            规格尺寸: '15mm x 35mm',
            材料: '碳钢',
            说明: '标准工业轴承',
            供应商: '北京精密机械厂',
            包装: '20个/盒',
            价格: 15.8,
            价格说明: 'USD/个',
            图片: null,
            资料上传: null,
            createTime: '2025-03-30T11:30:00.000Z'
        },
        {
            id: 3,
            ItemNr: 'C3D2',
            PdID: 'PD003',
            MfrModel: 'GR-001',
            规格尺寸: '50mm x 10mm',
            材料: '合金钢',
            说明: '高强度齿轮',
            供应商: '广州传动设备厂',
            包装: '10个/盒',
            价格: 25.0,
            价格说明: 'USD/个',
            图片: null,
            资料上传: null,
            createTime: '2025-03-30T12:30:00.000Z'
        }
    ]
};
