# Fronteira: instalar, publicar e continuar atendendo

## Minha recomendação para a loja

Use o sistema **localmente no computador do caixa**, com a TV conectada por HDMI como segundo monitor. Mantenha o código em um repositório GitHub e faça backup dos dados todos os dias. Se quiser um endereço online, use uma hospedagem estática como Cloudflare Pages como opção adicional, não como única proteção contra falhas.

Essa organização não exige mensalidade do aplicativo nem servidor pago. Não existe garantia de zero interrupções: falta de energia, defeito no computador, disco cheio, impressora, exclusão dos dados do navegador ou falhas de hospedagem ainda podem acontecer.

## 1. QR Code do WhatsApp

1. Abra **Configurações > Tela da TV > WhatsApp na TV**. O mesmo ajuste está no botão **Configurar TV** do próprio painel.
2. No Brasil, use **DDI 55** e informe **DDD + número** no outro campo. Exemplo de formato: `(11) 99999-9999`. Não use esse exemplo como contato real.
3. Opcionalmente, escreva uma mensagem inicial e a frase que aparecerá ao lado do código. A mensagem só é enviada se o cliente confirmar no WhatsApp.
4. Escolha o tamanho, marque **Mostrar QR Code no painel da TV** e clique em **Salvar contato e exibição**.
5. Use **Testar conversa** e escaneie a prévia com seu celular. Confira o contato real antes de deixar a TV visível para clientes. Validar o formato não confirma que o número tem uma conta ativa.
6. Se quiser, baixe o SVG para usar em um cardápio. Ao mudar o número, o QR Code da TV é atualizado, mas os arquivos já baixados precisam ser substituídos manualmente.

O QR Code é gerado dentro do aplicativo, sem API, assinatura nem serviço externo de geração. Ele funciona visualmente com o computador offline. O **celular do cliente precisa de internet** para abrir o link e conversar no WhatsApp.

O QR Code não mostra os pedidos do caixa nem compartilha seus dados; ele abre apenas o contato configurado.

## Pedidos, nomes e chamadas na TV

1. No topo direito do atendimento, preencha **Nome do cliente**. É opcional; se deixar vazio, o sistema salva **Cliente**. O campo fica visível mesmo ao rolar os itens.
2. Ao confirmar, o pedido aparece na TV como **em preparo**, com número e nome. Isso ainda não anuncia a retirada de um produto que não está pronto.
3. Feche a confirmação pelo **X**, **Voltar ao atendimento** ou **Esc**. O pedido continua salvo. Há também botões para novo pedido, reimpressão e acesso aos pedidos em produção.
4. Na aba **Pedidos**, clique em **Pronto e chamar** quando terminar o preparo. Essa ação já marca como pronto e dispara a primeira chamada, sem exigir outro clique.
5. Repita com **Chamar novamente** quantas vezes precisar. A TV destaca número e nome. Com áudio habilitado, fala "Pedido número 12. Maria. Seu pedido está pronto. Retire no balcão." Sem nome, usa "Cliente".
6. Marque **Marcar como entregue** apenas quando o cliente retirar. Isso remove o pedido das chamadas da TV e mantém o registro nos entregues.

**Se não chamar:** confira **TV conectada** na aba Pedidos. Abra o painel pelo botão do próprio aplicativo, no mesmo navegador e perfil, com o mesmo endereço. Na janela da TV, clique em **Ativar som e voz** e depois em **Testar chamada**. Em Configurar TV, mantenha **Som das chamadas** e **Falar número e nome** ativados. Confira também a saída de áudio HDMI, o volume da TV e se a aba não está silenciada.

O operador vê **A TV recebeu a chamada** quando a janela do painel confirma a exibição. Se ela estiver desconectada, o sistema informa que a chamada foi registrada e pede para abrir a TV e repetir. A confirmação não garante que o som físico está audível. Para voz sem internet, instale uma voz em português no computador; a chamada visual não depende dessa voz.

Depois de atualizar esta versão, feche a janela antiga da TV e reabra pelo aplicativo para que as duas telas usem a mesma versão. Não é preciso limpar os dados nem apagar seus pedidos.

## 2. Uso local no computador, sem internet

### Preparar a partir do projeto

