let currentPageNumber;
let imgQtyPerPage;
let imgSizeSuffix;
let imgSortOrder;
let flickrImgArray;
let searchInput;
let lastImg;

const searchOutput = document.querySelector('#search-string');
const flickrURL = 'https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=201219a4702e7efdb04664bce34da605';
const flickrURLFormat = '&format=json&nojsoncallback=1';
const randomWordURL = 'https://random-word-api.herokuapp.com/word?lang=en'
const imgContainer = document.querySelector('#gallery');

const galleryPageNumber = document.querySelector('#pageNumber');
const totalNumOfImgs = document.querySelector('#totalNumOfImgs');
const pageSelectContainer = document.querySelector('#page-selector-container');
const pageSelectBtn = document.querySelectorAll('.page-select-btn'); // OM MÖJLIGT TA BORT CONST OCH KÖR PÅ EN RAD

document.querySelector('#submit-btn').addEventListener('click', fetchNewImages);
pageSelectBtn.forEach(btn => btn.addEventListener('click', event => updatePageSelectContainer(event)));



imgContainer.addEventListener('wheel', (event) => {
    event.preventDefault();

    imgContainer.scrollBy({
        left: event.deltaY < 0 ? -250 : 250,

    });
});
function fetchRandomWord() {

    return fetch(randomWordURL).then( response => {

        return response.json();

    }).catch(error => printOutDomMessage(error.message) );
}

//Försäkringskassan
// SKV Deklaration löner oktober 2021 tom april 2022
// SKICKAS TILL FÖRSÄKRINGSKASSAN Inläsningscentral

function createLoaderAnimation() {
    const loader = document.createElement('div');
    loader.setAttribute('class', 'loader');
    imgContainer.append(loader);
}

async function initiateLoadingSequence() {

    console.log('Math check 3 + (-1) : ' +  (3 + -1));
    imgContainer.innerHTML = '';
    pageSelectContainer.style.display = 'none';
    currentPageNumber = 1;
    createLoaderAnimation();
    console.log('loader')

}

async function fetchNewImages(event) {

    event.preventDefault();

    initiateLoadingSequence().then( async () => {
        console.log('next getUser input -> '); await getUserInput() })

        .then( async () => {console.log('next fetch url -> '); await getFlickrImages();  })

        .then( async () => { updatePageSelectContainer(event);
            imgSizeSuffix === '_b' ? changeGalleryLayout('gallery-vertical', 'gallery-horizontal') :
                changeGalleryLayout('gallery-horizontal', 'gallery-vertical');
            await updateImgGallery(); searchInput = ''; } );


}

function changeGalleryLayout(remove, add) {

    imgContainer.classList.remove(remove)
    imgContainer.classList.add(add);

}


async function getUserInput() {

    searchInput = document.querySelector('#search-text').value;
    searchInput = searchInput === '' ? await fetchRandomWord().then(r =>  r[0] ) : searchInput;
    imgSortOrder = document.querySelector('#sort').value;
    imgSizeSuffix =  document.querySelector('#photo-size').value;
    imgQtyPerPage  = document.querySelector('#number-of-images').value;
    searchOutput.innerText = searchInput;

    console.log('getUserInput done!')

}


async function getFlickrImages() {

    const apiURL = flickrURL + `&text=${searchInput}&sort=${imgSortOrder}&safe_search=3&per_page=500` + flickrURLFormat;

    await fetch(apiURL)
        .then(response => {

            if (response.status >= 200 && response.status < 300 ) {

                return response.json();

            } else {

                printOutDomMessage('Ett nätverks eller serverfel har uppstått. Felstatus: ' + response.statusText);

            }

        })
        .then( flickrObject => {

            if (flickrObject['photos']['photo'].length > 0) {

                flickrImgArray = flickrObject['photos']['photo'];
                console.log(' after add images to array -> ');

            } else {

                printOutDomMessage('Inga bilder funna, försök igen eller ändra din söktext.');

            }
        })
        .catch(error => {

            printOutDomMessage('Hämtningen lyckades men något fel har uppstått. Felmeddelande: ' + error.message)

        });

}


