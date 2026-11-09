/* Corporate Cattle Merit — i18n runtime (en / zh-Hant / ja) */
(function(){
  var DICT = window.CCM_I18N || {};
  var LANGS = ["en","zh-Hant","ja"];
  function detect(){
    try{
      var q = new URLSearchParams(location.search).get("lang");
      if(q && LANGS.indexOf(q)>=0) return q;
      var s = localStorage.getItem("ccm_lang");
      if(s && LANGS.indexOf(s)>=0) return s;
      var n = (navigator.language||"en").toLowerCase();
      if(n.indexOf("ja")===0) return "ja";
      if(n.indexOf("zh")===0 && (n.indexOf("tw")>=0||n.indexOf("hk")>=0||n.indexOf("hant")>=0||n.indexOf("mo")>=0)) return "zh-Hant";
      if(n.indexOf("zh")===0) return "zh-Hant";
    }catch(e){}
    return "en";
  }
  function apply(lang){
    document.documentElement.lang = (lang==="zh-Hant"?"zh-Hant":lang);
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var k = el.getAttribute("data-i18n");
      var v = (DICT[lang] && DICT[lang][k]) || (DICT.en && DICT.en[k]) || null;
      if(v!=null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function(el){
      var k = el.getAttribute("data-i18n-ph");
      var v = (DICT[lang] && DICT[lang][k]) || (DICT.en && DICT.en[k]) || "";
      if(v) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll(".lang button").forEach(function(b){
      var active = b.getAttribute("data-lang")===lang;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    try{ localStorage.setItem("ccm_lang", lang); }catch(e){}
    var titleKey = document.body.getAttribute("data-title-key");
    var t = titleKey ? ((DICT[lang] && DICT[lang][titleKey]) || (DICT.en && DICT.en[titleKey])) : ((DICT[lang] && DICT[lang]["meta.title"]) || (DICT.en && DICT.en["meta.title"]));
    if(t) {
      var brand = (DICT[lang] && DICT[lang]["brand.name"]) || (DICT.en && DICT.en["brand.name"]);
      document.title = titleKey && brand ? t + " — " + brand : t;
    }
    // Localise meta description / social preview tags for the active language.
    // NOTE: this runs client-side; crawlers that do not execute JS only ever see
    // the static (English) tags in index.html.
    var desc = (DICT[lang] && DICT[lang]["meta.description"]) || (DICT.en && DICT.en["meta.description"]);
    if(desc){
      setMeta("name","description",desc);
      setMeta("property","og:description",desc);
      setMeta("name","twitter:description",desc);
      var ot = (DICT[lang] && DICT[lang]["meta.title"]) || (DICT.en && DICT.en["meta.title"]);
      if(ot){
        setMeta("property","og:title",ot);
        setMeta("name","twitter:title",ot);
      }
    }
  }
  function setMeta(attr, key, value){
    var el = document.head.querySelector('meta['+attr+'="'+key+'"]');
    if(el) el.setAttribute("content", value);
  }
  window.CCM_setLang = function(l){ if(LANGS.indexOf(l)>=0){ apply(l); var u=new URL(location); u.searchParams.set("lang",l); history.replaceState(null,"",u); } };
  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll(".lang button").forEach(function(b){ b.addEventListener("click", function(){ window.CCM_setLang(b.getAttribute("data-lang")); }); });
    apply(detect());
  });
})();
