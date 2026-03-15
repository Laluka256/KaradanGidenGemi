class Enemy {
    constructor(game, x, y) {
        this.game = game;
        
        // Görseli Yükle (Oyuncu resmi)
        this.image = new Image();
        this.image.src = 'assets/sprites/player.png';
        
        // Boyutlar 
        this.width = 96; 
        this.height = 96;
        
        // Konum
        this.x = x;
        this.y = y;
        
        // Özellikler
        this.health = 1;
        this.damage = 1; // Oyuncudan 1 kalp götürür
        this.speedX = 2; // Oyuncuya doğru yürüme hızı
        
        // Durumlar
        this.markedForDeletion = false;
        this.facingRight = false; // Oyuncuya bakma yönü
        // Zıplama ve Yerçekimi Özellikleri
        this.speedY = 0;
        this.weight = 0.5;
        this.jumpForce = -10; // Düşmanların zıplama gücü (daha yükseğe zıplayabilsinler)
        this.isGrounded = false;
        
        // Zıplama Gecikmesi (Sürekli zıplamamaları için)
        this.jumpTimer = 0;
        this.jumpCooldown = 1500; // 1.5 saniyede bir zıplama kararı verebilir
        
        // Hasar Verme Gecikmesi Süresi
        this.damageTimer = 0;
        this.damageInterval = 1000;
    }

    update(deltaTime) {
        // Zıplama bekleme süresini azalt
        if (this.jumpTimer > 0) {
            this.jumpTimer -= deltaTime;
        }
        // Hasar zamanlayıcısını düşür
        if (this.damageTimer > 0) {
            this.damageTimer -= deltaTime;
        }

        // Oyuncunun konumuna göre hareket et
        const playerCenter = this.game.player.x + this.game.player.width / 2;
        const enemyCenter = this.x + this.width / 2;

        if (enemyCenter < playerCenter) {
            this.x += this.speedX;
            this.facingRight = true;
        } else if (enemyCenter > playerCenter) {
            this.x -= this.speedX;
            this.facingRight = false;
        }
        
        // --- Zıplama Kararı Yapay Zekası ---
        // Oyuncu dümdüz tepemizdeyse veya önümüzde yüksek bir yer varsa zıpla
        const playerIsAbove = this.game.player.y + this.game.player.height < this.y + this.height - 20;
        const playerIsCloseX = Math.abs(playerCenter - enemyCenter) < 200; // Sadece oyuncu yakınken zıplamaya kalkışsın
        
        if (this.isGrounded && this.jumpTimer <= 0 && playerIsAbove && playerIsCloseX) {
            this.speedY = this.jumpForce;
            this.isGrounded = false;
            this.jumpTimer = this.jumpCooldown;
        }

        // --- Yerçekimi ve Fizik ---
        this.y += this.speedY;

        let onPlatform = false;

        // Platform Çarpışma Kontrolü (Sadece aşağı düşerken)
        this.game.platforms.forEach(platform => {
            const feetY = this.y + this.height - 20;
            const previousFeetY = feetY - this.speedY;

            if (
                this.speedY >= 0 && 
                this.x + this.width > platform.x && 
                this.x < platform.x + platform.width && 
                previousFeetY <= platform.y && 
                feetY >= platform.y
            ) {
                this.y = platform.y - this.height + 20;
                this.speedY = 0;
                this.isGrounded = true;
                onPlatform = true;
            }
        });

        // Ana Zemin Kontrolü
        const groundLevel = this.game.height - this.height - 30;

        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.speedY = 0;
            this.isGrounded = true;
        } else if (!onPlatform) {
            // Havadaysa yerçekimi uygula
            this.speedY += this.weight;
            if (this.speedY > 0) {
                this.isGrounded = false;
            }
        }

        // Oyuncu ile Çarpışma Kontrolü (AABB)
        const dx = this.x - this.game.player.x;
        const dy = this.y - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Yaklaşık bir çarpışma mesafesi (tam kutu hassasiyeti yerine daha yumuşak bir alan)
        if (distance < this.width * 0.8) {
             // Çarptıysa ve zamanlayıcı dolduysa oyuncuya hasar ver
             if (this.damageTimer <= 0) {
                 this.game.player.takeDamage(this.damage);
                 this.damageTimer = this.damageInterval;
                 
                 // İsteğe bağlı: Düşman vurduktan sonra oyuncu biraz geri seksin vb.
             }
        }
        
        // Canı sıfıra düştüyse yok et
        if (this.health <= 0) {
            this.markedForDeletion = true;
            
            // %100 ihtimalle bir eşya düşür
            // %50 ihtimalle Can, %50 ihtimalle Ok cephanesi düşsün
            if (Math.random() < 0.5) {
                this.game.healthDrops.push(new HealthDrop(this.game, this.x, this.y));
            } else {
                this.game.ammoDrops.push(new AmmoDrop(this.game, this.x, this.y));
            }
        }
    }

    draw(ctx) {
        // Karakter Yönüne Göre Aynalama (Flipping)
        if (this.facingRight) {
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             ctx.save();
             ctx.scale(-1, 1);
             ctx.drawImage(this.image, -(this.x + this.width), this.y, this.width, this.height);
             ctx.restore();
        }
        
        // Düşmanın üzerine ufak bir "Düşman" belirtisi çizelim (örneğin kırmızı bir hat)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
