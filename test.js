import HtmlRenderer from './html-render-api.js';

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  console.log('render 1');
  const result = await htmlRenderer.render(`\
    <h1 style="font-family: RobotoCondensed-Light;">Lollercopter X</h1>
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