window.adventureContent = {
    startScenes: ['bridge'],
    facts: {
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
    },
    scenes: {
        bridge: {
            chapter: "CHAPTER 01",
            eyebrow: "A RIVER AT WADING DEPTH",
            beats: ["The river comes first, and someone is working in it.", "Ethan is introduced doing fieldwork, before any biography.", "The visitor chooses what to pay attention to."],
            factIds: ["plt-method"],
            paragraphs: [
                "The river runs brown and quick under the bridge. You stop at the rail.",
                "Below, someone stands knee-deep in the current and walks a measured line upstream. Ten meters. A pause. Ten meters again.",
                "“What are you doing down there?”",
                "“Sampling for fish.” Water runs off both sleeves as the figure wades out and offers a wet hand. “Ethan.”"
            ],
            choices: [
                { label: "Ask about the river.", next: "river-notes" },
                { label: "Ask where the road goes from here.", next: "road-ahead" },
                { label: "Look at the bicycle.", next: "bicycle" }
            ]
        },
        'river-notes': {
            chapter: "CHAPTER 01",
            eyebrow: "FIELD NOTES, STILL DAMP",
            beats: ["Ethan hands over a field pamphlet from Paraguay.", "The method and one day on the river make the research physical.", "The visitor chooses whether to read on, move on, or go back."],
            factIds: ["pltResearch", "plt-method", "plt-low-water"],
            paragraphs: [
                "Ethan pulls a folded pamphlet out of the bicycle basket and puts it in your hands. The edges are wet.",
                "Pilar, Paraguay, January to April 2024. Six sites on the river, six sampling days at each, ten transects of ten meters at wading depth.",
                "A note in the margin, underlined twice: one day the water dropped. The fish crowded into what remained, the shallows warmed, and the catch came up enormous. A good day for the count and a bad one for the fish."
            ],
            artifacts: [{ title: "FIELD NOTES", detail: "Para La Tierra · Pilar, Paraguay · 2024", type: "field note", source: "resume.html" }],
            choices: [
                { label: "Read the pamphlet.", next: "research-artifact" },
                { label: "Ask what comes next.", next: "road-ahead" },
                { label: "Go back to the bridge.", next: "bridge" }
            ]
        },
        'research-artifact': {
            chapter: "CHAPTER 01",
            eyebrow: "A BEFORE THAT NEVER ARRIVED",
            beats: ["The research question and its missing baseline.", "What the record holds instead.", "Ethan’s education comes into view."],
            factIds: ["plt-question", "plt-baseline", "plt-count", "plt-id", "education"],
            paragraphs: [
                "The study needed a before and an after. A riverfront development, the Costanera, was going up along Pilar. Had the fish and the insects in the water already felt it?",
                "The before belonged to the municipality of Pilar, and the municipality never shared it. So the pamphlet holds only the after: 6,569 fish from more than forty species. Many were so small and so alike that naming them was the hardest part of the job.",
                "Ethan studies sustainable design (with a minor in architectural studies) at the University of Illinois Urbana-Champaign, finishing in December 2026."
            ],
            artifacts: [{ title: "RESEARCH RECORD", detail: "6,569 fish · 40+ species · six sites · Pilar, Paraguay · 2024", type: "source card", source: "resume.html" }],
            choices: [
                { label: "Follow the road.", next: "road-ahead" },
                { label: "Ask about the things Ethan makes.", next: "bicycle" }
            ]
        },
        'road-ahead': {
            chapter: "CHAPTER 02",
            eyebrow: "THE ROAD AHEAD",
            beats: ["The story turns from fieldwork toward making.", "Two objects offer two directions."],
            factIds: [],
            paragraphs: [
                "Ethan hauls the bicycle out of the grass. A rolled drawing rides under the frame, lashed on with twine.",
                "No sign says where the road goes. There’s the drawing, and there’s the pamphlet you’re still holding, drying stiff in the sun."
            ],
            artifacts: [{ title: "A ROLLED DRAWING", detail: "A wall, cut open", type: "illustration" }, { title: "A FIELD PAMPHLET", detail: "Six sites on a river in Paraguay", type: "document" }],
            choices: [
                { label: "Ask to see the drawing.", next: "drawing" },
                { label: "Keep moving.", next: "bridge" }
            ]
        },
        bicycle: {
            chapter: "CHAPTER 01",
            eyebrow: "THE BICYCLE",
            beats: ["What Ethan carries says something about how the work gets made.", "The visitor chooses between the drawing and the road."],
            factIds: [],
            paragraphs: [
                "Ethan has loaded the bicycle well past sense: a field bag swinging from the handlebars, a drawing lashed under the frame, tires still wet from the river.",
                "Mud on the chain, and a kickstand that leans. Nothing about it looks ready to stop."
            ],
            choices: [
                { label: "Ask what’s in the drawing.", next: "drawing" },
                { label: "Ask where the road goes.", next: "road-ahead" },
                { label: "Go back to the bridge.", next: "bridge" }
            ]
        },
        drawing: {
            chapter: "CHAPTER 02",
            eyebrow: "A WALL, CUT OPEN",
            beats: ["The drawing shows a wall assembly in layers.", "Its name and its materials come from a children’s story, and that was the point.", "The visitor chooses whether to step into the project."],
            factIds: ["wallAssembly", "tlp-three-pigs", "tlp-rvalue"],
            paragraphs: [
                "The paper opens across the bicycle seat: one wall, drawn as if someone sawed straight through it. Stick framing. Straw bales. Brick on the outside.",
                "Straw for insulation brought the three little pigs to mind. So Ethan stopped choosing between the houses and built with all three.",
                "The margin does the arithmetic, and the wall comes out at R-52. The wolf would need a better plan."
            ],
            artifacts: [{ title: "3 LITTLE PIGS WALL ASSEMBLY", detail: "Stick framing, straw bale insulation, brick veneer · R-52", type: "illustration", source: "projects/project1.html" }],
            choices: [
                { label: "Step into the wall.", next: "project-placeholder" },
                { label: "Roll the drawing back up and keep going.", next: "road-ahead" }
            ]
        },
        'project-placeholder': {
            chapter: "CHAPTER 02",
            eyebrow: "THE EDGE OF THE PAPER",
            beats: ["The visitor reaches the edge of what is written so far.", "The full project page is offered instead."],
            factIds: ["wallAssembly"],
            paragraphs: [
                "Past the edge of the paper the lines stop. Ethan hasn’t drawn the rest of this place yet.",
                "The whole wall, foundation to finish, hangs on its own page in the meantime."
            ],
            artifacts: [{ title: "THE FULL ASSEMBLY", detail: "3 Little Pigs Wall Assembly · project page", type: "link", source: "projects/project1.html" }],
            choices: [
                { label: "Go back to the bridge.", next: "bridge" },
                { label: "Take the road ahead.", next: "road-ahead" }
            ]
        }
    }
};
