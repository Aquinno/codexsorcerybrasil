fetch("codex.csv")
  .then(r => r.text())
  .then(parseCSV);

let entries = [];

/* ======================================
   CSV PARSER COMPATÍVEL COM SEU FORMATO
====================================== */

function parseCSV(text){

  const rows = [];
  let current = [];
  let value = "";
  let inQuotes = false;

  for(let i = 0; i < text.length; i++){
    const c = text[i];

    if(c === '"'){
      inQuotes = !inQuotes;
    }
    else if(c === "," && !inQuotes){
      current.push(value.trim());
      value = "";
    }
    else if((c === "\n" || c === "\r") && !inQuotes){
      if(value.length || current.length){
        current.push(value.trim());
        rows.push(current);
        current = [];
        value = "";
      }
    }
    else{
      value += c;
    }
  }

  if(value || current.length){
    current.push(value.trim());
    rows.push(current);
  }

  // Remove cabeçalho
  const data = rows.slice(1);

  let lastTitle = "";

  data.forEach(row => {

    if(row.length < 3) return;

    let title = clean(row[0]);
    let content = clean(row[1]);
    let sub = clean(row[2]);

    // Quando o title vier vazio → continua no mesmo título
    if(!title){
      title = lastTitle;
    } else {
      lastTitle = title;
    }

    entries.push({
      title,
      sub,
      content
    });

  });

  buildSidebar();
}

/* ======================================
   FUNÇÕES AUXILIARES
====================================== */

function clean(text){
  if(!text) return "";
  return text.replace(/^"|"$/g, "").replace(/\s+/g," ").trim();
}

// Divide título em antes e depois dos ":"
function splitColon(text){
  const i = text.indexOf(":");
  if(i === -1) return [ text, "" ];
  return [
    text.substring(0, i).trim(),
    text.substring(i+1).trim()
  ];
}

/* ======================================
   SIDEBAR
====================================== */

function buildSidebar(){

  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";

  const grouped = {};

  entries.forEach(e=>{
    if(!grouped[e.title]) grouped[e.title] = [];
    grouped[e.title].push(e);
  });

  Object.keys(grouped).forEach(title => {

    const tDiv = document.createElement("div");
    tDiv.className = "title";
    tDiv.textContent = title;
    tDiv.onclick = () => renderTitle(title);
    sidebar.appendChild(tDiv);

    grouped[title].forEach(e => {

      if(!e.sub) return;

      const [label] = splitColon(e.sub);

      const sDiv = document.createElement("div");
      sDiv.className = "sub";
      sDiv.textContent = label;
      sDiv.onclick = () => renderEntry(e);

      sidebar.appendChild(sDiv);

    });

  });
}

/* ======================================
   RENDERIZAÇÃO
====================================== */

function renderTitle(title){

  const content = document.getElementById("content");
  content.innerHTML = `<h1>${title}</h1>`;

  entries
    .filter(e => e.title === title)
    .forEach(e => {

      // Conteúdo SEM subcodex → aparece normal
      if(!e.sub){
        content.innerHTML += `<p>${e.content}</p><hr>`;
        return;
      }

      const [subTitle, subText] = splitColon(e.sub);

      const block = document.createElement("div");
      block.className = "subBlock";

      const sTitle = document.createElement("div");
      sTitle.className = "subTitle";
      sTitle.textContent = subTitle;

      const sText = document.createElement("div");
      sText.className = "subText";
      sText.textContent = subText + (e.content ? " " + e.content : "");

      sTitle.onclick = () => {
        block.classList.toggle("open");
      };

      block.appendChild(sTitle);
      block.appendChild(sText);
      content.appendChild(block);
    });

}

function renderEntry(e){

  const content = document.getElementById("content");

  const [subTitle, subText] = splitColon(e.sub || "");

  content.innerHTML = `
    <h1>${e.title}</h1>

    <div class="subBlock open">
      <div class="subTitle">${subTitle}</div>
      <div class="subText">
        ${subText} ${e.content || ""}
      </div>
    </div>
  `;
}

/* ======================================
   BUSCA
====================================== */

const input = document.getElementById("search");

input.addEventListener("input", ()=>{

  const term = input.value.toLowerCase();

  if(!term){
    document.getElementById("content").innerHTML =
      "<p>Selecione um tópico à esquerda ou utilize a busca.</p>";
    return;
  }

  const results = entries.filter(e =>
    e.title.toLowerCase().includes(term) ||
    (e.sub && e.sub.toLowerCase().includes(term)) ||
    e.content.toLowerCase().includes(term)
  );

  showResults(results, term);
});

function showResults(list, term){

  const content = document.getElementById("content");

  content.innerHTML = `<h2>Resultados para: "${term}"</h2>`;

  list.forEach(e => {

    const [subTitle, subText] = splitColon(e.sub || "");

    content.innerHTML += `
      <h3>
        ${highlight(e.title, term)}
        ${subTitle ? " › " + highlight(subTitle, term) : ""}
      </h3>

      <p>
        ${highlight(subText + " " + e.content, term)}
      </p>

      <hr>
    `;
  });

}

/* ======================================
   HIGHLIGHT
====================================== */

function highlight(text, term){
  if(!term) return text;

  return text.replace(new RegExp(term,'gi'),
    m => `<span class="highlight">${m}</span>`
  );
}
