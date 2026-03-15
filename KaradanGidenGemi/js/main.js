window.addEventListener('load', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Canvas boyutları
    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;

    const game = new Game(GAME_WIDTH, GAME_HEIGHT);

    let lastTime = 0;
    let gameStarted = false;

    // UI Elemanları
    const startMenu = document.getElementById('start-menu');
    const startButton = document.getElementById('start-button');
    const currentScoreDisplay = document.getElementById('current-score');
    
    // Game Over Panel Elemanları
    const gameOverPanel = document.getElementById('game-over-panel');
    const finalScoreDisplay = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name-input');
    const saveScoreButton = document.getElementById('save-score-button');
    
    // Leaderboard Elemanı
    const leaderboardList = document.getElementById('leaderboard-list');

    // Başlangıçta liderlik tablosunu çek
    updateLeaderboardUI();

    // Ana oyun döngüsü (Game Loop)
    function animate(timeStamp) {
        if (!gameStarted) return;
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        game.update(deltaTime);
        game.draw(ctx);
        
        // Canlı skor güncellenmesi
        currentScoreDisplay.innerText = game.score;

        if (!game.gameOver) {
             requestAnimationFrame(animate);
        } else {
             // Oyun Bitti - Menüye Dön
             startMenu.style.display = 'flex';
             startButton.innerText = 'Tekrar Oyna';
             
             // Game Over Kayıt Panelini Göster
             gameOverPanel.style.display = 'block';
             finalScoreDisplay.innerText = game.score;
             
             gameStarted = false;
        }
    }

    // Oyunu Başlatma
    startButton.addEventListener('click', function() {
        startMenu.style.display = 'none';
        gameOverPanel.style.display = 'none'; // Restart atınca paneli gizle
        
        // Eğer daha önce oyun oynandıysa ve tekrar başlatılıyorsa nesneleri sıfırla
        if (game.gameOver) {
            game.reset();
            currentScoreDisplay.innerText = "0";
        }
        
        gameStarted = true;
        
        requestAnimationFrame(function(timeStamp) {
            lastTime = timeStamp;
            animate(timeStamp);
        });
    });
    
    // Skor Kaydetme Butonu İşlemi
    saveScoreButton.addEventListener('click', function() {
        let name = playerNameInput.value.trim();
        if (name === "") name = "İsimsiz Kaptan";
        
        const currentScore = game.score;
        saveScoreToLeaderboard(name, currentScore);
        
        // Kaydettikten sonra inputu temizle ve paneli gizle (sadece tekrar oyna kalsın)
        playerNameInput.value = "";
        gameOverPanel.style.display = 'none';
        
        // Tabloyu güncelle
        updateLeaderboardUI();
    });

    // Liderlik Tablosu Logiği (LocalStorage ile)
    function saveScoreToLeaderboard(name, score) {
        let leaderboard = JSON.parse(localStorage.getItem('sahurjam_leaderboard')) || [];
        
        // Yeni skoru ekle
        leaderboard.push({ name: name, score: score });
        
        // Skor bazında büyükten küçüğe sırala
        leaderboard.sort((a, b) => b.score - a.score);
        
        // En iyi 10 skoru tutmak isterseniz:
        leaderboard = leaderboard.slice(0, 10);
        
        localStorage.setItem('sahurjam_leaderboard', JSON.stringify(leaderboard));
    }
    
    function updateLeaderboardUI() {
        leaderboardList.innerHTML = "";
        let leaderboard = JSON.parse(localStorage.getItem('sahurjam_leaderboard')) || [];
        
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = "<li>Henüz skor yok.</li>";
            return;
        }
        
        leaderboard.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${entry.name}</span> <span class="score-value">${entry.score}</span>`;
            leaderboardList.appendChild(li);
        });
    }
});
