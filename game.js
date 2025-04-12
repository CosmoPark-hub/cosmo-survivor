// Проверяем, доступен ли rexvirtualjoystickplugin
if (typeof rexvirtualjoystickplugin === 'undefined') {
    console.error("rexvirtualjoystickplugin не загружен. Проверьте подключение плагина в index.html.");
} else {
    console.log("rexvirtualjoystickplugin успешно загружен.");
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, // Ширина экрана устройства
    height: window.innerHeight, // Высота экрана устройства
    scale: {
        mode: Phaser.Scale.FIT, // Подгонка под экран с сохранением пропорций
        autoCenter: Phaser.Scale.CENTER_BOTH // Центрирование
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    plugins: {
        scene: [
            {
                key: 'rexVirtualJoystick',
                plugin: rexvirtualjoystickplugin,
                mapping: 'rexVirtualJoystick'
            }
        ]
    }
};

function startGame() {
    console.log("Запускаем игру...");
    const game = new Phaser.Game(config);
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
}

// Глобальные переменные
// Глобальные переменные
let player, enemies, bullets, fanBullets, orbBullets, missiles, mines, defenderOrbs, shields, rescueShields, lightsabers, plasmaOrbs, explosionsGroup, cursors, wasd, scoreText, levelText, killCount = 0, killText, playerHealth = 10, maxHealth = 10, healthText, enemySpawnDelay = 1500, part, parts, level = 1, gameLocation = 1, highestUnlockedLocation = 1, hasBossSpawned = false, fanEvent, orbEvent, missileEvent, mineEvent, defenderOrbEvent, shieldEvent, lightsaberEvent, plasmaOrbEvent, explosionEvent, enemySpawnEvent, isPaused = false, pauseText, menuButtonText, menuActive = true, locationContainer, locationButtons, titleText, locationTitle, menuMusic, location1Music, location2Music, location3Music, location4Music, location5Music, location6Music, location7Music, location8Music, location9Music, location10Music, hudBackground, gameOver = false, gameOverText, gameOverMenuButton, hearts, resurrectionsAvailable = 1, resurrectButton, selectedCharacter = null, characterImages = [], characterBorders = [], explosions, obstacles, playerDirection = 'right', leftArrow, rightArrow, spawnedEnemiesCount = 0, crystalIcon, crystalCountText, resurrectionIcon, joystick, lastMovementDirection = 0, pauseButton, backButton, secondResurrectionUsed = false;
let playerLevel = 1, weaponLevels = { bullet: 1, fanBullet: 1, orbBullet: 1, missile: 1, mine: 1, defenderOrb: 1, shield: 1, lightsaber: 1, plasmaOrb: 1, explosion: 1 }, unlockedWeapons = [], levelUpOptions = [], selectedOption = null, levelUpMenuElements = [], levelUpBorders = [];
let bossDefeated = Array(10).fill(false);
let currentCharacterIndex = 0;
let selectedLocation = null;
let currentMenu = 'character';
let overlay;
let controlText;
let crystalCount = 0;
let crystalText;
let crystals;
let unlockedCharacters = [true, false, false, false, false, false, false, false, false];
let isTransitioning = false;
let isCollectingPart = false;
let pendingPart = null;

function showDamageText(scene, x, y, damage) {
    // Преобразуем мировые координаты в экранные
    const camera = scene.cameras.main;
    const screenX = x - camera.scrollX;
    const screenY = y - camera.scrollY;

    const damageText = scene.add.text(screenX, screenY, `-${damage}`, {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Анимация: текст поднимается вверх и исчезает
    scene.tweens.add({
        targets: damageText,
        y: screenY - 30, // Поднимается на 30 пикселей вверх относительно экранных координат
        alpha: 0,        // Постепенно становится прозрачным
        duration: 300,   // Анимация длится 0.3 секунды
        ease: 'Power1',
        onComplete: () => {
            damageText.destroy(); // Уничтожаем текст после анимации
        }
    });
}

// Сохранение прогресса
function saveProgress() {
    const progress = {
        crystalCount: crystalCount,
        highestUnlockedLocation: highestUnlockedLocation,
        unlockedCharacters: unlockedCharacters
    };
    localStorage.setItem('cosmoSurvivorProgress', JSON.stringify(progress));
    console.log('Прогресс сохранён:', progress);
}

function loadProgress() {
    const savedProgress = localStorage.getItem('cosmoSurvivorProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        crystalCount = progress.crystalCount || 0;
        highestUnlockedLocation = progress.highestUnlockedLocation || 1;
        unlockedCharacters = progress.unlockedCharacters || [true, false, false, false, false, false, false, false, false];
        console.log('Прогресс загружен:', progress);
    } else {
        crystalCount = 0;
        highestUnlockedLocation = 1;
        unlockedCharacters = [true, false, false, false, false, false, false, false, false];
        console.log('Нет сохранённого прогресса, инициализируем значения по умолчанию.');
    }
    // Инициализируем bossDefeated на основе highestUnlockedLocation
    bossDefeated = Array(10).fill(false);
    for (let i = 0; i < highestUnlockedLocation - 1; i++) {
        bossDefeated[i] = true;
    }
    console.log('После загрузки прогресса: highestUnlockedLocation =', highestUnlockedLocation, 'bossDefeated =', bossDefeated, 'gameLocation =', gameLocation);
}

function resetProgress() {
    crystalCount = 0;
    highestUnlockedLocation = 1;
    bossDefeated = Array(10).fill(false);
    unlockedCharacters = [true, false, false, false, false, false, false, false, false];
    saveProgress();
    console.log('Прогресс сброшен.');
}

// Функция для отображения всплывающего сообщения
function showPopupMessage(message, duration = 2000) {
    if (this.popupMessage) {
        this.popupMessage.destroy();
    }

    this.popupMessage = this.add.text(400, 300, message, {
        fontSize: '24px',
        color: '#ff0000',
        align: 'center',
        backgroundColor: '#333333',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    this.time.delayedCall(duration, () => {
        if (this.popupMessage) {
            this.popupMessage.destroy();
            this.popupMessage = null;
        }
    }, [], this);
}

// Функция для отображения окна разблокировки персонажа
function showUnlockWindow(characterIndex, cost) {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
        .setOrigin(0.5)
        .setDepth(200)
        .setScrollFactor(0);

    const window = this.add.rectangle(400, 300, 400, 250, 0x333333)
        .setOrigin(0.5)
        .setDepth(201)
        .setScrollFactor(0);

    const message = this.add.text(400, 230, `Unlock for crystals: ${cost}/${crystalCount}`, {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    const buyButton = this.add.text(300, 300, 'Buy 100 Crystals', {
        fontSize: '20px',
        color: '#00ff00',
        align: 'center'
    }).setOrigin(0.5).setDepth(202).setInteractive().setScrollFactor(0);

    const adButton = this.add.text(500, 300, 'Watch Ad (+10 Crystals)', {
        fontSize: '20px',
        color: '#00ff00',
        align: 'center'
    }).setOrigin(0.5).setDepth(202).setInteractive().setScrollFactor(0);

    const closeButton = this.add.text(500, 350, 'X', {
        fontSize: '24px',
        color: '#ff0000',
        align: 'center'
    }).setOrigin(0.5).setDepth(202).setInteractive().setScrollFactor(0);

    buyButton.on('pointerdown', () => {
        if (typeof window.Android !== 'undefined') {
            window.Android.purchaseItem('100 Crystals'); // Вызов покупки в Android
        } else {
            console.log('Purchase simulation: 100 Crystals');
            crystalCount += 100;
            crystalCountText.setText(`${crystalCount}`);
            if (crystalCount >= cost) {
                unlockedCharacters[characterIndex] = true;
                saveProgress();
                this.scene.restart();
                showCharacterMenu.call(this);
            }
        }
    });

    adButton.on('pointerdown', () => {
        if (typeof window.Android !== 'undefined') {
            window.Android.showRewardedAd('ca-app-pub-9172676417246002/9930877633'); // Crystals Reward Ad
        } else {
            console.log('Ad simulation: +10 Crystals');
            crystalCount += 10;
            crystalCountText.setText(`${crystalCount}`);
            if (crystalCount >= cost) {
                unlockedCharacters[characterIndex] = true;
                saveProgress();
                this.scene.restart();
                showCharacterMenu.call(this);
            }
        }
    });

    closeButton.on('pointerdown', () => {
        overlay.destroy();
        window.destroy();
        message.destroy();
        buyButton.destroy();
        adButton.destroy();
        closeButton.destroy();
    });

    // Проверка после покупки/рекламы (вызывается из Android)
    window.checkUnlock = function() {
        if (crystalCount >= cost) {
            unlockedCharacters[characterIndex] = true;
            saveProgress();
            overlay.destroy();
            window.destroy();
            message.destroy();
            buyButton.destroy();
            adButton.destroy();
            closeButton.destroy();
            this.scene.restart();
            showCharacterMenu.call(this);
        }
    }.bind(this);
}

function preload() {
    this.load.image('menuBackground', 'menuBackground.png');
    this.load.image('background', 'background.png');
    this.load.image('background2', 'background2.png');
    this.load.image('background3', 'background3.png');
    this.load.image('background4', 'background4.png');
    this.load.image('background5', 'background5.png');
    this.load.image('background6', 'background6.png');
    this.load.image('background7', 'background7.png');
    this.load.image('background8', 'background8.png');
    this.load.image('background9', 'background9.png');
    this.load.image('background10', 'background10.png');
    this.load.image('player1', 'player1.png');
    this.load.image('player2', 'player2.png');
    this.load.image('player3', 'player3.png');
    this.load.image('player4', 'player4.png');
    this.load.image('player5', 'player5.png');
    this.load.image('player6', 'player6.png');
    this.load.image('player7', 'player7.png');
    this.load.image('player8', 'player8.png');
    this.load.image('player9', 'player9.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('enemy2', 'enemy2.png');
    this.load.image('enemy3', 'enemy3.png');
    this.load.image('enemy4', 'enemy4.png');
    this.load.image('enemy5', 'enemy5.png');
    this.load.image('enemy6', 'enemy6.png');
    this.load.image('enemy7', 'enemy7.png');
    this.load.image('enemy8', 'enemy8.png');
    this.load.image('enemy9', 'enemy9.png');
    this.load.image('enemy10', 'enemy10.png');
    this.load.image('enemy11', 'enemy11.png');
    this.load.image('enemy12', 'enemy12.png');
    this.load.image('enemy13', 'enemy13.png');
    this.load.image('boss', 'boss.png');
    this.load.image('boss2', 'boss2.png');
    this.load.image('boss3', 'boss3.png');
    this.load.image('boss4', 'boss4.png');
    this.load.image('boss5', 'boss5.png');
    this.load.image('bullet', 'bullet.png');
    this.load.image('fanBullet', 'fanBullet.png');
    this.load.image('orbBullet', 'orbBullet.png');
    this.load.image('missile', 'missile.png');
    this.load.image('mine', 'mine.png');
    this.load.image('defenderOrb', 'defenderOrb.png');
    this.load.image('shield', 'shield.png');
    this.load.image('rescueShield', 'rescueShield.png');
    this.load.image('lightsaber', 'lightsaber.png');
    this.load.image('plasmaOrb', 'plasmaOrb.png');
    this.load.image('explosionIcon', 'explosion1.png');
    this.load.image('part', 'part.png');
    this.load.image('heart', 'heart.png');
    this.load.image('doubleHeart', 'doubleHeart.png');
    this.load.image('crystal', 'crystal.png');
    this.load.image('obstacle', 'obstacle.png');
    this.load.image('explosion1', 'explosion1.png');
    this.load.image('explosion2', 'explosion2.png');
    this.load.image('explosion3', 'explosion3.png');
    this.load.image('explosion4', 'explosion4.png');
    this.load.image('explosion5', 'explosion5.png');
    this.load.image('arrowLeft', 'arrow_left.png');
    this.load.image('arrowRight', 'arrow_right.png');
    this.load.image('lock', 'lock.png');
    this.load.audio('menu_music', 'menu_music.mp3');
    this.load.audio('location1_music', 'location1_music.mp3');
    this.load.audio('location2_music', 'location2_music.mp3');
    this.load.audio('location3_music', 'location3_music.mp3');
    this.load.audio('location4_music', 'location4_music.mp3');
    this.load.audio('location5_music', 'location5_music.mp3');
    this.load.audio('location6_music', 'location6_music.mp3');
    this.load.audio('location7_music', 'location7_music.mp3');
    this.load.audio('location8_music', 'location8_music.mp3');
    this.load.audio('location9_music', 'location9_music.mp3');
    this.load.audio('location10_music', 'location10_music.mp3');
   

}
function create() {
    const backgroundHeight = 3000; // Фиксированная высота фона
    this.physics.world.setBounds(0, 0, window.innerWidth, backgroundHeight);
    this.cameras.main.setBounds(0, 0, window.innerWidth, backgroundHeight);
    this.cameras.main.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.cameras.main.setRoundPixels(true);

    explosions = this.physics.add.group();
    crystals = this.physics.add.group();

    this.anims.create({
        key: 'explode',
        frames: [
            { key: 'explosion1' },
            { key: 'explosion2' },
            { key: 'explosion3' },
            { key: 'explosion4' },
            { key: 'explosion5' }
        ],
        frameRate: 10,
        repeat: 0
    });

    loadProgress();

    // Создаём виртуальный джойстик
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    if (this.rexVirtualJoystick) {
        try {
            joystick = this.rexVirtualJoystick.add(this, {
                x: this.cameras.main.width * 0.15, // 15% от ширины экрана слева
                y: this.cameras.main.height * 0.85, // 85% от высоты экрана снизу
                radius: 50,
                base: this.add.circle(0, 0, 50, 0x888888).setDepth(100).setAlpha(0.5),
                thumb: this.add.circle(0, 0, 25, 0xcccccc).setDepth(100).setAlpha(0.5),
                dir: '8dir',
                forceMin: 0,
                enable: true
            }).setScrollFactor(0);
            console.log("Виртуальный джойстик успешно создан.");
        } catch (error) {
            console.error("Ошибка при создании виртуального джойстика:", error);
        }
    } else {
        console.warn("rexVirtualJoystick не доступен. Джойстик не будет создан.");
    }

    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (!hasSeenIntro) {
        showIntroScreen.call(this);
    } else {
        showCharacterMenu.call(this);
    }
}

function showIntroScreen() {
    menuActive = true;
    if (!menuMusic) {
        menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
    }
    if (!menuMusic.isPlaying) {
        menuMusic.play();
    }

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    overlay = this.add.image(centerX, centerY, 'menuBackground')
        .setOrigin(0.5, 0.5)
        .setDepth(100)
        .setScrollFactor(0);

    titleText = this.add.text(centerX, centerY - 200, 'CosmoSurvivor', { fontSize: '48px', color: '#fff', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setScrollFactor(0);

    const introText = this.add.text(centerX, centerY, "In the vast expanse of the cosmos, a lone explorer's quantum leap went awry, stranding him in an uncharted star system teeming with hostile alien life. To repair his ship's quantum module and return to Terra, he must survive and wrest vital parts from the xenomorphs lurking in this perilous void.", {
        fontSize: '24px', color: '#fff', align: 'center', wordWrap: { width: this.cameras.main.width * 0.9 }
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

    const startButton = this.add.text(centerX, centerY + 150, 'START', { fontSize: '32px', color: '#00ff00', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setInteractive()
        .setScrollFactor(0);
    startButton.on('pointerdown', () => {
        localStorage.setItem('hasSeenIntro', 'true');
        overlay.destroy();
        titleText.destroy();
        introText.destroy();
        startButton.destroy();
        showCharacterMenu.call(this);
    });
}

function showCharacterMenu() {
    currentMenu = 'character';
    menuActive = true;

    if (!menuMusic) {
        menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
    }
    if (!menuMusic.isPlaying) {
        menuMusic.play();
    }

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    overlay = this.add.image(centerX, centerY, 'menuBackground')
        .setOrigin(0.5, 0.5)
        .setDepth(100)
        .setScrollFactor(0);

    titleText = this.add.text(centerX, centerY - 200, 'CosmoSurvivor', { fontSize: '48px', color: '#fff', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setScrollFactor(0);

    crystalIcon = this.add.image(this.cameras.main.width - 50, 50, 'crystal')
        .setOrigin(0.5)
        .setDisplaySize(20, 20)
        .setScrollFactor(0)
        .setDepth(101);
    crystalCountText = this.add.text(this.cameras.main.width - 30, 50, `${crystalCount}`, { fontSize: '16px', color: '#fff' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);

    const characters = [
        { id: 1, texture: 'player1', weapon: 'bullet', cost: 0 },
        { id: 2, texture: 'player2', weapon: 'fanBullet', cost: 30 },
        { id: 3, texture: 'player3', weapon: 'lightsaber', cost: 50 },
        { id: 4, texture: 'player4', weapon: 'plasmaOrb', cost: 100 },
        { id: 5, texture: 'player5', weapon: 'mine', cost: 100 },
        { id: 6, texture: 'player6', weapon: 'defenderOrb', cost: 100 },
        { id: 7, texture: 'player7', weapon: 'orbBullet', cost: 100 },
        { id: 8, texture: 'player8', weapon: 'missile', cost: 100 },
        { id: 9, texture: 'player9', weapon: 'explosion', cost: 100 }
    ];

    const characterWidth = 70;
    const characterSpacing = 50;
    const startX = centerX - (2 * (characterWidth + characterSpacing)) / 2;
    const startY = centerY - 50;

    characterImages = [];
    characterBorders = [];
    for (let i = 0; i < characters.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = startX + col * (characterWidth + characterSpacing);
        const y = startY + row * (characterWidth + characterSpacing);
        const character = this.add.image(x, y, characters[i].texture)
            .setOrigin(0.5)
            .setDisplaySize(characterWidth, characterWidth)
            .setDepth(102)
            .setInteractive()
            .setScrollFactor(0);
        const border = this.add.rectangle(x, y, characterWidth + 4, characterWidth + 4, 0x000000, 0)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setDepth(101)
            .setScrollFactor(0);

        let lockIcon = null;
        if (!unlockedCharacters[i]) {
            lockIcon = this.add.image(x + characterWidth / 2 - 10, y + characterWidth / 2 - 10, 'lock')
                .setOrigin(0.5)
                .setDisplaySize(20, 20)
                .setDepth(103)
                .setScrollFactor(0);
        }

        characterImages.push({ character: character, lockIcon: lockIcon });
        characterBorders.push(border);

        character.on('pointerdown', () => {
            if (unlockedCharacters[i]) {
                selectedCharacter = characters[i].id;
                updateCharacterSelection();
                console.log('Выбран персонаж:', selectedCharacter);
            } else {
                showUnlockWindow.call(this, i, characters[i].cost);
            }
        });
    }

    function updateCharacterSelection() {
        characterImages.forEach((item, i) => {
            if (item.character) {
                characterBorders[i].setStrokeStyle(2, selectedCharacter === characters[i].id ? 0x00ff00 : 0x000000, 1);
            }
        });
    }

    updateCharacterSelection();

    const acceptButton = this.add.text(centerX, centerY + 300, 'ACCEPT', { fontSize: '32px', color: '#00ff00', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setInteractive()
        .setScrollFactor(0);
    acceptButton.on('pointerdown', () => {
        if (selectedCharacter) {
            characterImages.forEach(item => {
                if (item.character) item.character.destroy();
                if (item.lockIcon) item.lockIcon.destroy();
            });
            characterBorders.forEach(border => border.destroy());
            characterImages = [];
            characterBorders = [];

            overlay.destroy();
            titleText.destroy();
            acceptButton.destroy();
            crystalIcon.destroy();
            crystalCountText.destroy();

            showLocationMenu.call(this);
        } else {
            console.log('Выберите персонажа перед продолжением!');
        }
    });
}

function showLocationMenu() {
    currentMenu = 'location';
    menuActive = true;

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const hudPadding = 10; // Определяем отступ для согласованности

    overlay = this.add.image(centerX, centerY, 'menuBackground')
        .setOrigin(0.5, 0.5)
        .setDepth(100)
        .setScrollFactor(0);

    // Добавляем заголовок "Choose Location!" на 200 пикселей выше
    locationTitle = this.add.text(centerX, centerY - 400, 'Choose Location!', { fontSize: '48px', color: '#fff', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setScrollFactor(0);

    const scrollAreaWidth = this.cameras.main.width * 0.9;
    const scrollAreaHeight = this.cameras.main.height * 0.6;
    const scrollAreaX = centerX;
    const scrollAreaY = centerY;

    locationContainer = this.add.container(scrollAreaX, scrollAreaY)
        .setDepth(101)
        .setScrollFactor(0);

    const maskGraphics = this.make.graphics()
        .fillStyle(0xffffff)
        .fillRect(scrollAreaX - scrollAreaWidth / 2, scrollAreaY - scrollAreaHeight / 2, scrollAreaWidth, scrollAreaHeight);
    const mask = maskGraphics.createGeometryMask();
    locationContainer.setMask(mask);

    locationButtons = [];

    const locations = [
        { id: 1, texture: 'background', text: 'Surface' },
        { id: 2, texture: 'background2', text: 'Station' },
        { id: 3, texture: 'background3', text: 'Under the Crust' },
        { id: 4, texture: 'background4', text: 'Approach' },
        { id: 5, texture: 'background5', text: 'Inside' },
        { id: 6, texture: 'background6', text: 'In the Depths' },
        { id: 7, texture: 'background7', text: 'Storage' },
        { id: 8, texture: 'background8', text: 'Underside' },
        { id: 9, texture: 'background9', text: 'Pole' },
        { id: 10, texture: 'background10', text: 'Satellite' }
    ];

    let yOffset = -scrollAreaHeight / 2 + 50;

    locations.forEach(loc => {
        const buttonContainer = this.add.container(0, yOffset);

        const isAccessible = loc.id <= highestUnlockedLocation;
        const buttonColor = isAccessible ? 0xcccccc : 0x666666;
        const button = this.add.rectangle(0, 0, scrollAreaWidth - 20, 80, buttonColor, 0.8)
            .setOrigin(0.5, 0.5)
            .setInteractive();
        button.id = loc.id;

        const art = this.add.image(-scrollAreaWidth / 4, 0, loc.texture)
            .setOrigin(0, 0.5)
            .setDisplaySize(300, 60)
            .setDepth(102);

        const textBackground = this.add.rectangle(0, 0, 200, 30, 0x000000, 0.8)
            .setOrigin(0.5, 0.5)
            .setDepth(102);

        const text = this.add.text(0, 0, loc.text, { fontSize: '20px', color: '#ffffff', align: 'center' })
            .setOrigin(0.5)
            .setDepth(103);

        const border = this.add.rectangle(0, 0, scrollAreaWidth - 16, 84, 0x000000, 0)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setDepth(101);

        button.on('pointerdown', () => {
            if (isAccessible) {
                selectedLocation = loc.id;
                updateLocationSelection();
                console.log('Выбрана локация:', selectedLocation);
            } else {
                showPopupMessage.call(this, 'This location is locked!\nComplete the previous location first.', 2000);
            }
        });

        buttonContainer.add([button, art, textBackground, text, border]);
        locationContainer.add(buttonContainer);
        locationButtons.push({ button: button, art: art, text: text, textBackground: textBackground, border: border, buttonContainer: buttonContainer });
        yOffset += 100;
    });

    function updateLocationSelection() {
        locationButtons.forEach(loc => {
            loc.border.setStrokeStyle(2, selectedLocation === loc.button.id ? 0x00ff00 : 0x000000, 1);
        });
    }

    updateLocationSelection();

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
        locationContainer.y = Phaser.Math.Clamp(
            locationContainer.y - deltaY * 0.5,
            scrollAreaY - (locations.length * 100 - scrollAreaHeight),
            scrollAreaY + scrollAreaHeight / 2
        );
    });

    acceptButton = this.add.text(centerX, centerY + scrollAreaHeight / 2 + 50, 'ACCEPT', { fontSize: '32px', fontFamily: 'Arial', color: '#00ff00', align: 'center' })
        .setOrigin(0.5)
        .setDepth(101)
        .setInteractive()
        .setScrollFactor(0);
    acceptButton.on('pointerdown', () => {
        if (selectedLocation) {
            selectLocation.call(this, selectedLocation);
        } else {
            console.log('Выберите локацию перед продолжением!');
        }
    });

    // Добавляем кнопку "Back" в левом нижнем углу
    backButton = this.add.text(hudPadding, this.cameras.main.height - hudPadding, 'BACK', { fontSize: '32px', fontFamily: 'Arial', color: '#00ff00', align: 'center' })
        .setOrigin(0, 1) // Привязываем к левому нижнему углу
        .setDepth(101)
        .setInteractive()
        .setScrollFactor(0);
    backButton.on('pointerdown', () => {
        // Очищаем элементы текущего меню
        locationContainer.destroy();
        locationButtons = [];
        overlay.destroy();
        locationTitle.destroy();
        acceptButton.destroy();
        if (backButton) {
            backButton.destroy();
            backButton = null;
        }
        this.input.off('wheel'); // Удаляем обработчик прокрутки

        // Переходим в меню выбора персонажа
        showCharacterMenu.call(this);
    });
}

function selectLocation(location) {
    const isAccessible = location <= highestUnlockedLocation;
    if (!isAccessible) {
        console.log('Эта локация недоступна! Пройдите предыдущую локацию.');
        showPopupMessage.call(this, 'This location is locked!\nComplete the previous location first.', 2000);
        return;
    }

    if (menuMusic) menuMusic.stop();

    console.log("Уничтожаем элементы меню... Текущая локация:", gameLocation, "Переходим на локацию:", location);
    if (locationContainer) {
        locationButtons.forEach(button => {
            if (button.buttonContainer) {
                button.buttonContainer.destroy();
                button.buttonContainer = null;
            }
        });
        locationContainer.destroy();
        locationContainer = null;
        locationButtons = [];
    }
    if (titleText) {
        titleText.destroy();
        titleText = null;
    }
    if (acceptButton) {
        acceptButton.destroy();
        acceptButton = null;
    }
    if (overlay) {
        overlay.destroy();
        overlay = null;
    }
    if (crystalIcon) {
        console.log("Уничтожаем crystalIcon из меню...");
        crystalIcon.destroy();
        crystalIcon = null;
    }
    if (crystalCountText) {
        console.log("Уничтожаем crystalCountText из меню...");
        crystalCountText.destroy();
        crystalCountText = null;
    }
    if (this.resetButton) {
        console.log("Уничтожаем resetButton...");
        this.resetButton.destroy();
        this.resetButton = null;
    }
    if (part && part.active) {
        console.log("Уничтожаем деталь перед перезапуском сцены...");
        part.destroy();
        part = null;
    }

    killCount = 0;
    playerHealth = 10;
    maxHealth = 10;
    playerLevel = 1;

    gameLocation = location; // Устанавливаем новую локацию
    console.log("Новая локация установлена:", gameLocation);
    menuActive = false;

    updateBackground.call(this);
    initializeGameObjects.call(this);
    this.isTransitioning = false;

    // Обновляем highestUnlockedLocation, если текущая локация больше
    if (gameLocation > highestUnlockedLocation) {
        highestUnlockedLocation = gameLocation;
        saveProgress();
        console.log("Обновлён highestUnlockedLocation:", highestUnlockedLocation);
    }

    // Обработка музыки для всех 10 локаций
    if (gameLocation === 1) {
        if (!location1Music) location1Music = this.sound.add('location1_music', { loop: true, volume: 0.5 });
        if (!location1Music.isPlaying) location1Music.play();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 2) {
        if (!location2Music) location2Music = this.sound.add('location2_music', { loop: true, volume: 0.5 });
        if (!location2Music.isPlaying) location2Music.play();
        if (location1Music) location1Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 3) {
        if (!location3Music) location3Music = this.sound.add('location3_music', { loop: true, volume: 0.5 });
        if (!location3Music.isPlaying) location3Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 4) {
        if (!location4Music) location4Music = this.sound.add('location4_music', { loop: true, volume: 0.5 });
        if (!location4Music.isPlaying) location4Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 5) {
        if (!location5Music) location5Music = this.sound.add('location5_music', { loop: true, volume: 0.5 });
        if (!location5Music.isPlaying) location5Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 6) {
        if (!location6Music) location6Music = this.sound.add('location6_music', { loop: true, volume: 0.5 });
        if (!location6Music.isPlaying) location6Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 7) {
        if (!location7Music) location7Music = this.sound.add('location7_music', { loop: true, volume: 0.5 });
        if (!location7Music.isPlaying) location7Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 8) {
        if (!location8Music) location8Music = this.sound.add('location8_music', { loop: true, volume: 0.5 });
        if (!location8Music.isPlaying) location8Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location9Music) location9Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 9) {
        if (!location9Music) location9Music = this.sound.add('location9_music', { loop: true, volume: 0.5 });
        if (!location9Music.isPlaying) location9Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location10Music) location10Music.stop();
    } else if (gameLocation === 10) {
        if (!location10Music) location10Music = this.sound.add('location10_music', { loop: true, volume: 0.5 });
        if (!location10Music.isPlaying) location10Music.play();
        if (location1Music) location1Music.stop();
        if (location2Music) location2Music.stop();
        if (location3Music) location3Music.stop();
        if (location4Music) location4Music.stop();
        if (location5Music) location5Music.stop();
        if (location6Music) location6Music.stop();
        if (location7Music) location7Music.stop();
        if (location8Music) location8Music.stop();
        if (location9Music) location9Music.stop();
    }

    this.input.keyboard.removeAllListeners();

    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.keyboard.on('keydown-SPACE', togglePause, this);
}

function initializeGameObjects() {
    this.time.removeAllEvents();

    // Сбрасываем счётчики воскрешений
    resurrectionsAvailable = 1;
    secondResurrectionUsed = false;
    console.log("Счётчики воскрешений сброшены: resurrectionsAvailable =", resurrectionsAvailable, "secondResurrectionUsed =", secondResurrectionUsed);

    if (player && player.active) player.destroy();
    if (!enemies || !enemies.scene) enemies = this.physics.add.group();
    if (!bullets || !bullets.scene) bullets = this.physics.add.group();
    if (!fanBullets || !fanBullets.scene) fanBullets = this.physics.add.group();
    if (!orbBullets || !orbBullets.scene) orbBullets = this.physics.add.group();
    if (!missiles || !missiles.scene) missiles = this.physics.add.group();
    if (!mines || !mines.scene) mines = this.physics.add.group();
    if (!defenderOrbs || !defenderOrbs.scene) defenderOrbs = this.physics.add.group();
    if (!shields || !shields.scene) shields = this.physics.add.group();
    if (!rescueShields || !rescueShields.scene) rescueShields = this.physics.add.group();
    if (!lightsabers || !lightsabers.scene) lightsabers = this.physics.add.group();
    if (!plasmaOrbs || !plasmaOrbs.scene) plasmaOrbs = this.physics.add.group();
    if (!explosionsGroup || !explosionsGroup.scene) explosionsGroup = this.physics.add.group();
    if (!hearts || !hearts.scene) hearts = this.physics.add.group();
    if (!crystals || !crystals.scene) crystals = this.physics.add.group();
    if (!explosions || !explosions.scene) explosions = this.physics.add.group();
    if (!parts || !parts.scene) parts = this.physics.add.group();

    enemies.clear(true, true);
    bullets.clear(true, true);
    fanBullets.clear(true, true);
    orbBullets.clear(true, true);
    missiles.clear(true, true);
    mines.clear(true, true);
    defenderOrbs.clear(true, true);
    shields.clear(true, true);
    rescueShields.clear(true, true);
    lightsabers.clear(true, true);
    plasmaOrbs.clear(true, true);
    explosionsGroup.clear(true, true);
    hearts.clear(true, true);
    crystals.clear(true, true);
    explosions.clear(true, true);
    parts.clear(true, true);

    if (hudBackground) {
        hudBackground.destroy();
        hudBackground = null;
    }
    if (scoreText) {
        scoreText.destroy();
        scoreText = null;
    }
    if (levelText) {
        levelText.destroy();
        levelText = null;
    }
    if (killText) {
        killText.destroy();
        killText = null;
    }
    if (healthText) {
        healthText.destroy();
        healthText = null;
    }
    if (gameOverText) {
        gameOverText.destroy();
        gameOverText = null;
    }
    if (gameOverMenuButton) {
        gameOverMenuButton.destroy();
        gameOverMenuButton = null;
    }
    if (resurrectButton) {
        resurrectButton.destroy();
        resurrectButton = null;
    }
    if (crystalIcon) {
        console.log("Дополнительно уничтожаем crystalIcon в initializeGameObjects...");
        crystalIcon.destroy();
        crystalIcon = null;
    }
    if (crystalCountText) {
        console.log("Дополнительно уничтожаем crystalCountText в initializeGameObjects...");
        crystalCountText.destroy();
        crystalCountText = null;
    }
    if (pauseButton) {
        pauseButton.destroy();
        pauseButton = null;
    }
    if (backButton) {
        console.log("Дополнительно уничтожаем backButton в initializeGameObjects...");
        backButton.destroy();
        backButton = null;
    }
    if (locationTitle) { // Добавляем удаление locationTitle
        console.log("Дополнительно уничтожаем locationTitle в initializeGameObjects...");
        locationTitle.destroy();
        locationTitle = null;
    }

    gameOver = false;
    hasBossSpawned = false;
    spawnedEnemiesCount = 0;

    // Сбрасываем уровни всех оружий до начальных значений
    weaponLevels = {
        bullet: 1,
        fanBullet: 1,
        orbBullet: 1,
        missile: 1,
        mine: 1,
        defenderOrb: 1,
        shield: 1,
        lightsaber: 1,
        plasmaOrb: 1,
        explosion: 1
    };

    playerHealth = 10;
    maxHealth = 10;

    let playerTexture;
    switch (selectedCharacter) {
        case 1: playerTexture = 'player1'; break;
        case 2: playerTexture = 'player2'; break;
        case 3: playerTexture = 'player3'; break;
        case 4: playerTexture = 'player4'; break;
        case 5: playerTexture = 'player5'; break;
        case 6: playerTexture = 'player6'; break;
        case 7: playerTexture = 'player7'; break;
        case 8: playerTexture = 'player8'; break;
        case 9: playerTexture = 'player9'; break;
    }

    // Адаптируем начальную позицию игрока под размеры экрана
    const startX = window.innerWidth / 2; // Центр по X
    const startY = 3000 / 2; // Центр по Y (с учётом высоты фона 3000)
    player = this.physics.add.sprite(startX, startY, playerTexture);
    player.setCollideWorldBounds(true);

    console.log("Игрок создан, collideWorldBounds:", player.body.collideWorldBounds);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Ограничиваем скроллинг камеры, чтобы она не уходила ниже фона (высота фона = 3000)
    const backgroundHeight = 3000; // Фиксированная высота фона
    const maxCameraY = backgroundHeight - window.innerHeight; // Нижняя граница фона
    this.cameras.main.setBounds(0, 0, window.innerWidth, backgroundHeight); // Устанавливаем высоту мира равной высоте фона
    this.cameras.main.setFollowOffset(0, -window.innerHeight / 4); // Смещаем камеру немного вверх, чтобы игрок был ближе к центру
    this.cameras.main.scrollY = Math.min(this.cameras.main.scrollY, maxCameraY);

    const centerX = this.cameras.main.width / 2;
    const hudHeight = 40; // Высота HUD фиксирована
    const hudPadding = 10; // Отступ от края экрана

    // Фон HUD
    hudBackground = this.add.rectangle(centerX, hudHeight / 2, this.cameras.main.width, hudHeight, 0x333333)
        .setOrigin(0.5, 0.5)
        .setDepth(10)
        .setScrollFactor(0);

    // Текст и иконки HUD
    scoreText = this.add.text(hudPadding, hudHeight / 2, `Score: ${killCount * 10}`, { fontSize: '20px', color: '#fff' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(11);

    // Размещаем levelText сразу после scoreText
    const scoreTextWidth = scoreText.width; // Ширина текста scoreText
    levelText = this.add.text(hudPadding + scoreTextWidth + 20, hudHeight / 2, `Level: ${playerLevel}`, { fontSize: '20px', color: '#fff' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(11);

    killText = this.add.text(centerX - 50, hudHeight / 2, `Kills: ${killCount}`, { fontSize: '20px', color: '#fff' })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(11);

    const heartIcon = this.add.image(centerX + 50, hudHeight / 2, 'heart')
        .setOrigin(0, 0.5)
        .setDisplaySize(20, 20)
        .setScrollFactor(0)
        .setDepth(11);
    healthText = this.add.text(centerX + 70, hudHeight / 2, `${playerHealth}/${maxHealth}`, { fontSize: '20px', color: '#fff' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(11);

    // Смещаем счётчик кристаллов ближе к счётчику здоровья
    const crystalIconX = centerX + 130; // Смещаем на 60 пикселей вправо от healthText (centerX + 70 + 60)
    crystalIcon = this.add.image(crystalIconX, hudHeight / 2, 'crystal')
        .setOrigin(0, 0.5)
        .setDisplaySize(20, 20)
        .setScrollFactor(0)
        .setDepth(11);
    crystalText = this.add.text(crystalIconX + 20, hudHeight / 2, `${crystalCount}`, { fontSize: '20px', color: '#fff' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(11);

    // Кнопка паузы
    pauseButton = this.add.text(this.cameras.main.width - hudPadding, hudHeight / 2, 'PAUSE', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fff' })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(11)
        .setInteractive();

    pauseButton.on('pointerdown', () => {
        togglePause.call(this);
    });

    scoreText.setDepth(11);
    levelText.setDepth(11);
    killText.setDepth(11);
    healthText.setDepth(11);
    crystalText.setDepth(11);

    killText.setText(`Kills: ${killCount}`);
    scoreText.setText(`Score: ${killCount * 10}`);
    levelText.setText(`Level: ${playerLevel}`);
    healthText.setText(`${playerHealth}/${maxHealth}`);
    crystalText.setText(`${crystalCount}`);

    console.log("Инициализация оружий для персонажа:", selectedCharacter, "unlockedWeapons:", unlockedWeapons);

    switch (selectedCharacter) {
        case 1: unlockedWeapons = ['bullet']; break;
        case 2: unlockedWeapons = ['fanBullet']; break;
        case 3: unlockedWeapons = ['lightsaber']; break;
        case 4: unlockedWeapons = ['plasmaOrb']; break;
        case 5: unlockedWeapons = ['mine']; break;
        case 6: unlockedWeapons = ['defenderOrb']; break;
        case 7: unlockedWeapons = ['orbBullet']; break;
        case 8: unlockedWeapons = ['missile']; break;
        case 9: unlockedWeapons = ['explosion']; break;
    }

    if (unlockedWeapons.includes('bullet')) {
        let bulletDelay = 500; // Начальная задержка
        const reductionSteps = Math.floor((weaponLevels.bullet - 1) / 3); // Каждые 3 уровня оружия уменьшаем задержку
        bulletDelay *= Math.pow(0.8, reductionSteps); // Уменьшаем задержку на 20% каждые 3 уровня
        bulletDelay = Math.max(bulletDelay, 100); // Минимальная задержка 100 мс
        this.time.addEvent({ delay: bulletDelay, callback: shootBullet, callbackScope: this, loop: true });
        console.log("Добавлен таймер для bullet с задержкой:", bulletDelay);
    }
    if (unlockedWeapons.includes('fanBullet')) {
        fanEvent = this.time.addEvent({ delay: 2000, callback: shootFanBullets, callbackScope: this, loop: true });
        console.log("Добавлен таймер для fanBullet");
    }
    if (unlockedWeapons.includes('orbBullet')) {
        orbEvent = this.time.addEvent({ delay: 1500, callback: shootOrbBullets, callbackScope: this, loop: true });
        console.log("Добавлен таймер для orbBullet");
    }
    if (unlockedWeapons.includes('missile')) {
        missileEvent = this.time.addEvent({ delay: 1000, callback: shootMissile, callbackScope: this, loop: true });
        console.log("Добавлен таймер для missile");
    }
    if (unlockedWeapons.includes('mine')) {
        mineEvent = this.time.addEvent({ delay: 1000, callback: dropMine, callbackScope: this, loop: true });
        console.log("Добавлен таймер для mine");
    }
    if (unlockedWeapons.includes('defenderOrb')) {
        defenderOrbEvent = this.time.addEvent({ delay: 2000, callback: spawnDefenderOrb, callbackScope: this, loop: true });
        console.log("Добавлен таймер для defenderOrb");
    }
    if (unlockedWeapons.includes('shield')) {
        shieldEvent = this.time.addEvent({ delay: 4000, callback: spawnShield, callbackScope: this, loop: true });
        console.log("Добавлен таймер для shield");
    }
    if (unlockedWeapons.includes('lightsaber')) {
        lightsaberEvent = this.time.addEvent({ delay: 1500, callback: spawnLightsaber, callbackScope: this, loop: true });
        console.log("Добавлен таймер для lightsaber");
    }
    if (unlockedWeapons.includes('plasmaOrb')) {
        plasmaOrbEvent = this.time.addEvent({ delay: 1500, callback: shootPlasmaOrb, callbackScope: this, loop: true });
        console.log("Добавлен таймер для plasmaOrb");
    }
    if (unlockedWeapons.includes('explosion')) {
        explosionEvent = this.time.addEvent({ delay: 1000, callback: triggerExplosions, callbackScope: this, loop: true });
        console.log("Добавлен таймер для explosion");
    }

    // Сохраняем таймер спавна врагов
    enemySpawnEvent = this.time.addEvent({ delay: enemySpawnDelay, callback: spawnEnemy, callbackScope: this, loop: true });

    const savedPendingPart = localStorage.getItem('pendingPart');
    if (savedPendingPart) {
        const pendingPart = JSON.parse(savedPendingPart);
        if (pendingPart.gameLocation === gameLocation) {
            console.log("Восстанавливаем деталь после перезапуска...");
            spawnPart.call(this, pendingPart.x, pendingPart.y);
        }
    }

    setupCollisions.call(this);
}

function updateBackground() {
    if (this.background) this.background.destroy();
    if (gameLocation === 1) {
        this.background = this.add.image(400, 1500, 'background');
    } else if (gameLocation === 2) {
        this.background = this.add.image(400, 1500, 'background2');
    } else if (gameLocation === 3) {
        this.background = this.add.image(400, 1500, 'background3');
    } else if (gameLocation === 4) {
        this.background = this.add.image(400, 1500, 'background4');
    } else if (gameLocation === 5) {
        this.background = this.add.image(400, 1500, 'background5');
    } else if (gameLocation === 6) {
        this.background = this.add.image(400, 1500, 'background6');
    } else if (gameLocation === 7) {
        this.background = this.add.image(400, 1500, 'background7');
    } else if (gameLocation === 8) {
        this.background = this.add.image(400, 1500, 'background8');
    } else if (gameLocation === 9) {
        this.background = this.add.image(400, 1500, 'background9');
    } else if (gameLocation === 10) {
        this.background = this.add.image(400, 1500, 'background10');
    }
    this.background.setOrigin(0.5, 0.5);
    this.background.setDepth(0);
}

function getEnemyHealth(type) {
    switch (type) {
        case 'enemy': return 1;
        case 'enemy2': return 1;
        case 'enemy3': return 2;
        case 'enemy4': return 2;
        case 'enemy5': return 3;
        case 'enemy6': return 3;
        case 'enemy7': return 4;
        case 'enemy8': return 4;
        case 'enemy9': return 4;
        case 'enemy10': return 5;
        case 'enemy11': return 5;
        case 'enemy12': return 6;
        case 'enemy13': return 6;
        case 'enemy14': return 6;
        case 'enemy15': return 7;
        case 'enemy16': return 7;
        case 'boss': return 30;
        case 'boss2': return 40;
        case 'boss3': return 50;
        case 'boss4': return 60;
        case 'boss5': return 70;
        case 'boss6': return 80;
        case 'boss7': return 90;
        case 'boss8': return 100;
        case 'boss9': return 110;
        case 'boss10': return 120;
        default: return 1;
    }
}

function getEnemyDamage(type) {
    switch (type) {
        case 'enemy': return 1;
        case 'enemy2': return 1;
        case 'enemy3': return 2;
        case 'enemy4': return 2;
        case 'enemy5': return 3;
        case 'enemy6': return 3;
        case 'enemy7': return 5;
        case 'enemy8': return 5;
        case 'enemy9': return 5;
        case 'enemy10': return 6;
        case 'enemy11': return 6;
        case 'enemy12': return 6;
        case 'enemy13': return 6;
        case 'enemy14': return 6;
        case 'enemy15': return 6;
        case 'enemy16': return 6;
        case 'boss': return 5;
        case 'boss2': return 10;
        case 'boss3': return 10;
        case 'boss4': return 10;
        case 'boss5': return 10;
        case 'boss6': return 10;
        case 'boss7': return 10;
        case 'boss8': return 10;
        case 'boss9': return 12;
        case 'boss10': return 12;
        default: return 1;
    }
}

function getEnemySpeed(type) {
    switch (type) {
        case 'enemy': return 37.5;
        case 'enemy2': return 50;
        case 'enemy3': return 62.5;
        case 'enemy4': return 75;
        case 'enemy5': return 87.5;
        case 'enemy6': return 100;
        case 'enemy7': return 112.5;
        case 'enemy8': return 125;
        case 'enemy9': return 137.5;
        case 'enemy10': return 150;
        case 'enemy11': return 162.5;
        case 'enemy12': return 175;
        case 'enemy13': return 187.5;
        case 'enemy14': return 200;
        case 'enemy15': return 200;
        case 'enemy16': return 200;
        default: return 50;
    }
}

function spawnEnemy() {
    if (!menuActive && !isPaused && !gameOver) {
        let enemyType;
        if (gameLocation === 1) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy2';
            else if (killCount < 90) enemyType = 'enemy3';
            else if (killCount < 120) enemyType = 'enemy4';
            else return;
        } else if (gameLocation === 2) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy2';
            else if (killCount < 90) enemyType = 'enemy3';
            else if (killCount < 120) enemyType = 'enemy4';
            else if (killCount < 150) enemyType = 'enemy5';
            else if (killCount < 180) enemyType = 'enemy6';
            else if (killCount < 210) enemyType = 'enemy';
            else return;
        } else if (gameLocation === 3) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy2';
            else if (killCount < 90) enemyType = 'enemy3';
            else if (killCount < 120) enemyType = 'enemy4';
            else if (killCount < 150) enemyType = 'enemy5';
            else if (killCount < 180) enemyType = 'enemy6';
            else if (killCount < 210) enemyType = 'enemy7';
            else if (killCount < 240) enemyType = 'enemy8';
            else return;
        } else if (gameLocation === 4) {
            if (killCount < 30) enemyType = 'enemy2';
            else if (killCount < 60) enemyType = 'enemy4';
            else if (killCount < 90) enemyType = 'enemy5';
            else if (killCount < 120) enemyType = 'enemy6';
            else if (killCount < 150) enemyType = 'enemy7';
            else if (killCount < 180) enemyType = 'enemy8';
            else if (killCount < 210) enemyType = 'enemy9';
            else if (killCount < 240) enemyType = 'enemy10';
            else return;
        } else if (gameLocation === 5) {
            if (killCount < 30) enemyType = 'enemy2';
            else if (killCount < 60) enemyType = 'enemy3';
            else if (killCount < 90) enemyType = 'enemy4';
            else if (killCount < 120) enemyType = 'enemy6';
            else if (killCount < 150) enemyType = 'enemy7';
            else if (killCount < 180) enemyType = 'enemy8';
            else if (killCount < 210) enemyType = 'enemy9';
            else if (killCount < 240) enemyType = 'enemy10';
            else if (killCount < 270) enemyType = 'enemy11';
            else if (killCount < 300) enemyType = 'enemy12';
            else return;
        } else if (gameLocation === 6) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy4';
            else if (killCount < 90) enemyType = 'enemy8';
            else if (killCount < 120) enemyType = 'enemy9';
            else if (killCount < 150) enemyType = 'enemy10';
            else if (killCount < 180) enemyType = 'enemy12';
            else if (killCount < 210) enemyType = 'enemy13';
            else if (killCount < 240) enemyType = 'enemy14';
            else return;
        } else if (gameLocation === 7) {
            if (killCount < 30) enemyType = 'enemy2';
            else if (killCount < 60) enemyType = 'enemy4';
            else if (killCount < 90) enemyType = 'enemy6';
            else if (killCount < 120) enemyType = 'enemy8';
            else if (killCount < 150) enemyType = 'enemy10';
            else if (killCount < 180) enemyType = 'enemy12';
            else if (killCount < 210) enemyType = 'enemy14';
            else if (killCount < 240) enemyType = 'enemy15';
            else return;
        } else if (gameLocation === 8) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy3';
            else if (killCount < 90) enemyType = 'enemy5';
            else if (killCount < 120) enemyType = 'enemy7';
            else if (killCount < 150) enemyType = 'enemy9';
            else if (killCount < 180) enemyType = 'enemy11';
            else if (killCount < 210) enemyType = 'enemy13';
            else if (killCount < 240) enemyType = 'enemy15';
            else if (killCount < 270) enemyType = 'enemy16';
            else return;
        } else if (gameLocation === 9) {
            if (killCount < 30) enemyType = 'enemy3';
            else if (killCount < 60) enemyType = 'enemy5';
            else if (killCount < 90) enemyType = 'enemy8';
            else if (killCount < 120) enemyType = 'enemy11';
            else if (killCount < 150) enemyType = 'enemy13';
            else if (killCount < 180) enemyType = 'enemy14';
            else if (killCount < 210) enemyType = 'enemy15';
            else if (killCount < 240) enemyType = 'enemy16';
            else return;
        } else if (gameLocation === 10) {
            if (killCount < 30) enemyType = 'enemy';
            else if (killCount < 60) enemyType = 'enemy5';
            else if (killCount < 90) enemyType = 'enemy7';
            else if (killCount < 120) enemyType = 'enemy10';
            else if (killCount < 150) enemyType = 'enemy12';
            else if (killCount < 180) enemyType = 'enemy14';
            else if (killCount < 210) enemyType = 'enemy16';
            else return;
        }

        let x, y;
        if (spawnedEnemiesCount < 10) {
            // Спавн первых 10 врагов в пределах видимой области камеры
            const camera = this.cameras.main;
            const minDistance = 200; // Минимальное расстояние от игрока (в пикселях)

            // Видимая область камеры
            const minX = camera.scrollX;
            const maxX = camera.scrollX + 800;
            const minY = camera.scrollY;
            const maxY = camera.scrollY + 600;

            // Позиция игрока
            const playerX = player.x;
            const playerY = player.y;

            // Генерируем случайные координаты, пока не найдём подходящие
            do {
                x = Phaser.Math.Between(minX, maxX);
                y = Phaser.Math.Between(minY, maxY);
            } while (Phaser.Math.Distance.Between(x, y, playerX, playerY) < minDistance);
        } else {
            // Обычный спавн на границах карты
            const spawnSide = Phaser.Math.Between(0, 3);
            if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
            else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
            else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
            else { x = 820; y = Phaser.Math.Between(0, 3000); }
        }

        const enemy = enemies.create(x, y, enemyType);
        enemy.health = getEnemyHealth(enemyType);
        enemy.type = enemyType;
        enemy.damage = getEnemyDamage(enemyType);
        enemy.isDead = false;
        enemy.isBoss = false;
        enemy.setCollideWorldBounds(true);

        spawnedEnemiesCount++; // Увеличиваем счётчик спавненных врагов
    }
}

function spawnBoss() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss');
    boss.isBoss = true;
    boss.health = getEnemyHealth('boss'); // Используем getEnemyHealth
    boss.damage = getEnemyDamage('boss'); // Используем getEnemyDamage
    boss.setCollideWorldBounds(true);
}

function spawnBoss2() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss2');
    boss.isBoss = true;
    boss.health = getEnemyHealth('boss2');
    boss.damage = getEnemyDamage('boss2');
    boss.setCollideWorldBounds(true);
}

function spawnBoss3() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss3');
    boss.isBoss = true;
    boss.health = getEnemyHealth('boss3');
    boss.damage = getEnemyDamage('boss3');
    boss.setCollideWorldBounds(true);
}

function spawnBoss4() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss4');
    boss.isBoss = true;
    boss.health = getEnemyHealth('boss4');
    boss.damage = getEnemyDamage('boss4');
    boss.setCollideWorldBounds(true);
}

function spawnBoss5() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss5');
    boss.isBoss = true;
    boss.health = getEnemyHealth('boss5');
    boss.damage = getEnemyDamage('boss5');
    boss.setCollideWorldBounds(true);
}

function spawnBoss6() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss6');
    boss.health = getEnemyHealth('boss6');
    boss.type = 'boss6';
    boss.damage = getEnemyDamage('boss6');
    boss.isDead = false;
    boss.isBoss = true;
    boss.setCollideWorldBounds(true);
}

function spawnBoss7() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss7');
    boss.health = getEnemyHealth('boss7');
    boss.type = 'boss7';
    boss.damage = getEnemyDamage('boss7');
    boss.isDead = false;
    boss.isBoss = true;
    boss.setCollideWorldBounds(true);
}

function spawnBoss8() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss8');
    boss.health = getEnemyHealth('boss8');
    boss.type = 'boss8';
    boss.damage = getEnemyDamage('boss8');
    boss.isDead = false;
    boss.isBoss = true;
    boss.setCollideWorldBounds(true);
}

function spawnBoss9() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss9');
    boss.health = getEnemyHealth('boss9');
    boss.type = 'boss9';
    boss.damage = getEnemyDamage('boss9');
    boss.isDead = false;
    boss.isBoss = true;
    boss.setCollideWorldBounds(true);
}

function spawnBoss10() {
    const spawnSide = Phaser.Math.Between(0, 3);
    let x, y;
    if (spawnSide === 0) { x = Phaser.Math.Between(0, 800); y = -20; }
    else if (spawnSide === 1) { x = Phaser.Math.Between(0, 800); y = 3020; }
    else if (spawnSide === 2) { x = -20; y = Phaser.Math.Between(0, 3000); }
    else { x = 820; y = Phaser.Math.Between(0, 3000); }
    const boss = enemies.create(x, y, 'boss10');
    boss.health = getEnemyHealth('boss10');
    boss.type = 'boss10';
    boss.damage = getEnemyDamage('boss10');
    boss.isDead = false;
    boss.isBoss = true;
    boss.setCollideWorldBounds(true);
}

function spawnPart(x, y) {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        try {
            console.log("Создаём деталь на x:", x, "y:", y);
            part = parts.create(x, y, 'part');
            part.setCollideWorldBounds(true);
            part.setDepth(10);
            // Удаляем информацию о детали из localStorage после успешного создания
            localStorage.removeItem('pendingPart');
            // Добавляем постоянное мигание для заметности
            this.tweens.add({
                targets: part,
                alpha: { from: 1, to: 0.5 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        } catch (error) {
            console.error("Ошибка при создании детали:", error.message);
            console.warn("Сохраняем координаты детали в localStorage.");
            localStorage.setItem('pendingPart', JSON.stringify({ x: x, y: y, gameLocation: gameLocation }));
        }
    } else {
        console.warn("Игра приостановлена. Сохраняем координаты детали в localStorage.");
        localStorage.setItem('pendingPart', JSON.stringify({ x: x, y: y, gameLocation: gameLocation }));
    }
}

function spawnHeart(x, y, healAmount) {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const heart = hearts.create(x, y, healAmount === 1 ? 'heart' : 'doubleHeart');
        heart.setVelocity(0, 0);
        heart.healAmount = healAmount;
    }
}

function spawnCrystal(x, y) {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const crystal = crystals.create(x, y, 'crystal');
        crystal.setVelocity(0, 0);
    }
}

function collectHeart(player, heart) {
    if (playerHealth < maxHealth) {
        playerHealth = Math.min(playerHealth + heart.healAmount, maxHealth);
        healthText.setText(`${playerHealth}/${maxHealth}`);
        heart.destroy();
    }
}

function collectCrystal(player, crystal) {
    crystal.destroy();
    crystalCount++;
    crystalText.setText(`${crystalCount}`);
    saveProgress();
}

function collectPart(player, part) {
    if (isCollectingPart) return; // Предотвращаем многократный вызов
    isCollectingPart = true;

    console.log("Деталь собрана! Текущая локация:", gameLocation);
    this.tweens.add({
        targets: part,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 1.5 },
        duration: 500,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
            part.destroy();
            this.isTransitioning = true;
            const nextLocation = gameLocation + 1;
            console.log("Переходим на следующую локацию:", nextLocation);
            // Обновляем highestUnlockedLocation перед переходом
            if (nextLocation > highestUnlockedLocation) {
                highestUnlockedLocation = nextLocation;
                saveProgress();
                console.log("Обновлён highestUnlockedLocation:", highestUnlockedLocation);
            }
            if (nextLocation <= 10) { // Всего 10 локаций
                this.time.delayedCall(100, () => {
                    if (this.isTransitioning) {
                        selectLocation.call(this, nextLocation);
                    }
                    isCollectingPart = false; // Сбрасываем флаг после завершения перехода
                }, [], this);
            } else {
                this.time.delayedCall(100, () => {
                    if (this.isTransitioning) {
                        showLocationMenu.call(this);
                        console.log('Игра завершена! Все локации пройдены.');
                    }
                    isCollectingPart = false; // Сбрасываем флаг после завершения перехода
                }, [], this);
            }
        }
    });
}

function shootBullet() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const bullet = bullets.create(player.x, player.y, 'bullet');
        bullet.damage = weaponLevels.bullet;
        let angle = player.rotation;
        if (playerDirection === 'left') angle = Math.PI - angle;
        bullet.setRotation(angle);
        this.physics.velocityFromRotation(angle, 300, bullet.body.velocity);
    }
}

function shootFanBullets() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        let baseAngle = player.rotation;
        if (playerDirection === 'left') baseAngle = Math.PI - baseAngle;
        const numBullets = weaponLevels.fanBullet >= 3 ? 5 : 3;
        const startIndex = -(numBullets - 1) / 2;
        for (let i = startIndex; i <= (numBullets - 1) / 2; i++) {
            const bullet = fanBullets.create(player.x, player.y, 'fanBullet');
            bullet.damage = weaponLevels.fanBullet;
            const spreadAngle = baseAngle + (i * 0.2);
            bullet.setRotation(spreadAngle);
            this.physics.velocityFromRotation(spreadAngle, 250, bullet.body.velocity);
        }
    }
}

function shootOrbBullets() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const numBullets = 8;
        const angleStep = 2 * Math.PI / numBullets;
        for (let i = 0; i < numBullets; i++) {
            const angle = i * angleStep;
            const bullet = orbBullets.create(player.x, player.y, 'orbBullet');
            bullet.damage = weaponLevels.orbBullet;
            bullet.setRotation(angle);
            this.physics.velocityFromRotation(angle, 250, bullet.body.velocity);
        }
    }
}

function shootMissile() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const numMissiles = weaponLevels.missile >= 5 ? 2 : 1;
        for (let i = 0; i < numMissiles; i++) {
            const missile = missiles.create(player.x + (i * 10 - (numMissiles - 1) * 5), player.y, 'missile');
            missile.damage = weaponLevels.missile;
            missile.speed = 200;
            missile.setRotation(player.rotation);
        }
    }
}

function dropMine() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const mine = mines.create(player.x, player.y + 30, 'mine'); // Смещаем на 30 пикселей вниз
        mine.damage = weaponLevels.mine;
        mine.setVelocity(0, 0);
    }
}

