/* AKSARA OFFICIAL SYSTEM */

(function() {
    // Official Channel Configuration
    const OFFICIAL_CHANNEL = true;
    let isSuperAdmin = false;

    const SUPER_ADMIN_CONFIG = {
        passwordHash: "71710", 
        adminUsername: "Aksara"
    };

    let client;
    let myName = "";
    let myRoom = "";
    let storageTopic = ""; 
    const broadcastTopic = "aksara-global-v1/announcements";

    // State Variables
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

    // PERFORMANCE OPTIMIZATION VARIABLES
    let saveDebounce, storageDebounce, typingThrottle = false;
    let pingInterval;

    // NOTIFICATION SYSTEM VARIABLES
    let originalTitle = "";
    let titleBlinkInterval;
    let unreadCount = 0;
    let isWindowFocused = true;
    let audioUnlocked = false;

    // Audio Elements
    const notifAudio = document.getElementById('notifSound');
    const sentAudio = document.getElementById('sentSound');

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
                authenticateSuperAdmin();
            }
            lastTap = currentTime;
        });
    }

    function authenticateSuperAdmin() {
        if (isSuperAdmin) return;

        const password = prompt("🔐 AMMO ACCESS\nMasukkan Karakter:");
        if (!password) return false;
        
        const inputHash = customHash(password);
        if (inputHash === SUPER_ADMIN_CONFIG.passwordHash) {
            enableSuperAdminMode();
            return true;
        } else {
            showToast("Akses Ditolak!", "error");
            return false;
        }
    }

    function enableSuperAdminMode() {
        isSuperAdmin = true;
        isAdminMode = true;
        
        myName = SUPER_ADMIN_CONFIG.adminUsername;
        document.getElementById('side-user').innerText = "Aksara (Super Admin)";
        
        const inputWrapper = document.getElementById('input-wrapper');
        if(inputWrapper) inputWrapper.classList.add('super-admin-active');
        
        const sendBtn = document.getElementById('send-btn');
        if(sendBtn) sendBtn.style.background = '#FFD700';
        
        document.getElementById('admin-wallpaper-settings').style.display = 'block';
        document.getElementById('admin-online-section').style.display = 'block';
        
        renderAdminExitButton(true);

        showToast("⚡ MODE ADMIN AKTIF", "success");
        renderChat(false);
    }

    function disableSuperAdminMode() {
        isSuperAdmin = false;
        isAdminMode = false;

        const originalUser = localStorage.getItem('aksara_name') || document.getElementById('username').value || "Guest";
        myName = originalUser;

        document.getElementById('side-user').innerText = myName;

        const inputWrapper = document.getElementById('input-wrapper');
        if(inputWrapper) inputWrapper.classList.remove('super-admin-active');

        const sendBtn = document.getElementById('send-btn');
        if(sendBtn) sendBtn.style.background = ''; 

        document.getElementById('admin-wallpaper-settings').style.display = 'none';
        document.getElementById('admin-online-section').style.display = 'none';

        renderAdminExitButton(false);

        showToast("Mode Admin Nonaktif", "info");
        renderChat(false);
    }

    function renderAdminExitButton(show) {
        let exitBtn = document.getElementById('admin-exit-btn-dynamic');
        
        if (show) {
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.id = 'admin-exit-btn-dynamic';
                exitBtn.className = 'sidebar-btn';
                
                Object.assign(exitBtn.style, {
                    background: 'rgba(255, 59, 48, 0.15)',
                    color: '#FF3B30',
                    fontWeight: '600',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    marginTop: 'auto',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s'
                });
                
                exitBtn.innerHTML = `<i class="material-icons">security_update_warning</i> Keluar Mode Admin`;
                exitBtn.onclick = function() {
                    if(confirm("Keluar dari Mode Admin?")) {
                        disableSuperAdminMode();
                    }
                };
                
                const sidebar = document.getElementById('sidebar');
                const logoutBtn = sidebar.querySelector('.logout');
                if (sidebar) {
                    if(logoutBtn) sidebar.insertBefore(exitBtn, logoutBtn);
                    else sidebar.appendChild(exitBtn);
                }
            }
            exitBtn.style.display = 'flex';
        } else {
            if (exitBtn) exitBtn.style.display = 'none';
        }
    }

    function handleSpecialCommands(text) { return false; }

    // ==================== DATE FORMATTER & DIVIDER LOGIC ====================

    function getDateLabel(timestamp) {
        if (!timestamp) return null;
        
        const date = new Date(timestamp);
        const now = new Date();
        
        const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffTime = nowMidnight - dateMidnight;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
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

    // ==================== APPROVAL SYSTEM ====================

    function approveMessage(messageId) {
        if (!isSuperAdmin) return;

        const msgIndex = localChatHistory.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            localChatHistory[msgIndex].status = 'approved';
            debouncedSaveToLocal();
            updateServerStorage();
        }

        if (client && client.connected) {
            client.publish(myRoom, JSON.stringify({
                type: 'message_approved',
                targetId: messageId,
                timestamp: Date.now()
            }));
            showToast("Pesan disetujui", "success");
            renderChat(false); 
        }
    }

    function handleMessageApproval(data) {
        const foundMsg = localChatHistory.find(m => m.id === data.targetId);
        if (foundMsg) {
            foundMsg.status = 'approved';
            debouncedSaveToLocal();
        }
        renderChat(false);
    }

    // ==================== MODIFIED MESSAGE SYSTEM ====================

    function createOfficialMessageElement(data) {
        if (!data || !data.content || data.content === 'undefined') return null;

        if (data.type === 'system') {
            const div = document.createElement('div');
            div.style.textAlign = 'center'; div.style.fontSize = '11px'; div.style.color = '#fff'; div.style.opacity = '0.7'; div.style.margin = '10px 0'; 
            div.innerText = `${data.user} ${data.content}`;
            return div;
        }

        const isOfficialAdmin = data.user === SUPER_ADMIN_CONFIG.adminUsername;
        const isMe = data.user === myName;
        
        // LOGIKA VISIBILITY:
        if (data.status === 'pending') {
            if (!isSuperAdmin && !isMe) {
                return null; 
            }
        }

        const div = document.createElement('div');
        if (data.id) div.id = data.id;

        let pendingBadge = '';
        if (data.status === 'pending' && !isOfficialAdmin) {
            div.classList.add('pending-msg');
            pendingBadge = `<div class="pending-badge"><i class="material-icons">hourglass_empty</i> Menunggu System</div>`;
        }

        let adminActionsHtml = '';
        if (isSuperAdmin) {
            let approveBtn = '';
            if (data.status === 'pending') {
                approveBtn = `
                <button onclick="window.approveMessage('${data.id}')" style="background:var(--ios-green); color:white; border:none; border-radius:6px; padding:4px 10px; display:flex; align-items:center; gap:4px; font-size:11px; cursor:pointer;">
                    <i class="material-icons" style="font-size:14px;">check</i> Terima
                </button>`;
            }

            adminActionsHtml = `
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; padding-top:8px; border-top:1px solid rgba(0,0,0,0.1);">
                ${approveBtn}
                <button onclick="window.deleteAnyMessage('${data.id}')" style="background:#ff3b30; color:white; border:none; border-radius:6px; padding:4px 10px; display:flex; align-items:center; gap:4px; font-size:11px; cursor:pointer;">
                    <i class="material-icons" style="font-size:14px;">delete</i> Hapus
                </button>
            </div>`;
        }
        
        let contentHtml = "";
        if (data.type === 'text' || data.type === 'admin') {
            contentHtml = `<div class="message-text">${data.content}</div>`;
        } else if (data.type === 'image') {
            contentHtml = `<img src="${data.content}" class="chat-image" onclick="window.openLightbox(this.src)" style="max-height:200px; width:auto; border-radius:8px;">` + (data.caption ? `<div style="font-size:12px;margin-top:5px">${data.caption}</div>` : '');
        } else if (data.type === 'audio') {
            contentHtml = `<audio controls src="${data.content}"></audio>`;
        }

        if (isOfficialAdmin) {
            div.className = 'message official-admin';
            div.innerHTML = `
                <div class="admin-avatar-container">
                    <img src="https://i.imgur.com/Ct0pzwl.png" class="admin-avatar" alt="Aksara">
                </div>
                <div class="message-content" style="width:100%">
                    <div class="admin-header">
                        <span class="admin-title">Aksara</span>
                        <i class="material-icons verified-gold">verified</i>
                    </div>
                    ${contentHtml}
                    <div class="message-time">${data.time}</div>
                    ${adminActionsHtml} 
                </div>
            `;
        } else {
            div.className = isMe ? 'message right' : 'message left';
            const textColor = isMe ? 'white' : 'black';
            div.style.position = 'relative'; 
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                    <span class="sender-name" style="color:${isMe ? 'rgba(255,255,255,0.8)' : '#888'}">${data.user}</span>
                    ${pendingBadge}
                </div>
                <div style="color:${textColor}; word-wrap:break-word;">${contentHtml}</div>
                <div class="time-info" style="color:${isMe ? 'rgba(255,255,255,0.7)' : '#999'}">${data.time}</div>
                ${adminActionsHtml}
            `;
        }
        
        return div;
    }

    // ==================== CORE FUNCTIONS ====================

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
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            setTimeout(() => toast.remove(), 500); 
        }, 3000);
    }

    function sendMessage() {
        const input = document.getElementById('msg-input');
        if(!input) return;
        const text = input.value.trim();
        if (!text) return;

        if (handleSpecialCommands(text)) return;
        
        publishMessage(text, 'text');
        input.value = '';
        input.style.height = 'auto';
        input.focus();
    }

    function deleteAnyMessage(messageId) {
        if (!isSuperAdmin) {
            showToast("Akses Ditolak", "error");
            return;
        }
        
        if (!confirm("Hapus pesan ini secara permanen?")) return;
        
        const msgEl = document.getElementById(messageId);
        if(msgEl) msgEl.style.opacity = '0.3';

        if (client && client.connected) {
            client.publish(myRoom, JSON.stringify({
                type: 'message_deleted',
                targetId: messageId,
                deletedBy: "Admin",
                timestamp: Date.now()
            }));
            
            localChatHistory = localChatHistory.filter(msg => msg.id !== messageId);
            debouncedSaveToLocal();
            updateServerStorage(); 
            showToast("Pesan dihapus", "success");
        }
    }

    function handleMessageDeletion(data) {
        if (data.type === 'message_deleted') {
            const messageElement = document.getElementById(data.targetId);
            if (messageElement) {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.transform = 'scale(0.9)';
                messageElement.style.opacity = '0';
                setTimeout(() => {
                    messageElement.remove();
                }, 300);
            }
            localChatHistory = localChatHistory.filter(msg => msg.id !== data.targetId);
            debouncedSaveToLocal();
        }
    }

    function publishMessage(content, type = 'text', caption = '') {
        if (!content) return;
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        let finalType = type;
        let finalTopic = myRoom;
        let mqttOpts = {};
        
        let initialStatus = (isSuperAdmin || type === 'system') ? 'approved' : 'pending';

        if (isSuperAdmin) {
            finalTopic = broadcastTopic; 
            mqttOpts = { retain: true, qos: 1 };
            if (type === 'text') finalType = 'admin';
        }

        const payload = { 
            id: msgId, 
            user: myName, 
            content: content, 
            type: finalType, 
            caption: caption, 
            time: time, 
            timestamp: Date.now(),
            isAdmin: isSuperAdmin,
            status: initialStatus 
        };

        try { 
            client.publish(finalTopic, JSON.stringify(payload), mqttOpts); 
            if (isSoundOn && type !== 'system') playSound('sent');
            
            if (!isSuperAdmin && type !== 'system') {
                showToast("Pesan dikirim, menunggu admin/system.", "info");
            }
        } catch(e) { 
            showToast("Gagal kirim", "error"); 
        }
    }

    function handleIncomingMessage(data) {
        if (!data || !data.content || data.content === 'undefined') return;

        if (data.type === 'message_deleted') {
            handleMessageDeletion(data);
            return; 
        }
        
        if (data.type === 'message_approved') {
            handleMessageApproval(data);
            return;
        }
        
        const isSystem = (data.type === 'system');
        const isMe = data.user === myName;
        
        if (!isSystem) {
            if (!localChatHistory.some(msg => msg.id === data.id)) {
                if (!data.status) data.status = data.isAdmin ? 'approved' : 'pending';
                
                localChatHistory.push(data);
                if (localChatHistory.length > 77) localChatHistory = localChatHistory.slice(-77); 
                
                debouncedSaveToLocal();
                
                // RENDER ULANG (Akan memasukkan date divider jika perlu)
                renderChat(); 

                if (!isMe) playSound('received');

                if (isMe && (data.isAdmin || data.status === 'approved')) {
                    debouncedUpdateServerStorage();
                }
            }
        } else {
            // Untuk system message, kita juga harus render ulang agar urutan tanggal benar
            localChatHistory.push(data);
            renderChat(true);
        }
    }

    function renderChat(forceScroll = false) {
        const chatBox = document.getElementById('messages');
        chatBox.innerHTML = '<div class="welcome-msg">Official Channel - Moderated Chat</div>';
        
        localChatHistory.sort((a,b) => a.timestamp - b.timestamp);

        let lastDateLabel = null;

        localChatHistory.forEach(msg => { 
            // 1. Logic Date Divider
            if (msg.timestamp) {
                const currentDateLabel = getDateLabel(msg.timestamp);
                if (currentDateLabel && currentDateLabel !== lastDateLabel) {

                    chatBox.appendChild(createDateDivider(currentDateLabel));
                    lastDateLabel = currentDateLabel;
                }
            }

            // 2. Render Pesan
            const el = createOfficialMessageElement(msg);
            if (el) chatBox.appendChild(el); 
        });
        
        scrollToBottom(forceScroll);
    }

    function scrollToBottom(force = false) {
        const chatBox = document.getElementById('messages');
        const isAtBottom = (chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) < 150;
        if (force || isAtBottom) {
            setTimeout(() => {
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 100);
        }
    }

    // ==================== PERFORMANCE OPTIMIZED FUNCTIONS ====================

    function debouncedSaveToLocal() {
        clearTimeout(saveDebounce);
        saveDebounce = setTimeout(() => saveToLocal(), 1000);
    }

    function debouncedUpdateServerStorage() {
        clearTimeout(storageDebounce);
        storageDebounce = setTimeout(() => updateServerStorage(), 5000);
    }

    function handleTyping() {
        const el = document.getElementById('msg-input');
        if(!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
        
        if (!typingThrottle && client && client.connected) {
            typingThrottle = true;
            client.publish(myRoom, JSON.stringify({type:'typing', user:myName}));
            setTimeout(() => { typingThrottle = false; }, 1000);
        }
    }

    // ==================== NOTIFICATION & SOUND ====================

    function initializeNotificationSystem() {
        originalTitle = document.title;
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('visibilitychange', handleVisibilityChange);
        initializeBrowserNotifications();
    }

    function handleWindowFocus() { isWindowFocused = true; resetNotifications(); }
    function handleWindowBlur() { isWindowFocused = false; }
    function handleVisibilityChange() { if (!document.hidden) resetNotifications(); }

    function initializeBrowserNotifications() {
        if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => { Notification.requestPermission(); }, 2000);
        }
    }

    function showNewMessageNotification(message) {
        if (!tabNotificationsOn) return;
        if (message.user === myName) return;
        if (message.type === 'system' || (message.status === 'pending' && !isSuperAdmin)) return;
        
        unreadCount++;
        startTitleBlinking(message);
        updateFaviconBadge();
        playSound('received');
        showBrowserNotification(message);
    }

    function startTitleBlinking(message) {
        if (titleBlinkInterval) clearInterval(titleBlinkInterval);
        const messagePreview = message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content;
        let showAlert = true;
        titleBlinkInterval = setInterval(() => {
            document.title = showAlert ? `🔔 (${unreadCount}) ${message.user}: ${messagePreview}` : originalTitle;
            showAlert = !showAlert;
        }, 1000);
    }

    function updateFaviconBadge() {
        const header = document.querySelector('header');
        if (header && unreadCount > 0 && !isWindowFocused) {
            header.style.boxShadow = '0 0 0 2px var(--ios-red)';
        } else if (header) {
            header.style.boxShadow = '';
        }
    }

    function showBrowserNotification(message) {
        if (!("Notification" in window) || Notification.permission !== "granted" || document.hasFocus()) return;
        const notification = new Notification(`Pesan dari ${message.user}`, {
            body: message.type === 'text' ? message.content : `Mengirim ${message.type}`,
            icon: 'https://i.imgur.com/Ct0pzwl.png',
            tag: 'aksara-chat',
            requireInteraction: false
        });
        notification.onclick = function() { window.focus(); notification.close(); };
        setTimeout(() => notification.close(), 5000);
    }

    function resetNotifications() {
        if (titleBlinkInterval) { clearInterval(titleBlinkInterval); titleBlinkInterval = null; }
        document.title = originalTitle;
        unreadCount = 0;
        const header = document.querySelector('header');
        if (header) header.style.boxShadow = '';
    }

    function unlockAudio() {
        if (audioUnlocked) return;
        const unlock = () => {
            const silentPlay = (audio) => {
                if (!audio) return Promise.resolve();
                audio.volume = 0.01;
                return audio.play().then(() => {
                    audio.pause(); audio.currentTime = 0; audio.volume = 1.0; return true;
                }).catch(() => false);
            };
            Promise.all([silentPlay(notifAudio), silentPlay(sentAudio)]).then(results => {
                if (results.some(result => result)) audioUnlocked = true;
            });
        };
        unlock();
        const e = () => { unlock(); document.removeEventListener('click', e); document.removeEventListener('keydown', e); document.removeEventListener('touchstart', e); };
        document.addEventListener('click', e); document.addEventListener('keydown', e); document.addEventListener('touchstart', e);
    }

    function playSound(type) {
        if (!isSoundOn) return;
        const audio = (type === 'sent') ? sentAudio : notifAudio;
        if (!audio) return;
        audio.volume = (type === 'sent') ? 0.4 : 1.0;
        audio.currentTime = 0;
        audio.play().catch(error => {});
    }

    // ==================== CHAT SYSTEM ====================

    function startChat() {
        const userEl = document.getElementById('username');
        const roomEl = document.getElementById('room');
        
        if (!userEl || !roomEl) { console.error("Critical elements missing"); return; }

        const user = userEl.value.trim();
        const room = roomEl.value.trim().toLowerCase();
        
        if (!user || !room) { showToast("Data tidak lengkap", "error"); return; }

        localStorage.setItem('aksara_name', user);
        localStorage.setItem('aksara_room', room);
        
        myName = user;
        myRoom = "aksara-v29/" + room; 
        storageTopic = myRoom + "/storage"; 

        document.getElementById('side-user').innerText = myName;
        const chatScreen = document.getElementById('chat-screen');
        if(chatScreen) chatScreen.style.display = 'flex';
        document.getElementById('room-display').innerText = "#" + room;
        document.getElementById('typing-indicator').innerText = "Menghubungkan...";

        loadFromLocal(); 

        const options = { 
            protocol: 'wss', host: 'broker.emqx.io', port: 8084, path: '/mqtt',
            clean: true, reconnectPeriod: 4000, connectTimeout: 10000,
            clientId: 'aks_official_' + Math.random().toString(16).substr(2, 8)
        };
        
        try {
            client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', options);

            client.on('connect', () => {
                console.log("✅ MQTT Connected!");
                document.getElementById('typing-indicator').innerText = "";
                client.subscribe(myRoom); 
                client.subscribe(storageTopic);
                client.subscribe(broadcastTopic); 
                
                publishMessage("bergabung.", 'system');
                showToast("Connected to Official Channel!", "success");
                
                pingInterval = setInterval(() => { 
                    if (client && client.connected) {
                        client.publish(myRoom, JSON.stringify({ type: 'ping', user: myName })); 
                        cleanOnlineList(); 
                    }
                }, 30000);
            });

            client.on('message', (topic, message) => {
                const msgString = message.toString();
                try {
                    const data = JSON.parse(msgString);
                    
                    if (data.type === 'admin_wallpaper') {
                        localStorage.setItem('aksara_official_bg', data.content);
                        document.body.style.backgroundImage = `url(${data.content})`;
                        showToast("Wallpaper diperbarui oleh Admin", "info");
                        return;
                    }

                    if (data.type === 'typing') showTyping(data.user);
                    else if (data.type === 'ping') updateOnlineList(data.user);
                    else if (data.type === 'message_deleted') handleMessageDeletion(data);
                    else if (data.type === 'message_approved') handleMessageApproval(data);
                    else {
                        handleIncomingMessage(data);
                        updateOnlineList(data.user);
                        if (!isWindowFocused && data.user !== myName) showNewMessageNotification(data);
                    }
                } catch (e) {}
            });
            
            if(topic === storageTopic) {
                try { 
                    const srv = JSON.parse(msgString); 
                    if (Array.isArray(srv)) mergeWithLocal(srv); 
                } catch(e) {} 
            }

            client.on('error', (error) => document.getElementById('typing-indicator').innerText = "Connection error");
            client.on('offline', () => document.getElementById('typing-indicator').innerText = "Reconnecting...");
            client.on('reconnect', () => document.getElementById('typing-indicator').innerText = "Reconnecting...");

        } catch (error) {
            document.getElementById('typing-indicator').innerText = "Failed to connect";
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    function handleEnter(e) { if (e.key === 'Enter' && !e.shiftKey && sendOnEnter) { e.preventDefault(); sendMessage(); } }
    function showTyping(user) { if(user===myName)return; const ind=document.getElementById('typing-indicator'); ind.innerText=`${user} typing...`; clearTimeout(typingTimeout); typingTimeout=setTimeout(()=>{ind.innerText="";},2000); }
    function updateOnlineList(user) { onlineUsers[user]=Date.now(); renderOnlineList(); }
    function cleanOnlineList() { const now=Date.now(); for(const u in onlineUsers)if(now-onlineUsers[u]>40000)delete onlineUsers[u]; renderOnlineList(); }
    function renderOnlineList() { const l=document.getElementById('online-list'); const c=document.getElementById('online-count'); l.innerHTML=""; let count=0; for(const u in onlineUsers){ const li=document.createElement('li'); li.innerHTML=`<span style="color:var(--ios-green)">●</span> ${u}`; l.appendChild(li); count++; } if(c)c.innerText=count; }

    function toggleSidebar() { const sb=document.getElementById('sidebar'); const ov=document.getElementById('sidebar-overlay'); if(sb.style.left==='0px'){sb.style.left='-350px';sb.classList.remove('active');ov.style.display='none';}else{sb.style.left='0px';sb.classList.add('active');ov.style.display='block';} }

    function handleBackgroundUpload(input) { 
        const f=input.files[0]; 
        if(f){ 
            const r=new FileReader(); 
            r.onload=e=>{
                try{
                    const bgData = e.target.result;
                    localStorage.setItem('aksara_official_bg', bgData); 
                    document.body.style.backgroundImage=`url(${bgData})`; 
                    showToast("Background diganti","success");

                    if (isSuperAdmin && client && client.connected) {
                        client.publish(myRoom, JSON.stringify({
                            type: 'admin_wallpaper',
                            content: bgData,
                            user: "Admin"
                        }), { retain: true, qos: 1 });
                        showToast("Wallpaper disinkronkan!", "success");
                    }
                } catch(e){
                    showToast("Gambar terlalu besar!","error");
                }
            }; 
            r.readAsDataURL(f); 
        } 
        input.value=""; 
    }

    function resetBackground() { localStorage.removeItem('aksara_official_bg'); document.body.style.backgroundImage=""; showToast("Background reset","info"); }
    function toggleSound() { isSoundOn=document.getElementById('sound-toggle').checked; localStorage.setItem('aksara_sound',isSoundOn); }
    function toggleEnterSettings() { sendOnEnter=document.getElementById('enter-toggle').checked; localStorage.setItem('aksara_enter',sendOnEnter); }
    function toggleNotifSettings() { tabNotificationsOn=document.getElementById('notif-toggle').checked; localStorage.setItem('aksara_notif',tabNotificationsOn); }

    function loadFromLocal() { 
        const saved = localStorage.getItem(getStorageKey()); 
        if (saved) { 
            let parsedData = JSON.parse(saved);
            const cleanedData = parsedData.filter(msg => {
                return msg && msg.content && msg.content !== 'undefined' && msg.content !== 'null';
            });

            if (cleanedData.length !== parsedData.length) {
                localChatHistory = cleanedData;
                saveToLocal(); 
            } else {
                localChatHistory = parsedData;
            }

            renderChat(); 
        } 
    }

    function saveToLocal() { localStorage.setItem(getStorageKey(), JSON.stringify(localChatHistory)); }
    function getStorageKey() { return 'aksara_history_v29_' + myRoom; }

    function mergeWithLocal(serverData) { 
        let changed = false; 
        serverData.forEach(srvMsg => { 
            if (!srvMsg || !srvMsg.content || srvMsg.content === 'undefined') return;

            if (!localChatHistory.some(locMsg => locMsg.id === srvMsg.id)) { 
                // Kita terima jika Admin, atau System, atau Statusnya Approved
                if(srvMsg.isAdmin || srvMsg.type === 'system' || srvMsg.status === 'approved') {
                    localChatHistory.push(srvMsg); 
                    changed = true; 
                }
            } else {
                // Update status jika lokal masih pending tapi server sudah approved
                const existing = localChatHistory.find(m => m.id === srvMsg.id);
                if (existing && existing.status === 'pending' && srvMsg.status === 'approved') {
                    existing.status = 'approved';
                    changed = true;
                }
            }
        }); 
        if (changed) { 
            localChatHistory.sort((a, b) => a.timestamp - b.timestamp); 
            if (localChatHistory.length > 77) localChatHistory = localChatHistory.slice(-77); 
            debouncedSaveToLocal(); 
            renderChat(); 
        } 
    }

    function updateServerStorage() { 
        if(client && client.connected) {
            // Hanya simpan pesan yang aman (approved/admin/system) ke server
            const safeHistory = localChatHistory.filter(m => m.isAdmin || m.status === 'approved' || m.type === 'system');
            client.publish(storageTopic, JSON.stringify(safeHistory), { retain: true, qos: 1 }); 
        }
    }

    // MEDIA HANDLERS
    function triggerImageUpload() { document.getElementById('chat-file-input').click(); }
    function handleImageUpload(input) { 
        const f = input.files[0]; 
        if(f){ const r=new FileReader(); r.onload=e=>{ tempImageBase64 = e.target.result; document.getElementById('preview-img').src=tempImageBase64; document.getElementById('image-preview-modal').style.display='flex'; }; r.readAsDataURL(f); } input.value=""; 
    }
    function cancelImagePreview() { document.getElementById('image-preview-modal').style.display='none'; document.getElementById('img-caption').value=""; tempImageBase64=null; }
    function sendImageWithCaption() {
        if(!tempImageBase64) return;
        const caption = document.getElementById('img-caption').value.trim(); 
        const img = new Image(); 
        img.src = tempImageBase64;
        img.onload = function() { 
            requestAnimationFrame(() => {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                const s = 300/img.width;
                c.width = 300;
                c.height = img.height * s;
                ctx.drawImage(img, 0, 0, c.width, c.height); 
                publishMessage(c.toDataURL('image/jpeg', 0.6), 'image', caption); 
                cancelImagePreview(); 
            });
        }
    }
    function sendVoiceNote() { const r = new FileReader(); r.readAsDataURL(audioBlobData); r.onloadend = () => { publishMessage(r.result, 'audio'); cancelVoiceNote(); }; }
    function cancelVoiceNote() { audioBlobData = null; document.getElementById('vn-preview-bar').style.display = 'none'; document.getElementById('main-input-area').style.display = 'flex'; }
    function setReply(id, user, text) { replyingTo = { id, user, text }; document.getElementById('reply-preview-bar').style.display = 'flex'; document.getElementById('reply-to-user').innerText = user; document.getElementById('reply-preview-text').innerText = text.substring(0,50)+'...'; document.getElementById('msg-input').focus(); }
    function cancelReply() { replyingTo = null; document.getElementById('reply-preview-bar').style.display = 'none'; }
    function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox-overlay').style.display = 'flex'; }
    function closeLightbox(e) { if (e.target.classList.contains('lightbox-close') || e.target.id === 'lightbox-overlay') { document.getElementById('lightbox-overlay').style.display = 'none'; } }

    async function toggleRecording() {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream); audioChunks = [];
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = () => { audioBlobData = new Blob(audioChunks, { type: 'audio/webm' }); document.getElementById('vn-player').src = URL.createObjectURL(audioBlobData); document.getElementById('vn-preview-bar').style.display = 'flex'; document.getElementById('main-input-area').style.display = 'none'; };
                mediaRecorder.start(); isRecording = true; document.getElementById('mic-btn').classList.add('recording');
            } catch (err) { showToast("Butuh izin mic!", "error"); }
        } else { mediaRecorder.stop(); isRecording = false; document.getElementById('mic-btn').classList.remove('recording'); }
    }

    function leaveRoom() { 
        if(confirm("Kembali ke menu utama?")) { 
            if (pingInterval) clearInterval(pingInterval);
            if (titleBlinkInterval) clearInterval(titleBlinkInterval);
            publishMessage("telah keluar.", 'system'); 
            setTimeout(() => {
                localStorage.removeItem('aksara_room'); 
                window.location.href = 'index.html'; 
            }, 500);
        } 
    }

    window.onload = function() {
        const usernameInput = document.getElementById('username');
        const safeUserVal = usernameInput ? usernameInput.value : 'guest';
        const savedUser = localStorage.getItem('aksara_redirect_user') || localStorage.getItem('aksara_name') || safeUserVal;
        
        if (savedUser && usernameInput) {
            usernameInput.value = savedUser;
            myName = savedUser;
            document.getElementById('side-user').innerText = savedUser;
        }
        
        const roomInput = document.getElementById('room');
        if(roomInput) roomInput.value = "aksara";
        
        isSoundOn = (localStorage.getItem('aksara_sound') === 'true');
        sendOnEnter = (localStorage.getItem('aksara_enter') === 'true');
        tabNotificationsOn = (localStorage.getItem('aksara_notif') !== 'false');
        
        const toggleS = document.getElementById('sound-toggle'); if(toggleS) toggleS.checked = isSoundOn;
        const toggleE = document.getElementById('enter-toggle'); if(toggleE) toggleE.checked = sendOnEnter;
        const toggleN = document.getElementById('notif-toggle'); if(toggleN) toggleN.checked = tabNotificationsOn;

        const savedBg = localStorage.getItem('aksara_official_bg');
        if(savedBg) document.body.style.backgroundImage = `url(${savedBg})`;
        
        initializeNotificationSystem();
        initSecretAdminGesture();
        setTimeout(unlockAudio, 1000);
    };

    // ==================== CSS STYLING (INJECTED) ====================

    const superAdminStyles = `
    <style>
    .message.official-admin {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05));
        border: 1px solid rgba(255,215,0,0.3);
        border-radius: 18px;
        padding: 12px;
        margin: 8px 0;
        max-width: 85%;
        align-self: flex-start;
        backdrop-filter: blur(10px);
    }
    .admin-avatar-container { position: relative; flex-shrink: 0; }
    .admin-avatar { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #FFD700; box-shadow: 0 2px 8px rgba(255,215,0,0.3); }

    .verified-gold {
        font-size: 16px;
        color: #FFD700;
        margin-left: 4px;
        filter: drop-shadow(0 0 2px rgba(255,215,0,0.5));
    }

    .pending-msg { opacity: 0.8 !important; border: 1px dashed rgba(255,255,255,0.4); }
    .pending-badge { font-size: 10px; color: #FFD700; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
    .pending-badge i { font-size: 12px; }

    .admin-header { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
    .admin-title { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800; }
    .message-text { line-height: 1.4; font-size: 14.5px; }
    .message-time { font-size: 11px; margin-top: 4px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
    .super-admin-active { border: 2px solid #FFD700 !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3) !important; background: rgba(255,215,0,0.1) !important; }
    .message { transition: all 0.3s ease; }
    
    .date-divider {
        display: flex;
        justify-content: center;
        margin: 15px 0;
        position: relative;
    }
    .date-divider span {
        background: rgba(0, 0, 0, 0.2);
        color: #fff;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        backdrop-filter: blur(5px);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    </style>
    `;

    document.head.insertAdjacentHTML('beforeend', superAdminStyles);


    window.toggleSidebar = toggleSidebar;
    window.sendMessage = sendMessage;
    window.triggerImageUpload = triggerImageUpload;
    window.handleImageUpload = handleImageUpload;
    window.cancelImagePreview = cancelImagePreview;
    window.sendImageWithCaption = sendImageWithCaption;
    window.toggleRecording = toggleRecording;
    window.handleEnter = handleEnter;
    window.handleTyping = handleTyping;
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
    window.startChat = startChat;
    // Fungsi Admin untuk window
    window.approveMessage = approveMessage;
    window.deleteAnyMessage = deleteAnyMessage;

    console.log("🚀 Aksara Official");

})(); // AKHIR AKSARA SYSTEM
