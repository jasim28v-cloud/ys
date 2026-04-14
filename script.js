// script.js - Complete system with auth, subscriptions, and Cloudinary upload

// Global state
let currentUser = null;
let userSubscription = 'free';
const ADMIN_EMAIL = 'jasim28v@gmail.com';

// Cloudinary configuration - Using from firebase-config.js
const CLOUDINARY_UPLOAD_PRESET = 'playboytv_upload'; // أنشئيه في لوحة تحكم Cloudinary

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

// Age verification
ageCheck.addEventListener('change', () => {
    enterBtn.disabled = !ageCheck.checked;
});

enterBtn.addEventListener('click', () => {
    if (ageCheck.checked) {
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
}

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        authContainer.style.display = 'none';
        userDisplay.style.display = 'flex';
        userEmailDisplay.textContent = user.email;
        userInitial.textContent = user.email.charAt(0).toUpperCase();
        
        // Check subscription
        database.ref('subscriptions/' + user.uid).once('value').then(snapshot => {
            userSubscription = snapshot.val()?.plan || 'free';
            subBadge.textContent = userSubscription === 'premium' ? 'Premium' : 
                                  userSubscription === 'yearly' ? 'Yearly VIP' : 'Free';
            subBadge.style.background = userSubscription !== 'free' ? '#d4af37' : '#666';
            
            // Show upload section for admin
            if (user.email === ADMIN_EMAIL) {
                uploadSection.classList.remove('hidden');
            }
        });
        
        loadVideos();
    } else {
        currentUser = null;
        authContainer.style.display = 'flex';
        userDisplay.style.display = 'none';
        uploadSection.classList.add('hidden');
    }
});

// Load videos from Firebase
function loadVideos() {
    database.ref('videos').once('value').then(snapshot => {
        const videos = snapshot.val();
        renderVideos(videos);
    });
}

