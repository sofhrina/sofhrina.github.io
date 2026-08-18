import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(read('vendor/d3.min.js'), context);
vm.runInContext(read('vendor/topojson-client.min.js'), context);

const topo = JSON.parse(read('vendor/countries-110m.json'));
const geo = context.topojson.feature(topo, topo.objects.countries);
const projection = context.d3.geoNaturalEarth1().fitExtent([[10, 10], [890, 450]], geo);
const path = context.d3.geoPath(projection);

const visited = new Set([
  'Japan', 'South Korea', 'Korea, Rep.', 'Republic of Korea', 'Malaysia',
  'Singapore', 'Vietnam', 'Viet Nam', 'Thailand', 'Switzerland', 'Finland',
  'France', 'Germany', 'Italy', 'Spain', 'Austria', 'Netherlands', 'Belgium',
  'United Kingdom', 'China'
]);

const regions = [
  ['Shandong', 36.4, 118.1], ['Jiangsu', 33.0, 120.0],
  ['Shanghai', 31.2, 121.5], ['Zhejiang', 29.2, 120.2],
  ['Anhui', 31.9, 117.2], ['Tianjin', 39.1, 117.2],
  ['Beijing', 39.9, 116.4], ['Henan', 34.0, 113.6],
  ['Shanxi', 37.6, 112.3], ['Shaanxi', 35.4, 109.0],
  ['Sichuan', 30.6, 102.9], ['Hubei', 30.9, 112.3],
  ['Guangdong', 23.4, 113.4], ['Hong Kong', 22.3, 114.2],
  ['Macau', 22.2, 113.5], ['Taiwan', 23.7, 121.0]
];

const escapeAttribute = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const renderFeature = (feature, label, cssClass, country = label) =>
  `<path class="${cssClass}" d="${path(feature)}" data-country="${escapeAttribute(country)}" data-n="${escapeAttribute(label)}"><title>${escapeAttribute(label)}</title></path>`;

let shapes = geo.features.flatMap((feature) => {
  const name = feature.properties.name || '';
  if (name === 'France' && feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates.map((coordinates) => {
      const part = {
        type: 'Feature',
        properties: feature.properties,
        geometry: { type: 'Polygon', coordinates }
      };
      const [longitude] = context.d3.geoCentroid(part);
      const isFrenchGuiana = longitude < -20;
      return renderFeature(
        part,
        isFrenchGuiana ? 'French Guiana (France)' : 'France',
        isFrenchGuiana ? 'land' : 'been',
        'France'
      );
    });
  }

  return [renderFeature(feature, name, visited.has(name) ? 'been' : 'land')];
}).join('');

for (const [name, latitude, longitude] of regions) {
  const point = projection([longitude, latitude]);
  if (!point) continue;
  shapes += `<circle class="cn" cx="${point[0].toFixed(1)}" cy="${point[1].toFixed(1)}" r="3.4" data-n="${escapeAttribute(name)}"><title>${escapeAttribute(name)}</title></circle>`;
}

const svg = `<svg id="worldmap" viewBox="0 0 900 460" role="img" aria-label="World map of places visited">${shapes}</svg>`;
const restUrl = new URL('rest.html', root);
const html = fs.readFileSync(restUrl, 'utf8');
const pattern = /<svg id="worldmap" viewBox="0 0 900 460" role="img" aria-label="World map of places visited">[\s\S]*?<\/svg>/;

if (!pattern.test(html)) throw new Error('World map placeholder was not found.');
fs.writeFileSync(restUrl, html.replace(pattern, svg));
console.log(`Inlined ${geo.features.length} countries and ${regions.length} region markers.`);
