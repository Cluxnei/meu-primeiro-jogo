window.addEventListener('load', () => {
    const tela = document.getElementById('tela');
    const ctx = tela.getContext('2d');
    function setarTamanhoTela() {
        TELA_LARGURA = window.innerWidth - 5;
        TELA_ALTURA = window.innerHeight - 5;
        const menorTamanho = TELA_LARGURA < TELA_ALTURA ? TELA_LARGURA : TELA_ALTURA;
        tela.width = menorTamanho;
        tela.height = menorTamanho;
        TELA_LARGURA = menorTamanho;
        TELA_ALTURA = menorTamanho;
        RATIO = TELA_LARGURA / TELA_ALTURA;
    }
    window.addEventListener('resize', setarTamanhoTela);
    setarTamanhoTela();
    const ufo = document.getElementById('ufo');
    const asteroid = document.getElementById('asteroid');
    const asteroid2 = document.getElementById('asteroid2');
    const asteroid3 = document.getElementById('asteroid3');
    const asteroid4 = document.getElementById('asteroid4');
    const astronaut = document.getElementById('astronaut');
    const gameOver = document.getElementById('game-over');
    const bg = document.getElementById('bg');
    const spaceGun = document.getElementById('space-gun');
    const blackHole = document.getElementById('black-hole');
    const blackHole2 = document.getElementById('black-hole-2');
    const playPause = document.getElementById('play-pause');
    const sound = document.getElementById('sound');
    const alien = document.getElementById('alien');
    const planet = document.getElementById('planet');
    playPause.addEventListener('click', () => {
        if (pausado) {
            pausado = false;
            const i = playPause.children[0];
            i.classList.remove('fa-play');
            i.classList.add('fa-pause');
            return;
        }
        pausado = true;
        const i = playPause.children[0];
        i.classList.remove('fa-pause');
        i.classList.add('fa-play');
    });
    sound.addEventListener('click', () => {
        if (SOM_ATIVADO) {
            SOM_ATIVADO = false;
            const i = sound.children[0];
            i.classList.remove('fa-volume-mute');
            i.classList.add('fa-volume-up');
            return;
        }
        SOM_ATIVADO = true;
        const i = sound.children[0];
        i.classList.remove('fa-volume-up');
        i.classList.add('fa-volume-mute');
    });
    let iniciado = false;
    const start = () => {
        if (!iniciado) {
            iniciar(ctx, ufo, asteroid, asteroid2, asteroid3, asteroid4, astronaut, bg, gameOver, spaceGun, blackHole, blackHole2, alien, planet);
        }
        iniciado = true;
        document.getElementById('inicio').style.display = 'none';
        window.removeEventListener('click', start, false);
        document.removeEventListener('keypress', start, false);
    };
    window.addEventListener('click', start, false);
    document.addEventListener('keypress', start, false);
});