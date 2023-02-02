/* Globala variabler för hämtning, hantering och publicering av bilder och uppgifter. */
let currentPageNumber;
let imgQtyPerPage;
let imgSizeSuffix;
let imgSortOrder;
let flickrImgArray;
let searchInput;
let lastImg;

/* URL för hämtning av data */
const flickrURL = 'https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=201219a4702e7efdb04664bce34da605';
const flickrURLFormat = '&format=json&nojsoncallback=1';
const randomWordURL = 'https://random-word-api.herokuapp.com/word?lang=en';

/* Text info */
const searchOutput = document.querySelector('#search-string' );
const galleryPageNumber = document.querySelector('#pageNumber' );
const totalNumOfImgs = document.querySelector('#totalNumOfImgs' );

/* Bild output och sidnavigering */
const imgContainer = document.querySelector('#gallery' );
const pageSelectContainer = document.querySelector('#page-selector-container' );
const pageSelectContainerBtn = document.querySelectorAll('.page-select-btn' );

/* EventListener för sök och sidnavigering */
const submitBtn = document.querySelector('#submit-btn' );
submitBtn.addEventListener('click', imageQuery );
// Tvungen ha denna annars fungerar inte 'ENTER'
document.body.addEventListener('keypress', ( event) => {
    if( event.key === 'Enter') { event.preventDefault(); submitBtn.click() } } );
pageSelectContainerBtn.forEach(btn => btn.addEventListener('click', event =>
    updatePageContainer( event ) ) );


/***** FUNKTIONER SOM KALLAS PÅ VID SÖKNING ******/


/* imageQuary kallar funktioner för:
    - rensar tidigare sparad och publicerad data
    - söker, hämtar, sparar och bearbetar data o
    - publicerar bilder, sök och resultatinfo
    - sätter layout efter sökstorlek
    - meddelar användare vid fel
 */
async function imageQuery(event) {

    event.preventDefault();
    clearGallery().then(async () => {

        insertLoaderAnimation();

        await getUserInput()
    })

        .then( async () => {

            await fetchFlickrImages();
        })

        .then(() => {

            if ( flickrImgArray.length > 0 ) {

                updatePageContainer(event);

            }
            setGalleryLayout();
            searchInput = '';
        });

}


async function clearGallery() {

    imgContainer.innerHTML = '';
    flickrImgArray = '';
    totalNumOfImgs.innerText = '';
    pageSelectContainer.style.display = 'none';
    currentPageNumber = 1;

}

function insertLoaderAnimation() {

    const loader = document.createElement('div');
    loader.setAttribute('class', 'loader');
    imgContainer.append(loader);

}

async function getUserInput() {

    searchInput = document.querySelector('#search-text').value;
    searchInput = searchInput === '' ? await fetchRandomWord().then(r => r[0]) : searchInput;
    imgSortOrder = document.querySelector('#sort').value;
    imgSizeSuffix = document.querySelector('#photo-size').value;
    imgQtyPerPage = document.querySelector('#number-of-images').value;
    searchOutput.innerText = searchInput;

}

function fetchRandomWord() {

    return fetch(randomWordURL).then(response => {

        return response.json();

    }).catch(error => printOutDomMessage('Hämtningen misslyckades: ' + error.message));
}


async function fetchFlickrImages() {

    const apiURL =

        flickrURL + `&text=${searchInput}&sort=${imgSortOrder}&safe_search=3&per_page=500` + flickrURLFormat;

    await fetch(apiURL)

        .then(async response => {

            if (response.status >= 200 && response.status < 300) {

                return await response.json();

            } else {

                printOutDomMessage('Ett nätverks eller serverfel har uppstått. Felstatus: ' + response.statusText);

            }

        })
        .then( flickrObject => {

            if (flickrObject['photos']['photo'].length > 0 ) {

                flickrImgArray = flickrObject['photos']['photo'];

                createGalleryImages()

            } else {

                printOutDomMessage( 'Inga bilder funna, försök igen eller ändra din söktext.' );

            }
        })
        .catch( error => {

            printOutDomMessage( 'Hämtningen lyckades men något fel har uppstått. Felmeddelande: ' + error.message );

        });

}


