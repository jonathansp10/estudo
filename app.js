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
                    <input type="number" class="cat-qtd" value="5" min="1" max="50" title="Quantidade para ${cat}">
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
    }
}

document.getElementById('btn-iniciar').addEventListener('click', () => {
    const progresso = JSON.parse(localStorage.getItem('progresso_estudos')) || {};
    const hoje = Date.now();
    
    perguntasFiltradas = []; 

    const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
    
    if (checkboxes.length === 0) {
        return alert("Selecione pelo menos uma categoria!");
    }

    checkboxes.forEach(cb => {
        const cat = cb.value;
        const inputQtd = cb.closest('.cat-row').querySelector('.cat-qtd');
        const qtdDesejada = parseInt(inputQtd.value) || 5;

        let disponiveisCat = perguntas.filter(p => p.categoria === cat && hoje >= (progresso[p.id] || 0));
        
        // Embaralha APENAS dentro da própria categoria
        disponiveisCat = disponiveisCat.sort(() => 0.5 - Math.random()).slice(0, qtdDesejada);
        
        // Junta no array principal (mantendo a ordem das disciplinas do menu)
        perguntasFiltradas = perguntasFiltradas.concat(disponiveisCat);
    });

    if (perguntasFiltradas.length === 0) {
        return alert("Você não tem perguntas agendadas para revisar hoje nas categorias selecionadas. Excelente!");
    }

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

    // Lógica do Áudio (Web Speech API)
    const btnOuvir = document.getElementById('btn-ouvir');
    // Verifica se a palavra "Inglês" está no nome da categoria
    if (p.categoria.includes('Inglês')) {
        btnOuvir.classList.remove('hidden');
        
        // Remove leituras anteriores travadas, se houver
        window.speechSynthesis.cancel(); 
        
        btnOuvir.onclick = () => {
            // Se o texto for "Flashcard: Como dizemos 'tal coisa'?", podemos limpar para ler apenas a pergunta em inglês se preferir, 
            // mas como as perguntas misturam português e inglês, a API vai tentar ler com sotaque americano.
            const leitura = new SpeechSynthesisUtterance(p.pergunta);
            leitura.lang = 'en-US'; // Força a pronúncia em inglês americano
            leitura.rate = 0.9; // Velocidade um pouco reduzida para facilitar o entendimento
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
    // Para o áudio imediatamente se a pessoa avançar a tela
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

document.getElementById('btn-voltar-inicio').addEventListener('click', () => location.reload());

carregarPerguntas();