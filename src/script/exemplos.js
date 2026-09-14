/**
 * Gramáticas regulares de exemplo, prontas para carregar na interface.
 * Cada exemplo já vem no formato de texto aceito pelos campos da Seção 2.
 */
const Exemplos = {
    lista: [
        {
            nome: 'Gramática 1 — a*ab (a\'s seguidos de "ab")',
            naoTerminais: 'S',
            terminais: 'a, b',
            producoes: 'S -> aS | ab',
            inicial: 'S'
        },
        {
            nome: 'Gramática 2 — cadeias de a/b terminadas em "a"',
            naoTerminais: 'S',
            terminais: 'a, b',
            producoes: 'S -> aS | bS | a',
            inicial: 'S'
        },
        {
            nome: 'Gramática 3 — número par de 1\'s sobre {0,1}',
            naoTerminais: 'S, A',
            terminais: '0, 1',
            producoes: 'S -> 0S | 1A | ε\nA -> 0A | 1S',
            inicial: 'S'
        }
    ],

    /** Retorna todos os exemplos cadastrados. */
    obterTodos() {
        return this.lista;
    },

    /** Retorna um exemplo específico pelo índice, ou null se não existir. */
    obterPorIndice(indice) {
        return this.lista[indice] || null;
    }
};
