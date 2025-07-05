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

        // Load our libraries
        console.log('📚 Loading AWS library...');
        const [libResponse, namesResponse] = await Promise.all([
            fetch(chrome.runtime.getURL('aws-icon-pack.excalidrawlib')),
            fetch(chrome.runtime.getURL('aws-index.json'))
        ]);
        
        if (!libResponse.ok || !namesResponse.ok) {
            console.error('❌ Failed to load library files');
            return;
        }
        
        const lib = await libResponse.json();
        const names = await namesResponse.json();
        
        console.log('📊 Library loaded:', lib.libraryItems?.length || 0, 'items');
        console.log('🏷️ Names loaded:', names.length, 'names');
        
        // Create items for search
                // Create items for search - extract elements from clipboard format
                const items = lib.libraryItems.map((clipboardItem, i) => ({ 
                    name: names[i] ?? `item-${i}`, 
                    elements: clipboardItem.elements  // Extract elements from clipboard wrapper
                }));
        
        console.log('✅ Items created for search:', items.length);

        // Simple search function
        function searchItems(query) {
            if (!query.trim()) return [];
            
            const lowerQuery = query.toLowerCase();
            return items.filter(item => 
                item.name.toLowerCase().includes(lowerQuery)
            ).map(item => ({ item })); // Match Fuse.js structure
        }

        // Create search interface
        const searchContainer = document.createElement('div');
        searchContainer.id = 'aws-search-container';
        searchContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: none;
            min-width: 300px;
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search AWS icons...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px 8px 0 0;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        `;

        const resultsContainer = document.createElement('div');
        resultsContainer.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            border-top: 1px solid #eee;
        `;

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(resultsContainer);
        document.body.appendChild(searchContainer);

        // Search functionality
        let currentResults = [];

        function showResults(results) {
            resultsContainer.innerHTML = '';
            currentResults = results;
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div style="padding: 12px; color: #666;">No results found</div>';
                return;
            }

            results.slice(0, 10).forEach((result, index) => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    ${index === 0 ? 'background: #f0f0f0;' : ''}
                `;
                item.textContent = result.item.name;
                item.addEventListener('click', () => insertIcon(result.item));
                item.addEventListener('mouseenter', () => {
                    document.querySelectorAll('#aws-search-container [style*="background: #f0f0f0"]').forEach(el => {
                        el.style.background = '';
                    });
                    item.style.background = '#f0f0f0';
                });
                resultsContainer.appendChild(item);
            });
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
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                z-index: 1000000;
                font-size: 14px;
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
            if (e.key === 'Enter') {
                const highlighted = resultsContainer.querySelector('[style*="background: #f0f0f0"]');
                if (highlighted) {
                    highlighted.click();
                } else if (currentResults.length > 0) {
                    insertIcon(currentResults[0].item);
                    hideSearch();
                }
            } else if (e.key === 'Escape') {
                hideSearch();
            }
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