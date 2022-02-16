import fetch from 'node-fetch';

export default async function requestUrl(url) {
  const data = await fetch('http:'.concat(url), {
    method: 'GET',
  });
  const html = await data.text();
  return html;
}