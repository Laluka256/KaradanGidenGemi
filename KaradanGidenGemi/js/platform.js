class Platform {
    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.markedForDeletion = false;
    }

    update() {
        // Platformlar ekranın çok solunda kalırsa (kamera geçtikten çok sonra) silinsin
        if (this.x + this.width < this.game.cameraX - 500) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Platform çizimleri
        ctx.fillStyle = '#8B4513'; // Kahverengi ahşap/toprak rengi
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#228B22'; // Üzerine yeşil çim efekti
        ctx.fillRect(this.x, this.y, this.width, 10);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
