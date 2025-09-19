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
const homeLink = document.querySelector('.home-link');

// Fungsi untuk menyimpan catatan ke localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Fungsi untuk encode catatan ke base64
function encodeNote(note) {
    const jsonString = JSON.stringify(note);
    const escaped = unescape(encodeURIComponent(jsonString));
    return btoa(escaped);
}

// Fungsi untuk decode catatan dari base64
function decodeNote(encoded) {
    try {
        const decoded = atob(encoded);
        const unescaped = decodeURIComponent(escape(decoded));
        return JSON.parse(unescaped);
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
        return new Intl.DateTimeFormat('id-ID', options).format(now); // Output: "19 Sep 2025"
    } catch (e) {
        // Fallback manual kalau Intl gagal
        const now = new Date();
        const day = now.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        return `${day} ${month} ${year}`;
    }
}

// Tambah atau edit catatan
saveNoteBtn.addEventListener('click', () => {
    let title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    // Jika judul kosong, kasih judul otomatis
    if (title === '') {
        title = getAutoTitle();
    }
    
    if (content) {
        if (saveNoteBtn.dataset.editingIndex !== undefined) {
            const index = parseInt(saveNoteBtn.dataset.editingIndex);
            notes[index] = { title, content };
            delete saveNoteBtn.dataset.editingIndex;
            saveNoteBtn.textContent = 'Simpan';
        } else {
            notes.push({ title, content });
        }
        saveNotes();
        renderNotes(notes, notesList);
        noteTitle.value = '';
        noteContent.value = '';
        showSection('your-notes'); // Kembali ke Catatan Anda setelah simpan
    } else {
        alert('Isi catatan tidak boleh kosong!');
    }
});

// Event delegation untuk edit, hapus, share, dan toggle preview/full
document.addEventListener('click', (e) => {
    const target = e.target;
    const card = target.closest('.note-card');
    if (card) {
        if (target.closest('.note-actions')) {
            // Handle tombol aksi
            if (target.classList.contains('edit-btn')) {
                const index = parseInt(target.dataset.index);
                noteTitle.value = notes[index].title;
                noteContent.value = notes[index].content;
                saveNoteBtn.dataset.editingIndex = index;
                saveNoteBtn.textContent = 'Update';
                showSection('create-note');
            } else if (target.classList.contains('delete-btn')) {
                const index = parseInt(target.dataset.index);
                if (confirm('Yakin ingin hapus catatan ini?')) {
                    notes.splice(index, 1);
                    saveNotes();
                    renderNotes(notes, notesList);
                    const query = searchInput.value.toLowerCase();
                    const filtered = notes.filter(note => 
                        note.title.toLowerCase().includes(query) || 
                        note.content.toLowerCase().includes(query)
                    );
                    renderNotes(filtered, searchResults);
                }
            } else if (target.classList.contains('share-btn')) {
                const index = parseInt(target.dataset.index);
                const shareLink = generateShareLink(index);
                navigator.clipboard.writeText(shareLink)
                    .then(() => {
                        alert('Link berhasil dicopy ke clipboard! Bagikan ke orang lain.');
                    })
                    .catch(err => {
                        console.error('Gagal copy: ', err);
                        prompt('Copy tautan ini secara manual:', shareLink);
                    });
            }
        } else {
            // Toggle preview/full jika klik di luar aksi (judul, preview, atau card)
            card.classList.toggle('expanded');
        }
    } else if (target.closest('.cta-btn')) {
        showSection('create-note');
    }
});

// Fungsi search
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
    );
    renderNotes(filtered, searchResults);
});

// Fungsi untuk mengelola likes di localStorage
function getLikes(index) {
    const likes = localStorage.getItem(`likes_${index}`);
    return likes ? parseInt(likes) : 0;
}

function setLikes(index, count) {
    localStorage.setItem(`likes_${index}`, count);
}

// Fungsi untuk menampilkan section tertentu
function showSection(sectionId) {
    createNoteSection.style.display = sectionId === 'create-note' ? 'block' : 'none';
    searchNotesSection.style.display = sectionId === 'search-notes' ? 'block' : 'none';
    yourNotesSection.style.display = sectionId === 'your-notes' ? 'block' : 'none';
    viewOnlySection.style.display = sectionId === 'view-only' ? 'block' : 'none';
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
}

// Event listener untuk navigasi
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section);
    });
});

// Event listener untuk home link (logo + Aksara)
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('your-notes');
});

// Cek apakah ada parameter view di URL
function checkViewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewIndex = urlParams.get('view');
    const encodedData = urlParams.get('data');
    if (viewIndex !== null && encodedData !== null) {
        const note = decodeNote(decodeURIComponent(encodedData));
        if (note) {
            createNoteSection.style.display = 'none';
            searchNotesSection.style.display = 'none';
            yourNotesSection.style.display = 'none';
            viewOnlySection.style.display = 'block';
            document.querySelector('.bottom-nav').style.display = 'none'; // Sembunyikan navbar di view-only
            const likes = getLikes(viewIndex);
            viewNote.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <div class="note-actions">
                    <button class="like-btn" data-index="${viewIndex}">
                        <span class="heart-icon">❤️</span> ${likes} Likes
                    </button>
                    <button class="copy-btn">Copy Teks</button>
                </div>
            `;
            viewNote.addEventListener('click', (e) => {
                if (e.target.classList.contains('like-btn') || e.target.parentElement.classList.contains('like-btn')) {
                    const btn = e.target.classList.contains('like-btn') ? e.target : e.target.parentElement;
                    const index = parseInt(btn.dataset.index);
                    const isLiked = btn.classList.contains('liked');
                    const currentLikes = getLikes(index);
                    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
                    setLikes(index, newLikes);
                    btn.classList.toggle('liked');
                    btn.innerHTML = `<span class="heart-icon">❤️</span> ${newLikes} Likes`;
                } else if (e.target.classList.contains('copy-btn')) {
                    navigator.clipboard.writeText(note.content)
                        .then(() => {
                            alert('Teks catatan berhasil dicopy ke clipboard!');
                        })
                        .catch(err => {
                            console.error('Gagal copy: ', err);
                            prompt('Copy teks ini secara manual:', note.content);
                        });
                }
            });
        } else {
            viewNote.innerHTML = '<p>Catatan tidak valid atau rusak.</p>';
        }
    } else {
        showSection('your-notes'); // Default ke Catatan Anda
        renderNotes(notes, notesList);
    }
}

// Jalankan cek view mode saat halaman dimuat
checkViewMode();