function spawnDefenderOrb() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const numOrbs = weaponLevels.defenderOrb >= 3 ? 2 : 1;
        for (let i = 0; i < numOrbs; i++) {
            const orb = defenderOrbs.create(player.x, player.y, 'defenderOrb');
            orb.damage = weaponLevels.defenderOrb;
            orb.spawnTime = this.time.now + (i * 1000);
        }
    }
}

function spawnShield() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        // Очищаем группу shields перед созданием нового щита
        shields.clear(true, true);

        const shield = shields.create(player.x, player.y, 'shield');
        const lifetime = 2000 + (weaponLevels.shield - 1) * 200;
        console.log(`Щит создан: Уровень ${weaponLevels.shield}, Время жизни ${lifetime}мс`);

        // Сохраняем таймер уничтожения в объекте щита
        shield.destroyTimer = this.time.delayedCall(lifetime, () => {
            if (shield && shield.active) {
                console.log('Щит уничтожен');
                shield.setActive(false);
                shield.setVisible(false);
                shield.destroy();
            }
        }, [], this);
    }
}

function spawnLightsaber() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            pointer.x + this.cameras.main.scrollX,
            pointer.y + this.cameras.main.scrollY
        );
        const distance = 50;
        const saber = lightsabers.create(
            player.x + Math.cos(angle) * distance,
            player.y + Math.sin(angle) * distance,
            'lightsaber'
        );
        saber.setRotation(angle);
        saber.setOrigin(0, 0.5);
        saber.setDisplaySize(100, 10);
        saber.damage = weaponLevels.lightsaber;
        saber.setDepth(5);

        this.tweens.add({
            targets: saber,
            rotation: { from: angle - 0.785, to: angle + 0.785 },
            duration: 250,
            yoyo: true,
            repeat: 1,
            onUpdate: () => {
                enemies.getChildren().forEach(enemy => {
                    if (!enemy.isDead && Phaser.Geom.Intersects.RectangleToRectangle(saber.getBounds(), enemy.getBounds())) {
                        hitEnemy(saber, enemy);
                    }
                });
            },
            onComplete: () => {
                saber.destroy();
            }
        });
    }
}

