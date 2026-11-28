/* NGF · Identité v2 — réglages « Apparence » (couleur, thème, motif, texte, arrondis).
   Usage : <link rel="stylesheet" href="ngf-theme.css"><script src="ngf-theme.js"></script>
   Domaine de l'appli : <html data-ngf-domaine="Resto">  → couleur de départ. Ouvrir le panneau : NGFTheme.open() */
(function () {
  var KEY = 'ngf_apparence';
  var DOMAINES = { Hub: '#6D28D9', Resto: '#D62839', Commerce: '#EA6A12', Marketplace: '#15803D', Location: '#1F6B4F', Formation: '#2563EB', Don: '#B8862B' };
  var PRESETS = [
    { id: 'ivoire', nom: 'Ivoire doré', accent: '#B8862B', mode: 'auto', motif: 'visible' },
    { id: 'royal', nom: 'Violet royal', accent: '#6D28D9', mode: 'auto', motif: 'discret' },
    { id: 'bleu', nom: 'Bleu franc', accent: '#2563EB', mode: 'auto', motif: 'discret' },
    { id: 'terre', nom: 'Terre chaude', accent: '#C2693E', mode: 'auto', motif: 'visible' },
    { id: 'foret', nom: 'Vert profond', accent: '#1F6B4F', mode: 'auto', motif: 'discret' },
    { id: 'nuit', nom: 'Nuit douce', accent: '#8B5CF6', mode: 'sombre', motif: 'discret' }
  ];
  var COULEURS = ['#6D28D9', '#2563EB', '#D62839', '#EA6A12', '#B8862B', '#15803D', '#1F6B4F', '#0E7490'];
  var MOTIFS = { aucun: 0, discret: 0.1, visible: 0.22 };
  var RAYONS = { carre: 8, doux: 18, rond: 28 };

  function lire() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function ecrire(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function domaine() { return document.documentElement.getAttribute('data-ngf-domaine') || 'Hub'; }
  function defauts() { return { accent: null, mode: 'auto', motif: 'discret', texte: 100, rayon: 'doux', preset: null }; }
  var etat = Object.assign(defauts(), lire() || {});

  function surClair(hex) { // choisit texte blanc ou foncé selon la luminance de la couleur
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var l = (0.299 * r + 0.587 * g + 0.114 * b) / 255; return l > 0.62 ? '#1B1712' : '#FFFFFF';
  }
  function appliquer() {
    var r = document.documentElement, acc = etat.accent || DOMAINES[domaine()] || DOMAINES.Hub;
    r.style.setProperty('--ngf-accent', acc);
    r.style.setProperty('--ngf-on-accent', surClair(acc));
    var nn = parseInt(acc.slice(1), 16); r.style.setProperty('--ngf-accent-rgb', (nn >> 16) + ' ' + ((nn >> 8) & 255) + ' ' + (nn & 255));
    r.style.setProperty('--ngf-r', RAYONS[etat.rayon] + 'px');
    r.style.setProperty('--ngf-text', String(etat.texte / 100));
    r.style.setProperty('--ngf-motif', String(MOTIFS[etat.motif]));
    r.setAttribute('data-ngf-mode', etat.mode);
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', getComputedStyle(r).getPropertyValue('--bg').trim() || '#FBF8F2');
  }
  function sauver() { ecrire(etat); appliquer(); document.dispatchEvent(new CustomEvent('ngf-apparence', { detail: etat })); }

  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === 'class') e.className = a[k]; else if (k === 'onclick') e.onclick = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { e.append(c); }); return e; }
  function groupe(titre, items, courant, choisir) {
    var row = el('div', { class: 'row' }); items.forEach(function (it) {
      var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': String(courant === it[0]) }, [it[1]]);
      b.onclick = function () { choisir(it[0]); ouvrir(true); }; row.append(b);
    }); return [el('h3', {}, [titre]), row];
  }
  var panneau, voile;
  function fermer() { if (panneau) panneau.remove(); if (voile) voile.remove(); panneau = voile = null; }
  function ouvrir(garder) {
    var acc = (etat.accent || DOMAINES[domaine()] || DOMAINES.Hub).toUpperCase();
    var scroll = panneau ? panneau.scrollTop : 0; fermer();
    voile = el('div', { class: 'ngf-ap-scrim' }); voile.onclick = fermer;
    panneau = el('div', { class: 'ngf-ap', role: 'dialog', 'aria-label': 'Apparence' });
    panneau.append(el('h2', {}, ['Apparence']), el('div', { style: 'color:var(--muted)' }, ['Choisis ce qui te plaît : tout change tout de suite.']));
    panneau.append(el('h3', {}, ['Thèmes prêts']));
    var pr = el('div', { class: 'row' });
    PRESETS.forEach(function (p) {
      var b = el('button', { class: 'preset', type: 'button', 'aria-pressed': String(etat.preset === p.id) }, [el('i', { style: 'background:' + p.accent }), p.nom]);
      b.onclick = function () { etat.accent = p.accent; etat.mode = p.mode; etat.motif = p.motif; etat.preset = p.id; sauver(); ouvrir(true); }; pr.append(b);
    }); panneau.append(pr);
    panneau.append(el('h3', {}, ['Ta couleur']));
    var sw = el('div', { class: 'row', style: 'align-items:center' });
    COULEURS.forEach(function (c) { var b = el('button', { class: 'sw', type: 'button', style: 'background:' + c, 'aria-label': 'Couleur ' + c, 'aria-pressed': String(acc === c.toUpperCase()) });
      b.onclick = function () { etat.accent = c; etat.preset = null; sauver(); ouvrir(true); }; sw.append(b); });
    var pick = el('input', { type: 'color', value: acc.toLowerCase(), 'aria-label': 'Autre couleur' });
    pick.oninput = function () { etat.accent = pick.value; etat.preset = null; sauver(); };
    pick.onchange = function () { ouvrir(true); };
    sw.append(pick); panneau.append(sw);
    groupe('Ambiance', [['auto', 'Selon le téléphone'], ['clair', 'Clair'], ['sombre', 'Sombre doux']], etat.mode, function (v) { etat.mode = v; etat.preset = null; sauver(); }).forEach(function (n) { panneau.append(n); });
    groupe('Motif africain', [['aucun', 'Aucun'], ['discret', 'Discret'], ['visible', 'Visible']], etat.motif, function (v) { etat.motif = v; etat.preset = null; sauver(); }).forEach(function (n) { panneau.append(n); });
    groupe('Arrondi des formes', [['carre', 'Net'], ['doux', 'Doux'], ['rond', 'Très rond']], etat.rayon, function (v) { etat.rayon = v; sauver(); }).forEach(function (n) { panneau.append(n); });
    panneau.append(el('h3', {}, ['Taille du texte']));
    var rg = el('input', { type: 'range', min: '90', max: '125', step: '5', value: String(etat.texte), 'aria-label': 'Taille du texte' });
    rg.oninput = function () { etat.texte = Number(rg.value); sauver(); }; panneau.append(rg);
    var rst = el('button', { class: 'ngf-btn ghost', type: 'button' }, ['Tout remettre']); rst.onclick = function () { etat = defauts(); sauver(); ouvrir(true); };
    var ok = el('button', { class: 'ngf-btn', type: 'button' }, ['Terminé']); ok.onclick = fermer;
    panneau.append(el('div', { class: 'foot' }, [rst, ok]));
    document.body.append(voile, panneau); panneau.scrollTop = scroll;
  }
  window.NGFTheme = { open: function () { ouvrir(false); }, get: function () { return etat; }, set: function (o) { Object.assign(etat, o); sauver(); }, presets: PRESETS };
  appliquer();
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', appliquer); } catch (e) {} }
})();
