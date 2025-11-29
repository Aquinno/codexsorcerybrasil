fetch("codex.csv")
  .then(r => r.text())
  .then(parseCSV);

let entries = [];

/* ===== CSV ROBUST PARSER ===== */
function parseCSV(text){

  const rows = [];
  let cur = [];
  let val = "";
  let inQuotes = false;

  for(let i=0;i<text.length;i++){
    const char = text[i];

    if(char === '"'){
      inQuotes = !inQuotes;
    }
    else if(char === "," && !inQuotes){
      cur.push(val.trim());
      val = "";
    }
    else if((char === "\n" || char === "\r") && !inQuotes){
      if(val.length || cur.length){
        cur.push(val.trim());
        rows.push(cur);
        cur = [];
        val = "";
      }
    }
    else{
      val += char;
    }
  }

  if(val || cur.length){
    cur.push(val.trim());
    rows.push(cur);
  }

  const data = rows.slice(1); // remove cabeçalho

  let lastTitle = "";

  for(const r of data){

    if(r.length < 3) continue;

    let title = r[0]?.replace(/^"|"$/g,'').trim();
    let content = r[1]?.replace(/^"|"$/g,'').trim();
    let sub = r[2]?.replace(/^"|"$/g,'').trim();

    // Quando começa com ",," -> sub do último item
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
  }

  buildSidebar();
}

/* ===== SIDEBAR ===== */

function buildSidebar(){

  const side = document.getElementById("sidebar");
  side.innerHTML = "";

  const group = {};

  entries.forEach(e=>{
    if(!group[e.title]) group[e.title]=[];
    group[e.title].push(e);
  });

  Object.keys(group).forEach(t=>{

    const tDiv = document.createElement("div");
    tDiv.textContent = t;
    tDiv.className = "title";
    tDiv.onclick = ()=> renderTitle(t);

    side.appendChild(tDiv);

    group[t].forEach(s=>{
      if(s.sub){
        const sDiv = document.createElement("div");
        sDiv.textContent = s.sub;
        sDiv.className="sub";
        sDiv.onclick = ()=> renderEntry(s);
        side.appendChild(sDiv);
      }
    });
  });
}

/* ===== RENDER ===== */

function renderTitle(title){
  const box = document.getElementById("content");
  box.innerHTML = `<h1>${title}</h1>`;

  entries
    .filter(e=> e.title === title)
    .forEach(e=>{
      if(e.sub){
        box.innerHTML += `<h2>${e.sub}</h2>`;
      }
      box.innerHTML += `<p>${e.content}</p><hr>`;
    });
}

function renderEntry(e){
  document.getElementById("content").innerHTML = `
    <h1>${e.title}</h1>
    <h2>${e.sub}</h2>
    <p>${e.content}</p>
  `;
}

/* ===== SEARCH ===== */

const input = document.getElementById("search");

input.addEventListener("input",()=>{
  const term = input.value.toLowerCase();
  if(!term){
    document.getElementById("content").innerHTML =
      "<p>Selecione um tópico à esquerda ou utilize a busca.</p>";
    return;
  }

  const result = entries.filter(e=>
    e.title.toLowerCase().includes(term) ||
    (e.sub && e.sub.toLowerCase().includes(term)) ||
    e.content.toLowerCase().includes(term)
  );

  showResults(result, term);
});

function showResults(list, term){

  const box = document.getElementById("content");

  box.innerHTML = `<h2>Resultados para: "${term}"</h2>`;

  list.forEach(e=>{
    box.innerHTML += `
      <h3>
        ${highlight(e.title,term)}
        ${e.sub ? " › "+highlight(e.sub,term) : ""}
      </h3>
      <p>${highlight(e.content,term)}</p>
      <hr>
    `;
  });
}

function highlight(text, term){
  return text.replace(new RegExp(term,'gi'),
    m=>`<span class="highlight">${m}</span>`);
}
