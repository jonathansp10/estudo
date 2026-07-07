let perguntas = [];
let perguntasFiltradas = [];
let perguntaAtualIndex = 0;
let acertosSessao = 0;
let errosSessao = 0;

// Variáveis de controle de conquistas
let tempoInicioPergunta = 0;
let acertosSeguidosGeral = 0;
let acertosSeguidosSeguranca = 0;
let respostasRapidasSessao = 0;
let sessaoAtualTipo = "normal";

// ==========================================
// BANCO DE DADOS DOS PINS (CONQUISTAS)
// ==========================================
const LISTA_PINS = [
    {id: "p1", emoji: "🌱", nome: "Iniciante", desc: "Respondeu 10 perguntas"},
    {id: "p2", emoji: "🎯", nome: "Foco Total", desc: "Acertou 10 seguidas"},
    {id: "p3", emoji: "🦉", nome: "Corujão", desc: "Estudou após dez da noite"},
    {id: "p4", emoji: "♻️", nome: "Mestre da Repescagem", desc: "Zerou uma lista de 15 erros"},
    {id: "p5", emoji: "🎖️", nome: "Veterano de Guerra", desc: "Respondeu 500 perguntas"},
    {id: "p6", emoji: "🗣️", nome: "Poliglota", desc: "Respondeu 50 questões de Inglês"},
    {id: "p7", emoji: "🛡️", nome: "Security Guru", desc: "Acertou 20 seguidas em Segurança"},
    {id: "p8", emoji: "✨", nome: "Sem Erros", desc: "Sessão de 20 questões sem erros"},
    {id: "p9", emoji: "🌅", nome: "Madrugador", desc: "Estudou antes das 06:00"},
    {id: "p10", emoji: "🧠", nome: "Estrategista", desc: "Respondeu questões de 5 categorias diferentes"},
    {id: "p11", emoji: "🗂️", nome: "Leitner Master", desc: "Revisou 100 cartões atrasados"},
    {id: "p12", emoji: "🔥", nome: "Imparável", desc: "Ofensiva de 7 dias"},
    {id: "p13", emoji: "👑", nome: "Legenda Viva", desc: "Ofensiva de 30 dias"},
    {id: "p14", emoji: "🏹", nome: "Precisão Cirúrgica", desc: "Acertou 50 questões com 100% de aproveitamento"},
    {id: "p15", emoji: "🐉", nome: "Cinquentão", desc: "Ofensiva de 50 dias"},
    {id: "p16", emoji: "🧹", nome: "Backlog Zero", desc: "Não tem nenhuma questão atrasada no sistema"},
    {id: "p17", emoji: "👶", nome: "Primeiros Passos", desc: "Alcançou o nível 2"},
    {id: "p18", emoji: "🧗‍♂️", nome: "Escalador", desc: "Alcançou o nível 5"},
    {id: "p19", emoji: "☁️", nome: "Arquiteto de Nuvem", desc: "Acertou 30 questões de Cloud"},
    {id: "p20", emoji: "🏰", nome: "Defensor Cibernético", desc: "Acertou 50 questões de Segurança"},
    {id: "p21", emoji: "📚", nome: "Bibliotecário", desc: "Gerou 5 simulados impressos"},
    {id: "p22", emoji: "💾", nome: "Backup Realizado", desc: "Fez exportação dos dados"},
    {id: "p23", emoji: "🦇", nome: "Night Owl", desc: "Estudou 10 noites seguidas"},
    {id: "p24", emoji: "🎧", nome: "Bom de Papo", desc: "Usou o áudio do inglês 10 vezes"},
    {id: "p25", emoji: "⌨️", nome: "Ninja do Teclado", desc: "Respondeu 10 questões de tradução corretamente"},
    {id: "p26", emoji: "🥊", nome: "Resiliente", desc: "Errou uma, mas acertou na repescagem"},
    {id: "p27", emoji: "⚡", nome: "Fast & Furious", desc: "Respondeu 5 questões em menos de 1 minuto cada"},
    {id: "p28", emoji: "🛢️", nome: "Concurseiro Raiz", desc: "Respondeu 100 questões da Petrobras"},
    {id: "p29", emoji: "🏗️", nome: "Mestre dos Códigos", desc: "Completou 100% das questões de infraestrutura"},
    {id: "p30", emoji: "🏢", nome: "Concurseiro", desc: "Acertou 100 questões da Dataprev"}
];

