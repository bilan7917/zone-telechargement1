/*
Element to find in the document to retrieve links
*/
const linkSection = 'div.postinfo';

/*
Open link in same tab
*/
var bTargetSelf = false;

/*
Show copy buttons
*/
var bShowCopyButtons = true;

/*
Show check buttons
*/
var bShowCheckButtons = true;

/*
Title of the movie or serie
Extracted from the document title
*/
var sMovieTitle = '';

/*
Get the new changed value(s) for stored settings
*/
function storageChanged(changes, area) {  
  if(changes['target_self']){
    bTargetSelf = changes['target_self'].newValue;
    applySettings('target_self');
  }
  if(changes['button_copy']){    
    bShowCopyButtons = changes['button_copy'].newValue;
    applySettings('button_copy');
  }
  if(changes['button_check']){        
    bShowCheckButtons = changes['button_check'].newValue;
    applySettings('button_check');  
  }
}

/*
Retrieve settings
*/
function getSettings(){  
	chrome.storage.local.get("target_self", function(result){
    bTargetSelf = result | false;
    applySettings("target_self");
	});

  chrome.storage.local.get("button_copy", function(result){
    bShowCopyButtons = result | true;     
    applySettings("button_copy");
	});

  chrome.storage.local.get("button_check", function(result){
    bShowCheckButtons = result | true;
    applySettings("button_check");    
	});
}

/*
Listeners
*/
chrome.storage.onChanged.addListener(storageChanged);

/*
Some initialisations
Dicionnary for replacements string used for decoding link
*/
var map = new Map();
//not used anymore, removed all left part of last slash
//map.set("https://www.protect-zt.com/","");
//map.set("https://www.dl-protect1.com/","");
//map.set("https://www.protecte-link.com/","");
//map.set("https://www.liens-telechargement.com/","");
map.set("123455615","/");
map.set("123455617","?");
map.set("123455601","https://");
map.set("123455600","http://");
// don't apply the 2 next, no corresponding with ul.to
// probably the domain name has changed before and the new dev didnt understand the correct logic
//123455610 = .com
//123455611 = .net
map.set("123455602123455610","uptobox.com");
map.set("123455603123455610","1fichier.com");
map.set("123455605","ul.to");
map.set("123455607123455611","turbobit.net");
map.set("123455608123455610","nitroflare.com");
map.set("123455606123455611","rapidgator.net");

getSettings();
decodeLinks();

/*
Main function: change links on the current page
*/
function decodeLinks(){  
  //extract title of movie  
  if(!document.title.startsWith('zone telechargement1')){//movie or serie page
    sMovieTitle = document.title;
    var tmp = sMovieTitle.match(/Telecharger (.*) gratuit/);
    if(tmp && tmp.length > 1){
      sMovieTitle = tmp[1];
    }
    tmp = sMovieTitle.match(/(.*) - Saison/);
    if(tmp && tmp.length > 1){
      sMovieTitle = tmp[1];
    }
  }
  
  var elementRoot = document.querySelector(linkSection);
  if(elementRoot){   
    var elements = elementRoot.querySelectorAll("div, a");
    var providerIndex = -1;
    var linkIndex = -1;
    [].forEach.call(elements, function(el) {
      if(el.tagName.toLowerCase() == 'div'){
        providerIndex++;
        var btCopy = document.createElement('button');
        btCopy.class = 'zt100pubBtProviderCopy';
        btCopy.hidden = true;
        btCopy.innerText = "Copier les liens";
        btCopy.style.color = el.style.color;
        btCopy.addEventListener("click", copyProviderLinks, false);
        btCopy.providerIndex = providerIndex;        
        el.appendChild(btCopy);
        
        //button to check all links
        var btCheck = document.createElement('button');
        btCheck.class = 'zt100pubBtProviderCheck';
        btCheck.hidden = true;
        btCheck.innerText = "Vérifier les liens";
        btCheck.style.color = el.style.color;
        btCheck.addEventListener("click", checkSite, false);
        btCheck.providerIndex = providerIndex;        
        el.appendChild(btCheck);                 
        /*var img = document.createElement('img');
        img.style = "margin-left:20px; height:35px; width:35px; cursor:pointer;"
        img.src = browser.extension.getURL("icons/copy-link-128.png");
        img.addEventListener("click", copyProviderLinks, false);
        img.providerIndex = providerIndex;
        el.appendChild(img);*/
      }
      else if(el.tagName.toLowerCase() == 'a'){
        var newLink = decodeLink(el.href);
        el.id = ++linkIndex;
        el.href = newLink;        
        el.name = providerIndex;
        el.class = 'zt100pubLinkDirect';
        /*var button = document.createElement('button');
        button.innerText = "Vérifier le lien";
        button.addEventListener("click", test, false);
        button.link = newLink;
        button.index = linkIndex;
        el.insertAdjacentElement('afterend',button);*/
      }
    });
  }
}

/*
Change the target of <a> links, to do each time the storage is readed
*/
function applySettings(setting){
  var elementRoot = document.querySelector(linkSection);
  if(elementRoot){
    var elements = elementRoot.querySelectorAll("button, a");    
    [].forEach.call(elements, function(el) {
      if(setting == 'target_self' && el.class == 'zt100pubLinkDirect'){
        bTargetSelf ? el.target = '_self' : el.target = '_blank';        
      }
      else if(setting == 'button_copy' && el.class == 'zt100pubBtProviderCopy'){
        el.hidden = !bShowCopyButtons;
      }
      else if(setting == 'button_check' && el.class == 'zt100pubBtProviderCheck'){
        el.hidden = !bShowCheckButtons;
      }
    });
  }
}

