class Player {
    constructor(game) {
        this.game = game;

        // Görseli Yükle
        this.image = new Image();
        this.image.src = 'assets/sprites/player.png';

        // Boyutlar (Resme Göre Ölçeklenebilir, şimdilik sabit)
        this.width = 96;
        this.height = 96;

        this.x = 100; // Başlangıç X
        // Yere yakın bir yer (Görselin altındaki şeffaf boşluk için -30 kullanıyoruz, Zemin kalınlığı 50 - Boşluk 20)
        this.y = this.game.height - this.height - 30;

        // Can (Health) Sistemi (6 Kalp)
        this.health = 6;
        this.maxHealth = 6;

        // Cephane (Ammo) Sistemi
        this.ammo = 10;
        this.maxAmmo = 10;

        // Hareket değişkenleri
        this.speedX = 0;
        this.maxSpeed = 5;

        // Zıplama ve Yerçekimi
        this.speedY = 0;
        this.weight = 0.5;
        this.jumpForce = -5.5;     // İlk zıplama kuvveti biraz artırıldı
        this.holdJumpForce = -0.85; // Basılı tuttukça eklenecek kuvvet biraz artırıldı
        this.isGrounded = false;

        // Değişken Zıplama Değişkenleri
        this.isJumping = false;
        this.jumpTimer = 0;
        this.maxJumpTime = 15;   // Tuşa ne kadar uzun süre (frame cinsinden) basılabileceğini belirler

        this.isAttacking = false;
        this.isShooting = false;

        // Yön durumu
        this.facingRight = true; // Başlangıçta sağa bakıyor

        // Mermiler ve Atış Süresi
        this.projectiles = [];
        this.shootTimer = 0;
        this.shootInterval = 300; // Milisaniye cinsinden atış gecikmesi

        // Hasar alma (Invincibility Frames)
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 1000; // 1 saniye dokunulmazlık
    }

    update(input, deltaTime) {
        // ... [önceki kodlar]

        // Dokunulmazlık süresini güncelle
        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
        // --- Yatay Hareket ---
        this.speedX = 0;
        if (input.isKeyDown('d')) {
            this.speedX = this.maxSpeed;
            this.facingRight = true;
        } else if (input.isKeyDown('a')) {
            this.speedX = -this.maxSpeed;
            this.facingRight = false;
        }

        this.x += this.speedX;

        // X ekseni sınırları (Kameranın sol ucu duvar işlevi görür)
        if (this.x < this.game.cameraX) {
            this.x = this.game.cameraX;
        }

        // --- Değişken Zıplama (Variable Jump Height) ---
        // 1. Zıplamanın başlaması
        if (input.consumeJustPressed('w') && this.isGrounded) {
            this.speedY = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
            this.jumpTimer = 0;
        }

        // 2. Tuşa basılı tutuluyorsa ve havadayken zıplama sınırına ulaşılmadıysa ek ivme uygula
        if (input.isKeyDown('w') && this.isJumping) {
            this.jumpTimer++;
            if (this.jumpTimer < this.maxJumpTime) {
                // Basılı tuttukça yukarı doğru yumuşak bir ivme ekle (yer çekimi ivmesini biraz bastırmak için)
                this.speedY += this.holdJumpForce;
            } else {
                // Süre doldu, zıplama gücü sona erdi
                this.isJumping = false;
            }
        }

        // 3. Tuş bırakıldıysa anında zıplama ivmesi sağlayan motoru kapat
        if (!input.isKeyDown('w') && this.isJumping) {
            this.isJumping = false;
            // Zıplama aniden bitince hemen yavaşça düşmeye başlaması için speedY hızını kısıtlayabiliriz (isteğe bağlı)
            if (this.speedY < -6) {
                this.speedY = -6; // Çok yüksek zıplarken kesilirse ivmeyi düşür
            }
        }

        // --- Yerçekimi ---
        this.y += this.speedY;

        let onPlatform = false;

        // Platform Çarpışma Kontrolü (Sadece yukarıdan aşağı düşerken)
        this.game.platforms.forEach(platform => {
            // Görselin altındaki şeffaf boşluk (20px) göz önünde bulundurularak karakterin "gerçek ayak" hizası
            const feetY = this.y + this.height - 20;
            const previousFeetY = feetY - this.speedY; // Bir önceki karedeki Y pozisyonu

            if (
                this.speedY >= 0 && // Sadece düşerken
                this.x + this.width > platform.x && // Karakter platformun sağında değil
                this.x < platform.x + platform.width && // Karakter platformun solunda değil
                previousFeetY <= platform.y && // Bir önceki karede platformun üzerindeyse
                feetY >= platform.y // Şimdi platformun altına inmişse (kestiyse)
            ) {
                this.y = platform.y - this.height + 20; // Ayaklarını tam platformun üstüne yerleştir
                this.speedY = 0;
                this.isGrounded = true;
                this.isJumping = false;
                onPlatform = true;
            }
        });

        // Yere çarpma kontrolü (Oyun dünyasının en alt sınırı / Toprak Zemin)
        // Karakterin alt sınırının (y + height), zeminin başlangıcına (game.height - 50) eşit olması gerekir
        // Ancak görselin alt kısmında şeffaf bir boşluk olduğu için +20 kadar bir ofset ekledik (-50 + 20 = -30)
        const groundLevel = this.game.height - this.height - 30;

        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.speedY = 0;
            this.isGrounded = true;
            this.isJumping = false; // Yere inince zıplama durumunu sıfırla
        } else if (!onPlatform) {
            // Yerde veya platformda değilse yer çekimi etki etmeye devam etsin
            this.speedY += this.weight;

            // Eğer karakter aşağı düşüyorsa ground state'i kapat
            if (this.speedY > 0) {
                this.isGrounded = false;
            }
        }

