class Projectile {
    constructor(game, x, y, facingRight) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 5;
        this.speed = 9; // Okun hızı yarı yarıya düşürüldü
        this.facingRight = facingRight;
        this.markedForDeletion = false;
    }

    update() {
        if (this.facingRight) {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }

        // Düşmanlarla çarpışma kontrolü
        this.game.enemies.forEach(enemy => {
             if (
                 this.x < enemy.x + enemy.width &&
                 this.x + this.width > enemy.x &&
                 this.y < enemy.y + enemy.height &&
                 this.y + this.height > enemy.y
             ) {
                 // Düşmana 1 hasar ver ve oku yok et
                 enemy.health -= 1;
                 this.markedForDeletion = true;
             }
        });

        // Ekranın dışına çıkarsa silinmesi için işaretle (Kameraya göre)
        if (this.x > this.game.cameraX + this.game.width || this.x < this.game.cameraX) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