async function updateImgGallery() {

    const imgCollector = new DocumentFragment();

    let firstImg = ( currentPageNumber - 1 ) * imgQtyPerPage;
    lastImg = firstImg + parseInt(imgQtyPerPage);


    for (let i = firstImg; i < lastImg; i++) {

        try {
            if (flickrImgArray[i].id !== undefined && flickrImgArray[i].server !== undefined && flickrImgArray[i].secret !== undefined) {

                console.log(i)
                const {id, server, secret, title} = flickrImgArray[i];

                const img = createImgElement();
                const anchorElement = createAnchorElement();
                const lable = createLabelElement();
                const card = createCard();

                img.src = `https://live.staticflickr.com/${server}/${id}_${secret}` + imgSizeSuffix + `.jpg`;
                anchorElement.href = img.src;
                lable.innerText = '[ ' + title + ' ]';

                anchorElement.append(img);

                card.append(anchorElement);
                card.append(lable);

                if ( i == lastImg-1 ) {

                    card.append( await setEndPElem() );
                }

                imgCollector.append(card);
            }
            totalNumOfImgs.innerText = flickrImgArray.length;
        } catch ( error ) {

            printOutDomMessage('Ett fel har uppstått i samband med att bilddata processats. ' +
                'Försök igen eller sök på något annat. Felmeddeland: ' + error.message)

        }

    }


    imgContainer.innerHTML = '';
    imgContainer.append(imgCollector);

}


function createImgElement(){

    const img = document.createElement('img');
    img.setAttribute('class' ,  'img');

    return img;
}

function createAnchorElement(){

    const anchorElement = document.createElement('a');
    anchorElement.target = "_blank";

    return anchorElement

}

function createLabelElement(){

    const title = document.createElement('div');
    const check = document.createElement('p');
    check.innerText = 'X';
    title.setAttribute('class' ,  'img-title');
    check.setAttribute('class' ,  'thumb');
    title.append(check);

    return title;

}

function createCard(){

    const card = document.createElement('div');
    card.setAttribute('class' ,  'image-card');

    return card;

}

function setEndPElem() {

    const p = document.createElement('p');
    p.setAttribute('class', 'the-end');
    p.innerText = 'END';

    return p;

}

function printOutDomMessage(message){

    const h3 = document.createElement("h3");
    h3.textContent = 'Meddelande: ' + message;
    imgContainer.innerHTML = '';
    imgContainer.append(h3);

}

function updatePageSelectContainer(event) {

    if( event.target.matches( '.page-select-btn' ) ) {
        imgContainer.innerHTML = '';
        createLoaderAnimation();
        currentPageNumber += parseInt(event.target.getAttribute('value'));

    }

    updateImgGallery().then( () => {

        pageSelectBtn[0].style.display = currentPageNumber < 2 ?  'none' : 'block' ;
        galleryPageNumber.innerText = currentPageNumber;

        pageSelectContainer.style.display = 'flex';


    } );


}



let links = [];

imgContainer.on('click', '.thumb', function () {

    $(this).removeClass().addClass('thumbChecked');
    $(this).css("border", "2px solid #c32032");
    links.push($(this).attr('src'));
    console.log(links);

    if (links.length !== 0) {
        $('.download').css("display", "block");
    }

});


imgContainer.on('click', '.thumbChecked', function () {

    $(this).removeClass().addClass('thumb');
    $(this).css("border", "2px solid white");
    let itemtoRemove = $(this).attr('src');
    links.splice($.inArray(itemtoRemove, links), 1);
    console.log(links);

    if (links.length === 0) {
        $('.download').css("display", "none");
    }

});


function generateZIP() {
    console.log('TEST');
    let zip = new JSZip();
    let count = 0;
    let zipFilename = "Pictures.zip";

    links.forEach(function (url, i) {
        let filename = links[i];
        filename = filename.replace(/[\/\*\|\:\<\>\?\"\\]/gi, '').replace("https://live.staticflickr.com/","");
        // loading a file and add it in a zip file
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                throw err; // or handle the error
            }
            zip.file(filename, data, { binary: true });
            count++;
            if (count == links.length) {
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    saveAs(content, zipFilename);
                });
            }
        });
    });
}