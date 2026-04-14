// script.js - Fixed Age Gate

const ADMIN_EMAIL = 'jasim28v@gmail.com';
let currentUser = null;
let isAdmin = false;
let uploadWidget = null;

// DOM Elements
const ageGate = document.getElementById('ageGate');
const mainContent = document.getElementById('mainContent');
const enterBtn = document.getElementById('enterSiteBtn');
const ageCheck = document.getElementById('ageConfirm');
const authContainer = document.getElementById('authContainer');
const userDisplay = document.getElementById('userDisplay');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const userInitial = document.getElementById('userInitial');
const subBadge = document.getElementById('subBadge');
const videoGrid = document.getElementById('videoGrid');
const uploadSection = document.getElementById('uploadSection');

// ========== AGE VERIFICATION FIX ==========
// Enable/disable enter button based on checkbox
ageCheck.addEventListener('change', function() {
  enterBtn.disabled = !this.checked;
  console.log('Checkbox changed:', this.checked);
});

// Enter site button click
enterBtn.addEventListener('click', function() {
  if (ageCheck.checked) {
    console.log('Entering site...');
    ageGate.style.display = 'none';
    mainContent.style.display = 'block';
    localStorage.setItem('age_verified', 'true');
    loadVideos();
  }
});

// Check if already verified
if (localStorage.getItem('age_verified') === 'true') {
  ageGate.style.display = 'none';
  mainContent.style.display = 'block';
  loadVideos();
} else {
  ageGate.style.display = 'flex';
  mainContent.style.display = 'none';
  enterBtn.disabled = true;
}

// ========== AUTH ==========
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    isAdmin = user.email === ADMIN_EMAIL;
    
    authContainer.style.display = 'none';
    userDisplay.style.display = 'flex';
    userEmailDisplay.textContent = user.email;
    userInitial.textContent = user.email.charAt(0).toUpperCase();
    
    if (isAdmin) {
      document.body.classList.add('is-admin');
      uploadSection.classList.remove('hidden');
      console.log('✅ Admin logged in');
    }
    
    document.body.classList.add('logged-in');
    
    database.ref('subscriptions/' + user.uid).once('value').then(snapshot => {
      const plan = snapshot.val()?.plan || 'free';
      subBadge.textContent = plan === 'premium' ? 'Premium' : plan === 'yearly' ? 'Yearly VIP' : 'Free';
      subBadge.style.background = plan !== 'free' ? '#d4af37' : '#666';
    });
  } else {
    currentUser = null;
    isAdmin = false;
    authContainer.style.display = 'flex';
    userDisplay.style.display = 'none';
    uploadSection.classList.add('hidden');
    document.body.classList.remove('logged-in', 'is-admin');
  }
});

// ========== VIDEOS ==========
function loadVideos() {
  database.ref('videos').once('value').then(snapshot => {
    const videos = snapshot.val();
    renderVideos(videos);
  });
}

