/* AKSARA CHAT SYSTEM */

(function() { 
  
    // --- VARIABEL GLOBAL ---
    let client;
    let myName = "";
    let myRoom = "";
    let storageTopic = ""; 
    const broadcastTopic = "aksara-global-v1/announcements";

    const ADMIN_CONFIG = {
        hashKey: "71710" 
    };

    const _part1 = "AIzaSyAOWoPxT";
    
    const _part2 = "9wVP7ZGN9AvwZ";
    
    const _part3 = "igN42NZ9edsc8";
    
    const AI_API_KEY = _part1 + _part2 + _part3; 

    let isAdminMode = false; 
    let tempImageBase64 = null; 
    let mediaRecorder, audioChunks = [], isRecording = false, audioBlobData = null;
    let isSoundOn = true;
    let sendOnEnter = true;
    let tabNotificationsOn = true;
    let replyingTo = null; 
    let onlineUsers = {};
    let typingTimeout;
    let localChatHistory = []; 

    // --- OPTIMIZATION ---
    let saveDebounce, storageDebounce, typingThrottle = false;
    let pingInterval, titleBlinkInterval;
    let originalTitle = "";
    let unreadCount = 0;
    let isWindowFocused = true;
    let audioUnlocked = false;

    // --- AUDIO ---
    const notifAudio = document.getElementById('notifSound');
    const sentAudio = document.getElementById('sentSound');

    // ==================== CORE UTILS ====================

    function customHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i) * (i + 1);
        }
        return (hash * 10).toString();
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        let icon = 'info';
        let color = '#007AFF';
        if (type === 'success') { icon = 'check_circle'; color = '#34C759'; }
        if (type === 'error') { icon = 'error'; color = '#ff4444'; }
        toast.innerHTML = `<i class="material-icons" style="color:${color}">${icon}</i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
    }
    
    
    // ==================== FITUR DOWNLOAD STORY (ULTRA HD) ====================
    
    window.downloadAdminMessage = function(msgId) {
        const element = document.getElementById(msgId);
        if (!element) return;

        showToast("Sedang merender Ultra HD...", "info");

        // 1. Sembunyikan ikon agar bersih
        const icons = element.querySelectorAll('.admin-actions');
        icons.forEach(icon => icon.style.display = 'none');

        // 2. Settingan Khusus HD
        html2canvas(element, {
            backgroundColor: "#121212", // Background Hitam Solid
            
            scale: 5, // <--- KUNCI 1: Resolusi 5x lipat (Setara 4K)
            
            useCORS: true,
            logging: false,
            allowTaint: true,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById(msgId);
                if (clonedEl) {
                    // Pastikan elemen terlihat sempurna saat difoto
                    clonedEl.style.boxShadow = "none";
                    clonedEl.style.margin = "0"; 
                    clonedEl.style.transform = "none"; 
                }
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'Aksara_Story_HD_' + Date.now() + '.png'; // <--- KUNCI 2: Format PNG
            
            // Simpan sebagai PNG (Kualitas Paling Tinggi/Tanpa Kompresi)
            link.href = canvas.toDataURL("image/png"); 
            
            link.click();

            // Kembalikan tampilan semula
            icons.forEach(icon => icon.style.display = 'flex');
            showToast("Gambar HD Tersimpan!", "success");
        }).catch(err => {
            console.error("Gagal render:", err);
            showToast("Gagal menyimpan gambar.", "error");
            icons.forEach(icon => icon.style.display = 'flex');
        });
    };


    

    // ==================== AI LOGIC (AMMO PERSONA) ====================
    

    async function askAI(prompt) {
        if (!AI_API_KEY || AI_API_KEY.includes("MASUKKAN")) {
            publishBotMessage("⚠️ Admin belum pasang API Key Gemini.");
            return;
        }

        // Tampilkan indikator mengetik
        if (client && client.connected) {
            client.publish(myRoom, JSON.stringify({type:'typing', user:'ammo🦉'}));
        }

        try {
            // URL Endpoint Gemini
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    
                    generationConfig: {
                        temperature: 0.3
                    },
                    
                    
// SYSTEM INSTRUCTION (Persona Ammo)

systemInstruction: {
parts: [{ text:

"Kamu adalah asisten AI bernama Ammo. Gaya bicaramu santai, gaul, semi-slang, layaknya teman tongkrongan. Jika user minta lagu atau video, CARIKAN LINK YOUTUBE-NYA lewat Google Search yang tersedia. Jika user memancing emosi, kamu boleh ngegas (Toxic Mode = asu, cok, anjing, njing, sat, tot, tai, babi, pala bapak kau, kintol, najis, lo hama, yatim). Jika user minta lagu, CARIKAN LINK YOUTUBE versi 'Dj Indonesia'  'Lyrics Video' atau 'Official Audio'. JANGAN berikan link 'Official Music Video' (MV) karena sering tidak bisa diputar (embed restricted). Pastikan linknya valid dari hasil pencarian Google . ATURAN KRUSIAL VIDEO (WAJIB PATUH): 1. Jika user minta lagu (terutama lagu Nasional/Official), JANGAN PERNAH ambil dari 'Official Channel', 'VEVO', 'TV Station', atau 'Label Musik'. Video dari sana PASTI ERROR (Video Tidak Tersedia). 2. TUGASMU: Cari video yang diupload oleh 'USER BIASA' atau 'CHANNEL KARAOKE'. 3. KATA KUNCI PENCARIAN: Saat mencari di Google, tambahkan kata 'Lirik' atau 'Karaoke' atau 'Cover' di belakang judul lagu.  4. Contoh: Jangan cari 'Indonesia Raya Official', tapi carilah 'Indonesia Raya Lirik Karaoke' ATURAN 'ANTI-HALUSINASI' (WAJIB DIPATUHI): 1. Saat user meminta video/lagu, kamu WAJIB menggunakan Google Search Tool untuk mencari linknya. 2. DILARANG KERAS membuat/menebak link YouTube sendiri. Jangan asal mengetik ID video acak. 3. HANYA berikan link yang benar-benar muncul di hasil pencarian Google (Grounding). 4. Jika di hasil pencarian tidak ada link YouTube yang valid, KATAKAN JUJUR: 'Sori bro, gue cari di Google gak nemu linknya.' Jangan memaksakan diri memberi link palsu. 5. Prioritaskan video lirik/karaoke agar bisa diputar.  . Jika ditanya siapa kamu, jawab: 'Gue adalah program kecerdasan hasil modifikasi organisasi Amogenz.inc'." }]
                    },
                    
// FITUR KUNCI: Mengaktifkan Google Search agar bisa cari Link Youtube Asli
                    tools: [{ googleSearch: {} }] 
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("Error:", data.error);
                publishBotMessage(`❌ Error: ${data.error.message}`);
            } 
            else if (data.candidates && data.candidates[0]) {
                const candidate = data.candidates[0];
                let aiReply = candidate.content.parts[0].text;
                
                // --- BAGIAN ANTI HALU (LOGIKA BARU) ---
                // Kita cek apakah Google benar-benar menemukan link asli di metadata
                let foundRealLink = null;

                if (candidate.groundingMetadata && candidate.groundingMetadata.groundingChunks) {
                    // Kita cari di dalam "kantung" hasil pencarian Google
                    const chunks = candidate.groundingMetadata.groundingChunks;
                    const youtubeChunk = chunks.find(chunk => 
                        chunk.web && chunk.web.uri && 
                        (chunk.web.uri.includes('youtube.com') || chunk.web.uri.includes('youtu.be'))
                    );

                    if (youtubeChunk) {
                        foundRealLink = youtubeChunk.web.uri;
                    }
                }

                // Jika kita nemu link asli dari Google (Metadata), KITA PAKSA TEMPEL di chat
                // Walaupun si AI lupa nulis, atau si AI nulis link palsu, yang ini pasti benar.
                if (foundRealLink) {
                    // Hapus link youtube palsu yang mungkin ditulis AI di teks (opsional, biar rapi)
                    // aiReply = aiReply.replace(/https?:\/\/(www\.)?youtu\.?be.*/g, ''); 
                    
                    aiReply += `\n\n${foundRealLink}`; // Tempel link asli di bawah
                }
                publishBotMessage(aiReply); 
            } 
            else {
                publishBotMessage("⚠️ Gak nemu jawabannya gue, skip.");
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            publishBotMessage("❌ Internet lo bapuk njing, gak konek ke Google.");
        }
    }


    function publishBotMessage(content) {
        const msgId = 'bot-' + Date.now();
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

        const payload = {
            id: msgId,
            user: "ammo🦉", 
            content: content,
            type: "text",
            time: time,
            timestamp: Date.now(),
            isAdmin: false,
            isBot: true 
        };

        if (client && client.connected) {
            client.publish(myRoom, JSON.stringify(payload));
        }
    }



    function initSecretAdminGesture() {
        const logo = document.querySelector('.sidebar-logo-img');
        if (!logo) return;
        let lastTap = 0;
        logo.style.cursor = 'pointer'; 
        logo.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                triggerAdminLogin();
            }
            lastTap = currentTime;
        });
    }

    function triggerAdminLogin() {
        if (isAdminMode) return; 
        const password = prompt("🔐 ACCESS\nMasukkan Katakter:");
        if (!password) return;
        if (customHash(password) === ADMIN_CONFIG.hashKey) {
            toggleAdminMode(true);
        } else {
            showToast("Salah!", "error");
        }
    }

    function toggleAdminMode(active) {
        isAdminMode = active;
        const wrapper = document.getElementById('input-wrapper'); 
        const sendBtn = document.getElementById('send-btn');
        renderAdminExitButton(active);
        if (active) {
            if(wrapper) { wrapper.style.border = "1px solid #FFD700"; wrapper.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.3)"; wrapper.style.background = "rgba(255, 215, 0, 0.05)"; }
            if(sendBtn) { sendBtn.style.background = '#FFD700'; sendBtn.style.color = '#000'; }
            const originalName = localStorage.getItem('aksara_name');
            document.getElementById('side-user').innerText = originalName + " (Admin)";
            showToast("Mode Admin AKTIF", "success");
        } else {
            if(wrapper) { wrapper.style.border = "1px solid rgba(255,255,255,0.5)"; wrapper.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)"; wrapper.style.background = "rgba(255, 255, 255, 0.65)"; }
            if(sendBtn) { sendBtn.style.background = '#007AFF'; sendBtn.style.color = '#fff'; }
            const originalName = localStorage.getItem('aksara_name');
            document.getElementById('side-user').innerText = originalName;
            showToast("Mode Admin NONAKTIF", "info");
        }
        renderChat(false);
    }

    function renderAdminExitButton(show) {
        let exitBtn = document.getElementById('admin-exit-btn-dynamic');
        if (show) {
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.id = 'admin-exit-btn-dynamic';
                exitBtn.className = 'sidebar-btn';
                Object.assign(exitBtn.style, { background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30', fontWeight: '600', border: '1px solid rgba(255, 59, 48, 0.3)', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', cursor: 'pointer', width: '100%', transition: 'all 0.2s' });
                exitBtn.innerHTML = `<i class="material-icons">security_update_warning</i> Keluar Mode Admin`;
                exitBtn.onclick = function() { if(confirm("Nonaktifkan Mode Admin?")) toggleAdminMode(false); };
                const sidebar = document.getElementById('sidebar');
                const logoutBtn = sidebar.querySelector('.logout');
                if (sidebar) { if(logoutBtn) sidebar.insertBefore(exitBtn, logoutBtn); else sidebar.appendChild(exitBtn); }
            }
            exitBtn.style.display = 'flex';
        } else { if (exitBtn) exitBtn.style.display = 'none'; }
    }

    function deleteAnyMessage(messageId) {
        if (!isAdminMode) return;
        if (!confirm("Hapus pesan ini untuk SEMUA user di SEMUA room?")) return;

        const msgEl = document.getElementById(messageId);
        if(msgEl) msgEl.style.opacity = '0.3';

        if (client && client.connected) {
            client.publish(myRoom, JSON.stringify({ type: 'message_deleted', targetId: messageId, deletedBy: "Admin", timestamp: Date.now() }));
            client.publish(broadcastTopic, JSON.stringify({ type: 'message_deleted', targetId: messageId, deletedBy: "Admin", timestamp: Date.now() }), { retain: true, qos: 1 }); 
            handleMessageDeletion({targetId: messageId});
            showToast("Pesan dihapus Global", "success");
        }
    }

    function handleMessageDeletion(data) {
        localChatHistory = localChatHistory.filter(msg => msg.id !== data.targetId);
        const messageElement = document.getElementById(data.targetId);
        if (messageElement) { messageElement.style.transition = 'all 0.3s ease'; messageElement.style.transform = 'scale(0.8)'; messageElement.style.opacity = '0'; setTimeout(() => { messageElement.remove(); }, 300); }
        debouncedSaveToLocal();
        if (isAdminMode) debouncedUpdateServerStorage();
    }

    // ==================== DATE FORMATTER & UI ====================
    function getDateLabel(timestamp) {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.floor((nowMidnight - dateMidnight) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "HARI INI";
        if (diffDays === 1) return "KEMARIN";
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function createDateDivider(label) {
        const div = document.createElement('div');
        div.className = 'date-divider';
        div.innerHTML = `<span>${label}</span>`;
        return div;
    }

    // ==================== SMART LINK DETECTOR (YOUTUBE) ====================
    
    function processMessageContent(content) {
        // 1. Regex untuk deteksi YouTube Link (Video ID)
        const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = content.match(ytRegex);

        let processedHtml = `<span class="msg-content">${content}</span>`;

        if (match && match[1]) {
            const videoId = match[1];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            // Tambahkan Player YouTube di bawah teks
            processedHtml += `
                <div class="video-container" style="margin-top:8px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; background:rgba(0,0,0,0.1);">
                    <iframe style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" 
                    src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
                    </iframe>
                </div>
            `;
        }
        
        // Bisa tambah regex gambar disini nanti jika mau
        
        return processedHtml;
    }

    // ==================== CHAT RENDERING ====================

    function renderChat(forceScroll = false) {
        const chatBox = document.getElementById('messages');
        chatBox.innerHTML = '<div class="welcome-msg">Messages are encrypted and secure.</div>';
        localChatHistory.sort((a,b) => a.timestamp - b.timestamp);
        let lastDateLabel = null;
        localChatHistory.forEach(msg => { 
            if (msg.timestamp) {
                const currentDateLabel = getDateLabel(msg.timestamp);
                if (currentDateLabel && currentDateLabel !== lastDateLabel) {
                    chatBox.appendChild(createDateDivider(currentDateLabel));
                    lastDateLabel = currentDateLabel;
                }
            }
            chatBox.appendChild(createMessageElement(msg)); 
        });
        scrollToBottom(forceScroll);
    }

    function addSingleMessage(data) {
        const chatBox = document.getElementById('messages');
        if (localChatHistory.length > 1) {
            const lastMsg = localChatHistory[localChatHistory.length - 2];
            const lastLabel = getDateLabel(lastMsg.timestamp);
            const currentLabel = getDateLabel(data.timestamp);
            if (currentLabel !== lastLabel) chatBox.appendChild(createDateDivider(currentLabel));
        } else {
            const currentLabel = getDateLabel(data.timestamp);
            if(currentLabel) chatBox.appendChild(createDateDivider(currentLabel));
        }
        chatBox.appendChild(createMessageElement(data));
        
    }

    function createMessageElement(data) {
        const div = document.createElement('div');
        const isMe = data.user === myName;
        if (data.id) div.id = data.id;
        
        if (data.type === 'system') {
            div.style.textAlign = 'center'; div.style.fontSize = '11px'; div.style.color = '#fff'; div.style.opacity = '0.7'; div.style.margin = '10px 0'; 
            div.innerText = `${data.user} ${data.content}`;
            return div;
        }

        let deleteBtnHtml = "";
        if (isAdminMode) {
            deleteBtnHtml = `<i class="material-icons" onclick="window.deleteAnyMessage('${data.id}')" style="font-size:14px; color:rgba(255, 59, 48, 0.8); cursor:pointer; margin-left:8px; vertical-align:middle;">delete_outline</i>`;
        }

        let contentHtml = "";
        if (data.type === 'image') {
            contentHtml = `<img src="${data.content}" class="chat-image" onclick="window.openLightbox(this.src)" style="max-height:200px; width:auto;">` + (data.caption ? `<div style="font-size:12px;margin-top:5px;color:#fff">${data.caption}</div>` : '');
        } else if (data.type === 'audio') {
            contentHtml = `<audio controls src="${data.content}" style="width:100%; margin-top:5px;"></audio>`;
        } else {
            // [MODIFIED] Gunakan Smart Processor untuk Text (YouTube)
            contentHtml = processMessageContent(data.content.replace(/\n/g, '<br>'));
        }


        // --- TAMPILAN USER SW (STORY MODE) ---
        // Jika pesan tipenya 'quote' (hasil dari ketik /sw)
        if (data.type === 'quote') {
            div.className = 'message admin'; // Kita "pinjam" baju (style) milik Admin biar estetik
            
            // Tombol Download
            const actionButtons = `
                <span class="admin-actions">
                    <i class="material-icons" onclick="window.downloadAdminMessage('${data.id}')" 
                       style="font-size:14px; color:#FFD700; cursor:pointer;" title="Simpan ke Galeri">download</i>
                    
                    ${isAdminMode ? `<i class="material-icons" onclick="window.deleteAnyMessage('${data.id}')" 
                       style="font-size:14px; color:#ff4444; cursor:pointer;">delete</i>` : ''}
                </span>
            `;

            div.innerHTML = `
                <div class="admin-badge">
                    <span>${data.user}</span> 
                    <i class="material-icons" style="color:#FFD700; font-size:14px; margin-left:0;">auto_awesome</i>
                </div>
                
                <div class="admin-content">
                    ${contentHtml}
                </div>
                
                <div class="admin-time">
                    <span>${data.time}</span>
                    ${actionButtons}
                </div>
            `;
            return div;
        }



        // --- BOT AMMO (VERIFIED) ---
        // --- BOT AMMO (VERIFIED & COMPACT FIX) ---
        if (data.isBot || data.user === "Ammo🦉" || data.user === "Aksara AI") {
            div.className = 'message left';
            
            // 1. STYLE UTAMA BUBBLE (Flex Column: Atas ke Bawah)
            Object.assign(div.style, {
                background: "linear-gradient(135deg, #2c3e50 0%, #000000 100%)",
                color: "white",
                borderRadius: "16px 16px 16px 4px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
                border: "1px solid #444",
                
                display: "flex",
                flexDirection: "column", // Susunan: Header -> Isi -> Footer
                
                // PENGATURAN JARAK AGAR TIDAK MELAR
                gap: "2px", 
                padding: "8px 12px 4px 12px", // Bawah cuma 4px
                minWidth: "150px",
                width: "fit-content",
                maxWidth: "75%"
            });

            // 2. DATA TOMBOL REPLY
            const safeContent = data.content ? data.content.replace(/['"`]/g, "").substring(0, 40) : "Media";
            const safeId = data.id || "bot-msg";
            const safeUser = data.user || "Ammo";

            // Tombol Reply (Icon Panah)
            const replyBtnBot = `
                <i class="material-icons reply-btn" 
                   style="cursor:pointer; font-size:14px; margin-left:6px; color:#FFD700; opacity:1 !important; display:inline-flex;" 
                   onclick="event.stopPropagation(); window.setReply('${safeId}', '${safeUser}', '${safeContent}...')">
                   reply
                </i>
            `;

            // 3. SUSUNAN HTML
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                    <span class="sender-name" style="color:#FFD700; font-weight:bold; font-size:12px; margin:0;">${data.user}</span>
                    <i class="material-icons" style="font-size:14px; color:#25D366; text-shadow:0 0 5px rgba(37,211,102,0.5);" title="Verified Bot">verified</i>
                </div>
                
                <div style="line-height:1.4; font-size:14px; margin:0;">${contentHtml}</div>
                
                <div class="time-info" style="
                    color: rgba(255,255,255,0.6); 
                    font-size: 10px; 
                    align-self: flex-end; /* Rata Kanan */
                    margin-top: 2px; 
                    
                    display: flex;        /* Baris ke samping */
                    align-items: center;  /* Rata tengah vertikal */
                    justify-content: flex-end;
                ">
                    <span>${data.time}</span>
                    ${replyBtnBot}
                    ${deleteBtnHtml}
                </div>
            `;
            return div;
        }



        // --- 1. TAMPILAN ADMIN / QUOTES (FIXED UI) ---
        if (data.isAdmin || data.type === 'admin') {
            div.className = 'message admin';
            
            const actionButtons = `
                <span class="admin-actions">
                    <i class="material-icons" onclick="window.downloadAdminMessage('${data.id}')" 
                       style="font-size:14px; color:#FFD700; cursor:pointer;" title="Download">download</i>
                    
                    ${isAdminMode ? `<i class="material-icons" onclick="window.deleteAnyMessage('${data.id}')" 
                       style="font-size:14px; color:#ff4444; cursor:pointer;">delete</i>` : ''}
                </span>
            `;

            div.innerHTML = `
                <div class="admin-badge">
                    <span>AKSARA</span>
                    <i class="material-icons" style="color:#FFD700; font-size:14px;">verified</i>
                </div>
                <div class="admin-content">"${contentHtml}"</div>
                <div class="admin-time">
                    <span>${data.time}</span>
                    ${actionButtons}
                </div>
            `;
            return div;
        }

        // --- USER & MENTION ---
        div.className = isMe ? 'message right' : 'message left';
        if (!isMe && data.type === 'text' && data.content && myName && data.content.toLowerCase().includes('@' + myName.toLowerCase())) {
            div.classList.add('message-mention');
        }

        let replyHtml = "";
        if (data.reply) {
            replyHtml = `<div class="reply-quote" onclick="window.scrollToMessage('${data.reply.id}')"><div class="reply-content"><b>${data.reply.user}</b><span>${data.reply.text.substring(0, 40)}...</span></div></div>`;
        }

        const replyBtn = !isMe ? `<i class="material-icons reply-btn" onclick="window.setReply('${data.id||'unknown'}', '${data.user}', '${data.type==='text'?data.content.replace(/'/g,""):data.type}')">reply</i>` : '';

        div.innerHTML = `<span class="sender-name">${data.user}</span>${replyHtml}<div>${contentHtml}</div><div class="time-info">${data.time} ${replyBtn} ${deleteBtnHtml}</div>`;
        return div;
    }

    // ==================== MAIN CONNECTION ====================

    function startChat() {
        const user = document.getElementById('username').value.trim();
        const roomRaw = document.getElementById('room').value.trim();
        const room = roomRaw.toLowerCase();
        
        if (!user || !room) { showToast("Lengkapi data!", "error"); return; }
        if (room === 'aksara') { showToast("Room 'Aksara' telah digunakan.", "error"); return; }

        localStorage.setItem('aksara_name', user);
        localStorage.setItem('aksara_room', roomRaw); 
        
        myName = user;
        myRoom = "aksara-v29/" + room; 
        storageTopic = myRoom + "/storage"; 

        document.getElementById('side-user').innerText = myName;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('chat-screen').style.display = 'flex';
        document.getElementById('room-display').innerText = "#" + roomRaw;
        document.getElementById('typing-indicator').innerText = "Menghubungkan...";

        loadFromLocal(); 

        const options = { protocol: 'wss', type: 'mqtt', clean: true, reconnectPeriod: 1000, clientId: 'aks_' + Math.random().toString(16).substr(2, 8) };
        client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', options);

        client.on('connect', () => {
            document.getElementById('typing-indicator').innerText = "";
            client.subscribe(myRoom); client.subscribe(storageTopic); client.subscribe(broadcastTopic); 
            publishMessage("bergabung.", 'system');
            pingInterval = setInterval(() => { 
                if (client && client.connected) { client.publish(myRoom, JSON.stringify({ type: 'ping', user: myName })); cleanOnlineList(); }
            }, 30000);
        });

        client.on('message', (topic, message) => {
            const msgString = message.toString();
            try {
                const data = JSON.parse(msgString);
                if (topic === broadcastTopic) {
                    if (data.type === 'admin_clear') {
                        localChatHistory = localChatHistory.filter(msg => !msg.isAdmin && msg.type !== 'admin');
                        debouncedSaveToLocal(); renderChat(); showToast("Pengumuman Admin Ditarik", "info");
                    } else if (data.type === 'message_deleted') {
                        handleMessageDeletion(data);
                    } else handleIncomingMessage(data);
                    return;
                }
                if (topic === storageTopic) { if (Array.isArray(data)) mergeWithLocal(data); return; }
                if (topic === myRoom) { 
                    if (data.type === 'message_deleted') { handleMessageDeletion(data); return; }
                    if (data.type === 'ping') { updateOnlineList(data.user); return; } 
                    if (data.type === 'typing') { showTyping(data.user); return; } 
                    handleIncomingMessage(data); 
                }
            } catch(e) {}
        });

        client.on('offline', () => { showToast("Koneksi terputus...", "error"); });
        client.on('reconnect', () => { showToast("Menghubungkan kembali...", "info"); });
    }

        function sendMessage() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        if (!text) return;

        // Proteksi command system (tetap)
        if (text.startsWith('/admin') || text.startsWith('/hapusadmin') || text === '/exit') {
            showToast("Karakter tidak valid.", "info");
            input.value = ''; return;
        }

        // --- FITUR USER STORY (Ganti /quote jadi /sw) ---
        if (text.toLowerCase().startsWith('/sw ')) {
            // Ambil isi pesan setelah spasi (indeks ke-4 karena "/sw " ada 4 karakter)
            const quoteContent = text.substring(4).trim(); 
            
            if (quoteContent) {
                publishMessage(quoteContent, 'quote'); // Kirim dengan tipe 'quote'
                
                input.value = ''; 
                input.style.height = 'auto'; 
                input.focus();
                return; // Stop, jangan lanjut ke logika lain
            }
        } 

        // --- DETEKSI PEMANGGILAN AI ---
        const isManualCall = text.toLowerCase().startsWith('@amo ') || text.toLowerCase().startsWith('@ai ');
        const isReplyingToBot = replyingTo && (
            replyingTo.user.toLowerCase().includes('ammo') || 
            replyingTo.user.toLowerCase().includes('ai')
        );

        // Kirim pesan text biasa jika bukan /sw
        publishMessage(text, 'text');

        let originalText = text;
        input.value = ''; input.style.height = 'auto'; input.focus();

        if (isManualCall || isReplyingToBot) {
            let prompt = originalText;
            if (isManualCall) prompt = originalText.replace(/^@(amo|ai)\s+/i, '');
            
            // ... logika indikator typing ...
            askAI(prompt);
        }
    }


    // ==================== REST OF UTILS & BRIDGE ====================

    function publishMessage(content, type = 'text', caption = '') {
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        // Generate ID di sini agar kita bisa menyimpannya
        const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        let finalType = type;
        let finalTopic = myRoom;
        let mqttOpts = {};

        if (isAdminMode) { 
            finalTopic = broadcastTopic; 
            mqttOpts = { retain: true, qos: 1 }; 
            if (type === 'text') finalType = 'admin'; 
        } 
        else if (type === 'admin_clear') { 
            finalTopic = broadcastTopic; 
            mqttOpts = { retain: true, qos: 1 }; 
        }

        const payload = { 
            id: msgId, 
            user: myName, 
            content: content, 
            type: finalType, 
            caption: caption, 
            time: time, 
            reply: replyingTo, 
            timestamp: Date.now(), 
            isAdmin: isAdminMode 
        };

        // --- UPDATE OPTIMIS (MUNCUL DULUAN) ---
        // Kita langsung masukkan ke history lokal & layar SEBELUM kirim ke server
        // Cek dulu biar admin mode gak double (karena admin logic beda)
        if (!isAdminMode && type !== 'system') {
            localChatHistory.push(payload);
            if (localChatHistory.length > 77) localChatHistory = localChatHistory.slice(-77);
            addSingleMessage(payload); // Langsung render ke layar!
            
            			scrollToBottom(true);
            
            debouncedSaveToLocal();
        }

        try { 
            client.publish(finalTopic, JSON.stringify(payload), mqttOpts); 
            if (isSoundOn && !isAdminMode && type !== 'system') playSound('sent');
        } catch(e) { showToast("Gagal kirim", "error"); }
        if (!isAdminMode) cancelReply();
    }

      function handleIncomingMessage(data) {
        if (data.type === 'message_deleted') return;
        
        if (data.type !== 'system' && data.type !== 'admin_clear') {
            if (!localChatHistory.some(msg => msg.id === data.id)) {
                
                // 1. Simpan ke variabel array JS
                localChatHistory.push(data);
                if (localChatHistory.length > 77) localChatHistory = localChatHistory.slice(-77); 
                
                // 2. Render pesan ke layar
                addSingleMessage(data); 

                // --- 3. LOGIKA SCROLL & TITIK MERAH (BARU) ---
                const chatBox = document.getElementById('messages');
                const btn = document.getElementById('scroll-bottom-btn');
                const badge = document.getElementById('new-msg-badge');
                
                // Cek apakah user sedang di atas (lebih dari 150px dari bawah)?
                const isUserUp = (chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) > 150;

                if (isUserUp && btn && badge) {
                    // Jika user di atas: Munculkan titik merah, JANGAN scroll
                    badge.style.display = 'block';
                    showToast("Pesan baru di bawah", "info");
                } else {
                    // Jika user di bawah: Auto scroll ke bawah
                    scrollToBottom(false); 
                }
                // ---------------------------------------------

                // 4. LOGIKA UMUM (WAJIB JALAN TERUS)
                // Ini ditaruh DI LUAR if/else di atas, biar tetap jalan kondisinya apapun
                debouncedSaveToLocal();
                
                if (data.user !== myName) { 
                    playSound('received'); 
                    showNewMessageNotification(data); 
                }
                
                if (data.user === myName && !data.isAdmin) {
                    debouncedUpdateServerStorage();
                }

            }
        } else {
            renderSingleElement(data);
        }
    }

    function renderSingleElement(data) {
        const chatBox = document.getElementById('messages');
        chatBox.appendChild(createMessageElement(data));
        scrollToBottom(false);
    }

    function loadFromLocal() { const saved = localStorage.getItem(getStorageKey()); if (saved) { localChatHistory = JSON.parse(saved); renderChat(); } }
    function saveToLocal() { localStorage.setItem(getStorageKey(), JSON.stringify(localChatHistory)); }
    function getStorageKey() { return 'aksara_history_v29_' + myRoom; }
    function updateServerStorage() { if(client && client.connected) client.publish(storageTopic, JSON.stringify(localChatHistory), { retain: true, qos: 1 }); }
    function mergeWithLocal(serverData) { let changed = false; serverData.forEach(srvMsg => { if (!localChatHistory.some(locMsg => locMsg.id === srvMsg.id)) { localChatHistory.push(srvMsg); changed = true; } }); if (changed) { localChatHistory.sort((a, b) => a.timestamp - b.timestamp); if (localChatHistory.length > 77) localChatHistory = localChatHistory.slice(-77); debouncedSaveToLocal(); renderChat(); } }
    
    function scrollToBottom(force = false) {
        const chatBox = document.getElementById('messages');
        const isAtBottom = (chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) < 150;
        if (force || isAtBottom) setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
    }

    function handleEnter(e) { if (e.key === 'Enter' && !e.shiftKey && sendOnEnter) { e.preventDefault(); sendMessage(); } }
    function showTyping(user) { if(user===myName)return; const ind=document.getElementById('typing-indicator'); ind.innerText=`${user} typing...`; clearTimeout(typingTimeout); typingTimeout=setTimeout(()=>{ind.innerText="";},2000); }
    function updateOnlineList(user) { onlineUsers[user]=Date.now(); renderOnlineList(); }
    function cleanOnlineList() { const now=Date.now(); for(const u in onlineUsers)if(now-onlineUsers[u]>40000)delete onlineUsers[u]; renderOnlineList(); }
    function renderOnlineList() { const l=document.getElementById('online-list'); const c=document.getElementById('online-count'); l.innerHTML=""; let count=0; for(const u in onlineUsers){ const li=document.createElement('li'); li.innerHTML=`<span style="color:var(--ios-green)">●</span> ${u}`; l.appendChild(li); count++; } if(c)c.innerText=count; }
    function debouncedSaveToLocal() { clearTimeout(saveDebounce); saveDebounce = setTimeout(() => saveToLocal(), 1000); }
    function debouncedUpdateServerStorage() { clearTimeout(storageDebounce); storageDebounce = setTimeout(() => updateServerStorage(), 5000); }
    function handleTyping() { const el = document.getElementById('msg-input'); el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; if (!typingThrottle && client && client.connected) { typingThrottle = true; client.publish(myRoom, JSON.stringify({type:'typing', user:myName})); setTimeout(() => { typingThrottle = false; }, 1000); } }

    function toggleSidebar() { const sb=document.getElementById('sidebar'); const ov=document.getElementById('sidebar-overlay'); if(sb.style.left==='0px'){sb.style.left='-350px';sb.classList.remove('active');ov.style.display='none';}else{sb.style.left='0px';sb.classList.add('active');ov.style.display='block';} }
    function handleBackgroundUpload(input) { const f=input.files[0]; if(f){ const r=new FileReader(); r.onload=e=>{try{localStorage.setItem('aksara_bg_image',e.target.result); document.body.style.backgroundImage=`url(${e.target.result})`; showToast("Background diganti","success");}catch(e){showToast("Gambar kebesaran","error");}}; r.readAsDataURL(f); } }
    function resetBackground() { localStorage.removeItem('aksara_bg_image'); document.body.style.backgroundImage=""; showToast("Background reset","info"); }
    function toggleSound() { isSoundOn=document.getElementById('sound-toggle').checked; localStorage.setItem('aksara_sound',isSoundOn); }
    function toggleEnterSettings() { sendOnEnter=document.getElementById('enter-toggle').checked; localStorage.setItem('aksara_enter',sendOnEnter); }
    function toggleNotifSettings() { tabNotificationsOn = document.getElementById('notif-toggle').checked; localStorage.setItem('aksara_notif', tabNotificationsOn); showToast(`Tab notifications ${tabNotificationsOn ? 'diaktifkan' : 'dinonaktifkan'}`, "info"); }
    function goToOfficialChannel() { const currentUser = myName || document.getElementById('username').value; if (currentUser) localStorage.setItem('aksara_redirect_user', currentUser); let currentRoomName = myRoom ? myRoom.replace('aksara-v29/', '') : document.getElementById('room').value.trim(); if (currentRoomName && currentRoomName.toLowerCase() !== 'aksara') localStorage.setItem('aksara_origin_room', currentRoomName); window.open('official.html', '_self'); }
    
    function initializeNotificationSystem() { originalTitle = document.title; window.addEventListener('focus', () => { isWindowFocused = true; resetNotifications(); }); window.addEventListener('blur', () => { isWindowFocused = false; }); window.addEventListener('visibilitychange', () => { if (!document.hidden) resetNotifications(); }); if ("Notification" in window && Notification.permission === "default") setTimeout(() => Notification.requestPermission(), 2000); }
    function resetNotifications() { if (titleBlinkInterval) { clearInterval(titleBlinkInterval); titleBlinkInterval = null; } document.title = originalTitle; unreadCount = 0; const header = document.querySelector('header'); if (header) header.style.boxShadow = ''; }
    function unlockAudio() { if (audioUnlocked) return; const unlock = () => { const silentPlay = (audio) => { if (!audio) return Promise.resolve(); audio.volume = 0.01; return audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 1.0; return true; }).catch(() => false); }; Promise.all([silentPlay(notifAudio), silentPlay(sentAudio)]).then(results => { if (results.some(result => result)) audioUnlocked = true; }); }; unlock(); const e = () => { unlock(); document.removeEventListener('click', e); document.removeEventListener('keydown', e); document.removeEventListener('touchstart', e); }; document.addEventListener('click', e); document.addEventListener('keydown', e); document.addEventListener('touchstart', e); }
    function playSound(type) { if (!isSoundOn) return; const audio = (type === 'sent') ? sentAudio : notifAudio; if (!audio) return; audio.volume = (type === 'sent') ? 0.4 : 1.0; audio.currentTime = 0; audio.play().catch(error => {}); }

    // MEDIA FUNCTIONS
    function triggerImageUpload() { document.getElementById('chat-file-input').click(); }
    function handleImageUpload(input) { const f = input.files[0]; if(f){ const r=new FileReader(); r.onload=e=>{ tempImageBase64 = e.target.result; document.getElementById('preview-img').src=tempImageBase64; document.getElementById('image-preview-modal').style.display='flex'; }; r.readAsDataURL(f); } input.value=""; }
    function cancelImagePreview() { document.getElementById('image-preview-modal').style.display='none'; document.getElementById('img-caption').value=""; tempImageBase64=null; }
    function sendImageWithCaption() { if(!tempImageBase64) return; const caption = document.getElementById('img-caption').value.trim(); const img = new Image(); img.src = tempImageBase64; img.onload = function() { requestAnimationFrame(() => { const c = document.createElement('canvas'); const ctx = c.getContext('2d'); const s = 300/img.width; c.width = 300; c.height = img.height * s; ctx.drawImage(img, 0, 0, c.width, c.height); publishMessage(c.toDataURL('image/jpeg', 0.6), 'image', caption); cancelImagePreview(); }); } }
    function sendVoiceNote() { const r = new FileReader(); r.readAsDataURL(audioBlobData); r.onloadend = () => { publishMessage(r.result, 'audio'); cancelVoiceNote(); }; }
    function cancelVoiceNote() { audioBlobData = null; document.getElementById('vn-preview-bar').style.display = 'none'; document.getElementById('main-input-area').style.display = 'flex'; }
    function setReply(id, user, text) { replyingTo = { id, user, text }; document.getElementById('reply-preview-bar').style.display = 'flex'; document.getElementById('reply-to-user').innerText = user; document.getElementById('reply-preview-text').innerText = text.substring(0,50)+'...'; document.getElementById('msg-input').focus(); }
    function cancelReply() { replyingTo = null; document.getElementById('reply-preview-bar').style.display = 'none'; }
    function scrollToMessage(msgId) { const el = document.getElementById(msgId); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash-highlight'); setTimeout(() => el.classList.remove('flash-highlight'), 1000); } else { showToast("Pesan tidak ditemukan.", "info"); } }
    function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox-overlay').style.display = 'flex'; }
    function closeLightbox(e) { if (e.target.classList.contains('lightbox-close') || e.target.id === 'lightbox-overlay') { document.getElementById('lightbox-overlay').style.display = 'none'; } }
    async function toggleRecording() { if (!isRecording) { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder = new MediaRecorder(stream); audioChunks = []; mediaRecorder.ondataavailable = e => audioChunks.push(e.data); mediaRecorder.onstop = () => { audioBlobData = new Blob(audioChunks, { type: 'audio/webm' }); document.getElementById('vn-player').src = URL.createObjectURL(audioBlobData); document.getElementById('vn-preview-bar').style.display = 'flex'; document.getElementById('main-input-area').style.display = 'none'; }; mediaRecorder.start(); isRecording = true; document.getElementById('mic-btn').classList.add('recording'); } catch (err) { showToast("Butuh izin mic!", "error"); } } else { mediaRecorder.stop(); isRecording = false; document.getElementById('mic-btn').classList.remove('recording'); } }
    function leaveRoom() { if(confirm("Keluar?")) { if (pingInterval) clearInterval(pingInterval); if (titleBlinkInterval) clearInterval(titleBlinkInterval); publishMessage("telah keluar.", 'system'); setTimeout(() => { localStorage.removeItem('aksara_name'); localStorage.removeItem('aksara_room'); location.reload(); }, 1000); } }

    // ==================== INIT & BRIDGE ====================

                    // --- TEMPEL INI DI BAGIAN PALING BAWAH, GANTIKAN SEMUA window.addEventListener LAINNYA ---
    window.addEventListener('load', () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .date-divider { display: flex; justify-content: center; margin: 15px 0; position: relative; }
            .date-divider span { background: rgba(0, 0, 0, 0.2); color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 500; backdrop-filter: blur(5px); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .message-mention { border: 2px solid #FFD700 !important; background: rgba(255, 215, 0, 0.15) !important; animation: mentionPulse 1.5s infinite ease-in-out; }
            @keyframes mentionPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); } }
            
            /* --- CSS ADMIN CARD (FIXED) --- */
            .message.admin {
                width: 85%; max-width: 350px; margin: 20px auto !important; 
                background: linear-gradient(180deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%);
                border: 1px solid #FFD700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.2); border-radius: 16px;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important; /* Rata Tengah Horizontal */
                justify-content: center !important; /* Rata Tengah Vertikal */
                
                padding: 25px 20px; /* Padding agak besar biar lega */
                text-align: center;
                box-sizing: border-box; /* Agar padding tidak merusak lebar */
            }
            .admin-badge {
                display: flex !important; flex-direction: row !important; justify-content: center !important; 
                align-items: center !important; width: 100%; margin-bottom: 12px; gap: 1px;
                font-size: 12px; font-weight: 900; letter-spacing: 1px; color: #FFD700; text-transform: uppercase;
            }
            .admin-content {
                /* --- FONT KHAS IOS (APPLE STYLE) --- */
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                
                font-weight: 400; /* Ketebalan normal khas iOS */
                font-style: normal; /* Hapus italic biar terlihat modern */
                font-size: 16px; 
                line-height: 1.5; 
                color: #ffffff; 
                text-align: center !important;
                width: 100% !important; /* Wajib full width */
                display: block !important;
                margin: 0 auto 15px auto !important; /* Tengah kiri-kanan */
            
            }
            .admin-time {
                display: flex; justify-content: center !important; align-items: center !important; 
                gap: 8px; width: 100%; color: #888; font-size: 11px;
            }
            .admin-actions {
                display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.1); 
                padding: 4px 8px; border-radius: 20px;
            }

            /* --- CSS TOMBOL SCROLL (FIXED POSITION) --- */
            #scroll-bottom-btn {
                position: absolute;
                bottom: 85px; right: 15px; width: 35px; height: 35px;
                background: rgba(30, 30, 30, 0.9); backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50%;
                color: #fff; display: flex; justify-content: center; align-items: center;
                cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 999;
                opacity: 0; visibility: hidden; transform: translateY(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #scroll-bottom-btn.show { opacity: 1; visibility: visible; transform: translateY(0); }
            #new-msg-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ff4444; border-radius: 50%; display: none; border: 2px solid #1e1e1e; }
        `;
        document.head.appendChild(style);

        // 2. INJECT TOMBOL SCROLL & BADGE
        const chatScreenElement = document.getElementById('chat-screen');
        if (chatScreenElement && !document.getElementById('scroll-bottom-btn')) {
            const btnDiv = document.createElement('div');
            btnDiv.id = 'scroll-bottom-btn';
            btnDiv.onclick = function() { 
                window.scrollToBottom(true);
                const badge = document.getElementById('new-msg-badge');
                if(badge) badge.style.display = 'none';
            };
            btnDiv.innerHTML = `<i class="material-icons">keyboard_arrow_down</i><span id="new-msg-badge"></span>`;
            const footer = chatScreenElement.querySelector('.footer-container');
            if (footer) chatScreenElement.insertBefore(btnDiv, footer);
            else chatScreenElement.appendChild(btnDiv);
        }
        
        // 3. PANGGIL LISTENER SCROLL
        if (typeof initScrollListener === 'function') initScrollListener();

                // 4. LOAD DATA USER & AUTO LOGIN (VERSI AMAN / ANTI ERROR)
        const returnUser = localStorage.getItem('aksara_redirect_user');
        const returnRoom = localStorage.getItem('aksara_origin_room');
        
        // Kita ambil elemennya dulu ke variabel
        const usernameInput = document.getElementById('username');
        const roomInput = document.getElementById('room');

        if (returnUser && returnRoom) {
            // Cek dulu: Apakah elemen inputnya ada? Kalau ada baru diisi.
            if (usernameInput) usernameInput.value = returnUser;
            if (roomInput) roomInput.value = returnRoom;
            
            localStorage.removeItem('aksara_origin_room');
            setTimeout(() => startChat(), 500); 
        } else {
            // Cek dulu: Apakah elemen inputnya ada?
            if (localStorage.getItem('aksara_name') && usernameInput) {
                usernameInput.value = localStorage.getItem('aksara_name');
            }
            if (localStorage.getItem('aksara_room') && roomInput) {
                roomInput.value = localStorage.getItem('aksara_room');
            }
        }


        // 5. RESTORE SETTINGS
        isSoundOn = (localStorage.getItem('aksara_sound') === 'true');
        sendOnEnter = (localStorage.getItem('aksara_enter') === 'true');
        tabNotificationsOn = (localStorage.getItem('aksara_notif') !== 'false');
        
        const toggleS = document.getElementById('sound-toggle'); if(toggleS) toggleS.checked = isSoundOn;
        const toggleE = document.getElementById('enter-toggle'); if(toggleE) toggleE.checked = sendOnEnter;
        const toggleN = document.getElementById('notif-toggle'); if(toggleN) toggleN.checked = tabNotificationsOn;

        const savedBg = localStorage.getItem('aksara_bg_image');
        if(savedBg) document.body.style.backgroundImage = `url(${savedBg})`;

        initSecretAdminGesture();
        initializeNotificationSystem();
        setTimeout(unlockAudio, 1000);
    });


    // --- CLEANUP LISTENER ---
    window.addEventListener('beforeunload', () => {
        if (pingInterval) clearInterval(pingInterval);
        if (titleBlinkInterval) clearInterval(titleBlinkInterval);
        if (client) client.end();
    });

    // --- FUNGSI LISTENER SCROLL ---
    function initScrollListener() {
        const chatBox = document.getElementById('messages');
        const btn = document.getElementById('scroll-bottom-btn');
        const badge = document.getElementById('new-msg-badge');

        if (!chatBox || !btn) return;

        chatBox.addEventListener('scroll', () => {
            const distanceToBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
            if (distanceToBottom > 150) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
                if(badge) badge.style.display = 'none'; 
            }
        });
    }




    // --- BRIDGE: MENGHUBUNGKAN HTML KE JS ---
    window.startChat = startChat;
    window.StartChat = startChat;
    
    window.handleTyping = handleTyping;
    window.HandleTyping = handleTyping;
    
    window.handleEnter = handleEnter;
    window.HandleEnter = handleEnter;

    window.sendMessage = sendMessage;
    window.toggleSidebar = toggleSidebar;
    window.triggerImageUpload = triggerImageUpload;
    window.handleImageUpload = handleImageUpload;
    window.cancelImagePreview = cancelImagePreview;
    window.sendImageWithCaption = sendImageWithCaption;
    window.toggleRecording = toggleRecording;
    window.handleBackgroundUpload = handleBackgroundUpload;
    window.resetBackground = resetBackground;
    window.toggleSound = toggleSound;
    window.toggleEnterSettings = toggleEnterSettings;
    window.toggleNotifSettings = toggleNotifSettings;
    window.leaveRoom = leaveRoom;
    window.sendVoiceNote = sendVoiceNote;
    window.cancelVoiceNote = cancelVoiceNote;
    window.setReply = setReply;
    window.cancelReply = cancelReply;
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;
    window.scrollToMessage = scrollToMessage;
    window.deleteAnyMessage = deleteAnyMessage;
    window.goToOfficialChannel = goToOfficialChannel;
    
    window.scrollToBottom = scrollToBottom;
    window.ScrollToBottom = scrollToBottom;

    console.log("🚀 Aksara System");

})();
