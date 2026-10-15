# Fronteira Açaí & Doces - Sistema de Pedidos

Sistema de atendimento para computador, com revisão lateral do pedido, produção, entregas e uma segunda janela de chamadas para a TV.

**Para instalar, enviar ao GitHub ou hospedar:** veja o [guia completo em docs/INSTALACAO.md](docs/INSTALACAO.md). O mesmo guia está disponível para download em **Configurações > Instalação e offline**.

## O que ele faz

- **Atendimento em 16:9:** navegação à esquerda, produtos ao centro e revisão à direita. Produtos e revisão têm rolagens independentes; subtotais, adicionais, total e botão de confirmação ficam sempre visíveis em telas de computador (a partir de 960 px de largura).
- **Revisão antes da impressão:** o campo **Nome do cliente** fica fixo acima dos itens. Se ficar vazio, o nome salvo é **Cliente**. Clique em **Revisar e confirmar**, confira os dados ou a prévia do cupom e escolha **Confirmar e imprimir** ou **Confirmar sem imprimir**. O rascunho é mantido ao trocar de aba, mas não após recarregar a página.
- **Depois de confirmar:** feche a janela pelo **X**, **Voltar ao atendimento** ou **Esc**. O pedido permanece salvo, sem ser duplicado. Há botões para novo pedido, reimpressão e acesso à produção, além de reimpressão do último pedido na tela de atendimento.
- **Pedidos em produção:** pedidos confirmados entram direto nessa coluna. A antiga etapa "Em análise" foi removida; pedidos existentes nessa etapa são migrados para produção sem apagar o histórico.
- **Prontos para entrega:** o botão **Pronto e chamar** muda o status e dispara a primeira chamada em uma única ação. **Chamar novamente**, no topo do pedido, repete a chamada e incrementa o contador. Chamar não entrega o pedido: use **Marcar como entregue** quando o cliente retirar.
- **Pedidos entregues:** coluna vermelha com número, nome, itens e data. Busque por número ou cliente e filtre por hoje, últimos 7 dias ou todos os dias. **Repetir este pedido** copia os itens e valores originais para uma nova revisão, sem alterar o pedido entregue; um novo número só é gerado após confirmar.
- **WhatsApp na TV:** contato com DDI/DDD, QR Code gerado localmente, frase e mensagem inicial opcionais, dois tamanhos, prévia, link de teste e download SVG. Exibição opcional ao lado das últimas chamadas.
- **Configurações:** abas Loja, Produtos e adicionais, Tela da TV, Impressão do cupom, Backup e Instalação e offline.

## Configurar a TV

1. Acesse **Configurações > Tela da TV**, ou clique em **Configurar TV** na própria janela do painel.
2. Use **Buscar e carregar imagens** para selecionar até **10 arquivos JPG, PNG ou WebP**, com até 15 MB por arquivo. As imagens são otimizadas para até 2560 px e salvas em IndexedDB no navegador, não apenas referenciadas pelo nome do arquivo.
3. Organize a ordem com as setas, ative/desative imagens, substitua um cardápio ou remova o que não quiser mais. As imagens permanecem salvas ao fechar e reabrir o navegador.
4. Configure o tempo de **2 a 120 segundos** e escolha sequência contínua ou ordem aleatória. No modo aleatório, todas as imagens passam antes de um novo ciclo, sem repetir a última imagem imediatamente.
5. Use **Imagem inteira** para não cortar textos do cardápio. **Preencher o espaço** pode cortar bordas. As imagens enviadas são exibidas sem preços ou textos do catálogo sobre elas.
6. Marque **Mostrar data**, **Mostrar hora** e **Som das chamadas** conforme desejar. A mensagem superior também é editável.
7. Abra **Painel da TV** pelo botão do aplicativo, arraste a janela para o segundo monitor e clique em **Tela cheia** ou pressione F11. Clique uma vez em **Ativar som e voz** para liberar o áudio no navegador. Use **Testar chamada** para verificar campainha e voz antes do atendimento. Também há botões para pausar e retomar a apresentação.
8. Na aba **WhatsApp na TV**, informe seu contato real, teste o link e salve a opção de exibir o QR Code. Ele é gerado sem internet; o cliente precisa de internet no celular para conversar.

Enquanto não houver imagens ativas, a TV usa as fotos do catálogo. Um pedido recém-criado aparece como **Pedido recebido / Em preparo**, com nome e número; ainda não é anunciado como pronto. Ao clicar em **Pronto e chamar**, ele passa para o destaque de retirada e é anunciado, por exemplo: "Pedido número 12. Maria. Seu pedido está pronto. Retire no balcão." Sem nome, a voz usa "Cliente". Os últimos três pedidos prontos aparecem na parte inferior. Pedidos entregues saem do painel.

A aba Pedidos mostra **TV conectada** e confirma **A TV recebeu a chamada** somente após a janela da TV acusar o recebimento. Se a TV estiver fechada, a chamada fica registrada, mas a interface orienta abrir o painel e usar **Chamar novamente**. A sincronização usa BroadcastChannel, eventos de armazenamento, conferência periódica dos dados e comunicação direta com a janela aberta pelo aplicativo para cobrir restrições de prévias incorporadas.

O áudio depende de uma interação na janela da TV. A opção **Falar número e nome**, nas configurações da TV, liga ou desliga a voz. Para voz offline, é necessária uma voz em português instalada no sistema/navegador. Se a voz estiver indisponível, a chamada visual continua funcionando; o painel mostra uma orientação de áudio. O indicador de recebimento confirma a exibição, não que o alto-falante físico esteja ligado.

