const facts = {
    pltResearch: "Ethan’s resume lists a research internship at Para La Tierra in Pilar, Paraguay, from January through April 2024.",
    education: "Ethan’s resume lists a Bachelor of Science in Sustainable Design and a minor in Architectural Studies at the University of Illinois Urbana-Champaign, with expected graduation in December 2026.",
    wallAssembly: "The 3 Little Pigs Wall Assembly is a 2025 sustainable construction project at the University of Illinois using traditional stick framing and R-52 straw bale insulation.",
    "plt-method": "Sampling used six days at each site, with 10 transects of 10 m each in the morning and afternoon, at wading depth.",
    "plt-question": "The research asked whether ongoing construction of the Costanera had affected fish and macroinvertebrate diversity, population sizes, distribution and abundance.",
    "plt-count": "The project collected and cataloged 6,569 fish across more than 40 species from six research sites.",
    "plt-baseline": "The study could not draw conclusions about the Costanera's impact because the municipality of Pilar did not share its pre-construction data.",
    "plt-low-water": "During one low-water sampling day, fish crowded into the remaining water, producing a very large catch in unusually warm conditions.",
    "plt-id": "Many specimens were small and similar-looking, which made species identification the hardest part of the work.",
    "tlp-three-pigs": "The assembly uses the materials of all three little pigs from the children's story: straw bale insulation, stick framing and brick veneer.",
    "tlp-rvalue": "The assembly's straw bale insulation is documented at R-52 through the wall and R-40 behind the pony wall, based on R-1.4 per inch."
};

const scenes = {
    bridge: { factIds: ["plt-method"], choices: ["river-notes", "road-ahead", "bicycle"] },
    'river-notes': { factIds: ["pltResearch", "plt-method", "plt-low-water"], choices: ["research-artifact", "road-ahead", "bridge"] },
    'research-artifact': { factIds: ["plt-question", "plt-baseline", "plt-count", "plt-id", "education"], choices: ["road-ahead", "bicycle"] },
    'road-ahead': { factIds: [], choices: ["drawing", "bridge"] },
    bicycle: { factIds: [], choices: ["drawing", "road-ahead", "bridge"] },
    drawing: { factIds: ["wallAssembly", "tlp-three-pigs", "tlp-rvalue"], choices: ["project-placeholder", "road-ahead"] },
    'project-placeholder': { factIds: ["wallAssembly"], choices: ["bridge", "road-ahead"] }
};

module.exports = { facts, scenes };
