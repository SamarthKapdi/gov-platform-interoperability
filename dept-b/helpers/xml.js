function escapeXml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe).replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function objectToXml(obj) {
  let xml = '';
  for (const [key, value] of Object.entries(obj)) {
    const safeValue = escapeXml(value);
    xml += `<${key}>${safeValue}</${key}>`;
  }
  return xml;
}

function toXml(tagName, obj) {
  if (!obj) return `<${tagName} />`;
  return `<${tagName}>${objectToXml(obj)}</${tagName}>`;
}

function toXmlList(wrapperTag, itemTag, items) {
  if (!items || !items.length) return `<${wrapperTag} />`;
  const itemsXml = items.map(item => toXml(itemTag, item)).join('');
  return `<${wrapperTag}>${itemsXml}</${wrapperTag}>`;
}

module.exports = { toXml, toXmlList, escapeXml };
