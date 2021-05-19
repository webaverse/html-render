import Mustache from './mustache.js';
import {PCancelable} from './p-cancelable.js';
import lruCache from './lru-cache.js';

const base64 = (function(){
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  function encode(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  }
  function decode(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  }
  return {
    encode,
    decode,
  };
})();
/* const _getProxyUrl = src => {
  const parsedUrl = new URL(src);
  parsedUrl.host = parsedUrl.host.replace(/-/g, '--');
  return 'https://' + parsedUrl.origin.replace(/^(https?):\/\//, '$1-').replace(/:([0-9]+)$/, '-$1').replace(/\./g, '-') + '.proxy.exokit.org' + parsedUrl.pathname + parsedUrl.search;
}; */

const fontFiles = [
  /*'mem5YaGs126MiZpBA-UN_r8OUuhp.woff2',
  'fa-brands-400.woff2',
  'fa-duotone-900.woff2',
  'fa-light-300.woff2',
  'fa-regular-400.woff2',
  'fa-solid-900.woff2',
  'font-awesome.css', */
  // 'Bangers-Regular.woff2',
  'RobotoCondensed-Light.ttf',
  'RobotoCondensed-Regular.ttf',
];
const cssFiles = [
  /* 'open-sans.css',
  'font-awesome.css', */
  // 'bangers.css',
  'robotocondensed-light.css',
  'robotocondensed-regular.css',
];
const fontFileCache = {};
const cssFileCache = {};
let stylePrefix;

const loadPromise = Promise.all(
  fontFiles.map(u =>
    fetch(u)
      .then(res => res.arrayBuffer())
      .then(arraybuffer => {
        fontFileCache[u] = base64.encode(arraybuffer);
      })
  ).concat(cssFiles.map(u =>
    fetch(u)
      .then(res => res.text())
      .then(text => {
        cssFileCache[u] = text.replace(/#/g, '%23');
      })
  ))
).then(async () => {
  for (const k in cssFileCache) {
    let s = cssFileCache[k];
    const ext = k.match(/\.([^\.]+)$/)[1];

    const regex = /(url\()([^\)]+)(\))/g;
    let match;
    while (match = regex.exec(s)) {
      // const res = await fetch(match[2]);
      // if (res.status >= 200 && res.status < 300) {
        // const arraybuffer = await res.arrayBuffer();
        // const b64 = base64.encode(arraybuffer);
        const b64 = fontFileCache[match[2]];
        const inner = match[1] + `"data:font/${ext};charset=utf-8;base64,${b64}"` + match[3];
        s = s.slice(0, match.index) + inner + s.slice(match.index + match[0].length);
        regex.lastIndex = match.index + inner.length;
      /* } else {
        return Promise.reject(new Error(`invalid status code: ${res.status}`));
      } */
    }

    cssFileCache[k] = s;
  }

  stylePrefix = `<style>body {margin: 0;} * {box-sizing: border-box;}</style>` + Object.keys(cssFileCache).map(k => `<style>${cssFileCache[k]}</style>`).join('');
});

const canvas = document.createElement('canvas');
canvas.width = 2048;
canvas.height = 2048;
const ctx = canvas.getContext('2d');
// ctx.fillStyle = 'white';
// ctx.fillRect(0, 0, canvas.width, canvas.height);
// ctx.translate(0, canvas.height);
// ctx.scale(1, -1);

