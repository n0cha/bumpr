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

  test.describe('Sign up', () => {
    test.it('New user can sign up', (done) => {
      app.open(() => {
        app.selectCountry(MY_COUNTRY, () => {
          app.fillPlateNumber(MY_LICENSE);
          app.save(done);
        });
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

    test.it('Shows rank in the header', () => {
      app.getRank((rank) => {
        assert.equal(rank, 0);  
      });
    });

    test.it('Can give thumbsup', (done) => {
      app.fillPlateNumber(TEST_LICENSE);
      app.thumbsUp();
      app.getMessage((message) => {
        assert.equal(message, 'Thanks for the feedback!');
        done();
      });
    });

    test.it('Can give thumbsdown', (done) => {
      app.open(() => {
        app.fillPlateNumber(TEST_LICENSE);
        app.thumbsDown();
        app.getMessage((message) => {
          assert.equal(message, 'Thanks for the feedback!');
          done();
        });
      })
    });
  });

  test.describe('Ranking screen', () => {    
    test.it('Can find license in ranking', (done) => {
      app.open(() => {
        app.openRanking();
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
        assert.equal(message, 'Missing plate number');
        done();
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
