/*
Recieve messages from content.js
*/
browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
    if(request.Url){
      console.log(request.Url);
      chrome.tabs.create({url: request.Url});
    }   
}