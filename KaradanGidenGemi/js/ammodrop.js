class AmmoDrop {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        
        // Zıplama/düşme efekti için fizik değişkenleri (HealthDrop ile aynı)
        this.speedY = -5; // İlk fırlama hızı
        this.speedX = (Math.random() - 0.5) * 4; // Rastgele sağa/sola saçılma
        this.weight = 0.5;
        this.markedForDeletion = false;
        
        // Zemin hizası (Karakterle aşağı yukarı aynı hizada durması için)
        this.groundLevel = this.game.height - 50 - this.height;
        
        // Animasyon için salınım değişkenleri
        this.angle = 0;
        this.angleSpeed = 0.1;
    }

    update() {
        // Fizik (Saçılma ve yere düşme)
        if (this.y < this.groundLevel) {
            this.speedY += this.weight;
            this.y += this.speedY;
            this.x += this.speedX;
        } else {
            // Yere çarptığında dur
            this.y = this.groundLevel;
            this.speedX = 0;
            this.speedY = 0;
        }
        
        // Sürekli yukarı aşağı hafif salınım
        this.angle += this.angleSpeed;
        
        // Eğer kameranın çok solunda kalırsa sil
        if (this.x + this.width < this.game.cameraX - 50) {
            this.markedForDeletion = true;
        }
        
        // Oyuncu ile çarpışma (Cephane alma)
        this.checkCollision();
    }
    
    checkCollision() {
        const player = this.game.player;
        if (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        ) {
            // Oyuncuya 5 ok ver (Maksimum sınırını aşmasını engellemek size kalmış, şimdilik maxAmmo ile sınırlandırdık)
            player.ammo = Math.min(player.ammo + 5, player.maxAmmo);
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Zıplaması bittiyse (yerdeyse) ufak bir havada yüzme efekti
        let drawY = this.y;
        if (this.y >= this.groundLevel) {
            drawY += Math.sin(this.angle) * 5; 
        }
        
        ctx.save();
        
        // Mavi/Turkuaz parlama efekti (Okları temsil etsin diye)
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(50, 200, 255, 0.8)";
        
        ctx.fillStyle = '#32c8ff'; // Açık Mavi
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, drawY + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        // İçine küçük beyaz/sarı çekirdek
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, drawY + this.height/2, this.width/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    }
}
