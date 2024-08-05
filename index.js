const express = require('express');
const { exec } = require('child_process');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Endpoint para atualizar dados
app.get('/update-data', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    const url = 'https://selecao-login.app.ufgd.edu.br/';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const processos = await page.evaluate(() => {
      const processosAbertos = [];
      const processosEmAndamento = [];

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

      return {
        processosAbertos: processosAbertos,
        processosEmAndamento: processosEmAndamento
      };
    });

    await browser.close();

    // Salvar os dados em um arquivo JSON
    fs.writeFileSync('processos.json', JSON.stringify(processos, null, 2));

    res.send('Dados atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    res.status(500).send('Erro ao atualizar dados');
  }
});

// Endpoint para obter dados
app.get('/get-data', (req, res) => {
  if (fs.existsSync('processos.json')) {
    const data = fs.readFileSync('processos.json');
    res.json(JSON.parse(data));
  } else {
    res.status(404).send('Dados não encontrados');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