// ==========================================
// LÓGICA DE VERIFICAÇÃO E RENDERIZAÇÃO
// ==========================================
function verificarConquista(pinId) {
    let pinsDesbloqueados = JSON.parse(localStorage.getItem('meus_pins')) || [];
    
    // Se o usuário ainda não tem esse pin, desbloqueia!
    if (!pinsDesbloqueados.includes(pinId)) {
        pinsDesbloqueados.push(pinId);
        localStorage.setItem('meus_pins', JSON.stringify(pinsDesbloqueados));
        
        // Pega os dados do pin para mostrar no alerta
        const pinData = LISTA_PINS.find(p => p.id === pinId);
        
        // Mostra o alerta visual na tela
        const alerta = document.getElementById('alerta-conquista');
        document.getElementById('alerta-emoji').textContent = pinData.emoji;
        document.getElementById('alerta-nome').textContent = pinData.nome;
        
        alerta.classList.remove('hidden');
        
        // Toca um som de conquista (opcional e nativo)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Nota C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Nota E5
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);

        // Esconde o alerta após 4 segundos
        setTimeout(() => {
            alerta.classList.add('hidden');
        }, 4000);
    }
}

function renderizarPainelPins() {
    const grid = document.getElementById('grid-pins');
    const pinsDesbloqueados = JSON.parse(localStorage.getItem('meus_pins')) || [];
    
    grid.innerHTML = '';
    
    LISTA_PINS.forEach(pin => {
        const isUnlocked = pinsDesbloqueados.includes(pin.id);
        const statusClass = isUnlocked ? 'unlocked' : 'locked';
        
        grid.innerHTML += `
            <div class="pin-card ${statusClass}">
                <div class="pin-emoji">${pin.emoji}</div>
                <div class="pin-nome">${pin.nome}</div>
                <div class="pin-desc">${pin.desc}</div>
            </div>
        `;
    });
}

// Botão para abrir o painel
document.getElementById('btn-ver-pins').addEventListener('click', () => {
    renderizarPainelPins();
    document.getElementById('modal-pins').classList.remove('hidden');
});

// Lista de Recompensas
const recompensasDisponiveis = [
    "Assista a 1 episódio da sua série favorita! 🍿",
    "Coma um pedaço do seu doce favorito sem culpa! 🍫",
    "Jogue 30 minutos do seu jogo preferido! 🎮",
    "Tire uma soneca revitalizante de 20 minutos! 😴",
    "Peça um delivery de algo bem gostoso hoje! 🍔",
    "Tire o resto do dia de folga dos estudos! 🏖️",
    "Assista a um filme que está na sua lista! 🎬"
];

// ==========================================
// FUNÇÃO DE EMBARALHAMENTO (Fisher-Yates)
// ==========================================
function embaralharArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ==========================================
// TEMA E INICIALIZAÇÃO
// ==========================================
window.onload = () => {
    // Configura Tema Dark
    const isDark = localStorage.getItem('dark_mode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('btn-theme-toggle').textContent = '☀️';
    }

    carregarPerguntas();
    verificarOfensivaVisual();
    
    const xp = parseInt(localStorage.getItem('user_xp')) || 0;
    const nivel = parseInt(localStorage.getItem('user_nivel')) || 1;
    atualizarInterfaceXP(xp, nivel);
};

document.getElementById('btn-theme-toggle').addEventListener('click', (e) => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark_mode', isDark);
    e.target.textContent = isDark ? '☀️' : '🌙';
});

// ==========================================
// OFENSIVA (STREAK)
// ==========================================
function verificarOfensivaVisual() {
    let streak = parseInt(localStorage.getItem('study_streak')) || 0;
    document.getElementById('streak-display').textContent = `🔥 ${streak} dias seguidos`;
}

