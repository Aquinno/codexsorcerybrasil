let codexData = [];
let expandedSubcodex = null;

/* ================================
   BOOT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadCSV();

  document.getElementById("search")
    .addEventListener("input", searchCodex);

  // suporta deep links via #Title/SubCodex
  window.addEventListener("hashchange", handleHash);
});

/* ================================
   CSV LOADING + PARSE
================================ */
function loadCSV(){

  fetch("codex.csv")
    .then(r => r.text())
    .then(text => {
      codexData = parseCSV(text);
      buildSidebar();
      handleHash(); // dispara ao carregar
    });

}

/* Parser tolerante com multiline e aspas */
function parseCSV(text){

  const rows=[];
  let cur=[], val="", inQuotes=false;

  for(let i=0;i<text.length;i++){
    
    const c=text[i];

    if(c === `"`) inQuotes=!inQuotes;
    else if(c === `,` && !inQuotes){
      cur.push(val.trim());
      val="";
    }
    else if((c === `\n` || c === `\r`) && !inQuotes){
      if(val || cur.length){
        cur.push(val.trim());
        rows.push(cur);
        cur=[];
        val="";
      }
    }
    else{
      val+=c;
    }

  }

  if(val || cur.length){
    cur.push(val.trim());
    rows.push(cur);
  }

  const data = rows.slice(1);
  let lastTitle="";

  return data.map(row=>{

    let title = clean(row[0]);
    let content = clean(row[1]);
    let sub = clean(row[2]);

    if(!title) title = lastTitle;
    else lastTitle = title;

    return { title, content, sub };

  });

}

/* ================================
   HELPERS
================================ */
function clean(txt){
  return (txt || "")
    .replace(/^"|"$/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function splitColon(txt){
  const i = txt.indexOf(":");
  if(i === -1) return [txt.trim(),""];
  return [
    txt.substring(0,i).trim(),
    txt.substring(i+1).trim()
  ];
}

/* ================================
   SIDEBAR
================================ */
function buildSidebar(){

  const side=document.getElementById("sidebar");
  side.innerHTML="";

  const grouped={};

  codexData.forEach(e=>{
    if(!grouped[e.title]) grouped[e.title]=[];
    grouped[e.title].push(e);
  });

  Object.keys(grouped).forEach(title=>{

    // Title
    const t=document.createElement("div");
    t.className="title";
    t.textContent=title;
    t.onclick=()=>{
      expandedSubcodex=null;
      renderTitle(title);
      updateHash(title);
    };
    side.appendChild(t);

    // Subcodex
    grouped[title].forEach(e=>{
      if(!e.sub) return;

      const [subTitle]=splitColon(e.sub);

      const s=document.createElement("div");
      s.className="sub";
      s.textContent=subTitle;

      s.onclick=(ev)=>{
        ev.stopPropagation();
        expandedSubcodex=subTitle;
        renderTitle(title);
        updateHash(title, subTitle);
      };

      side.appendChild(s);
    });

  });

}

/* ================================
   RENDER
================================ */
function renderTitle(title){

  const box=document.getElementById("content");
  box.innerHTML=`<h1>${title}</h1>`;

  codexData
    .filter(e=>e.title===title)
    .forEach(e=>{

      // Conteúdo normal
      if(!e.sub){
        box.innerHTML+=`
          <p>${e.content}</p><hr>
        `;
        return;
      }

      // Subcodex accordion
      const [subTitle, subText]=splitColon(e.sub);

      const block=document.createElement("div");
      block.className="subBlock";

      const st=document.createElement("div");
      st.className="subTitle";
      st.textContent=subTitle;

      const txt=document.createElement("div");
      txt.className="subText";
      txt.innerHTML=`
        ${subText}
        ${e.content ? "<br>" + e.content : ""}
      `;

      st.onclick=()=>{
        block.classList.toggle("open");
        if(block.classList.contains("open")){
          updateHash(title, subTitle);
        }
      };

      block.append(st, txt);
      box.append(block);

      /* auto-expand */
      if(expandedSubcodex === subTitle){
        block.classList.add("open");
        setTimeout(()=>{
          st.scrollIntoView({behavior:"smooth", block:"center"});
        },150);
      }

    });

}

/* ================================
   SEARCH
================================ */
function searchCodex(){

  const term=document.getElementById("search")
    .value.trim().toLowerCase();

  if(!term){
    buildSidebar();
    return;
  }

  const side=document.getElementById("sidebar");
  side.innerHTML="";

  codexData.forEach(e=>{

    const inTitle=e.title.toLowerCase().includes(term);
    const inContent=e.content.toLowerCase().includes(term);
    const inSub=e.sub && e.sub.toLowerCase().includes(term);

    if(!inTitle && !inContent && !inSub) return;

    const t=document.createElement("div");
    t.className="title";
    t.textContent=e.title;
    t.onclick=()=>{
      expandedSubcodex=null;
      renderTitle(e.title);
      updateHash(e.title);
    };

    side.appendChild(t);

    if(inSub){

      const [subTitle]=splitColon(e.sub);

      const s=document.createElement("div");
      s.className="sub";
      s.textContent=subTitle;
      s.onclick=(ev)=>{
        ev.stopPropagation();
        expandedSubcodex=subTitle;
        renderTitle(e.title);
        updateHash(e.title, subTitle);
      };

      side.appendChild(s);
    }

  });

}

/* ================================
   DEEP LINK
================================ */

function updateHash(title, sub){

  let hash=`#${encodeURIComponent(title)}`;
  if(sub)
    hash+=`/${encodeURIComponent(sub)}`;

  history.replaceState(null,"",hash);

}

function handleHash(){

  if(!location.hash) return;

  const parts=location.hash.substring(1)
    .split("/")
    .map(p=> decodeURIComponent(p));

  const title=parts[0];
  const sub=parts[1];

  if(!title) return;

  expandedSubcodex=sub || null;
  renderTitle(title);

}