function shootPlasmaOrb() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            pointer.x + this.cameras.main.scrollX,
            pointer.y + this.cameras.main.scrollY
        );

        const plasma = plasmaOrbs.create(player.x, player.y, 'plasmaOrb');
        plasma.damage = weaponLevels.plasmaOrb || 1;
        plasma.setRotation(angle);
        plasma.setScale(1.5);
        this.physics.velocityFromRotation(angle, 150, plasma.body.velocity);
        plasma.setDepth(5);
        plasma.hasHit = false;

        this.time.delayedCall(2000, () => {
            if (plasma && plasma.active) {
                const explosion = explosions.create(plasma.x, plasma.y, 'explosion1');
                explosion.play('explode');
                explosion.on('animationcomplete', () => explosion.destroy());
                plasma.destroy();
            }
        }, [], this);
    }
}

function triggerExplosions() {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        for (let i = 0; i < 5; i++) {
            const radius = 100;
            const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
            const x = player.x + Math.cos(angle) * radius;
            const y = player.y + Math.sin(angle) * radius;
            const explosion = explosionsGroup.create(x, y, 'explosion1');
            explosion.damage = weaponLevels.explosion;
            explosion.setDepth(5);
            explosion.setDisplaySize(32, 32); // Устанавливаем размер взрыва для визуального контакта
            explosion.lifetime = 1000; // Взрыв существует 1 секунду
            explosion.play('explode');
        }
    }
}

