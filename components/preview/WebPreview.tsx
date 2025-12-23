import React, { useEffect, useState, useRef } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { FileNode } from '../../types';
import { Icon } from '../ui/Icon';

export const WebPreview: React.FC = () => {
  const { files } = useWorkspaceStore();
  const { addConsoleLog, previewFileId } = useUIStore();
  const [srcDoc, setSrcDoc] = useState('');
  const [currentPreviewName, setCurrentPreviewName] = useState('Initializing...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for console logs from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (!event.data) return;
        
        if (event.data.type === 'CONSOLE_LOG') {
            addConsoleLog(`[Preview] ${event.data.message}`);
        } else if (event.data.type === 'PREVIEW_ERROR') {
            addConsoleLog(`[Preview Error] ${event.data.message}`);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addConsoleLog]);

  const generatePreview = () => {
    const allFiles = Object.values(files) as FileNode[];
    
    // --- 1. ENTRY POINT DETECTION ---
    let entryFile: FileNode | undefined;
    let isSyntheticHtml = false;
    let syntheticEntryScriptPath = "";

    // A. Explicit User Selection
    if (previewFileId && files[previewFileId]) {
        const f = files[previewFileId];
        if (f.name.endsWith('.html')) {
            entryFile = f;
        } else if (f.name.match(/\.(jsx?|tsx?)$/)) {
            entryFile = f;
            isSyntheticHtml = true;
            syntheticEntryScriptPath = getFullPath(f);
        }
    }

    // B. Auto-Detect: Look for index.html
    if (!entryFile) {
        entryFile = allFiles.find(f => f.name === 'index.html' && (f.parentId === 'root' || !f.parentId));
    }
    
    // C. Auto-Detect: Look for standard script entry points
    if (!entryFile) {
        const candidates = ['src/main.tsx', 'src/index.tsx', 'src/main.jsx', 'src/index.jsx', 'index.js', 'main.js', 'App.tsx', 'App.jsx'];
        
        for (const candidatePath of candidates) {
            const parts = candidatePath.split('/');
            const name = parts.pop();
            const parentName = parts.pop(); 
            
            const found = allFiles.find(f => {
                if (f.name !== name) return false;
                if (!parentName && (f.parentId === 'root' || !f.parentId)) return true;
                if (parentName) {
                    const parent = files[f.parentId || ''];
                    return parent && parent.name === parentName;
                }
                return false;
            });

            if (found) {
                entryFile = found;
                isSyntheticHtml = true;
                syntheticEntryScriptPath = getFullPath(found);
                break;
            }
        }
    }

    if (!entryFile) {
        setSrcDoc(`<html><body style="color:#888; font-family:sans-serif; text-align:center; padding-top:40px; background:#1e1e1e;">
            <div style="font-size: 24px; margin-bottom: 10px;">⚠️ No Entry Point Found</div>
            <p>Please create an <strong>index.html</strong> or a <strong>src/main.tsx</strong> file.</p>
        </body></html>`);
        setCurrentPreviewName('No Entry Point');
        return;
    }

    setCurrentPreviewName(isSyntheticHtml ? `Wrapper for ${entryFile.name}` : entryFile.name);

    // --- 2. FILE MAPPING & NORMALIZATION ---
    // We create a map where keys are "./path/to/file.ext"
    const fileMap: Record<string, string> = {};
    
    allFiles.forEach(f => {
        if (f.type !== 'file') return;
        let path = getFullPath(f);
        if (!path.startsWith('./')) path = './' + path;
        fileMap[path] = f.content || '';
    });

    // --- 3. PAYLOAD ENCODING ---
    // We encode the fileMap to Base64 to safely inject it into the HTML without worrying about quoting/escaping issues.
    // We use a safe base64 encoder that handles UTF-8 strings.
    const safeJson = JSON.stringify(fileMap);
    const payloadBase64 = btoa(unescape(encodeURIComponent(safeJson)));

    // --- 4. HTML GENERATION ---
    const rawHtml = isSyntheticHtml ? 
        `<!DOCTYPE html>
         <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Capy App</title>
            </head>
            <body>
                <div id="root"></div>
                <script type="module" src="./${syntheticEntryScriptPath}"></script>
            </body>
         </html>` 
        : (entryFile.content || '');

    // --- 5. BOOTLOADER SCRIPT ---
    // This script runs inside the iframe. It decodes the files, transforms them, creates blobs, and runs the app.
    const bootloader = `
    <script>
        // 1. Error Trap
        window.onerror = function(msg, url, line, col, error) {
            window.parent.postMessage({ type: 'PREVIEW_ERROR', message: msg, line: line }, '*');
            return false;
        };
        window.onunhandledrejection = function(e) {
            window.parent.postMessage({ type: 'PREVIEW_ERROR', message: 'Unhandled Promise Rejection: ' + e.reason }, '*');
        };

        // 2. Environment Shim
        window.process = { env: { NODE_ENV: 'development' } };
    </script>
    
    <!-- Load Babel & Tailwind -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>

    <script>
        (async function() {
            try {
                // 3. Decode Payload
                const raw = "${payloadBase64}";
                const fileMap = JSON.parse(decodeURIComponent(escape(atob(raw))));

                // 4. Console Proxy
                const _log = console.log;
                console.log = (...args) => {
                    _log(...args);
                    // Filter out tailwind cdn warnings
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
                    window.parent.postMessage({ type: 'CONSOLE_LOG', message: args.join(' ') }, '*');
                };

                // 5. Transform & Prepare Modules
                const blobs = {};
                const importMap = { imports: {} };
                
                // Add External Deps
                importMap.imports['react'] = 'https://esm.sh/react@18.2.0?dev';
                importMap.imports['react-dom/client'] = 'https://esm.sh/react-dom@18.2.0/client?dev';
                importMap.imports['react-dom'] = 'https://esm.sh/react-dom@18.2.0?dev';
                // Add Common Icons lib
                importMap.imports['lucide-react'] = 'https://esm.sh/lucide-react@0.292.0';

                // Helper: CSS Injection
                function injectCSS(path, content) {
                    const style = document.createElement('style');
                    style.setAttribute('data-path', path);
                    style.textContent = content;
                    document.head.appendChild(style);
                }

                // Transform Loop
                for (const path in fileMap) {
                    let code = fileMap[path];

                    // Handle CSS
                    if (path.endsWith('.css')) {
                        injectCSS(path, code);
                        continue; // Don't create blob for CSS (unless we want to support import css, handled below)
                    }

                    // Handle JS/TS/JSX
                    if (path.match(/\.(tsx?|jsx?|js)$/)) {
                        try {
                            // Strip CSS imports (naive) and inject them if found? 
                            // For simplicity, we assume CSS is global or side-effect imported.
                            // We can just comment them out to prevent runtime errors.
                            code = code.replace(/import\s+['"]([^'"]+\.css)['"];?/g, (match, cssPath) => {
                                // We rely on the fact that we looped over all files and injected CSS already.
                                return "// " + match; 
                            });

                            const result = Babel.transform(code, {
                                presets: [
                                    ['react', { runtime: 'automatic' }], 
                                    ['typescript', { isTSX: true, allExtensions: true }]
                                ],
                                filename: path,
                                sourceMaps: 'inline'
                            });
                            code = result.code;
                        } catch (e) {
                            console.error("Babel Error in " + path, e);
                            window.parent.postMessage({ type: 'PREVIEW_ERROR', message: 'Babel: ' + e.message + ' in ' + path }, '*');
                            continue;
                        }
                    }

                    const blob = new Blob([code], { type: 'text/javascript' });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Register exact path
                    importMap.imports[path] = blobUrl;
                    
                    // Register extension-less aliases ( ./App -> ./App.tsx )
                    const noExt = path.replace(/\.[^/.]+$/, "");
                    if (noExt !== path) {
                         importMap.imports[noExt] = blobUrl;
                         // Handle index files ( ./components/Header -> ./components/Header/index.tsx )
                         if (path.endsWith('/index.tsx') || path.endsWith('/index.jsx') || path.endsWith('/index.js')) {
                             const dir = path.substring(0, path.lastIndexOf('/index'));
                             importMap.imports[dir] = blobUrl;
                         }
                    }
                }

                // 6. Inject Import Map
                const mapEl = document.createElement('script');
                mapEl.type = "importmap";
                mapEl.textContent = JSON.stringify(importMap);
                document.head.appendChild(mapEl);

                // 7. Rewiring Entry Scripts
                // We look for the entry script tag in the original HTML and replace it with a module import
                // that utilizes our map.
                
                // Wait for DOM
                if (document.readyState === 'loading') {
                    await new Promise(r => document.addEventListener('DOMContentLoaded', r));
                }

                const scripts = document.querySelectorAll('script[src]');
                scripts.forEach(s => {
                    const src = s.getAttribute('src');
                    // Check if it's a local file (starts with ./ or no protocol)
                    if (src && (src.startsWith('./') || !src.match(/^https?:/))) {
                        const normalized = src.startsWith('./') ? src : './' + src;
                        if (importMap.imports[normalized] || importMap.imports[normalized.replace(/\.[^/.]+$/, "")]) {
                            const newScript = document.createElement('script');
                            newScript.type = 'module';
                            newScript.textContent = "import '" + normalized + "';";
                            s.replaceWith(newScript);
                        }
                    }
                });

            } catch (err) {
                console.error("Bootloader Error", err);
                window.parent.postMessage({ type: 'PREVIEW_ERROR', message: 'Bootloader: ' + err.message }, '*');
            }
        })();
    </script>
    `;

    // Inject before body close or at end
    let finalHtml = rawHtml;
    if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', bootloader + '</body>');
    } else {
        finalHtml += bootloader;
    }

    setSrcDoc(finalHtml);
  };

  // Helper to reconstruct path from store
  const getFullPath = (node: FileNode): string => {
      const { files } = useWorkspaceStore.getState();
      let path = node.name;
      let parent = files[node.parentId || ''];
      while (parent && parent.id !== 'root') {
          path = `${parent.name}/${path}`;
          parent = files[parent.parentId || ''];
      }
      return path;
  };

  // Debounced Refresh
  useEffect(() => {
      const timer = setTimeout(generatePreview, 1000);
      return () => clearTimeout(timer);
  }, [files, previewFileId]);

  const openInNewTab = () => {
      const blob = new Blob([srcDoc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white">
        <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 justify-between flex-shrink-0 select-none">
            <div className="flex items-center gap-2 text-xs text-gray-600">
                <Icon name="Globe" size={14} />
                <span className="font-mono max-w-[200px] truncate" title={currentPreviewName}>
                    {currentPreviewName}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={openInNewTab} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-1 py-0.5 rounded hover:bg-gray-200">
                    <Icon name="ExternalLink" size={12} /> Open
                </button>
                <button onClick={generatePreview} className="text-gray-500 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-gray-200" title="Force Reload">
                    <Icon name="RefreshCw" size={12} />
                </button>
            </div>
        </div>
        <div className="flex-1 relative bg-white overflow-hidden">
            <iframe 
                ref={iframeRef}
                title="preview"
                srcDoc={srcDoc}
                className="w-full h-full border-none"
                // relaxed sandbox for development prototype
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups" 
            />
        </div>
    </div>
  );
};