async function createGalleryImages() {

    const imgCollector = new DocumentFragment();

    let firstImg = (currentPageNumber - 1) * imgQtyPerPage;
    lastImg = firstImg + parseInt(imgQtyPerPage);


    for (let i = firstImg; i < lastImg; i++) {

        try {
            if (flickrImgArray[i].id !== undefined
                && flickrImgArray[i].server !== undefined
                && flickrImgArray[i].secret !== undefined) {

                const {id, server, secret, title} = flickrImgArray[i];

                const img = createImgElement();
                const anchorElement = createAnchor();
                const lable = createTitle();
                const card = createCard();

                img.src = `https://live.staticflickr.com/${server}/${id}_${secret}` + imgSizeSuffix + `.jpg`;
                anchorElement.href = img.src;
                lable.innerText = '[ ' + title + ' ]';

                anchorElement.append(img);

                card.append(anchorElement);
                card.append(lable);

                if (i == lastImg - 1) {

                    card.append(await setEndToFinalCard());
                }

                imgCollector.append(card);
            }

            totalNumOfImgs.innerText = flickrImgArray.length;

        } catch (error) {

            printOutDomMessage('Ett fel har uppstått i samband med att bilddata processats. ' +
                'Försök igen eller sök på något annat. Felmeddeland: ' + error.message)

        }

    }

    imgContainer.innerHTML = '';
    imgContainer.append(imgCollector);

}

/* Funktion för att möjliggöra scroll i x-axis
    - kollar vilken storlek som sökts
    - byter klass på galleriet och därmed css regler
        - '_b' -> XL img -> horisontellt galleri -> scroll i x-led
        - M och S img -> vertikalt galleri -> scroll i y-led
 */
function setGalleryLayout() {

    if ( imgSizeSuffix === '_b' ) {

        imgContainer.classList.remove('gallery-vertical' )
        imgContainer.classList.add( 'gallery-horizontal' );

        imgContainer.addEventListener('wheel', ( event) => {
            event.preventDefault();

            imgContainer.scrollBy({

                left: event.deltaY < 0 ? -250 : 250,

            });

        });

    } else {

        imgContainer.classList.remove('gallery-horizontal' )
        imgContainer.classList.add( 'gallery-vertical' );
        imgContainer.removeEventListener('wheel', () => {} );
    }
}


/*
    Mindre funktioner för skapandet av HTML element
    ( korten ) till galleriet:
        - <img> , class img
        - <a> , target _blank
        - <div> , class img-title
        - <div> , class image-card
        - <p> , class the-end
 */
function createImgElement() {

    const img = document.createElement('img' );
    img.setAttribute('class', 'img' );

    return img;
}

function createAnchor() {

    const anchorElement = document.createElement('a' );
    anchorElement.target = "_blank";

    return anchorElement

}

function createTitle() {

    const title = document.createElement('div' );
    title.setAttribute('class', 'img-title' );

    return title;

}

function createCard() {

    const card = document.createElement('div' );
    card.setAttribute('class', 'image-card' );

    return card;

}

function setEndToFinalCard() {

    const p = document.createElement('p' );
    p.setAttribute('class', 'the-end' );
    p.innerText = 'END';

    return p;

}

// Printar ut meddelande i #gallery
function printOutDomMessage( message ) {

    const h3 = document.createElement("h3" );
    h3.innerText = 'Meddelande: ' + message;
    imgContainer.innerHTML = '';
    imgContainer.append( h3 );

}

/*
    Kallas vid ny sökning och sidnavigering
        - sidnavigering ?
            -> sätter sidnummer efter värdet av riktning -> kallar på createGalleryImages();
                -> hanterar navingerinsknapparnas synas eller icke synas
        - ny sökning ?
            -> reset
 */
function updatePageContainer( event ) {

    if (event.target.matches('.page-select-btn' )) {

        currentPageNumber += parseInt( event.target.getAttribute('value' ));
        createGalleryImages().then( () => {
            pageSelectContainerBtn[1].style.display =
                flickrImgArray.length <= ( imgQtyPerPage * currentPageNumber) ? 'none' : 'block';});

    }

    pageSelectContainerBtn[0].style.display = currentPageNumber < 2 ? 'none' : 'block';

    galleryPageNumber.innerText = currentPageNumber;
    pageSelectContainer.style.display = 'flex';

}
