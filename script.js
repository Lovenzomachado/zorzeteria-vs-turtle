const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

const spritesPath = 'sprites/'; 
// --- ALTERAÇÃO AQUI: Extensões mudadas para .png ---
const spriteFiles = {
    idle: 'idle.png',
    stance: 'stance.png',
    punch: 'punch.png',
    kick: 'kick.png',
    jump: 'jump.png'
};
// ----------------------------------------------------

const images = {};
let imagesLoaded = 0;
const totalImages = Object.keys(spriteFiles).length;

for (let key in spriteFiles) {
    images[key] = new Image();
    images[key].src = spritesPath + spriteFiles[key];
    
    images[key].onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            requestAnimationFrame(gameLoop);
        }
    };

    // Adicionei um log de erro para ajudar a diagnosticar se algo ainda estiver errado
    images[key].onerror = () => {
        console.error(`Erro ao carregar imagem: ${spritesPath}${spriteFiles[key]}. Verifique se o arquivo existe e o nome está correto.`);
    };
}

const player = {
    x: canvas.width / 2 - 100,
    y: canvas.height - 350,
    width: 200,
    height: 250,
    state: 'idle',
    velocityY: 0,
    isGrounded: true,
    gravity: 0.8,
    jumpForce: -15,
    actionTimer: 0
};

const keys = {};

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function update() {
    if (player.isGrounded && player.actionTimer <= 0) player.state = 'idle';

    if (player.actionTimer > 0) {
        player.actionTimer--;
    } else {
        if (keys['Space'] && player.isGrounded) {
            player.state = 'jump';
            player.velocityY = player.jumpForce;
            player.isGrounded = false;
        } else if (keys['KeyJ']) {
            player.state = 'punch';
            player.actionTimer = 15;
        } else if (keys['KeyK']) {
            player.state = 'kick';
            player.actionTimer = 20;
        } else if (keys['KeyS']) {
            player.state = 'stance';
        }
    }

    if (!player.isGrounded) {
        player.y += player.velocityY;
        player.velocityY += player.gravity;
        if (player.y >= canvas.height - 350) {
            player.y = canvas.height - 350;
            player.isGrounded = true;
            player.velocityY = 0;
        }
    }
}

function draw() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    const currentImg = images[player.state];
    if (currentImg && currentImg.complete) {
        ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
