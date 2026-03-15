class Cloud {
    constructor(game) {
        this.game = game;
        
        // Görseli Yükle
        this.image = new Image();
        this.image.src = 'assets/sprites/cloud.png'; 
        
        this.x = Math.random() * this.game.width;
        // Gökyüzünün üst kısımlarında yer almasını sağla
        this.y = Math.random() * (this.game.height / 2);
        
        // Bulut boyutu (Rastgele varyasyonlar)
        this.sizeModifier = Math.random() * 0.8 + 0.4; // 0.4 ile 1.2 arası
        
        // Standart boyut
        this.width = 300 * this.sizeModifier;
        this.height = 150 * this.sizeModifier;
        
        // Kamera kaymasına (parallax) karşı ne kadar hızlı sürükleneceği
        this.parallaxFactor = this.sizeModifier * 0.3; // 0.15 ile 0.3 arası
    }

    update() {
        // Bulutlar dünyada sabit duruyor, sadece kameraya göre çizilecekler.
    }

    draw(ctx, cameraX) {
        // Parallax pozisyonu (Kamera sağa gittikçe bulut sola kayar)
        let renderX = this.x - (cameraX * this.parallaxFactor);
        
        // Sorunsuz sonsuz döngü: Bulut ekrandan çıkarsa kendi başlattığı rotasyona dönsün.
        const totalWidth = this.game.width + 200; // Ekran genişliği + biraz esneme payı
        renderX = ((renderX % totalWidth) + totalWidth) % totalWidth - 100; // -100 to start right before the screen

        // Eğer gerçek bir sprite eklendiyse (image.src doluysa ve yüklendiyse) onu çiz
        if (this.image.src && this.image.complete && this.image.naturalHeight !== 0) {
             ctx.drawImage(this.image, renderX, this.y, this.width, this.height);
        } else {
             // Placeholder (Şimdilik yer tutucu olarak yarı saydam beyaz bir dikdörtgen)
             ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
             ctx.fillRect(renderX, this.y, this.width, this.height);
             
             // İçine placeholder olduğunu belirten ufak bir çerçeve/çarpı atalım belli olması için
             ctx.strokeStyle = '#fff';
             ctx.strokeRect(renderX, this.y, this.width, this.height);
        }
    }
}
