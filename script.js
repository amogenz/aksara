// Array untuk menyimpan catatan (di-load dari localStorage)
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// Elemen DOM
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note');
const notesList = document.getElementById('notes-list');
const searchInput = document.getElementById('search-input');
const viewOnlySection = document.getElementById('view-only');
const viewNote = document.getElementById('view-note');
const noteForm = document.getElementById('note-form');
const searchSection = document.getElementById('search-section');

// Fungsi untuk menyimpan catatan ke localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Fungsi untuk encode catatan ke base64
function encodeNote(note) {
    return btoa(JSON.stringify(note));
}

// Fungsi untuk decode catatan dari base64
function decodeNote(encoded) {
    try {
        return JSON.parse(atob(encoded));
    } catch (e) {
        return null;
    }
}

// Fungsi untuk generate share link
function generateShareLink(index) {
    const note = notes[index];
    const encoded = encodeNote(note);
    if (encoded.length > 1500) {
        alert('Catatan terlalu panjang untuk dibagikan via URL!');
        return null;
    }
    return `${window.location.origin}${window.location.pathname}?view=${index}&data=${encodeURIComponent(encoded)}`;
}

// Fungsi untuk menampilkan catatan
function renderNotes(filteredNotes = notes) {
    notesList.innerHTML = '';
    filteredNotes.forEach((note, index) => {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div class="note-actions">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Hapus</button>
                <button class="share-btn" data-index="${index}">Share</button>
            </div>
        `;
        notesList.appendChild(noteCard);
    });
}

// Tambah atau edit catatan
saveNoteBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    if (title && content) {
        if (saveNoteBtn.dataset.editingIndex !== undefined) {
            // Mode edit
            const index = parseInt(saveNoteBtn.dataset.editingIndex);
            notes[index] = { title, content };
            delete saveNoteBtn.dataset.editingIndex;
            saveNoteBtn.textContent = 'Simpan Catatan';
        } else {
            // Mode tambah baru
            notes.push({ title, content });
        }
        saveNotes();
        renderNotes();
        noteTitle.value = '';
        noteContent.value = '';
    } else {
        alert('Judul dan isi catatan tidak boleh kosong!');
    }
});

// Event delegation untuk edit, hapus, dan share
notesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const index = parseInt(e.target.dataset.index);
        noteTitle.value = notes[index].title;
        noteContent.value = notes[index].content;
        saveNoteBtn.dataset.editingIndex = index;
        saveNoteBtn.textContent = 'Update Catatan';
    } else if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        if (confirm('Yakin ingin hapus catatan ini?')) {
            notes.splice(index, 1);
            saveNotes();
            renderNotes();
        }
    } else if (e.target.classList.contains('share-btn')) {
        const index = parseInt(e.target.dataset.index);
        const shareLink = generateShareLink(index);
        if (shareLink) {
            prompt('Salin tautan ini untuk membagikan catatan:', shareLink);
        }
    }
});

// Fungsi search
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
    );
    renderNotes(filtered);
});

// Cek apakah ada parameter view di URL
function checkViewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewIndex = urlParams.get('view');
    const encodedData = urlParams.get('data');
    if (viewIndex !== null && encodedData !== null) {
        const note = decodeNote(decodeURIComponent(encodedData));
        if (note) {
            noteForm.style.display = 'none';
            searchSection.style.display = 'none';
            notesList.style.display = 'none';
            viewOnlySection.style.display = 'block';
            viewNote.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
            `;
        } else {
            viewNote.innerHTML = '<p>Catatan tidak valid atau rusak.</p>';
        }
    } else {
        renderNotes();
    }
}

// Jalankan cek view mode saat halaman dimuat
checkViewMode();
