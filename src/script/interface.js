/**
 * Camada de interface: única responsável por ler e escrever no DOM.
 * Não contém a lógica da pilha, da gramática ou da derivação — apenas
 * apresenta os resultados calculados por esses módulos.
 *
 * Todo conteúdo proveniente do usuário é inserido com textContent,
 * nunca com innerHTML, para evitar XSS.
 */
const Interface = {
    refs: {},

    /** Localiza e armazena todas as referências de elementos usadas pela interface. */
    inicializar() {
        this.refs = {
            selectExemplo: document.getElementById('select-exemplo'),
            btnCarregarExemplo: document.getElementById('btn-carregar-exemplo'),

            inputNovoNaoTerminal: document.getElementById('input-novo-nao-terminal'),
            btnAddNaoTerminal: document.getElementById('btn-add-nao-terminal'),
            chipsNaoTerminais: document.getElementById('chips-nao-terminais'),

            inputNovoTerminal: document.getElementById('input-novo-terminal'),
            btnAddTerminal: document.getElementById('btn-add-terminal'),
            chipsTerminais: document.getElementById('chips-terminais'),

            selectSimboloInicial: document.getElementById('select-simbolo-inicial'),

            selectLadoEsquerdo: document.getElementById('select-lado-esquerdo'),
            paletaSimbolos: document.getElementById('paleta-simbolos'),
            rhsAtual: document.getElementById('rhs-atual'),
            btnRemoverUltimoSimbolo: document.getElementById('btn-remover-ultimo-simbolo'),
            btnLimparRhs: document.getElementById('btn-limpar-rhs'),
            btnAdicionarAlternativa: document.getElementById('btn-adicionar-alternativa'),
            listaProducoes: document.getElementById('lista-producoes'),

            btnValidar: document.getElementById('btn-validar'),
            mensagemGramatica: document.getElementById('mensagem-gramatica'),

            resumoGramatica: document.getElementById('resumo-gramatica'),
            resumoNaoTerminais: document.getElementById('resumo-nao-terminais'),
            resumoTerminais: document.getElementById('resumo-terminais'),
            resumoInicial: document.getElementById('resumo-inicial'),
            resumoProducoes: document.getElementById('resumo-producoes'),

            btnGerarSentenca: document.getElementById('btn-gerar-sentenca'),
            btnLimpar: document.getElementById('btn-limpar'),
            sentencaGerada: document.getElementById('sentenca-gerada'),
            mensagemDerivacao: document.getElementById('mensagem-derivacao'),

            historicoPilha: document.getElementById('historico-pilha'),

            tabelaDerivacaoCorpo: document.getElementById('tabela-derivacao-corpo'),
            derivacaoSimplificada: document.getElementById('derivacao-simplificada'),

            regexEquacaoFinal: document.getElementById('regex-equacao-final'),
            regexResultado: document.getElementById('regex-resultado'),
            regexMensagem: document.getElementById('regex-mensagem')
        };
    },

    /** Preenche o <select> de exemplos com as opções recebidas. */
    popularSelectExemplos(exemplos) {
        this.refs.selectExemplo.textContent = '';
        exemplos.forEach((exemplo, indice) => {
            const opcao = document.createElement('option');
            opcao.value = String(indice);
            opcao.textContent = exemplo.nome;
            this.refs.selectExemplo.appendChild(opcao);
        });
    },

    /** Retorna o índice selecionado no <select> de exemplos. */
    obterIndiceExemploSelecionado() {
        return parseInt(this.refs.selectExemplo.value, 10);
    },

    /** Lê e limpa o campo de novo não-terminal (Passo 1). */
    obterValorNovoNaoTerminal() {
        return this.refs.inputNovoNaoTerminal.value;
    },

    limparCampoNovoNaoTerminal() {
        this.refs.inputNovoNaoTerminal.value = '';
        this.refs.inputNovoNaoTerminal.focus();
    },

    /** Lê e limpa o campo de novo terminal (Passo 2). */
    obterValorNovoTerminal() {
        return this.refs.inputNovoTerminal.value;
    },

    limparCampoNovoTerminal() {
        this.refs.inputNovoTerminal.value = '';
        this.refs.inputNovoTerminal.focus();
    },

    /** Desenha os chips de não-terminais já cadastrados, cada um com um botão de remover. */
    renderizarChipsNaoTerminais(naoTerminais, aoRemover) {
        this._renderizarChips(this.refs.chipsNaoTerminais, naoTerminais, aoRemover, 'Nenhum não-terminal cadastrado ainda.');
    },

    /** Desenha os chips de terminais já cadastrados, cada um com um botão de remover. */
    renderizarChipsTerminais(terminais, aoRemover) {
        this._renderizarChips(this.refs.chipsTerminais, terminais, aoRemover, 'Nenhum terminal cadastrado ainda.');
    },

    _renderizarChips(container, itens, aoRemover, textoVazio) {
        container.textContent = '';

        if (itens.length === 0) {
            const vazio = document.createElement('span');
            vazio.className = 'dica-vazio';
            vazio.textContent = textoVazio;
            container.appendChild(vazio);
            return;
        }

        itens.forEach(simbolo => {
            const chip = document.createElement('span');
            chip.className = 'chip';

            const texto = document.createElement('span');
            texto.textContent = simbolo;

            const botaoRemover = document.createElement('button');
            botaoRemover.type = 'button';
            botaoRemover.className = 'chip-remover';
            botaoRemover.textContent = '×';
            botaoRemover.setAttribute('aria-label', `Remover ${simbolo}`);
            botaoRemover.addEventListener('click', () => aoRemover(simbolo));

            chip.appendChild(texto);
            chip.appendChild(botaoRemover);
            container.appendChild(chip);
        });
    },

    /** Reconstrói o <select> do símbolo inicial (Passo 3), preservando a seleção se ainda for válida. */
    renderizarSelectSimboloInicial(naoTerminais, valorSelecionado) {
        this._renderizarSelectDeSimbolos(this.refs.selectSimboloInicial, naoTerminais, valorSelecionado);
    },

    obterSimboloInicialSelecionado() {
        return this.refs.selectSimboloInicial.value;
    },

    /** Reconstrói o <select> do lado esquerdo da produção (Passo 4). */
    renderizarSelectLadoEsquerdo(naoTerminais, valorSelecionado) {
        this._renderizarSelectDeSimbolos(this.refs.selectLadoEsquerdo, naoTerminais, valorSelecionado);
    },

    obterLadoEsquerdoSelecionado() {
        return this.refs.selectLadoEsquerdo.value;
    },

    _renderizarSelectDeSimbolos(select, simbolos, valorSelecionado) {
        select.textContent = '';

        const opcaoPadrao = document.createElement('option');
        opcaoPadrao.value = '';
        opcaoPadrao.textContent = 'Selecione...';
        select.appendChild(opcaoPadrao);

        simbolos.forEach(simbolo => {
            const opcao = document.createElement('option');
            opcao.value = simbolo;
            opcao.textContent = simbolo;
            select.appendChild(opcao);
        });

        select.value = simbolos.includes(valorSelecionado) ? valorSelecionado : '';
    },

    /**
     * Desenha a paleta de símbolos clicáveis para montar o lado direito da produção.
     * Depois que o último símbolo colocado é um não-terminal, os demais botões ficam
     * desabilitados (uma gramática regular só permite não-terminal na última posição).
     * O botão de ε só fica habilitado enquanto nada foi colocado ainda.
     */
    renderizarPaleta(naoTerminais, terminais, rhsAtual, aoClicarSimbolo) {
        const container = this.refs.paletaSimbolos;
        container.textContent = '';

        const ultimoSimbolo = rhsAtual[rhsAtual.length - 1];
        const travadoPorNaoTerminal = naoTerminais.includes(ultimoSimbolo);
        const jaTemEpsilon = rhsAtual.length === 1 && rhsAtual[0] === 'ε';

        const criarBotao = (simbolo, classeExtra) => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = classeExtra ? `simbolo-btn ${classeExtra}` : 'simbolo-btn';
            botao.textContent = simbolo;
            botao.disabled = travadoPorNaoTerminal || jaTemEpsilon;
            botao.addEventListener('click', () => aoClicarSimbolo(simbolo));
            container.appendChild(botao);
        };

        terminais.forEach(simbolo => criarBotao(simbolo));
        naoTerminais.forEach(simbolo => criarBotao(simbolo));

        const botaoEpsilon = document.createElement('button');
        botaoEpsilon.type = 'button';
        botaoEpsilon.className = 'simbolo-btn simbolo-btn-epsilon';
        botaoEpsilon.textContent = 'ε (vazio)';
        botaoEpsilon.disabled = rhsAtual.length > 0;
        botaoEpsilon.addEventListener('click', () => aoClicarSimbolo('ε'));
        container.appendChild(botaoEpsilon);
    },

    /** Mostra o lado direito que está sendo montado no Passo 4. */
    renderizarRhsAtual(rhsAtual) {
        this.refs.rhsAtual.textContent = rhsAtual.length > 0 ? rhsAtual.join('') : '(vazio)';
    },

    /**
     * Mostra a lista de produções já adicionadas, agrupadas por lado esquerdo
     * e separadas por "|" (ex: "S -> a | b | c"), cada alternativa com seu
     * próprio botão de remover.
     */
    renderizarListaProducoes(producoes, aoRemoverIndice) {
        const lista = this.refs.listaProducoes;
        lista.textContent = '';

        if (producoes.length === 0) {
            const vazio = document.createElement('li');
            vazio.className = 'dica-vazio';
            vazio.textContent = 'Nenhuma produção adicionada ainda.';
            lista.appendChild(vazio);
            return;
        }

        const grupos = new Map();
        producoes.forEach((producao, indice) => {
            if (!grupos.has(producao.esquerda)) {
                grupos.set(producao.esquerda, []);
            }
            grupos.get(producao.esquerda).push({ producao, indice });
        });

        grupos.forEach((alternativas, esquerda) => {
            const item = document.createElement('li');
            item.className = 'producao-grupo';

            const rotulo = document.createElement('span');
            rotulo.className = 'producao-rotulo';
            rotulo.textContent = `${esquerda} ->`;
            item.appendChild(rotulo);

            alternativas.forEach((entrada, posicao) => {
                if (posicao > 0) {
                    const separador = document.createElement('span');
                    separador.className = 'producao-separador';
                    separador.textContent = '|';
                    item.appendChild(separador);
                }

                const alternativa = document.createElement('span');
                alternativa.className = 'producao-alternativa';

                const texto = document.createElement('span');
                texto.textContent = entrada.producao.direita.join('');

                const botaoRemover = document.createElement('button');
                botaoRemover.type = 'button';
                botaoRemover.className = 'producao-remover';
                botaoRemover.textContent = '×';
                botaoRemover.setAttribute('aria-label', `Remover ${esquerda} -> ${entrada.producao.direita.join('')}`);
                botaoRemover.addEventListener('click', () => aoRemoverIndice(entrada.indice));

                alternativa.appendChild(texto);
                alternativa.appendChild(botaoRemover);
                item.appendChild(alternativa);
            });

            lista.appendChild(item);
        });
    },

    /** Mostra uma mensagem simples de status na Seção 2 (info, sucesso ou erro). */
    mostrarMensagemGramatica(texto, tipo) {
        const elemento = this.refs.mensagemGramatica;
        elemento.textContent = texto || '';
        elemento.className = 'mensagem';
        if (texto) {
            elemento.classList.add(`mensagem-${tipo}`);
        }
    },

    /** Mostra a lista de erros de validação da gramática. */
    mostrarErrosGramatica(erros) {
        const elemento = this.refs.mensagemGramatica;
        elemento.textContent = '';
        elemento.className = 'mensagem mensagem-erro';

        const titulo = document.createElement('p');
        titulo.textContent = 'A gramática informada não é válida:';
        elemento.appendChild(titulo);

        const lista = document.createElement('ul');
        erros.forEach(erro => {
            const item = document.createElement('li');
            item.textContent = erro;
            lista.appendChild(item);
        });
        elemento.appendChild(lista);

        this.refs.resumoGramatica.hidden = true;
    },

    /** Mostra o resumo formal N, T, P, S de uma gramática validada. */
    mostrarResumoGramatica(gramatica) {
        this.refs.resumoNaoTerminais.textContent = gramatica.naoTerminais.join(', ');
        this.refs.resumoTerminais.textContent = gramatica.terminais.join(', ');
        this.refs.resumoInicial.textContent = gramatica.simboloInicial;

        this.refs.resumoProducoes.textContent = '';
        for (const naoTerminal in gramatica.producoes) {
            const alternativas = gramatica.producoes[naoTerminal]
                .map(rhs => rhs.join(''))
                .join(' | ');

            const item = document.createElement('li');
            item.textContent = `${naoTerminal} -> ${alternativas}`;
            this.refs.resumoProducoes.appendChild(item);
        }

        this.refs.resumoGramatica.hidden = false;
    },

    /** Mostra a sentença final gerada pela derivação. */
    mostrarSentenca(sentenca) {
        this.refs.sentencaGerada.textContent = sentenca.length > 0 ? sentenca : '(sentença vazia)';
    },

    /** Mostra uma mensagem relacionada à geração/derivação (ex.: limite atingido). */
    mostrarMensagemDerivacao(texto, tipo) {
        const elemento = this.refs.mensagemDerivacao;
        elemento.textContent = texto || '';
        elemento.className = 'mensagem';
        if (texto) {
            elemento.classList.add(`mensagem-${tipo}`);
        }
    },

    /** Mostra o histórico de estados da pilha ao longo das etapas de derivação. */
    mostrarHistoricoPilha(etapas) {
        const lista = this.refs.historicoPilha;
        lista.textContent = '';

        etapas.forEach(etapa => {
            const item = document.createElement('li');
            item.textContent = `Etapa ${etapa.etapa}: [${etapa.pilha.join(', ')}]`;
            lista.appendChild(item);
        });
    },

    /** Preenche a tabela de derivação (Etapa | Produção | Pilha | Saída). */
    mostrarTabelaDerivacao(etapas) {
        const corpo = this.refs.tabelaDerivacaoCorpo;
        corpo.textContent = '';

        etapas.forEach(etapa => {
            const linha = document.createElement('tr');

            const celulaEtapa = document.createElement('td');
            celulaEtapa.textContent = etapa.etapa;

            const celulaProducao = document.createElement('td');
            celulaProducao.textContent = etapa.producao;

            const celulaPilha = document.createElement('td');
            celulaPilha.textContent = `[${etapa.pilha.join(', ')}]`;

            const celulaSaida = document.createElement('td');
            celulaSaida.textContent = etapa.saida.length > 0 ? etapa.saida : '-';

            linha.appendChild(celulaEtapa);
            linha.appendChild(celulaProducao);
            linha.appendChild(celulaPilha);
            linha.appendChild(celulaSaida);
            corpo.appendChild(linha);
        });
    },

    /** Mostra a cadeia simplificada de formas sentenciais: S -> aS -> aaS -> aaab. */
    mostrarDerivacaoSimplificada(formasSentenciais) {
        const container = this.refs.derivacaoSimplificada;
        container.textContent = '';

        formasSentenciais.forEach((forma, indice) => {
            const item = document.createElement('div');
            item.className = 'derivacao-passo';
            item.textContent = forma.length > 0 ? forma : 'ε';
            container.appendChild(item);

            if (indice < formasSentenciais.length - 1) {
                const seta = document.createElement('div');
                seta.className = 'derivacao-seta';
                seta.textContent = '↓';
                container.appendChild(seta);
            }
        });
    },

    /** Mostra o resultado da conversão para expressão regular: só a equação final e o resultado. */
    mostrarExpressaoRegular(resultado) {
        this.refs.regexMensagem.textContent = '';
        this.refs.regexMensagem.className = 'mensagem';

        if (!resultado.sucesso) {
            this.refs.regexEquacaoFinal.textContent = '—';
            this.refs.regexResultado.textContent = '—';
            this.refs.regexMensagem.textContent = resultado.mensagem;
            this.refs.regexMensagem.classList.add('mensagem-erro');
            return;
        }

        this.refs.regexEquacaoFinal.textContent = `${resultado.simboloInicial} = ${resultado.resultado}`;
        this.refs.regexResultado.textContent = resultado.resultado;
    },

    /** Limpa toda a área de resultados (Seções 3 a 6), preservando os campos da gramática. */
    limparResultados() {
        this.mostrarMensagemDerivacao('', 'limpar');
        this.refs.sentencaGerada.textContent = '—';

        this.refs.historicoPilha.textContent = '';

        this.refs.tabelaDerivacaoCorpo.textContent = '';
        this.refs.derivacaoSimplificada.textContent = '';

        this.refs.regexEquacaoFinal.textContent = '—';
        this.refs.regexResultado.textContent = '—';
        this.refs.regexMensagem.textContent = '';
        this.refs.regexMensagem.className = 'mensagem';
    }
};
