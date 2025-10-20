# WebChat

Aplicação de chat em tempo real com foco em ferramentas avançadas de formatação e compartilhamento de conteúdo multimídia.

## Visão geral

- **Canal único**: todos os participantes conversam juntos no modo clássico, sem criação de grupos paralelos.
- **Login rápido**: basta informar um nome para entrar na sala compartilhada.
- **Compositor compacto**: o formulário de mensagem permanece discreto e revela recursos extras sob demanda.
- **Formatação rica**: atalhos para negrito, itálico, sublinhado, riscado, grifado, spoiler e respostas.
- **Menções inteligentes**: ao digitar `@`, sugestões com os nomes conectados via backend aparecem e a aba do navegador destaca novas menções.
- **Compartilhamento de mídia**: gere iFrames de posts e vídeos de redes sociais compatíveis diretamente no chat.
- **Botões de perfil**: monte rapidamente botões sociais personalizados com os ícones oficiais.
- **Presença online**: visualize quem está conectado em tempo real através do painel dedicado.

## Estrutura do projeto

```
frontend/
├── css/style.css        # Estilos do chat, login, compositor e botões sociais
├── images/              # Recursos visuais utilizados na interface
├── index.html           # Marcações HTML da aplicação
└── js/script.js         # Lógica do login, mensagens, menções e interações
```

## Como executar

1. Abra o arquivo `frontend/index.html` em um navegador moderno.
2. Informe um nome no formulário de login e clique em **Entrar**.
3. Utilize o compositor no rodapé para enviar mensagens, abrir o menu avançado, aplicar formatação ou incorporar conteúdos.

> O chat utiliza um servidor WebSocket público configurado no script (`wss://webchat-backend-b23r.onrender.com`). Caso deseje usar outro backend, ajuste a URL em `frontend/js/script.js`.

## Funcionalidades principais

### Menu avançado do compositor

- Clique no ícone de ajustes para expandir as opções avançadas.
- Utilize os botões de formatação para inserir marcação automaticamente no texto selecionado.
- O botão de menção (`@`) insere o gatilho correto e abre as sugestões.
- Use o botão `×` para recolher o construtor de botões sociais temporariamente e o controle **Cancelar/Reabrir** para ocultar ou mostrar a lista de grupos.

### Menções e notificações

- Digite `@` seguido das primeiras letras de um nome para ver as sugestões.
- Navegue com as setas ou clique na pessoa que deseja mencionar.
- Quando alguém mencionar você, o título da aba muda para **"NomePessoa te Mencionou"**.
- Mensagens recebidas sem foco na aba fazem o título exibir **"Novas Mensagens"**.
- Ao retornar para a aba, o título volta para o padrão do site.

### Compartilhamento de mídia

- Abra "Compartilhar vídeo ou post" para gerar iFrames de YouTube, Instagram, Threads, Twitter/X, Bluesky, Mastodon e outras redes.
- Cole o link desejado, clique em **Adicionar iFrame** e visualize a prévia antes de enviar.
- O iFrame é anexado ao conteúdo da mensagem.

### Botões de perfil social

1. Escolha a rede no seletor.
2. Cole o link completo do seu perfil.
3. Clique em **Adicionar** para incluir o botão na pré-visualização.
4. Use **Inserir na mensagem** para enviar o bloco com os botões montados.

Os ícones são carregados diretamente a partir do CDN fornecido nas instruções originais.

### Presença online

- O botão com ícone de pessoas, localizado no topo direito, abre um painel listando todos os usuários conectados.
- O item do usuário atual recebe a indicação **"(você)"**.

## Personalização

- Ajuste cores, espaçamentos ou breakpoints no arquivo `frontend/css/style.css`.
- Expanda a lista `SOCIAL_NETWORKS` em `frontend/js/script.js` para suportar novas redes sociais.
- Adapte o tratamento de embeds na função `buildEmbedMarkup` conforme necessário.

## Licença

Este projeto foi fornecido sem especificação de licença. Verifique com o autor original antes de reutilizar o código.
