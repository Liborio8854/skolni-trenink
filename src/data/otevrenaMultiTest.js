/** Dočasná testovací otázka pro formát otevřená multi (hledání chyb). */
export const OTEVRENA_MULTI_TEST = [
  {
    id: 'cj-chyba-0002',
    subject: 'cestina',
    category: 'hledani-chyby',
    type: 'otevrena-multi',
    difficulty: 'pokrocily',
    points: 4,
    display: 'Najdi 4 chyby v textu',
    correct: 'vypravili, obilí, opekli, sbalili',
    hint: null,
    sourceText: 'V sobotu jsme se vypravily na výlet k rybníku. Cesta vedla podél pole, kde právě dozrávalo obylí. U vody jsme rozdělali malý ohníček a opekly si buřty. Odpoledne se obloha zatáhla a začalo pršet, tak jsme rychle sbalyli věci a vydali se domů.',
    payload: {
      prompt: 'Najdi ve výchozím textu čtyři slova zapsaná s pravopisnou chybou a napiš je PRAVOPISNĚ SPRÁVNĚ.',
      fieldCount: 4,
      answerType: 'text',
      correctAnswers: ['vypravili', 'obilí', 'opekli', 'sbalili'],
      acceptAnyOrder: true,
      caseSensitive: false,
    },
    explanation: 'vypravili/opekli — podmět my (chlapci) vyžaduje -i; obilí — není příbuzné s vyjmenovanými slovy po b; sbalili — sloveso balit, měkké i.',
  },
]
