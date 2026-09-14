/**
 * Ponto de entrada da aplicação.
 * Inicializa a interface, conecta os eventos dos botões e orquestra
 * a chamada dos demais módulos (exemplos, gramática, derivação, pilha).
 *
 * Também mantém o "rascunho" da gramática que está sendo montada de forma
 * guiada (Passos 1 a 4): não-terminais, terminais, símbolo inicial e as
 * produções já adicionadas. Esse rascunho é convertido para o formato de
 * texto que Gramatica.carregarDeTexto já entende só no momento de validar.
 */
(function () {
    const rascunho = {
        naoTerminais: [],
        terminais: [],
        simboloInicial: '',
        ladoEsquerdoAtual: '',
        rhsAtual: [],
        producoes: []
    };

    let gramaticaAtual = null;

    function iniciarAplicacao() {
        Interface.inicializar();
        Interface.popularSelectExemplos(Exemplos.obterTodos());
        renderizarRascunho();
        configurarEventos();
    }

    function configurarEventos() {
        Interface.refs.btnCarregarExemplo.addEventListener('click', tratarCarregarExemplo);

        configurarCampoDeSimbolo(Interface.refs.inputNovoNaoTerminal, 'maiusculo');
        configurarCampoDeSimbolo(Interface.refs.inputNovoTerminal, 'minusculo');

        Interface.refs.btnAddNaoTerminal.addEventListener('click', tratarAdicionarNaoTerminal);
        Interface.refs.btnAddTerminal.addEventListener('click', tratarAdicionarTerminal);
        Interface.refs.selectSimboloInicial.addEventListener('change', tratarSelecionarSimboloInicial);
        Interface.refs.selectLadoEsquerdo.addEventListener('change', tratarSelecionarLadoEsquerdo);
        Interface.refs.btnRemoverUltimoSimbolo.addEventListener('click', tratarRemoverUltimoSimbolo);
        Interface.refs.btnLimparRhs.addEventListener('click', tratarLimparRhs);
        Interface.refs.btnAdicionarAlternativa.addEventListener('click', tratarAdicionarAlternativa);

        Interface.refs.btnValidar.addEventListener('click', tratarValidarGramatica);
        Interface.refs.btnGerarSentenca.addEventListener('click', tratarGerarSentenca);
        Interface.refs.btnLimpar.addEventListener('click', tratarLimpar);
    }

    /** Mantém nos campos apenas uma letra, usando a caixa esperada para cada tipo de símbolo. */
    function configurarCampoDeSimbolo(campo, tipo) {
        campo.addEventListener('input', () => {
            const normalizado = tipo === 'maiusculo'
                ? campo.value.toUpperCase()
                : campo.value.toLowerCase();

            campo.value = normalizado.replace(/[^A-Za-z]/g, '').slice(0, 1);
        });
    }

    /** Redesenha todos os widgets do construtor guiado a partir do rascunho atual. */
    function renderizarRascunho() {
        Interface.renderizarChipsNaoTerminais(rascunho.naoTerminais, removerNaoTerminal);
        Interface.renderizarChipsTerminais(rascunho.terminais, removerTerminal);
        Interface.renderizarSelectSimboloInicial(rascunho.naoTerminais, rascunho.simboloInicial);
        Interface.renderizarSelectLadoEsquerdo(rascunho.naoTerminais, rascunho.ladoEsquerdoAtual);
        Interface.renderizarPaleta(rascunho.naoTerminais, rascunho.terminais, rascunho.rhsAtual, tratarClicarSimboloRhs);
        Interface.renderizarRhsAtual(rascunho.rhsAtual);
        Interface.renderizarListaProducoes(rascunho.producoes, removerProducao);
    }

    // ---- Passo 1: não-terminais ----

    function tratarAdicionarNaoTerminal() {
        const valor = Interface.obterValorNovoNaoTerminal().trim();
        if (!valor) {
            return;
        }
        if (!/^[A-Z]$/.test(valor)) {
            Interface.mostrarMensagemGramatica('O não-terminal deve ser uma única letra maiúscula de A a Z.', 'erro');
            return;
        }
        if (rascunho.naoTerminais.includes(valor)) {
            Interface.mostrarMensagemGramatica(`"${valor}" já foi adicionado como não-terminal.`, 'erro');
            return;
        }
        if (rascunho.terminais.includes(valor)) {
            Interface.mostrarMensagemGramatica(`"${valor}" já é um terminal — um símbolo não pode ser as duas coisas.`, 'erro');
            return;
        }

        rascunho.naoTerminais.push(valor);
        Interface.limparCampoNovoNaoTerminal();
        Interface.mostrarMensagemGramatica('', 'limpar');
        renderizarRascunho();
    }

    function removerNaoTerminal(simbolo) {
        rascunho.naoTerminais = rascunho.naoTerminais.filter(s => s !== simbolo);
        rascunho.producoes = rascunho.producoes.filter(p => p.esquerda !== simbolo && !p.direita.includes(simbolo));

        if (rascunho.simboloInicial === simbolo) rascunho.simboloInicial = '';
        if (rascunho.ladoEsquerdoAtual === simbolo) rascunho.ladoEsquerdoAtual = '';
        if (rascunho.rhsAtual.includes(simbolo)) rascunho.rhsAtual = [];

        renderizarRascunho();
    }

    // ---- Passo 2: terminais ----

    function tratarAdicionarTerminal() {
        const valor = Interface.obterValorNovoTerminal().trim();
        if (!valor) {
            return;
        }
        if (!/^[a-z]$/.test(valor)) {
            Interface.mostrarMensagemGramatica('O terminal deve ser uma única letra minúscula de a a z.', 'erro');
            return;
        }
        if (rascunho.terminais.includes(valor)) {
            Interface.mostrarMensagemGramatica(`"${valor}" já foi adicionado como terminal.`, 'erro');
            return;
        }
        if (rascunho.naoTerminais.includes(valor)) {
            Interface.mostrarMensagemGramatica(`"${valor}" já é um não-terminal — um símbolo não pode ser as duas coisas.`, 'erro');
            return;
        }

        rascunho.terminais.push(valor);
        Interface.limparCampoNovoTerminal();
        Interface.mostrarMensagemGramatica('', 'limpar');
        renderizarRascunho();
    }

    function removerTerminal(simbolo) {
        rascunho.terminais = rascunho.terminais.filter(s => s !== simbolo);
        rascunho.producoes = rascunho.producoes.filter(p => !p.direita.includes(simbolo));

        if (rascunho.rhsAtual.includes(simbolo)) rascunho.rhsAtual = [];

        renderizarRascunho();
    }

    // ---- Passo 3: símbolo inicial ----

    function tratarSelecionarSimboloInicial() {
        rascunho.simboloInicial = Interface.obterSimboloInicialSelecionado();
    }

    // ---- Passo 4: produções ----

    function tratarSelecionarLadoEsquerdo() {
        rascunho.ladoEsquerdoAtual = Interface.obterLadoEsquerdoSelecionado();
    }

    function tratarClicarSimboloRhs(simbolo) {
        if (simbolo === 'ε') {
            if (rascunho.rhsAtual.length > 0) return;
            rascunho.rhsAtual = ['ε'];
        } else {
            const ultimoSimbolo = rascunho.rhsAtual[rascunho.rhsAtual.length - 1];
            const travado = rascunho.rhsAtual.length === 1 && rascunho.rhsAtual[0] === 'ε';
            if (travado || rascunho.naoTerminais.includes(ultimoSimbolo)) return;
            rascunho.rhsAtual.push(simbolo);
        }
        renderizarRascunho();
    }

    function tratarRemoverUltimoSimbolo() {
        rascunho.rhsAtual.pop();
        renderizarRascunho();
    }

    function tratarLimparRhs() {
        rascunho.rhsAtual = [];
        renderizarRascunho();
    }

    function tratarAdicionarAlternativa() {
        if (!rascunho.ladoEsquerdoAtual) {
            Interface.mostrarMensagemGramatica('Selecione o não-terminal do lado esquerdo antes de adicionar a produção.', 'erro');
            return;
        }
        if (rascunho.rhsAtual.length === 0) {
            Interface.mostrarMensagemGramatica('Monte o lado direito clicando nos símbolos antes de adicionar a produção.', 'erro');
            return;
        }

        rascunho.producoes.push({ esquerda: rascunho.ladoEsquerdoAtual, direita: [...rascunho.rhsAtual] });
        rascunho.rhsAtual = [];
        Interface.mostrarMensagemGramatica('', 'limpar');
        renderizarRascunho();
    }

    function removerProducao(indice) {
        rascunho.producoes.splice(indice, 1);
        renderizarRascunho();
    }

    // ---- Exemplos prontos ----

    function tratarCarregarExemplo() {
        const indice = Interface.obterIndiceExemploSelecionado();
        const exemplo = Exemplos.obterPorIndice(indice);

        if (!exemplo) {
            Interface.mostrarMensagemGramatica('Selecione um exemplo válido.', 'erro');
            return;
        }

        rascunho.naoTerminais = exemplo.naoTerminais.split(',').map(s => s.trim()).filter(Boolean);
        rascunho.terminais = exemplo.terminais.split(',').map(s => s.trim()).filter(Boolean);
        rascunho.simboloInicial = exemplo.inicial.trim();
        rascunho.ladoEsquerdoAtual = '';
        rascunho.rhsAtual = [];
        rascunho.producoes = converterTextoProducoesEmLista(exemplo.producoes, rascunho.naoTerminais);

        gramaticaAtual = null;
        Interface.limparResultados();
        Interface.mostrarMensagemGramatica(`Exemplo "${exemplo.nome}" carregado. Clique em "Validar Gramática" para continuar.`, 'info');
        renderizarRascunho();
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
                const direita = auxiliar.tokenizar(alternativa);
                lista.push({ esquerda, direita });
            });
        });

        return lista;
    }

    // ---- Validação e geração ----

    function tratarValidarGramatica() {
        const naoTerminaisTexto = rascunho.naoTerminais.join(', ');
        const terminaisTexto = rascunho.terminais.join(', ');
        const producoesTexto = rascunho.producoes.map(p => `${p.esquerda} -> ${p.direita.join('')}`).join('\n');
        const inicialTexto = rascunho.simboloInicial;

        const gramatica = new Gramatica();
        const valida = gramatica.carregarDeTexto(naoTerminaisTexto, terminaisTexto, producoesTexto, inicialTexto);

        if (!valida) {
            gramaticaAtual = null;
            Interface.mostrarErrosGramatica(gramatica.obterErros());
            Interface.limparResultados();
            return;
        }

        gramaticaAtual = gramatica;
        Interface.mostrarMensagemGramatica('Gramática válida! Você já pode gerar sentenças.', 'sucesso');
        Interface.mostrarResumoGramatica(gramatica);

        const expressaoRegular = Derivacao.converterParaExpressaoRegular(gramatica);
        Interface.mostrarExpressaoRegular(expressaoRegular);
    }

    function tratarGerarSentenca() {
        if (!gramaticaAtual) {
            Interface.mostrarMensagemGramatica('Valide uma gramática antes de gerar sentenças.', 'erro');
            return;
        }

        const resultado = Derivacao.gerarSentenca(gramaticaAtual);

        Interface.mostrarSentenca(resultado.sentenca);
        Interface.mostrarMensagemDerivacao(resultado.interrompida ? resultado.motivoInterrupcao : '', resultado.interrompida ? 'erro' : 'limpar');
        Interface.mostrarDerivacaoSimplificada(resultado.formasSentenciais);
        Interface.mostrarHistoricoPilha(resultado.etapas);
        Interface.mostrarTabelaDerivacao(resultado.etapas);
    }

    function tratarLimpar() {
        Interface.limparResultados();
    }

    document.addEventListener('DOMContentLoaded', iniciarAplicacao);
})();
