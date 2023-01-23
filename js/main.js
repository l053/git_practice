const API_KEY = "daec295b2475bcdf7d570d6a4ee5a083";
const PER_PAGE = 10;
let BRAND = "Nissan"
let getSizesReq = "https://www.flickr.com/services/rest/?method=flickr.photos.getSizes&format=json&nojsoncallback=1&api_key=" + API_KEY + "&photo_id=";
let searchReq = "https://www.flickr.com/services/rest/?method=flickr.photos.search&per_page=" + PER_PAGE + "&format=json&nojsoncallback=1&api_key=" + API_KEY + "&tags=";

let photos = [];
let recent = [];
let nrequests = 0;
let nreceived = 0;
let links = [];

//Get document ready
$(function(){
    let startUp = searchReq + BRAND;
    $("title").html(BRAND);
    $("#title").html(BRAND);
    

    //Get all the initial images to display
    $.get(startUp, function(data){
        fetchPhoto(data);
    });
    
    //Adds all the subcategory links to the page
    addLinks();

    
    //Check for theme option changes
    $("#check-theme").change(checkTheme);
    //Modal close on click
    $("#modal-close").click(function(){
        $("#modal-container").css("display", "none");
    });
    
    //Search for custom input
    $("#search-custom-button").click(searchCustomHandler);
    //Search for make input
    $("#search-make-button").click(searchMakeHandler);
    
});

//Check which theme is selected and change css file
function checkTheme(){
    let selected = $("input[name='theme']:checked").val();
    if (selected == "dark") {
        $("link").attr("href", "css/dark.css");
    }else if (selected == "light") {
        $("link").attr("href", "css/light.css");
    }
}

//Add all the links to subcategories
function addLinks(){
    let modelReq ="https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/" + BRAND + "?format=json";
    console.log(modelReq);

    $.get(modelReq, function(data){
        let max;
        links = [];
        if (data.Results.length > 5){
            max = 5;
        } else {
            max = data.Results.length;
        }
        for(let i = 0; i < data.Results.length; i++){
            let model = BRAND.toUpperCase() + " " + data.Results[i].Model_Name;
            links.push(model);
        }
        links.sort();

        for(let i = 0; i < max; i++){
            $("#links").append("<li item>" + links[i].toUpperCase() + "</li>");
        }
        //For each link add onclick function to search for selected link images
        $("li").each(function(index){
            $(this).click(function(){
                let title = links[index].toUpperCase();
                title = `<h2>${title}</h2>`;
                $("#thumb-view").html(title + `<div id="thumbnails"></div>`);
                $("#thumbnails").empty();
                photos = [];
                let search = searchReq + $(this)[0].innerText;
                $.get(search, function(data){
                    fetchPhoto(data);
                });
            });
        });
    });
}

//Add links function left here because newer function sometimes takes awhile to return results and display the links
/*
//Add all the links to subcategories
function addLinks(){
    for(let i = 0; i < links.length; i++){
        $("#links").append("<li item>" + links[i].toUpperCase() + "</li>");
    }
    //For each link add onclick function to search for selected link images
    $("li").each(function(index){
        $(this).click(function(){
            let title = links[index].toUpperCase();
            title = `<h2>${title}</h2>`;
            $("#thumb-view").html(title + `<div id="thumbnails"></div>`);
            $("#thumbnails").empty();
            photos = [];
            let search = searchReq + $(this)[0].innerText;
            $.get(search, function(data){
                fetchPhoto(data);
            });
        });
    });
}
*/

//Collect ids and titles for images
function fetchPhoto(data){
    nrequests = data.photos.photo.length;
    for(let i=0; i<nrequests; i++){
        let photoObj = {"id": data.photos.photo[i].id, "title": data.photos.photo[i].title};
        photos.push(photoObj);
        getSizes(photoObj);
    }
}

//Gets the images sizes for thumbnail, recent, full
function getSizes(photoObj){
    let searchReq = getSizesReq + photoObj.id;
    $.get(searchReq, function (data){
        nreceived++;
        //Find url for recent size
        for(let i = 0; i < data.sizes.size.length; i++){
            if(data.sizes.size[i].label == "Large Square"){
                photoObj.recent = data.sizes.size[i].source;
                i = data.sizes.size.length;
            } else {
                if(recentCounter = data.sizes.size.length-1){
                    photoObj.recent = data.sizes.size[0].source;
                }
            }
        }
        //Find url for thumbnail size
        for(let i = 0; i < data.sizes.size.length; i++){
            if(data.sizes.size[i].label == "Small"){
                photoObj.thumb = data.sizes.size[i].source;
                i = data.sizes.size.length;
            } else {
                if(thumbCounter = data.sizes.size.length-1){
                    photoObj.thumb = data.sizes.size[0].source;
                }
            }
        }
        //Find url for full size
        let max = data.sizes.size.length-1;
        for(let i = 0; i < data.sizes.size.length; i++){
            if(data.sizes.size[i].label == "Large"){
                photoObj.full = data.sizes.size[i].source;
                i = data.sizes.size.length;
            } else {
                if(fullCounter = data.sizes.size.length-1){
                    photoObj.full = data.sizes.size[max].source;
                }
            }
        }
        //Display all images after all ready
        if(nrequests === nreceived){
            display(photos);
            nreceived = 0;
        }
    });
}

