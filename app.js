let perguntas = [];
let perguntasFiltradas = [];
let perguntaAtualIndex = 0;
// NOVAS VARIÁVEIS:
let acertosSessao = 0;
let errosSessao = 0;

// Carrega o banco de dados JSON
async function carregarPerguntas() {
    try {
        const response = await fetch('perguntas.json');
        perguntas = await response.json();
        preencherCategorias();
    } catch (error) {
        console.error("Erro ao carregar perguntas.", error);
    }
}

// Cria os checkboxes baseados nas categorias do JSON
function preencherCategorias() {
    const container = document.getElementById('categorias-container');
    const categorias = [...new Set(perguntas.map(p => p.categoria))];
    
    categorias.forEach(cat => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat;
        checkbox.checked = true; // Vem marcado por padrão
        checkbox.className = 'cat-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + cat));
        container.appendChild(label);
    });
}

// Inicia a sessão
document.getElementById('btn-iniciar').addEventListener('click', () => {
    // 1. Coleta categorias selecionadas
    const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
    const categoriasSelecionadas = Array.from(checkboxes).map(cb => cb.value);
    
    if (categoriasSelecionadas.length === 0) {
        alert("Selecione pelo menos uma categoria!");
        return;
    }

    // 2. Coleta quantidade desejada
    const qtdDesejada = parseInt(document.getElementById('qtd-perguntas').value) || 10;
    
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const hoje = Date.now();

    // 3. Filtra as perguntas disponíveis
    let disponiveis = perguntas.filter(p => {
        const categoriaMatch = categoriasSelecionadas.includes(p.categoria);
        const proximaRevisao = progresso[p.id] || 0;
        const horaDeRevisar = hoje >= proximaRevisao;
        return categoriaMatch && horaDeRevisar;
    });

    if (disponiveis.length === 0) {
        alert("Nenhuma pergunta precisando de revisão agora para essas categorias.");
        return;
    }

    // 4. Embaralha de forma aleatória e corta na quantidade escolhida
    disponiveis = disponiveis.sort(() => 0.5 - Math.random()).slice(0, qtdDesejada);
    
    perguntasFiltradas = disponiveis;
    perguntaAtualIndex = 0;

    // Transição de tela
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('flashcard-screen').classList.remove('hidden');
    mostrarPergunta();
});

// Renderiza a pergunta
function mostrarPergunta() {
    const p = perguntasFiltradas[perguntaAtualIndex];
    
    document.getElementById('categoria-label').textContent = p.categoria;
    document.getElementById('contador-label').textContent = `${perguntaAtualIndex + 1} / ${perguntasFiltradas.length}`;
    document.getElementById('pergunta-texto').textContent = p.pergunta;
    
    const opcoesContainer = document.getElementById('opcoes-container');
    opcoesContainer.innerHTML = ''; 
    document.getElementById('explicacao').classList.add('hidden');
    document.getElementById('controles-feedback').classList.add('hidden');

    // Embaralha as opções para não ficarem sempre na mesma ordem
    const opcoesEmbaralhadas = [...p.opcoes].sort(() => 0.5 - Math.random());

    opcoesEmbaralhadas.forEach(opcao => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opcao;
        
        // Passamos o objeto 'p' inteiro para a função de verificação
        btn.onclick = () => verificarResposta(opcao, p, btn);
        
        opcoesContainer.appendChild(btn);
    });
}

// Automatiza o certo/errado
function verificarResposta(escolha, perguntaObj, btnClicado) {
    const botoes = document.querySelectorAll('.option-btn');
    botoes.forEach(b => b.disabled = true); 

    const acertou = (escolha === perguntaObj.resposta_correta);

    if (acertou) {
        acertosSessao++; // SOMA UM ACERTO
        btnClicado.style.backgroundColor = '#22c55e'; 
        btnClicado.style.color = 'white';
        registrarRevisao(perguntaObj.id, 5); 
    } else {
        errosSessao++; // SOMA UM ERRO
        btnClicado.style.backgroundColor = '#ef4444'; 
        btnClicado.style.color = 'white';
        registrarRevisao(perguntaObj.id, 2); 
        
        botoes.forEach(b => {
            if (b.textContent === perguntaObj.resposta_correta) {
                b.style.backgroundColor = '#22c55e';
                b.style.color = 'white';
            }
        });
    }

    const explicacaoDiv = document.getElementById('explicacao');
    explicacaoDiv.innerHTML = `<strong>Explicação:</strong> ${perguntaObj.explicacao}`;
    explicacaoDiv.classList.remove('hidden');
    
    document.getElementById('controles-feedback').classList.remove('hidden');
}

// Salva a nova data no LocalStorage
function registrarRevisao(idPergunta, dias) {
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const proximaData = Date.now() + (dias * 24 * 60 * 60 * 1000);
    progresso[idPergunta] = proximaData;
    localStorage.setItem('progresso_estudos', JSON.stringify(progresso));
}

// Avança para a próxima ou encerra a sessão
// Avança para a próxima ou exibe os resultados
document.getElementById('btn-proxima').addEventListener('click', () => {
    perguntaAtualIndex++;
    if (perguntaAtualIndex < perguntasFiltradas.length) {
        mostrarPergunta();
    } else {
        mostrarResultados(); // Chama a nova função
    }
});

// Calcula e mostra os resultados finais
function mostrarResultados() {
    document.getElementById('flashcard-screen').classList.add('hidden');
    document.getElementById('resultado-screen').classList.remove('hidden');

    const total = acertosSessao + errosSessao;
    const porcentagem = Math.round((acertosSessao / total) * 100);

    document.getElementById('res-acertos').textContent = acertosSessao;
    document.getElementById('res-erros').textContent = errosSessao;
    
    const spanPorcentagem = document.getElementById('res-porcentagem');
    spanPorcentagem.textContent = `${porcentagem}%`;

    // Muda a cor da porcentagem dependendo do desempenho
    if (porcentagem >= 80) {
        spanPorcentagem.style.color = '#22c55e'; // Verde para bom desempenho
    } else if (porcentagem >= 50) {
        spanPorcentagem.style.color = '#eab308'; // Amarelo para médio
    } else {
        spanPorcentagem.style.color = '#ef4444'; // Vermelho para baixo
    }
}

// Botão para voltar à tela de setup
document.getElementById('btn-voltar-inicio').addEventListener('click', () => {
    window.location.reload(); 
});

carregarPerguntas();