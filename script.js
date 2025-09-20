// Firebase Config (GANTI DENGAN PUNYA LU dari Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAgxJEUX-9ZvPMGplgDfNuHjwqN2N-Y3Hs",
    authDomain: "aksara-9505c.firebaseapp.com",
    projectId: "aksara-9505c",
    storageBucket: "aksara-9505c.firebasestorage.app",
    messagingSenderId: "756360596769",
    appId: "1:756360596769:web:22db2c8b39544f95238260",
    measurementId: "G-HWEVYGKQ0Z"
  };

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

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
const mainContent = document.getElementById('main-content');
const authModal = document.getElementById('auth-modal');
const authBtn = document.getElementById('auth-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailLoginBtn = document.getElementById('email-login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const bottomNav = document.querySelector('.bottom-nav');

// Array untuk menyimpan catatan (di-sync dari Firestore)
let notes = [];

// Fungsi untuk generate judul otomatis berdasarkan tanggal
function getAutoTitle() {
    try {
        const now = new Date();
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Intl.DateTimeFormat('id-ID', options).format(now); // Output: "20 Sep 2025"
    } catch (e) {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
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
function generateShareLink(noteId, note) {
    const encoded = encodeNote(note);
    return `${window.location.origin}${window.location.pathname}?view=${noteId}&data=${encodeURIComponent(encoded)}`;
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
        filteredNotes.forEach((note) => {
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            const previewText = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
            noteCard.innerHTML = `
                <h3>${note.title}</h3>
                <p class="note-preview">${previewText}</p>
                <p class="full-content">${note.content}</p>
                <div class="note-actions">
                    <button class="edit-btn" data-id="${note.id}">Edit</button>
                    <button class="delete-btn" data-id="${note.id}">Hapus</button>
                    <button class="share-btn" data-id="${note.id}">Share</button>
                </div>
            `;
            container.appendChild(noteCard);
        });
    }
}

// Fungsi untuk load catatan dari Firestore
function loadNotes() {
    const user = auth.currentUser;
    if (user) {
        console.log('Loading notes for user:', user.uid);
        db.collection('notes')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                console.log('Firestore snapshot received:', snapshot.docs.length, 'docs');
                notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('Notes data:', notes);
                renderNotes(notes, notesList);
                const query = searchInput.value.toLowerCase();
                const filtered = notes.filter(note =>
                    note.title.toLowerCase().includes(query) ||
                    note.content.toLowerCase().includes(query)
                );
                renderNotes(filtered, searchResults);
            }, (error) => {
                console.error('Error loading notes:', error.code, error.message);
                alert('Gagal memuat catatan: ' + error.message);
            });
    } else {
        console.error('No user logged in');
        showAuthModal();
    }
}

// Tambah atau edit catatan
saveNoteBtn.addEventListener('click', () => {
    let title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert('Silakan login terlebih dahulu!');
        showAuthModal();
        return;
    }

    if (content) {
        if (title === '') {
            title = getAutoTitle();
        }

        if (saveNoteBtn.dataset.editingId) {
            // Edit catatan
            const noteId = saveNoteBtn.dataset.editingId;
            db.collection('notes').doc(noteId).update({
                title,
                content,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                delete saveNoteBtn.dataset.editingId;
                saveNoteBtn.textContent = 'Done';
                noteTitle.value = '';
                noteContent.value = '';
                showSection('your-notes');
            }).catch(err => {
                console.error('Error updating note:', err);
                alert('Gagal menyimpan catatan. Coba lagi.');
            });
        } else {
            // Tambah catatan baru
            db.collection('notes').add({
                title,
                content,
                userId: user.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                noteTitle.value = '';
                noteContent.value = '';
                showSection('your-notes');
            }).catch(err => {
                console.error('Error saving note:', err);
                alert('Gagal menyimpan catatan. Coba lagi.');
            });
        }
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
                const noteId = target.dataset.id;
                const note = notes.find(n => n.id === noteId);
                noteTitle.value = note.title;
                noteContent.value = note.content;
                saveNoteBtn.dataset.editingId = noteId;
                saveNoteBtn.textContent = 'Done';
                showSection('create-note');
            } else if (target.classList.contains('delete-btn')) {
                const noteId = target.dataset.id;
                if (confirm('Yakin ingin hapus catatan ini?')) {
                    db.collection('notes').doc(noteId).delete().catch(err => {
                        console.error('Error deleting note:', err);
                        alert('Gagal menghapus catatan. Coba lagi.');
                    });
                }
            } else if (target.classList.contains('share-btn')) {
                const noteId = target.dataset.id;
                const note = notes.find(n => n.id === noteId);
                const shareLink = generateShareLink(noteId, note);
                navigator.clipboard.writeText(shareLink)
                    .then(() => {
                        alert('Link berhasil dicopy ke clipboard! Bagikan ke orang lain.');
                    })
                    .catch(err => {
                        console.error('Gagal copy:', err);
                        prompt('Copy tautan ini secara manual:', shareLink);
                    });
            }
        } else {
            // Toggle preview/full jika klik di luar aksi
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

// Fungsi untuk mengelola likes di Firestore
function getLikes(noteId) {
    return db.collection('likes').doc(noteId).get().then(doc => doc.exists ? doc.data().count : 0);
}

function setLikes(noteId, count) {
    return db.collection('likes').doc(noteId).set({ count });
}

// Fungsi untuk menampilkan section tertentu
function showSection(sectionId) {
    createNoteSection.style.display = sectionId === 'create-note' ? 'block' : 'none';
    searchNotesSection.style.display = sectionId === 'search-notes' ? 'block' : 'none';
    yourNotesSection.style.display = sectionId === 'your-notes' ? 'block' : 'none';
    viewOnlySection.style.display = sectionId === 'view-only' ? 'block' : 'none';
    saveNoteBtn.style.display = sectionId === 'create-note' ? 'block' : 'none';
    bottomNav.style.display = sectionId !== 'view-only' ? 'flex' : 'none';
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
}

// Fungsi untuk tampilkan/sembunyikan modal login
function showAuthModal() {
    authModal.style.display = 'flex';
    mainContent.style.display = 'none';
    bottomNav.style.display = 'none';
}

function hideAuthModal() {
    authModal.style.display = 'none';
    mainContent.style.display = 'block';
    bottomNav.style.display = 'flex';
}

// Auth handling
authBtn.addEventListener('click', () => {
    if (auth.currentUser) {
        auth.signOut().then(() => {
            notes = [];
            renderNotes();
            showAuthModal();
        });
    } else {
        showAuthModal();
    }
});

emailLoginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (email && password) {
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                hideAuthModal();
                loadNotes();
            })
            .catch(err => {
                alert('Login gagal: ' + err.message);
            });
    } else {
        alert('Masukkan email dan password!');
    }
});

googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            hideAuthModal();
            loadNotes();
        })
        .catch(err => {
            alert('Login Google gagal: ' + err.message);
        });
});

signupBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (email && password) {
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                hideAuthModal();
                loadNotes();
            })
            .catch(err => {
                alert('Pendaftaran gagal: ' + err.message);
            });
    } else {
        alert('Masukkan email dan password!');
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        notes = [];
        renderNotes();
        showAuthModal();
    });
});

// Monitor auth state
auth.onAuthStateChanged(user => {
    if (user) {
        authBtn.textContent = 'Logout';
        logoutBtn.style.display = 'block';
        emailLoginBtn.style.display = 'none';
        googleLoginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        hideAuthModal();
        loadNotes();
    } else {
        authBtn.textContent = 'Login';
        logoutBtn.style.display = 'none';
        emailLoginBtn.style.display = 'block';
        googleLoginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        showAuthModal();
    }
});

// Event listener untuk navigasi
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section);
    });
});

// Event listener untuk home link
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('your-notes');
});

// Cek apakah ada parameter view di URL
function checkViewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    const encodedData = urlParams.get('data');
    if (viewId && encodedData) {
        const note = decodeNote(decodeURIComponent(encodedData));
        if (note) {
            createNoteSection.style.display = 'none';
            searchNotesSection.style.display = 'none';
            yourNotesSection.style.display = 'none';
            viewOnlySection.style.display = 'block';
            bottomNav.style.display = 'none';
            getLikes(viewId).then(likes => {
                viewNote.innerHTML = `
                    <h3>${note.title}</h3>
                    <p>${note.content}</p>
                    <div class="note-actions">
                        <button class="like-btn" data-id="${viewId}">
                            <span class="heart-icon">❤️</span> ${likes} Likes
                        </button>
                        <button class="copy-btn">Copy Teks</button>
                    </div>
                `;
                viewNote.addEventListener('click', (e) => {
                    if (e.target.classList.contains('like-btn') || e.target.parentElement.classList.contains('like-btn')) {
                        const btn = e.target.classList.contains('like-btn') ? e.target : e.target.parentElement;
                        const noteId = btn.dataset.id;
                        const isLiked = btn.classList.contains('liked');
                        getLikes(noteId).then(currentLikes => {
                            const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
                            setLikes(noteId, newLikes).then(() => {
                                btn.classList.toggle('liked');
                                btn.innerHTML = `<span class="heart-icon">❤️</span> ${newLikes} Likes`;
                            });
                        });
                    } else if (e.target.classList.contains('copy-btn')) {
                        navigator.clipboard.writeText(note.content)
                            .then(() => {
                                alert('Teks catatan berhasil dicopy ke clipboard!');
                            })
                            .catch(err => {
                                console.error('Gagal copy:', err);
                                prompt('Copy teks ini secara manual:', note.content);
                            });
                    }
                });
            });
        } else {
            viewNote.innerHTML = '<p>Catatan tidak valid atau rusak.</p>';
        }
    } else if (auth.currentUser) {
        showSection('your-notes');
        loadNotes();
    } else {
        showAuthModal();
    }
}

// Jalankan cek view mode saat halaman dimuat
checkViewMode();
