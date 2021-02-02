function makeRanking(container = null, ranking = null) {
    if (container === null) {
        container = document.querySelector('#ranking table tbody');
    }
    const make = (rankingArray) => {
        container.innerHTML = rankingArray.reduce((acc, { nick, record }) => `${acc}${getRankingElement(nick, record)}`, '');
    };
    ranking === null ? loadRanking().then(make) : make(ranking);
}

function loadRanking() {
    if (!'fetch' in window) {
        return;
    }
    return fetch('http://api-meu-primeiro-jogo.cluxnei.com').then(res => res.json());
}

function enviarPontos(record = 0) {
    if (!'fetch' in window) {
        return;
    }
    const nick = getNick();
    const body = new FormData();
    body.append('nick', nick);
    body.append('record', record);
    return fetch('http://api-meu-primeiro-jogo.cluxnei.com/add.php', { method: 'POST', body }).then((res) => res.json())
        .then(({ ok, message }) => {
            if (!ok) {
                alert(message);
                window.location.reload();
                return;
            }
        });
}

function getRankingElement(nick, record) {
    return `<tr><td>${nick}</td><td>${record}</td></tr>`;
}

function storeNick() {
    localStorage.setItem('@nick', document.getElementById('inicio').value.substring(0, 30));
    return true;
}

function getNick() {
    return localStorage.getItem('@nick');
}

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
    function startGame() {
        if (document.getElementById('inicio').value.substring(0, 30).trim() !== '') {
            storeNick();
            start();
            document.getElementById('start-game').removeEventListener('click', startGame, false);
        }
        return;
    }
    document.getElementById('start-game').addEventListener('click', startGame, false);
    const start = () => {
        if (!iniciado) {
            iniciar(ctx, ufo, asteroid, asteroid2, asteroid3, asteroid4, astronaut, bg, gameOver, spaceGun, blackHole, blackHole2, alien, planet);
        }
        iniciado = true;
        document.getElementById('menu').style.display = 'none';
        document.getElementById('jogo').style.display = '';
        enviarPontos().then(() => makeRanking());
    };
    const n = getNick();
    if (n) {
        document.getElementById('inicio').value = n;
    }
});