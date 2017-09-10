const webdriver = require('selenium-webdriver');

const By = webdriver.By;
const Until = webdriver.until;

module.exports = function PopupPageObject(options) {
  if (!options.browser) throw Error('options.browser is required');
  const browser = options.browser;

  return {
    open: (page = 'main') => {
      if (page === 'main') {
        browser.get(`http://localhost:3000/`);
        waitForHidden(By.id('loader'), () => {}, 60000);
      }
      if (page === 'ranking') waitForVisible(By.id('rankingButton'), (el) => el.click());
    },
    close: (page) => {
      if (page === 'ranking') browser.findElement(By.css('.back')).click();
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
    selectCountry: (country) => {
      const option = By.css(`#selectCountry option[value='${country}']`);
      browser.wait(Until.elementLocated(By.id('selectCountry')), 30000).then((select) => {
        zIndex(select, 9999);
        browser.wait(Until.elementsLocated(option), 30000).then((options) => {
          options[0].click();
          zIndex(select, -1);
        });
      });
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
          el.getText().then((text) => {
            callback(text);          
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
      waitForVisible(By.id('searchButton'), (btn) => {
        sleep(500).then(() => { // wait for onclick handler to bind
          btn.click();
          sleep(500).then(() => { // wait for animation
            waitForVisible(By.css('#searchInput input'), (input) => {
              input.sendKeys(inputText + webdriver.Key.ENTER).then(() => {
                waitForVisible(By.id('rankingTable'), (table) => {
                  table.findElement(By.css('tr.search')).then((row) => {
                    row.findElements(By.tagName('td')).then((tds) => {
                      tds[1].getText().then((rank) => {
                        callback(rank);          
                      });
                    });                
                  }).catch(() => {
                    callback(false);                  
                  });
                });
              });
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

  function waitForVisible(locator, callback, timeout = 5000) {
    waitForPresent(locator, (found) => {
      browser.wait(Until.elementIsVisible(found), timeout).then((el) =>{
        callback(el)
      });
    }, timeout)
  };

  function waitForPresent(locator, callback, timeout = 5000) {
    browser.wait(Until.elementLocated(locator), timeout).then((found) => {
      callback(found)      
    });    
  };

  function waitForHidden(locator, callback, timeout = 5000) {
    waitForPresent(locator, (found) => {
      browser.wait(Until.elementIsNotVisible(found), timeout).then((el) =>{
        callback(el)
      });
    }, timeout)      
  }

  function zIndex(el, index) {
    browser.executeScript(`arguments[0].style.zIndex='${index}';`, el);    
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

};
