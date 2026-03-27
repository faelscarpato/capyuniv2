import{h as E,f as I,r as a,j as s}from"./terminal-runtime-CNB7urBe.js";import{I as u}from"./index-CTripYu1.js";const M="19.2.3",N="0.562.0",A=["src/main.tsx","src/index.tsx","index.tsx"],z=()=>{const{files:i}=E(),{addConsoleLog:d,previewFileId:c}=I(),[f,h]=a.useState(""),[x,y]=a.useState("Initializing..."),v=a.useRef(null);a.useEffect(()=>{const t=e=>{e.data&&(e.data.type==="CONSOLE_LOG"?d(`[Preview] ${e.data.message}`):e.data.type==="PREVIEW_ERROR"&&d(`[Preview Error] ${e.data.message}`))};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[d]);const l=t=>{const e=E.getState().files;let n=t.name,o=e[t.parentId||""];for(;o&&o.id!=="root";)n=`${o.name}/${n}`,o=e[o.parentId||""];return n},p=a.useMemo(()=>Object.values(i).filter(t=>t.type==="file"),[i]),b=t=>{const e=t.replace(/^\/+/,"");return p.find(n=>l(n)===e)},_=()=>{for(const t of A){const e=b(t);if(e)return e}return p.find(t=>t.name.endsWith(".tsx")&&/(createRoot\s*\(|ReactDOM\.createRoot\s*\()/.test(t.content||""))},j=t=>{y("Preview Error"),h(`<!doctype html><html><body style="margin:0;padding:24px;background:#1e1e1e;color:#d4d4d4;font-family:ui-sans-serif,system-ui;"><h2 style="margin:0 0 8px;">Web Preview</h2><p style="margin:0;">${t}</p></body></html>`)},P=t=>`
<script>
window.process = window.process || { env: { NODE_ENV: 'development' } };
const sendPreviewError = function(message) {
  window.parent.postMessage({ type: 'PREVIEW_ERROR', message: String(message || 'Unknown preview error') }, '*');
};
window.addEventListener('error', function(event) {
  const details = [event.message, event.filename, event.lineno, event.colno].filter(Boolean).join(' | ');
  sendPreviewError(details || 'Runtime error in iframe');
});
window.addEventListener('unhandledrejection', function(event) {
  sendPreviewError('Unhandled Promise Rejection: ' + (event.reason && event.reason.message ? event.reason.message : event.reason || 'Unknown reason'));
});
<\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<script>
(async function () {
  const postLog = function(type, args) {
    const text = args.map(function(arg) {
      if (typeof arg === 'string') return arg;
      try { return JSON.stringify(arg); } catch (e) { return String(arg); }
    }).join(' ');
    window.parent.postMessage({ type: type === 'error' ? 'PREVIEW_ERROR' : 'CONSOLE_LOG', message: text }, '*');
  };

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function(method) {
    const original = console[method];
    console[method] = function() {
      const args = Array.from(arguments);
      original.apply(console, args);
      const first = args[0];
      if (typeof first === 'string' && first.includes('cdn.tailwindcss.com')) return;
      postLog(method, args);
    };
  });

  const raw = '__PAYLOAD__';
  const files = JSON.parse(decodeURIComponent(escape(atob(raw))));
  const importMap = { imports: {} };

  importMap.imports['react'] = 'https://esm.sh/react@__REACT__?dev';
  importMap.imports['react-dom'] = 'https://esm.sh/react-dom@__REACT__?dev';
  importMap.imports['react-dom/client'] = 'https://esm.sh/react-dom@__REACT__/client?dev';
  importMap.imports['react/jsx-runtime'] = 'https://esm.sh/react@__REACT__/jsx-runtime?dev';
  importMap.imports['react/jsx-dev-runtime'] = 'https://esm.sh/react@__REACT__/jsx-dev-runtime?dev';
  importMap.imports['lucide-react'] = 'https://esm.sh/lucide-react@__LUCIDE__';

  const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json', '.css'];

  const normalizePath = function(path) {
    const out = [];
    path.split('/').forEach(function(part) {
      if (!part || part === '.') return;
      if (part === '..') out.pop();
      else out.push(part);
    });
    return './' + out.join('/');
  };

  const dirname = function(path) {
    const index = path.lastIndexOf('/');
    return index === -1 ? './' : path.slice(0, index + 1);
  };

  const resolveSpecifier = function(fromPath, specifier) {
    if (!specifier) return specifier;
    if (/^(https?:|data:|blob:|node:)/.test(specifier)) return specifier;
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) return specifier;

    const base = specifier.startsWith('/') ? '.' + specifier : dirname(fromPath) + specifier;
    const normalized = normalizePath(base);

    const candidates = [normalized];
    exts.forEach(function(ext) { candidates.push(normalized + ext); });
    candidates.push(normalized + '/index.tsx');
    candidates.push(normalized + '/index.ts');
    candidates.push(normalized + '/index.jsx');
    candidates.push(normalized + '/index.js');

    for (const candidate of candidates) {
      if (Object.prototype.hasOwnProperty.call(files, candidate)) {
        return candidate.endsWith('.css') ? candidate + '?capy-style' : candidate;
      }
    }

    return normalized;
  };

  const rewriteSpecifiers = function(code, fromPath) {
    let out = code;
    out = out.replace(/(import\\s+(?:[^'"\\n]*?\\s+from\\s+)?)(['"])([^'"\\n]+)\\2/g, function(_, prefix, quote, specifier) {
      return prefix + quote + resolveSpecifier(fromPath, specifier) + quote;
    });
    out = out.replace(/(export\\s+(?:[^'"\\n]*?\\s+from\\s+))(['"])([^'"\\n]+)\\2/g, function(_, prefix, quote, specifier) {
      return prefix + quote + resolveSpecifier(fromPath, specifier) + quote;
    });
    out = out.replace(/(import\\s*\\(\\s*)(['"])([^'"\\n]+)\\2(\\s*\\))/g, function(_, p1, quote, specifier, p2) {
      return p1 + quote + resolveSpecifier(fromPath, specifier) + quote + p2;
    });
    return out;
  };

  const createModule = function(code) {
    return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  };

  const registerAliases = function(path, url) {
    importMap.imports[path] = url;
    const noExt = path.replace(/\\.[^/.]+$/, '');
    if (noExt !== path) importMap.imports[noExt] = url;

    if (path.endsWith('/index.tsx') || path.endsWith('/index.ts') || path.endsWith('/index.jsx') || path.endsWith('/index.js')) {
      const dirAlias = path.replace(/\\/index\\.[^/.]+$/, '');
      importMap.imports[dirAlias] = url;
    }
  };

  try {
    Object.keys(files).filter(function(path) { return path.endsWith('.css'); }).forEach(function(cssPath) {
      const styleId = btoa(cssPath);
      const cssText = JSON.stringify(files[cssPath] || '');
      const moduleCode = [
        'const styleId = ' + JSON.stringify(styleId) + ';',
        'if (!document.querySelector('style[data-capy-style="' + styleId + ''"])) {',
        '  const style = document.createElement('style');',
        '  style.setAttribute('data-capy-style', styleId);',
        '  style.textContent = ' + cssText + ';',
        '  document.head.appendChild(style);',
        '}',
        'export default {};'
      ].join('\\n');

      const moduleUrl = createModule(moduleCode);
      registerAliases(cssPath + '?capy-style', moduleUrl);
    });

    Object.keys(files)
      .filter(function(path) { return /\\.(tsx?|jsx?|mjs|cjs|js)$/.test(path); })
      .forEach(function(filePath) {
        const rewritten = rewriteSpecifiers(files[filePath], filePath);
        const transformed = Babel.transform(rewritten, {
          presets: [
            ['react', { runtime: 'automatic', development: true }],
            ['typescript', { isTSX: true, allExtensions: true }]
          ],
          filename: filePath,
          sourceMaps: 'inline'
        });

        const moduleUrl = createModule(transformed.code || rewritten);
        registerAliases(filePath, moduleUrl);
      });

    const importMapEl = document.createElement('script');
    importMapEl.type = 'importmap';
    importMapEl.textContent = JSON.stringify(importMap);
    document.head.appendChild(importMapEl);

    if (document.readyState === 'loading') {
      await new Promise(function(resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); });
    }

    const localScripts = Array.from(document.querySelectorAll('script[src]')).filter(function(script) {
      const src = script.getAttribute('src') || '';
      return src && !/^(https?:|data:|blob:)/.test(src);
    });

    localScripts.forEach(function(script) {
      const src = script.getAttribute('src') || '';
      const normalized = src.startsWith('.') ? src : './' + src.replace(/^\\//, '');
      const mapped = importMap.imports[normalized] || importMap.imports[normalized.replace(/\\.[^/.]+$/, '')];
      if (!mapped) return;

      const moduleScript = document.createElement('script');
      moduleScript.type = 'module';
      moduleScript.textContent = 'import ' + JSON.stringify(normalized) + ';';
      script.replaceWith(moduleScript);
    });
  } catch (error) {
    sendPreviewError(error && error.message ? error.message : error);
  }
})();
<\/script>
`.replace("__PAYLOAD__",t).replaceAll("__REACT__",M).replace("__LUCIDE__",N),g=()=>{const t={};p.forEach(r=>{const C=`./${l(r).replace(/^\.\//,"")}`;t[C]=r.content||""});let e,n=!1,o="";if(c&&i[c]&&i[c].type==="file"){const r=i[c];r.name.endsWith(".html")?e=r:r.name.match(/\.(tsx?|jsx?)$/)&&(e=r,n=!0,o=`./${l(r)}`)}if(e||(e=p.find(r=>r.name==="index.html"&&(r.parentId==="root"||!r.parentId))),!e){const r=_();r&&(e=r,n=!0,o=`./${l(r)}`)}if(!e){j("Nenhum entrypoint React encontrado. Tente criar src/main.tsx, src/index.tsx ou index.tsx.");return}y(n?`Wrapper for ${e.name}`:e.name);const m=n?`<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Capy App</title></head><body><div id="root"></div><script type="module" src="${o}"><\/script></body></html>`:e.content||"",S=btoa(unescape(encodeURIComponent(JSON.stringify(t)))),w=P(S),O=m.includes("</body>")?m.replace("</body>",`${w}</body>`):`${m}${w}`;h(O)};a.useEffect(()=>{const t=setTimeout(g,700);return()=>clearTimeout(t)},[i,c]);const R=()=>{const t=new Blob([f],{type:"text/html"}),e=URL.createObjectURL(t);window.open(e,"_blank")};return s.jsxs("div",{className:"flex flex-col h-full bg-white",children:[s.jsxs("div",{className:"h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 justify-between flex-shrink-0 select-none",children:[s.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-600",children:[s.jsx(u,{name:"Globe",size:14}),s.jsx("span",{className:"font-mono max-w-[240px] truncate",title:x,children:x})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsxs("button",{onClick:R,className:"text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-1 py-0.5 rounded hover:bg-gray-200",children:[s.jsx(u,{name:"ExternalLink",size:12})," Open"]}),s.jsx("button",{onClick:g,className:"text-gray-500 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-gray-200",title:"Force Reload",children:s.jsx(u,{name:"RefreshCw",size:12})})]})]}),s.jsx("div",{className:"flex-1 relative bg-white overflow-hidden",children:s.jsx("iframe",{ref:v,title:"preview",srcDoc:f,className:"w-full h-full border-none",sandbox:"allow-scripts allow-same-origin allow-forms allow-modals allow-popups"})})]})};export{z as WebPreview};
