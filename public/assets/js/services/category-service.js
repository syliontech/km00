// In public/assets/js/services/category-service.js
import { supabase } from '../../config/supabase-config.js';

console.log('category-service.js loaded (for Product Management category selector).');

async function getCategories(params = {}) {
    if (!supabase) { console.error('Supabase client not initialized'); return params.code_eq ? null : [];}
    try {
        let query = supabase.from('category').select('id, name, code, level, parent_code, name_en, is_leaf');

        if (params.level !== undefined) { query = query.eq('level', params.level); }

        if (params.hasOwnProperty('parent_code')) {
            query = query.eq('parent_code', params.parent_code);
        } else if (params.parent_code_in && Array.isArray(params.parent_code_in) && params.parent_code_in.length > 0) {
            query = query.in('parent_code', params.parent_code_in);
        } else if (params.hasOwnProperty('parent_code') && params.parent_code === null) {
             query = query.is('parent_code', null);
        }

        if (params.code_eq) { query = query.eq('code', params.code_eq).maybeSingle(); }

        // Add name_like for searching (case-insensitive)
        if (params.name_like && params.name_like.trim() !== "") {
            query = query.ilike('name', `%${params.name_like}%`);
        }
        // Could also add searching for name_en if desired:
        // if (params.name_en_like && params.name_en_like.trim() !== "") {
        //    query = query.ilike('name_en', `%${params.name_en_like}%`);
        // }


        query = query.order('code');
        const { data, error } = await query;

        if (error) {
            if (params.code_eq && error.code === 'PGRST116') return null;
            throw error;
        }
        return data || (params.code_eq ? null : []);
    } catch (error) {
        console.error('Error fetching categories with params:', params, error);
        return params.code_eq ? null : [];
    }
}

async function getCategoryWithAncestry(categoryCode) { /* Unchanged */
    if (!supabase) { console.error('Supabase client not initialized'); return []; }
    const ancestry = []; let currentCode = categoryCode;
    try {
        for (let i = 0; i < 5 && currentCode; i++) {
            const { data: category, error } = await supabase.from('category').select('id, name, code, level, parent_code, name_en, is_leaf').eq('code', currentCode).single();
            if (error) { if (error.code === 'PGRST116') { console.warn(`Cat ${currentCode} not found in ancestry fetch.`); break; } throw error; }
            if (!category) break; ancestry.unshift(category); currentCode = category.parent_code;
        } return ancestry;
    } catch (error) { console.error(`Error fetching ancestry for ${categoryCode}:`, error); return []; }
}

async function getCategoriesForDisplayOrExport(filters = {}, exportAllLeafNodes = false) { /* Unchanged */
    if (!supabase) { console.error('Supabase client not initialized'); return []; }
    try {
        let query = supabase.from('category').select('id, name, code, level, parent_code, name_en, is_leaf');
        if (exportAllLeafNodes) { query = query.eq('level', 4); }
        else {
            let targetLevelToDisplayHierarchyFor = 4;
            if (filters.l4Codes && filters.l4Codes.length > 0) { query = query.in('code', filters.l4Codes); targetLevelToDisplayHierarchyFor = 4;}
            else if (filters.l3Codes && filters.l3Codes.length > 0) { query = query.in('parent_code', filters.l3Codes).eq('level', 4); targetLevelToDisplayHierarchyFor = 4; }
            else if (filters.l2Codes && filters.l2Codes.length > 0) { query = query.in('parent_code', filters.l2Codes).eq('level', 3); targetLevelToDisplayHierarchyFor = 3; }
            else if (filters.l1Codes && filters.l1Codes.length > 0) { query = query.in('parent_code', filters.l1Codes).eq('level', 2); targetLevelToDisplayHierarchyFor = 2; }
            else { query = query.eq('level', targetLevelToDisplayHierarchyFor); }
        }
        query = query.order('code');
        const { data: targetCategories, error: fetchError } = await query;
        if (fetchError) throw fetchError; if (!targetCategories || targetCategories.length === 0) return [];
        const results = [];
        for (const cat of targetCategories) {
            const ancestry = await getCategoryWithAncestry(cat.code);
            const hierarchy = { l1: null, l2: null, l3: null, l4: null, l5: null }; let finalCategoryInPath = null;
            ancestry.forEach(a => { if (a.level >=1 && a.level <=5) hierarchy[`l${a.level}`] = a; if (a.code === cat.code) finalCategoryInPath = a; });
            if (!finalCategoryInPath) finalCategoryInPath = cat;
            results.push({
                l1Name: hierarchy.l1 ? hierarchy.l1.name : 'N/A', l1Code: hierarchy.l1 ? hierarchy.l1.code : 'N/A', l1NameEn: hierarchy.l1 ? hierarchy.l1.name_en || '' : '',
                l2Name: hierarchy.l2 ? hierarchy.l2.name : 'N/A', l2Code: hierarchy.l2 ? hierarchy.l2.code : 'N/A', l2NameEn: hierarchy.l2 ? hierarchy.l2.name_en || '' : '',
                l3Name: hierarchy.l3 ? hierarchy.l3.name : 'N/A', l3Code: hierarchy.l3 ? hierarchy.l3.code : 'N/A', l3NameEn: hierarchy.l3 ? hierarchy.l3.name_en || '' : '',
                l4Name: hierarchy.l4 ? hierarchy.l4.name : 'N/A', l4Code: hierarchy.l4 ? hierarchy.l4.code : 'N/A', l4NameEn: hierarchy.l4 ? hierarchy.l4.name_en || '' : '',
                finalCategoryName: finalCategoryInPath.name, finalCategoryNameEn: finalCategoryInPath.name_en || '',
                finalCategoryCode: finalCategoryInPath.code, finalCategoryLevel: finalCategoryInPath.level,
                isLeaf: finalCategoryInPath.is_leaf, categoryId: finalCategoryInPath.id
            });
        } return results;
    } catch (error) { console.error('Error fetching categories for display/export:', error); return []; }
}

async function addCategory(categoryData) { /* Unchanged */ }
async function updateCategory(categoryId, updateData) { /* Unchanged */ }
async function deleteCategory(categoryId, categoryCode) { /* Unchanged */ }
async function getAllCategories() { /* Unchanged */ }

export {
    getCategories,
    getCategoryWithAncestry,
    getCategoriesForDisplayOrExport,
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories
};
