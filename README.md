# cold-monitor-dashboard

[English](#english) · [Português (Brasil)](#português-brasil)

---

## English

Web dashboard for **cold-monitor**, a cold-chain temperature monitoring system. It shows every active piece of
equipment registered in the [cold-monitor backend](https://github.com/carloslpv/cold-monitor-backend) with its current
temperature and status, a temperature chart against its allowed range, and the readings that fell out of range. It
updates live as readings arrive, with no page refresh.

### What it shows

- **Summary**: how many pieces of equipment are monitored, how many are in range or out of range right now, and how
  many out-of-range readings happened in the selected period.
- **One panel per equipment**: current temperature with its status (`Na faixa`, `Acima do máximo`, `Abaixo do mínimo`),
  allowed range, time since the last reading (flagged *sem sinal* after 60 seconds of silence) and out-of-range count.
  The chart draws the temperature over the selected period on top of the allowed band, with out-of-range readings
  marked as red dots. Hover a point to see its time, value and status. A panel turns red while its latest reading is
  out of range.
- **Out-of-range readings**: the latest 100 out-of-range readings across all equipment, newest first.
- **Period**: 15 minutes, 1 hour, 6 hours or 24 hours.

Status is always shown with an icon and a label, not by color alone. The interface is in Brazilian Portuguese and
follows the system light or dark theme.

### How it stays live

On load the dashboard fetches the equipment list, the reading history of each piece of equipment for the selected
period and the recent out-of-range readings from the REST API. It then opens the backend's Server-Sent Events stream
(`GET /api/v1/readings/stream`) and appends each new reading as it arrives. If the connection drops, the indicator in
the header switches to *Reconectando…*; once it is back, the history is reloaded so nothing stored meanwhile is missed.

Long periods can hold many thousands of readings, so each chart keeps the lowest and highest point of each time slice
(about 600 points in total). Short excursions past a threshold stay visible.

### Stack

- React 19 and TypeScript 6
- Vite 8
- [Recharts](https://recharts.org) 3 for the charts
- Oxlint

### Requirements

- Node.js 20.19+ or 22.12+
- The cold-monitor backend running (see its README). It allows requests from `http://localhost:5173` by default.
- Optionally, the [cold-monitor simulator](https://github.com/carloslpv/cold-monitor-simulator) to generate readings.

### Running

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. To see data move, start the backend and the simulator, for example:

```bash
java -jar target/cold-monitor-simulator.jar --interval 1s --excursion-probability 0.05
```

### Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080` | Backend base URL |

Set it in a `.env.local` file (see `.env.example`) or in the environment when running `npm run dev` or `npm run build`.
If the dashboard is served from an origin other than `http://localhost:5173`, add that origin to the backend's
`CORS_ALLOWED_ORIGINS`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server on port 5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with Oxlint |

### Project layout

```
src
├── App.tsx          page layout and period selection
├── components       header, summary, equipment panel, chart, out-of-range table, status badge
├── hooks            data loading and live stream (useMonitor), clock, chart colors
└── lib              API client, types, formatting, downsampling
```

---

## Português (Brasil)

Dashboard web do **cold-monitor**, um sistema de monitoramento de temperatura da cadeia fria. Ele mostra todos os
equipamentos ativos cadastrados no [backend do cold-monitor](https://github.com/carloslpv/cold-monitor-backend) com a
temperatura e o status atuais, um gráfico de temperatura com a faixa permitida e as leituras que ficaram fora da faixa.
Tudo é atualizado ao vivo conforme as leituras chegam, sem recarregar a página.

### O que aparece

- **Resumo**: quantos equipamentos são monitorados, quantos estão na faixa ou fora dela agora e quantas leituras
  fora da faixa aconteceram no período escolhido.
- **Um painel por equipamento**: temperatura atual com o status (`Na faixa`, `Acima do máximo`, `Abaixo do mínimo`),
  faixa permitida, tempo desde a última leitura (marcado como *sem sinal* após 60 segundos sem dados) e quantidade de
  leituras fora da faixa. O gráfico mostra a temperatura no período sobre a faixa permitida, com as leituras fora da
  faixa marcadas em vermelho. Passe o mouse sobre um ponto para ver horário, valor e status. O painel fica vermelho
  enquanto a última leitura estiver fora da faixa.
- **Leituras fora da faixa**: as 100 leituras fora da faixa mais recentes de todos os equipamentos.
- **Período**: 15 minutos, 1 hora, 6 horas ou 24 horas.

O status sempre aparece com ícone e texto, não só pela cor. A interface é em português e acompanha o tema claro ou
escuro do sistema.

### Como fica ao vivo

Ao abrir, o dashboard busca na API REST a lista de equipamentos, o histórico de leituras de cada um no período
escolhido e as leituras fora da faixa recentes. Depois abre o fluxo de Server-Sent Events do backend
(`GET /api/v1/readings/stream`) e acrescenta cada leitura nova assim que ela chega. Se a conexão cair, o indicador no
topo muda para *Reconectando…*; quando ela volta, o histórico é recarregado para não perder nada que tenha sido gravado
nesse meio-tempo.

Períodos longos podem ter milhares de leituras, então cada gráfico mantém o menor e o maior ponto de cada intervalo de
tempo (cerca de 600 pontos no total). Excursões curtas além dos limites continuam visíveis.

### Tecnologias

- React 19 e TypeScript 6
- Vite 8
- [Recharts](https://recharts.org) 3 nos gráficos
- Oxlint

### Requisitos

- Node.js 20.19+ ou 22.12+
- O backend do cold-monitor rodando (veja o README dele). Por padrão ele aceita requisições de `http://localhost:5173`.
- Opcionalmente, o [simulador do cold-monitor](https://github.com/carloslpv/cold-monitor-simulator) para gerar leituras.

### Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Para ver os dados se mexendo, suba o backend e o simulador, por exemplo:

```bash
java -jar target/cold-monitor-simulator.jar --interval 1s --excursion-probability 0.05
```

### Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080` | URL base do backend |

Defina em um arquivo `.env.local` (veja o `.env.example`) ou no ambiente ao rodar `npm run dev` ou `npm run build`.
Se o dashboard for servido de outra origem que não `http://localhost:5173`, adicione essa origem em
`CORS_ALLOWED_ORIGINS` no backend.

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 5173 |
| `npm run build` | Verifica os tipos e gera o build em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Lint com o Oxlint |

### Estrutura do projeto

```
src
├── App.tsx          layout da página e escolha do período
├── components       cabeçalho, resumo, painel do equipamento, gráfico, tabela de fora da faixa, selo de status
├── hooks            carga de dados e fluxo ao vivo (useMonitor), relógio, cores do gráfico
└── lib              cliente da API, tipos, formatação, redução de pontos
```