**Sincronização:** use duas janelas do **mesmo navegador, mesmo perfil e mesmo endereço** no computador conectado à TV. A versão local não sincroniza navegadores diferentes, outros computadores ou uma TV que acesse o site separadamente pela rede. Isso exigiria um servidor compartilhado.

## Configurar o cupom

Abra **Configurações > Impressão do cupom**. Escolha a largura (58 ou 80 mm) e o que mostrar: logo, endereço, telefone, cliente, data e hora, tipo, pagamento, adicionais, observações, valores e mensagem de rodapé. O número e os produtos são sempre impressos.

A prévia usa o mesmo modelo da impressão. Use **Imprimir teste** antes de iniciar o atendimento. O cupom é um comprovante de pedido, não um documento fiscal. A impressão abre a caixa de diálogo do navegador; selecione a impressora, ajuste o papel no driver e desative cabeçalhos e rodapés automáticos do navegador. Permita pop-ups para este site.

## Dados e backup

Produtos, pedidos e configurações (incluindo WhatsApp) ficam no armazenamento local do navegador; as imagens da TV ficam em IndexedDB. **Configurações > Backup > Exportar backup completo** inclui todos esses dados. Backups da versão anterior também são aceitos; importar um backup sem imagens não apaga a playlist atual. Backups não devem ser enviados ao repositório público.

Antes de trocar de computador, navegador ou endereço do site, exporte um backup. Limpar os dados do site também remove os pedidos e as imagens. Evite janela anônima. Restaurar o padrão não apaga pedidos nem as imagens da TV.

## Como rodar no computador

Precisa do [Node.js LTS](https://nodejs.org) instalado. Prepare uma vez com internet:

```bash
npm install
npm run build
```

Depois, no Windows abra **INICIAR-FRONTEIRA.bat**. No macOS/Linux, execute **sh iniciar-fronteira.sh**. O endereço fixo é **http://localhost:4173**. Mantenha a janela do servidor aberta. O inicializador não precisa de internet nem de npm depois que a pasta `dist` estiver pronta. Não abra `dist/index.html` por duplo clique.

As fontes e o logo estão incluídos na versão compilada. As imagens enviadas para a TV ficam salvas no navegador. Fotos do catálogo por URL precisam de internet ou cache; se falharem, o logo é exibido sem bloquear o atendimento.

Para desenvolvimento, `npm run dev` continua disponível. O endereço de desenvolvimento tem uma base local diferente: exporte e importe um backup ao mudar de endereço. A opção **Preparar acesso offline** funciona apenas na versão compilada e é uma proteção extra, não substitui o servidor local nem backups.

## GitHub e hospedagem

Use o GitHub para guardar o código (pode ser um repositório privado). O workflow `.github/workflows/preparar-pacotes.yml` compila a branch `main` e disponibiliza dois downloads na aba **Actions > execução > Artifacts**:

- **fronteira-offline:** arquivos compilados, inicializador, servidor local e guia.
- **fronteira-site:** conteúdo de `dist` pronto para upload em uma hospedagem estática.

Para um endereço online gratuito, o guia mostra o upload direto no **Cloudflare Pages**, usando seu subdomínio `.pages.dev` com HTTPS. Envie `dist` inteiro, com `index.html` na raiz, não o código-fonte nem backups. Esta versão não tem login, banco na nuvem ou sincronização entre computadores.

**Atenção:** GitHub Pages tem restrições a sites que operam negócios/transações comerciais. Não o recomendamos para operar este caixa. Guardar o código no GitHub não é a mesma coisa que hospedar no Pages. Consulte os links oficiais e os passos em [docs/INSTALACAO.md](docs/INSTALACAO.md).

Nenhuma hospedagem oferece garantia de zero interrupções. Para reduzir a dependência da internet, use o servidor local no caixa, uma TV como segundo monitor e backup diário fora do computador.

## Conferência no equipamento da loja

1. Em uma tela 1366x768 ou 1920x1080, adicione vários produtos e role o catálogo: o total e a confirmação devem continuar visíveis à direita.
2. Confirme um pedido de teste com nome, adicional e observação. Verifique que ele entrou diretamente em produção e confira o cupom na impressora escolhida.
3. Abra a TV pelo botão do aplicativo, ative som e voz, use **Pronto e chamar** e depois **Chamar novamente**. Confira o número, nome, contador, confirmação de recebimento e voz. Faça também um pedido sem nome e confira o uso de "Cliente".
4. Marque como entregue e use **Repetir este pedido** na coluna vermelha. Confira que o original permanece entregue e a cópia aguarda confirmação com um novo número.
5. Carregue imagens, ajuste o intervalo, alterne data/hora, reordene e substitua uma imagem. Recarregue as duas janelas para conferir a persistência.
6. Exporte um backup e guarde uma cópia fora do computador da loja.
7. Cadastre seu WhatsApp, salve e escaneie a prévia com o celular. Confira o destino real, depois teste mostrar/ocultar na TV e o tamanho maior.
8. Na versão compilada, teste o inicializador sem Wi-Fi. Se preparar também a cópia offline no navegador, desconecte e recarregue o aplicativo para conferir. A primeira preparação, a publicação e a abertura da conversa do WhatsApp precisam de conexão.

## Testes de regressão

Os testes em `tests/atendimento-tv.spec.ts` cobrem duas janelas, nome e número, repetição de chamadas, reimpressão sem duplicação, X/Voltar/Esc, recuperação de sincronização e a revisão fixa em 1366x768.

Prepare o Chromium com `npx playwright install --with-deps chromium` e execute `npx playwright test`. Para testar a versão compilada no servidor local, rode `npm run build` e depois `PW_PRODUCTION=1 npx playwright test` em um terminal compatível. A fala é simulada nos testes para conferir o texto enviado ao navegador; a voz e a impressora físicas devem ser verificadas na loja.
