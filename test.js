import HtmlRenderer from './html-render-api.js';

// const width = 600;
const testImgUrl = 'https://127.0.0.1:3001/assets/popup3.svg'/*'https://app.webaverse.com/assets/popup3.svg'*/;
const testUserImgUrl = `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?width=128&height=128`;

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  
  const result = await htmlRenderer.renderPopup({
    imgUrl: testImgUrl,
    minterAvatarUrl: testUserImgUrl,
    ownerAvatarUrl: testUserImgUrl,
    transparent: true,
  });
  console.log('got result', result);
  
  const canvas = document.getElementById('canvas');
  console.log('got width', result);
  canvas.width = result.width;
  canvas.height = result.height;
  canvas.style.cssText = `\
    width: ${result.width / window.devicePixelRatio}px;
    width: ${result.height / window.devicePixelRatio}px;
  `;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(result, 0, 0);
  
  // console.log('render 2');
})();