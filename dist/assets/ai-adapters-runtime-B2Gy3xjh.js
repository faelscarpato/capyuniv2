import{GoogleGenAI as u}from"./ai-provider-gemini-DKc1elzf.js";import{OpenAI as h}from"./ai-provider-openai-XclX0y9K.js";const m={fast:"gpt-oss-20b",smart:"codestral-latest",coder:"codestral-latest"},f=t=>new h({apiKey:t,baseURL:"https://api.groq.com/openai/v1",dangerouslyAllowBrowser:!0}),g=t=>t||"",M=async(t,e)=>{var o,n;const r=f(t),s=`
Você é um assistente de pesquisa web.
- Pesquise informações atuais e confiáveis sobre o tema pedido.
- Monte uma resposta em Português do Brasil, clara e direta.
- Sempre liste as principais fontes em bullet points no final, no formato: [Título](URL).
- Não invente links.
`;try{const a=await r.chat.completions.create({model:m.fast,messages:[{role:"system",content:s},{role:"user",content:e}]});return{text:g((n=(o=a.choices[0])==null?void 0:o.message)==null?void 0:n.content),chunks:[]}}catch(a){throw console.error("LLM7 Websearch Error",a),a}},p={fast:"llama-3.1-8b-instant",coder:"openai/gpt-oss-120b"},x=async({apiKey:t,model:e="gemini-2.0-flash",prompt:r,systemInstruction:s})=>(await new u({apiKey:t}).models.generateContent({model:e,contents:r,config:{systemInstruction:s}})).text||"",v=async({apiKey:t,code:e,instruction:r,fileName:s})=>{const o=new u({apiKey:t}),n="gemini-2.0-flash",a=`
    You are an expert Coding Assistant embedded in an IDE.
    Your task is to fix, refactor, or complete the code provided by the user.
    
    CONTEXT:
    - File Name: ${s}
    - Instruction: ${r}

    RULES:
    - Return ONLY the replaced code. 
    - Do NOT wrap in markdown code blocks (\`\`\`).
    - Do NOT add conversational text like "Here is the fixed code".
    - If the instruction implies replacing a specific part, return only that part optimized.
    - If the user asks for a comment or explanation, you may add comments in the code, but stay within valid syntax.
    `;try{let c=(await o.models.generateContent({model:n,contents:e,config:{systemInstruction:a,temperature:.2}})).text||e;return c.startsWith("```")&&(c=c.replace(/^```[a-z]*\n/,"").replace(/\n```$/,"")),c}catch(i){throw console.error("Code Fix Error",i),i}},w=async(t,e,r)=>{if(!t)return"Configure sua API Key para ver a análise.";const s=new u({apiKey:t}),o="gemini-2.0-flash",n=`Analise este trecho de código (${r}) brevemente em Português.
    Explique a função e aponte bugs ou riscos de segurança se houver.
    Seja conciso (máximo 3 frases).
    Código:
    ${e}`;try{return(await s.models.generateContent({model:o,contents:n})).text||"Sem análise disponível."}catch{return"Erro na análise IA."}};class A{constructor(e){this.apiKey=e,this.id="gemini"}async chat(e){const r=e.messages.map(o=>`[${o.role}] ${o.content}`).join(`
`);return{text:await x({apiKey:this.apiKey,model:e.model,prompt:r})}}async codeFix(e){return v({apiKey:this.apiKey,code:e.code,instruction:e.instruction,fileName:e.fileName})}async hoverAnalysis(e){return w(this.apiKey,e.snippet,e.language)}}const l=t=>typeof t=="string"?t:Array.isArray(t)?t.map(e=>e&&typeof e=="object"&&"text"in e?String(e.text||""):"").join(`
`):"";class y{constructor(e){this.id=e.id,this.defaultModel=e.defaultModel,this.codeModel=e.codeModel||e.defaultModel,this.client=new h({apiKey:e.apiKey,baseURL:e.baseURL,dangerouslyAllowBrowser:!0})}async chat(e){var s,o;const r=await this.client.chat.completions.create({model:e.model||this.defaultModel,messages:e.messages.map(n=>({role:n.role,content:n.content})),temperature:e.temperature});return{text:l((o=(s=r.choices[0])==null?void 0:s.message)==null?void 0:o.content),raw:r}}async codeFix(e){var s,o;const r=await this.client.chat.completions.create({model:e.model||this.codeModel,temperature:.1,messages:[{role:"system",content:"Return only code. Do not include markdown fences. Preserve syntax validity and follow the user instruction."},{role:"user",content:`File: ${e.fileName}
Instruction: ${e.instruction}

${e.code}`}]});return l((o=(s=r.choices[0])==null?void 0:s.message)==null?void 0:o.content)||e.code}async hoverAnalysis(e){var s,o;const r=await this.client.chat.completions.create({model:this.defaultModel,temperature:.2,messages:[{role:"user",content:`Analise este trecho de código (${e.language}) brevemente em Português. Explique função e riscos em no máximo 3 frases.
${e.snippet}`}]});return l((o=(s=r.choices[0])==null?void 0:s.message)==null?void 0:o.content)||"Sem análise disponível."}}class P extends y{constructor(e){super({id:"groq",apiKey:e,baseURL:"https://api.groq.com/openai/v1",defaultModel:p.fast,codeModel:p.coder})}}const d={};class C extends y{constructor(e){super({id:"llm7",apiKey:e,baseURL:(d==null?void 0:d.VITE_LLM7_BASE_URL)||"https://api.llm7.io/v1",defaultModel:m.fast,codeModel:m.coder})}}class E{constructor(){this.id="local"}async chat(e){return{text:"Local provider ainda nao configurado. TODO: integrar runtime local (Ollama/LM Studio) com endpoint seguro."}}async codeFix(e){return e.code}async hoverAnalysis(e){return"Local provider indisponivel no momento."}}export{A as G,C as L,P as a,E as b,p as c,m as d,M as l};
