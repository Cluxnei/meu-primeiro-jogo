/*
- IDEIAS
- Menu e gameover
*/

/*
    *********------*********
    --------- GLOBAIS ------
    *********------*********
*/


let TELA_LARGURA, TELA_ALTURA, RATIO;

function obterSons() {
    return {
        trilha_sonora: new Howl({
            src: ['sons/soundtrack.wav'],
            loop: true,
            volume: 0.4,
        }),
        morte: new Howl({
            src: ['sons/morte.wav'],
            loop: false,
        }),
        pegou_combustivel: new Howl({
            src: ['sons/pegou-combustivel.wav'],
            loop: false,
        }),
        reset: new Howl({
            src: ['sons/reset.wav'],
            loop: false,
        }),
        meteoro: new Howl({
            src: ['sons/spawn-de-meteoro.wav'],
            loop: false,
        }),
        motor_parado: new Howl({
            src: ['sons/motor-2.wav'],
            loop: false,
            volume: 0.3,
        }),
        motor_andando: new Howl({
            src: ['sons/motor-3.wav'],
            loop: false,
            volume: 0.15,
        }),
    };
}

function ajustarTamanhoDeTela() {
    TELA_LARGURA = window.innerWidth - 5;
    TELA_ALTURA = window.innerHeight - 5;
    const menorTamanho = TELA_LARGURA < TELA_ALTURA ? TELA_LARGURA : TELA_ALTURA;
    tela.width = menorTamanho;
    tela.height = menorTamanho;
    TELA_LARGURA = menorTamanho;
    TELA_ALTURA = menorTamanho;
    RATIO = TELA_LARGURA / TELA_ALTURA;
}

let SOM_ATIVADO = true;

const TECLAS = new Set();
const TECLAS_VALIDAS = new Set(['w', 'a', 's', 'd']);
const TECLAS_OPOSTAS = { w: 's', s: 'w', d: 'a', a: 'd' };
let SONS;

const TIPOS_BASICOS = {
    de: 'direita_para_esquerda',
    ed: 'esquerda_para_direita',
    cb: 'cima_para_baixo',
    bc: 'baixo_para_cima',
};

const TIPOS_DE_OBSTACULOS = { ...TIPOS_BASICOS };

const TIPOS_DE_COMBUSTIVEIS = { ...TIPOS_BASICOS };

const INTERVALO_DE_GERACAO_DE_OBSTACULOS = 900;

const INTERVALO_ATUALIZACAO_RANKING = 3000;

let MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = false;
let MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES = false;
let RETARDAR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = false;
let DESTRUIR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = false;

const COEFICIENTE_DE_RETARDO_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = 4;
const COEFICIENTE_DE_RAIO_MINIMO_DE_DESTRUICAO_DE_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = 3;

const PROBABILIDADE_DE_AUMENTO_DE_RAIO_DE_OBSTACULO = 0.2;
const AUMENTO_DE_RAIO_DE_OBSTACULO = [2, 3];

const COEFICIENTE_DE_PERDA_DE_COMBUSTIVEL = {
    repouso: 0.015,
    movimento: 0.05,
    turbo: 0.1,
};

const TEMPO_DE_GERACAO_DE_COMBUSTIVEL = {
    max: 10,
    min: 5,
};

const PASSO_EM_PIXELS_BASE = 3;
const PASSO_EM_PIXELS_TURBO = 6;

let PASSO_EM_PIXELS = PASSO_EM_PIXELS_BASE;

const asteroids = [];
let DESTRUIR_OBSTACULOS = [];
let OBSTACULOS = [];
let COMBUSTIVEIS = [];
let PODERES_NO_JOGO = [];
let FILA_PODERES = [];

let vivo = true;
let turbo = false;
let pausado = false;
let reiniciado = false;
let PONTOS = 0;
let PONTOS_POR_CLOCK = 0;
let NIVEL = 0;
let PODER_ATIVO = {};
let INTERVALO_DE_PODER;
const COEFICIENTE_DE_PONTUACAO_POR_CLOCK = 0.0085;

const PODERES = {
    radar: 'radar',
    tsukuyomi: 'tsukuyomi',
    nuke: 'nuke',
    aumentarMeteoros: 'aumentarMeteoros',
};

const PODERES_POR_NIVEL = {
    [PODERES.radar]: [1, 0.1],
    [PODERES.tsukuyomi]: [2, 0.09],
    [PODERES.nuke]: [3, 0.07],
    [PODERES.aumentarMeteoros]: [0, 0.1],
};

const PROBABILIDADE_DE_PODER = 0.3;

let NAVE = {
    x: undefined,
    y: undefined,
    cor: 'rgba(255, 255, 255, 0.3)',
    raio: 20,
    combustivel: 100,
    tracado: [],
    quantidadeTracados: 30,
    delayTracado: 1,
    pularTracado: 0,
};

let MAXIMOS = {
    obstaculos: {
        quantidade: 3,
        raio: 10,
        raioBackup: 10,
        passo: { max: undefined, min: undefined },
        rotacao: { min: 1, max: 10 }
    },
    combustivel: {
        quantidade: 2,
        raio: 15,
        passo: { max: undefined, min: undefined },
        valor: { min: 5, max: 20 },
        rotacao: { min: 1, max: 3 }
    },
    poderes: {
        quantidade: 1,
        fila: 10,
    }
};

