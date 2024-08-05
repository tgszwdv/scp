const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://selecao-login.app.ufgd.edu.br/';
  await page.goto(url, { waitUntil: 'networkidle2' });

  const processos = await page.evaluate(() => {
    const processosAbertos = [];
    const processosEmAndamento = [];

    // Processos Seletivos Abertos
    const rowsAbertos = document.querySelectorAll('tr[ng-repeat="processo in ctrl.inscricoesAbertas track by $index"]');
    rowsAbertos.forEach(row => {
        const cells = row.querySelectorAll('td');
        const titulo = cells[0].innerText.trim();
        const descricao = cells[1].innerText.trim().replace('Mostrar mais', '').trim();
        const periodo = cells[2].innerText.trim();
        const editalUrl = cells[3].querySelector('a').href;
        const paginaUrl = cells[4].querySelector('a').href;

        if (!titulo.startsWith('PSIE')) {
            processosAbertos.push({
                titulo: titulo,
                descricao: descricao,
                periodo: periodo,
                url: paginaUrl,
                edital: editalUrl
            });
        }
    });

    // Processos Seletivos em Andamento
    const rowsAndamento = document.querySelectorAll('tr[ng-repeat="processo in ctrl.processosEmAndamento track by $index"]');
    rowsAndamento.forEach(row => {
        const cells = row.querySelectorAll('td');
        const titulo = cells[0].innerText.trim();
        const descricao = cells[1].innerText.trim().replace('Mostrar mais', '').trim();
        const periodo = cells[2].innerText.trim();
        const editalUrl = cells[3].querySelector('a').href;
        const paginaUrl = cells[4].querySelector('a').href;

        processosEmAndamento.push({
            titulo: titulo,
            descricao: descricao,
            periodo: periodo,
            url: paginaUrl,
            edital: editalUrl
        });
    });

    // Combinar todos os processos
    return {
        processosAbertos: processosAbertos,
        processosEmAndamento: processosEmAndamento
    };
  });

  await browser.close();

  // Salvar os dados em um arquivo JSON
  fs.writeFileSync('processos.json', JSON.stringify(processos, null, 2));
}

module.exports = scrape;