const imgCache = new lruCache({
  max: 50,
});
const _getImgDataUrl = async src => {
  if (src && /^https?:/.test(src)) {
    const entry = imgCache.get(src);
    if (entry) {
      return entry;
    } else {
      const dataUrl = await new Promise((accept, reject) => {
        const newImg = new Image();
        newImg.crossOrigin = 'Anonymous';
        newImg.onload = () => {
          accept(newImg);
        };
        newImg.onerror = err => {
          console.warn(err);
          accept(null);
        };
        newImg.src = src;
      })
      .then(oldImg => {
        if (oldImg) {
          const canvas = document.createElement('canvas');
          canvas.width = oldImg.width;
          canvas.height = oldImg.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(oldImg, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          return dataURL;
        } else {
          return null;
        }
      });
      dataUrl && imgCache.set(src, dataUrl);
      return dataUrl;
    }
  } else {
    return src;
  }
};

window.render = (htmlString, templateData, width, height, transparent, bitmap) => new PCancelable((accept, reject, onCancel) => {
let cancelled = false;
onCancel(() => {
  cancelled = true;
});
(async () => {
  await loadPromise;
  if (cancelled) return;

  let error, result;
  try {
    const renderedHtmlString = templateData ? Mustache.render(htmlString, templateData) : htmlString;
    const dom = new DOMParser().parseFromString(renderedHtmlString, 'text/html');
    const {head, body} = dom;
    const html = body.parentNode;
    // console.log('got dom', html);

    const styles = [];
    Array.from(html.querySelectorAll('style')).forEach(style => {
      styles.push(style.textContent);
    });
    /* await Promise.all(Array.from(html.querySelectorAll('link')).map(link => new Promise((accept, reject) => {
      if (link.rel === 'stylesheet' && link.href) {
        fetch(link.href)
          .then(res => {
            if (res.status >= 200 && res.status < 300) {
              return res.text();
            } else {
              return Promise.reject(new Error(`invalid status code: ${res.status}`));
            }
          })
          .then(async s => {
            const regex = /(url\()([^\)]+)(\))/g;
            let match;
            while (match = regex.exec(s)) {
              const res = await fetch(match[2]);
              if (res.status >= 200 && res.status < 300) {
                const arraybuffer = await res.arrayBuffer();
                const b64 = base64.encode(arraybuffer);
                const inner = match[1] + '"data:font/woff;charset=utf-8;base64,' + b64 + '"' + match[3];
                s = s.slice(0, match.index) + inner + s.slice(match.index + match[0].length);
                regex.lastIndex = match.index + inner.length;
              } else {
                return Promise.reject(new Error(`invalid status code: ${res.status}`));
              }
            }

            // console.log('got style text', s);
            // const style = document.createElement('style');
            // style.textContent = s;
            // console.log('got style', style);
            styles.push(s);
          })
          .then(accept)
          .catch(err => {
            console.warn(err);
            accept();
          });
      } else {
        accept();
      }
    }))); */

    Array.from(html.querySelectorAll('script')).forEach(script => {
      script.parentNode.removeChild(script);
    });

    // console.log('got 2');

    await Promise.all(
      Array.from(html.querySelectorAll('img'))
        .map(async img => {
          const dataUrl = await _getImgDataUrl(img.src);
          /* if (!dataUrl) {
            console.warn('fail', img, img.src, dataUrl);
            debugger;
          } */

          await new Promise((accept, reject) => {
            const newImg = new Image();
            newImg.setAttribute('class', img.getAttribute('class'));
            newImg.onload = () => {
              img.replaceWith(newImg);
              accept();
            };
            newImg.onerror = err => {
              console.warn(err);
              accept();
            };
            newImg.src = dataUrl;
          });
        })
    );
    if (cancelled) return;

    // console.log('got 3');

    const o = await new Promise((accept, reject) => {
      const start = Date.now();

      const img = new Image();
      img.src = ('data:image/svg+xml;charset=utf-8,' +
        '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'' + width + '\' height=\'' + height + '\'>' +
          stylePrefix + 
          styles.map(style => '<style>' + style + '</style>').join('') +
          '<foreignObject width=\'100%\' height=\'100%\' x=\'0\' y=\'0\'' + (transparent ? '' : ' style=\'background-color: white;\'') + '>' +
            new XMLSerializer().serializeToString(body) +
          '</foreignObject>' +
        '</svg>').replace(/#/g, '%23');
      // .replace(/\n/g, '');
      // console.log('got src', img.src);
      // img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (cancelled) return;

        console.log('got img time', Date.now() - start);

        const {naturalWidth: width, naturalHeight: height} = img;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        (() => {
          if (!bitmap) {
            let {data} = imageData;
            data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            return Promise.resolve(data);
          } else {
            return createImageBitmap(imageData);
          }
        })().then(data => {
          if (cancelled) return;

          document.head.appendChild(head);
          document.body.appendChild(body);

          const anchors = ['a', 'nav', 'input']
            .flatMap(q => Array.from(body.querySelectorAll(q)))
            .map(el => {
              const {id, href, name} = el;
              if (!id && !href) {
                console.warn('anchor missing id or href', el);
              }
              const rect = JSON.parse(JSON.stringify(el.getBoundingClientRect()));
              return Object.assign(rect, {id, href, name});
            });

          document.head.removeChild(head);
          document.body.removeChild(body);

          accept([null, {width, height, data, anchors}]);
        }, err => {
          if (cancelled) return;

          accept([err.stack, null]);
        });
      };
      img.onerror = err => {
        console.warn('img error', err);
        accept([err.stack, null]);
      };
    });
    if (cancelled) return;

    // console.log('got 4', !!error, !!result);

    error = o[0];
    result = o[1];
  } catch (err) {
    error = err.stack;
  }

  return {error, result};
})()
  .then(accept, reject);
});

let currentPromise = null;
const queue = [];
const _handleMessage = async data => {
  const {method} = data;

  switch (method) {
    case 'render': {
      if (!currentPromise) {
        const {id, htmlString, templateData, width, height, transparent, bitmap, port} = data;
        const localCurrentPromise = currentPromise = window.render(htmlString, templateData, width, height, transparent, bitmap);
        localCurrentPromise.id = id;
        const o = await localCurrentPromise;
        if (localCurrentPromise === currentPromise) {
          const {error, result} = o;
          if (error || result) {
            port.postMessage({error, result}, [ArrayBuffer.isView(result.data) ? result.data.buffer : result.data]);
          }

          currentPromise = null;
          if (queue.length > 0) {
            _handleMessage(queue.shift());
          }
        }
      } else {
        queue.push(data);
      }
      break;
    }
    case 'cancel': {
      const {id} = data;
      if (currentPromise && currentPromise.id === id) {
        const localCurrentPromise = currentPromise;
        currentPromise = null;
        localCurrentPromise.cancel();

        if (queue.length > 0) {
          _handleMessage(queue.shift());
        }
      } else {
        const index = queue.findIndex(e => e.id === id);
        if (index !== -1) {
          queue.splice(index, 1);
        }
      }
      break;
    }
  }
};
window.addEventListener('message', e => {
  const {data} = e;
  if (data && data.method) {
    _handleMessage(data);
  }
});

/* window.onload = () => {
  const _recurse = () => {
    console.log('start work');
    let start = Date.now();
    for (;;) {
      if ((Date.now() - start) < 3000) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        document.body.removeChild(div);
      } else {
        break;
      }
    }
    setTimeout(_recurse, 1000);
    console.log('end work');
  };
  _recurse();
}; */