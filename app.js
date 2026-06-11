let perguntas = [];
let perguntasFiltradas = [];
let perguntaAtualIndex = 0;
let acertosSessao = 0;
let errosSessao = 0;

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
    } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
    }
}

// ==========================================
// LÓGICA DE ESTUDO NORMAL (FLASHCARDS)
// ==========================================
document.getElementById('btn-iniciar').addEventListener('click', () => {
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const hoje = Date.now();
    perguntasFiltradas = []; 

    const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
    if (checkboxes.length === 0) return alert("Selecione pelo menos uma categoria!");

    checkboxes.forEach(cb => {
        const cat = cb.value;
        const inputQtd = cb.closest('.cat-row').querySelector('.cat-qtd');
        const qtdDesejada = parseInt(inputQtd.value) || 5;

        let disponiveisCat = perguntas.filter(p => p.categoria === cat && hoje >= (progresso[p.id] || 0));
        disponiveisCat = disponiveisCat.sort(() => 0.5 - Math.random()).slice(0, qtdDesejada);
        perguntasFiltradas = perguntasFiltradas.concat(disponiveisCat);
    });

    if (perguntasFiltradas.length === 0) return alert("Você não tem perguntas agendadas para revisar hoje.");

    perguntaAtualIndex = 0;
    acertosSessao = 0;
    errosSessao = 0;

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('flashcard-screen').classList.remove('hidden');
    mostrarPergunta();
});

function mostrarPergunta() {
    const p = perguntasFiltradas[perguntaAtualIndex];
    document.getElementById('categoria-label').textContent = p.categoria;
    document.getElementById('contador-label').textContent = `${perguntaAtualIndex + 1} / ${perguntasFiltradas.length}`;
    document.getElementById('pergunta-texto').textContent = p.pergunta;
    
    const opcoesContainer = document.getElementById('opcoes-container');
    opcoesContainer.innerHTML = '';
    document.getElementById('explicacao').classList.add('hidden');
    document.getElementById('controles-feedback').classList.add('hidden');

    const btnOuvir = document.getElementById('btn-ouvir');
    if (p.categoria.includes('Inglês')) {
        btnOuvir.classList.remove('hidden');
        window.speechSynthesis.cancel(); 
        btnOuvir.onclick = () => {
            const leitura = new SpeechSynthesisUtterance(p.pergunta);
            leitura.lang = 'en-US'; 
            leitura.rate = 0.9; 
            window.speechSynthesis.speak(leitura);
        };
    } else {
        btnOuvir.classList.add('hidden');
    }

    const opcoesEmbaralhadas = [...p.opcoes].sort(() => 0.5 - Math.random());

    opcoesEmbaralhadas.forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = op;
        btn.onclick = () => verificar(op, p, btn);
        opcoesContainer.appendChild(btn);
    });
}

function verificar(escolha, p, btnClicado) {
    const botoes = document.querySelectorAll('.option-btn');
    botoes.forEach(b => b.disabled = true); 

    const acertou = (escolha === p.resposta_correta);
    if (acertou) { 
        acertosSessao++; 
        registrar(p.id, 5); 
        btnClicado.style.backgroundColor = '#22c55e'; 
        btnClicado.style.color = 'white';
    } else { 
        errosSessao++; 
        registrar(p.id, 2); 
        btnClicado.style.backgroundColor = '#ef4444'; 
        btnClicado.style.color = 'white';
        
        // NOVO: SALVA O ERRO NO HISTÓRICO PARA GERAR A PROVA DEPOIS
        const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
        rankingErros[p.id] = (rankingErros[p.id] || 0) + 1;
        localStorage.setItem('ranking_erros', JSON.stringify(rankingErros));
        
        botoes.forEach(b => {
            if (b.textContent === p.resposta_correta) {
                b.style.backgroundColor = '#22c55e';
                b.style.color = 'white';
            }
        });
    }
    
    const explicacaoDiv = document.getElementById('explicacao');
    explicacaoDiv.innerHTML = `<strong>Explicação:</strong> ${p.explicacao}`;
    explicacaoDiv.classList.remove('hidden');
    document.getElementById('controles-feedback').classList.remove('hidden');
}

function registrar(id, dias) {
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    progresso[id] = Date.now() + (dias * 24 * 60 * 60 * 1000);
    localStorage.setItem('progresso_estudos', JSON.stringify(progresso));
}