//Display images
function display(data){
    let thumbnailStr;
    for (let i = 0; i < data.length; i++){
        thumbnailStr = `
            <figure 
                img-id="${data[i].id}"
                img-full="${data[i].full}" 
                img-recent="${data[i].recent}" 
                img-thumb="${data[i].thumb}"
                img-title="${data[i].title}">
                <img src="${data[i].thumb}">
                <figcaption>${data[i].title.substring(0,27)}</figcaption>
            </figure>`;
        $("#thumbnails").append(thumbnailStr);
    }
    //Set onclick function for each image to display in modal
    $("figure").each(function(index){
        $(this).click(function(){

            let full = $(this)[0].attributes["img-full"].value;
            let title = $(this)[0].attributes["img-title"].value;
            getMeta($(this));

            $("#modal-container").css("display", "block");
            $("#modal-container").css("height", "100%");
            $("#modal-content").attr("src", full);
            $("#modal-caption").html(`${title}`);
        });
    });
}

//Set the scale of the image depending on landscape or portrait view
function setImgScale(size){
    let thisWidth = size.x;
    let thisHeight = size.y;

    if (thisHeight > thisWidth || thisHeight == thisWidth){
        //Portrait view
        $("#modal-content").css("width", "auto");
        $("#modal-content").css("height", "80%");
        $("#modal-content").css("max-height", thisHeight);
        $("#modal-caption").css("width", "auto");
        $("#modal-caption").css("max-width", thisWidth);
    } else {
        //Lanscape view
        $("#modal-content").css("width", "80%");
        $("#modal-content").css("height", "auto");
        $("#modal-content").css("max-width", thisWidth);
        $("#modal-caption").css("width", "80%");
        $("#modal-caption").css("max-width", thisWidth);
    }
}

//Add images to recent list
function addRecent(recentObj){
    if(recent.length > 0){
        let matches = recent.length;
        for(let i = 0; i < recent.length; i++){
            //If duplicate found push to top of the list
            if(recent[i].id == recentObj.id){
                recent.splice(i, 1);
                recent.unshift(recentObj);
                i = recent.length;
            } else {
                matches--;
            }
        }
        //If not duplicate add to top of list
        if(matches == 0){
            recent.unshift(recentObj);
        }
        //First item pushed to list
    } else {
        recent.push(recentObj);
    }
    //Only display first 5 images in recent list
    let recentLength;
    recentLength = recent.length;
        if(recentLength >= 5){
            recentLength = 5;
        }
    $("#recent").html("");
    for(let i = 0; i < recentLength; i++){
        recentFigure = `
            <figure 
                img-id="${recent[i].id}"
                img-full="${recent[i].full}" 
                img-recent="${recent[i].recent}" 
                img-thumb="${recent[i].thumb}"
                img-title="${recent[i].title}">
                <img src="${recent[i].recent}">
                <figcaption>${recent[i].title}</figcaption>
            </figure>`;
        $("#recent").append(recentFigure);
    }
    //Set onclick function for each image to display in modal
    $("#recent figure").each(function(index){
        $(this).click(function(){
           
            $("#modal-container").css("display", "block");
            $("#modal-content").attr("src", $(this).attr("img-full"));
            $("#modal-caption").html($(this).attr("img-title"));
            getMeta($(this));
        });
    });
}

//Get all details about the image and determine size of image
function getMeta(obj){
    let id = obj[0].attributes["img-id"].value;
    let full = obj[0].attributes["img-full"].value;
    let recent = obj[0].attributes["img-recent"].value;
    let thumb = obj[0].attributes["img-thumb"].value;
    let title = obj[0].attributes["img-title"].value.substring(0,15);

    var img = new Image();
    //Get size value when image loads
    img.addEventListener("load", function(){
        let x = this.naturalWidth;
        let y = this.naturalHeight;
        let size = {"x": x, "y": y};
        let recentObj = {"id": id, "full": full, "recent": recent, "title": title, "thumb": thumb, "size": size};
        setImgScale(size);
        addRecent(recentObj);
    });
    img.src = full;
}

//Search for custom input
function searchCustomHandler(){
    let searchVal = $("#search-input").val();
    console.log(searchVal);
    
    $("#search-input").val("");
    let search = searchReq + searchVal;
    $.get(search, function(data){
        photos = [];
        $("#thumbnails").html("");
        fetchPhoto(data);
    });
}

//Search for make input
function searchMakeHandler(){
    let searchVal = $("#search-make-input").val();
    console.log(searchVal);
    
    $("#search-make-input").val("");
    searchVal = searchVal.charAt(0).toUpperCase() + searchVal.substring(1);
    BRAND = searchVal;
    $("#links").html("");
    $("title").html(searchVal);
    $("#title").html(searchVal);
    addLinks();
    
}
