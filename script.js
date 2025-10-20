/* ANDK Note — Enhanced (no external libs)
   Data model per note:
   {
     id: number,
     title: string,
     content: string,
     tags: [string],
     createdAt: number,
     updatedAt: number,
     pinned: boolean
   }
*/

const LS_KEY = "andkNotes_v2";

const noteTitle = document.getElementById("noteTitle");
const noteText = document.getElementById("noteText");
const tagsInput = document.getElementById("tagsInput");
const saveBtn = document.getElementById("saveBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const notesList = document.getElementById("notesList");
const searchInput = document.getElementById("searchInput");
const charCount = document.getElementById("charCount");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const filterPinnedBtn = document.getElementById("filterPinnedBtn");
const tagFilter = document.getElementById("tagFilter");

const noteTemplate = document.getElementById("noteTemplate").content;

let notes = [];
let showOnlyPinned = false;
let activeTagFilter = "";

document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  renderNotes();
  populateTagFilter();
});

noteText.addEventListener("input", () => {
  charCount.textContent = `${noteText.value.length} chars`;
});

saveBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim();
  const content = noteText.value.trim();
  const rawTags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
  if (!content) return alert("Catatan tidak boleh kosong!");

  const newNote = {
    id: Date.now(),
    title,
    content,
    tags: rawTags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false
  };

  notes.push(newNote);
  saveToStorage();
  resetEditor();
  renderNotes();
  populateTagFilter();
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Yakin hapus semua catatan? Tindakan ini tidak bisa di-undo.")) return;
  notes = [];
  saveToStorage();
  renderNotes();
  populateTagFilter();
});

searchInput.addEventListener("input", () => {
  renderNotes();
});

filterPinnedBtn.addEventListener("click", () => {
  showOnlyPinned = !showOnlyPinned;
  filterPinnedBtn.style.borderColor = showOnlyPinned ? "var(--accent)" : "";
  renderNotes();
});

exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(notes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "andknotes-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error("Format tidak valid");
      // optional: merge or replace. Kita tanya user? supaya simple: gabung tapi jaga id unik
      imported.forEach(item => {
        item.id = item.id || Date.now() + Math.floor(Math.random() * 1000);
        notes.push(item);
      });
      saveToStorage();
      renderNotes();
      populateTagFilter();
      alert("Import sukses — catatan digabung ke local storage.");
    } catch (err) {
      alert("Gagal import: " + err.message);
    }
  };
  reader.readAsText(f);
  importFile.value = "";
});

tagFilter.addEventListener("change", () => {
  activeTagFilter = tagFilter.value;
  renderNotes();
});

/* Storage */
function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

function loadNotes() {
  try {
    notes = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    // normalize: ensure fields exist
    notes = notes.map(n => ({
      id: n.id || Date.now() + Math.floor(Math.random()*1000),
      title: n.title || "",
      content: n.content || "",
      tags: Array.isArray(n.tags) ? n.tags : (n.tags ? String(n.tags).split(",").map(t=>t.trim()).filter(Boolean) : []),
      createdAt: n.createdAt || Date.now(),
      updatedAt: n.updatedAt || n.createdAt || Date.now(),
      pinned: !!n.pinned
    }));
  } catch (e) {
    notes = [];
  }
}

