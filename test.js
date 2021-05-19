(async () => {
  const iframe = document.getElementById('iframe');
  iframe.src = 'https://127.0.0.1:2223'; // 'https://html-render.webaverse.com/';
  iframe.addEventListener('load', e => {
    const {contentWindow} = iframe;
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
      const port = messageChannel.port1;
      // console.log('post message 1');
      contentWindow.postMessage({
        method: 'render',
        port,
      }, '*', [port]);
      // console.log('post message 2');
    }
  });
})();