document.addEventListener('DOMContentLoaded', () => {
    // ==== DOM References ====
    const buttonContainer = document.getElementById('language-button-container');
    const mainContent = document.getElementById('content');
    const toggle = document.getElementById('group-toggle');
    const search = document.getElementById('search-input');
    let searchString;

    // ==== Data Sources (JSON files to load) ====
    const dataSource = [
        { language: 'html', source: 'assets/data/htmldata.json' },
        { language: 'css', source: 'assets/data/cssdata.json' },
        { language: 'javascript', source: 'assets/data/javascriptdata.json' }
    ];

    let masterData = {};

    // ==== Load JSON files safely ====
    async function loadData(file) {
        try {
            // First check if the file exists before fetching
            const headRes = await fetch(file.source, { method: 'HEAD' });
            if (!headRes.ok) {
                console.warn(`Skipping missing file: ${file.source}`);
                return null;
            }

            // Then fetch file content
            const res = await fetch(file.source);
            if (!res.ok) {
                console.warn(`Skipping file due to fetch error: ${file.source}`);
                return null;
            }

            // Parse JSON safely
            let data;
            try {
                data = await res.json();
            } catch {
                console.warn(`Skipping file due to invalid JSON: ${file.source}`);
                return null;
            }

            return { name: file.language, data };
        } catch (err) {
            console.error(`Error loading ${file.source}:`, err);
            return null;
        }
    }

    // ==== Initialize all language data ====
    async function initializeData(data) {
        const results = await Promise.all(data.map(loadData));

        // Store each valid dataset in masterData
        for (const item of results) {
            if (item) {
                masterData[item.name] = { name: item.name, data: item.data };
            }
        }

        // Kick off DisplayManager once data is ready
        new DisplayManager(masterData);
        return masterData;
    }

    initializeData(dataSource);

    // ==== Create all card objects for a language ====
    function populateCards(category) {
        const cards = {};
        for (const element of category.data) {
            cards[element.name] = new Card(element);
        }
        return cards;
    }

    // ==== Create button + content holder for a language ====
    function createButtHold(category) {
        // Language button
        const button = document.createElement('button');
        button.className = 'language-button';
        button.textContent = category.name;
        button.id = category.name;
        buttonContainer.appendChild(button);

        // Main container for this language
        const holder = {};
        holder.main = document.createElement('div');
        holder.group = {};
        holder.main.className = 'main-holder';
        holder.main.id = category.name;
        mainContent.appendChild(holder.main);

        // Create group sections based on unique category names
        const uniqueCategories = Array.from(new Set(category.data.map(item => item.category)));
        for (let cat of uniqueCategories) {
            const newCategory = document.createElement('div');
            newCategory.className = 'group-holder';
            newCategory.id = cat;
            newCategory.textContent = cat;
            holder.group[cat] = newCategory;
            holder.main.appendChild(newCategory);
        }

        return { button, holder };
    }

    // ==== Main Display Controller ====
    class DisplayManager {
        #cards;
        #holders;
        #dataBase;
        #buttons;
        #display = {};

        constructor(data) {
            const cards = {};
            const buttons = {};
            const holders = {};

            // For each language, build cards, buttons, and holders
            for (const key in data) {
                cards[key] = populateCards(data[key]);
                const buttHold = createButtHold(data[key]);
                buttons[key] = buttHold.button;
                holders[key] = buttHold.holder;

                // Default display state
                this.#display = { language: key, grouped: true };

                // Button switches current language
                buttons[key].addEventListener('click', () => {
                    this.#display.language = key;
                    this.displayCards();
                });
            }

            // Toggle grouping (grouped vs ungrouped view)
            toggle.addEventListener('click', () => {
                this.#display.grouped = !this.#display.grouped;
                this.displayCards();
            });

            // Search filtering
            search.addEventListener('input', e => {
                searchString = e.target.value.toLowerCase();
                this.search();
            });

            this.#cards = cards;
            this.#buttons = buttons;
            this.#holders = holders;
            this.#dataBase = data;

            // Initial render
            this.displayCards();
        }

        // Render cards to DOM
        displayCards() {
            const cards = this.#cards[this.#display.language];
            const holder = this.#holders[this.#display.language].main;
            const groups = this.#holders[this.#display.language].group;

            // Hide all languages except the active one
            for (const key in this.#holders) {
                this.#holders[key].main.classList.toggle('hide', this.#holders[key].main.id !== this.#display.language);
            }

            // Place cards into groups or into the flat holder
            if (this.#display.grouped) {
                for (const card in cards) {
                    groups[cards[card].category()].appendChild(cards[card].getElement());
                }
            } else {
                for (const card in cards) {
                    holder.appendChild(cards[card].getElement());
                }
            }

            // Apply search filter
            this.search();
        }

        // Search filter for cards
        search() {
            const cards = this.#cards[this.#display.language];
            const data = this.#dataBase[this.#display.language].data;
            const groups = this.#holders[this.#display.language].group;
            const isGrouped = this.#display.grouped;

            // Hide all groups first
            for (const group in groups) {
                groups[group].classList.add('hide');
            }

            // If search input exists → filter
            if (searchString) {
                for (const card of data) {
                    let hasMatch = false;
                    for (const key in card) {
                        if (card[key].toLowerCase().includes(searchString)) {
                            hasMatch = true;
                            break;
                        }
                    }
                    if (hasMatch) {
                        cards[card.name].toggle(true);
                        groups[cards[card.name].category()].classList.toggle('hide', !isGrouped);
                    } else {
                        cards[card.name].toggle(false);
                    }
                }
                return;
            }

            // No search → show all cards/groups
            for (const cardName in cards) {
                cards[cardName].toggle(true);
            }
            for (const group in groups) {
                groups[group].classList.toggle('hide', !isGrouped);
            }
        }

        // Manual toggles (optional extra methods)
        categoryToggle() {
            this.#display.grouped = !this.#display.grouped;
            this.displayCards();
        }

        changeLanguage(lang) {
            this.#display.language = lang;
            this.displayCards();
        }
    }

    // ==== Card Component ====
    class Card {
        #element = document.createElement('div');
        #category;

        constructor(cardData) {
            // Main sections of a card
            const header = document.createElement('div');
            const body = document.createElement('div');
            const extra = document.createElement('div');

            this.#element.append(header, body, extra);
            this.#element.className = 'card';
            header.className = 'card-header';
            body.className = 'card-body';
            extra.className = 'card-extra';

            // Fill card with data
            for (const key in cardData) {
                const element = document.createElement('p');
                element.className = key;
                element.textContent = `${cardData[key]}`;
                switch (key) {
                    case 'name':
                        header.appendChild(element);
                        break;
                    case 'category':
                        this.#category = cardData[key];
                        header.appendChild(element);
                        break;
                    case 'description':
                        body.appendChild(element);
                        break;
                    default:
                        extra.appendChild(element);
                        break;
                }
            }
        }

        // Show/hide card
        toggle(isVisible) {
            this.#element.classList.toggle('hide', !isVisible);
        }

        // Return root DOM element
        getElement() {
            return this.#element;
        }

        // Return card category (for grouping)
        category() {
            return this.#category;
        }
    }
});
