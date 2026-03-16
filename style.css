@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

body {
    margin: 0;
    padding: 0;
    background-color: #1a1a1a;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    font-family: 'Press Start 2P', cursive;
}

#game-container {
    position: relative;
    border: 4px solid #444;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

/* CRT Scanline Effect */
#game-container::after {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    z-index: 2;
    background-size: 100% 4px, 3px 100%;
    pointer-events: none;
}

canvas {
    background: #333; /* Fallback */
    display: block;
    image-rendering: pixelated; /* Keeps sprites crisp */
}

#hud {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    z-index: 10;
    color: white;
    pointer-events: none;
}

#char-name {
    font-size: 18px;
    margin: 0 0 5px 0;
    text-shadow: 2px 2px #ff0055;
}

.health-bar-container {
    width: 250px;
    height: 15px;
    background: #444;
    border: 2px solid #fff;
}

.health-bar {
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #fde428, #f5a623);
}

.controls-hint {
    position: absolute;
    bottom: -430px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: #aaa;
    white-space: nowrap;
}
