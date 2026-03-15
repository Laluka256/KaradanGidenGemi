class InputHandler {
    constructor() {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            k: false, // Vurma (Attack)
            l: false  // Ok Atma (Shoot)
        };
        
        // Bir tuşa sadece ilk basıldığında true olacak (basılı tutulduğunda değil)
        this.justPressed = {
             l: false,
             w: false
        };

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                // Eğer tuş zaten basılı değilse (ilk basış anıysa)
                if (!this.keys[key] && this.justPressed.hasOwnProperty(key)) {
                    this.justPressed[key] = true;
                }
                this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
                if (this.justPressed.hasOwnProperty(key)) {
                    this.justPressed[key] = false;
                }
            }
        });
    }

    // Belirli bir tuşun o an basılı olup olmadığını döndürür
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    // Tuşa sadece bu frame'de mi basıldı kontrol eder ve sıfırlar (tekrar tetiklenmemesi için)
    consumeJustPressed(key) {
        const k = key.toLowerCase();
        if (this.justPressed[k]) {
            this.justPressed[k] = false;
            return true;
        }
        return false;
    }
}
