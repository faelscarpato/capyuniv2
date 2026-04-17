import{p as S,n as $,m as k,J as D,r as a,j as r}from"./terminal-runtime-DlHkUy3B.js";import{I as m}from"./index-CrcGPiIa.js";const q="19.2.3",F="0.562.0",J=["src/main.tsx","src/index.tsx","index.tsx"],Y=()=>{const{files:c}=S(),{addConsoleLog:h,previewFileId:p,language:L}=$(),{mode:l}=k(),{detectedUrls:g,activeUrl:o,setActiveUrl:y,registerDetectedUrls:C}=D(),[b,v]=a.useState(""),[w,E]=a.useState("Initializing..."),[j,_]=a.useState(""),O=a.useRef(null),d=(e,t)=>L==="pt"?e:t;a.useEffect(()=>{l==="local-runtime"&&o&&_(o)},[l,o]),a.useEffect(()=>{if(l==="local-runtime")return;const e=t=>{t.data&&(t.data.type==="CONSOLE_LOG"?h(`[Preview] ${t.data.message}`):t.data.type==="PREVIEW_ERROR"&&h(`[Preview Error] ${t.data.message}`))};return window.addEventListener("message",e),()=>window.removeEventListener("message",e)},[h,l]);const u=e=>{const t=S.getState().files;let n=e.name,i=t[e.parentId||""];for(;i&&i.id!=="root";)n=`${i.name}/${n}`,i=t[i.parentId||""];return n},f=a.useMemo(()=>Object.values(c).filter(e=>e.type==="file"),[c]),M=e=>{const t=e.replace(/^\/+/,"");return f.find(n=>u(n)===t)},I=()=>{for(const e of J){const t=M(e);if(t)return t}return f.find(e=>e.name.endsWith(".tsx")&&/(createRoot\s*\(|ReactDOM\.createRoot\s*\()/.test(e.content||""))},U=e=>{E("Preview Error"),v(`<!doctype html><html><body style="margin:0;padding:24px;background:#1e1e1e;color:#d4d4d4;font-family:ui-sans-serif,system-ui;"><h2 style="margin:0 0 8px;">Web Preview</h2><p style="margin:0;">${e}</p></body></html>`)},A=e=>`
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
        'const selector = "style[data-capy-style=\\"" + styleId + "\\"]";',
        'if (!document.querySelector(selector)) {',
        '  const style = document.createElement("style");',
        '  style.setAttribute("data-capy-style", styleId);',
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
      const resolved = resolveSpecifier('./index.html', normalized);
      const mapped = importMap.imports[resolved] || importMap.imports[resolved.replace(/\\.[^/.]+$/, '')];
      if (!mapped) return;

      const moduleScript = document.createElement('script');
      moduleScript.type = 'module';
      moduleScript.textContent = 'import ' + JSON.stringify(resolved) + ';';
      script.replaceWith(moduleScript);
    });
  } catch (error) {
    sendPreviewError(error && error.message ? error.message : error);
  }
})();
<\/script>
`.replace("__PAYLOAD__",e).replaceAll("__REACT__",q).replace("__LUCIDE__",F),R=()=>{const e={};f.forEach(s=>{const z=`./${u(s).replace(/^\.\//,"")}`;e[z]=s.content||""});let t,n=!1,i="";if(p&&c[p]&&c[p].type==="file"){const s=c[p];s.name.endsWith(".html")?t=s:s.name.match(/\.(tsx?|jsx?)$/)&&(t=s,n=!0,i=`./${u(s)}`)}if(t||(t=f.find(s=>s.name==="index.html"&&(s.parentId==="root"||!s.parentId))),!t){const s=I();s&&(t=s,n=!0,i=`./${u(s)}`)}if(!t){U("Nenhum entrypoint React encontrado. Tente criar src/main.tsx, src/index.tsx ou index.tsx.");return}E(n?`Wrapper for ${t.name}`:t.name);const x=n?`<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Capy App</title></head><body><div id="root"></div><script type="module" src="${i}"><\/script></body></html>`:t.content||"",W=btoa(unescape(encodeURIComponent(JSON.stringify(e)))),N=A(W),T=x.includes("</body>")?x.replace("</body>",`${N}</body>`):`${x}${N}`;v(T)};a.useEffect(()=>{const e=setTimeout(R,700);return()=>clearTimeout(e)},[c,p]);const P=()=>{if(l==="local-runtime"){o&&window.open(o,"_blank");return}const e=new Blob([b],{type:"text/html"}),t=URL.createObjectURL(e);window.open(t,"_blank")};return l==="local-runtime"?r.jsxs("div",{className:"flex flex-col h-full bg-white",children:[r.jsxs("div",{className:"h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 justify-between flex-shrink-0 select-none",children:[r.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-600",children:[r.jsx(m,{name:"Cpu",size:14}),r.jsx("span",{className:"font-semibold text-green-700",children:d("PREVIEW RUNTIME LOCAL","LOCAL RUNTIME PREVIEW")})]}),r.jsxs("button",{onClick:P,disabled:!o,className:"text-gray-500 hover:text-gray-900 disabled:opacity-40 flex items-center gap-1 text-xs px-1 py-0.5 rounded hover:bg-gray-200",children:[r.jsx(m,{name:"ExternalLink",size:12})," ",d("Abrir","Open")]})]}),r.jsxs("div",{className:"p-2 border-b border-gray-300 bg-gray-50 flex flex-col gap-2",children:[g.length>0&&r.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:g.map(e=>r.jsx("button",{type:"button",onClick:()=>y(e),className:`px-2 py-1 rounded text-[11px] border transition-colors ${o===e?"bg-blue-600 text-white border-blue-700":"bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`,children:e},e))}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("input",{type:"text",value:j,onChange:e=>_(e.target.value),placeholder:"http://localhost:3000",className:"flex-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"}),r.jsx("button",{type:"button",onClick:()=>{const e=j.trim();e&&(C([e]),y(e))},className:"px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs",children:d("Usar URL","Use URL")})]})]}),r.jsx("div",{className:"flex-1 relative bg-white overflow-hidden",children:o?r.jsx("iframe",{title:"local-runtime-preview",src:o,className:"w-full h-full border-none"}):r.jsx("div",{className:"h-full w-full flex items-center justify-center text-sm text-gray-600 bg-gray-50 px-6 text-center",children:d("Inicie seu servidor local no Modo Runtime Local (por exemplo `npm run dev`). URLs localhost detectadas aparecerão aqui.","Start your local dev server in Local Runtime Mode (for example `npm run dev`). Detected localhost URLs will appear here.")})})]}):r.jsxs("div",{className:"flex flex-col h-full bg-white",children:[r.jsxs("div",{className:"h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 justify-between flex-shrink-0 select-none",children:[r.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-600",children:[r.jsx(m,{name:"Globe",size:14}),r.jsx("span",{className:"font-mono max-w-[240px] truncate",title:w,children:w})]}),r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsxs("button",{onClick:P,className:"text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-1 py-0.5 rounded hover:bg-gray-200",children:[r.jsx(m,{name:"ExternalLink",size:12})," ",d("Abrir","Open")]}),r.jsx("button",{onClick:R,className:"text-gray-500 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-gray-200",title:d("Forçar recarregamento","Force Reload"),children:r.jsx(m,{name:"RefreshCw",size:12})})]})]}),r.jsx("div",{className:"flex-1 relative bg-white overflow-hidden",children:r.jsx("iframe",{ref:O,title:"preview",srcDoc:b,className:"w-full h-full border-none",sandbox:"allow-scripts allow-forms allow-modals allow-popups"})})]})};export{Y as WebPreview};
