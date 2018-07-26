# Ônibus GV Crawler

[![Build Status](https://travis-ci.org/onibus-gv/onibus-gv-crawler.svg?branch=master)](https://travis-ci.org/onibus-gv/onibus-gv-crawler)
[![Dependency Status](https://dependencyci.com/github/onibus-gv/onibus-gv-crawler/badge)](https://dependencyci.com/github/onibus-gv/onibus-gv-crawler)

Crawler para pegar horários dos ônibus da grande vitória

Empresas funcionando:

- Ceturb ( Transcol )
- Sanremo
- Seletivo Vitória

### Pré-Requisitos

- [node.js](https://nodejs.org) >= 10
- [git](https://git-scm.com/)

### Instalando

Clone o repositório e execute:

```shell
npm install
```

### Usando

```shell
node --experimental-modules app.mjs
```

Após o fim da execução será criado um arquivo `onibus.db` na raiz do projeto

### Linter

```shell
npm run eslint
```