1. Enquanto estiver com internet, instale o [Node.js LTS](https://nodejs.org/). Use Node 22 atualizado ou uma versão LTS mais recente.
2. Baixe o projeto completo, extraia o ZIP e abra o terminal na pasta que contém `package.json`.
3. Execute `npm install` uma vez para instalar as dependências.
4. Execute `npm run build` para gerar a pasta `dist`.
5. Exporte um backup na versão que você já usa antes de mudar para um novo endereço.
6. No Windows, dê dois cliques em **INICIAR-FRONTEIRA.bat**. No macOS/Linux, abra o terminal na pasta e execute **sh iniciar-fronteira.sh**.
7. O navegador abre **http://localhost:4173**. Se não abrir automaticamente, digite esse endereço. Mantenha a janela do servidor aberta durante o expediente.
8. Importe seu backup nesse endereço, se necessário. Abra o painel da TV em outra janela do mesmo navegador/perfil, arraste para a TV e ative tela cheia e som.

Depois dessa preparação, para cada dia de trabalho basta abrir o inicializador. O servidor local usa somente os recursos padrão do Node: **não baixa pacotes, não chama npm e não precisa de internet para iniciar**. É preciso manter o Node instalado e conservar a pasta `dist` inteira.

### Alternativa: pacote pronto gerado pelo GitHub

1. Envie o código ao GitHub seguindo a seção 4.
2. Abra a aba **Actions**, selecione **Preparar pacotes da Fronteira** e aguarde a execução verde. Se necessário, clique em **Run workflow** e escolha a branch `main`.
3. Abra a execução concluída e, na seção **Artifacts**, baixe **fronteira-offline**. É necessário estar conectado à conta GitHub com acesso ao repositório.
4. Extraia o ZIP inteiro em uma pasta, por exemplo `C:\Fronteira`. Não execute arquivos de dentro do ZIP.
5. Instale o Node.js LTS uma única vez. Depois use o arquivo **INICIAR-FRONTEIRA.bat**.

O pacote contém a versão compilada (`dist`), o inicializador, o servidor local e este guia. Ele não inclui pedidos, seus cardápios enviados ou dados de clientes. Esses dados são transferidos pelo **backup exportado dentro do aplicativo**, não pelo código do projeto.

Os artefatos ficam disponíveis por 30 dias na automação fornecida. Baixe e guarde sua cópia. Você pode gerar outro pacote executando o workflow novamente. Os limites de Actions variam conforme o plano e a visibilidade do repositório; acompanhe a cota da conta.

### O que funciona sem internet

- Criar e revisar pedidos, calcular valores, editar e consultar entregues.
- Imprimir pela impressora instalada no computador, desde que o driver/conexão local esteja disponível.
- Chamar pedidos entre as duas janelas do mesmo navegador/perfil.
- Mostrar as imagens enviadas para a TV, data, hora e o QR Code do WhatsApp.
- Gerar e importar backups.
- Carregar as fontes do aplicativo, que agora fazem parte da versão compilada.

As fotos padrão do catálogo usam links externos. Se não estiverem em cache, aparece o logo no lugar da foto, sem impedir o pedido. Para cardápios offline, prefira os arquivos enviados em **Tela da TV**. Um Pix selecionado no cupom é apenas a forma de pagamento registrada; o sistema não consulta o banco nem confirma recebimento do Pix.

### Mantenha o mesmo endereço

Use sempre **http://localhost:4173** e o mesmo perfil de navegador. `localhost:4173`, `127.0.0.1:4173`, `localhost:5173` e o endereço publicado na internet têm armazenamentos separados. Trocar o endereço pode parecer que apagou os dados, mesmo quando eles continuam no endereço antigo.

O inicializador não troca a porta silenciosamente. Se a porta 4173 estiver ocupada, ele avisa. Se outra instância da Fronteira já estiver aberta nela, apenas abre a página dessa instância.

O servidor escuta apenas no próprio computador. A TV deve ser um segundo monitor desse computador. Acessar a URL em uma Smart TV ou outro computador não sincroniza os pedidos: esta versão não tem banco compartilhado pela rede.

## 3. Uma cópia offline dentro do navegador

Além do servidor local, a versão compilada oferece **Configurações > Instalação e offline > Preparar acesso offline**.

1. Abra o aplicativo compilado pelo inicializador local ou pelo site publicado com HTTPS.
2. Clique em **Preparar acesso offline** e aguarde a confirmação de que os arquivos foram salvos.
3. Fora do atendimento, desligue a internet e recarregue o atendimento e a TV para verificar o comportamento no seu computador.
4. Se o navegador oferecer **Instalar aplicativo** no menu ou na barra de endereço, você pode criar um atalho. A apresentação dessa opção varia conforme o navegador.

Isso usa um service worker para reabrir o aplicativo já salvo quando a rede falhar. A prévia de desenvolvimento (`npm run dev`) não é armazenada por essa opção. Não é garantido reabrir o site sem conexão antes de preparar o acesso. Se o usuário limpar o cache ou o navegador o remover, será necessário preparar novamente.

O botão **Proteger armazenamento** solicita ao navegador menor risco de remoção automática. A permissão depende do navegador e **não impede exclusão manual, falha de disco ou perda do perfil**. Não substitui backups. Não use janela anônima.

O cache salva o programa, não é uma cópia extra dos pedidos. Os pedidos continuam no armazenamento do navegador. Atualize o site e reinicie as janelas fora do atendimento, após fazer backup. Não dependa dessa cópia como sua única maneira de abrir o caixa.

## 4. Como colocar o projeto no GitHub

**GitHub é onde você guarda e versiona o código. GitHub Pages é um serviço de hospedagem diferente.** Você pode usar o primeiro sem usar o segundo.

### Caminho recomendado: GitHub Desktop

1. Crie sua conta em [github.com](https://github.com/) e instale [GitHub Desktop](https://desktop.github.com/).
2. No GitHub Desktop, entre na sua conta e escolha **File > New repository**.
3. Dê o nome `fronteira-pedidos`, escolha uma pasta para o repositório e clique em **Create repository**. Para a operação interna, você pode manter o repositório privado.
4. Abra a pasta criada e copie para dentro dela o conteúdo completo deste projeto: `src`, `public`, `tools`, `docs`, `.github`, os inicializadores, `package.json`, `package-lock.json` (se existir), os arquivos de configuração, `.gitignore`, `.gitattributes` e o README. `package.json` deve ficar na raiz do repositório, não dentro de uma segunda pasta.
5. Não copie `node_modules` nem `dist` para o repositório de código. Confira a lista de arquivos em **Changes**. A pasta `.github` precisa estar incluída, mesmo sendo uma pasta oculta em alguns sistemas.
6. Escreva uma descrição, como `Versão do sistema da loja`, e clique em **Commit to main**.
7. Clique em **Publish repository**. Use **Keep this code private** se quiser preservar o código como privado. Isso não impede o uso local nem a publicação pela sua conta Cloudflare.
8. Abra o repositório no site do GitHub. Em **Actions**, acompanhe o workflow **Preparar pacotes da Fronteira**. Se o GitHub pedir permissão para executar Actions, habilite no repositório.

Para atualizações, copie os novos arquivos para a mesma pasta, revise as alterações, faça **Commit to main** e **Push origin**. Um novo pacote será gerado. A automação não publica nada automaticamente em uma hospedagem e não altera os dados salvos no seu navegador.

### O que nunca enviar

- Backups com nomes de clientes, pedidos ou outras informações reais da loja.
- Senhas, tokens de acesso, chaves de API ou arquivos `.env`.
- O perfil do navegador e cópias das pastas de dados do navegador.

O `.gitignore` fornecido exclui os nomes de backup criados por este sistema e a pasta `backups`, mas não reconhece todos os arquivos renomeados. Confira sempre antes de publicar. Um repositório não é backup automático dos pedidos.

## 5. Como ter um endereço online gratuito

### Recomendação: Cloudflare Pages com upload direto

1. Crie uma conta em [Cloudflare](https://dash.cloudflare.com/).
2. Tenha uma versão compilada. Use a pasta `dist` criada no seu computador ou baixe **fronteira-site** em **GitHub > Actions > execução concluída > Artifacts**.
3. No painel Cloudflare, abra **Workers & Pages**, depois **Create application** e a opção de **Pages**. Procure **Drag and drop your files** ou **Upload assets**. Os nomes da interface podem mudar.
4. Dê um nome ao projeto, por exemplo `fronteira-pedidos`.
5. Envie a pasta `dist` ou o ZIP `fronteira-site`. Na raiz enviada deve existir `index.html`, junto de `images`, `sw.js` e `manifest.webmanifest`. Não envie o ZIP do código-fonte, nem o pacote offline que contém uma pasta `dist` interna.
6. Clique em **Deploy site** / **Save and Deploy**. A Cloudflare informa o endereço `https://SEU-PROJETO.pages.dev`.
7. Abra esse endereço, configure a loja e importe o backup que você exportou da instalação anterior. Prepare o acesso offline se quiser essa proteção adicional.

O subdomínio `.pages.dev` e o HTTPS dispensam compra de domínio. A documentação informa que requisições a arquivos estáticos são gratuitas e ilimitadas; builds, arquivos e outros recursos têm limites próprios, e os termos podem mudar. Esta aplicação não usa Pages Functions nem um banco na nuvem. Não ative serviços pagos sem entender a cobrança.

Para atualizar no modo upload direto, compile uma nova versão, abra o mesmo projeto Cloudflare, escolha **Create a new deployment** e envie novamente os arquivos. Mantenha o mesmo endereço. Atualize fora do expediente, após um backup e um teste local.

### Alternativa: integração da hospedagem com o repositório

Se preferir publicação automática e a opção estiver disponível na sua conta, crie um projeto Pages com integração GitHub, autorize somente o repositório necessário, selecione a branch `main`, use o comando **npm run build** e a pasta de saída **dist**. A raiz é a pasta que contém `package.json`. Use Node 22 ou LTS mais recente.

A escolha entre upload direto e integração Git é feita ao criar o projeto; a migração entre esses modos pode exigir criar outro projeto. Upload direto é o caminho mais simples para começar. Workers Static Assets também é uma alternativa atual da Cloudflare, mas exige uma configuração de publicação diferente; não envie este projeto como se já tivesse configuração de Worker.

### E o GitHub Pages?

A [documentação oficial de limites do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) diz que ele não deve ser usado como hospedagem gratuita para operar negócios online, comércio eletrônico ou sites voltados principalmente a facilitar transações comerciais. Por isso, **não recomendamos o Pages para operar este caixa**. Usar GitHub para guardar o código é uma coisa diferente e continua sendo uma opção.

Para documentação ou uma demonstração que esteja de acordo com os termos, o fluxo técnico é gerar `dist`, publicar apenas seu conteúdo em uma branch ou repositório de demonstração e configurar **Settings > Pages > Deploy from a branch** para essa branch e pasta raiz. O repositório precisa ser público para Pages no plano GitHub Free. Isso não é necessário para usar este sistema na loja.

## 6. O que a hospedagem não resolve

- Publicar o aplicativo não cria login, banco de dados, backup automático nem compartilhamento de pedidos entre computadores.
- Cada navegador/perfil/origem guarda seus próprios dados. Ter o mesmo site aberto em duas máquinas não as sincroniza.
- Quem acessar o site terá uma instalação vazia no próprio navegador; os dados que você já tem não são enviados para o repositório ou para a hospedagem por este código.
- Em computadores compartilhados, qualquer pessoa com acesso ao mesmo perfil pode ver ou alterar os dados locais. Use conta/perfil dedicado e bloqueio de tela.
- Não opere o mesmo caixa alternando local e online no meio do expediente sem planejar a transferência por backup. As bases são separadas.

## 7. Rotina para reduzir interrupções

1. Use a versão local como principal, com o computador ligado à tomada e a bateria do notebook em boas condições. Um nobreak é uma proteção opcional para equipamentos sem bateria.
2. Antes de abrir a loja, confira a impressora, faça um pedido de teste, chame na TV e teste o QR Code com o celular.
3. Não feche a janela do servidor local. Evite atualizações do Windows, navegador ou aplicativo durante o atendimento.
4. Exporte o backup completo no fim do dia e mantenha uma segunda cópia em pendrive ou armazenamento privado fora do computador.
5. Guarde uma cópia do pacote offline já preparado. Teste a restauração de um backup em outro perfil, sem substituir o perfil principal sem necessidade.
6. Se a versão online estiver aberta quando a rede cair, pedidos podem continuar sendo registrados localmente. Mas reabrir/recarregar exige servidor local ou a preparação offline já concluída; não prometa disponibilidade a partir de uma página nunca carregada.

## Fontes oficiais

- WhatsApp, links de conversa: https://faq.whatsapp.com/5913398998672934
- GitHub Desktop: https://desktop.github.com/
- GitHub Pages, disponibilidade e origem de publicação: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Pages, limites e uso comercial: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Cloudflare Pages, upload direto: https://developers.cloudflare.com/pages/get-started/direct-upload/
- Cloudflare Pages, preço de requisições estáticas: https://developers.cloudflare.com/pages/functions/pricing/

Publicar na sua conta exige que você execute esses passos. O código, o inicializador e a automação fornecidos não criam contas nem fazem publicação sem sua autorização.