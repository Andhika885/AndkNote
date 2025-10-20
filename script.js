const titleInput = document.getElementById("noteTitle");
const noteText = document.getElementById("noteText");
const tagsInput = document.getElementById("tagsInput");
const saveBtn = document.getElementById("saveBtn");
const notesList = document.getElementById("notesList");
const clearAllBtn = document.getElementById("clearAllBtn");
const charCount = document.getElementById("charCount");

// Load notes pas pertama buka
document.addEventListener("DOMContentLoaded", loadNotes);

// Hitung karakter realtime
noteText.addEventListener("input", () => {
  charCount.textContent = `${noteText.value.length} chars`;
});

// Simpan catatan
saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const text = noteText.value.trim();
  const tags = tagsInput.value.trim();

  if (title === "" && text === "" && tags === "") {
    alert("Catatan tidak boleh kosong!");
    return;
  }

  saveNote(title, text, tags);
  titleInput.value = "";
  noteText.value = "";
  tagsInput.value = "";
  charCount.textContent = "0 chars";
  loadNotes();
});

// Hapus semua catatan
clearAllBtn.addEventListener("click", () => {
  if (confirm("Yakin mau hapus semua catatan?")) {
    localStorage.removeItem("andkNotes");
    loadNotes();
  }
});

function saveNote(title, text, tags) {
  let notes = JSON.parse(localStorage.getItem("andkNotes")) || [];
  const newNote = {
    title,
    text,
    tags,
    pinned: false,
    date: new Date().toLocaleString(),
  };
  notes.push(newNote);
  localStorage.setItem("andkNotes", JSON.stringify(notes));
}

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("andkNotes")) || [];
  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = "<li class='note-empty'>Belum ada catatan.</li>";
    return;
  }

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.classList.add("note", "card");

    const tagsHtml = note.tags
      ? note.tags
          .split(",")
          .map(
            (t) =>
              `<span class="tag">${t.trim().toLowerCase()}</span>`
          )
          .join("")
      : "";

    li.innerHTML = `
      <div class="note-top">
        <h3>${note.title || "(Tanpa Judul)"}</h3>
        <div class="note-actions">
          <button class="delete-btn" title="Hapus">🗑️</button>
        </div>
      </div>
      <p>${note.text || "(Tanpa Isi)"}</p>
      <div class="tags">${tagsHtml}</div>
      <small class="timestamps">${note.date}</small>
    `;

    // Aksi hapus
    li.querySelector(".delete-btn").addEventListener("click", () => {
      deleteNote(index);
    });

    notesList.appendChild(li);
  });
}

function deleteNote(index) {
  let notes = JSON.parse(localStorage.getItem("andkNotes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("andkNotes", JSON.stringify(notes));
  loadNotes();
}