function renderVideos(videos) {
  if (!videos) {
    videoGrid.innerHTML = '<p style="color:#aaa; text-align:center; padding:40px;">لا توجد فيديوهات حالياً</p>';
    return;
  }
  
  let html = '';
  Object.entries(videos).forEach(([id, video]) => {
    html += `
      <div class="video-card" onclick="playVideo('${video.url}', '${video.title}')">
        <div class="thumbnail" style="background-image: url('${video.thumbnail || ''}')">
          <i class="fas fa-play-circle play-icon"></i>
          ${video.premiumOnly ? '<span style="position:absolute; top:8px; right:8px;" class="premium-badge">PREMIUM</span>' : ''}
          ${isAdmin ? `<button onclick="event.stopPropagation(); deleteVideo('${id}')" style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.7); color:white; border:none; width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
        </div>
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-meta">
            <span>👁 ${video.views || 0}</span>
            <span>${video.timestamp ? new Date(video.timestamp).toLocaleDateString('ar-SA') : 'جديد'}</span>
          </div>
        </div>
      </div>
    `;
  });
  videoGrid.innerHTML = html;
}

function playVideo(url, title) {
  document.getElementById('videoPlayer').src = url;
  document.getElementById('videoModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('videoModal').style.display = 'none';
  document.getElementById('videoPlayer').src = '';
}

function deleteVideo(videoId) {
  if (!isAdmin) return;
  if (confirm('حذف هذا الفيديو؟')) {
    database.ref('videos/' + videoId).remove().then(() => loadVideos());
  }
}

function deleteAllVideos() {
  if (!isAdmin) return;
  if (confirm('حذف جميع الفيديوهات؟')) {
    database.ref('videos').remove().then(() => {
      loadVideos();
      alert('تم حذف جميع الفيديوهات');
    });
  }
}

// ========== CLOUDINARY UPLOAD ==========
function initUploadWidget() {
  uploadWidget = cloudinary.createUploadWidget({
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    sources: ['local', 'url', 'camera'],
    multiple: false,
    folder: 'playboytv_content',
    resourceType: 'auto',
    clientAllowedFormats: ['mp4', 'mov', 'avi', 'webm', 'jpg', 'png'],
    maxFileSize: 500000000
  }, (error, result) => {
    if (!error && result && result.event === "success") {
      const videoData = {
        title: result.info.original_filename || 'بدون عنوان',
        url: result.info.secure_url,
        thumbnail: result.info.thumbnail_url || result.info.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
        premiumOnly: true,
        timestamp: Date.now(),
        views: 0,
        uploadedBy: currentUser?.email || 'unknown'
      };
      
      database.ref('videos').push(videoData).then(() => {
        document.getElementById('uploadStatus').textContent = '✅ تم الرفع بنجاح!';
        loadVideos();
      });
    }
    if (error) {
      document.getElementById('uploadStatus').textContent = '❌ فشل الرفع';
    }
  });
}

function uploadToCloudinary() {
  if (!currentUser) {
    alert('يجب تسجيل الدخول للرفع');
    showLoginModal();
    return;
  }
  if (!uploadWidget) initUploadWidget();
  uploadWidget.open();
}

// ========== AUTH MODALS ==========
function showLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('loginModal').style.display = 'none'; }
function showSignupModal() { document.getElementById('signupModal').style.display = 'flex'; }
function closeSignupModal() { document.getElementById('signupModal').style.display = 'none'; }

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { alert('أدخل البريد وكلمة المرور'); return; }
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      closeLoginModal();
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        if (confirm('الحساب غير موجود. إنشاء حساب جديد؟')) {
          signup();
        }
      } else {
        alert('خطأ: ' + error.message);
      }
    });
}

function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const plan = document.getElementById('planSelect').value;
  
  if (!email || !password) { alert('أدخل البريد وكلمة المرور'); return; }
  if (password.length < 6) { alert('كلمة المرور 6 أحرف على الأقل'); return; }
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      return database.ref('subscriptions/' + userCredential.user.uid).set({
        plan, email, createdAt: Date.now()
      });
    })
    .then(() => {
      closeSignupModal();
      document.getElementById('signupEmail').value = '';
      document.getElementById('signupPassword').value = '';
      alert('✅ تم إنشاء الحساب بنجاح!');
    })
    .catch(error => alert('خطأ: ' + error.message));
}

function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem('age_verified');
    location.reload();
  });
}

// Initialize sample videos
setTimeout(() => {
  database.ref('videos').once('value').then(snapshot => {
    if (!snapshot.exists()) {
      database.ref('videos').set({
        sample1: {
          title: "🎬 Night Calls Exclusive",
          url: "https://res.cloudinary.com/do33_x/video/upload/sample.mp4",
          thumbnail: "https://res.cloudinary.com/do33_x/image/upload/w_400,h_300,c_fill/sample.jpg",
          premiumOnly: true,
          timestamp: Date.now(),
          views: 1250
        }
      }).then(() => loadVideos());
    }
  });
}, 1000);

console.log('✅ PlayboyTV Ready - Age Gate Fixed!');
