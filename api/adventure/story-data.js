const facts = {
    pltResearch: 'Ethan’s resume lists a research internship at Para La Tierra in Pilar, Paraguay, from January through April 2024.',
    education: 'Ethan’s resume lists a Bachelor of Science in Sustainable Design and a minor in Architectural Studies at the University of Illinois Urbana-Champaign, with expected graduation in December 2026.',
    wallAssembly: 'The 3 Little Pigs Wall Assembly is a 2025 sustainable construction project at the University of Illinois using traditional stick framing and R-52 straw bale insulation.'
};

const scenes = {
    bridge: { factIds: [], choices: ['river-notes', 'road-ahead', 'bicycle'] },
    'river-notes': { factIds: ['pltResearch'], choices: ['research-artifact', 'road-ahead', 'bridge'] },
    'research-artifact': { factIds: ['pltResearch', 'education'], choices: ['road-ahead', 'bicycle'] },
    'road-ahead': { factIds: [], choices: ['drawing', 'bridge'] },
    bicycle: { factIds: [], choices: ['drawing', 'road-ahead', 'bridge'] },
    drawing: { factIds: ['wallAssembly'], choices: ['project-placeholder', 'road-ahead'] },
    'project-placeholder': { factIds: ['wallAssembly'], choices: ['bridge', 'road-ahead'] }
};

module.exports = { facts, scenes };
