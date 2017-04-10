const { assert } = require('chai');
const {
  chunk,
  customRequest,
  sequentialPromise
} = require('./functions.js');

describe('functions.js', function() {
  it('should chunk the array', function () {
    var arr = [...Array(200).keys()];
    assert.lengthOf(
      chunk(arr, 50),
      4,
      'Chunking an array of 200 rows by 50 should return 4 smaller arrays'
    );
  });

  it('customRequest should try to request the page 4 times', async () => {
    try {
      await customRequest('get', {
        encoding: 'utf-8',
        url: 'http://stackoverflow.com/404',
      });
    } catch(operation) {
      assert.equal(4, operation.attempts());
    }
  });

  it('sequentialPromise should resolve promise in order', async () => {
    const fakePromise = (n) => new Promise((resolve) => resolve(n));
    let lastRes = -Infinity;
    await sequentialPromise([1, 2, 3, 4], (n) => {
      return fakePromise(n).then((response) => {
        assert.isBelow(lastRes, response);
        lastRes = response;
      });
    });
  });
});
