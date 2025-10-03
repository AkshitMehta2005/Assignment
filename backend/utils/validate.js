const levenshtein = (a,b) => {
  if(!a) return b ? b.length : 0;
  if(!b) return a.length;
  const m = a.length, n = b.length;
  const dp = Array(n+1).fill(0).map((_,i)=>i);
  for(let i=1;i<=m;i++){
    let prev = dp[0];
    dp[0]=i;
    for(let j=1;j<=n;j++){
      const tmp = dp[j];
      dp[j] = Math.min(dp[j]+1, dp[j-1]+1, prev + (a[i-1]===b[j-1]?0:1));
      prev = tmp;
    }
  }
  return dp[n];
};

const normalizeHeader = (h) => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

function simpleTypeGuess(v){
  if(v===null||v===undefined||v==='') return 'empty';
  if(!isNaN(Number(v))) return 'number';
  // ISO date-ish
  if(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return 'date';
  return 'string';
}

function analyzeRows(rows, schema){
  // schema expected to have an array of fields with names and types (best effort)
  const schemaKeys = (schema && schema.properties) ? Object.keys(schema.properties) : [];
  const normalizedSchema = schemaKeys.map(k=>({key:k, norm:normalizeHeader(k)}));

  // headers from rows
  const headers = new Set();
  rows.slice(0,5).forEach(r=> Object.keys(r||{}).forEach(h=>headers.add(h)));
  const headersArr = Array.from(headers);
  const normalizedHeaders = headersArr.map(h=>({orig:h, norm:normalizeHeader(h)}));

  // matching heuristic
  const matches = {};
  const close = [];
  const missing = [];
  normalizedSchema.forEach(s=>{
    let best = {score:Infinity, header:null};
    normalizedHeaders.forEach(h=>{
      const d = levenshtein(s.norm, h.norm);
      if(d < best.score){ best = {score:d, header:h.orig}; }
    });
    if(best.header && best.score===0) matches[s.key]=best.header;
    else if(best.header && best.score <= Math.max(1, Math.floor(s.key.length*0.2))) close.push({schema:s.key, header:best.header, dist:best.score});
    else missing.push(s.key);
  });

  // simple rule checks (5 checks)
  const findings = [];
  // 1. Missing required fields (schema may have required array)
  const required = schema.required || [];
  const missingRequired = required.filter(r=> !Object.keys(matches).includes(r) && !close.find(c=>c.schema===r));
  findings.push({rule:'missing_required_fields', pass: missingRequired.length===0, details: missingRequired});

  // 2. Type mismatch check (sample values)
  const typeProblems = [];
  normalizedSchema.forEach(s=>{
    const hdr = matches[s.key] || (close.find(c=>c.schema===s.key)&&close.find(c=>c.schema===s.key).header);
    if(!hdr) return;
    const samples = rows.slice(0, Math.min(20, rows.length)).map(r=>r[hdr]);
    const guessed = samples.map(simpleTypeGuess);
    // determine dominant
    const counts = guessed.reduce((acc,x)=>{acc[x]=(acc[x]||0)+1;return acc;},{});
    const dominant = Object.keys(counts).reduce((a,b)=> counts[a]>counts[b]?a:b);
    const expected = (schema.properties && schema.properties[s.key] && schema.properties[s.key].type) || 'string';
    if(expected==='integer' && dominant!=='number') typeProblems.push({field:s.key, header:hdr, expected, dominant});
    if(expected==='string' && dominant==='number') typeProblems.push({field:s.key, header:hdr, expected, dominant});
  });
  findings.push({rule:'type_mismatch_samples', pass: typeProblems.length===0, details:typeProblems});

  // 3. High empty rate fields
  const empties = [];
  normalizedSchema.forEach(s=>{
    const hdr = matches[s.key] || (close.find(c=>c.schema===s.key)&&close.find(c=>c.schema===s.key).header);
    if(!hdr) return;
    const samples = rows.slice(0, Math.min(100, rows.length)).map(r=>r[hdr]);
    const emptyCount = samples.filter(x=>x===null||x===undefined||x==='').length;
    if((emptyCount / samples.length) > 0.5) empties.push({field:s.key, header:hdr, emptyRate: (emptyCount/samples.length)});
  });
  findings.push({rule:'high_empty_rate', pass: empties.length===0, details:empties});

  // 4. Format checks for known fields (invoice_number / date / amount)
  const formatProblems = [];
  const lookup = ['invoice_number','invoiceid','invoicenumber','date','amount','total'];
  normalizedSchema.forEach(s=>{
    const keyNorm = s.key.toLowerCase();
    if(lookup.some(l=>keyNorm.includes(l))){
      const hdr = matches[s.key] || (close.find(c=>c.schema===s.key)&&close.find(c=>c.schema===s.key).header);
      if(!hdr) return;
      const samples = rows.slice(0, Math.min(30, rows.length)).map(r=>r[hdr]);
      // quick heuristics
      if(keyNorm.includes('date')){
        const bad = samples.filter(x=> typeof x === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(x));
        if(bad.length > (samples.length*0.4)) formatProblems.push({field:s.key, header:hdr, issue:'date_format'});
      }
      if(keyNorm.includes('amount') || keyNorm.includes('total')){
        const bad = samples.filter(x=> isNaN(Number(x)));
        if(bad.length > (samples.length*0.3)) formatProblems.push({field:s.key, header:hdr, issue:'amount_not_numeric'});
      }
    }
  });
  findings.push({rule:'format_checks', pass: formatProblems.length===0, details:formatProblems});

  // 5. Coverage score calculation
  const matchedCount = Object.keys(matches).length;
  const closeCount = close.length;
  const total = normalizedSchema.length || 1;
  const coverageScore = Math.round(((matchedCount + 0.5*closeCount) / total) * 100);

  // simple scoring aggregation
  const dataScore = 100 - (typeProblems.length*10 + empties.length*8 + formatProblems.length*6);
  const coverage = coverageScore;
  const rulesScore = Math.round(((findings.filter(f=>f.pass).length) / findings.length) * 100);
  const posture = Math.round((dataScore*0.4 + coverage*0.4 + rulesScore*0.2));

  const scores = {
    dataScore: Math.max(0, Math.min(100, dataScore)),
    coverageScore: Math.max(0, Math.min(100, coverage)),
    rulesScore: Math.max(0, Math.min(100, rulesScore)),
    postureScore: Math.max(0, Math.min(100, posture)),
    overall: Math.round((Math.max(0, Math.min(100, dataScore))*0.35) + (coverage*0.35) + (rulesScore*0.3))
  };

  return {
    coverage: {matched: matchedCount, close: closeCount, missing: missing},
    scores,
    findings
  };
}

module.exports = {analyzeRows, normalizeHeader};