function renderVideos(videos) {
    if (!videos) {
        videoGrid.innerHTML = '<p style="color:#aaa; grid-column: 1/-1; text-align: center; padding: 50px;">📹 No videos yet. Admin can upload content.</p>';
        return;
    }
    
    let html = '';
    Object.entries(videos).forEach(([id, video]) => {
        const canWatch = video.premiumOnly ? (userSubscription !== 'free' || currentUser?.email === ADMIN_EMAIL) : true;
        
        html += `
            <div class="video-card" onclick="${canWatch ? `playVideo('${video.url}', '${video.title}')` : 'showUpgradePrompt()'}">
                <div class="thumbnail" style="background-image: url('${video.thumbnail || 'https://via.placeholder.com/400x300/1a1a2e/d4af37?text=PlayboyTV'}')">
                    <i class="fas fa-play-circle play-icon"></i>
                    ${video.premiumOnly ? '<span style="position:absolute; top:10px; right:10px;" class="premium-badge">⭐ PREMIUM</span>' : ''}
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-meta">
                        <span><i class="far fa-eye"></i> ${video.views || 0}</span>
                        <span><i class="far fa-clock"></i> ${video.timestamp ? new Date(video.timestamp).toLocaleDateString() : 'New'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    videoGrid.innerHTML = html;
}

// Video player
function playVideo(url, title) {
    document.getElementById('videoPlayer').src = url;
    document.getElementById('videoModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('videoPlayer').src = '';
}

function showUpgradePrompt() {
    if (confirm('🔒 This is premium content. Would you like to upgrade your subscription?')) {
        showSignupModal();
    }
}

// Cloudinary Upload Widget
let uploadWidget;

function initCloudinaryWidget() {
    uploadWidget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME, // من firebase-config.js
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        folder: 'playboytv_content',
        resourceType: 'auto',
        clientAllowedFormats: ['mp4', 'mov', 'avi', 'webm', 'jpg', 'png'],
        maxFileSize: 500000000, // 500MB
        styles: {
            palette: {
                window: "#0A0A0E",
                windowBorder: "#D4AF37",
                tabIcon: "#D4AF37",
                menuIcons: "#D4AF37",
                textDark: "#FFFFFF",
                textLight: "#CCCCCC",
                link: "#D4AF37",
                action: "#D4AF37",
                inProgress: "#D4AF37",
                complete: "#33CC33",
                error: "#FF4444"
            }
        }
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('✅ Upload success:', result.info);
            
            // Save to Firebase
            const videoData = {
                title: result.info.original_filename || 'Untitled',
                url: result.info.secure_url,
                thumbnail: result.info.thumbnail_url || result.info.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
                premiumOnly: true,
                timestamp: Date.now(),
                views: 0,
                uploadedBy: currentUser?.email || 'unknown',
                cloudinaryId: result.info.public_id
            };
            
            // Ask for title
            const customTitle = prompt('📝 Enter video title:', videoData.title);
            if (customTitle) videoData.title = customTitle;
            
            // Ask if premium
            videoData.premiumOnly = confirm('🔒 Make this premium content? (Only subscribers can watch)');
            
            // Save to Firebase
            database.ref('videos').push(videoData).then(() => {
                document.getElementById('uploadStatus').innerHTML = '✅ Uploaded successfully!';
                document.getElementById('uploadStatus').style.color = '#33CC33';
                loadVideos();
                
                // Clear file input
                document.getElementById('videoFile').value = '';
            });
        }
        
        if (error) {
            console.error('❌ Upload error:', error);
            document.getElementById('uploadStatus').innerHTML = '❌ Upload failed: ' + error.message;
            document.getElementById('uploadStatus').style.color = '#FF4444';
        }
    });
}

function uploadToCloudinary() {
    if (!currentUser) {
        alert('⚠️ Please login to upload content');
        showLoginModal();
        return;
    }
    
    if (!uploadWidget) {
        initCloudinaryWidget();
    }
    
    uploadWidget.open();
}

// File input handler
document.getElementById('videoFile').addEventListener('change', function(e) {
    if (this.files[0]) {
        const file = this.files[0];
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('uploadStatus').innerHTML = `📁 Selected: ${file.name} (${sizeInMB} MB)`;
        document.getElementById('uploadStatus').style.color = '#D4AF37';
    }
});

// Auth functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showSignupModal() {
    document.getElementById('signupModal').style.display = 'flex';
}

function closeSignupModal() {
    document.getElementById('signupModal').style.display = 'none';
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            closeLoginModal();
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        })
        .catch(error => {
            alert('❌ Login failed: ' + error.message);
        });
}

function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const plan = document.getElementById('planSelect').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Save subscription
            return database.ref('subscriptions/' + userCredential.user.uid).set({
                plan: plan,
                email: email,
                createdAt: Date.now(),
                status: 'active'
            });
        })
        .then(() => {
            closeSignupModal();
            alert('✅ Account created successfully! Welcome to PlayboyTV');
            
            // Clear form
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            
            // Make first user admin if it's jasim28v@gmail.com
            if (email === ADMIN_EMAIL) {
                database.ref('admins/' + auth.currentUser.uid).set({
                    email: email,
                    role: 'super_admin',
                    createdAt: Date.now()
                });
            }
        })
        .catch(error => {
            alert('❌ Signup failed: ' + error.message);
        });
}

function logout() {
    auth.signOut().then(() => {
        ageGate.style.display = 'flex';
        mainContent.style.display = 'none';
        localStorage.removeItem('age_verified');
    });
}

// Initialize sample videos for testing (only if database is empty)
function initializeSampleContent() {
    database.ref('videos').once('value').then(snapshot => {
        if (!snapshot.exists()) {
            const sampleVideos = {
                sample1: {
                    title: "🎬 Welcome to PlayboyTV",
                    url: "https://res.cloudinary.com/do33_x/video/upload/v1/playboytv_content/welcome",
                    thumbnail: "https://res.cloudinary.com/do33_x/image/upload/w_400,h_300,c_fill/v1/playboytv_content/welcome",
                    premiumOnly: false,
                    timestamp: Date.now(),
                    views: 0,
                    uploadedBy: ADMIN_EMAIL
                }
            };
            
            database.ref('videos').set(sampleVideos).then(() => {
                console.log('📹 Sample content added');
                loadVideos();
            });
        }
    });
}

// Run initialization
setTimeout(initializeSampleContent, 2000);

console.log('🎬 PlayboyTV System Ready');
console.log('☁️ Cloudinary Cloud:', CLOUDINARY_CLOUD_NAME);
console.log('📁 Collection:', CLOUDINARY_COLLECTION);
