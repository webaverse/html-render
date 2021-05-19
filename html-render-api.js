class HtmlRenderer {
  constructor() {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://127.0.0.1:2223'; // 'https://html-render.webaverse.com/';
    iframe.style.cssText = `\
      position: absolute;
      top: -10000;
      left: -10000;
      visibility: hidden;
    `;
    this.iframe = iframe;
    document.body.appendChild(iframe);
    
    this.ids = 0;
    
    this.loadPromise = (async () => {
      await new Promise((accept, reject) => { 
        iframe.addEventListener('load', e => {
         accept();
        });
        iframe.addEventListener('error', reject);
      });
    })();
  }
  destroy() {
    document.body.removeChild(this.iframe);
    this.iframe = null;
  }
  async waitForLoad() {
    return await this.loadPromise;
  }
  render(htmlString) {
    const {contentWindow} = this.iframe;
    
    const messageChannel = new MessageChannel();
    messageChannel.port2.addEventListener('message', e => {
      console.log('got result', e.data.error, e.data.result);
      const {error, result} = e.data;
      
      if (!error) {
        const canvas = document.getElementById('canvas');
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(result.width, result.height);
        imageData.data.set(result.data);
        ctx.putImageData(imageData, 0, 0);
      } else {
        throw new Error(error);
      }
    });
    messageChannel.port2.start();
    
    {
      const id = ++this.ids;
      const templateData = null;
      const width = canvas.width;
      const height = canvas.height;
      const transparent = true;
      const bitmap = null;
      const port = messageChannel.port1;
      // console.log('post message 1');
      contentWindow.postMessage({
        method: 'render',
        id,
        htmlString,
        templateData,
        width,
        height,
        transparent,
        bitmap,
        port,
      }, '*', [port]);
      // console.log('post message 2');
    }
  }
}
export default HtmlRenderer;