let MAXIMOS_INCIAL;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomOne(...list) {
    return list[Math.floor(random(0, list.length))];
}

function distanciaEntreDoisPontos({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function dentroDaAreaDeColisao(area, { x, y }) {
    return x >= area.xMin && x <= area.xMax && y >= area.yMin && y <= area.yMax;
}

function iniciar(tela, ufo, asteroid, asteroid2, asteroid3, asteroid4, astronaut, bg, gameOver, spaceGun, blackHole, blackHole2, alien, planet) {
    SONS = obterSons();

    SOM_ATIVADO && SONS.trilha_sonora.play();

    asteroids.push(asteroid, asteroid2, asteroid3, asteroid4);
    ajustarTamanhoDeTela();

    /*
        *********------*********
        ------- VARIAVEIS ------
        *********------*********
    */
    PASSO_EM_PIXELS *= RATIO;

    NAVE.raio *= RATIO;
    NAVE.x = TELA_LARGURA / 2 - NAVE.raio / 2;
    NAVE.y = TELA_ALTURA / 2 - NAVE.raio / 2;

    const NAVE_INCIAL = { ...NAVE };


    let RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES = NAVE.raio * 10;
    const RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES_INICIAL = RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES;

    MAXIMOS.obstaculos.passo.min = PASSO_EM_PIXELS / 3;
    MAXIMOS.obstaculos.passo.max = PASSO_EM_PIXELS / 1.5;

    MAXIMOS.combustivel.passo.min = PASSO_EM_PIXELS / 5;
    MAXIMOS.combustivel.passo.max = PASSO_EM_PIXELS / 1.5;

    MAXIMOS_INCIAL = JSON.parse(JSON.stringify(MAXIMOS));

    function motorMovendo() {
        if (SONS.motor_parado.playing()) {
            SONS.motor_parado.stop();
        }
        !SONS.motor_andando.playing() && SOM_ATIVADO && SONS.motor_andando.play();
    }

    function motorParado() {
        if (SONS.motor_andando.playing()) {
            SONS.motor_andando.stop();
        }
        !SONS.motor_parado.playing() && SOM_ATIVADO && SONS.motor_parado.play();
    }

    /*
        *********------*********
        ---- ATUALIZAÇÃO -------
        *********------*********
    */

    function computarRanking() {
        setInterval(() => {
            enviarPontos(PONTOS).then(() => makeRanking());
        }, INTERVALO_ATUALIZACAO_RANKING);
    }

    function computar() {
        computarTracadoNave();
        computarTracadoCombustiveis();
        computarTracadoObstaculos();
        computarTracadoPoderes();
        computarCombustivel();
        computarDificuldade();
    }

    function computarDificuldade() {
        if (PONTOS >= 10 && NIVEL === 0) {
            MAXIMOS.obstaculos.quantidade += 5;
            NIVEL++;
        } else if (PONTOS >= 50 && NIVEL === 1) {
            MAXIMOS.obstaculos.quantidade += 5;
            NIVEL++;
        } else if (PONTOS >= 60 && NIVEL === 2) {
            MAXIMOS.combustivel.valor.max += 5;
            MAXIMOS.poderes.quantidade += 1;
            MAXIMOS.obstaculos.passo.max += 3;
            NIVEL++;
        } else if (PONTOS >= 100 && NIVEL === 3) {
            MAXIMOS.combustivel.valor.max += 1;
            MAXIMOS.poderes.quantidade -= 1;
            MAXIMOS.obstaculos.passo.max += 1;
            MAXIMOS.obstaculos.quantidade += 30;
            MAXIMOS.obstaculos.raio -= 5;
            MAXIMOS.obstaculos.raioBackup -= 5;
            NIVEL++;
        }
    }

    function computarCombustivel() {
        if (NAVE.combustivel <= 0) {
            fimDeJogo();
            return;
        }
        PASSO_EM_PIXELS = (turbo ? PASSO_EM_PIXELS_TURBO : PASSO_EM_PIXELS_BASE) * RATIO;
        if (turbo && TECLAS.size !== 0) {
            motorMovendo();
            NAVE.combustivel -= COEFICIENTE_DE_PERDA_DE_COMBUSTIVEL.turbo;
        } else if (TECLAS.size === 0) {
            motorParado();
            NAVE.combustivel -= COEFICIENTE_DE_PERDA_DE_COMBUSTIVEL.repouso;
        } else {
            motorMovendo();
            NAVE.combustivel -= COEFICIENTE_DE_PERDA_DE_COMBUSTIVEL.movimento;
        }
    }

    function coordenadasParaTiposBasicos(tipo, raio) {
        let x, y;
        if (tipo === TIPOS_BASICOS.de) {
            x = TELA_LARGURA + raio;
            y = Math.random() * (TELA_ALTURA + raio);
        }
        if (tipo === TIPOS_BASICOS.ed) {
            x = -raio;
            y = Math.random() * (TELA_ALTURA + raio);
        }
        if (tipo === TIPOS_BASICOS.cb) {
            x = Math.random() * (TELA_LARGURA + raio);
            y = -raio;
        }
        if (tipo === TIPOS_BASICOS.bc) {
            x = Math.random() * (TELA_LARGURA + raio);
            y = TELA_ALTURA + raio;
        }
        return { x, y };
    }

    function entidadeBaseAleatoria(tipo, obstaculo = true) {
        const maximos = MAXIMOS[(obstaculo ? 'obstaculos' : 'combustivel')];
        let raio = maximos.raio * RATIO;
        if (obstaculo && Math.random() > 1 - PROBABILIDADE_DE_AUMENTO_DE_RAIO_DE_OBSTACULO) {
            raio *= AUMENTO_DE_RAIO_DE_OBSTACULO[Math.floor(random(0, AUMENTO_DE_RAIO_DE_OBSTACULO.length))];
        }
        const props = {
            rotacao: {
                anguloAtual: random(1, 359),
                passo: randomOne(-1, 1) * random(maximos.rotacao.min, maximos.rotacao.max),
            },
            passo: randomOne(-1, 1) * random(maximos.passo.min, maximos.passo.max),
            img: obstaculo ? randomOne(...asteroids) : astronaut,
            direcao: obstaculo ? obterPossiveisDirecoesObstaculo(tipo) : obterPossiveisDirecoesCombustivel(tipo),
            ...coordenadasParaTiposBasicos(tipo, raio),
            tracado: [],
            quantidadeTracados: obstaculo ? 10 : 20,
            delayTracado: obstaculo ? 4 : 10,
            pularTracado: 0,
        };
        props.backupPasso = props.passo;
        props.rotacao.backupPasso = props.rotacao.passo;
        return { raio, tipo, ...props };
    }

    function criarCombustivelAleatorio(tipo) {
        const valor = random(MAXIMOS.combustivel.valor.min, MAXIMOS.combustivel.valor.max);
        const pontos = 3;
        return { ...entidadeBaseAleatoria(tipo, false), valor, pontos };
    }

    function gerarEntidadeTipoAleatorio(obstaculo = true) {
        const max = MAXIMOS[obstaculo ? 'obstaculos' : 'combustivel'].quantidade;
        if ((obstaculo ? OBSTACULOS : COMBUSTIVEIS).length >= max) {
            return;
        }
        const tipos = Object.keys(obstaculo ? TIPOS_DE_OBSTACULOS : TIPOS_DE_COMBUSTIVEIS);
        const tipo = (obstaculo ? TIPOS_DE_OBSTACULOS : TIPOS_DE_COMBUSTIVEIS)[randomOne(...tipos)];
        if (obstaculo) {
            SOM_ATIVADO && SONS.meteoro.play();
            OBSTACULOS.push(criarObstaculoAleatorio(tipo));
        } else {
            COMBUSTIVEIS.push(criarCombustivelAleatorio(tipo));
        }
    }

    function aplicarPoder(poder) {
        if (PODER_ATIVO.tipo) {
            FILA_PODERES.length < MAXIMOS.poderes.fila && FILA_PODERES.push(poder);
            return;
        }
        clearInterval(INTERVALO_DE_PODER);
        poder.efeito(false);
        INTERVALO_DE_PODER = setInterval(() => {
            if (poder.tempo_de_uso >= poder.tempo_de_duracao) {
                poder.efeito(true);
                poder.efeitoTemporal && poder.efeitoTemporal(true, poder.tempo_de_uso, poder.tempo_de_duracao);
                clearInterval(INTERVALO_DE_PODER);
                PODER_ATIVO = {};
            }
            poder.tempo_de_uso++;
            poder.efeitoTemporal && poder.efeitoTemporal(false, poder.tempo_de_uso, poder.tempo_de_duracao);
        }, 1000);
        PODER_ATIVO = poder;
    }

    function criarPoder(poder) {
        if (MAXIMOS.poderes.quantidade < PODERES_NO_JOGO.length) {
            return;
        }
        const tipo = randomOne(...Object.values(TIPOS_BASICOS));
        const props = criarCombustivelAleatorio(tipo);
        props.ehPoder = true;
        props.pontos = 0;
        if (poder === PODERES.radar) {
            props.img = blackHole2;
            props.tempo_de_duracao = 7;
            props.tempo_de_uso = 0;
            props.efeito = (expirado = false) => {
                MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
                MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
            };
        } else if (poder === PODERES.tsukuyomi) {
            props.img = blackHole;
            props.tempo_de_duracao = 15;
            props.tempo_de_uso = 0;
            props.efeito = (expirado = false) => {
                MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
                MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
                RETARDAR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
            };
            props.efeitoTemporal = (expirado, tempo_de_uso, tempo_de_duracao) => {
                if (expirado) {
                    RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES = RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES_INICIAL;
                    return;
                }
                RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES += (tempo_de_duracao - tempo_de_uso) % Math.floor(NAVE.raio / 2);
            }
        } else if (poder === PODERES.nuke) {
            props.img = alien;
            props.tempo_de_duracao = 5;
            props.tempo_de_uso = 0;
            props.efeito = (expirado = false) => {
                MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
                MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
                DESTRUIR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = !expirado;
            };
        } else if (poder === PODERES.aumentarMeteoros) {
            props.malefico = true;
            props.img = planet;
            props.tempo_de_duracao = 25;
            props.tempo_de_uso = 0;
            props.efeito = (expirado = false) => {
                if (expirado) {
                    MAXIMOS.obstaculos.raio = MAXIMOS.obstaculos.raioBackup;
                    return;
                }
                MAXIMOS.obstaculos.raio *= 2;
            };
            props.efeitoTemporal = (expirado) => {
                if (expirado) {
                    MAXIMOS.obstaculos.raio = MAXIMOS.obstaculos.raioBackup;
                    return;
                }
                MAXIMOS.obstaculos.raio++;
            }
        }
        PODERES_NO_JOGO.push(props);
    }

    function gerarPoder() {
        const poderes = Object.keys(PODERES_POR_NIVEL);
        for (let i = 0; i < poderes.length; i++) {
            const [nivelNecessario, probabilidadeDeNascimento] = PODERES_POR_NIVEL[poderes[i]];
            if (NIVEL < nivelNecessario || Math.random() < 1 - probabilidadeDeNascimento) {
                continue;
            }
            criarPoder(poderes[i]);
        }
    }

    const filtro = ({ x, y, raio, tipo }) =>
        !(
            x < -raio * 3
            || x > TELA_LARGURA + raio * 3
            || y < -raio * 3
            || y > TELA_ALTURA + raio * 3
        );

    function removerEntidadesSobressalentes() {
        OBSTACULOS = OBSTACULOS.filter(filtro);
        PODERES_NO_JOGO = PODERES_NO_JOGO.filter(filtro);
        COMBUSTIVEIS = COMBUSTIVEIS.filter(filtro);
    }

    function criarObstaculoAleatorio(tipo) {
        return { ...entidadeBaseAleatoria(tipo, true) };
    }

    function areaDeEscaneamentoDeColisoes() {
        return {
            xMin: NAVE.x - RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            xMax: NAVE.x + RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            yMin: NAVE.y - RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
            yMax: NAVE.y + RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES,
        };
    }

    function colidindoComObstaculo() {
        const AREA_DE_ESCANEAMENTO_DE_COLISOES = areaDeEscaneamentoDeColisoes();
        for (let i = 0; i < OBSTACULOS.length; i++) {
            OBSTACULOS[i].passo = OBSTACULOS[i].backupPasso;
            OBSTACULOS[i].rotacao.passo = OBSTACULOS[i].rotacao.backupPasso;
            if (dentroDaAreaDeColisao(AREA_DE_ESCANEAMENTO_DE_COLISOES, OBSTACULOS[i])) {
                if (MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES) {
                    renderizarLinhaParaNave(OBSTACULOS[i], 'obstaculo');
                }
                if (RETARDAR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES) {
                    OBSTACULOS[i].passo = OBSTACULOS[i].backupPasso / COEFICIENTE_DE_RETARDO_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES;
                    OBSTACULOS[i].rotacao.passo = OBSTACULOS[i].rotacao.backupPasso / COEFICIENTE_DE_RETARDO_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES;
                }
                const distancia = distanciaEntreDoisPontos(OBSTACULOS[i], NAVE);
                if (DESTRUIR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES && distancia <= (NAVE.raio + OBSTACULOS[i].raio) * COEFICIENTE_DE_RAIO_MINIMO_DE_DESTRUICAO_DE_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES) {
                    DESTRUIR_OBSTACULOS.push(OBSTACULOS[i]);
                    return false;
                }
                if (distancia < NAVE.raio + OBSTACULOS[i].raio) {
                    return true;
                }
            }
        }
        return false;
    }

    function colidingoComCombustivel() {
        const AREA_DE_ESCANEAMENTO_DE_COLISOES = areaDeEscaneamentoDeColisoes();
        for (let i = 0; i < COMBUSTIVEIS.length; i++) {
            if (dentroDaAreaDeColisao(AREA_DE_ESCANEAMENTO_DE_COLISOES, COMBUSTIVEIS[i])) {
                if (MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES) {
                    renderizarLinhaParaNave(COMBUSTIVEIS[i], 'combustivel');
                }
                const distancia = distanciaEntreDoisPontos(COMBUSTIVEIS[i], NAVE);
                if (distancia < NAVE.raio + COMBUSTIVEIS[i].raio) {
                    return COMBUSTIVEIS[i];
                }
            }
        }
        return null;
    }

    function colidingoComPoder() {
        const AREA_DE_ESCANEAMENTO_DE_COLISOES = areaDeEscaneamentoDeColisoes();
        for (let i = 0; i < PODERES_NO_JOGO.length; i++) {
            if (dentroDaAreaDeColisao(AREA_DE_ESCANEAMENTO_DE_COLISOES, PODERES_NO_JOGO[i])) {
                if (MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES) {
                    renderizarLinhaParaNave(PODERES_NO_JOGO[i], 'poder');
                }
                const distancia = distanciaEntreDoisPontos(PODERES_NO_JOGO[i], NAVE);
                if (distancia < NAVE.raio + PODERES_NO_JOGO[i].raio) {
                    return PODERES_NO_JOGO[i];
                }
            }
        }
        return null;
    }

    function encherTanqueCom(combustivel) {
        SOM_ATIVADO && SONS.pegou_combustivel.play();
        const nivelDoTanque = NAVE.combustivel + combustivel.valor;
        NAVE.combustivel = nivelDoTanque >= 100 ? 100 : nivelDoTanque;
        PONTOS += combustivel.pontos;
    }

    function apagarCombustivel(combustivel) {
        const i = COMBUSTIVEIS.findIndex((c) => c === combustivel);
        COMBUSTIVEIS.splice(i, 1);
    }

    function apagarPoder(poder) {
        const i = PODERES_NO_JOGO.findIndex((p) => p === poder);
        PODERES_NO_JOGO.splice(i, 1);
    }

    function loop() {
        !SOM_ATIVADO && SONS.trilha_sonora.playing() && SONS.trilha_sonora.stop();
        SOM_ATIVADO && !SONS.trilha_sonora.playing() && SONS.trilha_sonora.play();
        requestAnimationFrame(loop);
        if (reiniciado) {
            vivo = true;
            pausado = false;
            reiniciado = false;
            turbo = false;
        }
        !vivo && fimDeJogo();
        if (pausado || !vivo) {
            return;
        }
        if (PONTOS_POR_CLOCK >= 1) {
            PONTOS++;
            PONTOS_POR_CLOCK = 0;
        } else {
            PONTOS_POR_CLOCK += COEFICIENTE_DE_PONTUACAO_POR_CLOCK;
        }
        renderizar();
        movimentar();
        computar();
        if (colidindoComObstaculo()) {
            fimDeJogo();
            return;
        }
        const combustivelColisor = colidingoComCombustivel();
        if (combustivelColisor) {
            encherTanqueCom(combustivelColisor);
            apagarCombustivel(combustivelColisor);
        }
        const poderColisor = colidingoComPoder();
        if (poderColisor) {
            aplicarPoder(poderColisor);
            apagarPoder(poderColisor);
        }
        FILA_PODERES.length > 0 && !PODER_ATIVO.tipo && aplicarPoder(FILA_PODERES.shift());
        destruirObjetos();
    }

    function destruirObjetos() {
        OBSTACULOS = OBSTACULOS.filter((o) => !DESTRUIR_OBSTACULOS.includes(o));
    }

    function gerarObstaculos() {
        removerEntidadesSobressalentes();
        gerarEntidadeTipoAleatorio(true);
        setTimeout(gerarObstaculos, random(0, INTERVALO_DE_GERACAO_DE_OBSTACULOS));
    }

    function gerarCombustiveis() {
        removerEntidadesSobressalentes();
        gerarEntidadeTipoAleatorio(false);
        Math.random() >= 1 - PROBABILIDADE_DE_PODER && gerarPoder();
        setTimeout(gerarCombustiveis, random(TEMPO_DE_GERACAO_DE_COMBUSTIVEL.min, TEMPO_DE_GERACAO_DE_COMBUSTIVEL.max));
    }
    let playGameOver = true, pontosEnviados = false;
    function fimDeJogo() {
        !pontosEnviados && enviarPontos(PONTOS);
        playGameOver && SOM_ATIVADO && SONS.morte.play();
        playGameOver = false;
        pontosEnviados = true;
        vivo = false;
        renderizarFimDeJogo();
    }

    function reset() {
        SOM_ATIVADO && SONS.reset.play();
        FILA_PODERES = [];
        OBSTACULOS = [];
        PODERES_NO_JOGO = [];
        COMBUSTIVEIS = [];
        NIVEL = 0;
        PONTOS = 0;
        PONTOS_POR_CLOCK = 0;
        PODER_ATIVO = {};
        MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES = false;
        MOSTRAR_RAIOS_DE_ESCANEAMENTO_DE_COLISOES = false;
        RETARDAR_OBSTACULOS_NA_AREA_DE_ESCANEAMENTO_DE_COLISOES = false;
        PASSO_EM_PIXELS = PASSO_EM_PIXELS_BASE;
        MAXIMOS = { ...MAXIMOS_INCIAL };
        NAVE = { ...NAVE_INCIAL };
        vivo = true;
        playGameOver = true;
        turbo = false;
        pausado = false;
        pontosEnviados = false;
        ajustarTamanhoDeTela();
    }

    /*
        *********------*********
        ---- MOVIMENTACAO ------
        *********------*********
    */

    function movimentar() {
        moverNave();
        moverObstaculos();
        moverCombustiveis();
        moverPoderes();
    }

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

    function computarTracadoNave() {
        if (NAVE.pularTracado === NAVE.delayTracado) {
            NAVE.tracado.push({ x: NAVE.x, y: NAVE.y });
            NAVE.pularTracado = 0;
        }
        if (NAVE.tracado.length >= NAVE.quantidadeTracados) {
            NAVE.tracado.shift();
        }
        NAVE.pularTracado++;
    }

    function computarTracadoObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            if (OBSTACULOS[i].pularTracado === OBSTACULOS[i].delayTracado) {
                OBSTACULOS[i].tracado.push({ x: OBSTACULOS[i].x, y: OBSTACULOS[i].y });
                OBSTACULOS[i].pularTracado = 0;
            }
            if (OBSTACULOS[i].tracado.length >= OBSTACULOS[i].quantidadeTracados) {
                OBSTACULOS[i].tracado.shift();
            }
            OBSTACULOS[i].pularTracado++;
        }
    }

    function computarTracadoCombustiveis() {
        for (let i = 0; i < COMBUSTIVEIS.length; i++) {
            if (COMBUSTIVEIS[i].pularTracado === COMBUSTIVEIS[i].delayTracado) {
                COMBUSTIVEIS[i].tracado.push({ x: COMBUSTIVEIS[i].x, y: COMBUSTIVEIS[i].y });
                COMBUSTIVEIS[i].pularTracado = 0;
            }
            if (COMBUSTIVEIS[i].tracado.length >= COMBUSTIVEIS[i].quantidadeTracados) {
                COMBUSTIVEIS[i].tracado.shift();
            }
            COMBUSTIVEIS[i].pularTracado++;
        }
    }

    function computarTracadoPoderes() {
        for (let i = 0; i < PODERES_NO_JOGO.length; i++) {
            if (PODERES_NO_JOGO[i].pularTracado === PODERES_NO_JOGO[i].delayTracado) {
                PODERES_NO_JOGO[i].tracado.push({ x: PODERES_NO_JOGO[i].x, y: PODERES_NO_JOGO[i].y });
                PODERES_NO_JOGO[i].pularTracado = 0;
            }
            if (PODERES_NO_JOGO[i].tracado.length >= PODERES_NO_JOGO[i].quantidadeTracados) {
                PODERES_NO_JOGO[i].tracado.shift();
            }
            PODERES_NO_JOGO[i].pularTracado++;
        }
    }

    function obterPossiveisDirecoesTiposBasicos(tipo) {
        if (tipo === TIPOS_BASICOS.de) {
            return [['a'], ['a', 's'], ['w', 'a'], ['a', 'w', 's']];
        }
        if (tipo === TIPOS_BASICOS.ed) {
            return [['d'], ['d', 'w'], ['d', 's'], ['d', 'w', 's']];
        }
        if (tipo === TIPOS_BASICOS.cb) {
            return [['s'], ['s', 'a'], ['s', 'd'], ['s', 'a', 'd']];
        }
        if (tipo === TIPOS_BASICOS.bc) {
            return [['w'], ['w', 'a'], ['w', 'd'], ['w', 'a', 'd']];
        }
        return null;
    };

    function obterPossiveisDirecoesObstaculo(tipo) {
        let direcoes = obterPossiveisDirecoesTiposBasicos(tipo);
        // Tipos customizados vem aqui ...
        return randomOne(...direcoes);
    }

    function obterPossiveisDirecoesCombustivel(tipo) {
        let direcoes = obterPossiveisDirecoesTiposBasicos(tipo);
        // Tipos customizados vem aqui ...
        return randomOne(...direcoes);
    }

    function moverTiposBasicos(direcao, entidade) {
        if (direcao === 'a') {
            if ([TIPOS_BASICOS.cb, TIPOS_BASICOS.bc].includes(entidade.tipo) && Math.random() > 0.7) {
                return;
            }
            entidade.x -= entidade.passo;
        }
        if (direcao === 'w') {
            if ([TIPOS_BASICOS.de, TIPOS_BASICOS.ed].includes(entidade.tipo) && Math.random() > 0.7) {
                return;
            }
            entidade.y -= entidade.passo;
        }
        if (direcao === 's') {
            if ([TIPOS_BASICOS.de, TIPOS_BASICOS.ed].includes(entidade.tipo) && Math.random() > 0.7) {
                return;
            }
            entidade.y += entidade.passo;
        }
        if (direcao === 'd') {
            if ([TIPOS_BASICOS.cb, TIPOS_BASICOS.bc].includes(entidade.tipo) && Math.random() > 0.7) {
                return;
            }
            entidade.x += entidade.passo;
        }
    }

    function moverCombustiveis() {
        for (let i = 0; i < COMBUSTIVEIS.length; i++) {
            for (let j = 0; j < COMBUSTIVEIS[i].direcao.length; j++) {
                moverTiposBasicos(COMBUSTIVEIS[i].direcao[j], COMBUSTIVEIS[i]);
                // Movimentos customizados vem aqui ...
            }
        }
    }

    function moverPoderes() {
        for (let i = 0; i < PODERES_NO_JOGO.length; i++) {
            for (let j = 0; j < PODERES_NO_JOGO[i].direcao.length; j++) {
                moverTiposBasicos(PODERES_NO_JOGO[i].direcao[j], PODERES_NO_JOGO[i]);
                // Movimentos customizados vem aqui ...
            }
        }
    }

    function moverObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            for (let j = 0; j < OBSTACULOS[i].direcao.length; j++) {
                moverTiposBasicos(OBSTACULOS[i].direcao[j], OBSTACULOS[i]);
                // Movimentos customizados vem aqui ...
            }
        }
    }

    document.addEventListener('keydown', ({ key }) => {
        k = key.toLowerCase();
        if (TECLAS_VALIDAS.has(k) && !TECLAS.has(k)) {
            TECLAS.add(k);
            TECLAS.delete(TECLAS_OPOSTAS[k]);
        } else if (k === 'j' || k === ' ') {
            turbo = true;
        }
    });

    document.addEventListener('keyup', ({ key }) => {
        k = key.toLowerCase();
        if (k === ' ' && !vivo) {
            reset();
            return;
        }
        if (TECLAS_VALIDAS.has(k) && TECLAS.has(k)) {
            TECLAS.delete(k);
        } else if (k === 'j' || k === ' ') {
            turbo = false;
        }
    });

    /*
        *********------*********
        ---- RENDERIZACAO ------
        *********------*********
    */

    function renderizar() {
        limparTela();
        if (MOSTRAR_AREA_DE_ESCANEAMENTO_DE_COLISOES) {
            renderizarAreaDeEscaneamentoDeColisoes();
        }
        renderizarTracadoNave();
        renderizarTracadoObstaculos();
        renderizarTracadoPoderes();
        renderizarTracadoCombustiveis();
        renderizarBarraDeCombustivel();
        renderizarPontos();
        renderizarTempoDePoder();
        renderizarCombustiveis();
        renderizarObstaculos();
        renderizarPoderes();
        renderizarNave();
        renderizarFilaDePoderes();
    }

    function renderizarFimDeJogo() {
        const tamanho = 1512;
        const aumento = TELA_LARGURA / tamanho;
        tela.drawImage(gameOver, 0, 0, TELA_LARGURA, tamanho * aumento);
    }

    function renderizarCombustiveis() {
        for (let i = 0; i < COMBUSTIVEIS.length; i++) {
            tela.save();
            tela.translate(COMBUSTIVEIS[i].x, COMBUSTIVEIS[i].y);
            tela.rotate(COMBUSTIVEIS[i].rotacao.anguloAtual * Math.PI / 180);
            tela.translate(-COMBUSTIVEIS[i].x, -COMBUSTIVEIS[i].y);
            COMBUSTIVEIS[i].rotacao.anguloAtual += COMBUSTIVEIS[i].rotacao.passo;
            tela.drawImage(COMBUSTIVEIS[i].img, (COMBUSTIVEIS[i].x - COMBUSTIVEIS[i].raio - 0.5), (COMBUSTIVEIS[i].y - COMBUSTIVEIS[i].raio - 1), COMBUSTIVEIS[i].raio * 2, COMBUSTIVEIS[i].raio * 2);
            tela.restore();
        }
    }

    function renderizarGridFileDePoderes() {
        const raio = MAXIMOS.combustivel.raio, margem = 10;
        tela.strokeStyle = 'white';
        for (let i = 1; i < 6; i++) {
            tela.strokeRect(TELA_LARGURA / 2 - raio + i * (raio * 2 + margem), TELA_ALTURA - 50, raio * 2, raio * 2);
            tela.strokeRect(TELA_LARGURA / 2 + margem + raio - i * (raio * 2 + margem), TELA_ALTURA - 50, raio * 2, raio * 2);
        }
    }

    function renderizarFilaDePoderes() {
        renderizarGridFileDePoderes();
        const raio = MAXIMOS.combustivel.raio, margem = 10;
        tela.strokeStyle = 'white';
        for (let i = 0; i < FILA_PODERES.length; i++) {
            tela.drawImage(FILA_PODERES[i].img, TELA_LARGURA / 2 - (raio * 11 + margem) + i * (raio * 2 + margem), TELA_ALTURA - 50, raio * 2, raio * 2);
        }
    }

    function renderizarPoderes() {
        for (let i = 0; i < PODERES_NO_JOGO.length; i++) {
            tela.save();
            tela.translate(PODERES_NO_JOGO[i].x, PODERES_NO_JOGO[i].y);
            tela.rotate(PODERES_NO_JOGO[i].rotacao.anguloAtual * Math.PI / 180);
            tela.translate(-PODERES_NO_JOGO[i].x, -PODERES_NO_JOGO[i].y);
            PODERES_NO_JOGO[i].rotacao.anguloAtual += PODERES_NO_JOGO[i].rotacao.passo;
            tela.drawImage(PODERES_NO_JOGO[i].img, (PODERES_NO_JOGO[i].x - PODERES_NO_JOGO[i].raio - 0.5), (PODERES_NO_JOGO[i].y - PODERES_NO_JOGO[i].raio - 1), PODERES_NO_JOGO[i].raio * 2, PODERES_NO_JOGO[i].raio * 2);
            tela.restore();
        }
    }

    function renderizarBarraDeCombustivel() {
        const porcentagem = NAVE.combustivel / 100;
        tela.fillStyle = porcentagem <= 0.3 ? 'red' : (porcentagem <= 0.6 ? 'orange' : 'blue');
        tela.fillRect(0, 0, TELA_LARGURA * porcentagem, 10 * RATIO);
    }

    function renderizarObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            tela.save();
            tela.translate(OBSTACULOS[i].x, OBSTACULOS[i].y);
            tela.rotate(OBSTACULOS[i].rotacao.anguloAtual * Math.PI / 180);
            tela.translate(-OBSTACULOS[i].x, -OBSTACULOS[i].y);
            OBSTACULOS[i].rotacao.anguloAtual += OBSTACULOS[i].rotacao.passo;
            tela.drawImage(OBSTACULOS[i].img, OBSTACULOS[i].x - OBSTACULOS[i].raio - 0.5, OBSTACULOS[i].y - OBSTACULOS[i].raio - 1, OBSTACULOS[i].raio * 2, OBSTACULOS[i].raio * 2);
            tela.restore();
        }
    }

    function renderizarTracadoObstaculos() {
        for (let i = 0; i < OBSTACULOS.length; i++) {
            const coeficienteOpacidade = 1 / OBSTACULOS[i].tracado.length;
            let opacidade = 0.05;
            for (let j = 0; j < OBSTACULOS[i].tracado.length - 1; j++) {
                tela.strokeStyle = `rgba(253,77,48,${opacidade})`;
                tela.beginPath();
                tela.moveTo(OBSTACULOS[i].tracado[j + 1].x, OBSTACULOS[i].tracado[j + 1].y);
                tela.lineTo(OBSTACULOS[i].tracado[j].x, OBSTACULOS[i].tracado[j].y);
                tela.stroke();
                opacidade += coeficienteOpacidade;
            }
        }
    }

    function renderizarTracadoPoderes() {
        for (let i = 0; i < PODERES_NO_JOGO.length; i++) {
            const coeficienteOpacidade = 1 / PODERES_NO_JOGO[i].tracado.length;
            let opacidade = 0.05;
            for (let j = 0; j < PODERES_NO_JOGO[i].tracado.length - 1; j++) {
                tela.strokeStyle = PODERES_NO_JOGO[i].malefico ? `rgba(253,100,10,${opacidade})` : `rgba(51,150,0,${opacidade})`;
                tela.beginPath();
                tela.moveTo(PODERES_NO_JOGO[i].tracado[j + 1].x, PODERES_NO_JOGO[i].tracado[j + 1].y);
                tela.lineTo(PODERES_NO_JOGO[i].tracado[j].x, PODERES_NO_JOGO[i].tracado[j].y);
                tela.stroke();
                opacidade += coeficienteOpacidade;
            }
        }
    }

    function renderizarTracadoCombustiveis() {
        for (let i = 0; i < COMBUSTIVEIS.length; i++) {
            const coeficienteOpacidade = 1 / COMBUSTIVEIS[i].tracado.length;
            let opacidade = 0.05;
            for (let j = 0; j < COMBUSTIVEIS[i].tracado.length - 1; j++) {
                tela.strokeStyle = `rgba(153,200,40,${opacidade})`;
                tela.beginPath();
                tela.moveTo(COMBUSTIVEIS[i].tracado[j + 1].x, COMBUSTIVEIS[i].tracado[j + 1].y);
                tela.lineTo(COMBUSTIVEIS[i].tracado[j].x, COMBUSTIVEIS[i].tracado[j].y);
                tela.stroke();
                opacidade += coeficienteOpacidade;
            }
        }
    }

    function renderizarNave() {
        tela.drawImage(ufo, NAVE.x - NAVE.raio - 0.5, NAVE.y - NAVE.raio - 1, NAVE.raio * 2, NAVE.raio * 2);
    }

    function renderizarTracadoNave() {
        const coeficienteOpacidade = 1 / NAVE.tracado.length;
        let opacidade = 0.05;
        for (let i = 0; i < NAVE.tracado.length - 1; i++) {
            tela.strokeStyle = `rgba(0,0,255,${opacidade})`;
            tela.beginPath();
            tela.moveTo(NAVE.tracado[i + 1].x, NAVE.tracado[i + 1].y);
            tela.lineTo(NAVE.tracado[i].x, NAVE.tracado[i].y);
            tela.stroke();
            opacidade += coeficienteOpacidade;
        }
    }

    function renderizarAreaDeEscaneamentoDeColisoes() {
        tela.beginPath();
        tela.strokeStyle = NAVE.cor;
        tela.arc(NAVE.x, NAVE.y, RAIO_AREA_DE_ESCANEAMENTO_DE_COLISOES, 0, Math.PI * 2);
        tela.stroke();
    }

    function renderizarLinhaParaNave({ x, y, ehPoder }, tipo) {
        const cor = tipo === 'combustivel' ? 'orange' : 'red';
        tela.beginPath();
        tela.strokeStyle = tipo === 'poder' ? 'green' : cor;
        tela.moveTo(NAVE.x, NAVE.y);
        tela.lineTo(x, y);
        tela.stroke();
    }

    function limparTela() {
        tela.fillStyle = 'black';
        tela.clearRect(0, 0, TELA_LARGURA, TELA_ALTURA);
        tela.drawImage(bg, 0, 0, TELA_LARGURA, TELA_ALTURA);
        tela.fillStyle = 'rgba(0, 0, 0, 0.5)';
        tela.fillRect(0, 0, TELA_LARGURA, TELA_ALTURA);
    }

    function renderizarPontos() {
        tela.fillStyle = 'white';
        tela.font = '3vw Arial';
        tela.fillText(PONTOS.toString(), 10, TELA_ALTURA - 10);
    }

    function renderizarTempoDePoder() {
        if (typeof PODER_ATIVO.tipo === 'undefined') {
            return;
        }
        tela.strokeStyle = 'red';
        const tempo = PODER_ATIVO.tempo_de_duracao - PODER_ATIVO.tempo_de_uso;
        const graus = Math.PI * 2 / PODER_ATIVO.tempo_de_duracao;
        tela.strokeStyle = PODER_ATIVO.malefico ? 'red' : 'green';
        tela.beginPath();
        tela.arc(NAVE.x, NAVE.y, NAVE.raio + 5, graus * PODER_ATIVO.tempo_de_uso, Math.PI * 2);
        tela.stroke();
        tela.beginPath();
        tela.arc(15 + PODER_ATIVO.raio, TELA_ALTURA - (60 + PODER_ATIVO.raio), PODER_ATIVO.raio + 5, graus * PODER_ATIVO.tempo_de_uso, Math.PI * 2);
        tela.stroke();
        tela.drawImage(PODER_ATIVO.img, PODER_ATIVO.raio, TELA_ALTURA - (70 + PODER_ATIVO.raio + 5), PODER_ATIVO.raio * 2, PODER_ATIVO.raio * 2);
        // tela.fillText(tempo.toString(), 10, TELA_ALTURA - 70);
    }


    /*
        *********------*********
        ---- INICIO DO JOGO ----
        *********------*********
    */

    gerarObstaculos();
    gerarCombustiveis();
    loop();
    computarRanking();
}