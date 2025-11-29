fetch("codex.csv")
  .then(r => r.text())
  .then(loadCSV);

let entries = [];

function loadCSV(csv) {
  const lines = csv.trim().split("\n").slice(1);

  entries = lines.map(line => {
    const [title, subcodex, content] = line.split(',"');
    return {
      title: title.replace(/"/g,''),
      sub: subcodex.replace(/"/g,''),
      content: content.replace(/"$/,'')
    };
  });

  buildSidebar();
}

function buildSidebar() {
  const box = document.getElementById("sidebar");
  box.innerHTML = "";

  const grouped = {};

  entries.forEach(e => {
    if (!grouped[e.title]) grouped[e.title] = [];
    grouped[e.title].push(e);
  });

  Object.keys(grouped).forEach(title => {
    const t = document.createElement("div");
    t.textContent = title;
    t.onclick = () => renderTitle(title);
    box.appendChild(t);

    grouped[title].forEach(item => {
      if(item.sub){
        const s = document.createElement("div");
        s.textContent = item.sub;
        s.className = "sub";
        s.onclick = () => renderEntry(item);
        box.appendChild(s);
      }
    });
  });
}

function renderTitle(title){
  const box = document.getElementById("content");
  box.innerHTML = `<h1>${title}</h1>`;

  entries
  .filter(e => e.title === title)
  .forEach(e => {
    const h = document.createElement("h3");
    h.textContent = e.sub;

    const p = document.createElement("p");
    p.textContent = e.content;

    box.append(h,p);
  });
}

function renderEntry(e){
  document.getElementById("content").innerHTML = `
    <h1>${e.title}</h1>
    <h2>${e.sub}</h2>
    <p>${e.content}</p>
  `;
}

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  const results = entries.filter(entry =>
    entry.title.toLowerCase().includes(q) ||
    entry.sub.toLowerCase().includes(q) ||
    entry.content.toLowerCase().includes(q)
  );

  showResults(results, q);
});

function showResults(list, term){
  const box = document.getElementById("content");

  box.innerHTML = `<h2>Resultados para "${term}"</h2>`;

  list.forEach(e=>{
    box.innerHTML += `
      <h3>${highlight(e.title,term)} › ${highlight(e.sub,term)}</h3>
      <p>${highlight(e.content,term)}</p>
      <hr>
    `;
  });
}

function highlight(text, term){
  if(!term) return text;
  return text.replace(new RegExp(term,'gi'),
   m=>`<span class="highlight">${m}</span>`);
}
