/** Dočasné testovací otázky pro formát A/N svazek (pravopis-iy). */
export const PRAVOPIS_IY_AN_TEST = [
  {
    id: 'cj-pravopis-iy-0001',
    subject: 'cestina',
    category: 'pravopis-iy',
    type: 'an-svazek',
    difficulty: 'zacatecnik',
    points: 2,
    display: 'Pravopis i/y — svazek 1',
    correct: 'uvadly, spaly',
    hint: null,
    payload: {
      prompt: 'Rozhodni o každé z následujících vět, zda je zapsána pravopisně správně.',
      statements: [
        { id: '1', text: 'Chlapci si na hřišti hráli až do večera.', correct: true },
        { id: '2', text: 'Květiny na okně už dávno uvadli.', correct: false },
        { id: '3', text: 'Slyšel jsem, jak ptáci zpívali v korunách stromů.', correct: true },
        { id: '4', text: 'Naše kočky spali celé odpoledne na gauči.', correct: false },
      ],
    },
    explanation: 'Podmět rodu ženského v množném čísle (květiny, kočky) vyžaduje v příčestí koncovku -y: uvadly, spaly.',
    sourceText: null,
  },
  {
    id: 'cj-pravopis-iy-0003',
    subject: 'cestina',
    category: 'pravopis-iy',
    type: 'an-svazek',
    difficulty: 'zacatecnik',
    points: 2,
    display: 'Pravopis i/y — svazek 2',
    correct: 'rozviklané, narušily',
    hint: null,
    payload: {
      prompt: 'Rozhodni o každé z následujících vět, zda je zapsána pravopisně správně.',
      statements: [
        { id: '1', text: 'To staré rozvyklané zábradlí se musí vyměnit.', correct: false },
        { id: '2', text: 'Na půdě jsem našel několik papírových sáčků.', correct: true },
        { id: '3', text: 'Náš plánovaný pobyt narušili nečekané okolnosti.', correct: false },
        { id: '4', text: 'Opakované výzvy jsem si všiml až na poslední chvíli.', correct: true },
      ],
    },
    explanation: 'Správně je rozviklané (viklat). Okolnosti (rod ženský) → narušily. Opakované výzvy — správně.',
    sourceText: null,
  },
]