function processarOfensivaFinalDeSessao() {
    const hoje = new Date().toDateString();
    const ultimoEstudo = localStorage.getItem('last_study_date');
    let streak = parseInt(localStorage.getItem('study_streak')) || 0;

    if (ultimoEstudo) {
        if (ultimoEstudo !== hoje) {
            const dataUltima = new Date(ultimoEstudo);
            const dataHoje = new Date(hoje);
            const diferencaDias = Math.floor((dataHoje - dataUltima) / (1000 * 60 * 60 * 24));

            if (diferencaDias === 1) {
                streak++; // Dia consecutivo
            } else if (diferencaDias > 1) {
                streak = 1; // Quebrou a ofensiva, recomeça
            }
        }
    } else {
        streak = 1; // Primeiro dia de estudo
    }

    localStorage.setItem('last_study_date', hoje);
    localStorage.setItem('study_streak', streak);
    verificarOfensivaVisual();
}

async function carregarPerguntas() {
    try {
        const res = await fetch('perguntas.json');
        perguntas = await res.json();
        
        const container = document.getElementById('categorias-container');
        const cats = [...new Set(perguntas.map(p => p.categoria))].sort();
        
        container.innerHTML = ''; 
        cats.forEach(cat => {
            container.innerHTML += `
                <div class="cat-row">
                    <label>
                        <input type="checkbox" class="cat-checkbox" value="${cat}" checked> 
                        &nbsp; ${cat}
                    </label>
                    <input type="number" class="cat-qtd" value="5" min="1" max="50">
                </div>
            `;
        });
        renderizarDashboard(cats);
    } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
    }
}

