import HtmlRenderer from './html-render-api.js';
import {uint8ArrayToArrayBuffer} from './utils.js';

const svgMimeType = 'image/svg+xml';
const testImgUrl = 'https://127.0.0.1:3001/assets/popup3.svg'/*'https://app.webaverse.com/assets/popup3.svg'*/;
const testUserImgUrl = `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?nocache=1`;

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
const textEncoder = new TextEncoder();

const _loadImage = b => new Promise((accept, reject) => {
  const _cleanup = () => {
    URL.revokeObjectURL(u);
  };
  
  const u = URL.createObjectURL(b);
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = u;
  img.onload = () => {
    accept(img);
    _cleanup();
  };
  img.onerror = err => {
    reject(err);
    _cleanup();
  };
});
const _imgToImageData = img => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
};

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  console.log('render 1');

  const result = await (async () => {
    const {s, doc} = await (async () => {
      const res = await fetch(testImgUrl);
      const s = await res.text();
      const doc = domParser.parseFromString(s, svgMimeType);
      return {s, doc};
    })();
    window.s = s;
    window.doc = doc;
    
    const creatorImageEl = doc.querySelector('#creator-image');
    // creatorImageEl.parentNode.removeChild(creatorImageEl);
    
    const ownerImageData = await (async () => {
      const res = await fetch(testUserImgUrl);
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
    
    const s2 = xmlSerializer.serializeToString(doc);
    const b = new Blob([
      s2,
    ], {
      type: svgMimeType,
    });
    // console.log('load image 1', b);
    const img = await _loadImage(b);
    // document.body.appendChild(img);
    // console.log('load image 2', b, img);
    const result = _imgToImageData(img);
    return result;
    
    /* const res = await fetch(testImgUrl);
    const b = await res.blob();
    const img = await _loadImage(b);
    document.body.appendChild(img);
    const result = _imgToImageData(img);
    return result; */
  })();
  
  const canvas = document.getElementById('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(result.width, result.height);
  imageData.data.set(result.data);
  ctx.putImageData(imageData, 0, 0);
  
  console.log('render 2');
})();