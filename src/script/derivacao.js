/**
 * Algoritmo principal de derivação de uma Gramática Regular e de conversão
 * da gramática para uma Expressão Regular equivalente.
 *
 * A derivação é feita utilizando de fato a classe Pilha (pilha.js):
 * os símbolos da forma sentencial são empilhados e desempilhados, um a um,
 * até formar a sentença final ou até um limite de segurança ser atingido.
 */
const Derivacao = {
    LIMITE_ETAPAS_PADRAO: 60,
    LIMITE_TAMANHO_PADRAO: 80,
    LIMITE_NAO_TERMINAIS_REGEX: 8,
    LIMITE_TAMANHO_REGEX: 400,

    /**
     * Gera uma sentença a partir da gramática, realizando a derivação
     * passo a passo com o auxílio de uma Pilha real.
     *
     * Retorna um objeto com: sentenca, etapas (para a tabela),
     * formasSentenciais (para a derivação simplificada), interrompida e motivoInterrupcao.
     */
    gerarSentenca(gramatica, limiteEtapas = this.LIMITE_ETAPAS_PADRAO, limiteTamanho = this.LIMITE_TAMANHO_PADRAO) {
        const pilha = new Pilha();
        pilha.empilhar(gramatica.simboloInicial);

        const etapas = [];
        const formasSentenciais = [gramatica.simboloInicial];
        let saida = '';
        let numeroEtapa = 0;
        let interrompida = false;
        let motivoInterrupcao = '';

        while (!pilha.vazia()) {
            numeroEtapa++;

            if (numeroEtapa > limiteEtapas) {
                interrompida = true;
                motivoInterrupcao = `Número máximo de etapas (${limiteEtapas}) atingido. A derivação foi interrompida para evitar um laço infinito.`;
                break;
            }
            if (saida.length > limiteTamanho) {
                interrompida = true;
                motivoInterrupcao = `Tamanho máximo da sentença (${limiteTamanho} símbolos) atingido. A derivação foi interrompida.`;
                break;
            }

            const simbolo = pilha.desempilhar();

            if (simbolo === 'ε') {
                etapas.push({
                    etapa: numeroEtapa,
                    producao: 'ε (produção vazia)',
                    pilha: pilha.obterItens(),
                    saida
                });
                continue;
            }

            if (gramatica.ehTerminal(simbolo)) {
                saida += simbolo;
                etapas.push({
                    etapa: numeroEtapa,
                    producao: `"${simbolo}" → saída`,
                    pilha: pilha.obterItens(),
                    saida
                });
                continue;
            }

            const producoesDisponiveis = gramatica.obterProducoes(simbolo);
            if (producoesDisponiveis.length === 0) {
                interrompida = true;
                motivoInterrupcao = `Não existe produção definida para o não-terminal "${simbolo}".`;
                break;
            }

            const indiceEscolhido = Math.floor(Math.random() * producoesDisponiveis.length);
            const producaoEscolhida = producoesDisponiveis[indiceEscolhido];

            for (let i = producaoEscolhida.length - 1; i >= 0; i--) {
                if (producaoEscolhida[i] !== 'ε') {
                    pilha.empilhar(producaoEscolhida[i]);
                }
            }

            formasSentenciais.push(saida + this._simbolosRestantes(pilha));

            etapas.push({
                etapa: numeroEtapa,
                producao: `${simbolo} -> ${producaoEscolhida.join('')}`,
                pilha: pilha.obterItens(),
                saida
            });
        }

        return {
            sentenca: saida,
            etapas,
            formasSentenciais,
            interrompida,
            motivoInterrupcao
        };
    },

    /**
     * Lê a pilha do topo para o fundo, que corresponde à ordem esquerda->direita
     * dos símbolos ainda não processados na forma sentencial atual.
     */
    _simbolosRestantes(pilha) {
        return [...pilha.obterItens()].reverse().join('');
    },

    /**
     * Converte a gramática regular em uma expressão regular equivalente,
     * montando o sistema de equações e eliminando os não-terminais um a um:
     * quando uma equação é recursiva (X = αX + β), a recursão é eliminada
     * substituindo-a por X = α*β.
     */
    converterParaExpressaoRegular(gramatica) {
        if (!gramatica.ehGramaticaRegular()) {
            return {
                sucesso: false,
                mensagem: 'A gramática precisa estar no formato regular (linear à direita) para ser convertida em expressão regular.'
            };
        }

        if (gramatica.naoTerminais.length > this.LIMITE_NAO_TERMINAIS_REGEX) {
            return {
                sucesso: false,
                mensagem: `Gramática complexa demais: o conversor implementado suporta até ${this.LIMITE_NAO_TERMINAIS_REGEX} não-terminais.`
            };
        }

        const equacoes = this._montarEquacoes(gramatica);
        const outrosNaoTerminais = gramatica.naoTerminais.filter(nt => nt !== gramatica.simboloInicial);

        for (const variavel of outrosNaoTerminais) {
            const termosResolvidos = this._eliminarVariavel(equacoes, variavel);
            this._substituirEmTodas(equacoes, variavel, termosResolvidos);
        }

        const termosFinais = this._eliminarVariavel(equacoes, gramatica.simboloInicial);

        const aindaTemReferencia = termosFinais.some(termo => termo.referencia !== null);
        if (aindaTemReferencia) {
            return {
                sucesso: false,
                mensagem: 'Não foi possível eliminar todas as variáveis da gramática com o algoritmo implementado.'
            };
        }

        const regexFinal = this._formatarTermos(termosFinais);

        if (regexFinal.length > this.LIMITE_TAMANHO_REGEX) {
            return {
                sucesso: false,
                mensagem: 'A expressão regular resultante ficou grande demais para o algoritmo implementado.'
            };
        }

        return {
            sucesso: true,
            simboloInicial: gramatica.simboloInicial,
            resultado: regexFinal || 'ε'
        };
    },

    /**
     * Monta as equações da gramática: cada não-terminal A vira uma lista de termos
     * {prefixo, referencia}, onde "referencia" é o não-terminal que continua a
     * derivação (ou null quando o termo termina a sentença).
     */
    _montarEquacoes(gramatica) {
        const equacoes = {};

        for (const naoTerminal of gramatica.naoTerminais) {
            equacoes[naoTerminal] = [];

            for (const rhs of gramatica.obterProducoes(naoTerminal)) {
                if (rhs.length === 1 && rhs[0] === 'ε') {
                    equacoes[naoTerminal].push({ prefixo: 'ε', referencia: null });
                    continue;
                }

                const ultimoSimbolo = rhs[rhs.length - 1];
                if (gramatica.ehNaoTerminal(ultimoSimbolo)) {
                    equacoes[naoTerminal].push({
                        prefixo: rhs.slice(0, -1).join(''),
                        referencia: ultimoSimbolo
                    });
                } else {
                    equacoes[naoTerminal].push({
                        prefixo: rhs.join(''),
                        referencia: null
                    });
                }
            }
        }

        return equacoes;
    },

    /**
     * Elimina a recursão da equação de "variavel":
     * separa os termos que referenciam a própria variável (α) dos demais (β)
     * e resolve X = α*β. Atualiza a equação da variável com o resultado e
     * retorna os novos termos.
     */
    _eliminarVariavel(equacoes, variavel) {
        const termosOriginais = equacoes[variavel] || [];
        const termosProprios = termosOriginais.filter(termo => termo.referencia === variavel);
        const termosOutros = termosOriginais.filter(termo => termo.referencia !== variavel);

        let alfa = null;
        if (termosProprios.length > 0) {
            alfa = this._unirPrefixos(termosProprios.map(termo => termo.prefixo));
        }

        const estrelaAlfa = alfa !== null ? this._aplicarEstrela(alfa) : '';

        const novosTermos = termosOutros.length > 0
            ? termosOutros.map(termo => ({
                prefixo: this._concatenar(estrelaAlfa, termo.prefixo),
                referencia: termo.referencia
            }))
            : [{ prefixo: estrelaAlfa || 'ε', referencia: null }];

        equacoes[variavel] = novosTermos;

        return novosTermos;
    },

    /** Substitui a solução de "variavelEliminada" em todas as demais equações que a referenciam. */
    _substituirEmTodas(equacoes, variavelEliminada, termosSolucao) {
        for (const outraVariavel in equacoes) {
            if (outraVariavel === variavelEliminada) {
                continue;
            }

            const novosTermos = [];
            for (const termo of equacoes[outraVariavel]) {
                if (termo.referencia === variavelEliminada) {
                    for (const termoSolucao of termosSolucao) {
                        novosTermos.push({
                            prefixo: this._concatenar(termo.prefixo, termoSolucao.prefixo),
                            referencia: termoSolucao.referencia
                        });
                    }
                } else {
                    novosTermos.push(termo);
                }
            }
            equacoes[outraVariavel] = novosTermos;
        }
    },

    /** Indica se a string possui um "+" de união fora de qualquer parênteses. */
    _precisaParenteses(str) {
        let profundidade = 0;
        for (const caractere of str) {
            if (caractere === '(') profundidade++;
            else if (caractere === ')') profundidade--;
            else if (caractere === '+' && profundidade === 0) return true;
        }
        return false;
    },

    _envolverSeNecessario(str) {
        return this._precisaParenteses(str) ? `(${str})` : str;
    },

    /** Aplica o fecho de Kleene (*) a uma expressão, envolvendo em parênteses quando necessário. */
    _aplicarEstrela(str) {
        if (str === '' || str === 'ε') {
            return 'ε';
        }
        if (str.length === 1 && !this._precisaParenteses(str)) {
            return `${str}*`;
        }
        return `(${str})*`;
    },

    /** Concatena duas expressões regulares, tratando ε como elemento neutro. */
    _concatenar(a, b) {
        if (a === '' || a === 'ε') {
            return b === '' ? 'ε' : b;
        }
        if (b === '' || b === 'ε') {
            return a;
        }
        return this._envolverSeNecessario(a) + this._envolverSeNecessario(b);
    },

    /** Une (operador +) uma lista de prefixos textuais, sem repetição. */
    _unirPrefixos(prefixos) {
        return [...new Set(prefixos)].join(' + ');
    },

    /** Formata uma lista de termos {prefixo, referencia} como uma expressão regular textual. */
    _formatarTermos(termos) {
        if (!termos || termos.length === 0) {
            return 'ε';
        }

        const partes = termos.map(termo => {
            if (termo.referencia) {
                return this._concatenar(termo.prefixo, termo.referencia);
            }
            return termo.prefixo === '' ? 'ε' : termo.prefixo;
        });

        return [...new Set(partes)].join(' + ');
    }
};
