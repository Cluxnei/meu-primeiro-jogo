let TELA_LARGURA, TELA_ALTURA;

const PASSO_EM_PIXELS = 5;
const TECLAS = new Set();
const TECLAS_VALIDAS = new Set(['w', 'a', 's', 'd']);
const TECLAS_OPOSTAS = { w: 's', s: 'w', d: 'a', a: 'd' };

function iniciar(tela, ufo) {
    // GLOBAIS
    TELA_LARGURA = window.innerWidth;
    TELA_ALTURA = window.innerHeight;
    const NAVE = {
        x: TELA_LARGURA / 2,
        y: TELA_ALTURA / 2,
        cor: 'red',
        raio: 15,
    };
    NAVE.y = NAVE.y - NAVE.raio / 2;
    NAVE.x = NAVE.x - NAVE.raio / 2;
    // Renderizar a nave
    function renderizarNave() {
        tela.drawImage(ufo, NAVE.x - NAVE.raio - 0.5, NAVE.y - NAVE.raio - 1, NAVE.raio * 2, NAVE.raio * 2);
    }

    function limparTela() {
        tela.fillStyle = 'black';
        tela.clearRect(0, 0, TELA_LARGURA, TELA_ALTURA);
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

    // fazer o loop do jogo
    function loop() {
        requestAnimationFrame(loop);
        // mexer a nave nos limites do cenario
        limparTela();
        renderizarNave();
        moverNave();
    }
    loop();

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
}