const { v4: uuidv4 } = require('uuid');

function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  let matching = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) { // simple approx
        matching++;
    }
  }
  const charCounts = {};
  for (let char of longer) {
      charCounts[char] = (charCounts[char] || 0) + 1;
  }
  let exactMatching = 0;
  for (let char of shorter) {
      if (charCounts[char] && charCounts[char] > 0) {
          exactMatching++;
          charCounts[char]--;
      }
  }
  return exactMatching / longerLength;
}

function normalizeStr(str) {
  if (!str) return '';
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function compareRecords(r1, r2) {
  const dobMatch = r1.dob && r2.dob && r1.dob === r2.dob;
  
  const m1 = (r1.mobile || '').toString();
  const m2 = (r2.mobile || '').toString();
  const mobileExact = m1 && m2 && m1 === m2;
  const mobileLast4Match = m1.length >= 4 && m2.length >= 4 && m1.slice(-4) === m2.slice(-4);
  
  const n1 = normalizeStr(r1.name);
  const n2 = normalizeStr(r2.name);
  const sim = similarity(n1, n2);
  const nameMatch = sim >= 0.7;

  if (mobileExact && dobMatch && nameMatch) return 1.0;
  if (mobileLast4Match && dobMatch) return 0.95;
  if (nameMatch && dobMatch) return 0.8;
  
  return 0;
}

function runMatching(allRecords, db) {
  let matched = 0, newCount = 0, updated = 0;

  // fetch all existing golden records
  const rawRecords = db.prepare('SELECT * FROM golden_citizens').all();
  const goldenRecords = rawRecords.map(r => ({ ...r, dob: r.date_of_birth }));

  for (const record of allRecords) {
    let bestMatch = null;
    let highestScore = 0;

    // Check against existing golden records
    for (const gr of goldenRecords) {
      const score = compareRecords(record, gr);
      if (score >= 0.8 && score > highestScore) {
        highestScore = score;
        bestMatch = gr;
      }
    }

    if (bestMatch) {
      // Exists, link it
      const linkExists = db.prepare('SELECT 1 FROM department_links WHERE department = ? AND department_id = ?').get(record.department, record.id);
      
      if (!linkExists) {
        db.prepare(`
          INSERT INTO department_links (canonical_id, department, department_id, department_id_field, linked_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).run(bestMatch.canonical_id, record.department, record.id, record.idField);
        matched++;
        updated++;
      }
    } else {
      // Create new
      const canonical_id = uuidv4();
      const newGr = {
        canonical_id,
        name: record.name,
        dob: record.dob || '',
        mobile: record.mobile || '',
        email: record.email || '',
        address: record.address || ''
      };
      
      db.prepare(`
        INSERT INTO golden_citizens (canonical_id, name, date_of_birth, mobile, email, address, confidence_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(newGr.canonical_id, newGr.name, newGr.dob, newGr.mobile, newGr.email, newGr.address, 1.0);
      // Check if link exists before inserting
      const linkExists = db.prepare('SELECT 1 FROM department_links WHERE department = ? AND department_id = ?').get(record.department, record.id);
      
      if (!linkExists) {
        db.prepare(`
          INSERT INTO department_links (canonical_id, department, department_id, department_id_field, linked_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).run(newGr.canonical_id, record.department, record.id, record.idField);
      }
      
      goldenRecords.push(newGr); // add to in-memory list for subsequent matches
      newCount++;
    }
  }
  
  return { matched, new: newCount, updated };
}

module.exports = { compareRecords, runMatching, similarity };