/*
Copy all links of one provider
multi-line with 1 link per line
*/
function copyProviderLinks(button){ 
  var elementRoot = document.querySelector(linkSection);
  if(elementRoot){
    var links = elementRoot.querySelectorAll('a[name=\"' + button.target.providerIndex + '\"]');
    var linksToCopy = '';
    [].forEach.call(links, function(link) {
        linksToCopy = linksToCopy + link.href + '\n'; 
    });

    copyToClipboard(linksToCopy);
  }
}

/*
Clean the user selected link
*/
function decodeLink(link){
  var str = decodeURIComponent(link);
  //find last slash to remove the first part of adress (like https://www.protect-zt.com/link_goes_here)
  var pos = str.lastIndexOf('/');
  if(pos > -1){
    str = str.substring(pos + 1);
  }
  for (var [key, value] of map) {
    str = str.replace(new RegExp(key, 'g'), value);
  }

  return str;
}

/*
Check an url to determine if the provider's file is present or not 
Send XMLHttpRequest
*/
function checkSite(button){
  var elementRoot = document.querySelector(linkSection);
  if(elementRoot){
    var links = elementRoot.querySelectorAll('a[name=\"' + button.target.providerIndex + '\"]');
    var xhr = [];    
    for(var i = 0; i < links.length; ++i){
      (function(i){
        xhr[i] = new XMLHttpRequest();
        //var url = links[i].href.replace('http://', 'https://');//avoid cross protocols
        xhr[i].open("GET", links[i].href, true);//true=asynchronous
        xhr[i].onreadystatechange = function () {
          if(xhr[i].readyState === XMLHttpRequest.DONE) {
            
            siteAnswer(links[i].id, xhr[i].status, xhr[i].responseText);
          }
        };//end onreadystatechange              
        xhr[i].send();        
      })(i)//end function
    }//end for    
  }
}

//TODO: remove
/*function test(button){
  var elementRoot = document.querySelector(identifier);
  if(elementRoot){
    var links = elementRoot.querySelectorAll('a[id=\"' + button.target.index + '\"]');
    [].forEach.call(links, function(link) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE) {
          siteAnswer(link.id, xhr.status, xhr.responseText);
        }
      };
      //var url = link.href.replace('http://', 'https://');
      
      xhr.open("GET", link.href, true);//false=synchronous
      xhr.send();
    });
  }
}*/

/*
Evaluation of response of checkSite
*/
function siteAnswer(linkIndex, status, response){
  var bValid = true;
  response = response.toLowerCase();
  //console.log('status:' + status);    
  var linkColor = 'black';
  if(status == 200){
    if(response.indexOf('404 ') != -1 ||   
      response.indexOf('page not found') != -1 || 
      response.indexOf('file not found !') != -1 ||
      response.indexOf('n\'existe pas') != -1 ||    
      response.indexOf('pas été trouvé') != -1 ||       
      response.indexOf('fichier non trouvé') != -1 ||
      response.indexOf('fichier introuvable') != -1 ||  
      response.indexOf('page introuvable') != -1 ||  
      response.indexOf('fichier demandé a été supprimé') != -1 ||  
      response.indexOf('requested file has been deleted') != -1 ||            
      response.indexOf('file has been removed') != -1 )
    {
        linkColor = 'red';
    }
    else{
      linkColor = 'green';      
    }
  }
  else if(status == 404){
    linkColor = 'red';
  }  
  var elementRoot = document.querySelector(linkSection);
  if(elementRoot){
    var links = elementRoot.querySelectorAll('a[id=\"' + linkIndex + '\"]');
    if(links.length == 1){//each link id is unique      
      links[0].style.color = linkColor;      
    }            
  }
}

// This function must be called in a visible page, such as a browserAction popup
// or a content script. Calling it in a background page has no effect!
function copyToClipboard(text) {
  function oncopy(event) {
      document.removeEventListener("copy", oncopy, true);
      // Hide the event from the page to prevent tampering.
      event.stopImmediatePropagation();

      // Overwrite the clipboard content.
      event.preventDefault();
      event.clipboardData.setData("text/plain", text);
  }
  document.addEventListener("copy", oncopy, true);

  // Requires the clipboardWrite permission, or a user gesture:
  document.execCommand("copy");
}

/*
Recieve messages from popup movie info provider
*/
chrome.runtime.onMessage.addListener(movieInfoProvider);
function movieInfoProvider(request, sender, sendResponse) {
  var url = '';
  var selection = document.getSelection();
  var title;
  //if user has selected some text, we use it for the query
  if(selection.toString().length > 3){
    title = encodeURIComponent(selection.toString());
  }
  else{//no selected text, we use the title extracted from the document
    title = encodeURIComponent(sMovieTitle);
  }
  if(title.length > 3){
    title = title.replace(/%20/g, "+");

    if(request.MovieProvider == 'allocine'){   
      url = 'http://www.allocine.fr/recherche/?q=' + title;    
    }
    else if(request.MovieProvider == 'imdb'){
      url = "http://www.imdb.com/find?ref_=nv_sr_fn&q=" + title + "&s=all";
    }
    else if(request.MovieProvider == 'tmdb'){    
      url = "https://www.themoviedb.org/search?language=fr-FR&query=" + title;    
    }
    //send the formatted url to background script to open a new tab  
    chrome.runtime.sendMessage({Url: url});
  }
}