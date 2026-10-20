(function(){
  var main=document.getElementById('main');

  // Skip link
  document.querySelector('[data-skip]').addEventListener('click',function(e){e.preventDefault();main.focus();main.scrollIntoView();});

  // Dropdown escritorio
  var dd=document.querySelector('.dropdown'), trig=dd.querySelector('button');
  function setDD(open){ dd.dataset.open=open; trig.setAttribute('aria-expanded',open); }
  trig.addEventListener('click',function(){ setDD(dd.dataset.open!=='true'); });
  dd.addEventListener('mouseenter',function(){ if(matchMedia('(hover:hover)').matches) setDD(true); });
  dd.addEventListener('mouseleave',function(){ if(matchMedia('(hover:hover)').matches) setDD(false); });
  dd.addEventListener('focusout',function(e){ if(!dd.contains(e.relatedTarget)) setDD(false); });

  // Menú móvil
  var tog=document.querySelector('.menu-toggle'), panel=document.getElementById('mobile-panel');
  function setPanel(open){
    panel.dataset.open=open; tog.setAttribute('aria-expanded',open);
    tog.setAttribute('aria-label', open?'Cerrar menú':'Abrir menú');
    document.body.style.overflow=open?'hidden':'';
    if(open) panel.querySelector('a').focus();
  }
  tog.addEventListener('click',function(){ setPanel(panel.dataset.open!=='true'); });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      if(panel.dataset.open==='true'){ setPanel(false); tog.focus(); }
      if(dd.dataset.open==='true'){ setDD(false); trig.focus(); }
    }
  });
  // Al volver con el botón Atrás desde la caché, el menú no debe quedar abierto
  window.addEventListener('pageshow',function(){ setDD(false); if(panel.dataset.open==='true') setPanel(false); });

  document.getElementById('year').textContent=new Date().getFullYear();

  // Formulario
  var form=document.getElementById('contact-form');
  if(!form) return;
  var status=document.getElementById('form-status'), btn=document.getElementById('f-submit');

  // Preseleccionar tema desde la URL (?tema=juridico)
  var t=new URLSearchParams(location.search).get('tema');
  if(t){ var radio=form.querySelector('input[name="tema"][value="'+t+'"]'); if(radio) radio.checked=true; }

  var msgs={nombre:'Escribe tu nombre para saber cómo dirigirnos a ti.',cargo:'Indica tu cargo; nos ayuda a preparar la conversación.',empresa:'Escribe el nombre de tu empresa.',correo:'Revisa el correo; debe verse como nombre@empresa.com.',tema:'Elige el tema que más se acerque a lo que quieres resolver.'};
  function setErr(name,msg){
    var el=document.getElementById('e-'+name); el.textContent=msg||'';
    var f=el.closest('.field'); if(f) f.dataset.invalid=msg?'true':'false';
    var inp=form.elements[name]; if(inp && inp.setAttribute) inp.setAttribute('aria-invalid',msg?'true':'false');
  }
  function validate(){
    var firstBad=null;
    ['nombre','cargo','empresa','correo'].forEach(function(n){
      var v=form.elements[n].value.trim(); form.elements[n].value=v;
      var bad=!v || (n==='correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      setErr(n,bad?msgs[n]:''); if(bad&&!firstBad) firstBad=form.elements[n];
    });
    var tema=form.querySelector('input[name="tema"]:checked');
    setErr('tema',tema?'':msgs.tema); if(!tema&&!firstBad) firstBad=form.querySelector('input[name="tema"]');
    return firstBad;
  }
  form.addEventListener('input',function(e){ if(e.target.name && document.getElementById('e-'+e.target.name) && document.getElementById('e-'+e.target.name).textContent) validate(); });
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var bad=validate();
    if(bad){ bad.focus(); return; }
    btn.setAttribute('aria-busy','true'); btn.disabled=true; btn.lastElementChild.textContent='Enviando…';
    status.textContent=''; delete status.dataset.state;
    var d=new FormData(form), temaTxt=form.querySelector('input[name="tema"]:checked').nextElementSibling.textContent;
    var payload={
      access_key:d.get('access_key'),
      Nombre:d.get('nombre'), Cargo:d.get('cargo'), Empresa:d.get('empresa'), Correo:d.get('correo'),
      Tema:temaTxt, Mensaje:d.get('mensaje')||'',
      'Finalidad secundaria':d.get('no_publicidad')?'Se opone (no enviar publicaciones ni invitaciones)':'No se opone',
      subject:'Contacto web: '+temaTxt+' — '+d.get('empresa'),
      from_name:'Sitio web IRALTUS', replyto:d.get('correo'), botcheck:d.get('botcheck')||''
    };
    function done(){ btn.removeAttribute('aria-busy'); btn.disabled=false; btn.lastElementChild.textContent='Enviar mensaje'; }
    fetch('https://api.web3forms.com/submit',{
      method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload)
    }).then(function(r){ return r.json().then(function(j){ if(!r.ok || String(j.success)!=='true'){ console.warn('Web3Forms:',j.message); throw new Error(j.message); } }); })
      .then(function(){
        done(); form.reset();
        status.textContent='Gracias. Recibimos tu mensaje; un socio te responderá en un máximo de dos días hábiles.';
      })
      .catch(function(){
        done(); status.dataset.state='error';
        status.innerHTML='No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos a <a href="mailto:contacto@iraltus.com">contacto@iraltus.com</a>.';
      });
  });
})();
