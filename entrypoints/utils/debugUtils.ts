export function debugPageStructure() {
  console.log('🔍 === NPM Page Structure Debug ===');
  
  // Log ALL elements that might contain version data
  console.log('🔍 Searching for elements with version patterns...');
  const allElements = document.querySelectorAll('*');
  const versionElements = [];
  
  for (const element of allElements) {
    const text = element.textContent || '';
    if (text.length > 20 && text.length < 1000) { // Reasonable length
      if (/\d+\.\d+\.\d+/.test(text) && /%/.test(text)) {
        versionElements.push({
          tag: element.tagName,
          class: element.className,
          id: element.id,
          testid: element.getAttribute('data-testid'),
          text: text.substring(0, 200),
          childCount: element.children.length
        });
      }
    }
  }
  
  console.log(`🎯 Found ${versionElements.length} elements with version+percentage patterns:`);
  versionElements.forEach((element, index) => {
    console.log(`  ${index}: ${element.tag} (class="${element.class}", id="${element.id}", testid="${element.testid}")`);
    console.log(`     Text: "${element.text}..."`);
    console.log(`     Children: ${element.childCount}`);
  });
  
  // Log all tables specifically
  const tables = document.querySelectorAll('table');
  console.log(`📊 Found ${tables.length} tables:`);
  tables.forEach((table, index) => {
    const rows = table.querySelectorAll('tr');
    const tableText = table.textContent?.substring(0, 200) || 'N/A';
    console.log(`  Table ${index}: ${rows.length} rows, text: "${tableText}..."`);
    
    // Check first few rows
    const firstRows = Array.from(table.querySelectorAll('tr')).slice(0, 3);
    firstRows.forEach((row, rowIdx) => {
      const cells = row.querySelectorAll('td, th');
      const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim()).filter(Boolean);
      console.log(`    Row ${rowIdx}: [${cellTexts.join(', ')}]`);
    });
  });
  
  // Look for divs that might be tables (modern frameworks often use divs)
  const divs = document.querySelectorAll('div');
  const tableLikeDivs = [];
  
  for (const div of divs) {
    const text = div.textContent || '';
    if (text.length > 50 && text.length < 2000) {
      const hasVersionPattern = /\d+\.\d+\.\d+/.test(text);
      const hasPercentage = /%/.test(text);
      const hasMultipleLines = text.includes('\n') || div.children.length > 3;
      
      if (hasVersionPattern && hasPercentage && hasMultipleLines) {
        tableLikeDivs.push({
          class: div.className,
          id: div.id,
          testid: div.getAttribute('data-testid'),
          text: text.substring(0, 300),
          childCount: div.children.length
        });
      }
    }
  }
  
  console.log(`📋 Found ${tableLikeDivs.length} divs that look like tables:`);
  tableLikeDivs.forEach((div, index) => {
    console.log(`  ${index}: div (class="${div.class}", id="${div.id}", testid="${div.testid}")`);
    console.log(`     Text: "${div.text}..."`);
    console.log(`     Children: ${div.childCount}`);
  });
  
  // Look for any element with "version" in attributes
  const versionAttrElements = document.querySelectorAll('[class*="version"], [id*="version"], [data-testid*="version"]');
  console.log(`🏷️ Found ${versionAttrElements.length} elements with version in attributes:`);
  versionAttrElements.forEach((element, index) => {
    console.log(`  ${index}: ${element.tagName}, class="${element.className}", id="${element.id}", testid="${element.getAttribute('data-testid')}"`);
  });
  
  console.log('🔍 === End Debug ===');
}