const fs = require('fs');
let code = fs.readFileSync('D:/MCA Projects/Sem II/MessMate/Main/backend/config/seed.js', 'utf8');

// Change signature
code = code.replace('module.exports = function seed(db) {', () => `module.exports = async function seed(query) {
  const prepare = (sql) => {
    let i = 1;
    const pgSql = sql.replace(/\\?/g, () => '$' + (i++));
    return {
      run: async (...params) => { await query(pgSql, params); },
      get: async (...params) => { const { rows } = await query(pgSql, params); return rows[0]; }
    };
  };`);

// Replace db.prepare with prepare
code = code.replace(/db\.prepare/g, 'prepare');

// Add awaits to .run and .get
code = code.replace(/insU\.run/g, 'await insU.run');
code = code.replace(/insM\.run/g, 'await insM.run');
code = code.replace(/insI\.run/g, 'await insI.run');
code = code.replace(/insS\.run/g, 'await insS.run');
code = code.replace(/insP\.run/g, 'await insP.run');
code = code.replace(/insSub\.run/g, 'await insSub.run');
code = code.replace(/insO\.run/g, 'await insO.run');
code = code.replace(/insOI\.run/g, 'await insOI.run');
code = code.replace(/insPay\.run/g, 'await insPay.run');
code = code.replace(/insA\.run/g, 'await insA.run');
code = code.replace(/insR\.run/g, 'await insR.run');
code = code.replace(/insN\.run/g, 'await insN.run');

// Fix inline prepare(...).run/get
code = code.replace(/const stats = prepare\((.*?)\)\.get\((.*?)\);/g, 'const stats = await prepare($1).get($2);');
code = code.replace(/prepare\((.*?)\)\.run\((.*?)\);/g, 'await prepare($1).run($2);');

fs.writeFileSync('D:/MCA Projects/Sem II/MessMate/Main/backend/config/seed.js', code);
console.log('Seed file rewritten for Postgres.');