function hitEnemy(weapon, enemy) {
    if (!menuActive && !isPaused && !gameOver && !enemy.isDead && levelUpOptions.length === 0) {
        const isDefenderOrb = weapon.texture.key === 'defenderOrb';
        const isLightsaber = weapon.texture.key === 'lightsaber';
        const isPlasmaOrb = weapon.texture.key === 'plasmaOrb';

        if (!isDefenderOrb && !isLightsaber && !isPlasmaOrb) {
            weapon.destroy();
        } else if (isPlasmaOrb) {
            if (!weapon.hasHit) {
                weapon.hasHit = true;
                this.time.delayedCall(500, () => {
                    if (weapon && weapon.active) {
                        const explosion = explosions.create(weapon.x, weapon.y, 'explosion1');
                        explosion.play('explode');
                        explosion.on('animationcomplete', () => explosion.destroy());
                        weapon.destroy();
                    }
                }, [], this);
            }
        }

        enemy.health -= weapon.damage;
        if (enemy.health <= 0) {
            enemy.isDead = true;
            enemy.setVisible(false);
            enemy.body.enable = false;
            const explosion = explosions.create(enemy.x, enemy.y, 'explosion1');
            explosion.play('explode');
            if (enemy.isBoss) {
                console.log("Спавним деталь...");
                spawnPart.call(this, enemy.x, enemy.y);
            }
            explosion.on('animationcomplete', () => {
                explosion.destroy();
                console.log("Босс убит, enemy.isBoss:", enemy.isBoss, "gameLocation:", gameLocation);
                if (!enemy.isBoss) {
                    const chance = Phaser.Math.Between(0, 100);
                    if (chance < 10) {
                        spawnCrystal.call(this, enemy.x, enemy.y);
                    } else if (chance < 20) {
                        spawnHeart.call(this, enemy.x, enemy.y, 1);
                    } else if (chance < 25 && enemy.level >= 7) {
                        spawnHeart.call(this, enemy.x, enemy.y, 2);
                    }
                }
                enemy.destroy();
                killCount++;
                killText.setText(`Kills: ${killCount}`);
                scoreText.setText(`Score: ${killCount * 10}`);
            }, this);
        }

        if (weapon.texture.key === 'mine') {
            const explosion = explosions.create(weapon.x, weapon.y, 'explosion1');
            explosion.play('explode');
            explosion.on('animationcomplete', () => explosion.destroy());
            weapon.destroy();
        }
    }
}

