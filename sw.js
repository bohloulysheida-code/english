var CACHE = "hezar-saat-v2";
var SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);

  // Google Fonts: cache on first success, fall back to cache when offline.
  if(url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(
      caches.open(CACHE).then(function(c){
        return c.match(req).then(function(hit){
          var net = fetch(req).then(function(res){
            if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
            return res;
          }).catch(function(){ return hit; });
          return hit || net;
        });
      })
    );
    return;
  }

  // Never cache YouTube or anything off-origin else.
  if(url.origin !== self.location.origin) return;

  // App shell: cache first, refresh in background.
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return hit || caches.match("./index.html");
      });
      return hit || net;
    })
  );
});
