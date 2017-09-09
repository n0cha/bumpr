const webdriver = require('selenium-webdriver');

const By = webdriver.By;
const Until = webdriver.until;

module.exports = function PopupPageObject(options) {
  if (!options.browser) throw Error('options.browser is required');
  const browser = options.browser;

  return {
    open: (page = 'main') => {
      if (page === 'main') browser.get(`http://localhost:3000/`);
      if (page === 'ranking') waitForVisible(By.id('rankingButton'), (el) => el.click());
    },
    close: (page) => {
      if (page === 'ranking') browser.findElement(By.id('back')).click();
    },    
    save: () => {
      browser.findElement(By.id('save')).click();
    },
    thumbsUp: () => {
      browser.findElement(By.id('like')).click();      
    },
    thumbsDown: () => {
      browser.findElement(By.id('dislike')).click();      
    },
    getScore: (callback) => {
      waitForVisible(By.id('score'), (el) => {
        el.getText().then((text) => {
          callback(text);          
        });
      });
    },
    getRank: (callback) => {
      waitForVisible(By.id('rank'), (el) => {
        el.getText().then((text) => {
          callback(text);          
        });
      });
    },
    getMyLicense: (callback) => {
      waitForVisible(By.id('me'), (el) => {
        el.findElements(By.tagName('span')).then((els) => {
          els[1].getText().then((text) => {
            callback(text);          
          });
        });
      });
    },
    getMessage: (callback) => {
      waitForVisible(By.id('message'), (el) => {
        el.getText().then((text) => {
          callback(text);          
        });
      });
    },
    search: (inputText, callback) => {
      waitForVisible(By.id('searchButton'), (el) => {
        sleep(500).then(() => { // wait until onclick handler is bound
          el.click();          
          sleep(500).then(() => { // wait until animation is finished
            browser.findElement(By.css('#searchInput input')).sendKeys(inputText + webdriver.Key.ENTER).then(() => {
              waitForVisible(By.css('tr.search'), (row) => {
                row.findElements(By.tagName('td')).then((tds) => {
                  tds[1].getText().then((text) => {
                    callback(text);          
                  });
                })                
              })
            });
          });
        });
      });
    },
    fillPlateNumber: (inputText) => {
      waitForVisible(By.id('plateNumber'), () => {
        const input = browser.findElement(By.css('#plateNumber input'));
        input.sendKeys(inputText);
      });
    },
  }

  function waitForVisible(locator, callback, timeout = 30000) {
    browser.wait(Until.elementLocated(locator), timeout).then((found) => {
      browser.wait(Until.elementIsVisible(found), timeout).then((el) =>{
        callback(el)
      });
    });    
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

};