function hitPlayer(player, enemy) {
    if (!menuActive && !isPaused && !gameOver && levelUpOptions.length === 0) {
        // Проверяем, есть ли активный щит (обычный или спасительный)
        let hasActiveShield = false;
        if (shields && typeof shields.getChildren === 'function') {
            hasActiveShield = shields.getChildren().some(shield => shield.active && shield.visible);
        }
        if (!hasActiveShield && rescueShields && typeof rescueShields.getChildren === 'function') {
            hasActiveShield = rescueShields.getChildren().some(shield => shield.active && shield.visible);
        }

        if (hasActiveShield) {
            // Если есть активный щит, враг не наносит урон игроку и не получает урон
            return;
        }

        if (!enemy.isBoss) {
            enemy.health -= 1;
            if (enemy.health <= 0) {
                enemy.isDead = true;
                enemy.setVisible(false);
                enemy.body.enable = false;
                const explosion = explosions.create(enemy.x, enemy.y, 'explosion1');
                explosion.play('explode');
                explosion.on('animationcomplete', () => {
                    explosion.destroy();
                    const chance = Phaser.Math.Between(0, 100);
                    if (chance < 10) {
                        spawnCrystal.call(this, enemy.x, enemy.y);
                    } else if (chance < 20) {
                        spawnHeart.call(this, enemy.x, enemy.y, 1);
                    } else if (chance < 25 && enemy.level >= 7) {
                        spawnHeart.call(this, enemy.x, enemy.y, 2);
                    }
                    enemy.destroy();
                    killCount++;
                    killText.setText(`Kills: ${killCount}`);
                    scoreText.setText(`Score: ${killCount * 10}`);
                });
            }
        }

        if (typeof playerHealth !== 'number' || isNaN(playerHealth)) {
            console.error("Ошибка: playerHealth не является числом. Сбрасываем до максимума.");
            playerHealth = maxHealth;
        }
        const oldHealth = playerHealth;
        playerHealth -= enemy.damage;
        if (playerHealth < 0) playerHealth = 0;
        const damageTaken = oldHealth - playerHealth;
        healthText.setText(`${playerHealth}/${maxHealth}`);

        // Отображаем урон над игроком
        if (damageTaken > 0) {
            showDamageText(this, player.x, player.y - 30, damageTaken);
        }
        
        if (playerHealth <= 0) {
            gameOverHandler.call(this);
        }
    }
}

