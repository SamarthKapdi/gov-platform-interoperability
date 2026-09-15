function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseXmlList(xml, itemTag) {
  const regex = new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, 'gi');
  const items = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function parseXmlItemToObject(xml) {
  const regex = /<([^>]+)>([^<]+)<\/\1>/g;
  const obj = {};
  let match;
  while ((match = regex.exec(xml)) !== null) {
    obj[match[1]] = match[2].trim();
  }
  return obj;
}

module.exports = {
  extractTag,
  parseXmlList,
  parseXmlItemToObject
};
