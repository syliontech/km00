// JavaScript Service for New Category Management (v2) - Interacts with Backend (e.g., Supabase)
console.log('category-v2-service.js loaded');

// Assuming supabase client is initialized in supabase-config.js and available globally or imported
// const { supabase } = window; // Or however you access it

const CategoryV2Service = (() => {

    const CATEGORY_TABLE = 'category'; // Matches your new table name

    // Helper to generate a unique 1-character ID (A-Z, 0-9) for a new level
    // This needs to be robust: check existing siblings to find next available char.
    async function generateLevelChar(parentCode, level) {
        // This is a placeholder. Actual implementation needs to query existing codes.
        // For example, if parentCode = 'A' and level = 2, find all codes like 'AX'
        // and pick the next available character for X.
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        // Simplified: pick a random char. THIS IS NOT ROBUST FOR PRODUCTION.
        // A real implementation would query existing sibling codes and find the next available char.
        // Or, use a sequence / auto-incrementing number converted to base36 for the suffix.
        return chars.charAt(Math.floor(Math.random() * chars.length)); 
    }

    // Helper to generate a unique 1 or 2-character random variant suffix for L5
    async function generateVariantSuffix(level4Code) {
        // Placeholder: Generate a 2-char random alphanumeric string.
        // Needs to check for uniqueness against existing L5 items under level4Code.
        let suffix = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        // In a real scenario, you'd loop and check DB until unique suffix is found.
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        // const { data, error } = await supabase.from(CATEGORY_TABLE).select('code').eq('code', level4Code + suffix).maybeSingle();
        // if (data) { /* retry or increment */ }
        return suffix; 
    }

    // Finds or creates a category node for a given level
    // Returns the category object (including its code)
    async function findOrCreateNode(name, parentCode, level) {
        if (!name) {
            throw new Error(`Name is required for level ${level} node with parent code ${parentCode}`);
        }
        
        let existingNode = null;

        // Build the query step by step to ensure proper chaining
        let query = supabase.from(CATEGORY_TABLE)
            .select('*')
            .eq('name', name)
            .eq('level', level);
        
        if (parentCode) {
            query = query.eq('parent_code', parentCode);
        } else {
            query = query.is('parent_code', null);
        }
        
        const { data: foundNodes, error: findError } = await query.limit(1);

        if (findError) {
            console.error(`Error finding node ${name} (L${level}):`, findError);
            throw findError;
        }

        if (foundNodes && foundNodes.length > 0) {
            existingNode = foundNodes[0];
        } else {
            // Node not found, create it
            let newCode;
            const levelChar = await generateLevelChar(parentCode, level); // Simplified ID generation
            if (parentCode) {
                newCode = parentCode + levelChar;
            } else {
                newCode = levelChar; // For L1
            }

            // Ensure newCode is unique (retry logic might be needed for generateLevelChar)
            // This is simplified; robust unique code generation is complex.

            const { data: newNodeData, error: createError } = await supabase
                .from(CATEGORY_TABLE)
                .insert({
                    name: name,
                    code: newCode,
                    parent_code: parentCode,
                    level: level,
                    is_leaf: false // Only L5 are leaves initially
                })
                .select()
                .single();

            if (createError) {
                console.error(`Error creating node ${name} (L${level}):`, createError);
                // Handle potential duplicate code error here if generateLevelChar isn't perfect
                throw createError;
            }
            existingNode = newNodeData;
        }
        return existingNode;
    }

    // Main function to save a new L5 item and its hierarchy
    async function saveItem(itemData) {
        // itemData: { level1Name, level2Name, level3Name, level4Name, level5ItemName }
        try {
            console.log('Saving item with data:', itemData);
            
            // Ensure all required fields are present
            if (!itemData.level1Name || !itemData.level2Name || !itemData.level3Name || !itemData.level4Name || !itemData.level5ItemName) {
                throw new Error('All level names (L1-L5) are required');
            }
            
            // Create or get L1 node
            const l1Node = await findOrCreateNode(itemData.level1Name, null, 1);
            console.log('L1 Node:', l1Node);
            
            // Create or get L2 node
            const l2Node = await findOrCreateNode(itemData.level2Name, l1Node.code, 2);
            console.log('L2 Node:', l2Node);
            
            // Create or get L3 node
            const l3Node = await findOrCreateNode(itemData.level3Name, l2Node.code, 3);
            console.log('L3 Node:', l3Node);
            
            // Create or get L4 node
            const l4Node = await findOrCreateNode(itemData.level4Name, l3Node.code, 4);
            console.log('L4 Node:', l4Node);

            // Generate a unique variant suffix for L5
            const variantSuffix = await generateVariantSuffix(l4Node.code);
            const l5Code = l4Node.code + variantSuffix;
            console.log('Generated L5 code:', l5Code);

            console.log('Creating L5 item with name:', itemData.level5ItemName, 'and code:', l5Code);
            
            const l5ItemData = {
                name: itemData.level5ItemName, // Ensure this is the correct field name
                code: l5Code,
                parent_code: l4Node.code,
                level: 5,
                is_leaf: true
            };
            
            console.log('L5 Item Data:', l5ItemData);
            
            const { data: l5Item, error: l5Error } = await supabase
                .from(CATEGORY_TABLE)
                .insert([l5ItemData])
                .select()
                .single();

            if (l5Error) {
                console.error('Error creating L5 item:', l5Error);
                throw l5Error;
            }
            
            console.log('L5 item created:', l5Item);
            return l5Item;

        } catch (error) {
            console.error('Failed to save item and its hierarchy:', error);
            // Potentially show user-friendly error message
            return null;
        }
    }

    // Fetch categories with specific fields
    async function getCategories(filters = {}) {
        // Select specific fields to ensure we have all necessary data
        let query = supabase.from(CATEGORY_TABLE).select('code, name, ename, parent_code, level, is_leaf, category_pkey');
        
        if (filters.parent_code) {
            query = query.eq('parent_code', filters.parent_code);
        } else if (filters.level === 1) { // Fetch top-level if no parent specified
            query = query.is('parent_code', null).eq('level', 1);
        }
        
        // Add other filters
        if (filters.level) {
            query = query.eq('level', filters.level);
        }
        if (filters.code) {
            query = query.eq('code', filters.code);
        }
        
        // Order by code
        query = query.order('code');

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
        return data;
    }

    // Save a single category at any level
    async function saveCategory(categoryData) {
        try {
            console.log('Saving category with data:', categoryData);
            
            // Validate required fields
            if (!categoryData.name || typeof categoryData.level === 'undefined') {
                throw new Error('Category name and level are required');
            }
            
            // For levels 2-4, parent_code is required
            if (categoryData.level > 1 && !categoryData.parent_code) {
                throw new Error('Parent code is required for this category level');
            }
            
            // Check if category with same name and parent already exists
            let query = supabase
                .from(CATEGORY_TABLE)
                .select('*')
                .eq('name', categoryData.name)
                .eq('level', categoryData.level);
                
            if (categoryData.parent_code) {
                query = query.eq('parent_code', categoryData.parent_code);
            } else {
                query = query.is('parent_code', null);
            }
            
            const { data: existingCategories, error: findError } = await query;
            
            if (findError) {
                console.error('Error checking for existing category:', findError);
                throw findError;
            }
            
            // If category already exists, return it
            if (existingCategories && existingCategories.length > 0) {
                console.log('Category already exists:', existingCategories[0]);
                return existingCategories[0];
            }
            
            // Generate code for the new category
            let newCode;
            if (categoryData.level === 1) {
                // For L1, generate a single character code (A-Z, 0-9)
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                newCode = chars.charAt(Math.floor(Math.random() * chars.length));
            } else {
                // For L2-L4, generate a single character suffix and append to parent code
                const parentCode = categoryData.parent_code;
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let isCodeUnique = false;
                let attempts = 0;
                const maxAttempts = 10;
                
                // Try to find a unique code
                while (!isCodeUnique && attempts < maxAttempts) {
                    const suffix = chars.charAt(Math.floor(Math.random() * chars.length));
                    newCode = parentCode + suffix;
                    
                    // Check if code already exists
                    const { data: existingCode, error: codeError } = await supabase
                        .from(CATEGORY_TABLE)
                        .select('code')
                        .eq('code', newCode)
                        .maybeSingle();
                        
                    if (codeError) {
                        console.error('Error checking code uniqueness:', codeError);
                        throw codeError;
                    }
                    
                    if (!existingCode) {
                        isCodeUnique = true;
                    }
                    
                    attempts++;
                }
                
                if (!isCodeUnique) {
                    throw new Error('Could not generate a unique code after multiple attempts');
                }
            }
            
            // Create the new category
            const newCategory = {
                name: categoryData.name,
                code: newCode,
                parent_code: categoryData.parent_code || null,
                level: categoryData.level,
                is_leaf: categoryData.level === 5 // Only L5 items are leaves
            };
            
            console.log('Creating new category:', newCategory);
            
            const { data: createdCategory, error: createError } = await supabase
                .from(CATEGORY_TABLE)
                .insert([newCategory])
                .select()
                .single();
                
            if (createError) {
                console.error('Error creating category:', createError);
                throw createError;
            }
            
            console.log('Category created successfully:', createdCategory);
            return createdCategory;
            
        } catch (error) {
            console.error('Failed to save category:', error);
            throw error; // Re-throw to be handled by the caller
        }
    }

    // Public API
    return {
        saveItem,
        getCategories,
        saveCategory,
        findOrCreateNode // Exposing for potential direct use or testing
    };

})();

// Example usage (would be in app.js):
// async function handleFormSubmit() {
//     const itemData = { /* collect from form */ };
//     const newItem = await CategoryV2Service.saveItem(itemData);
//     if (newItem) {
//         // Refresh UI
//     }
// }

// async function loadTopLevelCategories() {
//     const topLevel = await CategoryV2Service.getCategories({ level: 1 });
//     console.log('Top Level Categories:', topLevel);
//     // Populate filter dropdowns, etc.
// }

