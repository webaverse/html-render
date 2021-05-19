import HtmlRenderer from './html-render-api.js';
import {getDefaultStyles} from './default-styler.js';
import {uint8ArrayToArrayBuffer} from './utils.js';

const width = 600;
const svgMimeType = 'image/svg+xml';
const testImgUrl = 'https://127.0.0.1:3001/assets/popup3.svg'/*'https://app.webaverse.com/assets/popup3.svg'*/;
const testUserImgUrl = `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?width=128&height=128`;

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
const convertCanvas = document.createElement('canvas');
const _imgToImageData = img => {
  // console.log('got image spec', img.width, img.height, img.naturalWidth, img.naturalHeight);
  convertCanvas.width = img.naturalWidth;
  convertCanvas.height = img.naturalHeight;
  const ctx = convertCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, convertCanvas.width, convertCanvas.height);
  return imageData;
};
const _getImageDataString = async u => {
  console.time('lol 1');
  const res = await fetch(u);
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  console.timeEnd('lol 1');
  console.time('lol 2');
  const s = `data:image/png;base64,` + uint8ArrayToArrayBuffer(uint8Array);
  console.timeEnd('lol 2');
  return s;
};

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  // console.log('render 1');
  
  console.time('render');

  const result = await (async () => {
    console.time('render 1');
    const {
      s,
      doc,
      creatorImageData,
      ownerImageData,
    } = await (async () => {
      const [
        {
          s,
          doc,
        },
        creatorImageData,
      ] = await Promise.all([
        (async () => {
          const res = await fetch(testImgUrl);
          const s = await res.text();
          const doc = domParser.parseFromString(s, svgMimeType);
          return {s, doc};
        })(),
        (async () => {
          const creatorImageData = await _getImageDataString(testUserImgUrl);
          return creatorImageData;
        })(),
      ]);
      const ownerImageData = creatorImageData;
      return {
        s,
        doc,
        creatorImageData,
        ownerImageData,
      };
    })();
    console.timeEnd('render 1');
    
    console.time('render 2');
    const creatorImageEl = doc.querySelector('#creator-image');
    creatorImageEl.setAttribute('xlink:href', creatorImageData);
    
    const ownerImageEl = doc.querySelector('#owner-image')
    ownerImageEl.setAttribute('xlink:href', ownerImageData);
    console.timeEnd('render 2');
    
    console.time('render 3');
    let s2 = xmlSerializer.serializeToString(doc);
    console.timeEnd('render 3');
    
    console.time('render 4');
    const stylePrefix = getDefaultStyles();
    s2 = s2.replace(/(<style)/, stylePrefix + '$1');
    console.timeEnd('render 4');
    
    console.time('render 5');
    const b = new Blob([
      s2,
    ], {
      type: svgMimeType,
    });
    // console.log('load image 1', b);
    const img = await _loadImage(b);
    console.timeEnd('render 5');
    
    console.time('render 6');
    const result = _imgToImageData(img);
    console.timeEnd('render 6');
    // console.log('got result', result);
    return result;
    
    /* const res = await fetch(testImgUrl);
    const b = await res.blob();
    const img = await _loadImage(b);
    document.body.appendChild(img);
    const result = _imgToImageData(img);
    return result; */
  })();
  
  console.timeEnd('render');
  
  const canvas = document.getElementById('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  canvas.style.cssText = `\
    width: ${result.width / window.devicePixelRatio}px;
    width: ${result.height / window.devicePixelRatio}px;
  `;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(result.width, result.height);
  imageData.data.set(result.data);
  ctx.putImageData(imageData, 0, 0);
  
  // console.log('render 2');
})();