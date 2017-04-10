# Ônibus GV Crawler

[![Build Status](https://travis-ci.org/knoxzin1/onibus-gv-crawler.svg?branch=master)](https://travis-ci.org/knoxzin1/onibus-gv-crawler)
[![Dependency Status](https://dependencyci.com/github/knoxzin1/onibus-gv-crawler/badge)](https://dependencyci.com/github/knoxzin1/onibus-gv-crawler)

Crawler para pegar horários dos ônibus da grande vitória

Empresas funcionando:

- Ceturb ( Transcol )
- Sanremo
- Seletivo Vitória

### Pré-Requisitos

* [node.js](https://nodejs.org) >= 7.6
* [git](https://git-scm.com/)

### Instalando

Clone o repositório e execute:

```shell
npm install
```

### Usando

```shell
node app.js
```

Após o fim da execução será criado um arquivo `onibus.db` na raiz do projeto

### Testando
```shell
npm test
```

### Linter
```shell
npm run eslint
```
