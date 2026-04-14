// script.js - Pinterest Clone with Admin System

// Global state
let currentUser = null;
let isAdmin = false;
let currentTab = 'created';
let allBoards = [];
let allPins = [];
let currentPinId = null;
const ADMIN_EMAIL = 'jasim28v@gmail.com';

// DOM Elements
const boardsGrid = document.getElementById('boardsGrid');
const pinsGrid = document.getElementById('pinsGrid');
const boardsContainer = document.getElementById('boardsContainer');
const pinsContainer = document.getElementById('pinsContainer');
const uploadBtn = document.getElementById('uploadBtn');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const adminPanel = document.getElementById('adminPanel');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');

// Initialize sample data
const sampleBoards = [
  { name: "خلفيات الجوال، صور الهاتف... Mobile Wallpapers", pinCount: 129, cover: "📱" },
  { name: "صور سوشيال ميديا", pinCount: 9759, cover: "📸" },
  { name: "صور صباح الخير", pinCount: 168, cover: "🌅" },
  { name: "صور اظافر - اكريليك اظافر ديزاين مناكير", pinCount: 25, cover: "💅" },
  { name: "فاشون بناتى حريمى شيك", pinCount: 346, cover: "👗" },
  { name: "صور اسلامية", pinCount: 455, cover: "🕌" },
  { name: "رسومات لتعليم الاطفال التلوين", pinCount: 186, cover: "🎨" },
  { name: "ديكورات وأثاث", pinCount: 2145, cover: "🛋️" },
  { name: "صور رمضان كريم، شهر رمضان المبارك", pinCount: 571, cover: "🌙" },
  { name: "صور اطفال", pinCount: 488, cover: "👶" },
  { name: "صور ورود ، اجمل صور زهور ورد رائعة", pinCount: 309, cover: "🌸" },
  { name: "ازياء وموضة- رجالي", pinCount: 24, cover: "👔" }
];

// Auth state observer
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById('headerAvatar').textContent = user.email.charAt(0).toUpperCase();
    document.body.classList.remove('logged-out');
    document.body.classList.add('logged-in');
    
    // Check if admin
    isAdmin = user.email === ADMIN_EMAIL;
    if (isAdmin) {
      document.body.classList.add('is-admin');
      console.log('✅ Admin logged in:', user.email);
    }
    
    // Update follow button
    document.getElementById('followBtn').textContent = 'متابَع';
  } else {
    currentUser = null;
    isAdmin = false;
    document.getElementById('headerAvatar').textContent = 'ز';
    document.body.classList.add('logged-out');
    document.body.classList.remove('logged-in', 'is-admin');
    document.getElementById('followBtn').textContent = 'متابعة';
    adminPanel.classList.remove('admin-panel');
    adminPanel.style.display = 'none';
  }
});

// Handle user click
function handleUserClick() {
  if (currentUser) {
    // Show user menu or logout
    if (confirm('هل تريد تسجيل الخروج؟')) {
      auth.signOut();
    }
  } else {
    showAuthModal();
  }
}

// Load boards (public access - no login required)
function loadBoards() {
  database.ref('boards').once('value').then(snapshot => {
    let boards = snapshot.val();
    if (!boards) {
      boards = sampleBoards;
      database.ref('boards').set(boards);
    }
    
    allBoards = Array.isArray(boards) ? boards : Object.values(boards);
    renderBoards();
  });
}

function renderBoards() {
  let html = '';
  allBoards.forEach((board, index) => {
    html += `
      <div class="board-card" onclick="viewBoard(${index})">
        <div class="board-cover" style="background: linear-gradient(135deg, #e60023, #c4001d); display: flex; align-items: center; justify-content: center; font-size: 48px;">
          ${board.cover || '📌'}
        </div>
        ${isAdmin ? `<button class="delete-board-btn" onclick="event.stopPropagation(); deleteBoard(${index})"><i class="fas fa-trash"></i></button>` : ''}
        <div class="board-title">${board.name}</div>
        <div class="board-pin-count">${board.pinCount} من الصور</div>
      </div>
    `;
  });
  boardsGrid.innerHTML = html;
}

