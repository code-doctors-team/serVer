const normalizeHTML = html => html.split('\n').map(chunk => chunk.replace(/(\t|\r)/g, '').trim()).join('');

export default normalizeHTML;