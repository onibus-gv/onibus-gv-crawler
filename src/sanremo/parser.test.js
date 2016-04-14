var chai = require('chai');
var PDFParser = require('pdf2json/pdfparser');
var parser = require('./parser');
var fs = require('fs');
var assert = chai.assert;

describe('sanremo/parser.js', function() {
  it('should execute parseLinhas given the layout', function (done) {
    fs.readFile('./data/sanremo/linhas.html', function (err, data) {
      if (err) throw err;

      var linhas = parser.parseLinhas(1, data);

      for (var i = 0; i < linhas.length; i++) {
        assert.lengthOf(linhas[i].linha, 3, 'linha.linha must be a 3 digit string');
        assert.notInclude(linhas[i].linha, linhas[i].nome, 'linha.nome must be a string excluding the linha.linha part');
        assert.include(linhas[i].nome, linhas[i].saida, 'linha.saida must be a part of linha.nome');
        assert.notEqual('', linhas[i].saida, 'linha.saida cannot be empty');
        assert.isNotNull(linhas[i].saida, 'linha.saida cannot be null');
      }

      done();
    });
  });

  it('should execute parseItinerarios given the layout', function (done) {
    fs.readFile('./data/sanremo/linhas.html', function (err, data) {
      if (err) throw err;

      var itinerarios = parser.parseItinerarios(data);

      for (var i = 0; i < itinerarios.length; i++) {
        assert.notStrictEqual('', itinerarios[i].rua, 'rua cannot be empty');
        assert.isNotNull(itinerarios[i].rua, 'rua cannot be null');
        assert.include([1, 2], itinerarios[i].sentido, 'sentido must be 1 or 2');
      }

      done();
    });
  });

  it('should execute parseHorarios given the layout', function (done) {
    var pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', function(err) {
      throw err;
    });

    pdfParser.on('pdfParser_dataReady', function(evtData) {
      var horarios = parser.parseHorarios(1, evtData);

      for (var i = 0; i < horarios.length; i++) {
        assert.isNumber(horarios[i].hora, 'hora must be a number');
        assert.isNumber(horarios[i].minuto, 'minuto must be a number');
        assert.include([1, 2], horarios[i].sentido, 'sentido must be 1 or 2');
        assert.include([1, 2, 3, 4], horarios[i].dia, 'dia must be 1, 2, 3 or 4');
      }

      done();
    });

    pdfParser.loadPDF('./data/sanremo/3.pdf');
  });
});
