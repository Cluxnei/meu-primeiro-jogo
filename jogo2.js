/*
    *********------*********
    --------- GLOBAIS ------
    *********------*********
*/
let TELA_LARGURA, TELA_ALTURA, RATIO;

function ajustarTamanhoDeTela() {
    TELA_LARGURA = window.innerWidth;
    TELA_ALTURA = window.innerHeight;
    RATIO = TELA_LARGURA / TELA_ALTURA;
}

const TECLAS = new Set();
const TECLAS_VALIDAS = new Set(['w', 'a', 's', 'd']);
const TECLAS_OPOSTAS = { w: 's', s: 'w', d: 'a', a: 'd' };
const TIPOS_DE_OBSTACULOS = {
    de: 'direita_para_esquerda',
    ed: 'esquerda_para_direita',
    cb: 'cima_para_baixo',
    bc: 'baixo_para_cima',
};

const INTERVALO_DE_GERACAO_DE_OBSTACULOS = 500;
const MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = true;

let OBSTACULOS = [];
let vivo = true;

function iniciar(tela, ufo, asteroid, asteroid2) {

    ajustarTamanhoDeTela();

    /*
        *********------*********
        ------- VARIAVEIS ------
        *********------*********
    */

    const asteroids = [asteroid, asteroid2];
    const PASSO_EM_PIXELS = 3 * RATIO;
    const MAXIMOS = {
        obstaculos: {
            quantidade: 60,
            raio: 10,
            passo: {
                max: PASSO_EM_PIXELS / 1.5,
                min: PASSO_EM_PIXELS / 3,
            }
        }
    }
    const NAVE = {
        x: TELA_LARGURA / 2,
        y: TELA_ALTURA / 2,
        cor: 'red',
        raio: 15 * RATIO,
    };
    NAVE.y = NAVE.y - NAVE.raio / 2;
    NAVE.x = NAVE.x - NAVE.raio / 2;

    const RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES = NAVE.raio * 10;

    /*
        *********------*********
        ---- ATUALIZAÇÃO -------
        *********------*********
    */

    function criarObstaculoAleatorio(tipo) {
        let x = 0, y = 0, cor = 'red';
        const direcao = obterPossiveisDirecoesObstaculo(tipo);
        const raio = MAXIMOS.obstaculos.raio * RATIO;
        const img = asteroids[Math.floor(Math.random() * asteroids.length)];
        const passo = Math.random() * (
            MAXIMOS.obstaculos.passo.max - MAXIMOS.obstaculos.passo.min
        ) + MAXIMOS.obstaculos.passo.min;
        if (tipo === TIPOS_DE_OBSTACULOS.de) {
            x = TELA_LARGURA + raio;
            y = Math.random() * (TELA_ALTURA + raio);
            cor = 'darkorange';
        }
        if (tipo === TIPOS_DE_OBSTACULOS.ed) {
            x = -raio;
            y = Math.random() * (TELA_ALTURA + raio);
            cor = 'blue';
        }
        if (tipo === TIPOS_DE_OBSTACULOS.cb) {
            x = Math.random() * (TELA_LARGURA + raio);
            y = -raio;
            cor = 'yellow';
        }
        if (tipo === TIPOS_DE_OBSTACULOS.bc) {
            x = Math.random() * (TELA_LARGURA + raio);
            y = TELA_ALTURA + raio;
            cor = 'green';
        }
        return { x, y, raio, cor, tipo, direcao, passo, img };
    }

    function gerarNovosObstaculos() {
        if (OBSTACULOS.length > MAXIMOS.obstaculos.quantidade) {
            return;
        }
        const tipos = Object.keys(TIPOS_DE_OBSTACULOS);
        const tipo = TIPOS_DE_OBSTACULOS[tipos[Math.floor(Math.random() * tipos.length)]];
        OBSTACULOS.push(criarObstaculoAleatorio(tipo));
    }

    function apagarObstaculosSobresalentes() {
        OBSTACULOS = OBSTACULOS.filter(({ x, y, raio }) => !(
            (x < 0 && x < x + raio * 2)
            || (x > 0 && x > TELA_LARGURA + raio * 2)
            || (y < 0 && y < y + raio * 2)
            || (y > 0 && y > TELA_ALTURA + raio * 2)
        ));
    }

    function loop() {
        vivo ? requestAnimationFrame(loop) : fimDeJogo();
        limparTela();
        if (MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES) {
            renderizarAreaDeEscaneamentoDeColisoes();
        }
        renderizarNave();
        renderizarObstaculos();
        moverNave();
        moverObstaculos();
        if (colidindo()) {
            vivo = false;
        }
    }

    function gerarObstaculos() {
        apagarObstaculosSobresalentes();
        gerarNovosObstaculos();
        setTimeout(gerarObstaculos, Math.floor(Math.random() * INTERVALO_DE_GERACAO_DE_OBSTACULOS));
    }

    function distanciaEntreDoisPontos({ x: x1, y: y1 }, { x: x2, y: y2 }) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function colidindo() {
        const AREA_DE_ESCANEAMENTO_DE_COLISOES = {
            xMin: NAVE.x - RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            xMax: NAVE.x + RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            yMin: NAVE.y - RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            yMax: NAVE.y + RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
        };
        for (let i = 0; i < OBSTACULOS.length; i++) {
            if (
                OBSTACULOS[i].x >= AREA_DE_ESCANEAMENTO_DE_COLISOES.xMin
                && OBSTACULOS[i].x <= AREA_DE_ESCANEAMENTO_DE_COLISOES.xMax
                && OBSTACULOS[i].y >= AREA_DE_ESCANEAMENTO_DE_COLISOES.yMin
                && OBSTACULOS[i].y <= AREA_DE_ESCANEAMENTO_DE_COLISOES.yMax
            ) {
                if (MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES) {
                    renderizarLinhaParaNave(OBSTACULOS[i]);
                }
                const distancia = distanciaEntreDoisPontos(OBSTACULOS[i], NAVE);
                if (distancia < NAVE.raio + OBSTACULOS[i].raio) {
                    return true;
                }
            }
        }
        return false;
    }

    function fimDeJogo() {
        tela.fillStyle = 'red';
        tela.fillRect(0, 0, TELA_LARGURA, TELA_LARGURA);
    }

    /*
        *********------*********
        ---- MOVIMENTACAO ------
        *********------*********
    */

    function moverNave() {
        const teclas = [...TECLAS];
        for (let i = 0; i < teclas.length; i++) {
            if (teclas[i] === 'w' && NAVE.y - PASSO_EM_PIXELS - NAVE.raio > 0) {
                NAVE.y -= PASSO_EM_PIXELS;
            }
            if (teclas[i] === 's' && NAVE.y + PASSO_EM_PIXELS < TELA_ALTURA - NAVE.raio) {
                NAVE.y += PASSO_EM_PIXELS;
            }
            if (teclas[i] === 'a' && NAVE.x - PASSO_EM_PIXELS - NAVE.raio > 0) {
                NAVE.x -= PASSO_EM_PIXELS;
            }
            if (teclas[i] === 'd' && NAVE.x + PASSO_EM_PIXELS < TELA_LARGURA - NAVE.raio) {
                NAVE.x += PASSO_EM_PIXELS;
            }
        }
    }

    function obterPossiveisDirecoesObstaculo(tipo) {
        let direcoes = [];
        if (tipo === TIPOS_DE_OBSTACULOS.de) {
            direcoes = [['a'], ['a', 's'], ['w', 'a'], ['a', 'w', 's']];
        }
        if (tipo === TIPOS_DE_OBSTACULOS.ed) {
            direcoes = [['d'], ['d', 'w'], ['d', 's'], ['d', 'w', 's']];
        }
        if (tipo === TIPOS_DE_OBSTACULOS.cb) {
            direcoes = [['s'], ['s', 'a'], ['s', 'd'], ['s', 'a', 'd']];
        }
        if (tipo === TIPOS_DE_OBSTACULOS.bc) {
            direcoes = [['w'], ['w', 'a'], ['w', 'd'], ['w', 'a', 'd']];
        }
        return direcoes[Math.floor(Math.random() * direcoes.length)];
    }

    function moverObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            for (let j = 0; j < OBSTACULOS[i].direcao.length; j++) {
                if (OBSTACULOS[i].direcao[j] === 'a') {
                    if (
                        [TIPOS_DE_OBSTACULOS.cb, TIPOS_DE_OBSTACULOS.bc].includes(OBSTACULOS[i].tipo)
                        && Math.random() > 0.7
                    ) {
                        continue;
                    }
                    OBSTACULOS[i].x -= OBSTACULOS[i].passo;
                }
                if (OBSTACULOS[i].direcao[j] === 'w') {
                    if (
                        [TIPOS_DE_OBSTACULOS.de, TIPOS_DE_OBSTACULOS.ed].includes(OBSTACULOS[i].tipo)
                        && Math.random() > 0.7
                    ) {
                        continue;
                    }
                    OBSTACULOS[i].y -= OBSTACULOS[i].passo;
                }
                if (OBSTACULOS[i].direcao[j] === 's') {
                    if (
                        [TIPOS_DE_OBSTACULOS.de, TIPOS_DE_OBSTACULOS.ed].includes(OBSTACULOS[i].tipo)
                        && Math.random() > 0.7
                    ) {
                        continue;
                    }
                    OBSTACULOS[i].y += OBSTACULOS[i].passo;
                }
                if (OBSTACULOS[i].direcao[j] === 'd') {
                    if (
                        [TIPOS_DE_OBSTACULOS.cb, TIPOS_DE_OBSTACULOS.bc].includes(OBSTACULOS[i].tipo)
                        && Math.random() > 0.7
                    ) {
                        continue;
                    }
                    OBSTACULOS[i].x += OBSTACULOS[i].passo;
                }
            }
        }
    }

    document.addEventListener('keydown', ({ key }) => {
        if (TECLAS_VALIDAS.has(key) && !TECLAS.has(key)) {
            TECLAS.add(key);
            TECLAS.delete(TECLAS_OPOSTAS[key]);
        }
    });

    document.addEventListener('keyup', ({ key }) => {
        if (TECLAS_VALIDAS.has(key) && TECLAS.has(key)) {
            TECLAS.delete(key);
        }
    });

    /*
        *********------*********
        ---- RENDERIZACAO ------
        *********------*********
    */

    function renderizarObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            tela.drawImage(OBSTACULOS[i].img, OBSTACULOS[i].x - OBSTACULOS[i].raio - 0.5, OBSTACULOS[i].y - OBSTACULOS[i].raio - 1, OBSTACULOS[i].raio * 2, OBSTACULOS[i].raio * 2);
        }
    }

    function renderizarNave() {
        tela.drawImage(ufo, NAVE.x - NAVE.raio - 0.5, NAVE.y - NAVE.raio - 1, NAVE.raio * 2, NAVE.raio * 2);
    }

    function renderizarAreaDeEscaneamentoDeColisoes() {
        tela.beginPath();
        tela.strokeStyle = NAVE.cor;
        tela.arc(NAVE.x, NAVE.y, RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES, 0, Math.PI * 2);
        tela.stroke();
    }

    function renderizarLinhaParaNave({ x, y }) {
        tela.beginPath();
        tela.strokeStyle = 'green';
        tela.moveTo(NAVE.x, NAVE.y);
        tela.lineTo(x, y);
        tela.stroke();
    }

    function limparTela() {
        tela.fillStyle = 'black';
        tela.clearRect(0, 0, TELA_LARGURA, TELA_ALTURA);
    }

    /*
        *********------*********
        ---- INICIO DO JOGO ----
        *********------*********
    */

    gerarObstaculos();
    loop();
}