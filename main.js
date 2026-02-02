import * as THREE from 'three';

// Konfigurasi Aplikasi
const CONFIG = {
    names: ["Dedi", "Dony", "Arnin", "Pak Santoso", "Bambang", "Teddy", "Made", "Rudi"],
    colors: [
        '#FF5252', '#448AFF', '#69F0AE', '#FFD740', 
        '#E040FB', '#536DFE', '#FFAB40', '#00E676'
    ],
    wheelRadius: 4,
    wheelHeight: 0.5,
    segments: 8
};

class SpinWheelGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.wheel = null;
        this.arrow = null;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.spinVelocity = 0;
        this.friction = 0.985; // Faktor perlambatan
        
        // DOM Elements
        this.uiContainer = document.getElementById('ui-container');
        this.winnerDisplay = document.getElementById('winner-display');
        this.winnerNameEl = document.getElementById('winner-name');
        this.spinBtn = document.getElementById('spin-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.init();
        this.setupEvents();
        this.animate();
    }

    init() {
        // 1. Setup Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#333');

        // 2. Setup Camera
        const aspect = window.innerWidth / window.innerHeight;
        // Gunakan PerspectiveCamera untuk efek 3D yang lebih baik
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 12, 8); // Posisi agak ke atas dan mundur
        this.camera.lookAt(0, 0, 0);

        // 3. Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 5. Create Objects
        this.createWheel();
        this.createIndicator();
        this.createStand();
    }

    createWheel() {
        // Kita buat Group untuk menampung roda
        this.wheel = new THREE.Group();

        // Buat Tekstur Roda menggunakan Canvas
        const texture = this.createWheelTexture();
        
        // Geometri Roda (Silinder)
        const geometry = new THREE.CylinderGeometry(
            CONFIG.wheelRadius, 
            CONFIG.wheelRadius, 
            CONFIG.wheelHeight, 
            32 // Segmen radial (lebih halus)
        );
        
        // Material
        // Kita mapping tekstur ke permukaan atas (index 0) dan bawah (index 1), sisi samping (index 2) warna solid
        const materials = [
            new THREE.MeshStandardMaterial({ color: '#444' }), // Samping
            new THREE.MeshStandardMaterial({ map: texture }),  // Atas
            new THREE.MeshStandardMaterial({ color: '#444' })  // Bawah
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Rotasi silinder agar permukaan datar menghadap kamera (awalnya berdiri tegak)
        // Default cylinder berdiri di sumbu Y. Kita ingin dia seperti piringan.
        // Sebenarnya cylinder default sudah benar orientasinya untuk dilihat dari atas/miring.
        // Tapi mapping tekstur 'map' biasanya melingkar di selimut silinder, bukan di tutupnya.
        // KOREKSI: CylinderGeometry material indices: 0: side, 1: top, 2: bottom.
        
        // Mari kita perbaiki mappingnya. 
        // Cara termudah untuk roda keberuntungan adalah menggunakan silinder pipih,
        // dan tekstur kita petakan ke "Top" cap.
        
        const wheelMaterials = [
            new THREE.MeshStandardMaterial({ color: '#DDDDDD', roughness: 0.5 }), // Samping (0)
            new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 }),     // Atas (1)
            new THREE.MeshStandardMaterial({ color: '#555555' })                  // Bawah (2)
        ];
        
        this.wheelMesh = new THREE.Mesh(geometry, wheelMaterials);
        this.wheel.add(this.wheelMesh);
        
        // Tambahkan baut tengah
        const centerKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16),
            new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.8, roughness: 0.2 })
        );
        this.wheel.add(centerKnob);

        // Tambahkan paku-paku di pinggir (hiasan)
        const pegGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const pegMat = new THREE.MeshStandardMaterial({ color: '#CCCCCC', metalness: 0.5 });
        
        for (let i = 0; i < CONFIG.segments; i++) {
            const angle = (i / CONFIG.segments) * Math.PI * 2;
            const peg = new THREE.Mesh(pegGeo, pegMat);
            // Posisi di pinggir roda permukaan atas
            peg.position.set(
                Math.cos(angle) * (CONFIG.wheelRadius - 0.2), 
                CONFIG.wheelHeight / 2, 
                Math.sin(angle) * (CONFIG.wheelRadius - 0.2)
            );
            this.wheel.add(peg);
        }

        this.scene.add(this.wheel);
    }

    createWheelTexture() {
        const canvas = document.createElement('canvas');
        const size = 1024; // Resolusi tekstur
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2;

        // Clear
        ctx.clearRect(0, 0, size, size);

        const arc = (Math.PI * 2) / CONFIG.segments;

        // Gambar segmen
        for (let i = 0; i < CONFIG.segments; i++) {
            const startAngle = i * arc;
            const endAngle = startAngle + arc;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fillStyle = CONFIG.colors[i % CONFIG.colors.length];
            ctx.fill();
            ctx.stroke();

            // Gambar Teks
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + arc / 2); // Rotasi ke tengah segmen
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 60px Arial";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            // Tulis nama agak menjorok dari pinggir
            ctx.fillText(CONFIG.names[i], radius - 50, 20);
            ctx.restore();
        }

        const texture = new THREE.CanvasTexture(canvas);
        // Kita perlu memutar tekstur agar segmen pertama (index 0) ada di posisi yang kita harapkan (misal jam 3 atau jam 12)
        // Secara default canvas mulai dari jam 3 (0 rad).
        texture.center.set(0.5, 0.5);
        texture.rotation = -Math.PI / 2; // Putar -90 derajat agar index 0 mulai dari jam 12 (atas) jika dilihat di 2D
        // Tapi di 3D cylinder top view, sumbu Z positif itu "bawah", X positif "kanan".
        // Nanti kita sesuaikan logika penunjuknya.
        
        return texture;
    }

    createIndicator() {
        // Penunjuk arah (Segitiga/Cone) di bagian "atas" (jam 12 menurut kamera)
        // Posisi kamera kita di Z positif, melihat ke 0.
        // Jadi "atas" di layar adalah Z negatif.
        
        const geometry = new THREE.ConeGeometry(0.5, 1.5, 16);
        const material = new THREE.MeshStandardMaterial({ color: '#FF0000' });
        this.arrow = new THREE.Mesh(geometry, material);
        
        // Posisikan di pinggir roda, mengarah ke pusat
        // Di Three.js koordinat top view (Y up):
        // X kanan, Z bawah (towards viewer).
        // Kita mau panah di "atas" roda (Z negatif).
        
        this.arrow.position.set(0, 1, -CONFIG.wheelRadius - 0.5);
        // Putar agar ujungnya menunjuk ke roda (ke arah Z positif)
        this.arrow.rotation.x = Math.PI / 2; // Tidur
        this.arrow.rotation.z = Math.PI; // Putar balik jika perlu (cone tip ada di Y+, jadi kalau di rotate X 90, dia nunjuk ke Z-)
        // Wait, Cone default nunjuk ke Y+. Rotate X 90 -> nunjuk ke Z+.
        // Kita taruh di Z negatif (-4), nunjuk ke Z+ (0), berarti sudah benar.
        
        this.scene.add(this.arrow);
    }

    createStand() {
        // Tiang penyangga sederhana di bawah roda
        const geometry = new THREE.BoxGeometry(2, 5, 2);
        const material = new THREE.MeshStandardMaterial({ color: '#333' });
        const stand = new THREE.Mesh(geometry, material);
        stand.position.y = -3;
        stand.receiveShadow = true;
        this.scene.add(stand);
        
        // Lantai bayangan
        const planeGeo = new THREE.PlaneGeometry(20, 20);
        const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -5;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    setupEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // UI Events
        this.spinBtn.addEventListener('click', () => {
            this.startSpin();
        });

        this.resetBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }

    startSpin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.winnerDisplay.classList.add('hidden');
        
        // --- LOGIKA RIGGED "BAMBANG" ---
        // Cari index Bambang
        const targetName = "Bambang";
        const targetIndex = CONFIG.names.indexOf(targetName);
        
        if (targetIndex === -1) {
            console.error("Target name not found!");
            // Fallback ke random jika nama tidak ada
            this.spinVelocity = Math.random() * 0.3 + 0.4;
            return;
        }

        // Hitung sudut target agar index Bambang ada di jam 12
        // Rumus pemenang: winningIndex = (8 - floor(deg/45)) % 8
        // Kita ingin hasil 4 (Bambang)
        // (8 - X) % 8 = 4  => X = 4
        // floor(deg/45) = 4
        // deg harus sekitar 4 * 45 = 180 derajat (PI radian)
        
        // Target sudut absolut (dalam radian 0 - 2PI)
        // Kita tambahkan sedikit variasi acak dalam segmen agar tidak terlihat robotik
        // Range segmen: 180 s/d 225 derajat. Tengahnya 202.5.
        // Variasi +/- 15 derajat (0.26 rad)
        const segmentCenterRad = (targetIndex * (Math.PI * 2) / CONFIG.segments) + Math.PI; // Offset PI karena rumus (8-x)
        // Koreksi rumus:
        // Jika index 4. Kita butuh rotasi yang menghasilkan index 4.
        // Rotasi = 180 derajat = PI.
        // Index 0 (0 rad). Index 4 (PI rad).
        // Jadi target rad = Index * SegmentRad.
        // Mari kita pakai target 180 derajat + random offset.
        
        const targetBaseRad = Math.PI; // 180 derajat untuk index 4
        const randomOffset = (Math.random() - 0.5) * 0.4; // Variasi kecil
        const targetRad = targetBaseRad + randomOffset;
        
        // Hitung total rotasi yang dibutuhkan
        // Kita ingin posisi akhir (modulo 2PI) = targetRad
        // Karena rotasi berjalan negatif (CW), kita kurangkan dari posisi sekarang.
        
        const currentRot = this.wheel.rotation.y;
        
        // Normalisasi posisi sekarang ke 0..2PI (positif) untuk perhitungan
        // Tapi karena rotation.y negatif terus, kita pakai abs
        const currentAbs = Math.abs(currentRot);
        
        // Berapa putaran penuh yang sudah terjadi
        const rounds = Math.floor(currentAbs / (Math.PI * 2));
        
        // Kita ingin menambah minimal 5 putaran penuh lagi
        const minSpins = 5;
        const extraSpins = Math.floor(Math.random() * 3); // 0-2 putaran tambahan acak
        const totalSpins = minSpins + extraSpins;
        
        // Posisi target absolut (negatif)
        // targetRot = - ( (rounds + totalSpins) * 2PI + targetRad )
        // Pastikan target lebih kecil (lebih negatif) dari current
        let targetRotationY = -((rounds + 1 + totalSpins) * (Math.PI * 2) + targetRad);
        
        // Setup animasi Tween
        this.tweenStartTime = performance.now();
        this.tweenDuration = 5000 + Math.random() * 1000; // 5-6 detik
        this.tweenStartRot = currentRot;
        this.tweenTargetRot = targetRotationY;
        this.isTweening = true;
    }

    // Fungsi Easing: Ease Out Quart
    easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isSpinning) {
            if (this.isTweening) {
                // Mode Rigged / Tweening
                const now = performance.now();
                const elapsed = now - this.tweenStartTime;
                const progress = Math.min(elapsed / this.tweenDuration, 1);
                const ease = this.easeOutQuart(progress);
                
                this.wheel.rotation.y = this.tweenStartRot + (this.tweenTargetRot - this.tweenStartRot) * ease;
                
                if (progress >= 1) {
                    this.isSpinning = false;
                    this.isTweening = false;
                    this.determineWinner();
                }
            } else {
                // Mode Fisika Lama (Fallback jika diperlukan)
                this.wheel.rotation.y -= this.spinVelocity;
                this.spinVelocity *= this.friction;

                if (this.spinVelocity < 0.002) {
                    this.isSpinning = false;
                    this.spinVelocity = 0;
                    this.determineWinner();
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    determineWinner() {
        // Hitung sudut saat ini dalam derajat
        // rotation.y ada dalam radian. Kita ambil modulus 2PI agar tetap dalam 0-360 (atau 0-2PI)
        let currentRotation = Math.abs(this.wheel.rotation.y % (Math.PI * 2));
        
        // Konversi ke derajat
        let degrees = (currentRotation * 180) / Math.PI;
        
        // Karena panah ada di posisi "atas" (jam 12), dan roda berputar searah jarum jam.
        // Segmen yang bertemu panah adalah segmen yang telah melewati posisi jam 12.
        
        // Ilustrasi:
        // Awal (0 derajat): Index 0 di jam 3 (default canvas) -> Tapi kita sudah putar tekstur -90 derajat.
        // Jadi Index 0 ada di jam 12.
        // Panah ada di jam 12.
        // Jika roda berputar 0 derajat -> Pemenang Index 0.
        // Jika roda berputar 45 derajat (CW) -> Index 7 (sebelumnya di jam 10.30) geser ke jam 12.
        
        // Ukuran segmen
        const segmentAngle = 360 / CONFIG.segments;
        
        // Hitung index
        // Rumus: Index = Math.floor(degrees / segmentAngle)
        // Tapi kita perlu cek urutannya.
        // Urutan di canvas: 0, 1, 2, 3 (searah jarum jam).
        // Jika roda putar CW, maka urutan yang lewat di jam 12 adalah: 0 -> 7 -> 6 -> 5 ...
        // Jadi kita perlu membalik logika indexnya atau menyesuaikan.
        
        // Mari kita coba logika ini:
        // Index = (TotalSegmen - Math.floor(degrees / segmentAngle)) % TotalSegmen
        // Contoh: degrees = 10 (sedikit putar). Index = (8 - 0) % 8 = 0. Masih di 0.
        // Contoh: degrees = 50 (lewat 1 segmen). Index = (8 - 1) % 8 = 7. Benar (sebelum 0 adalah 7).
        
        let winningIndex = (Math.round(degrees / segmentAngle)) % CONFIG.segments;
        // Karena putar CW, index mundur.
        // Koreksi offset jika perlu. Karena tekstur kita rotate -90deg di awal, Index 0 ada di jam 12.
        // Jadi logika "Index mundur" sudah benar karena Index 1 ada di jam 3 (90 derajat kanan), 
        // dia akan butuh putaran 270 derajat untuk sampai ke jam 12.
        
        // Tunggu, mari kita simulasi:
        // Awal: 0 di jam 12.
        // Putar 90 derajat CW.
        // Posisi jam 12 sekarang ditempati oleh yang tadinya di jam 9.
        // Di canvas (sebelum rotate texture): 0 di jam 3, 1 di jam 4.5, ..., 6 di jam 9 (270 deg).
        // Setelah rotate texture -90 deg: 0 di jam 12, 6 di jam 6 ?? Salah.
        // Rotate -90 (CCW): 0 pindah dari jam 3 ke jam 12. 6 pindah dari jam 9 ke jam 6.
        // Jadi urutan searah jarum jam di roda: 0 (jam 12), 1 (jam 1.5), 2 (jam 3)...
        
        // Jika Roda putar 90 derajat CW.
        // Maka yang di jam 9 (Index 6) akan naik ke jam 12.
        // Jadi pemenang adalah Index 6.
        
        // Mari hitung pakai rumus:
        // degrees = 90. segmentAngle = 45.
        // Math.round(90/45) = 2.
        // (8 - 2) % 8 = 6.
        // COCOK! Rumusnya benar.
        
        winningIndex = (CONFIG.segments - Math.floor(degrees / segmentAngle)) % CONFIG.segments;
        // Perlu floor atau round?
        // Misal 2 derajat (masih di index 0). floor(2/45) = 0. (8-0)%8 = 0. Benar.
        // Misal 44 derajat (masih di index 0 batas akhir). floor(44/45) = 0. Benar.
        // Misal 46 derajat (masuk index 7). floor(46/45) = 1. (8-1) = 7. Benar.
        
        const winnerName = CONFIG.names[winningIndex];
        
        // Tampilkan hasil
        this.winnerNameEl.textContent = winnerName;
        this.winnerDisplay.classList.remove('hidden');
        this.spinBtn.disabled = false;
        
        // Efek tambahan (opsional): Confetti atau suara
    }
}

// Start Game
window.onload = () => {
    new SpinWheelGame();
};
