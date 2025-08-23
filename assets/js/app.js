document.addEventListener('DOMContentLoaded', () => {
    // ==== DOM References ====
    const buttonContainer = document.getElementById('language-button-container');
    const mainContent = document.getElementById('content');
    // const toggle = document.getElementById('group-toggle');
    const search = document.getElementById('search-input');
    const clear = document.getElementById('clear-btn');
    const clearImage = document.getElementById('clear-img');

    let searchString;

    // ==== Data Sources (JSON files to load) ====
    const dataSource = [
        { language: 'html', source: 'assets/data/htmldata.json' },
        { language: 'css', source: 'assets/data/cssdata.json' },
        { language: 'javascript', source: 'assets/data/javascriptdata.json' }
    ];

    let masterData = {};


    // (function() {
    //     function setPhysicalFontSize(cm) {
    //         // Create hidden test element of 1 inch
    //         const test = document.createElement("div");
    //         test.style.width = "1in";
    //         test.style.height = "1in";
    //         test.style.position = "absolute";
    //         test.style.left = "-100%";
    //         document.body.appendChild(test);

    //         // Get actual pixels per inch
    //         const ppi = test.offsetWidth;
    //         document.body.removeChild(test);

    //         // Convert cm to px (1in = 2.54cm)
    //         const px = (ppi / 2.54) * cm;

    //         // Apply to root element
    //         document.documentElement.style.fontSize = px + "px";
    //     }
    //     // Run once on load
    //     function updateFont() {
    //         setPhysicalFontSize(0.4);
    //     }
        
    //     //window.addEventListener("load", updateFont);
    //     //window.addEventListener("resize", updateFont);

    //     // Some browsers don’t resize-trigger properly on zoom/devicePixelRatio changes
    //     //setInterval(updateFont, 500); // safety net, updates tice per second
    // })();

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
            cards[element.name] = new Card(element, category.name);
        }
        return cards;
    }

    // ==== Create button + content holder for a language ====
    function createButtHold(category) {
        // Language button
        const button = document.createElement('button');
        button.className = 'language-button';
        button.classList.add('styling')
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
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'no-break group-holder'
            const header = document.createElement('div');
            header.classList = 'group-header title';
            header.textContent = cat;
            categoryContainer.appendChild(header);
            categoryContainer.id = cat;
            holder.group[cat] = categoryContainer;
            holder.main.appendChild(categoryContainer);
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
                    for (const key in buttons) {
                        buttons[key].classList.remove('pressed');
                    }
                    // buttons.forEach(b => b.classList.remove("pressed"));
    // apply pressed state to the clicked one
    buttons[key].classList.add("pressed");
                });
            }

            // Toggle grouping (grouped vs ungrouped view)
            // toggle.addEventListener('click', () => {
            //     this.#display.grouped = !this.#display.grouped;
            //     this.displayCards();
            // });

            // Search filtering
            search.addEventListener('input', e => {
                searchString = e.target.value.toLowerCase();
                this.search();
                clearImage.classList.toggle('visible', e);
            });

            clear.addEventListener('click', () => {
                searchString = "";
                search.value = "";
                this.search();
                clearImage.classList.remove('visible');
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
                // return;
            } else {
                for (const cardName in cards) {
                    cards[cardName].toggle(true);
                }
                for (const group in groups) {
                    groups[group].classList.toggle('hide', !isGrouped);
                }
            }

            // No search → show all cards/groups
            
            
            // console.log(this.#holders[this.#display.language].main.classList);
            //this.#holders[this.#display.language].main.classList.toggle('flex', isGrouped);
            //this.#holders[this.#display.language].main.classList.toggle('column', !isGrouped);
            // if (isGrouped) {
            //     groups[this.#display.language].classList.add('flex');
            // } else {
            //     groups[this.#display.language].classList.add('column');
            // }
            console.log(`searching for: ${searchString}/${searchString ? true : false} value, within ${this.#display.language} with grouping = ${this.#display.grouped}`);
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

        constructor(cardData, cardLang) {
            // Main sections of a card
            const main = document.createElement('div');
            const header = document.createElement('div');
            const body = document.createElement('div');
            const extra = document.createElement('div');

            this.#element.append(main, extra);
            main.append(header, body);
            this.#element.className = 'card';
            main.className = 'card-main';
            header.className = `card-header ${cardLang}`;
            // console.log(header.classList);
            body.className = 'card-body';
            extra.className = 'card-extra';

            // Fill card with data
            for (const key in cardData) {
                const element = document.createElement('p');
                element.className = key;
                element.textContent = `${cardData[key].replace(/\./g, ".\u200B")}`;
                switch (key) {
                    case 'name':
                        header.appendChild(element);
                        element.classList.add('card-title');
                        break;
                    case 'category':
                        this.#category = cardData[key];
                        //body.appendChild(element);
                        element.classList.add('card-category');
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