function deleteBoard(index) {
  if (!isAdmin) {
    alert('فقط الأدمن يمكنه حذف اللوحات');
    return;
  }
  
  if (confirm('هل أنت متأكد من حذف هذه اللوحة؟')) {
    allBoards.splice(index, 1);
    database.ref('boards').set(allBoards);
    renderBoards();
  }
}

function viewBoard(index) {
  const board = allBoards[index];
  currentTab = 'pins';
  boardsContainer.classList.add('hidden');
  pinsContainer.classList.remove('hidden');
  
  document.querySelectorAll('.tab')[0].classList.remove('active');
  document.querySelectorAll('.tab')[1].classList.add('active');
  
  loadPins(board.name);
}

function loadPins(boardName) {
  database.ref('pins').once('value').then(snapshot => {
    let pins = snapshot.val();
    if (!pins) {
      // Sample pins
      pins = {
        pin1: { title: "إطلالة أنيقة", image: "https://picsum.photos/400/500?random=1", creator: "Zeina_Sowary", board: boardName },
        pin2: { title: "فستان سهرة", image: "https://picsum.photos/400/600?random=2", creator: "Zeina_Sowary", board: boardName },
        pin3: { title: "موضة ربيع 2024", image: "https://picsum.photos/400/400?random=3", creator: "Zeina_Sowary", board: boardName },
        pin4: { title: "أكسسوارات راقية", image: "https://picsum.photos/400/700?random=4", creator: "Zeina_Sowary", board: boardName },
        pin5: { title: "تصميم أظافر", image: "https://picsum.photos/400/450?random=5", creator: "Zeina_Sowary", board: boardName },
        pin6: { title: "ديكور منزلي", image: "https://picsum.photos/400/550?random=6", creator: "Zeina_Sowary", board: boardName }
      };
      database.ref('pins').set(pins);
    }
    
    allPins = Object.entries(pins).map(([id, pin]) => ({ id, ...pin }));
    renderPins();
  });
}

function renderPins() {
  let html = '';
  allPins.forEach(pin => {
    html += `
      <div class="pin-card" onclick="openPin('${pin.id}', '${pin.image}', '${pin.title}')">
        <img class="pin-image" src="${pin.image}" alt="${pin.title}">
        <div class="pin-actions">
          <button class="pin-save-btn" onclick="event.stopPropagation(); savePin('${pin.id}')">حفظ</button>
        </div>
        ${isAdmin ? `<button class="delete-pin-btn" onclick="event.stopPropagation(); deletePin('${pin.id}')"><i class="fas fa-trash"></i></button>` : ''}
        <div class="pin-footer">
          <div class="pin-creator-avatar">ز</div>
          <div class="pin-info">
            <div class="pin-title">${pin.title}</div>
            <div class="pin-creator">${pin.creator}</div>
          </div>
        </div>
      </div>
    `;
  });
  pinsGrid.innerHTML = html;
}

function openPin(pinId, imageUrl, title) {
  currentPinId = pinId;
  document.getElementById('modalImage').src = imageUrl;
  document.getElementById('modalTitle').textContent = title;
  modalDeleteBtn.style.display = isAdmin ? 'block' : 'none';
  document.getElementById('pinModal').style.display = 'flex';
}

function closePinModal() {
  document.getElementById('pinModal').style.display = 'none';
  currentPinId = null;
}

function deletePin(pinId) {
  if (!isAdmin) {
    alert('فقط الأدمن يمكنه حذف الصور');
    return;
  }
  
  if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
    const pinRef = database.ref('pins/' + pinId);
    pinRef.remove().then(() => {
      loadPins();
      if (currentPinId === pinId) {
        closePinModal();
      }
    });
  }
}

function deleteCurrentPin() {
  if (currentPinId) {
    deletePin(currentPinId);
  }
}

function deleteAllPins() {
  if (!isAdmin) {
    alert('فقط الأدمن يمكنه حذف جميع الصور');
    return;
  }
  
  if (confirm('تحذير: سيتم حذف جميع الصور نهائياً! هل أنت متأكد؟')) {
    database.ref('pins').remove().then(() => {
      loadPins();
      alert('تم حذف جميع الصور بنجاح');
    });
  }
}

