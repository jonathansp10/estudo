let perguntas = [];
let perguntasFiltradas = [];
let perguntaAtualIndex = 0;
let acertosSessao = 0;
let errosSessao = 0;

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = () => {
    carregarPerguntas();
    const xp = parseInt(localStorage.getItem('user_xp')) || 0;
    const nivel = parseInt(localStorage.getItem('user_nivel')) || 1;
    atualizarInterfaceXP(xp, nivel);
};

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
        container.innerHTML = '<p style="font-size:14px; color:#94a3b8; font-style: italic;">Comece a responder perguntas para gerar seu gráfico de desempenho.</p>';
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
                    <div style="background: #334155; border-radius: 10px; width: 100%; height: 8px; overflow: hidden;">
                        <div style="background: ${cor}; width: ${pct}%; height: 100%; border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }
    });
}

// ==========================================
// MODO ESTUDO DIÁRIO (Leitner System)
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
        
        // Garante que a flag de repescagem inicie limpa
        disp.forEach(p => p.jaRespondidaOriginalmente = false);
        
        perguntasFiltradas = perguntasFiltradas.concat(disp.sort(() => 0.5 - Math.random()).slice(0, qtdDesejada));
    });

    if (perguntasFiltradas.length === 0) return alert("Parabéns! Nenhuma revisão atrasada.");

    iniciarSessao();
});

// ==========================================
// MODO REFORÇO (Top 15 Erros)
// ==========================================
document.getElementById('btn-reforco').addEventListener('click', () => {
    const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
    let perguntasComErro = perguntas.filter(p => rankingErros[p.id] > 0);
    
    if (perguntasComErro.length === 0) return alert("Excelente! Você não tem erros registrados.");

    perguntasComErro.forEach(p => p.jaRespondidaOriginalmente = false);

    perguntasFiltradas = perguntasComErro.sort((a, b) => rankingErros[b.id] - rankingErros[a.id]).slice(0, 15);
    perguntasFiltradas = perguntasFiltradas.sort(() => 0.5 - Math.random());

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
    const p = perguntasFiltradas[perguntaAtualIndex];
    document.getElementById('categoria-label').textContent = p.categoria;
    document.getElementById('contador-label').textContent = `${perguntaAtualIndex + 1} / ${perguntasFiltradas.length}`;
    document.getElementById('pergunta-texto').textContent = p.pergunta;
    
    const opcoesContainer = document.getElementById('opcoes-container');
    opcoesContainer.innerHTML = '';
    document.getElementById('explicacao').classList.add('hidden');
    document.getElementById('controles-feedback').classList.add('hidden');

    // Botão de Áudio (Apenas para Inglês)
    const btnOuvir = document.getElementById('btn-ouvir');
    if (p.categoria.toLowerCase().includes('inglês') || p.categoria.toLowerCase().includes('ingles')) {
        btnOuvir.classList.remove('hidden');
        window.speechSynthesis.cancel(); 
        btnOuvir.onclick = () => {
            const leitura = new SpeechSynthesisUtterance(p.pergunta);
            leitura.lang = 'en-US'; 
            window.speechSynthesis.speak(leitura);
        };
    } else {
        btnOuvir.classList.add('hidden');
    }

    [...p.opcoes].sort(() => 0.5 - Math.random()).forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = op;
        btn.onclick = () => verificar(op, p, btn);
        opcoesContainer.appendChild(btn);
    });
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
    } else { 
        if (!ehRepescagem) {
            errosSessao++; 
            processarDadosDaResposta(p, false);
            
            // LÓGICA DE REPESCAGEM: Joga para o final da fila
            p.jaRespondidaOriginalmente = true; 
            perguntasFiltradas.push(p); 
            
            // Atualiza contador no topo
            document.getElementById('contador-label').innerHTML += ` <span style="color:#ef4444; font-size: 12px; font-weight:bold;">(+1 Fila)</span>`;
        }
        btnClicado.style.backgroundColor = '#ef4444'; 
        btnClicado.style.color = 'white';
    }

    mostrarFeedback(p, acertou, ehRepescagem);
}

