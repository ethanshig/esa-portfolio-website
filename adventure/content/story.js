window.adventureContent = {
    startScenes: ['bridge'],
    facts: {
        pltResearch: 'Ethan’s resume lists a research internship at Para La Tierra in Pilar, Paraguay, from January through April 2024.',
        education: 'Ethan’s resume lists a Bachelor of Science in Sustainable Design and a minor in Architectural Studies at the University of Illinois Urbana-Champaign, with expected graduation in December 2026.',
        wallAssembly: 'The 3 Little Pig Wall Assembly is a 2024 sustainable construction project at the University of Illinois using traditional stick framing and R-52 straw bale insulation.'
    },
    scenes: {
        bridge: {
            chapter: 'CHAPTER 01',
            eyebrow: 'A FIRST ENCOUNTER',
            beats: ['The visitor notices Ethan below the bridge.', 'Ethan is introduced through fieldwork and movement.', 'The visitor chooses what kind of attention to bring into the story.'],
            factIds: [],
            paragraphs: [
                'You are crossing a bridge when something below catches your attention.',
                'An individual is wading through the stream, moving slowly against the current. You almost continue across the bridge before leaning over the railing.',
                '“What are you doing down there?”',
                '“I’m sampling the river for fish.”',
                'He comes out of the water, shakes the river from his sleeves, and offers a hand.',
                '“My name is Ethan.”'
            ],
            choices: [
                { label: 'Ask about the river.', next: 'river-notes' },
                { label: 'Ask where he is headed.', next: 'road-ahead' },
                { label: 'Look at the bicycle.', next: 'bicycle' }
            ]
        },
        'river-notes': {
            chapter: 'CHAPTER 01',
            eyebrow: 'FIELD NOTES',
            beats: ['A field document is introduced as an artifact.', 'Research becomes the first doorway into Ethan’s work.', 'The visitor chooses whether to read, continue, or return.'],
            factIds: ['pltResearch'],
            paragraphs: [
                'Ethan reaches into the bicycle’s front basket and removes a folded pamphlet. The paper is damp at the edges.',
                'It contains field research from Para La Tierra: a place, a set of observations, and a reason to look closely before moving on.',
                'The pamphlet is placed in your hands. It is the first thing you carry into the story.'
            ],
            artifacts: [{ title: 'FIELD NOTES', detail: 'Para La Tierra · Research experience', type: 'field note', source: 'resume.html' }],
            choices: [
                { label: 'Read the pamphlet.', next: 'research-artifact' },
                { label: 'Ask what comes next.', next: 'road-ahead' },
                { label: 'Return to the bridge.', next: 'bridge' }
            ]
        },
        'research-artifact': {
            chapter: 'CHAPTER 01',
            eyebrow: 'THE OBJECT IN YOUR HANDS',
            beats: ['The visitor interprets the research record.', 'Ethan’s education and recurring design concerns come into view.'],
            factIds: ['pltResearch', 'education'],
            paragraphs: [
                'The pamphlet does not explain everything. It gives the place a shape and leaves room for the place to answer back.',
                'Ethan is studying sustainable design at the University of Illinois Urbana-Champaign. Research, construction, ecology, and material systems keep appearing along the road.'
            ],
            artifacts: [{ title: 'RESEARCH RECORD', detail: 'Para La Tierra · Research internship · Pilar, Paraguay · 2024', type: 'source card', source: 'resume.html' }],
            choices: [
                { label: 'Follow the road.', next: 'road-ahead' },
                { label: 'Ask about the things he makes.', next: 'bicycle' }
            ]
        },
        'road-ahead': {
            chapter: 'CHAPTER 02',
            eyebrow: 'THE ROAD AHEAD',
            beats: ['The story shifts from biography toward making.', 'A drawing and a field pamphlet offer two possible directions.'],
            factIds: [],
            paragraphs: [
                'Ethan lifts the bicycle from the grass. A rolled drawing is tied beneath the frame.',
                'The destination is not marked on any sign. There are only a few objects to choose from, each carrying a different kind of promise.'
            ],
            artifacts: [
                { title: 'A ROLLED DRAWING', detail: 'A project setting waiting to be entered', type: 'illustration' },
                { title: 'A FIELD PAMPHLET', detail: 'Research, place, and observation', type: 'document' }
            ],
            choices: [
                { label: 'Ask to see the drawing.', next: 'drawing' },
                { label: 'Keep moving.', next: 'bridge' }
            ]
        },
        bicycle: {
            chapter: 'CHAPTER 01',
            eyebrow: 'THE BICYCLE',
            beats: ['The objects Ethan carries suggest a practice built from movement.', 'The visitor chooses between process and destination.'],
            factIds: [],
            paragraphs: [
                'The bicycle is carrying more than it should. A field bag hangs from the handlebars. A drawing is tied beneath the frame. The tires are still wet from the river.',
                'Ethan seems prepared to keep traveling, regardless of what the road becomes.'
            ],
            choices: [
                { label: 'Ask what is inside the drawing.', next: 'drawing' },
                { label: 'Ask where the road goes.', next: 'road-ahead' },
                { label: 'Return to the bridge.', next: 'bridge' }
            ]
        },
        drawing: {
            chapter: 'CHAPTER 02',
            eyebrow: 'AN ILLUSTRATION OF WHAT COMES NEXT',
            beats: ['A wall assembly is revealed as a system of layers.', 'The drawing frames construction as an open question.', 'The visitor chooses whether to enter the project.'],
            factIds: ['wallAssembly'],
            paragraphs: [
                'The paper opens across the bicycle seat. Lines divide a wall into layers. Arrows mark heat, structure, and the path of assembly.',
                'The drawing is not introduced as a finished answer. It is an instrument for entering the question.'
            ],
            artifacts: [{ title: 'ASSEMBLY STUDY', detail: 'A wall system shown through layers, sections, and movement', type: 'illustration', source: 'projects/project1.html' }],
            choices: [
                { label: 'Enter the project setting.', next: 'project-placeholder' },
                { label: 'Fold the drawing and keep traveling.', next: 'road-ahead' }
            ]
        },
        'project-placeholder': {
            chapter: 'CHAPTER 02',
            eyebrow: 'PROJECT DESTINATION',
            beats: ['The visitor arrives at the edge of a project chapter.', 'The framework makes room for a fully authored project setting.'],
            factIds: ['wallAssembly'],
            paragraphs: [
                'The project settings will be added here as complete story modules. Each one will bring its own place, artifacts, drawings, factual records, and possible roads onward.',
                'The road remains open.'
            ],
            artifacts: [{ title: 'PROJECT MODULE SLOT', detail: 'Ready for an approved project setting', type: 'framework' }],
            choices: [
                { label: 'Return to the first bridge.', next: 'bridge' },
                { label: 'Take the road ahead.', next: 'road-ahead' }
            ]
        }
    }
};
