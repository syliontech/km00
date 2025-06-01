// E:\product-system\new-structure\assets\js\main-app.js

// Main Application Logic
const App = (function() {

    // --- Right Panel UI Logic (Tabs & Overlay) ---
    function setupRightPanelUI() {
        const tabButtons = document.querySelectorAll('#configTabs .tab-button');
        const tabContents = document.querySelectorAll('#configTabsContentContainer .tab-content');
        const configIdleOverlay = document.getElementById('configIdleOverlay');
        const configActiveContent = document.getElementById('configActiveContent');
        const startNewConfigBtn = document.getElementById('startNewConfigBtn');
        const newConfigBtnActive = document.getElementById('newConfigBtn_active');

        function showConfigActiveArea() {
            if (configIdleOverlay) configIdleOverlay.classList.add('hidden');
            if (configActiveContent) configActiveContent.classList.remove('hidden');
            // Activate the first tab by default when switching to active content
            if (tabButtons.length > 0 && tabButtons[0].offsetParent !== null) { // Check if visible
                tabButtons[0].click(); 
            }
        }

        function showConfigIdleArea() {
            if (configIdleOverlay) configIdleOverlay.classList.remove('hidden');
            if (configActiveContent) configActiveContent.classList.add('hidden');
        }

        if(startNewConfigBtn) {
            startNewConfigBtn.addEventListener('click', showConfigActiveArea);
        }
        if(newConfigBtnActive) { 
            newConfigBtnActive.addEventListener('click', function() {
                showConfigActiveArea(); 
            });
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTabId = button.dataset.tabTarget;
                
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
                    btn.classList.add('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
                    btn.setAttribute('aria-selected', 'false');
                });
                button.classList.add('active', 'border-blue-500', 'text-blue-600');
                button.classList.remove('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
                button.setAttribute('aria-selected', 'true');

                tabContents.forEach(content => {
                    if (content.id === targetTabId) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
            });
        });

        // Initial state for right panel
        if (tabButtons.length > 0) {
             tabButtons[0].classList.add('active', 'border-blue-500', 'text-blue-600');
             tabButtons[0].classList.remove('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
             tabButtons[0].setAttribute('aria-selected', 'true');
             if(tabContents.length > 0) {
                tabContents.forEach(tc => tc.classList.add('hidden'));
                // Do not show content if overlay is active initially
             }
        }
        showConfigIdleArea(); // Ensure idle overlay is shown initially

        // --- Kit Tab Logic (based on product attribute) ---
        const productAttributeDisplay = document.getElementById('productAttribute');
        const kitTabStatus = document.getElementById('kitTabStatus');
        const kitProductSpecificContent = document.getElementById('kitProductSpecificContent');
        const singleProductKitMessage = document.getElementById('singleProductKitMessage');
        const kitsTabButton = Array.from(tabButtons).find(btn => btn.dataset.tabTarget === 'kitsContent');

        // This logic might be better placed in a product display module later
        if (productAttributeDisplay && productAttributeDisplay.textContent.includes('组套')) {
            if(kitTabStatus) kitTabStatus.textContent = '(产品属性为组套时激活闭环)';
            if(singleProductKitMessage) singleProductKitMessage.classList.add('hidden');
            if(kitProductSpecificContent) kitProductSpecificContent.classList.remove('hidden');
            if(kitsTabButton) kitsTabButton.disabled = false;
        } else {
            if(kitTabStatus) kitTabStatus.textContent = '(产品属性为单件 - 组套通常禁用)';
            if(singleProductKitMessage) singleProductKitMessage.classList.remove('hidden');
            if(kitProductSpecificContent) kitProductSpecificContent.classList.add('hidden');
        }
        console.log('Right Panel UI setup complete.');
    }

    // --- Module Initialization ---
    function initModules() {
        // Example: Initialize modules. Ensure their JS files are loaded before this.
        // For now, CategorySearch is globally available due to script tag order.
        if (typeof CategorySearch !== 'undefined' && CategorySearch.init) {
            CategorySearch.init();
        } else {
            console.warn('CategorySearch module not found or init method missing.');
        }

        // Placeholder for other modules
        // if (typeof ProductSearch !== 'undefined' && ProductSearch.init) ProductSearch.init();
        // if (typeof CustomerSupplierSearch !== 'undefined' && CustomerSupplierSearch.init) CustomerSupplierSearch.init();
        // if (typeof ProductDisplay !== 'undefined' && ProductDisplay.init) ProductDisplay.init();
        // if (typeof ProductConfig !== 'undefined' && ProductConfig.init) ProductConfig.init();
        console.log('All modules initialized (or attempted).');
    }

    // --- Public API for App ---
    function init() {
        console.log('Main App Initializing...');
        setupRightPanelUI();
        initModules();
        console.log('Main App Initialized.');
    }

    return {
        init: init
    };

})();

// --- Initialize the App when DOM is ready ---
document.addEventListener('DOMContentLoaded', App.init);