function mostrarFeedback(p, acertou, ehRepescagem) {
    // Revela a cor verde na alternativa correta
    document.querySelectorAll('.option-btn').forEach(b => {
        if (b.textContent === p.resposta_correta) {
            b.style.backgroundColor = '#22c55e';
            b.style.color = 'white';
        }
    });

    let htmlExplicacao = "";

    // Aviso amigável da repescagem se for o primeiro erro
    if (!acertou && !ehRepescagem) {
        htmlExplicacao += `
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
                <strong style="color: #b91c1c;">Ops! Você errou.</strong><br>
                <span style="font-size: 13px; color: #7f1d1d;">Leia a explicação abaixo com atenção. Essa pergunta foi jogada para o final da fila e você terá que respondê-la corretamente antes de encerrar a sessão!</span>
            </div>
        `;
    }

    htmlExplicacao += `<strong>Explicação Oficial:</strong><br><br>${p.explicacao}`;

    document.getElementById('explicacao').innerHTML = htmlExplicacao;
    document.getElementById('explicacao').classList.remove('hidden');
    document.getElementById('controles-feedback').classList.remove('hidden');
}

// ==========================================
// NÚCLEO DE DADOS: XP, LEITNER E ESTATÍSTICAS
// ==========================================
function processarDadosDaResposta(p, acertou) {
    // 1. GAMIFICAÇÃO (XP e Níveis)
    let xp = parseInt(localStorage.getItem('user_xp')) || 0;
    let ganhoXP = acertou ? 20 : -5;
    xp = Math.max(0, xp + ganhoXP);
    
    let nivel = Math.floor(xp / 200) + 1; // A cada 200 XP sobe 1 Nível
    localStorage.setItem('user_xp', xp);
    localStorage.setItem('user_nivel', nivel);
    atualizarInterfaceXP(xp, nivel);

    // 2. REPETIÇÃO ESPAÇADA (Sistema Leitner)
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const niveis = JSON.parse(localStorage.getItem('nivel_acertos')) || {};
    
    let nivelQuestao = (niveis[p.id] || 0) + (acertou ? 1 : -(niveis[p.id] || 0)); // Errou, zera o nível
    niveis[p.id] = Math.max(0, Math.min(5, nivelQuestao)); // Nível máximo é 5
    
    // Níveis de espaçamento: Hoje, 1 dia, 3 dias, 7 dias, 15 dias, 30 dias
    const diasEspacamento = [0, 1, 3, 7, 15, 30][niveis[p.id]];
    progresso[p.id] = Date.now() + (diasEspacamento * 86400000); // 86400000ms = 1 dia

    localStorage.setItem('progresso_estudos', JSON.stringify(progresso));
    localStorage.setItem('nivel_acertos', JSON.stringify(niveis));

    // 3. REGISTRO DE ERROS E ESTATÍSTICAS
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

document.getElementById('btn-proxima').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    perguntaAtualIndex++;
    
    // Se ainda houver perguntas (incluindo as que foram para o fim da fila)
    if (perguntaAtualIndex < perguntasFiltradas.length) {
        mostrarPergunta();
    } else {
        document.getElementById('flashcard-screen').classList.add('hidden');
        document.getElementById('resultado-screen').classList.remove('hidden');
        
        const total = acertosSessao + errosSessao;
        const porcentagem = total === 0 ? 0 : Math.round((acertosSessao / total) * 100);
        
        document.getElementById('res-acertos').textContent = acertosSessao;
        document.getElementById('res-erros').textContent = errosSessao;
        
        const spanPorcentagem = document.getElementById('res-porcentagem');
        spanPorcentagem.textContent = `${porcentagem}%`;
        if (porcentagem >= 80) spanPorcentagem.style.color = '#22c55e'; 
        else if (porcentagem >= 50) spanPorcentagem.style.color = '#eab308'; 
        else spanPorcentagem.style.color = '#ef4444'; 
    }
});