        // --- Aksiyonlar (K: Vurma, L: Ok Atma) ---
        this.isAttacking = input.isKeyDown('k');

        // Kılıç Çarpışma Kontrolü (Sadece K'ye basılıyken)
        if (this.isAttacking) {
            // Kılıcın yaklaşık vurma alanı (Hitbox)
            const hitBoxX = this.facingRight ? this.x + this.width : this.x - 30;
            const hitBoxY = this.y + this.height / 2;
            const hitBoxWidth = 30;
            const hitBoxHeight = 10;

            this.game.enemies.forEach(enemy => {
                // AABB algoritması
                if (
                    hitBoxX < enemy.x + enemy.width &&
                    hitBoxX + hitBoxWidth > enemy.x &&
                    hitBoxY < enemy.y + enemy.height &&
                    hitBoxY + hitBoxHeight > enemy.y
                ) {
                    // Çarpışma var, düşmana 1 hasar ver (Düşmanın canı zaten 1)
                    enemy.health -= 1;
                }
            });
        }

        // Ok atma mantığı (Tek Tıklama Başına & Cooldown)
        if (this.shootTimer > 0) {
            this.shootTimer -= 16;
        }

        // isKeyDown yerine consumeJustPressed kullanıyoruz ki basılı tutulduğunda sürekli atmasın
        if (input.consumeJustPressed('l') && this.shootTimer <= 0 && this.ammo > 0) {
            this.shoot();
            this.shootTimer = this.shootInterval;
        }

        // Mermileri güncelle
        this.projectiles.forEach(projectile => {
            projectile.update();
        });

        // Ekrandan çıkan mermileri sil
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
    }

    shoot() {
        // Okun başlangıç konumunu oyuncunun yanına ve biraz ortasına koy
        const startX = this.facingRight ? this.x + this.width : this.x;
        const startY = this.y + this.height / 2;
        this.projectiles.push(new Projectile(this.game, startX, startY, this.facingRight));
        this.ammo--; // Ok sayısını azalt
    }

    takeDamage(amount) {
        if (!this.isInvincible) {
            this.health -= amount;
            this.isInvincible = true;
            this.invincibilityTimer = this.invincibilityDuration;

            if (this.health <= 0) {
                this.health = 0;
                this.game.gameOver = true;
            }
        }
    }

    draw(ctx) {
        // Karakter Yönüne Göre Aynalama (Flipping)
        if (this.facingRight) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            // Sola bakarken resmi ters çevir
            ctx.scale(-1, 1);
            // Scale -1 X koordinatlarını tersine çevireceği için, çizim konumunu da eksi olarak hesaplamalıyız
            ctx.drawImage(this.image, -(this.x + this.width), this.y, this.width, this.height);
            ctx.restore();
        }

        // Eğer saldırıyorsa basit bir kılıç efekti göster
        if (this.isAttacking) {
            ctx.fillStyle = 'white';
            if (this.facingRight) {
                // Sağa doğru kılıç
                ctx.fillRect(this.x + this.width, this.y + this.height / 2, 30, 10);
            } else {
                // Sola doğru kılıç
                ctx.fillRect(this.x - 30, this.y + this.height / 2, 30, 10);
            }
        }

        // Mermileri çiz
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx);
        });
    }
}
