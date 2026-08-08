/**
 * JavaScript injected into the Custella web app when it runs inside the Android shell.
 *
 * It exists for one reason: **file downloads do not work in an Android WebView.**
 * The Excel export builds a Blob and clicks an <a download>. In a browser that saves a
 * file; in a WebView the click is simply swallowed and nothing happens — a core feature
 * silently broken, with no error for the shopkeeper to report.
 *
 * So we intercept the click, read the blob out as base64, and hand it to the native side,
 * which writes a real file and opens the Android share sheet. The web app is unchanged and
 * has no idea any of this happened.
 */
export const INJECTED_JS = `
(function(){
  if (window.__custellaShell) return;
  window.__custellaShell = true;

  var blobs = {};
  var createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(obj){
    var url = createObjectURL(obj);
    try { if (obj instanceof Blob) blobs[url] = obj; } catch(e){}
    return url;
  };

  function send(msg){
    try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e){}
  }

  function grab(href, name){
    var blob = blobs[href];
    if (!blob) return false;
    var reader = new FileReader();
    reader.onload = function(){
      send({ type: 'download', name: name || 'custella.xlsx', dataUrl: String(reader.result) });
    };
    reader.onerror = function(){ send({ type: 'downloadError' }); };
    reader.readAsDataURL(blob);
    return true;
  }

  // XLSX.writeFile and the CSV fallback both end in a programmatic anchor click.
  var click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    var href = this.getAttribute('href') || '';
    if (href.indexOf('blob:') === 0) {
      if (grab(href, this.getAttribute('download'))) return;
    }
    return click.apply(this, arguments);
  };

  // Tell the shell when the page is a customer-facing form, so the native back
  // button can warn instead of silently discarding a half-typed number.
  function reportRoute(){
    send({ type: 'route', hash: String(location.hash || '') });
  }
  window.addEventListener('hashchange', reportRoute);
  reportRoute();

  true;
})();
`;
