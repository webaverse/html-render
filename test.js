import HtmlRenderer from './html-render-api.js';
import {uint8ArrayToArrayBuffer} from './utils.js';

const svgMimeType = 'image/svg+xml';

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  console.log('render 1');
  
  
  const res = await fetch('https://127.0.0.1:3001/assets/popup3.svg'/*'https://app.webaverse.com/assets/popup3.svg'*/);
  const s = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(s, svgMimeType);
  window.s = s;
  window.doc = doc;
  
  const creatorImageEl = doc.querySelector('#creator-image');
  // creatorImageEl.parentNode.removeChild(creatorImageEl);
  
  const ownerImageData = await (async () => {
    const res = await fetch( `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?nocache=1`);
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const s = `data:image/png;base64,` + uint8ArrayToArrayBuffer(uint8Array);
    return s;
  })();
  const oldUrl = creatorImageEl.getAttribute('xlink:href');
  creatorImageEl.setAttribute('xlink:href', ownerImageData);
  
  // console.log('change urls', [oldUrl, ownerImageData]);
  
  const ownerImageEl = doc.querySelector('#creator-image')
  // console.log('got els', creatorImageEl, ownerImageEl);
  // XXX finish this
  
  const xmlSerializer = new XMLSerializer();
  const s2 = xmlSerializer.serializeToString(doc);
  console.log('got s2', s2);
  const textEncoder = new TextEncoder();
  const ab = textEncoder.encode(s2);
  const uint8Array = new Uint8Array(ab);
  const s3 = `data:${svgMimeType};base64,` + uint8ArrayToArrayBuffer(uint8Array);
  
  // const svgBlob = ;
  
  const result = await htmlRenderer.render(`\
    <h1 style="font-family: RobotoCondensed-Light;">Lollercopter X</h1>
    <img src="${s3}">
  `);
  
  const canvas = document.getElementById('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(result.width, result.height);
  imageData.data.set(result.data);
  ctx.putImageData(imageData, 0, 0);
  
  console.log('render 2');
})();