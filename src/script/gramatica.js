class Gramatica {
    constructor() {
        this.naoTerminais = [];
        this.terminais = [];
        this.producoes = {};
        this.simboloInicial = '';
        this.erros = [];
    }

    carregarDeTexto(naoTerminaisTexto, terminaisTexto, producoesTexto, inicialTexto) {
        this.erros = [];
        this.naoTerminais = this._parseLista(naoTerminaisTexto);
        this.terminais = this._parseLista(terminaisTexto);
        this.simboloInicial = (inicialTexto || '').trim();
        this.producoes = this._parseProducoes(producoesTexto || '');

        return this.validar();
    }

    /** Transforma uma lista separada por vírgulas em um array de símbolos. */
    _parseLista(texto) {
        if (!texto) {
            return [];
        }
        return texto
            .split(',')
            .map(simbolo => simbolo.trim())
            .filter(simbolo => simbolo.length > 0);
    }

    _parseProducoes(texto) {
        const producoes = {};
        const linhas = texto.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);

        for (const linha of linhas) {
            const partes = linha.split('->');

            if (partes.length !== 2) {
                this.erros.push(`Produção com formato inválido (esperado "A -> b"): "${linha}"`);
                continue;
            }

            const ladoEsquerdo = partes[0].trim();
            const ladoDireito = partes[1].trim();

            if (!ladoEsquerdo) {
                this.erros.push(`Produção sem lado esquerdo: "${linha}"`);
                continue;
            }
            if (!ladoDireito) {
                this.erros.push(`Produção sem lado direito: "${linha}"`);
                continue;
            }

            const alternativas = ladoDireito.split('|').map(alt => alt.trim());
            if (!producoes[ladoEsquerdo]) {
                producoes[ladoEsquerdo] = [];
            }

            for (const alternativa of alternativas) {
                if (alternativa.length === 0) {
                    this.erros.push(`Alternativa vazia na produção: "${linha}"`);
                    continue;
                }
                producoes[ladoEsquerdo].push(this.tokenizar(alternativa));
            }
        }

        return producoes;
    }

    tokenizar(alternativa) {
        const normalizada = alternativa.trim();
        if (normalizada === 'ε' || normalizada === '&' || normalizada.toLowerCase() === 'epsilon') {
            return ['ε'];
        }

        const simbolos = [];
        const candidatosNaoTerminais = [...this.naoTerminais].sort((a, b) => b.length - a.length);
        let i = 0;

        while (i < normalizada.length) {
            if (normalizada[i] === ' ') {
                i++;
                continue;
            }

            let combinou = false;
            for (const naoTerminal of candidatosNaoTerminais) {
                if (naoTerminal.length > 0 && normalizada.startsWith(naoTerminal, i)) {
                    simbolos.push(naoTerminal);
                    i += naoTerminal.length;
                    combinou = true;
                    break;
                }
            }

            if (!combinou) {
                simbolos.push(normalizada[i]);
                i++;
            }
        }

        return simbolos;
    }

    /** Verifica se um símbolo pertence ao conjunto de terminais. */
    ehTerminal(simbolo) {
        return this.terminais.includes(simbolo);
    }

    /** Verifica se um símbolo pertence ao conjunto de não-terminais. */
    ehNaoTerminal(simbolo) {
        return this.naoTerminais.includes(simbolo);
    }

    /** Retorna as alternativas de produção de um não-terminal (array de arrays de símbolos). */
    obterProducoes(naoTerminal) {
        return this.producoes[naoTerminal] || [];
    }

    validar() {
        if (this.naoTerminais.length === 0) {
            this.erros.push('O conjunto de não-terminais (N) não pode estar vazio.');
        }

        if (this.terminais.length === 0) {
            this.erros.push('O conjunto de terminais (T) não pode estar vazio.');
        }

        const naoTerminaisInvalidos = this.naoTerminais.filter(simbolo => !/^[A-Z]$/.test(simbolo));
        if (naoTerminaisInvalidos.length > 0) {
            this.erros.push(`Os não-terminais [${naoTerminaisInvalidos.join(', ')}] devem ser letras maiúsculas de A a Z.`);
        }

        const terminaisInvalidos = this.terminais.filter(simbolo => !/^[a-z0-9]$/.test(simbolo));
        if (terminaisInvalidos.length > 0) {
            this.erros.push(`Os terminais [${terminaisInvalidos.join(', ')}] devem ser letras minúsculas de a a z ou dígitos de 0 a 9.`);
        }

        const intersecao = this.naoTerminais.filter(nt => this.terminais.includes(nt));
        if (intersecao.length > 0) {
            this.erros.push(`Os símbolos [${intersecao.join(', ')}] não podem ser terminais e não-terminais ao mesmo tempo.`);
        }

        if (!this.simboloInicial) {
            this.erros.push('O símbolo inicial (S) deve ser informado.');
        } else if (!this.ehNaoTerminal(this.simboloInicial)) {
            this.erros.push(`O símbolo inicial "${this.simboloInicial}" deve pertencer ao conjunto de não-terminais.`);
        }

        const ladosEsquerdos = Object.keys(this.producoes);
        if (ladosEsquerdos.length === 0) {
            this.erros.push('A gramática deve possuir ao menos uma produção.');
        }

        for (const ladoEsquerdo of ladosEsquerdos) {
            if (!this.ehNaoTerminal(ladoEsquerdo)) {
                this.erros.push(`O lado esquerdo "${ladoEsquerdo}" de uma produção não é um não-terminal declarado.`);
            }

            for (const producaoRhs of this.producoes[ladoEsquerdo]) {
                for (const simbolo of producaoRhs) {
                    if (simbolo === 'ε') {
                        continue;
                    }
                    if (!this.ehTerminal(simbolo) && !this.ehNaoTerminal(simbolo)) {
                        this.erros.push(`O símbolo "${simbolo}" usado em uma produção de "${ladoEsquerdo}" não foi declarado como terminal nem como não-terminal.`);
                    }
                }
            }
        }

        if (this.simboloInicial && ladosEsquerdos.length > 0 && !this.producoes[this.simboloInicial]) {
            this.erros.push(`O símbolo inicial "${this.simboloInicial}" não possui nenhuma produção.`);
        }

        if (this.erros.length === 0 && !this.ehGramaticaRegular()) {
            this.erros.push('A gramática não está no formato de Gramática Regular (linear à direita): cada produção deve ter no máximo um não-terminal, obrigatoriamente na última posição.');
        }

        return this.erros.length === 0;
    }

    ehGramaticaRegular() {
        for (const ladoEsquerdo in this.producoes) {
            for (const rhs of this.producoes[ladoEsquerdo]) {
                if (rhs.length === 1 && rhs[0] === 'ε') {
                    continue;
                }

                for (let i = 0; i < rhs.length; i++) {
                    const simbolo = rhs[i];
                    const ehUltimoSimbolo = i === rhs.length - 1;

                    if (this.ehNaoTerminal(simbolo)) {
                        if (!ehUltimoSimbolo) {
                            return false;
                        }
                    } else if (!this.ehTerminal(simbolo)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /** Retorna a lista de mensagens de erro encontradas na última validação. */
    obterErros() {
        return [...this.erros];
    }
}