function gameOverHandler() {
    gameOver = true;
    this.physics.pause();

    if (fanEvent) fanEvent.paused = true;
    if (orbEvent) orbEvent.paused = true;
    if (missileEvent) missileEvent.paused = true;
    if (mineEvent) mineEvent.paused = true;
    if (defenderOrbEvent) defenderOrbEvent.paused = true;
    if (shieldEvent) shieldEvent.paused = true;
    if (lightsaberEvent) lightsaberEvent.paused = true;
    if (plasmaOrbEvent) plasmaOrbEvent.paused = true;
    if (explosionEvent) explosionEvent.paused = true;
    if (this.bossTimer) this.bossTimer.paused = true;

    if (gameLocation === 1 && location1Music) location1Music.pause();
    else if (gameLocation === 2 && location2Music) location2Music.pause();
    else if (gameLocation === 3 && location3Music) location3Music.pause();
    else if (gameLocation === 4 && location4Music) location4Music.pause();
    else if (gameLocation === 5 && location5Music) location5Music.pause();
    else if (gameLocation === 6 && location6Music) location6Music.pause();
    else if (gameLocation === 7 && location7Music) location7Music.pause();
    else if (gameLocation === 8 && location8Music) location8Music.pause();
    else if (gameLocation === 9 && location9Music) location9Music.pause();
    else if (gameLocation === 10 && location10Music) location10Music.pause();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Добавляем полупрозрачную подложку
    const gameOverOverlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(99);

    gameOverText = this.add.text(centerX, centerY - 50, 'GAME OVER', { fontSize: '48px', color: '#ff0000' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(100);
    gameOverMenuButton = this.add.text(centerX, centerY + 100, 'TO MENU', { fontSize: '24px', color: '#fff', align: 'center' })
        .setOrigin(0.5)
        .setDepth(100)
        .setInteractive()
        .setScrollFactor(0);
    gameOverMenuButton.on('pointerdown', () => returnToMenu.call(this));

    if (resurrectionsAvailable > 0) {
        resurrectButton = this.add.text(centerX, centerY + 10, 'RESURRECT (FREE)', { fontSize: '24px', color: '#00ff00', align: 'center' })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive()
            .setScrollFactor(0);
        resurrectButton.on('pointerdown', () => resurrectPlayer.call(this));
    } else if (resurrectionsAvailable === 0 && !this.secondResurrectionUsed) {
        resurrectButton = this.add.text(centerX, centerY + 10, 'RESURRECT (AD)', { fontSize: '24px', color: '#00ff00', align: 'center' })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive()
            .setScrollFactor(0);
        resurrectButton.on('pointerdown', () => {
            if (typeof window.Android !== 'undefined') {
                window.Android.showRewardedAd('ca-app-pub-9172676417246002/2349505741'); // Revive Reward Ad
            } else {
                console.log('Ad simulation: Revive');
                this.secondResurrectionUsed = true;
                resurrectPlayer.call(this);
            }
        });
    } else {
        resurrectButton = this.add.text(centerX, centerY + 10, 'RESURRECT (BUY)', { fontSize: '24px', color: '#00ff00', align: 'center' })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive()
            .setScrollFactor(0);
        resurrectButton.on('pointerdown', () => {
            if (typeof window.Android !== 'undefined') {
                window.Android.purchaseItem('Revive'); // Покупка воскрешения
            } else {
                console.log('Purchase simulation: Revive');
                resurrectPlayer.call(this);
            }
        });
    }

    // Сохраняем подложку, чтобы уничтожить её при возобновлении игры
    this.gameOverOverlay = gameOverOverlay;
}

function resurrectPlayer() {
    if (resurrectionsAvailable > 0) {
        resurrectionsAvailable = 0;
        playerHealth = 5;
        healthText.setText(`${playerHealth}/${maxHealth}`);
        gameOver = false;

        if (gameOverText) gameOverText.destroy();
        if (gameOverMenuButton) gameOverMenuButton.destroy();
        if (resurrectButton) resurrectButton.destroy();
        if (this.gameOverOverlay) {
            this.gameOverOverlay.destroy();
            this.gameOverOverlay = null;
        }

        this.physics.resume();
        if (unlockedWeapons.includes('bullet')) {
            let bulletDelay = 500; // Начальная задержка
            const reductionSteps = Math.floor((weaponLevels.bullet - 1) / 3); // Каждые 3 уровня оружия уменьшаем задержку
            bulletDelay *= Math.pow(0.8, reductionSteps); // Уменьшаем задержку на 20% каждые 3 уровня
            bulletDelay = Math.max(bulletDelay, 100); // Минимальная задержка 100 мс
            this.time.addEvent({ delay: bulletDelay, callback: shootBullet, callbackScope: this, loop: true });
        }
        // Восстанавливаем таймер спавна врагов
        enemySpawnEvent = this.time.addEvent({ delay: enemySpawnDelay, callback: spawnEnemy, callbackScope: this, loop: true });
        if (unlockedWeapons.includes('fanBullet')) {
            fanEvent = this.time.addEvent({ delay: 2000, callback: shootFanBullets, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('orbBullet')) {
            orbEvent = this.time.addEvent({ delay: 1500, callback: shootOrbBullets, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('missile')) {
            missileEvent = this.time.addEvent({ delay: 1000, callback: shootMissile, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('mine')) {
            mineEvent = this.time.addEvent({ delay: 1000, callback: dropMine, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('defenderOrb')) {
            defenderOrbEvent = this.time.addEvent({ delay: 2000, callback: spawnDefenderOrb, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('shield')) {
            shieldEvent = this.time.addEvent({ delay: 4000, callback: spawnShield, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('lightsaber')) {
            lightsaberEvent = this.time.addEvent({ delay: 1500, callback: spawnLightsaber, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('plasmaOrb')) {
            plasmaOrbEvent = this.time.addEvent({ delay: 1500, callback: shootPlasmaOrb, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('explosion')) {
            explosionEvent = this.time.addEvent({ delay: 1000, callback: triggerExplosions, callbackScope: this, loop: true });
        }

        if (gameLocation === 1 && location1Music) location1Music.resume();
        else if (gameLocation === 2 && location2Music) location2Music.resume();
        else if (gameLocation === 3 && location3Music) location3Music.resume();
        else if (gameLocation === 4 && location4Music) location4Music.resume();
        else if (gameLocation === 5 && location5Music) location5Music.resume();
        else if (gameLocation === 6 && location6Music) location6Music.resume();
        else if (gameLocation === 7 && location7Music) location7Music.resume();
        else if (gameLocation === 8 && location8Music) location8Music.resume();
        else if (gameLocation === 9 && location9Music) location9Music.resume();
        else if (gameLocation === 10 && location10Music) location10Music.resume();
    }
}

function resetGameState() {
    if (fanEvent) { fanEvent.remove(); fanEvent = null; }
    if (orbEvent) { orbEvent.remove(); orbEvent = null; }
    if (missileEvent) { missileEvent.remove(); missileEvent = null; }
    if (mineEvent) { mineEvent.remove(); mineEvent = null; }
    if (defenderOrbEvent) { defenderOrbEvent.remove(); defenderOrbEvent = null; }
    if (shieldEvent) { shieldEvent.remove(); shieldEvent = null; }
    if (lightsaberEvent) { lightsaberEvent.remove(); lightsaberEvent = null; }
    if (plasmaOrbEvent) { plasmaOrbEvent.remove(); plasmaOrbEvent = null; }
    if (explosionEvent) { explosionEvent.remove(); explosionEvent = null; }

    killCount = 0;
    level = 1;
    playerLevel = 1;
    playerHealth = 10;
    maxHealth = 10;
    weaponLevels = { bullet: 1, fanBullet: 1, orbBullet: 1, missile: 1, mine: 1, defenderOrb: 1, shield: 1, lightsaber: 1, plasmaOrb: 1, explosion: 1 };

    switch (selectedCharacter) {
        case 1: unlockedWeapons = ['bullet']; break;
        case 2: unlockedWeapons = ['fanBullet']; break;
        case 3: unlockedWeapons = ['lightsaber']; break;
        case 4: unlockedWeapons = ['plasmaOrb']; break;
        case 5: unlockedWeapons = ['mine']; break;
        case 6: unlockedWeapons = ['defenderOrb']; break;
        case 7: unlockedWeapons = ['orbBullet']; break;
        case 8: unlockedWeapons = ['missile']; break;
        case 9: unlockedWeapons = ['explosion']; break;
    }

    resurrectionsAvailable = 1;
    // bossDefeated и crystalCount не сбрасываются, так как они сохраняются в localStorage
}

function returnToMenu() {
    resetGameState();

    if (isPaused) {
        isPaused = false;
        if (pauseText) pauseText.destroy();
        if (menuButtonText) menuButtonText.destroy();
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }
    if (gameOver) {
        if (gameOverText) gameOverText.destroy();
        if (gameOverMenuButton) gameOverMenuButton.destroy();
        if (resurrectButton) resurrectButton.destroy();
        if (this.gameOverOverlay) {
            this.gameOverOverlay.destroy();
            this.gameOverOverlay = null;
        }
    }

    this.physics.pause();
    if (location1Music) location1Music.stop();
    if (location2Music) location2Music.stop();
    if (location3Music) location3Music.stop();
    if (location4Music) location4Music.stop();
    if (location5Music) location5Music.stop();
    if (location6Music) location6Music.stop();
    if (location7Music) location7Music.stop();
    if (location8Music) location8Music.stop();
    if (location9Music) location9Music.stop();
    if (location10Music) location10Music.stop();

    if (fanEvent) { fanEvent.remove(); fanEvent = null; }
    if (orbEvent) { orbEvent.remove(); orbEvent = null; }
    if (missileEvent) { missileEvent.remove(); missileEvent = null; }
    if (mineEvent) { mineEvent.remove(); mineEvent = null; }
    if (defenderOrbEvent) { defenderOrbEvent.remove(); defenderOrbEvent = null; }
    if (shieldEvent) { shieldEvent.remove(); shieldEvent = null; }
    if (lightsaberEvent) { lightsaberEvent.remove(); lightsaberEvent = null; }
    if (plasmaOrbEvent) { plasmaOrbEvent.remove(); plasmaOrbEvent = null; }
    if (explosionEvent) { explosionEvent.remove(); explosionEvent = null; }

    if (hudBackground) {
        hudBackground.destroy();
        hudBackground = null;
    }
    if (scoreText) {
        scoreText.destroy();
        scoreText = null;
    }
    if (killText) {
        killText.destroy();
        killText = null;
    }
    if (healthText) {
        healthText.destroy();
        healthText = null;
    }
    if (crystalIcon) {
        console.log("Уничтожаем crystalIcon перед перезапуском сцены...");
        crystalIcon.destroy();
        crystalIcon = null;
    }
    if (crystalCountText) {
        console.log("Уничтожаем crystalCountText перед перезапуском сцены...");
        crystalCountText.destroy();
        crystalCountText = null;
    }
    if (part && part.active) {
        console.log("Уничтожаем деталь перед перезапуском сцены...");
        part.destroy();
        part = null;
    }

    if (enemies) enemies.clear(true, true);
    if (bullets) bullets.clear(true, true);
    if (fanBullets) fanBullets.clear(true, true);
    if (orbBullets) orbBullets.clear(true, true);
    if (missiles) missiles.clear(true, true);
    if (mines) mines.clear(true, true);
    if (defenderOrbs) defenderOrbs.clear(true, true);
    if (shields) shields.clear(true, true);
    if (lightsabers) lightsabers.clear(true, true);
    if (plasmaOrbs) plasmaOrbs.clear(true, true);
    if (explosionsGroup) explosionsGroup.clear(true, true);
    if (hearts) hearts.clear(true, true);
    if (crystals) crystals.clear(true, true);
    if (explosions) explosions.clear(true, true);
    if (parts) parts.clear(true, true);

    saveProgress();

    this.scene.restart();
    this.isTransitioning = false;
    showLocationMenu.call(this);
}

function togglePause() {
    if (!menuActive && !gameOver && levelUpOptions.length === 0) { // Добавляем проверку !gameOver
        isPaused = !isPaused;
        if (isPaused) {
            this.physics.pause();
            if (fanEvent) fanEvent.paused = true;
            if (orbEvent) orbEvent.paused = true;
            if (missileEvent) missileEvent.paused = true;
            if (mineEvent) mineEvent.paused = true;
            if (defenderOrbEvent) defenderOrbEvent.paused = true;
            if (shieldEvent) shieldEvent.paused = true;
            if (lightsaberEvent) lightsaberEvent.paused = true;
            if (plasmaOrbEvent) plasmaOrbEvent.paused = true;
            if (explosionEvent) explosionEvent.paused = true;

            if (gameLocation === 1 && location1Music) location1Music.pause();
            else if (gameLocation === 2 && location2Music) location2Music.pause();
            else if (gameLocation === 3 && location3Music) location3Music.pause();
            else if (gameLocation === 4 && location4Music) location4Music.pause();
            else if (gameLocation === 5 && location5Music) location5Music.pause();
            else if (gameLocation === 6 && location6Music) location6Music.pause();
            else if (gameLocation === 7 && location7Music) location7Music.pause();
            else if (gameLocation === 8 && location8Music) location8Music.pause();
            else if (gameLocation === 9 && location9Music) location9Music.pause();
            else if (gameLocation === 10 && location10Music) location10Music.pause();

            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;

            // Добавляем полупрозрачную подложку
            const pauseOverlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(99);

            pauseText = this.add.text(centerX, centerY - 20, 'PAUSE', {
                fontSize: '48px', color: '#fff'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

            menuButtonText = this.add.text(centerX, centerY + 20, 'TO MENU', {
                fontSize: '24px', color: '#fff', align: 'center'
            }).setOrigin(0.5).setDepth(100).setInteractive().setScrollFactor(0);

            menuButtonText.on('pointerdown', () => returnToMenu.call(this));

            // Сохраняем подложку, чтобы уничтожить её при возобновлении игры
            this.pauseOverlay = pauseOverlay;
        } else {
            this.physics.resume();
            if (fanEvent) fanEvent.paused = false;
            if (orbEvent) orbEvent.paused = false;
            if (missileEvent) missileEvent.paused = false;
            if (mineEvent) mineEvent.paused = false;
            if (defenderOrbEvent) defenderOrbEvent.paused = false;
            if (shieldEvent) shieldEvent.paused = false;
            if (lightsaberEvent) lightsaberEvent.paused = false;
            if (plasmaOrbEvent) plasmaOrbEvent.paused = false;
            if (explosionEvent) explosionEvent.paused = false;

            if (gameLocation === 1 && location1Music) location1Music.resume();
            else if (gameLocation === 2 && location2Music) location2Music.resume();
            else if (gameLocation === 3 && location3Music) location3Music.resume();
            else if (gameLocation === 4 && location4Music) location4Music.resume();
            else if (gameLocation === 5 && location5Music) location5Music.resume();
            else if (gameLocation === 6 && location6Music) location6Music.resume();
            else if (gameLocation === 7 && location7Music) location7Music.resume();
            else if (gameLocation === 8 && location8Music) location8Music.resume();
            else if (gameLocation === 9 && location9Music) location9Music.resume();
            else if (gameLocation === 10 && location10Music) location10Music.resume();

            if (pauseText) pauseText.destroy();
            if (menuButtonText) menuButtonText.destroy();
            if (controlText) controlText.destroy();
            if (this.pauseOverlay) {
                this.pauseOverlay.destroy();
                this.pauseOverlay = null;
            }
        }
    }
}

function setupCollisions() {
    this.physics.add.collider(player, enemies, hitPlayer, null, this);
    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(fanBullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(orbBullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(missiles, enemies, hitEnemy, null, this);
    this.physics.add.collider(mines, enemies, hitEnemy, null, this);
    this.physics.add.collider(defenderOrbs, enemies, hitEnemy, null, this);
    this.physics.add.collider(shields, enemies, shieldEnemyCollision, null, this);
    this.physics.add.collider(lightsabers, enemies, hitEnemy, null, this);
    this.physics.add.collider(plasmaOrbs, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, hearts, collectHeart, null, this);
    this.physics.add.overlap(player, crystals, collectCrystal, null, this);
    this.physics.add.overlap(player, parts, collectPart, null, this); // Используем группу parts
}

function shieldEnemyCollision(shield, enemy) {
    if (!menuActive && !isPaused && !gameOver && !enemy.isDead && levelUpOptions.length === 0) {
        // Щит просто блокирует врага, не нанося урон и не разрушаясь
        // Враг не может пройти через щит, но его характеристики не изменяются
        // Ничего не делаем с врагом и щитом, так как щит не должен разрушаться
    }
}

function showLevelUpMenu() {
    this.physics.pause();
    if (fanEvent) fanEvent.paused = true;
    if (orbEvent) orbEvent.paused = true;
    if (missileEvent) missileEvent.paused = true;
    if (mineEvent) mineEvent.paused = true;
    if (defenderOrbEvent) defenderOrbEvent.paused = true;
    if (shieldEvent) shieldEvent.paused = true;
    if (lightsaberEvent) lightsaberEvent.paused = true;
    if (plasmaOrbEvent) plasmaOrbEvent.paused = true;
    if (explosionEvent) explosionEvent.paused = true;
    if (location1Music) location1Music.pause();
    if (location2Music) location2Music.pause();
    if (location3Music) location3Music.pause();
    if (location4Music) location4Music.pause();
    if (location5Music) location5Music.pause();
    if (location6Music) location6Music.pause();
    if (location7Music) location7Music.pause();
    if (location8Music) location8Music.pause();
    if (location9Music) location9Music.pause();
    if (location10Music) location10Music.pause();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
    overlay.setOrigin(0.5);
    overlay.setDepth(200);
    overlay.setScrollFactor(0);
    levelUpMenuElements.push(overlay);

    const title = this.add.text(centerX, centerY - 120, 'Level Up!', { fontSize: '32px', color: '#00ff00', align: 'center' }).setOrigin(0.5).setDepth(201);
    title.setScrollFactor(0);
    levelUpMenuElements.push(title);

    levelUpOptions = [];
    const possibleOptions = [];

    unlockedWeapons.forEach(weapon => {
        let weaponName, icon, text;
        if (weapon === 'bullet') {
            weaponName = 'Laser Gun';
            icon = 'bullet';
            const speedUpgrade = (weaponLevels.bullet % 3 === 0) ? ", +20% speed" : "";
            text = `+1 DAMAGE${speedUpgrade}`;
        }
        else if (weapon === 'fanBullet') {
            weaponName = 'Fan Bullets';
            icon = 'fanBullet';
            text = '+1 DAMAGE, +1 projectile';
        }
        else if (weapon === 'orbBullet') {
            weaponName = 'Orbs';
            icon = 'orbBullet';
            text = '+1 DAMAGE, +1 orbit';
        }
        else if (weapon === 'missile') {
            weaponName = 'Homing Missiles';
            icon = 'missile';
            text = '+1 DAMAGE, +10% speed';
        }
        else if (weapon === 'mine') {
            weaponName = 'Mines';
            icon = 'mine';
            text = '+1 DAMAGE';
        }
        else if (weapon === 'defenderOrb') {
            weaponName = 'Defender Orbs';
            icon = 'defenderOrb';
            text = '+1 DAMAGE';
        }
        else if (weapon === 'shield') {
            weaponName = 'Shield';
            icon = 'shield';
            text = '+10% duration';
        }
        else if (weapon === 'lightsaber') {
            weaponName = 'Lightsaber';
            icon = 'lightsaber';
            text = '+1 DAMAGE';
        }
        else if (weapon === 'plasmaOrb') {
            weaponName = 'Plasma Orb';
            icon = 'plasmaOrb';
            text = '+1 DAMAGE';
        }
        else if (weapon === 'explosion') {
            weaponName = 'Explosions';
            icon = 'explosionIcon';
            text = '+1 DAMAGE';
        }
        possibleOptions.push({ type: 'upgradeWeapon', weapon: weapon, text: text, icon: icon });
    });

    const availableWeapons = ['bullet', 'fanBullet', 'orbBullet', 'missile', 'mine', 'defenderOrb', 'shield', 'lightsaber', 'plasmaOrb', 'explosion'].filter(weapon => !unlockedWeapons.includes(weapon));
    console.log('Available weapons:', availableWeapons);

    if (availableWeapons.length > 0) {
        const newWeapon = availableWeapons[Phaser.Math.Between(0, availableWeapons.length - 1)];
        let weaponName, icon;
        if (newWeapon === 'bullet') { weaponName = 'Laser Gun'; icon = 'bullet'; }
        else if (newWeapon === 'fanBullet') { weaponName = 'Fan Bullets'; icon = 'fanBullet'; }
        else if (newWeapon === 'orbBullet') { weaponName = 'Orbs'; icon = 'orbBullet'; }
        else if (newWeapon === 'missile') { weaponName = 'Homing Missiles'; icon = 'missile'; }
        else if (newWeapon === 'mine') { weaponName = 'Mines'; icon = 'mine'; }
        else if (newWeapon === 'defenderOrb') { weaponName = 'Defender Orbs'; icon = 'defenderOrb'; }
        else if (newWeapon === 'shield') { weaponName = 'Shield'; icon = 'shield'; }
        else if (newWeapon === 'lightsaber') { weaponName = 'Lightsaber'; icon = 'lightsaber'; }
        else if (newWeapon === 'plasmaOrb') { weaponName = 'Plasma Orb'; icon = 'plasmaOrb'; }
        else if (newWeapon === 'explosion') { weaponName = 'Explosions'; icon = 'explosionIcon'; }
        possibleOptions.push({ type: 'unlockWeapon', weapon: newWeapon, text: `Unlock ${weaponName}`, icon: icon });
    }

    possibleOptions.push({ type: 'increaseMaxHealth', text: 'Increase Max Health', icon: 'heart' });
    if (playerHealth < maxHealth) {
        possibleOptions.push({ type: 'heal', text: 'Heal (+2 HP)', icon: 'doubleHeart' });
    }

    if (possibleOptions.length > 2) {
        const option1Index = Phaser.Math.Between(0, possibleOptions.length - 1);
        levelUpOptions.push(possibleOptions[option1Index]);
        const remainingOptions = possibleOptions.filter((_, index) => index !== option1Index);
        const option2Index = Phaser.Math.Between(0, remainingOptions.length - 1);
        levelUpOptions.push(remainingOptions[option2Index]);
    } else {
        levelUpOptions = possibleOptions.slice(0, 2);
    }

    levelUpBorders = [];
    for (let i = 0; i < levelUpOptions.length; i++) {
        const option = levelUpOptions[i];
        const button = this.add.rectangle(centerX, centerY + i * 80 - 40, 500, 60, 0x555555);
        button.setOrigin(0.5);
        button.setDepth(201);
        button.setInteractive();
        button.setScrollFactor(0);
        levelUpMenuElements.push(button);

        const icon = this.add.image(centerX - 220, centerY + i * 80 - 40, option.icon)
            .setOrigin(0.5)
            .setDisplaySize(40, 40)
            .setDepth(202);
        icon.setScrollFactor(0);
        levelUpMenuElements.push(icon);

        const optionText = this.add.text(centerX, centerY + i * 80 - 40, option.text, { fontSize: '16px', color: '#ffffff', align: 'left' }).setOrigin(0.5).setDepth(202);
        optionText.setScrollFactor(0);
        levelUpMenuElements.push(optionText);

        const border = this.add.rectangle(centerX, centerY + i * 80 - 40, 500, 60, 0x00ff00, 0);
        border.setOrigin(0.5);
        border.setStrokeStyle(2, 0x00ff00, 0);
        border.setDepth(203);
        border.setScrollFactor(0);
        levelUpBorders.push(border);

        button.on('pointerdown', () => selectLevelUpOption.call(this, i));
    }

    const confirmButton = this.add.text(centerX, centerY + 100, 'Access', { fontSize: '24px', color: '#00ff00', align: 'center' }).setOrigin(0.5).setDepth(201).setInteractive();
    confirmButton.setScrollFactor(0);
    confirmButton.on('pointerdown', () => applyLevelUpChoice.call(this));
    levelUpMenuElements.push(confirmButton);
}
function selectLevelUpOption(index) {
    selectedOption = index;
    levelUpBorders.forEach((border, i) => {
        border.setStrokeStyle(2, 0x00ff00, i === index ? 1 : 0);
    });
}

function applyLevelUpChoice() {
    if (selectedOption === null) return;

    const choice = levelUpOptions[selectedOption];
    if (choice.type === 'upgradeWeapon') {
        weaponLevels[choice.weapon]++;
        console.log(`Upgraded ${choice.weapon} to level ${weaponLevels[choice.weapon]}`);
        
        // Сохраняем оставшееся время жизни щита, если он существует
        let remainingShieldTime = null;
        if (shields && typeof shields.getChildren === 'function') {
            const activeShields = shields.getChildren().filter(shield => shield.active);
            if (activeShields.length > 0) {
                const shield = activeShields[0];
                if (shield.destroyTimer) {
                    remainingShieldTime = shield.destroyTimer.delay - shield.destroyTimer.elapsed;
                }
            }
        }

        if (choice.weapon === 'bullet') {
            this.time.removeAllEvents();
            let bulletDelay = 500; // Начальная задержка
            const reductionSteps = Math.floor((weaponLevels.bullet - 1) / 3);
            bulletDelay *= Math.pow(0.8, reductionSteps);
            bulletDelay = Math.max(bulletDelay, 100);
            this.time.addEvent({ delay: bulletDelay, callback: shootBullet, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('fanBullet') && fanEvent) {
            fanEvent = this.time.addEvent({ delay: 2000, callback: shootFanBullets, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('orbBullet') && orbEvent) {
            orbEvent = this.time.addEvent({ delay: 1500, callback: shootOrbBullets, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('missile') && missileEvent) {
            missileEvent = this.time.addEvent({ delay: 1000, callback: shootMissile, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('mine') && mineEvent) {
            mineEvent = this.time.addEvent({ delay: 1000, callback: dropMine, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('defenderOrb') && defenderOrbEvent) {
            defenderOrbEvent = this.time.addEvent({ delay: 2000, callback: spawnDefenderOrb, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('shield') && shieldEvent) {
            shieldEvent = this.time.addEvent({ delay: 4000, callback: spawnShield, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('lightsaber') && lightsaberEvent) {
            lightsaberEvent = this.time.addEvent({ delay: 1500, callback: spawnLightsaber, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('plasmaOrb') && plasmaOrbEvent) {
            plasmaOrbEvent = this.time.addEvent({ delay: 1500, callback: shootPlasmaOrb, callbackScope: this, loop: true });
        }
        if (unlockedWeapons.includes('explosion') && explosionEvent) {
            explosionEvent = this.time.addEvent({ delay: 1000, callback: triggerExplosions, callbackScope: this, loop: true });
        }
        // Восстанавливаем таймер спавна врагов
        enemySpawnEvent = this.time.addEvent({ delay: enemySpawnDelay, callback: spawnEnemy, callbackScope: this, loop: true });

        // Восстанавливаем таймер уничтожения щита, если он был
        if (remainingShieldTime !== null && shields && typeof shields.getChildren === 'function') {
            const activeShields = shields.getChildren().filter(shield => shield.active);
            if (activeShields.length > 0) {
                const shield = activeShields[0];
                shield.destroyTimer = this.time.delayedCall(remainingShieldTime, () => {
                    if (shield && shield.active) {
                        console.log('Щит уничтожен');
                        shield.setActive(false);
                        shield.setVisible(false);
                        shield.destroy();
                    }
                }, [], this);
            }
        }
    } else if (choice.type === 'unlockWeapon') {
        unlockedWeapons.push(choice.weapon);
        console.log(`Unlocked ${choice.weapon}`);
        if (choice.weapon === 'bullet') {
            let bulletDelay = 500;
            const reductionSteps = Math.floor((weaponLevels.bullet - 1) / 3);
            bulletDelay *= Math.pow(0.8, reductionSteps);
            bulletDelay = Math.max(bulletDelay, 100);
            this.time.addEvent({ delay: bulletDelay, callback: shootBullet, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'fanBullet') {
            fanEvent = this.time.addEvent({ delay: 2000, callback: shootFanBullets, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'orbBullet') {
            orbEvent = this.time.addEvent({ delay: 1500, callback: shootOrbBullets, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'missile') {
            missileEvent = this.time.addEvent({ delay: 1000, callback: shootMissile, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'mine') {
            mineEvent = this.time.addEvent({ delay: 1000, callback: dropMine, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'defenderOrb') {
            defenderOrbEvent = this.time.addEvent({ delay: 2000, callback: spawnDefenderOrb, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'shield') {
            shieldEvent = this.time.addEvent({ delay: 4000, callback: spawnShield, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'lightsaber') {
            lightsaberEvent = this.time.addEvent({ delay: 1500, callback: spawnLightsaber, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'plasmaOrb') {
            plasmaOrbEvent = this.time.addEvent({ delay: 1500, callback: shootPlasmaOrb, callbackScope: this, loop: true });
        }
        if (choice.weapon === 'explosion') {
            explosionEvent = this.time.addEvent({ delay: 1000, callback: triggerExplosions, callbackScope: this, loop: true });
        }
    } else if (choice.type === 'increaseMaxHealth') {
        maxHealth += 1; // Увеличиваем максимальное здоровье на 1
        // playerHealth не изменяем
        healthText.setText(`${playerHealth}/${maxHealth}`);
        console.log('Increased max health');
    } else if (choice.type === 'heal') {
        playerHealth = Math.min(playerHealth + 2, maxHealth);
        healthText.setText(`${playerHealth}/${maxHealth}`);
        console.log('Healed');
    }

    levelUpOptions = [];
    levelUpMenuElements.forEach(element => element.destroy());
    levelUpMenuElements = [];
    levelUpBorders.forEach(border => border.destroy());
    levelUpBorders = [];
    selectedOption = null;

    this.physics.resume();
    if (fanEvent) fanEvent.paused = false;
    if (orbEvent) orbEvent.paused = false;
    if (missileEvent) missileEvent.paused = false;
    if (mineEvent) mineEvent.paused = false;
    if (defenderOrbEvent) defenderOrbEvent.paused = false;
    if (shieldEvent) shieldEvent.paused = false;
    if (lightsaberEvent) lightsaberEvent.paused = false;
    if (plasmaOrbEvent) plasmaOrbEvent.paused = false;
    if (explosionEvent) explosionEvent.paused = false;

    if (gameLocation === 1 && location1Music) location1Music.resume();
    else if (gameLocation === 2 && location2Music) location2Music.resume();
    else if (gameLocation === 3 && location3Music) location3Music.resume();
    else if (gameLocation === 4 && location4Music) location4Music.resume();
    else if (gameLocation === 5 && location5Music) location5Music.resume();
    else if (gameLocation === 6 && location6Music) location6Music.resume();
    else if (gameLocation === 7 && location7Music) location7Music.resume();
    else if (gameLocation === 8 && location8Music) location8Music.resume();
    else if (gameLocation === 9 && location9Music) location9Music.resume();
    else if (gameLocation === 10 && location10Music) location10Music.resume();
}


function update() {
    if (!menuActive && !isPaused && !gameOver) {
        if (levelUpOptions.length === 0) {
            if (player && player.body) {
                player.body.setVelocity(0);

                // Управление с клавиатуры (WASD или стрелки)
                let velocityX = 0;
                let velocityY = 0;
                if (cursors && cursors.left && (cursors.left.isDown || wasd.left.isDown)) velocityX -= 200;
                if (cursors && cursors.right && (cursors.right.isDown || wasd.right.isDown)) velocityX += 200;
                if (cursors && cursors.up && (cursors.up.isDown || wasd.up.isDown)) velocityY -= 200;
                if (cursors && cursors.down && (cursors.down.isDown || wasd.down.isDown)) velocityY += 200;

                // Управление с джойстика
                if (joystick) {
                    const speed = 200; // Скорость движения игрока
                    const force = joystick.force; // Сила нажатия на джойстик
                    const angle = joystick.angle; // Угол наклона джойстика

                    if (force > 0) { // Если джойстик активен
                        velocityX = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
                        velocityY = Math.sin(Phaser.Math.DegToRad(angle)) * speed;
                    }
                }

                // Применяем скорость
                player.body.setVelocityX(velocityX);
                player.body.setVelocityY(velocityY);

                // Обновляем последнее направление движения, если игрок движется
                if (velocityX !== 0 || velocityY !== 0) {
                    lastMovementDirection = Phaser.Math.Angle.Between(0, 0, velocityX, velocityY);
                }

                // Проверяем, активна ли мышь
                const pointer = this.input.activePointer;
                let angle;
                const isMouseActive = pointer.isDown || (pointer.x !== pointer.lastX || pointer.y !== pointer.lastY);

                if (isMouseActive) {
                    // Если мышь активна, поворачиваем игрока в сторону курсора
                    angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.x + this.cameras.main.scrollX, pointer.y + this.cameras.main.scrollY);
                } else {
                    // Если мышь не активна, используем последнее направление движения
                    angle = lastMovementDirection;
                }

                // Поворот игрока
                if (angle > -Math.PI / 2 && angle < Math.PI / 2) {
                    player.setFlipX(false);
                    player.setRotation(angle);
                    playerDirection = 'right';
                } else {
                    player.setFlipX(true);
                    player.setRotation(Math.PI - angle);
                    playerDirection = 'left';
                }
            }

            if (missiles && typeof missiles.getChildren === 'function') {
                missiles.getChildren().forEach(missile => {
                    if (missile && missile.active) {
                        const enemiesList = enemies && typeof enemies.getChildren === 'function' ? enemies.getChildren().filter(enemy => !enemy.isDead) : [];
                        if (enemiesList.length > 0) {
                            let closestEnemy = enemiesList[0];
                            let minDistance = Phaser.Math.Distance.Between(missile.x, missile.y, closestEnemy.x, closestEnemy.y);
                            enemiesList.forEach(enemy => {
                                const distance = Phaser.Math.Distance.Between(missile.x, missile.y, enemy.x, enemy.y);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestEnemy = enemy;
                                }
                            });

                            const angle = Phaser.Math.Angle.Between(missile.x, missile.y, closestEnemy.x, closestEnemy.y);
                            missile.setRotation(angle);
                            this.physics.velocityFromRotation(angle, missile.speed, missile.body.velocity);
                        } else {
                            this.physics.velocityFromRotation(missile.rotation, missile.speed, missile.body.velocity);
                        }
                    }
                });
            } else {
                console.warn("Группа missiles не определена или не является группой Phaser!");
            }

            if (defenderOrbs && typeof defenderOrbs.getChildren === 'function') {
                defenderOrbs.getChildren().forEach(orb => {
                    if (orb && orb.active) {
                        const timeAlive = this.time.now - orb.spawnTime;
                        const angle = (timeAlive / 1000) * 2 * Math.PI;
                        const radius = 50;
                        orb.x = player.x + Math.cos(angle) * radius;
                        orb.y = player.y + Math.sin(angle) * radius;
                        if (timeAlive >= 2000) orb.destroy();
                    }
                });
            }

            if (shields && typeof shields.getChildren === 'function') {
                shields.getChildren().forEach(shield => {
                    if (shield && shield.active) {
                        shield.x = player.x;
                        shield.y = player.y;
                    }
                });
            }

            if (rescueShields && typeof rescueShields.getChildren === 'function') {
                rescueShields.getChildren().forEach(shield => {
                    if (shield && shield.active) {
                        shield.x = player.x;
                        shield.y = player.y;
                    }
                });
            }

            const camera = this.cameras.main;
            if (bullets && typeof bullets.getChildren === 'function') {
                bullets.getChildren().forEach(bullet => {
                    if (bullet && bullet.active && (bullet.x < camera.scrollX || bullet.x > camera.scrollX + 800 || bullet.y < camera.scrollY || bullet.y > camera.scrollY + 600)) {
                        bullet.destroy();
                    }
                });
            }
            if (fanBullets && typeof fanBullets.getChildren === 'function') {
                fanBullets.getChildren().forEach(bullet => {
                    if (bullet && bullet.active && (bullet.x < camera.scrollX || bullet.x > camera.scrollX + 800 || bullet.y < camera.scrollY || bullet.y > camera.scrollY + 600)) {
                        bullet.destroy();
                    }
                });
            }
            if (orbBullets && typeof orbBullets.getChildren === 'function') {
                orbBullets.getChildren().forEach(bullet => {
                    if (bullet && bullet.active && (bullet.x < camera.scrollX || bullet.x > camera.scrollX + 800 || bullet.y < camera.scrollY || bullet.y > camera.scrollY + 600)) {
                        bullet.destroy();
                    }
                });
            }
            if (missiles && typeof missiles.getChildren === 'function') {
                missiles.getChildren().forEach(missile => {
                    if (missile && missile.active && (missile.x < camera.scrollX || missile.x > camera.scrollX + 800 || missile.y < camera.scrollY || missile.y > camera.scrollY + 600)) {
                        missile.destroy();
                    }
                });
            }
            if (mines && typeof mines.getChildren === 'function') {
                mines.getChildren().forEach(mine => {
                    if (mine && mine.active && (mine.x < camera.scrollX || mine.x > camera.scrollX + 800 || mine.y < camera.scrollY || mine.y > camera.scrollY + 600)) {
                        mine.destroy();
                    }
                });
            }

            if (enemies && typeof enemies.getChildren === 'function') {
                enemies.getChildren().forEach(enemy => {
                    if (!enemy.isDead) {
                        const enemyAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
                        const speed = enemy.isBoss ? (gameLocation === 1 ? 100 : gameLocation === 2 ? 100 : gameLocation === 3 ? 110 : gameLocation === 4 ? 130 : gameLocation === 5 ? 140 : gameLocation === 6 ? 150 : gameLocation === 7 ? 160 : gameLocation === 8 ? 170 : gameLocation === 9 ? 180 : 190) : getEnemySpeed(enemy.type);
                        this.physics.velocityFromRotation(enemyAngle, speed, enemy.body.velocity);
                    }
                });
            }

            if (explosionsGroup && typeof explosionsGroup.getChildren === 'function') {
                const explosions = explosionsGroup.getChildren();
                const activeEnemies = enemies && typeof enemies.getChildren === 'function' ? enemies.getChildren().filter(enemy => !enemy.isDead) : [];
                explosions.forEach(explosion => {
                    if (explosion && explosion.active) {
                        explosion.lifetime -= this.game.loop.delta;
                        if (explosion.lifetime <= 0) {
                            explosion.destroy();
                            return;
                        }
                        activeEnemies.forEach(enemy => {
                            if (Phaser.Geom.Intersects.RectangleToRectangle(explosion.getBounds(), enemy.getBounds())) {
                                hitEnemy(explosion, enemy);
                            }
                        });
                    }
                });
            }
        }

        // Перезапуск таймеров должен происходить независимо от состояния меню прокачки
        if (this.time.now % 10000 < 100 && enemySpawnDelay > 500) {
            enemySpawnDelay -= 100;

            // Сохраняем оставшееся время жизни щита, если он существует
            let remainingShieldTime = null;
            if (shields && typeof shields.getChildren === 'function') {
                const activeShields = shields.getChildren().filter(shield => shield.active);
                if (activeShields.length > 0) {
                    const shield = activeShields[0];
                    if (shield.destroyTimer) {
                        remainingShieldTime = shield.destroyTimer.delay - shield.destroyTimer.elapsed;
                    }
                }
            }

            this.time.removeAllEvents();
            if (unlockedWeapons.includes('bullet')) {
                let bulletDelay = 500; // Начальная задержка
                const reductionSteps = Math.floor((weaponLevels.bullet - 1) / 3); // Каждые 3 уровня оружия уменьшаем задержку
                bulletDelay *= Math.pow(0.8, reductionSteps); // Уменьшаем задержку на 20% каждые 3 уровня
                bulletDelay = Math.max(bulletDelay, 100); // Минимальная задержка 100 мс
                this.time.addEvent({ delay: bulletDelay, callback: shootBullet, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('fanBullet') && fanEvent) {
                fanEvent = this.time.addEvent({ delay: 2000, callback: shootFanBullets, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('orbBullet') && orbEvent) {
                orbEvent = this.time.addEvent({ delay: 1500, callback: shootOrbBullets, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('missile') && missileEvent) {
                missileEvent = this.time.addEvent({ delay: 1000, callback: shootMissile, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('mine') && mineEvent) {
                mineEvent = this.time.addEvent({ delay: 1000, callback: dropMine, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('defenderOrb') && defenderOrbEvent) {
                defenderOrbEvent = this.time.addEvent({ delay: 2000, callback: spawnDefenderOrb, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('shield') && shieldEvent) {
                shieldEvent = this.time.addEvent({ delay: 4000, callback: spawnShield, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('lightsaber') && lightsaberEvent) {
                lightsaberEvent = this.time.addEvent({ delay: 1500, callback: spawnLightsaber, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('plasmaOrb') && plasmaOrbEvent) {
                plasmaOrbEvent = this.time.addEvent({ delay: 1500, callback: shootPlasmaOrb, callbackScope: this, loop: true });
            }
            if (unlockedWeapons.includes('explosion') && explosionEvent) {
                explosionEvent = this.time.addEvent({ delay: 1000, callback: triggerExplosions, callbackScope: this, loop: true });
            }
            // Восстанавливаем таймер спавна врагов
            enemySpawnEvent = this.time.addEvent({ delay: enemySpawnDelay, callback: spawnEnemy, callbackScope: this, loop: true });

            // Восстанавливаем таймер уничтожения щита, если он был
            if (remainingShieldTime !== null && shields && typeof shields.getChildren === 'function') {
                const activeShields = shields.getChildren().filter(shield => shield.active);
                if (activeShields.length > 0) {
                    const shield = activeShields[0];
                    shield.destroyTimer = this.time.delayedCall(remainingShieldTime, () => {
                        if (shield && shield.active) {
                            console.log('Щит уничтожен');
                            shield.setActive(false);
                            shield.setVisible(false);
                            shield.destroy();
                        }
                    }, [], this);
                }
            }
        }

        // Массив с общим количеством убийств для каждого уровня (до уровня 20)
        const levelUpKills = [0, 10, 20, 35, 50, 70, 90, 115, 140, 170, 200, 235, 270, 310, 350, 395, 440, 490, 540, 595, 655];
        // Проверяем, достиг ли игрок необходимого количества убийств для следующего уровня
        if (playerLevel < levelUpKills.length && killCount >= levelUpKills[playerLevel]) {
            playerLevel++;
            scoreText.setText(`Score: ${killCount * 10}`); // Обновляем только счёт
            levelText.setText(`Level: ${playerLevel}`); // Обновляем уровень
            showLevelUpMenu.call(this);
        }

        if (!hasBossSpawned && enemies && typeof enemies.getChildren === 'function' && !enemies.getChildren().some(enemy => enemy.isBoss)) {
            if (gameLocation === 1 && killCount >= 120) {
                spawnBoss.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 2 && killCount >= 210) {
                spawnBoss2.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 3 && killCount >= 210) {
                spawnBoss3.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 4 && killCount >= 210) {
                spawnBoss4.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 5 && killCount >= 210) {
                spawnBoss5.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 6 && killCount >= 240) {
                spawnBoss6.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 7 && killCount >= 240) {
                spawnBoss7.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 8 && killCount >= 270) {
                spawnBoss8.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 9 && killCount >= 240) {
                spawnBoss9.call(this);
                hasBossSpawned = true;
            } else if (gameLocation === 10 && killCount >= 240) {
                spawnBoss10.call(this);
                hasBossSpawned = true;
            }
        }
    }
}