export const origin = 'https://padlab.m-usmanaslam18101999.workers.dev';
export const publicPath = file => '/' + file.replace(/^\//, '').replace(/index\.html$/, '').replace(/\.html$/, '');
export function normalizeUrls(html) {
  return html.replace(/((?:https:\/\/padlab\.m-usmanaslam18101999\.workers\.dev)?\/[\w/-]+)\.html(?=["#<])/g, '$1').replaceAll('href="/#guides"', 'href="/guides/"');
}
