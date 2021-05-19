import HtmlRenderer from './html-render-api.js';

(async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  console.log('render 1');
  htmlRenderer.render(`\
    <h1>Lollercopter</h1>
  `);
  console.log('render 2');
})();