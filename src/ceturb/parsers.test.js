var chai = require('chai');
var parsers = require('./parsers');
var fs = require('fs');

var assert = chai.assert;

var linhasAssertion = function(linhas, done) {
  for (var i = 0; i < linhas.length; i++) {
    assert.lengthOf(linhas[i].linha, 4, 'linha.linha must be a 4 digit string');
    assert.notInclude(linhas[i].linha, linhas[i].nome, 'linha.nome must be a string excluding the linha.linha part');
  }

  done();
};

var itinerariosAssertion = function(itinerarios, done) {
  // Ida
  for (var i = 0; i < itinerarios.ida.length; i++) {
    assert.notStrictEqual('', itinerarios.ida[i].rua, 'rua cannot be empty');
    assert.isNotNull(itinerarios.ida[i].rua, 'rua cannot be null');
    assert.strictEqual(1, itinerarios.ida[i].sentido, 'sentido must be 1');
  }

  // Volta
  for (var i = 0; i < itinerarios.volta.length; i++) {
    assert.notStrictEqual('', itinerarios.volta[i].rua, 'rua cannot be empty');
    assert.isNotNull(itinerarios.volta[i].rua, 'rua cannot be null');
    assert.strictEqual(2, itinerarios.volta[i].sentido, 'sentido must be 2');
  }

  done();
};

var horariosAssertion = function(horarios, done) {
  for (var i = 0; i < horarios.length; i++) {
    assert.isNumber(horarios[i].hora, 'hora must be a number');
    assert.isNumber(horarios[i].minuto, 'minuto must be a number');
    assert.include([1, 2], horarios[i].sentido, 'sentido must be 1 or 2');
    assert.include([1, 2, 3, 4], horarios[i].dia, 'dia must be 1, 2, 3 or 4');
    assert(typeof horarios[i].siglaObs === 'string' || horarios[i].siglaObs === null, 'must be a string or null');
  }

  done();
};

var observacoesAssertion = function(observacoes, done) {
  for (var i = 0; i < observacoes.length; i++) {
    assert.notStrictEqual('', observacoes[i].sigla, 'sigla cannot be empty');
    assert.isNotNull(observacoes[i].sigla, 'sigla cannot be null');

    assert.notStrictEqual('', observacoes[i].obs, 'obs cannot be empty');
    assert.isNotNull(observacoes[i].obs, 'obs cannot be null');
  }

  done();
};

var saidaDestinoAssertion = function(parsed, done) {
  assert.notStrictEqual('', parsed.saida, 'saida cannot be empty');
  assert.isNotNull(parsed.saida, 'saida cannot be null');

  assert(typeof parsed.destino === 'string' || parsed.destino === null, 'destino must be a string or null');

  done();
};

describe('ceturb/parsers.js', function() {
  describe('transcol', function () {
    it('should execute parseLinhas given the layout', function (done) {
      fs.readFile('./data/transcol/linhas.html', function (err, data) {
        if (err) throw err;
        var linhas = parsers.parseLinhas(1, '#select2 option', data);
        linhasAssertion(linhas, done);
      });
    });

    it('should execute parseItinerarios given the layout', function(done) {
      fs.readFile('./data/transcol/itinerarios.html', function (err, data) {
        if (err) throw err;
        var itinerarios = parsers.parseItinerarios(1, data);
        itinerariosAssertion(itinerarios, done);
      });
    });

    it('should execute parseHorarios given the layout', function(done) {
      fs.readFile('./data/transcol/horarios.html', function (err, data) {
        if (err) throw err;
        var horarios = parsers.parseHorarios(1, data);
        horariosAssertion(horarios, done);
      });
    });

    it('should execute parseObservacoes given the layout', function(done) {
      fs.readFile('./data/transcol/horarios.html', function (err, data) {
        if (err) throw err;
        var observacoes = parsers.parseObservacoes(1, data);
        observacoesAssertion(observacoes, done);
      });
    });

    it('should execute parseSaidaDestino given the layout', function(done) {
      fs.readFile('./data/transcol/horarios.html', function (err, data) {
        if (err) throw err;
        var parsed = parsers.parseSaidaDestino(data);
        saidaDestinoAssertion(parsed, done);
      });
    });
  });

  describe('seletivo', function () {
    it('should execute parseLinhas given the layout', function (done) {
      fs.readFile('./data/seletivo/linhas.html', function (err, data) {
        if (err) throw err;
        var linhas = parsers.parseLinhas(1, '#select1 option', data);
        linhasAssertion(linhas, done);
      });
    });

    it('should execute parseItinerarios given the layout', function(done) {
      fs.readFile('./data/seletivo/itinerarios.html', function (err, data) {
        if (err) throw err;
        var itinerarios = parsers.parseItinerarios(1, data);
        itinerariosAssertion(itinerarios, done);
      });
    });

    it('should execute parseHorarios given the layout', function(done) {
      fs.readFile('./data/seletivo/horarios.html', function (err, data) {
        if (err) throw err;
        var horarios = parsers.parseHorarios(1, data);
        horariosAssertion(horarios, done);
      });
    });

    it('should execute parseObservacoes given the layout', function(done) {
      fs.readFile('./data/seletivo/horarios.html', function (err, data) {
        if (err) throw err;
        var observacoes = parsers.parseObservacoes(1, data);
        observacoesAssertion(observacoes, done);
      });
    });

    it('should execute parseSaidaDestino given the layout', function(done) {
      fs.readFile('./data/seletivo/horarios.html', function (err, data) {
        if (err) throw err;
        var parsed = parsers.parseSaidaDestino(data);
        saidaDestinoAssertion(parsed, done);
      });
    });
  });
});