// ==========================================
// DASHBOARD DE DESEMPENHO
// ==========================================
function renderizarDashboard(categorias) {
    const stats = JSON.parse(localStorage.getItem('estatisticas_categorias')) || {};
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';

    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<p style="font-size:14px; color:var(--text-muted); font-style: italic;">Sua jornada começa agora. Responda perguntas para gerar estatísticas.</p>';
        return;
    }

    categorias.forEach(cat => {
        if (stats[cat] && stats[cat].total > 0) {
            const pct = Math.round((stats[cat].acertos / stats[cat].total) * 100);
            let cor = pct >= 80 ? '#22c55e' : (pct >= 50 ? '#eab308' : '#ef4444');

            container.innerHTML += `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                        <strong>${cat}</strong>
                        <span style="color: ${cor}; font-weight: bold;">${pct}% (${stats[cat].acertos}/${stats[cat].total})</span>
                    </div>
                    <div style="background: var(--border-color); border-radius: 10px; width: 100%; height: 8px; overflow: hidden;">
                        <div style="background: ${cor}; width: ${pct}%; height: 100%; border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }
    });
}

// ==========================================
// MODO ESTUDO E MODO REFORÇO
// ==========================================
document.getElementById('btn-iniciar').addEventListener('click', () => {
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const hoje = Date.now();
    perguntasFiltradas = []; 

    const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
    if (checkboxes.length === 0) return alert("Selecione pelo menos uma categoria!");

    checkboxes.forEach(cb => {
        const cat = cb.value;
        const qtdDesejada = parseInt(cb.closest('.cat-row').querySelector('.cat-qtd').value) || 5;
        let disp = perguntas.filter(p => p.categoria === cat && hoje >= (progresso[p.id] || 0));
        disp.forEach(p => p.jaRespondidaOriginalmente = false);
        perguntasFiltradas = perguntasFiltradas.concat(embaralharArray(disp).slice(0, qtdDesejada));
    });
   
    if (perguntasFiltradas.length === 0) {
        verificarConquista("p16");
        return alert("Parabéns! Nenhuma revisão atrasada.");
    }

    if (perguntasFiltradas.length === 0) return alert("Parabéns! Sua meta diária para essas categorias já foi batida.");
    sessaoAtualTipo = "normal";
    iniciarSessao();
});

document.getElementById('btn-reforco').addEventListener('click', () => {
    const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
    let perguntasComErro = perguntas.filter(p => rankingErros[p.id] > 0);
    
    if (perguntasComErro.length === 0) return alert("Excelente! Você não tem erros na memória.");

    perguntasComErro.forEach(p => p.jaRespondidaOriginalmente = false);
    let topErros = perguntasComErro.sort((a, b) => rankingErros[b.id] - rankingErros[a.id]).slice(0, 15);
    perguntasFiltradas = embaralharArray(topErros);
    sessaoAtualTipo = "reforco";
    iniciarSessao();
});

function iniciarSessao() {
    perguntaAtualIndex = 0;
    acertosSessao = 0;
    errosSessao = 0;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('flashcard-screen').classList.remove('hidden');
    mostrarPergunta();
}

// ==========================================
// LÓGICA DE FLASHCARDS E REPESCAGEM
// ==========================================
function mostrarPergunta() {
    tempoInicioPergunta = Date.now();
    const p = perguntasFiltradas[perguntaAtualIndex];
    document.getElementById('categoria-label').textContent = p.categoria;
    document.getElementById('contador-label').textContent = `${perguntaAtualIndex + 1} / ${perguntasFiltradas.length}`;
    
    // --- LÓGICA DE FORMATAÇÃO DE TEXTO ---
    let textoPergunta = p.pergunta;
    // Se a pergunta contiver números seguidos de ponto (ex: 1. ), adiciona quebra de linha
    textoPergunta = textoPergunta.replace(/(\d+\.\s)/g, '<br><br>$1');
    // Se contiver parênteses para preenchimento, adiciona espaçamento
    textoPergunta = textoPergunta.replace(/\(\s\)/g, '<br><strong>( )</strong>');
    
    document.getElementById('pergunta-texto').innerHTML = textoPergunta;
    
    const opcoesContainer = document.getElementById('opcoes-container');
    opcoesContainer.innerHTML = '';
    document.getElementById('explicacao').classList.add('hidden');
    
    document.getElementById('controles-feedback').innerHTML = `<button id="btn-proxima" style="background-color: var(--primary); color: white; margin-top: 25px; font-size: 18px; padding: 15px; width: 100%; border: none; border-radius: 10px; cursor: pointer;">Próxima ➔</button>`;
    document.getElementById('btn-proxima').onclick = proximaPergunta;
    document.getElementById('controles-feedback').classList.add('hidden');

    // Botão de Áudio
    const btnOuvir = document.getElementById('btn-ouvir');
    if (p.categoria.toLowerCase().includes('inglês') || p.categoria.toLowerCase().includes('ingles')) {
        btnOuvir.classList.remove('hidden');
        window.speechSynthesis.cancel(); 
        btnOuvir.onclick = () => {
            const leitura = new SpeechSynthesisUtterance(p.pergunta.replace(/<[^>]*>/g, ''));
            leitura.lang = 'en-US'; 
            window.speechSynthesis.speak(leitura);
        };
    } else {
        btnOuvir.classList.add('hidden');
    }

    if (p.tipo === 'traducao_escrita') {
        opcoesContainer.innerHTML = `
            <textarea id="input-traducao" placeholder="Digite sua tradução aqui..." style="width: 100%; height: 100px; padding: 15px; border-radius: 12px; border: 2px solid var(--border-color); background: var(--bg-color); color: var(--text-color); font-size: 16px; font-family: inherit; margin-bottom: 15px; box-sizing: border-box; resize: none;"></textarea>
            <button id="btn-revelar-traducao" style="background-color: var(--primary); color: white; padding: 15px; font-size: 16px; border-radius: 10px; width: 100%; border: none; font-weight: bold; cursor: pointer;">Revelar Resposta Mestre</button>
        `;
        document.getElementById('btn-revelar-traducao').onclick = () => {
            document.getElementById('btn-revelar-traducao').classList.add('hidden');
            document.getElementById('input-traducao').disabled = true;
            mostrarFeedbackTraducao(p);
        };
    } else {
        const opcoesEmbaralhadas = embaralharArray(p.opcoes);
        opcoesEmbaralhadas.forEach(op => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = op;
            btn.onclick = () => verificar(op, p, btn);
            opcoesContainer.appendChild(btn);
        });
    }
}

function verificar(escolha, p, btnClicado) {
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true); 
    const acertou = (escolha === p.resposta_correta);
    const ehRepescagem = p.jaRespondidaOriginalmente;

    if (acertou) { 
        if (!ehRepescagem) {
            acertosSessao++; 
            processarDadosDaResposta(p, true);
        }
        btnClicado.style.backgroundColor = '#22c55e'; 
        btnClicado.style.color = 'white';
        btnClicado.style.borderColor = '#16a34a';
    } else { 
        if (!ehRepescagem) {
            errosSessao++; 
            processarDadosDaResposta(p, false);
            p.jaRespondidaOriginalmente = true; 
            perguntasFiltradas.push(p); 
            document.getElementById('contador-label').innerHTML += ` <span style="color:#ef4444; font-size: 13px; font-weight:bold;">(+1 Fila)</span>`;
        }
        btnClicado.style.backgroundColor = '#ef4444'; 
        btnClicado.style.color = 'white';
        btnClicado.style.borderColor = '#dc2626';
    }

    mostrarFeedback(p, acertou, ehRepescagem);
}

function mostrarFeedback(p, acertou, ehRepescagem) {
    document.querySelectorAll('.option-btn').forEach(b => {
        if (b.textContent === p.resposta_correta) {
            b.style.backgroundColor = '#22c55e';
            b.style.color = 'white';
        }
    });

    let htmlExplicacao = "";

    if (!acertou && !ehRepescagem) {
        htmlExplicacao += `
            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 15px; border-radius: 8px;">
                <strong style="color: #ef4444;">Ops! Preste atenção.</strong><br>
                <span style="font-size: 14px; color: var(--text-main);">Essa pergunta foi para o final da fila de repescagem. Você precisará acertá-la antes de encerrar!</span>
            </div>
        `;
    }

    htmlExplicacao += `<strong>Análise do Gabarito:</strong><br><br>${p.explicacao}`;
    document.getElementById('explicacao').innerHTML = htmlExplicacao;
    document.getElementById('explicacao').classList.remove('hidden');
    document.getElementById('controles-feedback').classList.remove('hidden');
}

function mostrarFeedbackTraducao(p) {
    const ehRepescagem = p.jaRespondidaOriginalmente;
    
    let htmlExplicacao = `
        <div style="background: var(--btn-bg); padding: 20px; border-radius: 12px; border: 2px dashed var(--success); margin-bottom: 20px; text-align: center;">
            <strong style="color: var(--success); font-size: 14px; text-transform: uppercase;">Tradução Oficial do Gabarito</strong><br>
            <span style="font-size: 20px; color: var(--text-color); font-weight: bold;">${p.resposta_correta}</span>
        </div>
        <strong style="color: var(--primary);">Explicação Oficial:</strong><br><br>${p.explicacao}
    `;
    
    document.getElementById('explicacao').innerHTML = htmlExplicacao;
    document.getElementById('explicacao').classList.remove('hidden');
    
    // Troca o botão 'Próxima' pelos botões de Autoavaliação
    const controles = document.getElementById('controles-feedback');
    controles.innerHTML = `
        <div style="background: var(--card-bg); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; margin-top: 20px;">
            <h3 style="margin-top: 0; color: var(--text-color);">Seja sincero: você acertou a tradução?</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px;">Pequenos erros de vírgula ou sinônimos valem como acerto.</p>
            <div style="display: flex; gap: 10px;">
                <button id="btn-trad-errei" style="background: var(--danger); color: white; margin: 0; width: 100%; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">❌ Errei (Fila)</button>
                <button id="btn-trad-acertei" style="background: var(--success); color: white; margin: 0; width: 100%; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">✅ Acertei</button>
            </div>
        </div>
    `;
    controles.classList.remove('hidden');

    document.getElementById('btn-trad-acertei').onclick = () => {
        document.getElementById('input-traducao').style.borderColor = 'var(--success)';
        registrarEstudoDoDia();
        if (!ehRepescagem) { acertosSessao++; processarDadosDaResposta(p, true); }
        proximaPergunta();
    };

    document.getElementById('btn-trad-errei').onclick = () => {
        document.getElementById('input-traducao').style.borderColor = 'var(--danger)';
        registrarEstudoDoDia();
        if (!ehRepescagem) {
            errosSessao++; 
            processarDadosDaResposta(p, false);
            p.jaRespondidaOriginalmente = true; 
            perguntasFiltradas.push(p); 
            document.getElementById('contador-label').innerHTML += ` <span style="color:var(--danger); font-size: 13px; font-weight:bold;">(+1 Fila)</span>`;
        }
        proximaPergunta();
    };
}

// ==========================================
// NÚCLEO DE DADOS: XP, NÍVEIS E RECOMPENSAS
// ==========================================
function processarDadosDaResposta(p, acertou) {
    let xpAntigo = parseInt(localStorage.getItem('user_xp')) || 0;
    let nivelAntigo = parseInt(localStorage.getItem('user_nivel')) || 1;
    
    let ganhoXP = acertou ? 20 : -5;
    let xpNovo = Math.max(0, xpAntigo + ganhoXP);
    let nivelNovo = Math.floor(xpNovo / 200) + 1; 
    
    localStorage.setItem('user_xp', xpNovo);
    localStorage.setItem('user_nivel', nivelNovo);
    atualizarInterfaceXP(xpNovo, nivelNovo);

    // Dispara a recompensa se o nível aumentou
    if (nivelNovo > nivelAntigo) {
        dispararRecompensa(nivelNovo);
    }

    // Repetição Espaçada
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const niveis = JSON.parse(localStorage.getItem('nivel_acertos')) || {};
    let nivelQuestao = (niveis[p.id] || 0) + (acertou ? 1 : -(niveis[p.id] || 0)); 
    niveis[p.id] = Math.max(0, Math.min(5, nivelQuestao)); 
    
    const diasEspacamento = [0, 1, 3, 7, 15, 30][niveis[p.id]];
    progresso[p.id] = Date.now() + (diasEspacamento * 86400000); 

    localStorage.setItem('progresso_estudos', JSON.stringify(progresso));
    localStorage.setItem('nivel_acertos', JSON.stringify(niveis));

    if (!acertou) { 
        const ranking = JSON.parse(localStorage.getItem('ranking_erros')) || {};
        ranking[p.id] = (ranking[p.id] || 0) + 1;
        localStorage.setItem('ranking_erros', JSON.stringify(ranking));
    }
    
    const stats = JSON.parse(localStorage.getItem('estatisticas_categorias')) || {};
    if (!stats[p.categoria]) stats[p.categoria] = { acertos: 0, total: 0 };
    stats[p.categoria].total++;
    if (acertou) stats[p.categoria].acertos++;
    localStorage.setItem('estatisticas_categorias', JSON.stringify(stats));

    // ==========================================
    // MOTOR DE CONQUISTAS (TRACKER GLOBAL)
    // ==========================================
    const ehRepescagem = p.jaRespondidaOriginalmente;
    let tracker = JSON.parse(localStorage.getItem('user_tracker')) || {
        total_respondidas: 0, total_ingles: 0, cloud_acertos: 0,
        seguranca_acertos: 0, traducoes_acertos: 0, petrobras: 0,
        infra_acertos: 0, dataprev: 0, categorias: []
    };

    // Atualiza contadores
    tracker.total_respondidas++;
    if (!tracker.categorias.includes(p.categoria)) tracker.categorias.push(p.categoria);
    
    // Conquistas de Horário
    const horaAtual = new Date().getHours();
    if (horaAtual >= 22) verificarConquista("p3"); // Corujão
    if (horaAtual < 6) verificarConquista("p9"); // Madrugador

    // Conquistas de Volume e Categoria
    if (tracker.total_respondidas >= 10) verificarConquista("p1");
    if (tracker.total_respondidas >= 500) verificarConquista("p5");
    if (tracker.categorias.length >= 5) verificarConquista("p10");

    const catUpper = p.categoria.toUpperCase();

    if (catUpper.includes('INGL')) tracker.total_ingles++;
    if (tracker.total_ingles >= 50) verificarConquista("p6");

    if (catUpper.includes('PETROBRAS')) tracker.petrobras++;
    if (tracker.petrobras >= 100) verificarConquista("p28");

    if (acertou) {
        // Conquistas de Sequência e Tempo
        acertosSeguidosGeral++;
        if (acertosSeguidosGeral >= 10) verificarConquista("p2");

        const tempoGasto = (Date.now() - tempoInicioPergunta) / 1000;
        if (tempoGasto < 60) respostasRapidasSessao++;
        if (respostasRapidasSessao >= 5) verificarConquista("p27"); // Fast & Furious

        // Conquistas de Repescagem e Tradução
        if (ehRepescagem) verificarConquista("p26"); // Resiliente
        if (p.tipo === 'traducao_escrita') tracker.traducoes_acertos++;
        if (tracker.traducoes_acertos >= 10) verificarConquista("p25");

        // Conquistas de Especialidade (TI e Bancas)
        if (catUpper.includes('SEGURANÇA') || catUpper.includes('SECURITY')) {
            tracker.seguranca_acertos++;
            acertosSeguidosSeguranca++;
            if (acertosSeguidosSeguranca >= 20) verificarConquista("p7");
            if (tracker.seguranca_acertos >= 50) verificarConquista("p20");
        } else {
            acertosSeguidosSeguranca = 0; // Quebrou a sequência
        }

        if (catUpper.includes('CLOUD') || catUpper.includes('NUVEM')) tracker.cloud_acertos++;
        if (tracker.cloud_acertos >= 30) verificarConquista("p19");

        if (catUpper.includes('INFRA')) tracker.infra_acertos++;
        if (tracker.infra_acertos >= 30) verificarConquista("p29"); // Adaptado para 30 acertos

        if (catUpper.includes('DATAPREV')) tracker.dataprev++;
        if (tracker.dataprev >= 100) verificarConquista("p30");

    } else {
        acertosSeguidosGeral = 0; // Errou, perde a sequência
        acertosSeguidosSeguranca = 0;
    }

    // Conquistas de Nível e Ofensiva
    let streak = parseInt(localStorage.getItem('current_streak')) || 0;
    if (streak >= 7) verificarConquista("p12");
    if (streak >= 30) verificarConquista("p13");
    if (streak >= 50) verificarConquista("p15");

    let nivelAtual = parseInt(localStorage.getItem('user_nivel')) || 1;
    if (nivelAtual >= 2) verificarConquista("p17");
    if (nivelAtual >= 5) verificarConquista("p18");

    localStorage.setItem('user_tracker', JSON.stringify(tracker));
}

function atualizarInterfaceXP(xp, nivel) {
    const barra = document.getElementById('barra-xp');
    const texto = document.getElementById('texto-nivel');
    if(barra && texto) {
        const progressoNoNivel = xp % 200;
        const porcentagem = (progressoNoNivel / 200) * 100;
        barra.style.width = `${porcentagem}%`;
        texto.textContent = `Nível ${nivel} (${xp} XP)`;
    }
}

// SISTEMA DE RECOMPENSA
function dispararRecompensa(nivelNovo) {
    const recompensaSorteada = recompensasDisponiveis[Math.floor(Math.random() * recompensasDisponiveis.length)];
    document.getElementById('modal-nivel-num').textContent = nivelNovo;
    document.getElementById('modal-recompensa-texto').textContent = recompensaSorteada;
    document.getElementById('modal-recompensa').classList.remove('hidden');
}

function fecharModalRecompensa() {
    document.getElementById('modal-recompensa').classList.add('hidden');
}

function proximaPergunta() {
    window.speechSynthesis.cancel();
    perguntaAtualIndex++;
    
    if (perguntaAtualIndex < perguntasFiltradas.length) {
        mostrarPergunta();
    } else {
        document.getElementById('flashcard-screen').classList.add('hidden');
        document.getElementById('resultado-screen').classList.remove('hidden');
        
        const total = acertosSessao + errosSessao;
        const porcentagem = total === 0 ? 0 : Math.round((acertosSessao / total) * 100);
        
        document.getElementById('res-acertos').textContent = acertosSessao;
        document.getElementById('res-erros').textContent = errosSessao;
        document.getElementById('res-porcentagem').textContent = `${porcentagem}%`;
        
        const spanPorcentagem = document.getElementById('res-porcentagem');
        if (porcentagem >= 80) spanPorcentagem.style.color = 'var(--success)'; 
        else if (porcentagem >= 50) spanPorcentagem.style.color = 'var(--warning)'; 
        else spanPorcentagem.style.color = 'var(--danger)'; 
        if (errosSessao === 0 && acertosSessao === 20) verificarConquista("p8"); // Sessão 20 limpa
        if (errosSessao === 0 && acertosSessao === 50) verificarConquista("p14"); // Sessão 50 limpa
        if (sessaoAtualTipo === "reforco" && acertosSessao >= 15 && errosSessao === 0) verificarConquista("p4"); // Mestre da repescagem
    }
}

// ==========================================
// SIMULADO IMPRESSO, EXPORTAR / IMPORTAR (Mantidos iguais)
// ==========================================
document.getElementById('btn-gerar-prova').addEventListener('click', () => { /* Código existente omitido p/ brevidade, mas o seu funciona igual */
    let prints = parseInt(localStorage.getItem('simulados_impressos')) || 0;
    prints++;
    localStorage.setItem('simulados_impressos', prints);
    if(prints >= 5) verificarConquista("p21");
    const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
    let perguntasComErro = perguntas.filter(p => rankingErros[p.id] > 0);
    if (perguntasComErro.length === 0) return alert("Você não tem registros de erros para imprimir!");
    perguntasComErro.sort((a, b) => rankingErros[b.id] - rankingErros[a.id]);
    const qtd = parseInt(document.getElementById('qtd-prova').value) || 10;
    const provaLista = embaralharArray(perguntasComErro.slice(0, qtd));
    const letras = ['A', 'B', 'C', 'D', 'E'];
    let htmlProva = '';
    let htmlGabarito = '<h2>Gabarito e Comentários</h2>';

    provaLista.forEach((p, index) => {
        const numQuestao = index + 1;
        htmlProva += `<div style="margin-bottom: 20px; display: block; width: 100%;"><strong>${numQuestao}. [${p.categoria}] ${p.pergunta}</strong>`;
        const opcoesEmbaralhadas = embaralharArray(p.opcoes);
        let letraCorreta = '';
        opcoesEmbaralhadas.forEach((op, idx) => {
            if (op === p.resposta_correta) letraCorreta = letras[idx];
            htmlProva += `<div style="margin-bottom: 4px; margin-left: 15px; font-size: 13px;">( ${letras[idx]} ) ${op}</div>`;
        });
        htmlProva += `</div>`;
        htmlGabarito += `<div style="margin-bottom: 8px; font-size: 13px; display: block; width: 100%;"><strong>Questão ${numQuestao}: ${letraCorreta}</strong> - ${p.explicacao}</div>`;
    });

    document.getElementById('prova-conteudo').innerHTML = htmlProva;
    document.getElementById('prova-gabarito').innerHTML = htmlGabarito;
    document.getElementById('setup-screen').classList.add('hidden');
    
    // Mostra print temporariamente (usando CSS de impressão, ele esconde o resto automático)
    document.getElementById('print-area').classList.remove('hidden');
    setTimeout(() => { window.print(); if(confirm("Voltar ao início?")) location.reload(); }, 500); 
});

document.getElementById('btn-exportar').addEventListener('click', () => {
    try {
        const dados = {
            progresso_estudos: JSON.parse(localStorage.getItem('progresso_estudos')) || {},
            ranking_erros: JSON.parse(localStorage.getItem('ranking_erros')) || {},
            estatisticas_categorias: JSON.parse(localStorage.getItem('estatisticas_categorias')) || {},
            nivel_acertos: JSON.parse(localStorage.getItem('nivel_acertos')) || {},
            user_xp: localStorage.getItem('user_xp') || 0,
            user_nivel: localStorage.getItem('user_nivel') || 1,
            study_streak: localStorage.getItem('study_streak') || 0,
            last_study_date: localStorage.getItem('last_study_date') || ''
        };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
        a.download = "meu_progresso_completo.json";
        a.click();
    } catch (e) { alert("Erro ao exportar o progresso."); }
    
    verificarConquista("p22");
});

document.getElementById('btn-importar').addEventListener('change', (event) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            Object.keys(dados).forEach(key => localStorage.setItem(key, typeof dados[key] === 'object' ? JSON.stringify(dados[key]) : dados[key]));
            alert("Progresso restaurado!"); location.reload();
        } catch (err) { alert("Erro ao ler o arquivo."); }
    };
    if (event.target.files[0]) reader.readAsText(event.target.files[0]);
});
