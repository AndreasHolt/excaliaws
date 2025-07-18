// inject.js - Simple exact search without Fuse.js
console.log('🚀 AWS Extension inject.js loaded!');

(async () => {
    try {
        // Wait for page to load
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });

        console.log('✅ DOM ready');

        // Load icon packs configuration
        console.log('📚 Loading icon packs configuration...');
        const configResponse = await fetch(chrome.runtime.getURL('icon-packs-config.json'));
        
        if (!configResponse.ok) {
            console.error('❌ Failed to load icon packs configuration');
            return;
        }
        
        const config = await configResponse.json();
        const enabledPacks = config.packs.filter(pack => pack.enabled).sort((a, b) => a.priority - b.priority);
        
        console.log('🎯 Found', enabledPacks.length, 'enabled icon packs');
        
        // Load all enabled icon packs
        const allItems = [];
        for (const packConfig of enabledPacks) {
            try {
                console.log(`📦 Loading ${packConfig.name}...`);
                const packResponse = await fetch(chrome.runtime.getURL(packConfig.file));
                
                if (!packResponse.ok) {
                    console.warn(`⚠️ Failed to load ${packConfig.name}`);
                    continue;
                }
                
                const iconPack = await packResponse.json();
                
                // Convert pack icons to search items
                const packItems = Object.entries(iconPack.icons).map(([key, iconData]) => ({
                    key: key,
                    name: iconData.name,
                    keywords: iconData.keywords,
                    category: iconData.category,
                    description: iconData.description,
                    elements: iconData.clipboardData.elements,
                    pack: {
                        id: packConfig.id,
                        name: packConfig.name
                    }
                }));
                
                allItems.push(...packItems);
                console.log(`✅ Loaded ${packItems.length} icons from ${packConfig.name}`);
                
            } catch (error) {
                console.error(`❌ Error loading ${packConfig.name}:`, error);
            }
        }
        
        const items = allItems;
        console.log('📊 Total icons loaded:', items.length);
        console.log('🎨 Categories:', new Set(items.map(icon => icon.category)).size);
        console.log('📦 Icon packs:', new Set(items.map(icon => icon.pack.name)).size);
        
        console.log('✅ Items created for search:', items.length);

        // Settings management
        const defaultSettings = {
            searchCategories: false,
            searchKeywords: true,
            enabledPacks: enabledPacks.map(pack => pack.id)
        };
        
        let currentSettings = { ...defaultSettings };
        
        // Load settings from storage
        async function loadSettings() {
            try {
                const result = await chrome.storage.sync.get(['excaliawsSettings']);
                if (result.excaliawsSettings) {
                    currentSettings = { ...defaultSettings, ...result.excaliawsSettings };
                }
                console.log('📋 Settings loaded:', currentSettings);
            } catch (error) {
                console.log('⚠️ Using default settings:', error);
            }
        }
        
        // Save settings to storage
        async function saveSettings() {
            try {
                await chrome.storage.sync.set({ excaliawsSettings: currentSettings });
                console.log('💾 Settings saved');
            } catch (error) {
                console.error('❌ Failed to save settings:', error);
            }
        }
        
        // Load initial settings
        await loadSettings();

        let selectedIndex = -1; // Track which result is currently selected


        // Enhanced search function with settings-aware filtering
        function searchItems(query) {
            if (!query.trim()) return [];
            
            const lowerQuery = query.toLowerCase();
            
            // Filter by enabled packs first
            const filteredItems = items.filter(item => 
                currentSettings.enabledPacks.includes(item.pack.id)
            );
            
            return filteredItems.filter(item => {
                // Always search in name
                if (item.name.toLowerCase().includes(lowerQuery)) return true;
                
                // Search in keywords if enabled
                if (currentSettings.searchKeywords && 
                    item.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
                    return true;
                }
                
                // Search in category if enabled
                if (currentSettings.searchCategories && 
                    item.category.toLowerCase().includes(lowerQuery)) {
                    return true;
                }
                
                return false;
            }).map(item => ({ item })); // Match Fuse.js structure
        }

        // Create search interface
        const searchContainer = document.createElement('div');
        searchContainer.id = 'aws-search-container';
        searchContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 999999;
    background: #31303b;
    border: 1px solid #4a4a4a;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: none;
    width: 500px;
    max-width: 90vw;
    font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

                
        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search icons...';
        searchInput.style.cssText = `
            flex: 1;
            padding: 16px 50px 16px 50px;
            border: none;
            border-radius: 8px 8px 0 0;
            font-size: 16px;
            outline: none;
            box-sizing: border-box;
            background: #31303b;
            color: #e3e3e8;
            font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(184, 184, 184)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path><path d="M21 21l-6 -6"></path></svg>');
            background-repeat: no-repeat;
            background-position: 16px center;
            background-size: 20px 20px;
        `;

        const settingsButton = document.createElement('button');
        settingsButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            z-index: 10;
        `;
        
        settingsButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(184, 184, 184)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        `;
        
        settingsButton.addEventListener('mouseenter', () => {
            settingsButton.style.backgroundColor = '#404040';
        });
        
        settingsButton.addEventListener('mouseleave', () => {
            settingsButton.style.backgroundColor = 'transparent';
        });

        inputWrapper.appendChild(searchInput);
        inputWrapper.appendChild(settingsButton);

        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            width: 300px;
            background: #31303b;
            border: 1px solid #4a4a4a;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            padding: 16px;
            display: none;
            z-index: 1000;
            font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #e3e3e8;
        `;

        function createSettingsContent() {
            settingsPanel.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Search Settings</h3>
                    
                    <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" ${currentSettings.searchKeywords ? 'checked' : ''} 
                               id="searchKeywords" style="margin-right: 8px;">
                        <span>Search in keywords</span>
                    </label>
                    
                    <label style="display: flex; align-items: center; margin-bottom: 16px; cursor: pointer;">
                        <input type="checkbox" ${currentSettings.searchCategories ? 'checked' : ''} 
                               id="searchCategories" style="margin-right: 8px;">
                        <span>Search in categories</span>
                    </label>
                </div>
                
                <div>
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Icon Packs</h3>
                    ${enabledPacks.map(pack => `
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" ${currentSettings.enabledPacks.includes(pack.id) ? 'checked' : ''} 
                                   data-pack-id="${pack.id}" class="pack-toggle" style="margin-right: 8px;">
                            <span>${pack.name}</span>
                        </label>
                    `).join('')}
                </div>
                
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #4a4a4a;">
                    <button id="resetSettings" style="
                        background: #404040;
                        border: none;
                        color: #e3e3e8;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-family: inherit;
                    ">Reset to defaults</button>
                </div>
            `;

            // Add event listeners
            const searchKeywordsToggle = settingsPanel.querySelector('#searchKeywords');
            const searchCategoriesToggle = settingsPanel.querySelector('#searchCategories');
            const packToggles = settingsPanel.querySelectorAll('.pack-toggle');
            const resetButton = settingsPanel.querySelector('#resetSettings');

            searchKeywordsToggle.addEventListener('change', (e) => {
                currentSettings.searchKeywords = e.target.checked;
                saveSettings();
            });

            searchCategoriesToggle.addEventListener('change', (e) => {
                currentSettings.searchCategories = e.target.checked;
                saveSettings();
            });

            packToggles.forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const packId = e.target.dataset.packId;
                    if (e.target.checked) {
                        if (!currentSettings.enabledPacks.includes(packId)) {
                            currentSettings.enabledPacks.push(packId);
                        }
                    } else {
                        currentSettings.enabledPacks = currentSettings.enabledPacks.filter(id => id !== packId);
                    }
                    saveSettings();
                });
            });

            resetButton.addEventListener('click', () => {
                currentSettings = { ...defaultSettings };
                saveSettings();
                createSettingsContent(); // Refresh the UI
            });
        }

        createSettingsContent();
        
        // Settings button click handler
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = settingsPanel.style.display === 'block';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
        });

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
                settingsPanel.style.display = 'none';
            }
        });

        searchContainer.appendChild(settingsPanel);
        
        const resultsContainer = document.createElement('div');
        resultsContainer.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    border-top: 1px solid #4a4a4a;
    background: #31303b;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;
                
        searchContainer.appendChild(inputWrapper);
        searchContainer.appendChild(resultsContainer);
        document.body.appendChild(searchContainer);

        // Search functionality
        let currentResults = [];

        function showResults(results) {
            resultsContainer.innerHTML = '';
            currentResults = results;
            selectedIndex = -1; // Reset selection when new results are shown
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div style="padding: 16px; color: #b8b8b8; font-family: Assistant;">No results found</div>';
                return;
            }
        
            results.slice(0, 10).forEach((result, index) => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.index = index; // Store index for easy reference
                item.style.cssText = `
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #4a4a4a;
                    color: #e3e3e8;
                    font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    font-size: 14px;
                    transition: background-color 0.1s ease;
                    background: transparent;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                `;
                
                // Main icon name
                const nameElement = document.createElement('div');
                nameElement.style.cssText = `
                    font-weight: 500;
                    font-size: 14px;
                `;
                nameElement.textContent = result.item.name;
                
                // Category and pack info
                const metaElement = document.createElement('div');
                metaElement.style.cssText = `
                    font-size: 12px;
                    color: #b8b8b8;
                    opacity: 0.8;
                `;
                metaElement.textContent = `${result.item.category} • ${result.item.pack.name}`;
                
                item.appendChild(nameElement);
                item.appendChild(metaElement);
                item.addEventListener('click', () => insertIcon(result.item));
                
                // Updated hover handling that respects keyboard selection
                item.addEventListener('mouseenter', () => {
                    // Only change hover state if not keyboard navigating
                    if (selectedIndex === -1) {
                        clearAllSelections();
                        item.style.background = '#404040';
                    }
                });
                
                item.addEventListener('mouseleave', () => {
                    // Only clear hover if not keyboard selected
                    if (selectedIndex !== index) {
                        item.style.background = 'transparent';
                    }
                });
                
                resultsContainer.appendChild(item);
            });
        }

        function clearAllSelections() {
            document.querySelectorAll('.search-result-item').forEach(el => {
                el.style.background = 'transparent';
            });
        }
        
        function updateSelection(newIndex) {
            const items = document.querySelectorAll('.search-result-item');
            const maxIndex = items.length - 1;
            
            // Clear all selections first
            clearAllSelections();
            
            // Handle wrapping
            if (newIndex < 0) {
                selectedIndex = maxIndex;
            } else if (newIndex > maxIndex) {
                selectedIndex = 0;
            } else {
                selectedIndex = newIndex;
            }
            
            // Highlight the selected item
            if (selectedIndex >= 0 && items[selectedIndex]) {
                items[selectedIndex].style.background = '#404040';
                
                // Scroll into view if needed
                items[selectedIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
        
        function selectCurrentItem() {
            if (selectedIndex >= 0 && currentResults[selectedIndex]) {
                insertIcon(currentResults[selectedIndex].item);
                hideSearch();
            }
        }
        
        

        async function insertIcon(item) {
            console.log('🎯 Attempting to insert icon:', item.name);
            console.log('Icon elements:', item.elements);
            
            // Method 1: Try to find React components and manipulate state
            const success = await tryReactStateInsertion(item);
            if (success) return;
            
            // Method 2: Try clipboard with proper Excalidraw format
            await tryClipboardInsertion(item);
        }
        
        async function tryReactStateInsertion(item) {
            console.log('⚛️ Trying React state insertion...');
            
            // Look for React fiber on the canvas or main container
            const canvas = document.querySelector('canvas');
            const mainContainer = document.querySelector('.excalidraw') || 
                                 document.querySelector('[class*="excalidraw"]') ||
                                 document.querySelector('main') ||
                                 document.body;
            
            const elements = [canvas, mainContainer, document.body];
            
            for (const element of elements) {
                if (!element) continue;
                
                // Look for React fiber keys
                const reactKeys = Object.keys(element).filter(key => 
                    key.startsWith('__reactFiber') || 
                    key.startsWith('__reactInternalInstance') ||
                    key.startsWith('_reactInternalFiber')
                );
                
                if (reactKeys.length > 0) {
                    console.log('⚛️ Found React fiber on', element.tagName);
                    
                    try {
                        // Try to access the React component and its state
                        const reactKey = reactKeys[0];
                        const fiber = element[reactKey];
                        
                        if (fiber && fiber.return) {
                            console.log('⚛️ Found React fiber with return');
                            
                            // Try to trigger a state update
                            const stateNode = findExcalidrawStateNode(fiber);
                            if (stateNode) {
                                console.log('⚛️ Found Excalidraw state node');
                                return await insertViaStateNode(stateNode, item);
                            }
                        }
                    } catch (error) {
                        console.log('❌ React state insertion failed:', error);
                    }
                }
            }
            
            return false;
        }
        
        function findExcalidrawStateNode(fiber, depth = 0) {
            if (depth > 20) return null; // Prevent infinite loops
            
            try {
                // Look for state node with Excalidraw-like properties
                if (fiber.stateNode && typeof fiber.stateNode === 'object') {
                    const stateNode = fiber.stateNode;
                    
                    // Check if this looks like an Excalidraw component
                    if (stateNode.state && (
                        stateNode.state.elements || 
                        stateNode.state.appState ||
                        Object.keys(stateNode.state).some(key => key.includes('excalidraw'))
                    )) {
                        return stateNode;
                    }
                }
                
                // Check child fibers
                if (fiber.child) {
                    const result = findExcalidrawStateNode(fiber.child, depth + 1);
                    if (result) return result;
                }
                
                // Check sibling fibers
                if (fiber.sibling) {
                    const result = findExcalidrawStateNode(fiber.sibling, depth + 1);
                    if (result) return result;
                }
                
                // Check parent fiber
                if (fiber.return && depth < 10) {
                    const result = findExcalidrawStateNode(fiber.return, depth + 1);
                    if (result) return result;
                }
            } catch (error) {
                // Ignore errors and continue searching
            }
            
            return null;
        }
        
        async function insertViaStateNode(stateNode, item) {
            console.log('🎯 Attempting insertion via state node');
            
            try {
                // Get current elements
                const currentElements = stateNode.state.elements || [];
                
                // Position new elements at center
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                // Prepare new elements
                const newElements = item.elements.map(element => ({
                    ...element,
                    id: generateRandomId(),
                    x: centerX + (element.x || 0) - 100,
                    y: centerY + (element.y || 0) - 100,
                    isDeleted: false,
                    seed: Math.floor(Math.random() * 1000000)
                }));
                
                // Update state
                stateNode.setState({
                    elements: [...currentElements, ...newElements]
                });
                
                console.log('✅ Successfully inserted via state node');
                showFeedback(`Inserted: ${item.name}`);
                return true;
                
            } catch (error) {
                console.log('❌ State node insertion failed:', error);
                return false;
            }
        }
        
        async function tryClipboardInsertion(item) {
            console.log('📋 Trying clipboard insertion...');
            
            try {
                // Create proper Excalidraw clipboard format
                const clipboardData = {
                    type: 'excalidraw/clipboard',
                    elements: item.elements.map(element => ({
                        ...element,
                        id: generateRandomId(),
                        seed: Math.floor(Math.random() * 1000000),
                        isDeleted: false
                    }))
                };
                
                // Try to copy to clipboard
                await navigator.clipboard.writeText(JSON.stringify(clipboardData));
                
                console.log('📋 Copied to clipboard');
                
                // Hide search first to ensure canvas can be focused
                hideSearch();
                
                // Try multiple selectors to find the canvas/excalidraw container
                const focusTargets = [
                    'canvas',
                    '.excalidraw-canvas',
                    '.excalidraw',
                    '[class*="excalidraw"]',
                    'main',
                    '.canvas-container',
                    '[role="img"]'
                ];
                
                let focusElement = null;
                
                for (const selector of focusTargets) {
                    const element = document.querySelector(selector);
                    if (element) {
                        focusElement = element;
                        console.log('🎯 Found focus target:', selector);
                        break;
                    }
                }
                
                if (focusElement) {
                    try {
                        // Set tabindex first if needed
                        if (!focusElement.hasAttribute('tabindex')) {
                            focusElement.setAttribute('tabindex', '-1');
                        }
                        
                        // Focus the element
                        focusElement.focus();
                        
                        // Simulate click for canvas activation
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        focusElement.dispatchEvent(clickEvent);
                        
                        console.log('✅ Canvas focused successfully');
                        
                        // Try paste event first (more direct)
                        const clipboardEvent = new ClipboardEvent('paste', {
                            clipboardData: new DataTransfer(),
                            bubbles: true,
                            cancelable: true
                        });
                        
                        clipboardEvent.clipboardData.setData('text/plain', JSON.stringify(clipboardData));
                        
                        const pasteHandled = focusElement.dispatchEvent(clipboardEvent);
                        
                        if (!pasteHandled) {
                            // If paste event wasn't handled, try keydown as fallback
                            console.log('📋 Trying keydown fallback...');
                            const pasteEvent = new KeyboardEvent('keydown', {
                                key: 'v',
                                code: 'KeyV',
                                ctrlKey: true,
                                bubbles: true,
                                cancelable: true
                            });
                            
                            focusElement.dispatchEvent(pasteEvent);
                        }
                        
                        console.log('⌨️ Paste operation completed');
                        showFeedback(`Inserted: ${item.name}`);
                        
                    } catch (error) {
                        console.log('❌ Focus/paste failed:', error);
                        showFeedback(`Copied ${item.name} to clipboard - Click on canvas and press Ctrl+V to paste`);
                    }
                } else {
                    console.log('❌ Could not find canvas to focus');
                    showFeedback(`Copied ${item.name} to clipboard - Click on canvas and press Ctrl+V to paste`);
                }
                
            } catch (error) {
                console.log('❌ Clipboard insertion failed:', error);
                showFeedback(`Error: ${error.message}`);
            }
        }
        
        
        
        
        function generateRandomId() {
            return Math.random().toString(36).substr(2, 9);
        }

         

        function showFeedback(message) {
            const feedback = document.createElement('div');
            feedback.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: #31303b;
                color: #e3e3e8;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 1000000;
                font-size: 14px;
                font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                border: 1px solid #4a4a4a;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            `;
            feedback.textContent = message;
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 3000);
        }
        

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query) {
                const results = searchItems(query);
                console.log('🔍 Search results for "' + query + '":', results.length);
                showResults(results);
            } else {
                resultsContainer.innerHTML = '';
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    updateSelection(selectedIndex + 1);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    updateSelection(selectedIndex - 1);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                        // Use keyboard selected item
                        selectCurrentItem();
                    } else if (currentResults.length > 0) {
                        // Use first result if none selected
                        insertIcon(currentResults[0].item);
                        hideSearch();
                    }
                    break;
                    
                case 'Escape':
                    hideSearch();
                    break;
                    
                case 'Tab':
                    // Optional: Tab also selects like Enter
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        selectCurrentItem();
                    }
                    break;
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            selectedIndex = -1; // Reset selection when typing
            
            if (query) {
                const results = searchItems(query);
                console.log('🔍 Search results for "' + query + '":', results.length);
                showResults(results);
            } else {
                resultsContainer.innerHTML = '';
                currentResults = [];
            }
        });
        
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = '#5b9bd5';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = 'transparent';
        });

        function showSearch() {
            console.log('📦 Showing search');
            searchContainer.style.display = 'block';
            searchInput.focus();
            searchInput.select();
        }

        function hideSearch() {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            resultsContainer.innerHTML = '';
            selectedIndex = -1; // Reset selection
            currentResults = [];
            
            // Remove focus from search input
            searchInput.blur();
        }
        
        

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                hideSearch();
            }
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                showSearch();
            }
        });

        // Extension button handler
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📩 Message received:', message);
            
            if (message?.cmd === 'toggle-search') {
                showSearch();
                sendResponse({status: 'success'});
            }
            
            return true;
        });

        console.log('🎉 AWS Extension loaded successfully!');
        console.log('💡 Usage: Click extension button or press Cmd/Ctrl+K');
        console.log('🔍 Try searching for: EC2, S3, Lambda, RDS');

    } catch (error) {
        console.error('❌ Error initializing AWS Extension:', error);
    }
})();