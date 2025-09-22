// Array untuk menyimpan catatan (di-load dari localStorage)
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// Elemen DOM
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note');
const notesList = document.getElementById('notes-list');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const viewOnlySection = document.getElementById('view-only');
const viewNote = document.getElementById('view-note');
const createNoteSection = document.getElementById('create-note');
const searchNotesSection = document.getElementById('search-notes');
const yourNotesSection = document.getElementById('your-notes');
const navButtons = document.querySelectorAll('.nav-btn');
const homeLinks = document.querySelectorAll('.home-link');
const notesCountEl = document.getElementById('notes-count');

// Helper: set body class when editor open
function setEditorOpen(open) {
    if (open) {
        document.body.classList.add('editor-open');
    } else {
        document.body.classList.remove('editor-open');
    }
}

// Fungsi untuk menyimpan catatan ke localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Fungsi untuk encode catatan ke base64
function encodeNote(note) {
    const jsonString = JSON.stringify(note);
    return btoa(encodeURIComponent(jsonString));
}

// Fungsi untuk decode catatan dari base64
function decodeNote(encoded) {
    try {
        const decoded = atob(encoded);
        const jsonString = decodeURIComponent(decoded);
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
}

// Fungsi untuk generate share link
function generateShareLink(index) {
    const note = notes[index];
    const encoded = encodeNote(note);
    return `${window.location.origin}${window.location.pathname}?view=${index}&data=${encodeURIComponent(encoded)}`;
}

// Fungsi untuk menampilkan catatan dengan preview
function renderNotes(filteredNotes = notes, container = notesList) {
    container.innerHTML = '';
    if (filteredNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Anda belum menulis apapun</p>
                <button class="cta-btn" data-section="create-note">Tulis Catatan Sekarang</button>
            </div>
        `;
    } else {
        filteredNotes.forEach((note, index) => {
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            const previewText = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
            noteCard.innerHTML = `
                <h3>${note.title}</h3>
                <p class="note-preview">${previewText}</p>
                <p class="full-content">${note.content}</p>
                <div class="note-actions">
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="delete-btn" data-index="${index}">Hapus</button>
                    <button class="share-btn" data-index="${index}">Share</button>
                </div>
            `;
            container.appendChild(noteCard);
        });
    }
}

// Fungsi untuk generate judul otomatis berdasarkan tanggal
function getAutoTitle() {
    try {
        const now = new Date();
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Intl.DateTimeFormat('id-ID', options).format(now);
    } catch (e) {
        const now = new Date();
        const day = now.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        return `${day} ${month} ${year}`;
    }
}

// Update notes count dan search placeholder
function updateNotesCount() {
    if (notesCountEl) {
        notesCountEl.textContent = notes.length;
    }
    if (searchInput) {
        searchInput.placeholder = notes.length > 0 ? `Cari dalam ${notes.length} catatan...` : 'Cari catatan...';
    }
}

// Save / Update note logic
function saveCurrentNote() {
    let title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    if (title === '') title = getAutoTitle();

    if (content) {
        if ('editingIndex' in saveNoteBtn.dataset && saveNoteBtn.dataset.editingIndex !== '') {
            const index = parseInt(saveNoteBtn.dataset.editingIndex);
            notes[index] = { title, content };
            delete saveNoteBtn.dataset.editingIndex;
            saveNoteBtn.textContent = 'Done';
        } else {
            notes.push({ title, content });
        }
        saveNotes();
        renderNotes(notes, notesList);
        updateNotesCount();
        noteTitle.value = '';
        noteContent.value = '';
        setEditorOpen(false);
        showSection('your-notes');
    } else {
        alert('Isi catatan tidak boleh kosong!');
    }
}

// Hook save button
saveNoteBtn.addEventListener('click', saveCurrentNote);

// Event delegation untuk edit, hapus, share, cancel, done
document.addEventListener('click', (e) => {
    const target = e.target;
    const card = target.closest('.note-card');

    if (target.classList.contains('editor-cancel')) {
        if (noteTitle.value.trim() !== '' || noteContent.value.trim() !== '') {
            if (confirm('Batal dan buang perubahan?')) {
                noteTitle.value = '';
                noteContent.value = '';
                delete saveNoteBtn.dataset.editingIndex;
                setEditorOpen(false);
                showSection('your-notes');
            }
        } else {
            setEditorOpen(false);
            showSection('your-notes');
        }
        return;
    } else if (target.classList.contains('editor-done')) {
        saveCurrentNote();
        return;
    }

    if (card) {
        if (target.closest('.note-actions')) {
            if (target.classList.contains('edit-btn')) {
                const index = parseInt(target.dataset.index);
                noteTitle.value = notes[index].title;
                noteContent.value = notes[index].content;
                saveNoteBtn.dataset.editingIndex = index;
                saveNoteBtn.textContent = 'Done';
                showSection('create-note');
                setEditorOpen(true);
                setTimeout(() => {
                    noteTitle.focus();
                    noteTitle.selectionStart = noteTitle.selectionEnd = noteTitle.value.length;
                }, 100);
            } else if (target.classList.contains('delete-btn')) {
                const index = parseInt(target.dataset.index);
                if (confirm('Yakin ingin hapus catatan ini?')) {
                    notes.splice(index, 1);
                    saveNotes();
                    renderNotes(notes, notesList);
                    updateNotesCount();
                }
            } else if (target.classList.contains('share-btn')) {
                const index = parseInt(target.dataset.index);
                const shareLink = generateShareLink(index);
                navigator.clipboard.writeText(shareLink)
                    .then(() => {
                        alert('Link berhasil dicopy ke clipboard!');
                    })
                    .catch(err => {
                        console.error('Gagal copy: ', err);
                        prompt('Copy tautan ini secara manual:', shareLink);
                    });
            }
        } else {
            card.classList.toggle('expanded');
        }
    } else if (target.closest('.cta-btn')) {
        showSection('create-note');
        setEditorOpen(true);
        setTimeout(() => {
            noteTitle.focus();
        }, 150);
    }
});

// Fungsi search
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = notes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query)
        );
        renderNotes(filtered, searchResults);
    });
}

// Fungsi untuk menampilkan section tertentu
function showSection(sectionId) {
    createNoteSection.style.display = sectionId === 'create-note' ? 'block' : 'none';
    searchNotesSection.style.display = sectionId === 'search-notes' ? 'block' : 'none';
    yourNotesSection.style.display = sectionId === 'your-notes' ? 'block' : 'none';
    viewOnlySection.style.display = sectionId === 'view-only' ? 'block' : 'none';
    saveNoteBtn.style.display = sectionId === 'create-note' ? 'block' : 'none';
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    if (sectionId === 'create-note') {
        setEditorOpen(true);
    } else {
        setEditorOpen(false);
    }
}

// Event listener untuk navigasi
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section);
    });
});

// Event listener untuk home link
homeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('your-notes');
    });
});

// --- FONT PICKER ---
const fontBtn = document.getElementById('font-btn');
const fontDropdown = document.getElementById('font-dropdown');

if (fontBtn && fontDropdown) {
    fontBtn.addEventListener('click', () => {
        fontDropdown.style.display = fontDropdown.style.display === 'none' ? 'block' : 'none';
    });

    fontDropdown.addEventListener('change', () => {
        const font = fontDropdown.value;
        noteContent.style.fontFamily = font;
        noteTitle.style.fontFamily = font;
        localStorage.setItem('preferredFont', font);
        fontDropdown.style.display = 'none';
    });

    const savedFont = localStorage.getItem('preferredFont');
    if (savedFont) {
        noteContent.style.fontFamily = savedFont;
        noteTitle.style.fontFamily = savedFont;
        fontDropdown.value = savedFont;
    }
}

// --- AUTO SAVE ---
[noteTitle, noteContent].forEach(el => {
    el.addEventListener('input', () => {
        let title = noteTitle.value.trim() || getAutoTitle();
        let content = noteContent.value.trim();
        let index = saveNoteBtn.dataset.editingIndex;
        if (content) {
            if (index !== undefined && index !== '') {
                notes[index] = { title, content };
            } else {
                notes[notes.length - 1] = { title, content };
            }
            saveNotes();
            renderNotes(notes, notesList);
            updateNotesCount();
        }
    });
});

// Jalankan awal
updateNotesCount();
renderNotes(notes, notesList);
