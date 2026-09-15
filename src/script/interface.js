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
            etapas: [
                document.getElementById('etapa-1'),
                document.getElementById('etapa-2'),
                document.getElementById('etapa-3'),
                document.getElementById('etapa-4')
            ],
            stepperItens: [
                document.getElementById('stepper-item-1'),
                document.getElementById('stepper-item-2'),
                document.getElementById('stepper-item-3'),
                document.getElementById('stepper-item-4')
            ],

            inputNomeGramatica: document.getElementById('input-nome-gramatica'),

            inputNovoNaoTerminal: document.getElementById('input-novo-nao-terminal'),
            btnAddNaoTerminal: document.getElementById('btn-add-nao-terminal'),
            chipsNaoTerminais: document.getElementById('chips-nao-terminais'),

            inputNovoTerminal: document.getElementById('input-novo-terminal'),
            btnAddTerminal: document.getElementById('btn-add-terminal'),
            chipsTerminais: document.getElementById('chips-terminais'),

            chipsSimboloInicial: document.getElementById('chips-simbolo-inicial'),
            chipsLadoEsquerdo: document.getElementById('chips-lado-esquerdo'),

            btnExemploToggle: document.getElementById('btn-exemplo-toggle'),
            exemploPicker: document.getElementById('exemplo-picker'),
            selectExemplo: document.getElementById('select-exemplo'),
            btnCarregarExemplo: document.getElementById('btn-carregar-exemplo'),

            mensagemEtapa1: document.getElementById('mensagem-etapa-1'),
            btnProximo1: document.getElementById('btn-proximo-1'),

            producaoPreview: document.getElementById('producao-preview'),
            paletaTerminais: document.getElementById('paleta-terminais'),
            paletaNaoTerminais: document.getElementById('paleta-nao-terminais'),
            btnSimboloEpsilon: document.getElementById('btn-simbolo-epsilon'),
            btnRemoverUltimoSimbolo: document.getElementById('btn-remover-ultimo-simbolo'),
            btnLimparRhs: document.getElementById('btn-limpar-rhs'),
            btnAdicionarAlternativa: document.getElementById('btn-adicionar-alternativa'),
            listaProducoes: document.getElementById('lista-producoes'),
            mensagemEtapa2: document.getElementById('mensagem-etapa-2'),
            btnVoltar2: document.getElementById('btn-voltar-2'),
            btnProximo2: document.getElementById('btn-proximo-2'),

            resumoGramatica: document.getElementById('resumo-gramatica'),
            resumoNome: document.getElementById('resumo-nome'),
            resumoNaoTerminais: document.getElementById('resumo-nao-terminais'),
            resumoTerminais: document.getElementById('resumo-terminais'),
            resumoInicial: document.getElementById('resumo-inicial'),
            resumoProducoes: document.getElementById('resumo-producoes'),
            mensagemEtapa3: document.getElementById('mensagem-etapa-3'),
            btnVoltar3: document.getElementById('btn-voltar-3'),
            btnValidar: document.getElementById('btn-validar'),
            btnValidarTexto: document.getElementById('btn-validar-texto'),

            btnGerarSentenca: document.getElementById('btn-gerar-sentenca'),
            mensagemDerivacao: document.getElementById('mensagem-derivacao'),
            sentencaGerada: document.getElementById('sentenca-gerada'),
            derivacaoSimplificada: document.getElementById('derivacao-simplificada'),
            regexResultado: document.getElementById('regex-resultado'),
            regexMensagem: document.getElementById('regex-mensagem'),
            historicoPilha: document.getElementById('historico-pilha'),
            tabelaDerivacaoCorpo: document.getElementById('tabela-derivacao-corpo'),
            regexEquacaoFinal: document.getElementById('regex-equacao-final'),
            btnVoltar4: document.getElementById('btn-voltar-4'),
            btnNovaGramatica: document.getElementById('btn-nova-gramatica')
        };
    },

    // ---------------------------------------------------------------
    // Navegação entre etapas (stepper)
    // ---------------------------------------------------------------

    /** Mostra a etapa indicada (1 a 4), esconde as demais e move o foco para o título da etapa. */
    mostrarEtapa(numero) {
        this.refs.etapas.forEach((elemento, indice) => {
            elemento.hidden = (indice + 1) !== numero;
        });

        const titulo = this.refs.etapas[numero - 1].querySelector('h2');
        if (titulo) {
            titulo.focus();
        }
    },

    /**
     * Atualiza o visual do stepper: destaca a etapa atual, marca como
     * concluídas as etapas já passadas e permite clicar apenas até a
     * etapa mais avançada que o usuário já alcançou.
     */
    atualizarStepper(etapaAtual, maiorEtapaAlcancada) {
        this.refs.stepperItens.forEach((botao, indice) => {
            const numero = indice + 1;
            botao.classList.toggle('stepper-item-atual', numero === etapaAtual);
            botao.classList.toggle('stepper-item-concluido', numero < etapaAtual);
            botao.disabled = numero > maiorEtapaAlcancada;
            botao.setAttribute('aria-current', numero === etapaAtual ? 'step' : 'false');
        });
    },

    /** Mostra ou esconde o seletor de exemplos prontos. */
    alternarExemploPicker() {
        this.refs.exemploPicker.hidden = !this.refs.exemploPicker.hidden;
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

    // ---------------------------------------------------------------
    // Etapa 1 — Símbolos
    // ---------------------------------------------------------------

    obterNomeGramatica() {
        return this.refs.inputNomeGramatica.value;
    },

    definirNomeGramatica(nome) {
        this.refs.inputNomeGramatica.value = nome || '';
    },

    obterValorNovoNaoTerminal() {
        return this.refs.inputNovoNaoTerminal.value;
    },

    limparCampoNovoNaoTerminal() {
        this.refs.inputNovoNaoTerminal.value = '';
        this.refs.inputNovoNaoTerminal.focus();
    },

    obterValorNovoTerminal() {
        return this.refs.inputNovoTerminal.value;
    },

    limparCampoNovoTerminal() {
        this.refs.inputNovoTerminal.value = '';
        this.refs.inputNovoTerminal.focus();
    },

    /** Desenha os chips de não-terminais já cadastrados, cada um com um botão de remover. */
    renderizarChipsNaoTerminais(naoTerminais, aoRemover) {
        this._renderizarChipsRemoviveis(this.refs.chipsNaoTerminais, naoTerminais, aoRemover, 'Nenhum não-terminal cadastrado ainda.');
    },

    /** Desenha os chips de terminais já cadastrados, cada um com um botão de remover. */
    renderizarChipsTerminais(terminais, aoRemover) {
        this._renderizarChipsRemoviveis(this.refs.chipsTerminais, terminais, aoRemover, 'Nenhum terminal cadastrado ainda.');
    },

    _renderizarChipsRemoviveis(container, itens, aoRemover, textoVazio) {
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

    /** Desenha os não-terminais como chips selecionáveis (usado para símbolo inicial e lado esquerdo). */
    renderizarChipsSimboloInicial(naoTerminais, selecionado, aoSelecionar) {
        this._renderizarChipsSelecionaveis(this.refs.chipsSimboloInicial, naoTerminais, selecionado, aoSelecionar, 'Cadastre um não-terminal primeiro.');
    },

    renderizarChipsLadoEsquerdo(naoTerminais, selecionado, aoSelecionar) {
        this._renderizarChipsSelecionaveis(this.refs.chipsLadoEsquerdo, naoTerminais, selecionado, aoSelecionar, 'Cadastre um não-terminal primeiro.');
    },

    _renderizarChipsSelecionaveis(container, itens, selecionado, aoSelecionar, textoVazio) {
        container.textContent = '';

        if (itens.length === 0) {
            const vazio = document.createElement('span');
            vazio.className = 'dica-vazio';
            vazio.textContent = textoVazio;
            container.appendChild(vazio);
            return;
        }

        itens.forEach(simbolo => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip chip-selecionavel';
            chip.classList.toggle('chip-selecionado', simbolo === selecionado);
            chip.setAttribute('aria-pressed', simbolo === selecionado ? 'true' : 'false');
            chip.textContent = simbolo;
            chip.addEventListener('click', () => aoSelecionar(simbolo));
            container.appendChild(chip);
        });
    },

    /** Mostra uma mensagem de aviso/erro/sucesso na etapa indicada (1, 2 ou 3). */
    mostrarMensagemEtapa(numero, texto, tipo) {
        const elemento = [null, this.refs.mensagemEtapa1, this.refs.mensagemEtapa2, this.refs.mensagemEtapa3][numero];
        elemento.textContent = texto || '';
        elemento.className = 'etapa-mensagem';
        if (texto) {
            elemento.classList.add(`mensagem-${tipo}`);
        }
    },

    /** Mostra a lista de erros de validação da gramática na Etapa 3. */
    mostrarErrosGramatica(erros) {
        const elemento = this.refs.mensagemEtapa3;
        elemento.textContent = '';
        elemento.className = 'etapa-mensagem mensagem-erro';

        const titulo = document.createElement('p');
        titulo.textContent = 'A gramática ainda não é válida:';
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

    /** Habilita/desabilita o botão "Próximo" da Etapa 1. */
    habilitarProximo1(habilitado) {
        this.refs.btnProximo1.disabled = !habilitado;
    },

    /** Habilita/desabilita o botão "Próximo" da Etapa 2. */
    habilitarProximo2(habilitado) {
        this.refs.btnProximo2.disabled = !habilitado;
    },

    /** Troca o rótulo do botão da Etapa 3 entre "Validar gramática" e "Próximo". */
    definirRotuloBotaoValidar(rotulo) {
        this.refs.btnValidarTexto.textContent = rotulo;
    },

    // ---------------------------------------------------------------
    // Etapa 2 — Produções
    // ---------------------------------------------------------------

    /**
     * Desenha a paleta de terminais e não-terminais clicáveis para montar o lado
     * direito da produção. Depois que o último símbolo colocado é um não-terminal,
     * os demais botões ficam desabilitados (numa gramática regular, o não-terminal
     * só pode aparecer na última posição). O botão de ε (fixo no HTML) só fica
     * habilitado enquanto nada foi colocado ainda.
     */
    renderizarPaleta(naoTerminais, terminais, rhsAtual, aoClicarSimbolo) {
        const ultimoSimbolo = rhsAtual[rhsAtual.length - 1];
        const travado = naoTerminais.includes(ultimoSimbolo) || (rhsAtual.length === 1 && rhsAtual[0] === 'ε');

        this._renderizarPaletaGrupo(this.refs.paletaTerminais, terminais, travado, aoClicarSimbolo);
        this._renderizarPaletaGrupo(this.refs.paletaNaoTerminais, naoTerminais, travado, aoClicarSimbolo);

        const epsilonAntigo = this.refs.btnSimboloEpsilon;
        const epsilonNovo = epsilonAntigo.cloneNode(true);
        epsilonNovo.disabled = rhsAtual.length > 0;
        epsilonNovo.addEventListener('click', () => aoClicarSimbolo('ε'));
        epsilonAntigo.replaceWith(epsilonNovo);
        this.refs.btnSimboloEpsilon = epsilonNovo;
    },

    _renderizarPaletaGrupo(container, simbolos, travado, aoClicarSimbolo) {
        container.textContent = '';

        if (simbolos.length === 0) {
            const vazio = document.createElement('span');
            vazio.className = 'dica-vazio';
            vazio.textContent = 'Nenhum cadastrado.';
            container.appendChild(vazio);
            return;
        }

        simbolos.forEach(simbolo => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'simbolo-btn';
            botao.textContent = simbolo;
            botao.disabled = travado;
            botao.addEventListener('click', () => aoClicarSimbolo(simbolo));
            container.appendChild(botao);
        });
    },

    /**
     * Mostra a produção sendo montada como blocos visuais: "S → [a] [S]".
     * Quando não há lado esquerdo escolhido ou nada foi montado ainda,
     * mostra uma dica no lugar.
     */
    renderizarProducaoPreview(ladoEsquerdo, rhsAtual) {
        const container = this.refs.producaoPreview;
        container.textContent = '';

        if (!ladoEsquerdo) {
            const dica = document.createElement('span');
            dica.className = 'dica-vazio';
            dica.textContent = 'Escolha o lado esquerdo acima para começar a montar a produção.';
            container.appendChild(dica);
            return;
        }

        const rotulo = document.createElement('span');
        rotulo.className = 'producao-preview-lhs';
        rotulo.textContent = ladoEsquerdo;
        container.appendChild(rotulo);

        const seta = document.createElement('span');
        seta.className = 'producao-preview-seta';
        seta.textContent = '→';
        container.appendChild(seta);

        if (rhsAtual.length === 0) {
            const dica = document.createElement('span');
            dica.className = 'dica-vazio';
            dica.textContent = 'clique em um símbolo abaixo';
            container.appendChild(dica);
            return;
        }

        rhsAtual.forEach(simbolo => {
            const bloco = document.createElement('span');
            bloco.className = 'rhs-simbolo';
            bloco.textContent = simbolo;
            container.appendChild(bloco);
        });
    },

    /** Habilita/desabilita Desfazer, Limpar e Adicionar alternativa conforme o estado atual. */
    atualizarAcoesConstrutor(ladoEsquerdo, rhsAtual) {
        const temSimbolos = rhsAtual.length > 0;
        this.refs.btnRemoverUltimoSimbolo.disabled = !temSimbolos;
        this.refs.btnLimparRhs.disabled = !temSimbolos;
        this.refs.btnAdicionarAlternativa.disabled = !(ladoEsquerdo && temSimbolos);
    },

    /**
     * Mostra a lista de produções já adicionadas, agrupadas por lado esquerdo
     * e separadas por "|" (ex: "S → a | b | c"), cada alternativa com seu
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
            rotulo.textContent = `${esquerda} →`;
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

    // ---------------------------------------------------------------
    // Etapa 3 — Validar
    // ---------------------------------------------------------------

    /** Mostra o resumo formal N, T, P, S de uma gramática validada. */
    mostrarResumoGramatica(gramatica, nome) {
        this.refs.resumoNome.textContent = nome || '';
        this.refs.resumoNaoTerminais.textContent = gramatica.naoTerminais.join(', ');
        this.refs.resumoTerminais.textContent = gramatica.terminais.join(', ');
        this.refs.resumoInicial.textContent = gramatica.simboloInicial;

        this.refs.resumoProducoes.textContent = '';
        for (const naoTerminal in gramatica.producoes) {
            const alternativas = gramatica.producoes[naoTerminal]
                .map(rhs => rhs.join(''))
                .join(' | ');

            const item = document.createElement('li');
            item.textContent = `${naoTerminal} → ${alternativas}`;
            this.refs.resumoProducoes.appendChild(item);
        }

        this.refs.resumoGramatica.hidden = false;
    },

    // ---------------------------------------------------------------
    // Etapa 4 — Gerar
    // ---------------------------------------------------------------

    mostrarSentenca(sentenca) {
        this.refs.sentencaGerada.textContent = sentenca.length > 0 ? sentenca : '(sentença vazia)';
    },

    mostrarMensagemDerivacao(texto, tipo) {
        const elemento = this.refs.mensagemDerivacao;
        elemento.textContent = texto || '';
        elemento.className = 'etapa-mensagem';
        if (texto) {
            elemento.classList.add(`mensagem-${tipo}`);
        }
    },

    mostrarHistoricoPilha(etapas) {
        const lista = this.refs.historicoPilha;
        lista.textContent = '';

        etapas.forEach(etapa => {
            const item = document.createElement('li');
            item.textContent = `Etapa ${etapa.etapa}: [${etapa.pilha.join(', ')}]`;
            lista.appendChild(item);
        });
    },

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

    /** Mostra o resultado da conversão para expressão regular: a equação final e o resultado. */
    mostrarExpressaoRegular(resultado) {
        this.refs.regexMensagem.textContent = '';
        this.refs.regexMensagem.className = 'etapa-mensagem';

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

    /** Limpa a área de resultados da Etapa 4 (sentença, pilha, tabela, regex). */
    limparResultados() {
        this.mostrarMensagemDerivacao('', 'limpar');
        this.refs.sentencaGerada.textContent = '—';
        this.refs.historicoPilha.textContent = '';
        this.refs.tabelaDerivacaoCorpo.textContent = '';
        this.refs.derivacaoSimplificada.textContent = '';
        this.refs.regexEquacaoFinal.textContent = '—';
        this.refs.regexResultado.textContent = '—';
        this.refs.regexMensagem.textContent = '';
        this.refs.regexMensagem.className = 'etapa-mensagem';
    }
};
