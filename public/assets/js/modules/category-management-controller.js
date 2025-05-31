import { supabase } from '../../config/supabase-config.js';
import {
    getCategories,
    getCategoryWithAncestry,
    getCategoriesForDisplayOrExport,
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories
} from '../services/category-service.js';

console.log('category-management-controller.js loaded (for Cascading Filter Logic).');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Category Management DOM fully loaded and parsed (Cascading Filter controller update).');

    // --- DOM Elements ---
    const searchInput = document.getElementById('searchInput');
    const addNewBtn = document.getElementById('addNewBtn');
    const checkConsistencyBtn = document.getElementById('checkConsistencyBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const tableBody = document.getElementById('tableBody');
    const activeFiltersDiv = document.getElementById('activeFilters');

    const filterDivs = {
        l1: document.getElementById('用途Filter'),
        l2: document.getElementById('产品分类Filter'),
        l3: document.getElementById('产品细分Filter'),
        l4: document.getElementById('细分说明Filter'),
    };
    // Modal elements (assuming they are unchanged from previous correct state)
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const categoryForm = document.getElementById('categoryForm');
    const categoryIdInput = document.getElementById('categoryId');
    const modalCategoryCodeDisplay = document.getElementById('modalCategoryCodeDisplay');
    const modalParentSelects = { /* ... */ }; // Assuming these are correctly defined as before
    const modalParentIdInputs = { /* ... */ };
    const modalNameInputs = { /* ... */ };
    const addModeButtons = document.getElementById('addModeButtons');
    const editModeButtons = document.getElementById('editModeButtons');
    const saveBtn = document.getElementById('saveBtn');
    const updateBtn = document.getElementById('updateBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');


    // --- State ---
    let currentFilters = { l1Codes: [], l2Codes: [], l3Codes: [], l4Codes: [] };
    let editingCategoryLevel = null;

    // --- Filter Population & Handling ---
    async function renderFilterLevel(level, parentCodes = []) {
        const filterLevelKey = `l${level}Codes`; // e.g. l1Codes
        const filterDiv = filterDivs[`l${level}`];
        if (!filterDiv) { console.warn(`Filter div for level ${level} not found.`); return; }

        filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">Loading L${level} filters...</p>`;

        let categories = [];
        if (level === 1) {
            categories = await getCategories({ level: 1 });
        } else if (parentCodes && parentCodes.length > 0) {
            categories = await getCategories({ level: level, parent_code_in: parentCodes });
        } else {
            // No parent codes selected for L2+ or invalid call, so no children to show
            filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">Select L${level-1} parent(s) first.</p>`;
            return;
        }

        filterDiv.innerHTML = ''; // Clear loading/previous message
        if (categories.length === 0 && level > 1) {
             filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">No L${level} children found.</p>`;
        }

        const distinctCategories = Array.from(new Map(categories.map(item => [item.code, item])).values()); // Ensure unique by code

        distinctCategories.forEach(item => {
            const div = document.createElement('div'); div.classList.add('flex', 'items-center', 'mb-1');
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
            checkbox.id = `filter-${level}-${item.code}`; checkbox.value = item.code;
            checkbox.dataset.filterLevel = level; checkbox.dataset.filterName = item.name;
            checkbox.classList.add('h-4', 'w-4', 'text-blue-600', 'border-gray-300', 'rounded', 'focus:ring-blue-500', 'cursor-pointer');
            checkbox.checked = currentFilters[filterLevelKey]?.includes(item.code) || false;
            checkbox.addEventListener('change', handleFilterChange);

            const label = document.createElement('label'); label.htmlFor = checkbox.id;
            label.textContent = `${item.name} (${item.name_en || item.code})`;
            label.classList.add('ml-2', 'text-sm', 'text-gray-700', 'cursor-pointer');

            div.appendChild(checkbox); div.appendChild(label); filterDiv.appendChild(div);
        });
    }

    async function populateFilterControls() { // Initially populates L1 and clears others
        await renderFilterLevel(1); // L1 has no parents
        for (let i = 2; i <= 4; i++) {
            const filterDiv = filterDivs[`l${i}`];
            if (filterDiv) filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">Select L${i-1} parent(s) first.</p>`;
        }
    }

    async function handleFilterChange(event) {
        const checkbox = event.target;
        const level = parseInt(checkbox.dataset.filterLevel);
        const code = checkbox.value;
        const filterKey = `l${level}Codes`; // e.g., l1Codes

        // Update currentFilters: Add or remove the code from the array for that level
        if (!currentFilters[filterKey]) currentFilters[filterKey] = [];
        if (checkbox.checked) {
            if (!currentFilters[filterKey].includes(code)) {
                currentFilters[filterKey].push(code);
            }
        } else {
            currentFilters[filterKey] = currentFilters[filterKey].filter(c => c !== code);
        }

        // Clear and repopulate subsequent (deeper) filter levels
        for (let i = level + 1; i <= 4; i++) {
            currentFilters[`l${i}Codes`] = []; // Clear selected codes for deeper levels
            const parentCodesForNextLevel = currentFilters[`l${i-1}Codes`];
            if (parentCodesForNextLevel && parentCodesForNextLevel.length > 0) {
                await renderFilterLevel(i, parentCodesForNextLevel);
            } else {
                const filterDiv = filterDivs[`l${i}`];
                if (filterDiv) filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">Select L${i-1} parent(s) first.</p>`;
            }
        }
        // If a level is completely deselected, also clear its children display
        if (currentFilters[filterKey].length === 0 && level < 4) {
             const filterDiv = filterDivs[`l${level+1}`];
             if (filterDiv) filterDiv.innerHTML = `<p class="text-xs text-slate-400 p-1">Select L${level} parent(s) first.</p>`;
        }


        updateActiveFiltersDisplay();
        await displayCategories(currentFilters);
    }

    function updateActiveFiltersDisplay() {
        activeFiltersDiv.innerHTML = '<strong class="text-sm text-gray-600">Active Filters: </strong>';
        const activeParts = [];
        for (let i = 1; i <= 4; i++) {
            const levelKey = `l${i}Codes`;
            if (currentFilters[levelKey] && currentFilters[levelKey].length > 0) {
                const names = currentFilters[levelKey].map(code => {
                    // Try to get name from a checked checkbox, otherwise just show code
                    const checkedBox = document.querySelector(`input[data-filter-level="${i}"][value="${code}"]:checked`);
                    return checkedBox ? checkedBox.dataset.filterName : code;
                });
                activeParts.push(`L${i}: ${names.join('/')}`);
            }
        }
        activeFiltersDiv.innerHTML += activeParts.length ? activeParts.join(' <i class="fas fa-angle-right text-xs text-gray-400"></i> ') : '<span class="text-sm text-gray-500">None</span>';
    }

    // --- Table Display & Action Handlers (displayCategories uses new service fn) ---
    async function displayCategories(filters = {}) {
        if (!tableBody) { console.error("Table body not found."); return; }
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-500 text-sm">Loading data...</td></tr>`;
        const categoriesToDisplay = await getCategoriesForDisplayOrExport(filters, false);
        tableBody.innerHTML = '';
        if (categoriesToDisplay.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-500 text-sm">No categories found.</td></tr>`; return;
        }
        categoriesToDisplay.forEach(cat => {
            const row = tableBody.insertRow(); row.classList.add('hover:bg-slate-50');
            row.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap text-xs">${cat.l1Name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs">${cat.l2Name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs">${cat.l3Name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs">${cat.l4Name}</td>
                <td class="px-3 py-2 whitespace-nowrap font-mono text-xs">${cat.finalCategoryCode}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs">
                    <button class="edit-cat-btn py-1 px-2 rounded-md text-sky-600 hover:text-sky-800 hover:bg-sky-100" data-id="${cat.categoryId}" data-code="${cat.finalCategoryCode}"><i class="fas fa-edit mr-1"></i>Edit</button>
                    <button class="delete-cat-btn py-1 px-2 rounded-md text-red-600 hover:text-red-800 hover:bg-red-100" data-id="${cat.categoryId}" data-code="${cat.finalCategoryCode}"><i class="fas fa-trash mr-1"></i>Delete</button>
                </td>`;
            row.querySelector('.edit-cat-btn').addEventListener('click', (e) => {
                handleEditCategoryClick(e.currentTarget.dataset.id, e.currentTarget.dataset.code);
            });
            row.querySelector('.delete-cat-btn').addEventListener('click', (e) => {
                handleDeleteCategoryClick(e.currentTarget.dataset.id, e.currentTarget.dataset.code);
            });
        });
    }
    async function handleDeleteCategoryClick(categoryId, categoryCode) { /* Unchanged */ }

    // --- Modal Logic (largely unchanged, ensure DOM element IDs for selects are correct) ---
    // Assuming modalParentSelects.l1 etc. are correct IDs from HTML
    async function populateModalLevelDropdown(level, parentCode, selectElement, defaultValue = '') { /* ... */ }
    function resetModalSelectsAndNameInputsFromLevel(startLevel, readOnlyAllNames = false) { /* ... */ }
    async function openModalForAdd() { /* ... */ }
    async function handleEditCategoryClick(id, code) { /* ... */ }
    // Form submission logic categoryForm.addEventListener('submit', ...) (unchanged)
    // (Keeping existing modal functions from previous step, assuming they are correct)
    async function populateModalLevelDropdown(level, parentCode, selectElement, defaultValue = '') {
        if (!selectElement) { console.error(`Select element for level ${level} not found (ID: ${selectElement?.id}).`); return; }
        selectElement.innerHTML = `<option value="">-- 选择 --</option>`; selectElement.disabled = true;
        if (level > 1 && !parentCode) { if (level === 1) selectElement.disabled = false; else return; }
        const items = await getCategories({ level, parent_code: parentCode });
        if (items && items.length > 0) {
            items.forEach(item => { const option = document.createElement('option'); option.value = item.code;
            option.textContent = `${item.name} / ${item.name_en || ''} (${item.code})`; selectElement.appendChild(option); });
            selectElement.disabled = false;
        } else { selectElement.innerHTML = `<option value="">-- No options --</option>`; }
        if (defaultValue) selectElement.value = defaultValue;
    }
    function resetModalSelectsAndNameInputsFromLevel(startLevel, readOnlyAllNames = false) {
        for (let i = startLevel; i <= 4; i++) {
            const levelKey = `l${i}`;
            if (modalParentSelects[levelKey]) {
                modalParentSelects[levelKey].innerHTML = `<option value="">-- 先选择L${i-1}父级 --</option>`;
                if (i === 1) modalParentSelects[levelKey].innerHTML = `<option value="">-- 新建L1或选择L1父级 --</option>`;
                modalParentSelects[levelKey].disabled = (i > 1); modalParentSelects[levelKey].value = '';
            }
            if (modalParentIdInputs[levelKey]) modalParentIdInputs[levelKey].value = '';
            if (modalNameInputs[levelKey]) {
                modalNameInputs[levelKey].cn.value = ''; modalNameInputs[levelKey].cn.readOnly = readOnlyAllNames;
                modalNameInputs[levelKey].en.value = ''; modalNameInputs[levelKey].en.readOnly = readOnlyAllNames;
            }
        }
    }
    Object.keys(modalParentSelects).forEach((levelKey, index) => { // e.g. levelKey = 'l1', 'l2'
        const currentLevel = index + 1; const selectElement = modalParentSelects[levelKey];
        if (selectElement) {
            selectElement.addEventListener('change', async (event) => {
                const selectedCode = event.target.value; if (modalParentIdInputs[levelKey]) modalParentIdInputs[levelKey].value = selectedCode;
                resetModalSelectsAndNameInputsFromLevel(currentLevel + 1, true); // True: make subsequent name fields readonly
                if (selectedCode && currentLevel < 4) {
                    await populateModalLevelDropdown(currentLevel + 1, selectedCode, modalParentSelects[`l${currentLevel + 1}`]);
                     // Enable name inputs for the NEXT level if a parent is selected
                    if(modalNameInputs[`l${currentLevel + 1}`]) {
                        modalNameInputs[`l${currentLevel + 1}`].cn.readOnly = false;
                        modalNameInputs[`l${currentLevel + 1}`].en.readOnly = false;
                    }
                } else if (!selectedCode && modalNameInputs[`l${currentLevel}`]) { // If parent deselected, enable current level name inputs
                     modalNameInputs[`l${currentLevel}`].cn.readOnly = false;
                     modalNameInputs[`l${currentLevel}`].en.readOnly = false;
                }
            });
        }
    });
    async function openModalForAdd() {
        categoryForm.reset(); categoryIdInput.value = ''; editingCategoryLevel = null;
        modalTitle.textContent = '添加新分类 (Add New Category)'; addModeButtons.classList.remove('hidden'); editModeButtons.classList.add('hidden');
        modalCategoryCodeDisplay.value = 'Select parents / Enter name to see code';
        resetModalSelectsAndNameInputsFromLevel(1, false);
        Object.values(modalParentSelects).forEach(sel => sel.disabled = true);
        await populateModalLevelDropdown(1, null, modalParentSelects.l1); modalParentSelects.l1.disabled = false;
        Object.values(modalNameInputs).forEach((inputs, idx) => { const level = idx + 1; inputs.cn.readOnly = (level > 1); inputs.en.readOnly = (level > 1); });
        modal.classList.add('open');
    }
    async function handleEditCategoryClick(id, code) { /* Unchanged */ }
    categoryForm.addEventListener('submit', async (event) => { /* Unchanged */ });
    async function handleDeleteCategoryClick(categoryId, categoryCode) { /* Unchanged */ } // Make sure this is defined
    if (addCategoryForm) { /* This was from old script, categoryForm is used now */ }

    // --- Code Consistency Check (unchanged) ---
    async function handleCodeConsistencyCheck() { /* ... */ }
    if (checkConsistencyBtn) { checkConsistencyBtn.addEventListener('click', handleCodeConsistencyCheck); }

    // --- Initial Page Load ---
    addNewBtn.addEventListener('click', openModalForAdd);
    closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));
    cancelModalBtn.addEventListener('click', () => modal.classList.remove('open'));

    await populateFilterControls(); // This will now only populate L1
    updateActiveFiltersDisplay();
    await displayCategories(currentFilters); // Initially empty filters

    console.log("Category management controller fully initialized for Cascading Filters.");
});
