const titleInput = document.getElementById('noteTitle');
const noteText = document.getElementById('noteText');
const tagsInput = document.getElementById('noteTags');
const saveBtn = document.getElementById('saveBtn');
const notesList = document.getElementById('notes');

// Muat data dari localStorage pas pertama buka
document.addEventListener('DOMContentLoaded', loadNotes);

saveBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const text = noteText.value.trim();
  const tags = tagsInput.value.trim();

  if (title === '' && text === '' && tags === '') {
    alert('Catatan tidak boleh kosong!');
    return;
  }

  saveNote(title, text, tags);
  titleInput.value = '';
  noteText.value = '';
  tagsInput.value = '';
  loadNotes();
});

function saveNote(title, text, tags) {
  let notes = JSON.parse(localStorage.getItem('andkNotes')) || [];
  notes.push({ title, text, tags });
  localStorage.setItem('andkNotes', JSON.stringify(notes));
}

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('andkNotes')) || [];
  notesList.innerHTML = '';

  notes.forEach((note, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <h3>${note.title || '(Tanpa Judul)'}</h3>
      <p>${note.text || '(Tanpa Isi)'}</p>
      <small>Tags: ${note.tags || '-'}</small>
    `;
    li.addEventListener('click', () => deleteNote(index));
    notesList.appendChild(li);
  });
}

function deleteNote(index) {
  if (!confirm('Hapus catatan ini?')) return;
  let notes = JSON.parse(localStorage.getItem('andkNotes')) || [];
  notes.splice(index, 1);
  localStorage.setItem('andkNotes', JSON.stringify(notes));
  loadNotes();
}
