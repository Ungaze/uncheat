document.addEventListener('DOMContentLoaded', () => {
    const buttonContainer = document.getElementById('button-parent');
    const mainContent = document.getElementById('main');

    const dataSource = [
        {language: 'html', source: 'assets/data/htmldata.json'},
        {language: 'css', source: 'assets/data/cssdata.json'},
        {language: 'javascript', source: 'assets/data/javascriptdata.json'}
    ];

    let masterData = {};

    // masterdataSample = {languageName:
    //     {
    //         name: language,
    //         data: [dataArray],
    //         button: 'languageButton',
    //         elementa: [elementArray]
    //     }}

    async function loadData(file) {
        try {
            const headRes = await fetch(file.source, { method: 'HEAD' });
            if (!headRes.ok) { // file missing
            console.warn(`Skipping missing file: ${file.source}`);
            return null;
            }

            const res = await fetch(file.source);
            if (!res.ok) { // fetch failed
            console.warn(`Skipping file due to fetch error: ${file.source}`);
            return null;
            }

            let data;
            try {
                data = await res.json();
            } catch {
                console.warn(`Skipping file due to invalid JSON: ${file.path}`);
                return null;
            }

            return { name: file.language, data };

        } catch (err) {
            console.error(`Error loading ${file.path}:`, err);
            return null;
        }
    }

    /**
     * Load all JSON files in parallel and store them in an object
     */
    async function initializeData(data) {
        const results = await Promise.all(data.map(loadData));

        for (const item of results) {
            if (item) {
                masterData[item.name] = {name: item.name, data: item.data};
            }
        }; 

        // Lets start by creating the language buttons
        for (const lang in masterData){
            break;
            // Create language buttons and main containers
            const language = masterData[lang];
            language.cards = populateCards(language);
            language.button = new LanguageButton(language);
            //language.mainContainer = new MainContainer(language);
            //console.log(language.button);
            // Create a category array
            const categories = Array.from(new Set(language.data.map(item => item.category)));
            //language.categories = categories;
            for (let category of categories) {
                category = new CategoryHolder(category);
                //language.mainContainer.getElement().appendChild(category.getElement());
            }
            //console.log(categories);
        }
        console.dir(masterData);
        const displayManager = new DisplayManager(masterData);
        return masterData;
    }

    initializeData(dataSource);

    const createSearchBar = () => {

    }

    function populateCards(category){
        const tempCardArray = [];
        for (const element of category.data) {
            tempCardArray.push(new TempCard(element));
        }
        return tempCardArray;
    }

    function createButtHold(category){
        const button = new LanguageButton(category);
        const mainHolder = new MainHolder(category);
        button.link(mainHolder);
        return {'button': button, 'holder': mainHolder};
    }

    class DisplayManager{
        // The display manager controls all the logic on which cards to display
        // It takes in all the data needed(languages and their members) then generates all the controls
        // and elements needed to display them
        // This way, only this class needs to have a reference to each and every element to display
        // The display manager keeps track of which members and holders are being shown
        #langauge;
        #category;
        #cards;
        #holders;
        #dataBase
        #buttons;
        #searchBar;
        #shown;
        #display = {}
        constructor(data){
            // first populate the cards/card array for each data type using dataArray
            // then populate the holders using dataArray
            // feed the array and holders to its corresponding button
            // link the buttons with the search bar
            // The manager should have a link to the card collection, button collection, holder collection and the search button only.
            // It doesnt need to know information about the data.
            const dataBase = data;
            const cards = {};
            const buttons = {};
            const holders = {}
            for (const key in dataBase) {
                cards[key] = populateCards(dataBase[key]);
                const buttHold = createButtHold(dataBase[key]);
                buttons[key] = buttHold.button;
                holders[key] = buttHold.holder;
                this.#display = {'language': key, 'grouped': false}; // sets initial display setting
            }
            this.#cards = cards;
            this.#buttons = buttons;
            this.#holders = holders;
            this.#dataBase = dataBase;
            this.displayCards();
        }

        displayCards(string){
            // Everytime this is called it checks for a string supplied
            // The search bar call this method providing the searched string
            // It iterates through our card collection and feeds creates a new list of shown cards
            // Becuase the display manager keeps track of the language and groupings,
            // we call the proper holder and send them the list of shown cards
            // For the normal holder, all shown card are directly displayed
            // For grouped holders, only holders with children are displayed with their cards
            //const shownCards = []
            const data = this.#dataBase[this.#display.language];
            const group = this.#display.grouping;
            const cards = this.#cards[this.#display.language];
            const holder = this.#holders[this.#display.language];
            const cat = new Set();
            // First check if search is activated(with text) or not (called by other function)
            if (string) { // String exist and being used to search. Match string to card contents
                console.log("SEARCHING");
                for (const card of data) { // iterate through cards data only
                    let match = false; // set matches to 0
                    for (const key in card) {
                        if (card[key].toLowerCase().includes(string)) {
                            match = true;
                            break;
                        }
                        console.log(card[key].toLowerCase() + "HAS THE WORD(" + match + "):" + string);
                    }
                    cards[card].toggle(match);
                    //if (match) cat.push(data[card]);
                    match ? cat.add(data[card]) : null;
                    //const categories = Array.from(new Set(language.data.map(item => item.category)));
                    console.log(holder.mainHolder)
                    holder.mainHolder.toggle;
// display holders and group holders
                }
            } else
            { // String is null, simply display all members for this type
                console.log("SKIPPING SEARCH");
                for (const card in cards) {
                    cards[card].toggle(true);
                }
                holder.toggle();
// display holders and group holders
            }
        }

        categoryToggle(){
            this.#display.grouped = !this.#display.grouped;
            this.displayCards();
        }

        changeLanguage(lang){
            this.#display.language = lang;
            this.displayCards();
        }


    }

    class LanguageButton{
        // The language button handles the call to show on cards
        // They also create the buttons and the parent elements of cards
        #element
        #holder
        constructor(language){
            //console.log('sssssss' + language.name);
            this.#element = document.createElement('button');
            this.#element.classList = 'language-button';
            this.#element.textContent = language.name;
            this.#element.addEventListener('click', ()=>{});
            buttonContainer.appendChild(this.#element);
        }

        getElemnt(){
            return this.#element;
        }

        link(holder){
            if (holder instanceof MainHolder) {
                this.#holder = holder;
            }
        }
    }

    class BaseClass{
        // This is our pseudo abstract class for cards and containers
        toggle(){}; // A common method that tells each class to toglle on or off
        callToSearch(){}; // A common method that tells the class what to do when a search is called
    }
    
    class BaseHolder extends BaseClass{
        // Base containers must have at least one element as a parent to irs children
        // Can hold and store children pointers
        // Has a passed down callToSearch and toggle functions
        #children = [];
        #element;
        constructor(element){
            super();
            this.#element = document.createElement(element || 'div');
        }

        toggle(){
            if (this.#children) {
                for (const element of object) {
                    if (element instanceof BaseClass){
                        element.toggle();
                    }
                }
            }
        }

        callToSearch(string){
            if (this.#children) {
                for (const element of object) {
                    if (element instanceof BaseClass){
                        element.callToSearch();
                    }
                }
            }
        }

        attachChild(child){
            if(child instanceof BaseClass) {
                this.#children.push(child);
                this.#element.appendChild(child.getElement());
            }
        }

        getChildren(){
            return this.#children;
        }

        getElement(){
            return this.#element;
        }
    }
    
    class MainHolder extends BaseHolder{
        // this class decides if it is going to display the given cards or pass it to the holders
        #categories = [];
        children = this.getChildren();
        constructor(lang){
            super();
            const categoryHolders = [];
            mainContent.appendChild(this.getElement());
            this.getElement().classList = 'main-container';
            this.getElement().textContent = 'MAIN CONTAINER';
            //console.log(lang);
            const tempCat = Array.from(new Set(lang.data.map(item => item.category)));
            for (let category of tempCat) {
                const newCategory = new CategoryHolder(category);
                this.attachChild(newCategory);
                this.#categories.push(newCategory);
            }
            // for (const element of lang.data) {
            //     categoryHolders.push(new CategoryHolder(element))
            // }
            //console.log(this.getChildren());
        }

        toggle(){
            console.log(this.children)
            if (this.children) {
                for (const element of this.children) {
                    if (element instanceof BaseClass){
                        element.toggle();
                    }
                }
            }
        }
    }

    class CategoryHolder extends BaseHolder{
        #members = [];
        constructor(string){
            super();
            //console.log(`created ${string} category`)
            this.getElement().classList = 'category-container';
            
            this.getElement().textContent = 'CONTAINER';
        }

        toggle(boolean){
            console.log("cat holder toggled")
            if (boolean&&this.#members) {
                if (this.#members instanceof TempCard) {
                    if (data[key].toLowerCase().includes(value)) match++
                            console.log(data[key].toLowerCase() + "HAS THE WORD(" + match + "):" + value);
                            console.log(value);
                        // if (match > 0) dataType.cards[index].classList.remove('hide');
                        // const isVisible = data.name.toLowerCase().includes(value) ||
                        // data.email.toLowerCase().includes(value);
                        // data.element.classList.toggle("hide", !isVisible)
                        dataType.cards[index].classList.toggle('hide', !(match > 0));

                }
            }
        }
    }

    

    class TempCard extends BaseClass{
        // Cards hold their element identifiers and
        // can handle un/hiding themselves.
        // Cards also handle their own click events
        #element = document.createElement('div');

        constructor(cardData){
            super();
            //this.#element = this.getElement();
            const header = document.createElement('div');
            const body = document.createElement('div');
            const extra = document.createElement('div');
            this.#element.appendChild(header);
            this.#element.appendChild(body);
            this.#element.appendChild(extra);
            for (const key in cardData) {
                const element = document.createElement('p');
                element.classList = `${key}`
                element.textContent = `${cardData.key}`
                switch (key) {
                    case 'name':
                        header.appendChild(element);
                        break;
                    case 'category':
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
            //console.log(cardData);
            // create card element
        }

        toggle(bool){
            //console.log(this.#element.classList)
            this.#element.classList.toggle('hide', !bool);
            //console.log('toggle');
            // toggles between hidden and not
        }

        getElement(){
            // returns the mother element of this card
        }

        contains(string){
            // returns a boolean if the contents contain the given string
        }

        // or

        callToSearch(string){
            // unhides on string match 
        }
        
        toggleExpand() {
            //this.#element.classList.toggle('card--expanded');
        }
        collapse() {
            //this.#element.classList.remove('card--expanded');
        }
    }


    class LanguageCategory{
        // The language category handles the actual grouping of cards to show
        // they iterate through their group and calls the searchcall for all cards
        
        #categoryMembers;
        constructor(){
            this.#categoryMembers = [];
        }

        searchInCategory(){

        }
    }

    // async function initializeData(source){
    //             //Object.keys(dataType).forEach(data=>console.log(data));
    //             //console.log(`Async initialization function called. Initializing arrays`);
    //             const mainDatabase = [];
    //             source.forEach(data => {
    //                 try {
    //                     const response = await fetch(dataType.path);
    //                     if (!response.ok) {
    //                         throw new Error(`HTTP error! status: ${response.status}`);
    //                     }
    //                     dataType.dataArray = await response.json();
    //                 } catch (error) {
    //                     console.error("Error fetching or parsing JavaScript data:", error);
    //                 }
    //             });
    //             dataType.dataArray.sort((a, b) => {
    //                 const aName = Object.values(a)[0].toLowerCase();
    //                 const bName = Object.values(b)[0].toLowerCase();
    //                 return aName.localeCompare(bName);
    //             });
    //         }

    //         function createLanguageButton(){

    //         }

    //         function createCard(){

    //         }

    // START NEW CODE

            // Store references to all cards to avoid re-querying the DOM
            let allCardElements = {};
            let currentGroupedElements = {};
            let noResultsMessage = null;
            
            // This function renders all cards for a given language to the DOM one time.
            const renderAllCards = (lang, grouped) => {
                cardsContainer.innerHTML = ''; // Clear previous content
                allCardElements = {};
                currentGroupedElements = {};
                noResultsMessage = null;
                const data = cheatSheetData[lang];
                
                if (!data) return;

                // Fix: Correctly handle all item types for each language
                let allItems = [];
                if (data.tags) {
                    allItems = data.tags;
                } else if (data.selectors && data.properties) {
                    allItems = [...data.selectors, ...data.properties];
                } else if (data.concepts) {
                    allItems = data.concepts;
                }

                if (grouped) {
                    const groupedItems = allItems.reduce((acc, item) => {
                        const group = item.group || 'Other';
                        if (!acc[group]) {
                            acc[group] = [];
                        }
                        acc[group].push(item);
                        return acc;
                    }, {});

                    for (const group in groupedItems) {
                        const groupContainer = document.createElement('div');
                        groupContainer.classList.add('lg:col-span-4', 'col-span-1', 'md:col-span-3', 'sm:col-span-2');
                        groupContainer.id = `group-${group.replace(/\s/g, '-')}`;
                        groupContainer.innerHTML = `
                            <h3 class="text-xl font-bold text-gray-700 mt-4 mb-2">${group}</h3>
                            <div id="group-cards-${group.replace(/\s/g, '-')}" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
                        `;
                        cardsContainer.appendChild(groupContainer);
                        currentGroupedElements[group] = groupContainer;

                        const groupCardsContainer = document.getElementById(`group-cards-${group.replace(/\s/g, '-')}`);
                        groupedItems[group].forEach(item => {
                            const title = item.tag || item.selector || item.property || item.concept;
                            const cardHtml = renderCard(title, item.description, item.example, item.group);
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = cardHtml;
                            // Fix: Use querySelector to robustly find the card element
                            const cardElement = tempDiv.querySelector('.card');
                            
                            // Prevent the error if the card element is not found
                            if (cardElement) {
                                cardElement.setAttribute('data-id', item.id);
                                cardElement.setAttribute('data-search-term', `${title.toLowerCase()} ${item.description.toLowerCase()} ${item.example.toLowerCase()} ${item.group.toLowerCase()}`);
                                cardElement.setAttribute('data-group-name', item.group);
                                groupCardsContainer.appendChild(cardElement);
                                allCardElements[item.id] = cardElement;
                                new Card(cardElement); // Initialize the Card class
                            }
                        });
                    }

                } else {
                    const tempFragment = document.createDocumentFragment();
                    allItems.forEach(item => {
                        const title = item.tag || item.selector || item.property || item.concept;
                        const cardHtml = renderCard(title, item.description, item.example, item.group);
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = cardHtml;
                        // Fix: Use querySelector to robustly find the card element
                        const cardElement = tempDiv.querySelector('.card');

                        // Prevent the error if the card element is not found
                        if (cardElement) {
                            cardElement.setAttribute('data-id', item.id);
                            cardElement.setAttribute('data-search-term', `${title.toLowerCase()} ${item.description.toLowerCase()} ${item.example.toLowerCase()} ${item.group.toLowerCase()}`);
                            cardElement.setAttribute('data-group-name', item.group);
                            tempFragment.appendChild(cardElement);
                            allCardElements[item.id] = cardElement;
                            new Card(cardElement); // Initialize the Card class
                        }
                    });
                    cardsContainer.appendChild(tempFragment);
                }
                
                // Create a single "No results" message element that we can show/hide
                const noResultsDiv = document.createElement('p');
                noResultsDiv.classList.add('text-center', 'text-xl', 'text-gray-500', 'col-span-full', 'card--hidden');
                noResultsDiv.textContent = 'No results found.';
                cardsContainer.appendChild(noResultsDiv);
                noResultsMessage = noResultsDiv;
            };

            // This is the new, performant search function. It updates visibility instead of re-rendering.
            const filterCards = (searchTerm) => {
                let hasResults = false;
                let foundInGroup = {};
                
                // Iterate through all rendered cards and show/hide them
                for (const id in allCardElements) {
                    const card = allCardElements[id];
                    const cardSearchTerm = card.getAttribute('data-search-term');

                    if (cardSearchTerm.includes(searchTerm.toLowerCase())) {
                        card.classList.remove('card--hidden');
                        hasResults = true;
                        // Track which groups have a visible card if grouping is active
                        if (isGrouped) {
                            // Fix: Use the new data attribute to get the group name
                            const groupName = card.getAttribute('data-group-name') || 'Other';
                            foundInGroup[groupName] = true;
                        }
                    } else {
                        card.classList.add('card--hidden');
                    }
                }
                
                // Show/hide group headers based on search results
                if (isGrouped) {
                    for (const group in currentGroupedElements) {
                        if (foundInGroup[group]) {
                            currentGroupedElements[group].classList.remove('card--hidden');
                        } else {
                            currentGroupedElements[group].classList.add('card--hidden');
                        }
                    }
                }

                // Show/hide the "No results found" message
                if (noResultsMessage) {
                    if (hasResults) {
                        noResultsMessage.classList.add('card--hidden');
                    } else {
                        noResultsMessage.classList.remove('card--hidden');
                    }
                }
            };
            
            // END NEW CODE

    // --- Cheat Sheet Logic with Class Refactor ---
    class Card {
        #element;
        #codeElement;
        constructor(element) {
            this.#element = element;
            this.#codeElement = this.#element.querySelector('code');
            this.#bindEvents();
        }
        #bindEvents() {
            this.#element.addEventListener('click', (e) => {
                this.toggleExpand();
            });
            this.#element.addEventListener('mouseleave', () => {
                this.collapse();
            });
        }
        toggleExpand() {
            this.#element.classList.toggle('card--expanded');
        }
        collapse() {
            this.#element.classList.remove('card--expanded');
        }
    }

    class LanguageButtonManager {
        #buttons;
        #callback;
        #activeButton = null;
        constructor(buttons, defaultLang, callback) {
            this.#buttons = buttons;
            this.#callback = callback;
            this.#init(defaultLang);
        }
        #init(defaultLang) {
            this.#buttons.forEach(button => {
                button.addEventListener('click', (event) => {
                    this.setActive(event.target);
                    this.#callback(event.target.dataset.lang);
                });
            });
            const defaultButton = Array.from(this.#buttons).find(btn => btn.dataset.lang === defaultLang);
            if (defaultButton) {
                this.setActive(defaultButton);
            }
        }
        setActive(button) {
            if (this.#activeButton) {
                this.#activeButton.classList.remove('bg-noctua-beige', 'text-noctua-brown', 'shadow-md');
                this.#activeButton.classList.add('text-gray-700', 'hover-bg-noctua-beige');
            }
            button.classList.add('bg-noctua-beige', 'text-noctua-brown', 'shadow-md');
            button.classList.remove('text-gray-700', 'hover-bg-noctua-beige');
            this.#activeButton = button;
        }
    }

    const cardsContainer = document.getElementById('cards-container');
    const langButtons = document.querySelectorAll('.lang-button');
    const groupToggle = document.getElementById('group-toggle');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const menuBtn = document.getElementById('menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const menuIcon = document.getElementById('menu-icon');

    // Hardcoded JSON data (replace with fetch if you want to load from file)
    const cheatSheetData = {
        html: {
          "title": "HTML Cheat Sheet",
          "tags": [
            { "tag": "<html>", "group": "Structural", "description": "The root element of an HTML page.", "example": "<html>...</html>" },
            { "tag": "<head>", "group": "Meta", "description": "Contains meta-information about the HTML page.", "example": "<head><title>My Page</title></head>" },
            { "tag": "<body>", "group": "Structural", "description": "Contains all the content of an HTML document.", "example": "<body><h1>Hello</h1></body>" },
            { "tag": "<h1> to <h6>", "group": "Text Content", "description": "Defines HTML headings.", "example": "<h1>This is a heading</h1>" },
            { "tag": "<p>", "group": "Text Content", "description": "Defines a paragraph.", "example": "<p>This is a paragraph.</p>" },
            { "tag": "<a>", "group": "Links", "description": "Defines a hyperlink.", "example": "<a href=\"https://example.com\">Link</a>" },
            { "tag": "<img>", "group": "Media", "description": "Embeds an image.", "example": "<img src=\"image.jpg\" alt=\"My Image\">" },
            { "tag": "<ul>, <ol>", "group": "Lists", "description": "Defines an unordered or ordered list.", "example": "<ul><li>Item 1</li></ul>" },
            { "tag": "<li>", "group": "Lists", "description": "Defines a list item.", "example": "<li>List Item</li>" },
            { "tag": "<div>", "group": "Structural", "description": "A generic container for flow content.", "example": "<div>Container</div>" },
            { "tag": "<span>", "group": "Structural", "description": "An inline container for phrasing content.", "example": "<span>Text</span>" },
            { "tag": "<button>", "group": "Forms & Interaction", "description": "A clickable button.", "example": "<button>Click Me</button>" },
            { "tag": "<form>", "group": "Forms & Interaction", "description": "Defines an HTML form for user input.", "example": "<form action=\"/submit\"></form>" },
            { "tag": "<input>", "group": "Forms & Interaction", "description": "Defines an input field.", "example": "<input type=\"text\" name=\"username\">" }
          ]
        },
        css: {
          "title": "CSS Cheat Sheet",
          "selectors": [
            { "selector": "element", "group": "Basic Selectors", "description": "Selects all elements of a given type.", "example": "p { color: blue; }" },
            { "selector": ".class", "group": "Basic Selectors", "description": "Selects elements with a specific class.", "example": ".my-class { font-size: 16px; }" },
            { "selector": "#id", "group": "Basic Selectors", "description": "Selects an element with a specific ID.", "example": "#my-id { border: 1px solid black; }" }
          ],
          "properties": [
            { "property": "color", "group": "Typography", "description": "Sets the color of the text.", "example": "color: #333;" },
            { "property": "font-size", "group": "Typography", "description": "Sets the size of the font.", "example": "font-size: 18px;" },
            { "property": "background-color", "group": "Background", "description": "Sets the background color of an element.", "example": "background-color: #f0f0f0;" },
            { "property": "margin", "group": "Box Model", "description": "Sets the margin space outside an element.", "example": "margin: 10px 20px;" },
            { "property": "padding", "group": "Box Model", "description": "Sets the padding space inside an element.", "example": "padding: 10px;" },
            { "property": "display", "group": "Layout", "description": "Specifies the display behavior of an element.", "example": "display: flex;" },
            { "property": "flex-direction", "group": "Layout", "description": "Sets the direction of flex items.", "example": "flex-direction: column;" },
            { "property": "justify-content", "group": "Layout", "description": "Aligns flex items along the main axis.", "example": "justify-content: center;" },
            { "property": "align-items", "group": "Layout", "description": "Aligns flex items along the cross axis.", "example": "align-items: center;" },
            { "property": "border", "group": "Visual Effects", "description": "Sets the border around an element.", "example": "border: 1px solid black;" },
            { "property": "box-shadow", "group": "Visual Effects", "description": "Adds a shadow effect to an element.", "example": "box-shadow: 2px 2px 5px rgba(0,0,0,0.2);" }
          ]
        },
        js: {
          "title": "JavaScript Cheat Sheet",
          "concepts": [
            { "concept": "Variables", "group": "Fundamentals", "description": "Store data values.", "example": "let name = 'John';\nconst PI = 3.14;\nvar age = 30;" },
            { "concept": "Functions", "group": "Fundamentals", "description": "Blocks of code that can be called.", "example": "function greet(name) {\n  return `Hello, ${name}`;\n}\nconst multiply = (a, b) => a * b;" },
            { "concept": "Conditionals", "group": "Control Flow", "description": "Execute code based on conditions.", "example": "if (age > 18) {\n  console.log('Adult');\n} else {\n  console.log('Minor');\n}" },
            { "concept": "Loops", "group": "Control Flow", "description": "Execute a block of code repeatedly.", "example": "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\nlet count = 0;\nwhile (count < 3) {\n  console.log(count);\n  count++;\n}" },
            { "concept": "Arrays", "group": "Data Structures", "description": "Ordered collections of data.", "example": "const colors = ['red', 'green', 'blue'];\ncolors.push('yellow');" },
            { "concept": "Objects", "group": "Data Structures", "description": "Collections of key-value pairs.", "example": "const user = {\n  name: 'Jane',\n  age: 25\n};\nconsole.log(user.name);" },
            { "concept": "DOM Manipulation", "group": "Browser APIs", "description": "Changing the content and style of an HTML page.", "example": "const element = document.getElementById('my-id');\nelement.innerHTML = 'New Content';" },
            { "concept": "Event Listeners", "group": "Browser APIs", "description": "Listening for user interactions like clicks.", "example": "document.querySelector('button').addEventListener('click', () => {\n  alert('Button clicked!');\n});" }
          ]
        }
    };

    let currentLang = 'html';
    let isGrouped = true;

    
    const renderCard = (title, description, example, lang, groupName) => {
        const titleBgClass = 'bg-noctua-brown';
        const titleTextClass = 'text-noctua-beige';
        const exampleBgClass = 'bg-noctua-beige';
        const groupSpan = groupName ? `<span class="text-sm font-normal text-noctua-beige">${groupName}</span>` : '';
        return `
            <div class="card bg-white p-2 shadow-md border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer relative">
                <div class="${titleBgClass} p-2 -mx-2 -mt-2 flex items-center justify-between rounded-t-md">
                    <h3 class="text-lg font-semibold ${titleTextClass} mb-0">${title}</h3>
                    ${groupSpan}
                </div>
                <p class="text-gray-600 my-2 text-sm">${description}</p>
                <div class="card-example">
                    <pre class="${exampleBgClass} text-noctua-brown p-2 rounded-md overflow-x-auto text-xs mt-2 font-mono"><code>${example}</code></pre>
                </div>
            </div>
        `;
    };

    /*
    // Centralized render function
    const render = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const data = cheatSheetData[currentLang];
        let allItems = [];
        if (data) {
            if (data.tags) {
                allItems = data.tags;
            } else if (data.selectors) {
                allItems = [...data.selectors, ...data.properties];
            } else if (data.concepts) {
                allItems = data.concepts;
            }
        }
        const itemsToRender = searchTerm
            ? allItems.filter(item => {
                  const valuesToSearch = Object.values(item).map(value => String(value).toLowerCase());
                  return valuesToSearch.some(value => value.includes(searchTerm));
              })
            : allItems;
        renderCheatSheet(itemsToRender);
    };


    const renderCheatSheet = (itemsToRender) => {
        cardsContainer.innerHTML = '';
        if (itemsToRender.length === 0) {
            cardsContainer.innerHTML = '<p class="text-center text-xl text-gray-500 col-span-full">No results found.</p>';
            return;
        }
        let htmlToInsert = '';
        if (isGrouped) {
            const groupedItems = itemsToRender.reduce((acc, item) => {
                const group = item.group || 'Other';
                if (!acc[group]) {
                    acc[group] = [];
                }
                acc[group].push(item);
                return acc;
            }, {});
            for (const group in groupedItems) {
                htmlToInsert += `
                    <div class="lg:col-span-4 col-span-1 md:col-span-3 sm:col-span-2">
                        <h3 class="text-xl font-bold text-gray-700 mt-4 mb-2">${group}</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            ${groupedItems[group].map(item => {
                                const title = item.tag || item.selector || item.property || item.concept;
                                return renderCard(title, item.description, item.example, currentLang);
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        } else {
            htmlToInsert = itemsToRender.map(item => {
                const title = item.tag || item.selector || item.property || item.concept;
                return renderCard(title, item.description, item.example, currentLang, item.group);
            }).join('');
        }
        cardsContainer.innerHTML = htmlToInsert;
        document.querySelectorAll('.card').forEach(cardElement => new Card(cardElement));
    };
    */

    // --- Event Listeners ---
    const languageManager = new LanguageButtonManager(langButtons, currentLang, (newLang) => {
        currentLang = newLang;
                renderAllCards(currentLang, isGrouped);
                filterCards(searchInput.value);
    });

    groupToggle.addEventListener('change', () => {
        isGrouped = groupToggle.checked;
                renderAllCards(currentLang, isGrouped);
                filterCards(searchInput.value);
    });

    // Search input and clear button
    searchInput.addEventListener('input', () => {
                filterCards(searchInput.value);
        if (searchInput.value.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
                filterCards('');
    });

    // Menu burger button
    menuBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('dropdown-menu--open');
    });

    window.addEventListener('click', (event) => {
        if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('dropdown-menu--open');
        }
    });

    // Initial render
    //render();
    
    //renderAllCards(currentLang, isGrouped);
});
