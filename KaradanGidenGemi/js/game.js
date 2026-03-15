class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Oyun bileşenleri
        this.player = new Player(this);
        this.input = new InputHandler();
        
        // Arkaplan
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push(new Cloud(this));
        }
        
        // Düşmanlar ve Droplar
        this.enemies = [];
        this.healthDrops = [];
        this.ammoDrops = [];
        this.enemyTimer = 0;
        this.enemyInterval = 3000; // 3 saniyede 1 düşman yolla
        
        // Platformlar
        this.platforms = [];
        // İlk başta yerdeki zemin zaten var, biz havaya rastgele platformlar ekleyeceğiz
        // Doğmasını planladığımız bir sonraki platform konumu
        this.lastPlatformX = this.width; // Ekranın sağıından başlasın
        
        // Kamera Sistemi
        this.cameraX = 0;
        
        // Gece/Gündüz Sistemi
        this.dayNightTimer = 0;
        this.isDay = true;
        this.nightAlpha = 0; // 0 = Gündüz, 0.6 = Gece
        
        // Oyun Durumu
        this.gameOver = false;
        
        // Skor Sistemi
        this.score = 0;
        this.maxCameraX = 0; // Geri dönülürse puan düşmemesi için kaydedilen en uzak nokta
    }

    update(deltaTime) {
        if (!this.gameOver) {
             // Gece/Gündüz Döngüsünü Güncelle (Her 5 saniyede bir geçiş)
             this.dayNightTimer += deltaTime;
             if (this.dayNightTimer >= 5000) {
                 this.dayNightTimer -= 5000;
                 this.isDay = !this.isDay;
             }
             
             // Karanlık efekti için yumuşak geçiş
             const targetAlpha = this.isDay ? 0 : 0.6; // Gece karanlık sınırı
             const transitionSpeed = 0.0005 * deltaTime;
             if (this.nightAlpha < targetAlpha) {
                 this.nightAlpha = Math.min(this.nightAlpha + transitionSpeed, targetAlpha);
             } else if (this.nightAlpha > targetAlpha) {
                 this.nightAlpha = Math.max(this.nightAlpha - transitionSpeed, targetAlpha);
             }

             this.player.update(this.input, deltaTime);
             
             // Sadece kamera ölü bölge mantığını kullanacağız.
             // (Centering mantığını sildik ki deadzone düzgün çalışsın)
             
             // Kamera Deadzone (Ölü Bölge) Mantığı
             // Ekrandaki oyuncunun kameraya göre konumu
             const playerScreenX = this.player.x - this.cameraX;

             // Ekranın %70'inden sağa giderse kamera kayar
             const rightDeadzone = this.width * 0.7;

             if (playerScreenX > rightDeadzone) {
                 // Karakter sağdaki ölü bölge sınırını geçerse, kamerayı sağa it
                 this.cameraX = this.player.x - rightDeadzone;
             }
             
             // Kamera 0'ın altına (dünyanın en solu) gitmesin ve GERİYE DÖNMESİN
             // this.cameraX değeri hiçbir zaman azalamaz (sadece Math.max ile aynı kalır veya artar)
             // (Kameranın sola kaymasını engelleyen asıl kısım if bloklarından sola kayma komutunun silinmesidir)
             // this.cameraX zaten yukarıdaki if ile sadece sağa itiliyor.
             
             // --- Skor Hesaplama ---
             // Kamera ne kadar sağa gittiyse (ilerlendiyse) skor o kadar artsın (örn: her 100 px = 1 skor)
             if (this.cameraX > this.maxCameraX) {
                 this.maxCameraX = this.cameraX;
             }
             this.score = Math.floor(this.maxCameraX / 50); // Miktarı isteğe göre ayarlayabilirsiniz
             
             // Düşman Oluşturucu
             if (this.enemyTimer > this.enemyInterval) {
                 this.addEnemy();
                 this.enemyTimer = 0;
             } else {
                 this.enemyTimer += deltaTime;
             }
             
             // Platform Oluşturucu (Kamera sağa ilerledikçe yolları oluştur)
             if (this.cameraX + this.width + 300 > this.lastPlatformX) {
                 this.addPlatform();
             }

             // Bulutları güncelle
             this.clouds.forEach(cloud => cloud.update());
             
             // Platformları güncelle
             this.platforms.forEach(platform => platform.update());
             
             // Düşmanları güncelle
             this.enemies.forEach(enemy => enemy.update(deltaTime));
             
             // Sağlık ve Cephane parçacıklarını (dropları) güncelle
             this.healthDrops.forEach(drop => drop.update());
             this.ammoDrops.forEach(drop => drop.update());
             
             // Ölen düşmanları, geçen platformları ve alınan dropları temizle
             this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
             this.platforms = this.platforms.filter(platform => !platform.markedForDeletion);
             this.healthDrops = this.healthDrops.filter(drop => !drop.markedForDeletion);
             this.ammoDrops = this.ammoDrops.filter(drop => !drop.markedForDeletion);
        }
    }

    addPlatform() {
        // Bu blokta (chunk) doğacak platform sayısı (1 ile 3 kat arası)
        const platformCount = Math.floor(Math.random() * 3) + 1;
        let maxChunkX = this.lastPlatformX;

        // Kat kat üretim mantığı
        for (let i = 0; i < platformCount; i++) {
            const minW = 80;  // Ufak: Minimum genişlik
            const maxW = 200; // Ufak: Maksimum genişlik
            const w = Math.random() * (maxW - minW) + minW;
            
            // X Ekseni: Alt platform ile üst platformların başlama noktaları bir miktar örtüşecek şekilde kaydırılır
            const xOffset = Math.random() * 150; 
            const x = this.lastPlatformX + xOffset;
            
            // Y Ekseni: Her katman ('i') için farklı bir taban yüksekliği (yukarıya doğru katlanır)
            // Seviye 0: Yere biraz daha uzak (180px), Seviye 1: Daha Yüksek (330px)
            const baseHeight = 180 + (i * 150); 
            const randomOffset = Math.random() * 40 - 20; // Yüksekliği hafif esnet (+ - 20px)
            const y = this.height - baseHeight + randomOffset;
            
            // Ekran boyutunu (tavana) aşmamasına dikkat edilebilir
            this.platforms.push(new Platform(this, x, y, w, 40)); // Kalınlık 40'a çıkarıldı
            
            if (x + w > maxChunkX) {
                maxChunkX = x + w;
            }
        }
        
        // Sonraki grupla (chunk) bu grup arasındaki yatay boşluk (Gap)
        let gap = Math.random() * 150 + 50; 
        this.lastPlatformX = maxChunkX + gap;
    }

    addEnemy() {
        // Düşmanı ekranın dışında sağdan veya soldan (kameraya göre) doğur
        const spawnRight = Math.random() < 0.5;
        const x = spawnRight ? this.cameraX + this.width + 100 : Math.max(0, this.cameraX - 100);
        const y = this.height - 96 - 30; // groundLevel mantığı: this.height - boy(96) - offset(30)
        
        // En sola (0'ın soluna) doğurmamak için
        if (x >= 0) {
             this.enemies.push(new Enemy(this, x, y));
        }
    }

    draw(ctx) {
        // Arka planı temizle
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Yıldızlı gökyüzü / arkaplan - (Sonsuz görüneceği için kameradan etkilenmiyor)
        ctx.fillStyle = '#654321'; // Toprak rengi
        ctx.fillRect(0, this.height - 50, this.width, 50); // Alt kısımdaki zemin (Kalınlaştırıldı)

        // Bulutları çiz (Parallax etkisi ile, kameradan etkileniyor ama sarmalama yapıyor)
        this.clouds.forEach(cloud => cloud.draw(ctx, this.cameraX));

        // -- Kamera Çevirisi (Translate) ile Oyun Dünyası --
        ctx.save();
        ctx.translate(-this.cameraX, 0);

        // Platformları çiz
        this.platforms.forEach(platform => platform.draw(ctx));

        // Düşmanları çiz
        this.enemies.forEach(enemy => enemy.draw(ctx));

        // Can ve Cephane parçacıklarını çiz
        this.healthDrops.forEach(drop => drop.draw(ctx));
        this.ammoDrops.forEach(drop => drop.draw(ctx));

        // Oyuncuyu ve ona bağlı mermileri çiz
        this.player.draw(ctx);
        
        ctx.restore(); // Çeviriyi sıfırla

        // GECE KARANLIĞI EFEKTİ (Tüm oyun nesnelerinin üzerinde, arayüzün altında yer alır)
        if (this.nightAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 30, ${this.nightAlpha})`;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Kamera pozisyonunu dikkate alarak platformlar arası sarkan ışık iplerini çiziyoruz
            ctx.save();
            ctx.translate(-this.cameraX, 0);
            
            // Eğer yeterli platform yoksa çizmeyelim
            if (this.platforms.length > 1) {
                // Platformları x koordinatına göre (kamera açısından) soldan sağa doğru sıralayalım
                // (Normalde eklenme sırasına göredir ama emin olmak için)
                const sortedPlatforms = [...this.platforms].sort((a, b) => a.x - b.x);

                for (let i = 0; i < sortedPlatforms.length - 1; i++) {
                    const p1 = sortedPlatforms[i];
                    const p2 = sortedPlatforms[i + 1];

                    // Bağlanacak noktaları hesapla (p1'in sağ alt köşesi ve p2'nin sol alt köşesi gibi)
                    // Veya her ikisinin de alt orta kısımları
                    const startX = p1.x + p1.width;
                    const startY = p1.y + p1.height / 2; // hafif yandan
                    
                    const endX = p2.x;
                    const endY = p2.y + p2.height / 2;

                    // Eğer iki platform çok uzaksa aralarına ip germeyelim (mantıksız görünmesin)
                    const distance = Math.hypot(endX - startX, endY - startY);
                    if (distance > 600 || distance < 50) continue; 
                    
                    // İpin ne kadar sarkacağını aralarındaki mesafeye göre belirle
                    const sagAmount = distance / 3; 

                    // İpi sarkan bir bezier eğrisi olarak çizelim
                    const controlX = (startX + endX) / 2;
                    const controlY = Math.max(startY, endY) + sagAmount; // Ortadan aşağı doğru sarkma
                    
                    // İp çizimi (Gece belli belirsiz görünsün)
                    ctx.strokeStyle = `rgba(100, 100, 100, ${this.nightAlpha * 1.5})`; // nightAlpha 0.6 iken ~0.9 görünür
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                    ctx.stroke();

                    // İpin üzerine 3-4 adet belirli noktalara lamba yerleştirelim
                    const numLights = Math.floor(distance / 80); // Her 80 pikselde 1 lamba
                    if (numLights > 0) {
                        for (let j = 1; j <= numLights; j++) {
                            const t = j / (numLights + 1); // 0 ile 1 arasında eğri üzerindeki ilerleme
                            
                            // Quadratic Bezier formülü ile lamba noktasını bul
                            const lightX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
                            const lightY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
                            
                            // Lamba fiziksel merkez noktası (Sarı)
                            ctx.fillStyle = `rgb(255, 255, 150)`;
                            ctx.beginPath();
                            ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.closePath();
                            
                            // Lambanın Etrafa yaydığı parlaklık efekti (nightAlpha'ya göre)
                            const intensity = this.nightAlpha / 0.6; 
                            if (intensity > 0) {
                                ctx.globalCompositeOperation = 'lighter';
                                const gradient = ctx.createRadialGradient(
                                    lightX, lightY, 0, 
                                    lightX, lightY, 60 // Işık yarıçapı
                                );
                                gradient.addColorStop(0, `rgba(255, 255, 150, ${0.7 * intensity})`);
                                gradient.addColorStop(0.5, `rgba(255, 255, 150, ${0.2 * intensity})`);
                                gradient.addColorStop(1, `rgba(255, 255, 150, 0)`);
                                
                                ctx.fillStyle = gradient;
                                ctx.beginPath();
                                ctx.arc(lightX, lightY, 60, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.closePath();
                                ctx.globalCompositeOperation = 'source-over'; // Eski haline döndür
                            }
                        }
                    }
                }
            }
            
            ctx.restore();
        }

        // --- Arayüz (UI) (Kameradan etkilenmeyen sabit alan) ---
        // Can Barı (Kalpler)
        // ctx.fillText ile kalp emojileri veya basit şekiller çizebiliriz.
        // Daha güzel durması için kırmızı ve gri/siyah kalpler kullanalım
        const heartSize = 24;
        const startX = 20;
        const startY = 40;
        
        ctx.font = `${heartSize}px Arial`;
        for (let i = 0; i < this.player.maxHealth; i++) {
            if (i < this.player.health) {
                // Dolu Kalp
                ctx.fillStyle = 'red';
                ctx.fillText('❤', startX + (i * 30), startY);
            } else {
                // Boş (Kalan) Kalp (Siyah veya gri)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillText('❤', startX + (i * 30), startY);
            }
        }

        // Cephane (Ok) Göstergesi
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Ok (Cephane): ' + this.player.ammo + ' / ' + this.player.maxAmmo, 20, 60);
    }

    reset() {
        this.player = new Player(this);
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push(new Cloud(this));
        }
        this.enemies = [];
        this.healthDrops = [];
        this.ammoDrops = [];
        this.enemyTimer = 0;
        this.platforms = [];
        this.lastPlatformX = this.width;
        this.cameraX = 0;
        this.score = 0;
        this.maxCameraX = 0;
        
        // Gece/Gündüz Değişkenlerini Sıfırla
        this.dayNightTimer = 0;
        this.isDay = true;
        this.nightAlpha = 0;

        this.gameOver = false;
        // input handler referansına dokunmuyoruz ki duplicate addeventlistener olmasın
    }
}