document.getElementById('btn-proxima').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    perguntaAtualIndex++;
    if (perguntaAtualIndex < perguntasFiltradas.length) {
        mostrarPergunta();
    } else {
        document.getElementById('flashcard-screen').classList.add('hidden');
        document.getElementById('resultado-screen').classList.remove('hidden');
        const total = acertosSessao + errosSessao;
        const porcentagem = Math.round((acertosSessao / total) * 100);
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
// LÓGICA DO GERADOR DE PROVA IMPRESSA
// ==========================================
document.getElementById('btn-gerar-prova').addEventListener('click', () => {
    const rankingErros = JSON.parse(localStorage.getItem('ranking_erros')) || {};
    
    // Filtra apenas perguntas que você já errou pelo menos uma vez
    let perguntasComErro = perguntas.filter(p => rankingErros[p.id] > 0);
    
    if (perguntasComErro.length === 0) {
        return alert("Você ainda não tem registros de erros! Estude pelo modo Flashcard primeiro.");
    }

    // Ordena do maior número de erros para o menor
    perguntasComErro.sort((a, b) => rankingErros[b.id] - rankingErros[a.id]);

    // Corta na quantidade que você digitou
    const qtd = parseInt(document.getElementById('qtd-prova').value) || 10;
    const provaLista = perguntasComErro.slice(0, qtd);

    const letras = ['A', 'B', 'C', 'D', 'E'];
    let htmlProva = '';
    let htmlGabarito = '<h2>Gabarito e Comentários</h2>';

    provaLista.forEach((p, index) => {
        const numQuestao = index + 1;
        const qtdErros = rankingErros[p.id]; // Quantas vezes você já errou ela

        // Cabeçalho da questão
        htmlProva += `
            <div class="questao-print">
                <div class="questao-texto">
                    ${numQuestao}. [${p.categoria}] ${p.pergunta} 
                    <span style="font-size:11px; font-weight:normal; color:#666;">(Errou ${qtdErros}x)</span>
                </div>
        `;

        // Embaralha as opções para a prova
        const opcoesEmbaralhadas = [...p.opcoes].sort(() => 0.5 - Math.random());
        let letraCorreta = '';

        opcoesEmbaralhadas.forEach((op, idx) => {
            const letra = letras[idx];
            if (op === p.resposta_correta) letraCorreta = letra;
            htmlProva += `<div class="opcao-print">( ${letra} ) ${op}</div>`;
        });
        htmlProva += `</div>`;

        // Adiciona ao gabarito no final
        htmlGabarito += `
            <div class="gabarito-item">
                <strong>Questão ${numQuestao}: ${letraCorreta}</strong> - ${p.explicacao}
            </div>
        `;
    });

    // Joga os HTMLs gerados na tela
    document.getElementById('prova-conteudo').innerHTML = htmlProva;
    document.getElementById('prova-gabarito').innerHTML = htmlGabarito;

    // Esconde o menu e mostra a área da prova
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('print-area').classList.remove('hidden');

    // Mágica: Chama a tela de impressão do navegador (Ctrl+P automático)
    setTimeout(() => {
        window.print();
        
        // Pergunta se quer voltar ao menu após fechar a janela de impressão
        if(confirm("Deseja voltar para a tela inicial?")) {
            location.reload();
        }
    }, 500); 

    // ==========================================
// LÓGICA DE EXPORTAR / IMPORTAR PROGRESSO
// ==========================================

// Baixar os dados do LocalStorage
document.getElementById('btn-exportar').addEventListener('click', () => {
    const progresso = localStorage.getItem('progresso_estudos') || '{}';
    const ranking = localStorage.getItem('ranking_erros') || '{}';
    
    const dados = {
        progresso_estudos: JSON.parse(progresso),
        ranking_erros: JSON.parse(ranking)
    };

    const blob = new Blob([JSON.stringify(dados)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "meu_progresso_estudos.json";
    a.click();
    URL.revokeObjectURL(url);
});

// Ler o arquivo e salvar no LocalStorage
document.getElementById('btn-importar').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            if (dados.progresso_estudos) {
                localStorage.setItem('progresso_estudos', JSON.stringify(dados.progresso_estudos));
            }
            if (dados.ranking_erros) {
                localStorage.setItem('ranking_erros', JSON.stringify(dados.ranking_erros));
            }
            alert("Progresso sincronizado com sucesso!");
            location.reload();
        } catch (error) {
            alert("Erro ao ler o arquivo. Certifique-se de que é o backup correto.");
        }
    };
    reader.readAsText(file);
});
});

carregarPerguntas();