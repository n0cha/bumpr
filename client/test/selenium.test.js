const assert = require('assert');
const webdriver = require('selenium-webdriver');
const test = require('selenium-webdriver/testing');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

const browser = constructBrowser();
const app = require('./bumpr.pageobject.js')({ browser });

test.describe('Bumpr', function tests() {
  this.timeout(120000);
  const TEST_LICENSE = 'TST123';
  const INVALID_LICENSE = 'TEST12';
  const MY_LICENSE = '12ab34';
  const MY_COUNTRY = 'NL';
  const MISSING_PLATE_ERROR_MSG = 'Please enter a license plate number';

  test.describe('Sign up', () => {
    test.it('User needs to use a valid license', (done) => {
      app.open(() => {
        app.selectCountry(MY_COUNTRY, () => {
          app.fillPlateNumber(INVALID_LICENSE, () => {
            app.save(() => {
              app.getMessage((message) => {
                assert.equal(message, 'Invalid license plate number');
                done();              
              });
            });            
          });
        });
      });
    });   
    test.it('New user can sign up', (done) => {
      app.fillPlateNumber(MY_LICENSE, () => {
        app.save(done)
      });
    });
  });

  test.describe('Main screen', () => {
    test.it('Shows my license in the header', () => {
      app.getMyLicense((license) => {
        assert.equal(license, MY_COUNTRY + MY_LICENSE.toLocaleUpperCase());  
      });
    });

    test.it('Shows score in the header', () => {
      app.getScore((score) => {
        assert.equal(score, 0);  
      });
    });

    test.it('Shows rank', () => {
      app.getRank((rank) => {
        assert.equal(rank, 0);  
      });
    });

    test.it('Can give thumbsup', (done) => {
      app.fillPlateNumber(TEST_LICENSE, () => {
        app.thumbsUp();
        app.getMessage((message) => {
          assert.equal(message, 'Thanks for the feedback!');
          done();
        });        
      });
    });

    test.it('Can give thumbsdown', (done) => {
      app.open(() => {
        app.fillPlateNumber(TEST_LICENSE, () => {
          app.thumbsDown();
          app.getMessage((message) => {
            assert.equal(message, 'Thanks for the feedback!');
            done();
          });
        });
      })
    });
  });

  test.describe('Ranking screen', () => {    
    test.it('Can find license in ranking', (done) => {
      app.open(() => {
        app.openMenu('ranking');
        app.search(TEST_LICENSE, (rank) => {
          assert.equal((rank > 0) , true);
          done();
        });
      });
    });
  
    test.it('Search for invalid license', (done) => {
      app.search(INVALID_LICENSE, (rank) => {
        assert.equal(rank , false);
        done();
      });
    });  

    test.it('Search does not allow a space in license', (done) => {
      const license = `${TEST_LICENSE.substring(0,3)} ${TEST_LICENSE.substring(3,6)}`;
      app.search(license, (rank) => {
        assert.equal((rank > 0) , true);
        done();
      });
    });

    test.it('Can go back to main screen', (done) => {
      app.close();
      app.thumbsDown();
      app.getMessage((message) => {
        assert.equal(message, MISSING_PLATE_ERROR_MSG);
        done();
      });
    });
  });

  test.describe('Settings screen', () => {    
    test.it('Can select prefered countries', (done) => {
      app.open(() => {
        app.getCountryListTop(1, (countries) => {
          assert.equal(countries[0], 'Netherlands (NL)');
          app.openMenu('settings', () => {
            app.selectPreferredCountries(['NL', 'B', 'D', 'PL'], () => {
              app.open(() => {
                app.getCountryListTop(4, (countries) => {
                  assert.equal(countries[0], 'Belgium (B)');
                  assert.equal(countries[1], 'Germany (D)');
                  assert.equal(countries[2], 'Poland (PL)');
                  assert.equal(countries[3], 'Afghanistan (AFG)');
                  done();
                }); 
              });
            });
          });          
        });
      });
    });

    test.it('Can go back to main screen', (done) => {
      app.openMenu('settings', () => {
        app.close();
        app.thumbsDown();
        app.getMessage((message) => {
          assert.equal(message, MISSING_PLATE_ERROR_MSG);
          done();
        });
      });
    });
  });

  test.after(() => {
    browser.quit();
  });
});

function constructBrowser() {
  chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
  const options = new chrome.Options();
  const capabilities = options.toCapabilities(webdriver.Capabilities.chrome());
  const driver = new webdriver.Builder().withCapabilities(capabilities).build();
  driver.manage().window().setSize(375, 667);
  return driver;
}