// ==========================================
// SIMULADO IMPRESSO (CADERNO DE ERROS)
// ==========================================
document.getElementById('btn-gerar-prova').addEventListener('click', () => {
    const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
    let perguntasComErro = perguntas.filter(p => rankingErros[p.id] > 0);
    
    if (perguntasComErro.length === 0) return alert("Você não tem registros de erros para imprimir!");

    perguntasComErro.sort((a, b) => rankingErros[b.id] - rankingErros[a.id]);
    const qtd = parseInt(document.getElementById('qtd-prova').value) || 10;
    const provaLista = perguntasComErro.slice(0, qtd);
    const letras = ['A', 'B', 'C', 'D', 'E'];
    let htmlProva = '';
    let htmlGabarito = '<h2>Gabarito e Comentários</h2>';

    provaLista.forEach((p, index) => {
        const numQuestao = index + 1;
        const qtdErros = rankingErros[p.id]; 

        htmlProva += `
            <div class="questao-print">
                <div class="questao-texto">
                    ${numQuestao}. [${p.categoria}] ${p.pergunta} 
                    <span style="font-size:11px; font-weight:normal; color:#666;">(Errou ${qtdErros}x)</span>
                </div>
        `;

        const opcoesEmbaralhadas = [...p.opcoes].sort(() => 0.5 - Math.random());
        let letraCorreta = '';

        opcoesEmbaralhadas.forEach((op, idx) => {
            const letra = letras[idx];
            if (op === p.resposta_correta) letraCorreta = letra;
            htmlProva += `<div class="opcao-print">( ${letra} ) ${op}</div>`;
        });
        htmlProva += `</div>`;

        htmlGabarito += `
            <div class="gabarito-item">
                <strong>Questão ${numQuestao}: ${letraCorreta}</strong> - ${p.explicacao}
            </div>
        `;
    });

    document.getElementById('prova-conteudo').innerHTML = htmlProva;
    document.getElementById('prova-gabarito').innerHTML = htmlGabarito;

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('print-area').classList.remove('hidden');

    setTimeout(() => {
        window.print();
        if(confirm("Deseja voltar para a tela inicial?")) {
            location.reload();
        }
    }, 500); 
});

// ==========================================
// SINCRONIZAÇÃO (EXPORTAR / IMPORTAR)
// ==========================================
document.getElementById('btn-exportar').addEventListener('click', () => {
    try {
        const dados = {
            progresso_estudos: JSON.parse(localStorage.getItem('progresso_estudos')) || {},
            ranking_erros: JSON.parse(localStorage.getItem('ranking_erros')) || {},
            estatisticas_categorias: JSON.parse(localStorage.getItem('estatisticas_categorias')) || {},
            nivel_acertos: JSON.parse(localStorage.getItem('nivel_acertos')) || {},
            user_xp: localStorage.getItem('user_xp') || 0,
            user_nivel: localStorage.getItem('user_nivel') || 1
        };

        const jsonString = JSON.stringify(dados, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = "meu_progresso_completo.json";
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert("Ocorreu um erro ao exportar o progresso.");
    }
});

document.getElementById('btn-importar').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            if (dados.progresso_estudos) localStorage.setItem('progresso_estudos', JSON.stringify(dados.progresso_estudos));
            if (dados.ranking_erros) localStorage.setItem('ranking_erros', JSON.stringify(dados.ranking_erros));
            if (dados.estatisticas_categorias) localStorage.setItem('estatisticas_categorias', JSON.stringify(dados.estatisticas_categorias));
            if (dados.nivel_acertos) localStorage.setItem('nivel_acertos', JSON.stringify(dados.nivel_acertos));
            if (dados.user_xp) localStorage.setItem('user_xp', dados.user_xp);
            if (dados.user_nivel) localStorage.setItem('user_nivel', dados.user_nivel);
            
            alert("Progresso restaurado com sucesso!");
            location.reload();
        } catch (error) {
            alert("Erro ao ler o arquivo. Arquivo inválido.");
        }
    };
    reader.readAsText(file);
});
