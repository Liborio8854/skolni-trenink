/** Dočasná testovací otázka pro formát přiřazování. */
export const PRIRAZOVANI_TEST = [
  {
    id: 'cj-prirazovani-0001',
    subject: 'cestina',
    category: 'pravopis-iy',
    type: 'prirazovani',
    difficulty: 'pokrocily',
    points: 3,
    display: 'Přiřazování — nespisovné tvary',
    correct: '5.1→A, 5.2→E, 5.3→D',
    hint: null,
    sourceText: null,
    payload: {
      prompt: 'Přiřaď k jednotlivým souvětím odpovídající tvrzení. (Podtržené tvary: Nevim / Pozítří / spad)',
      items: [
        { id: '5.1', text: 'Nevim, proč nechává věcem volný průběh.' },
        { id: '5.2', text: 'Pozítří jede k rodičům a těší se na koláče.' },
        { id: '5.3', text: 'Když Tomáš spad z kola, měl škrábance.' },
      ],
      options: [
        { id: 'A', text: 'Pouze první podtržený tvar je nespisovný.' },
        { id: 'B', text: 'Pouze třetí podtržený tvar je nespisovný.' },
        { id: 'C', text: 'Dva tvary jsou nespisovné, první a druhý.' },
        { id: 'D', text: 'Dva tvary jsou nespisovné, první a třetí.' },
        { id: 'E', text: 'Dva tvary jsou nespisovné, druhý a třetí.' },
      ],
      correctMapping: { '5.1': 'A', '5.2': 'E', '5.3': 'D' },
    },
    explanation: 'Správné přiřazení: 5.1 → A, 5.2 → E, 5.3 → D. Nevim je nespisovné; spad je nespisovné (spadl); Pozítří je spisovné.',
  },
]
