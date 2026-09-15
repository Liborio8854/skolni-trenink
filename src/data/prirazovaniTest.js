/** Testovací otázka pro formát přiřazování. */
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
      prompt: 'Přiřaď k jednotlivým souvětím odpovídající tvrzení. Vyznačené tvary jsou psány VELKÝMI PÍSMENY.',
      items: [
        {
          id: '5.1',
          text: 'NEVIM, proč nechává VĚCEM volný průběh a na NIČEM mu nezáleží.',
        },
        {
          id: '5.2',
          text: 'Pozítří jede k RODIČŮM a už se těší na MAMINČINÝ koláče s MERUŇKAMA.',
        },
        {
          id: '5.3',
          text: 'Když Tomáš SPAD z kola, na RUKÁCH měl škrábance a křičel jako MALÝ dítě.',
        },
      ],
      options: [
        { id: 'A', text: 'Pouze první vyznačený tvar je nespisovný.' },
        { id: 'B', text: 'Pouze třetí vyznačený tvar je nespisovný.' },
        { id: 'C', text: 'Dva tvary jsou nespisovné, první a druhý.' },
        { id: 'D', text: 'Dva tvary jsou nespisovné, první a třetí.' },
        { id: 'E', text: 'Dva tvary jsou nespisovné, druhý a třetí.' },
      ],
      correctMapping: { '5.1': 'A', '5.2': 'E', '5.3': 'D' },
    },
    explanation:
      '5.1: nespisovné je jen NEVIM (správně nevím); VĚCEM a NIČEM jsou spisovné → A. '
      + '5.2: RODIČŮM je spisovné; MAMINČINÝ (správně maminčiny) a MERUŇKAMA (správně meruňkami) jsou nespisovné → E. '
      + '5.3: SPAD (správně spadl) a MALÝ dítě (správně malé dítě) jsou nespisovné; RUKÁCH je spisovné → D.',
  },
]