function resetToDefault() {
  if (!isAdmin) {
    alert('فقط الأدمن يمكنه استعادة المحتوى');
    return;
  }
  
  if (confirm('استعادة المحتوى الافتراضي؟')) {
    database.ref('boards').set(sampleBoards);
    database.ref('pins').remove();
    location.reload();
  }
}

function savePin(pinId) {
  if (!currentUser) {
    showAuthModal();
    return;
  }
  alert('تم حفظ الصورة!');
}

function switchTab(tab) {
  currentTab = tab;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tab === 'created') {
    boardsContainer.classList.remove('hidden');
    pinsContainer.classList.add('hidden');
  } else {
    boardsContainer.classList.add('hidden');
    pinsContainer.classList.remove('hidden');
    loadPins();
  }
}

// Cloudinary Upload Widget
let uploadWidget;
function initUploadWidget() {
  uploadWidget = cloudinary.createUploadWidget({
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    sources: ['local', 'url', 'camera'],
    multiple: true,
    folder: 'pinterest_clone',
    resourceType: 'image',
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxFileSize: 10000000,
    styles: {
      palette: {
        window: "#FFFFFF",
        windowBorder: "#E60023",
        tabIcon: "#E60023",
        menuIcons: "#E60023",
        textDark: "#211922",
        textLight: "#767676",
        link: "#E60023",
        action: "#E60023",
        inProgress: "#E60023",
        complete: "#00C853",
        error: "#FF1744"
      }
    }
  }, (error, result) => {
    if (!error && result && result.event === "success") {
      const pinData = {
        title: result.info.original_filename || 'صورة جديدة',
        image: result.info.secure_url,
        creator: currentUser?.email?.split('@')[0] || 'Zeina_Sowary',
        board: 'صور سوشيال ميديا',
        timestamp: Date.now()
      };
      
      database.ref('pins').push(pinData).then(() => {
        loadPins();
      });
    }
    
    if (error) {
      console.error('Upload error:', error);
    }
  });
}

function openUploadWidget() {
  if (!currentUser) {
    showAuthModal();
    return;
  }
  
  if (!uploadWidget) {
    initUploadWidget();
  }
  
  uploadWidget.open();
}

// Auth functions
function showAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function login() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  
  if (!email || !password) {
    alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      closeAuthModal();
      document.getElementById('authEmail').value = '';
      document.getElementById('authPassword').value = '';
      
      if (email === ADMIN_EMAIL) {
        alert('✅ مرحباً بك يا أدمن! يمكنك الآن حذف الصور واللوحات.');
      }
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            closeAuthModal();
            document.getElementById('authEmail').value = '';
            document.getElementById('authPassword').value = '';
            
            if (email === ADMIN_EMAIL) {
              alert('✅ تم إنشاء حساب الأدمن بنجاح!');
            }
          })
          .catch(err => alert('خطأ: ' + err.message));
      } else {
        alert('خطأ: ' + error.message);
      }
    });
}

function switchToSignup() {
  alert('سيتم إنشاء حساب جديد تلقائياً');
}

function handleFollow() {
  if (!currentUser) {
    showAuthModal();
    return;
  }
  
  const btn = document.getElementById('followBtn');
  if (btn.textContent === 'متابعة') {
    btn.textContent = 'متابَع';
    const countSpan = document.getElementById('followerCount');
    const currentCount = parseFloat(countSpan.textContent);
    countSpan.textContent = (currentCount + 0.1).toFixed(1);
  } else {
    btn.textContent = 'متابعة';
    const countSpan = document.getElementById('followerCount');
    const currentCount = parseFloat(countSpan.textContent);
    countSpan.textContent = (currentCount - 0.1).toFixed(1);
  }
}

function toggleAdminPanel() {
  if (adminPanel.style.display === 'block') {
    adminPanel.style.display = 'none';
  } else {
    adminPanel.style.display = 'block';
  }
}

// Initialize
loadBoards();
console.log('🎨 Pinterest Clone Ready - Admin:', ADMIN_EMAIL);
