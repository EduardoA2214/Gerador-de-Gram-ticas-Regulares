/**
 * Estrutura de dados Pilha (Stack) - disciplina LIFO.
 *
 * É a pilha REAL utilizada pelo algoritmo de derivação (derivacao.js)
 * para controlar os símbolos pendentes da forma sentencial durante
 * a derivação de uma Gramática Regular.
 */
class Pilha {
    constructor() {
        this.itens = [];
    }

    /** Insere um item no topo da pilha. */
    empilhar(item) {
        this.itens.push(item);
    }

    /** Remove e retorna o item do topo da pilha. Retorna null se estiver vazia. */
    desempilhar() {
        if (this.vazia()) {
            return null;
        }
        return this.itens.pop();
    }

    /** Retorna o item do topo sem removê-lo. Retorna null se estiver vazia. */
    topo() {
        if (this.vazia()) {
            return null;
        }
        return this.itens[this.itens.length - 1];
    }

    /** Indica se a pilha está vazia. */
    vazia() {
        return this.itens.length === 0;
    }

    /** Quantidade de itens atualmente na pilha. */
    tamanho() {
        return this.itens.length;
    }

    /** Remove todos os itens da pilha. */
    limpar() {
        this.itens = [];
    }

    /**
     * Retorna uma cópia do array interno (do fundo para o topo).
     * Uma cópia é retornada para que quem consome não altere o estado interno.
     */
    obterItens() {
        return [...this.itens];
    }
}
