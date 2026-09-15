function parseXmlToObjects(xmlString, recordTag = 'applicant') {
  const records = [];
  const regexRecord = new RegExp(`<${recordTag}>(.*?)<\/${recordTag}>`, 'gs');
  let match;
  while ((match = regexRecord.exec(xmlString)) !== null) {
    const innerXml = match[1];
    const obj = {};
    const tagRegex = /<([a-zA-Z0-9_]+)>(.*?)<\/\1>/gs;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(innerXml)) !== null) {
      obj[tagMatch[1]] = tagMatch[2].trim();
    }
    records.push(obj);
  }
  return records;
}

module.exports = { parseXmlToObjects };