/* Render */
function renderNotes() {
  const q = searchInput.value.trim().toLowerCase();
  notesList.innerHTML = "";

  // sort: pinned first, then updatedAt desc
  const sorted = [...notes].sort((a,b)=> {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const filtered = sorted.filter(n => {
    if (showOnlyPinned && !n.pinned) return false;
    if (activeTagFilter && !n.tags.includes(activeTagFilter)) return false;
    if (!q) return true;
    const inTitle = n.title.toLowerCase().includes(q);
    const inContent = n.content.toLowerCase().includes(q);
    const inTags = n.tags.join(" ").toLowerCase().includes(q);
    return inTitle || inContent || inTags;
  });

  if (filtered.length === 0) {
    const el = document.createElement("div");
    el.className = "empty";
    el.textContent = "Belum ada catatan yang cocok. Coba buat catatan baru atau hapus filter pencarian.";
    notesList.appendChild(el);
    return;
  }

  filtered.forEach(n => {
    const clone = document.importNode(noteTemplate, true);
    const li = clone.querySelector("li");
    const titleEl = clone.querySelector(".note-title");
    const contentEl = clone.querySelector(".note-content");
    const pinBtn = clone.querySelector(".pin-btn");
    const editBtn = clone.querySelector(".edit-btn");
    const deleteBtn = clone.querySelector(".delete-btn");
    const tagsEl = clone.querySelector(".tags");
    const tsEl = clone.querySelector(".timestamps");

    titleEl.textContent = n.title || "(Tanpa judul)";
    contentEl.textContent = n.content;
    pinBtn.textContent = n.pinned ? "📌" : "📍";
    pinBtn.title = n.pinned ? "Unpin" : "Pin";
    tsEl.textContent = `Dibuat: ${new Date(n.createdAt).toLocaleString()} • Terakhir: ${new Date(n.updatedAt).toLocaleString()}`;

    // tags
    tagsEl.innerHTML = "";
    n.tags.forEach(t => {
      const tspan = document.createElement("span");
      tspan.className = "tag";
      tspan.textContent = t;
      tagsEl.appendChild(tspan);
    });

    // actions
    pinBtn.addEventListener("click", () => {
      togglePin(n.id);
    });

    deleteBtn.addEventListener("click", () => {
      if (!confirm("Hapus catatan ini?")) return;
      deleteNote(n.id);
    });

    editBtn.addEventListener("click", () => {
      openEditorForEdit(n.id);
    });

    notesList.appendChild(clone);
  });
}

/* Actions */
function resetEditor() {
  noteTitle.value = "";
  noteText.value = "";
  tagsInput.value = "";
  charCount.textContent = "0";
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveToStorage();
  renderNotes();
  populateTagFilter();
}

function togglePin(id) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return;
  notes[idx].pinned = !notes[idx].pinned;
  notes[idx].updatedAt = Date.now();
  saveToStorage();
  renderNotes();
}

function openEditorForEdit(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;
  // fill editor
  noteTitle.value = n.title;
  noteText.value = n.content;
  tagsInput.value = n.tags.join(", ");
  charCount.textContent = `${noteText.value.length} chars`;

  // change Save button to "Update"
  saveBtn.textContent = "Update";
  saveBtn.classList.add("editing");
  saveBtn.dataset.editId = id;

  // attach temporary handler
  const finishEdit = () => {
    const newTitle = noteTitle.value.trim();
    const newContent = noteText.value.trim();
    const newTags = tagsInput.value.split(",").map(t=>t.trim()).filter(Boolean);
    if (!newContent) { alert("Catatan tidak boleh kosong!"); return; }

    const idx = notes.findIndex(x => x.id == id);
    if (idx === -1) return;
    notes[idx].title = newTitle;
    notes[idx].content = newContent;
    notes[idx].tags = newTags;
    notes[idx].updatedAt = Date.now();
    saveToStorage();
    resetEditor();
    renderNotes();
    populateTagFilter();

    // restore save button
    saveBtn.textContent = "Simpan";
    saveBtn.classList.remove("editing");
    delete saveBtn.dataset.editId;

    // remove listener
    saveBtn.removeEventListener("click", finishEdit);
    // reattach normal listener (below)
    saveBtn.addEventListener("click", saveNewNoteHandler);
  };

  // remove existing default listener to avoid duplicate
  saveBtn.removeEventListener("click", saveNewNoteHandler);
  saveBtn.addEventListener("click", finishEdit);
}

/* Save handler for new note (kept separate for easy reattach) */
function saveNewNoteHandler() {
  const title = noteTitle.value.trim();
  const content = noteText.value.trim();
  const rawTags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
  if (!content) return alert("Catatan tidak boleh kosong!");

  const newNote = {
    id: Date.now(),
    title,
    content,
    tags: rawTags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false
  };

  notes.push(newNote);
  saveToStorage();
  resetEditor();
  renderNotes();
  populateTagFilter();
}
saveBtn.addEventListener("click", saveNewNoteHandler);

/* Utility: populate tag filter list */
function populateTagFilter() {
  const allTags = new Set();
  notes.forEach(n => n.tags.forEach(t => allTags.add(t)));
  const tags = Array.from(allTags).sort((a,b)=> a.localeCompare(b));
  tagFilter.innerHTML = '<option value="">Filter tag — Semua</option>';
  tags.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

/* Extra: keyboard shortcuts */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveBtn.click();
  }
});
