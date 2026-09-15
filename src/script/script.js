/**
 * Ponto de entrada da aplicação.
 * Inicializa a interface, conecta os eventos e conduz o usuário por um
 * assistente de 4 etapas: Símbolos → Produções → Validar → Gerar.
 *
 * Mantém o "rascunho" da gramática que está sendo montada (não-terminais,
 * terminais, símbolo inicial e produções). Esse rascunho só é convertido
 * para o formato de texto que Gramatica.carregarDeTexto entende no
 * momento de validar (Etapa 3).
 */
(function () {
    const rascunho = {
        nome: '',
        naoTerminais: [],
        terminais: [],
        simboloInicial: '',
        ladoEsquerdoAtual: '',
        rhsAtual: [],
        producoes: []
    };

    let gramaticaAtual = null;
    let etapaAtual = 1;
    let maiorEtapaAlcancada = 1;

    function iniciarAplicacao() {
        Interface.inicializar();
        Interface.popularSelectExemplos(Exemplos.obterTodos());
        configurarEventos();
        renderizarTudo();
        irParaEtapa(1);
    }

    function configurarEventos() {
        Interface.refs.stepperItens.forEach((botao, indice) => {
            botao.addEventListener('click', () => irParaEtapa(indice + 1));
        });

        Interface.refs.btnExemploToggle.addEventListener('click', () => Interface.alternarExemploPicker());
        Interface.refs.btnCarregarExemplo.addEventListener('click', tratarCarregarExemplo);

        Interface.refs.inputNomeGramatica.addEventListener('input', tratarMudarNome);
        configurarCampoDeSimbolo(Interface.refs.inputNovoNaoTerminal, 'maiusculo');
        configurarCampoDeSimbolo(Interface.refs.inputNovoTerminal, 'minusculo');

        Interface.refs.btnAddNaoTerminal.addEventListener('click', tratarAdicionarNaoTerminal);
        Interface.refs.btnAddTerminal.addEventListener('click', tratarAdicionarTerminal);
        Interface.refs.inputNovoNaoTerminal.addEventListener('keydown', tratarEnterNaoTerminal);
        Interface.refs.inputNovoTerminal.addEventListener('keydown', tratarEnterTerminal);
        Interface.refs.btnProximo1.addEventListener('click', () => avancarPara(2));

        Interface.refs.btnRemoverUltimoSimbolo.addEventListener('click', tratarRemoverUltimoSimbolo);
        Interface.refs.btnLimparRhs.addEventListener('click', tratarLimparRhs);
        Interface.refs.btnAdicionarAlternativa.addEventListener('click', tratarAdicionarAlternativa);
        Interface.refs.btnVoltar2.addEventListener('click', () => irParaEtapa(1));
        Interface.refs.btnProximo2.addEventListener('click', () => avancarPara(3));

        Interface.refs.btnVoltar3.addEventListener('click', () => irParaEtapa(2));
        Interface.refs.btnValidar.addEventListener('click', tratarValidarOuProximo);

        Interface.refs.btnGerarSentenca.addEventListener('click', tratarGerarSentenca);
        Interface.refs.btnVoltar4.addEventListener('click', () => irParaEtapa(3));
        Interface.refs.btnNovaGramatica.addEventListener('click', tratarNovaGramatica);
    }

    /** Mantém nos campos apenas um caractere válido, usando a caixa esperada para cada tipo de símbolo. */
    function configurarCampoDeSimbolo(campo, tipo) {
        campo.addEventListener('input', () => {
            const normalizado = tipo === 'maiusculo'
                ? campo.value.toUpperCase()
                : campo.value.toLowerCase();

            const caracteresPermitidos = tipo === 'maiusculo' ? /[^A-Z]/g : /[^a-z0-9]/g;
            campo.value = normalizado.replace(caracteresPermitidos, '').slice(0, 1);
        });
    }

    function tratarEnterNaoTerminal(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            tratarAdicionarNaoTerminal();
        }
    }

    function tratarEnterTerminal(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            tratarAdicionarTerminal();
        }
    }

    /** Muda para a etapa indicada, se ela já tiver sido alcançada. */
    function irParaEtapa(numero) {
        if (numero > maiorEtapaAlcancada) {
            return;
        }
        etapaAtual = numero;
        Interface.mostrarEtapa(numero);
        Interface.atualizarStepper(etapaAtual, maiorEtapaAlcancada);
    }

    /** Avança para a etapa indicada, liberando-a permanentemente no stepper. */
    function avancarPara(numero) {
        maiorEtapaAlcancada = Math.max(maiorEtapaAlcancada, numero);
        irParaEtapa(numero);
    }

    /** Redesenha todos os widgets do assistente a partir do rascunho atual. */
    function renderizarTudo() {
        Interface.renderizarChipsNaoTerminais(rascunho.naoTerminais, removerNaoTerminal);
        Interface.renderizarChipsTerminais(rascunho.terminais, removerTerminal);
        Interface.renderizarChipsSimboloInicial(rascunho.naoTerminais, rascunho.simboloInicial, selecionarSimboloInicial);
        Interface.habilitarProximo1(
            rascunho.naoTerminais.length > 0 && rascunho.terminais.length > 0 && !!rascunho.simboloInicial
        );

        Interface.renderizarChipsLadoEsquerdo(rascunho.naoTerminais, rascunho.ladoEsquerdoAtual, selecionarLadoEsquerdo);
        Interface.renderizarPaleta(rascunho.naoTerminais, rascunho.terminais, rascunho.rhsAtual, clicarSimboloRhs);
        Interface.renderizarProducaoPreview(rascunho.ladoEsquerdoAtual, rascunho.rhsAtual);
        Interface.atualizarAcoesConstrutor(rascunho.ladoEsquerdoAtual, rascunho.rhsAtual);
        Interface.renderizarListaProducoes(rascunho.producoes, removerProducao);
        Interface.habilitarProximo2(rascunho.producoes.length > 0);
    }

    /** Qualquer mudança estrutural (N, T, S ou P) invalida uma validação anterior. */
    function invalidarGramaticaAtual() {
        gramaticaAtual = null;
        Interface.definirRotuloBotaoValidar('Validar gramática');
    }

    // ---- Etapa 1: símbolos ----

    function tratarMudarNome() {
        rascunho.nome = Interface.obterNomeGramatica();
    }

    function tratarAdicionarNaoTerminal() {
        const valor = Interface.obterValorNovoNaoTerminal().trim();
        if (!valor) {
            return;
        }
        if (!/^[A-Z]$/.test(valor)) {
            Interface.mostrarMensagemEtapa(1, 'O não-terminal deve ser uma única letra maiúscula de A a Z.', 'erro');
            return;
        }
        if (rascunho.naoTerminais.includes(valor)) {
            Interface.mostrarMensagemEtapa(1, `"${valor}" já foi adicionado como não-terminal.`, 'erro');
            return;
        }
        if (rascunho.terminais.includes(valor)) {
            Interface.mostrarMensagemEtapa(1, `"${valor}" já é um terminal — um símbolo não pode ser as duas coisas.`, 'erro');
            return;
        }

        invalidarGramaticaAtual();
        rascunho.naoTerminais.push(valor);
        Interface.limparCampoNovoNaoTerminal();
        Interface.mostrarMensagemEtapa(1, '', 'limpar');
        renderizarTudo();
    }

    function removerNaoTerminal(simbolo) {
        invalidarGramaticaAtual();
        rascunho.naoTerminais = rascunho.naoTerminais.filter(s => s !== simbolo);
        rascunho.producoes = rascunho.producoes.filter(p => p.esquerda !== simbolo && !p.direita.includes(simbolo));

        if (rascunho.simboloInicial === simbolo) rascunho.simboloInicial = '';
        if (rascunho.ladoEsquerdoAtual === simbolo) rascunho.ladoEsquerdoAtual = '';
        if (rascunho.rhsAtual.includes(simbolo)) rascunho.rhsAtual = [];

        renderizarTudo();
    }

    function tratarAdicionarTerminal() {
        const valor = Interface.obterValorNovoTerminal().trim();
        if (!valor) {
            return;
        }
        if (!/^[a-z0-9]$/.test(valor)) {
            Interface.mostrarMensagemEtapa(1, 'O terminal deve ser uma única letra minúscula de a a z ou um dígito de 0 a 9.', 'erro');
            return;
        }
        if (rascunho.terminais.includes(valor)) {
            Interface.mostrarMensagemEtapa(1, `"${valor}" já foi adicionado como terminal.`, 'erro');
            return;
        }
        if (rascunho.naoTerminais.includes(valor)) {
            Interface.mostrarMensagemEtapa(1, `"${valor}" já é um não-terminal — um símbolo não pode ser as duas coisas.`, 'erro');
            return;
        }

        invalidarGramaticaAtual();
        rascunho.terminais.push(valor);
        Interface.limparCampoNovoTerminal();
        Interface.mostrarMensagemEtapa(1, '', 'limpar');
        renderizarTudo();
    }

    function removerTerminal(simbolo) {
        invalidarGramaticaAtual();
        rascunho.terminais = rascunho.terminais.filter(s => s !== simbolo);
        rascunho.producoes = rascunho.producoes.filter(p => !p.direita.includes(simbolo));

        if (rascunho.rhsAtual.includes(simbolo)) rascunho.rhsAtual = [];

        renderizarTudo();
    }

    function selecionarSimboloInicial(simbolo) {
        invalidarGramaticaAtual();
        rascunho.simboloInicial = rascunho.simboloInicial === simbolo ? '' : simbolo;
        renderizarTudo();
    }

    // ---- Etapa 2: produções ----

    function selecionarLadoEsquerdo(simbolo) {
        rascunho.ladoEsquerdoAtual = rascunho.ladoEsquerdoAtual === simbolo ? '' : simbolo;
        rascunho.rhsAtual = [];
        renderizarTudo();
    }

    function clicarSimboloRhs(simbolo) {
        if (simbolo === 'ε') {
            if (rascunho.rhsAtual.length > 0) return;
            rascunho.rhsAtual = ['ε'];
        } else {
            const ultimoSimbolo = rascunho.rhsAtual[rascunho.rhsAtual.length - 1];
            const travado = rascunho.rhsAtual.length === 1 && rascunho.rhsAtual[0] === 'ε';
            if (travado || rascunho.naoTerminais.includes(ultimoSimbolo)) return;
            rascunho.rhsAtual.push(simbolo);
        }
        renderizarTudo();
    }

    function tratarRemoverUltimoSimbolo() {
        rascunho.rhsAtual.pop();
        renderizarTudo();
    }

    function tratarLimparRhs() {
        rascunho.rhsAtual = [];
        renderizarTudo();
    }

    function tratarAdicionarAlternativa() {
        if (!rascunho.ladoEsquerdoAtual || rascunho.rhsAtual.length === 0) {
            return;
        }

        invalidarGramaticaAtual();
        rascunho.producoes.push({ esquerda: rascunho.ladoEsquerdoAtual, direita: [...rascunho.rhsAtual] });
        rascunho.rhsAtual = [];
        renderizarTudo();
    }

    function removerProducao(indice) {
        invalidarGramaticaAtual();
        rascunho.producoes.splice(indice, 1);
        renderizarTudo();
    }

    // ---- Etapa 3: validar ----

    function tratarValidarOuProximo() {
        if (gramaticaAtual) {
            avancarPara(4);
            return;
        }

        const naoTerminaisTexto = rascunho.naoTerminais.join(', ');
        const terminaisTexto = rascunho.terminais.join(', ');
        const producoesTexto = rascunho.producoes.map(p => `${p.esquerda} -> ${p.direita.join('')}`).join('\n');
        const inicialTexto = rascunho.simboloInicial;

        const gramatica = new Gramatica();
        const valida = gramatica.carregarDeTexto(naoTerminaisTexto, terminaisTexto, producoesTexto, inicialTexto);

        if (!valida) {
            Interface.mostrarErrosGramatica(gramatica.obterErros());
            return;
        }

        gramaticaAtual = gramatica;
        Interface.mostrarMensagemEtapa(3, 'Gramática válida.', 'sucesso');
        Interface.mostrarResumoGramatica(gramatica, rascunho.nome);
        Interface.definirRotuloBotaoValidar('Próximo');
    }

    // ---- Etapa 4: gerar ----

    function tratarGerarSentenca() {
        if (!gramaticaAtual) {
            return;
        }

        const resultado = Derivacao.gerarSentenca(gramaticaAtual);

        Interface.mostrarSentenca(resultado.sentenca);
        Interface.mostrarMensagemDerivacao(resultado.interrompida ? resultado.motivoInterrupcao : '', resultado.interrompida ? 'erro' : 'limpar');
        Interface.mostrarDerivacaoSimplificada(resultado.formasSentenciais);
        Interface.mostrarHistoricoPilha(resultado.etapas);
        Interface.mostrarTabelaDerivacao(resultado.etapas);

        const expressaoRegular = Derivacao.converterParaExpressaoRegular(gramaticaAtual);
        Interface.mostrarExpressaoRegular(expressaoRegular);
    }

    function tratarNovaGramatica() {
        rascunho.nome = '';
        rascunho.naoTerminais = [];
        rascunho.terminais = [];
        rascunho.simboloInicial = '';
        rascunho.ladoEsquerdoAtual = '';
        rascunho.rhsAtual = [];
        rascunho.producoes = [];
        gramaticaAtual = null;
        maiorEtapaAlcancada = 1;

        Interface.definirNomeGramatica('');
        Interface.limparResultados();
        Interface.mostrarMensagemEtapa(1, '', 'limpar');
        Interface.mostrarMensagemEtapa(2, '', 'limpar');
        Interface.mostrarMensagemEtapa(3, '', 'limpar');
        Interface.definirRotuloBotaoValidar('Validar gramática');

        renderizarTudo();
        irParaEtapa(1);
    }

    // ---- Exemplos prontos ----

    function tratarCarregarExemplo() {
        const indice = Interface.obterIndiceExemploSelecionado();
        const exemplo = Exemplos.obterPorIndice(indice);

        if (!exemplo) {
            Interface.mostrarMensagemEtapa(1, 'Selecione um exemplo válido.', 'erro');
            return;
        }

        rascunho.naoTerminais = exemplo.naoTerminais.split(',').map(s => s.trim()).filter(Boolean);
        rascunho.terminais = exemplo.terminais.split(',').map(s => s.trim()).filter(Boolean);
        rascunho.simboloInicial = exemplo.inicial.trim();
        rascunho.ladoEsquerdoAtual = '';
        rascunho.rhsAtual = [];
        rascunho.producoes = converterTextoProducoesEmLista(exemplo.producoes, rascunho.naoTerminais);

        invalidarGramaticaAtual();
        Interface.limparResultados();
        Interface.mostrarMensagemEtapa(1, `Exemplo "${exemplo.nome}" carregado.`, 'info');
        renderizarTudo();
    }

    /** Converte o texto "S -> aS | ab" (formato dos exemplos) na mesma lista {esquerda, direita} do construtor guiado. */
    function converterTextoProducoesEmLista(producoesTexto, naoTerminais) {
        const auxiliar = new Gramatica();
        auxiliar.naoTerminais = naoTerminais;

        const lista = [];
        producoesTexto.split('\n').forEach(linha => {
            const partes = linha.split('->');
            if (partes.length !== 2) return;

            const esquerda = partes[0].trim();
            partes[1].split('|').forEach(alternativa => {
                lista.push({ esquerda, direita: auxiliar.tokenizar(alternativa) });
            });
        });

        return lista;
    }

    document.addEventListener('DOMContentLoaded', iniciarAplicacao);
})();
