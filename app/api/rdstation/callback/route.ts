import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // URL de callback para mostrar ao usuário
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/rdstation/callback`;

  if (error) {
    // Redirecionar com erro
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro na Autorizacao - RD Station CRM</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 1rem; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
            h1 { color: #dc2626; margin-bottom: 1rem; font-size: 1.5rem; }
            p { color: #6b7280; margin: 0.5rem 0; }
            .error-msg { color: #991b1b; background: #fef2f2; padding: 0.75rem 1rem; border-radius: 6px; margin: 1rem 0; font-size: 0.875rem; }
            .callback-url { font-family: monospace; background: #fef3c7; padding: 0.75rem 1rem; border-radius: 6px; margin: 1rem 0; word-break: break-all; font-size: 0.75rem; color: #92400e; border: 1px solid #fcd34d; }
            .callback-label { font-size: 0.75rem; color: #d97706; font-weight: 600; margin-bottom: 0.25rem; }
            .timer { font-size: 0.875rem; color: #9ca3af; margin-top: 1rem; }
            .close-btn { background: #dc2626; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; font-size: 0.875rem; }
            .close-btn:hover { background: #b91c1c; }
            .copy-btn { background: #d97706; color: white; border: none; padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-top: 0.5rem; }
            .copy-btn:hover { background: #b45309; }
            .copy-btn.copied { background: #16a34a; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>&#10060; Erro na Autorizacao</h1>
            <p>Nao foi possivel autorizar a integracao com RD Station CRM.</p>
            <div class="error-msg">${
              errorDescription || error || "Erro desconhecido"
            }</div>

            <div class="callback-label">&#9888; Verifique se esta URL esta cadastrada no RD Station:</div>
            <div class="callback-url" id="callbackUrl">${callbackUrl}</div>
            <button class="copy-btn" id="copyBtn" onclick="copyUrl()">&#128203; Copiar URL</button>

            <button class="close-btn" onclick="window.close()">Fechar Janela</button>
            <p class="timer">Esta janela fechara automaticamente em <span id="countdown">15</span> segundos...</p>
          </div>
          <script>
            // Enviar erro para a janela pai
            if (window.opener) {
              window.opener.postMessage({
                type: 'RDSTATION_AUTH_ERROR',
                error: '${error}',
                error_description: '${errorDescription || ""}'
              }, '*');
            }

            function copyUrl() {
              const url = document.getElementById('callbackUrl').textContent;
              navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.innerHTML = '&#10004; Copiado!';
                btn.classList.add('copied');
                setTimeout(() => {
                  btn.innerHTML = '&#128203; Copiar URL';
                  btn.classList.remove('copied');
                }, 2000);
              });
            }

            // Countdown
            let seconds = 15;
            const countdown = document.getElementById('countdown');
            const interval = setInterval(() => {
              seconds--;
              countdown.textContent = seconds;
              if (seconds <= 0) {
                clearInterval(interval);
                window.close();
              }
            }, 1000);
          </script>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  if (code) {
    // Sucesso - enviar código para a janela pai e fechar
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Autorizacao Concluida - RD Station CRM</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 1rem; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
            h1 { color: #16a34a; margin-bottom: 1rem; font-size: 1.5rem; }
            p { color: #6b7280; margin: 0.5rem 0; }
            .success-icon { font-size: 3rem; margin-bottom: 1rem; }
            .timer { font-size: 0.875rem; color: #9ca3af; margin-top: 1rem; }
            .close-btn { background: #16a34a; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; font-size: 0.875rem; }
            .close-btn:hover { background: #15803d; }
            .code-section { margin: 1.5rem 0; }
            .code-label { font-size: 0.75rem; color: #16a34a; font-weight: 600; margin-bottom: 0.5rem; }
            .code-container { position: relative; }
            .code-value { font-family: monospace; background: #f0fdf4; padding: 0.75rem 1rem; border-radius: 6px; word-break: break-all; font-size: 0.75rem; color: #166534; border: 1px solid #86efac; filter: blur(4px); transition: filter 0.3s; user-select: none; }
            .code-value.revealed { filter: none; user-select: text; }
            .reveal-btn { background: #059669; color: white; border: none; padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-top: 0.5rem; }
            .reveal-btn:hover { background: #047857; }
            .copy-btn { background: #2563eb; color: white; border: none; padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-top: 0.5rem; margin-left: 0.5rem; display: none; }
            .copy-btn:hover { background: #1d4ed8; }
            .copy-btn.visible { display: inline-block; }
            .copy-btn.copied { background: #16a34a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">&#10004;</div>
            <h1>Autorizacao Concluida!</h1>
            <p>Codigo de autorizacao obtido com sucesso.</p>
            <p>A integracao com RD Station CRM esta pronta!</p>

            <div class="code-section">
              <div class="code-label">Codigo de Autorizacao:</div>
              <div class="code-container">
                <div class="code-value" id="codeValue">${code}</div>
              </div>
              <button class="reveal-btn" id="revealBtn" onclick="revealCode()">&#128065; Revelar Codigo</button>
              <button class="copy-btn" id="copyBtn" onclick="copyCode()">&#128203; Copiar</button>
            </div>

            <button class="close-btn" onclick="window.close()">Fechar Janela</button>
            <p class="timer">Esta janela fechara automaticamente em <span id="countdown">15</span> segundos...</p>
          </div>
          <script>
            // Enviar código para a janela pai
            if (window.opener) {
              window.opener.postMessage({ type: 'RDSTATION_AUTH_CODE', code: '${code}' }, '*');
            }

            function revealCode() {
              const codeValue = document.getElementById('codeValue');
              const revealBtn = document.getElementById('revealBtn');
              const copyBtn = document.getElementById('copyBtn');

              codeValue.classList.add('revealed');
              revealBtn.style.display = 'none';
              copyBtn.classList.add('visible');
            }

            function copyCode() {
              const code = '${code}';
              navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.innerHTML = '&#10004; Copiado!';
                btn.classList.add('copied');
                setTimeout(() => {
                  btn.innerHTML = '&#128203; Copiar';
                  btn.classList.remove('copied');
                }, 2000);
              });
            }

            // Countdown
            let seconds = 15;
            const countdown = document.getElementById('countdown');
            const interval = setInterval(() => {
              seconds--;
              countdown.textContent = seconds;
              if (seconds <= 0) {
                clearInterval(interval);
                window.close();
              }
            }, 1000);
          </script>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Sem código nem erro - mostrar URL de callback para o usuário copiar
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RD Station CRM - URL de Callback</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 1rem; }
          .container { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
          h1 { color: #2563eb; margin-bottom: 1rem; font-size: 1.5rem; }
          p { color: #6b7280; margin: 0.5rem 0; }
          .callback-url { font-family: monospace; background: #f0f9ff; padding: 0.75rem 1rem; border-radius: 6px; margin: 1rem 0; word-break: break-all; font-size: 0.875rem; color: #1e40af; border: 1px solid #93c5fd; }
          .callback-label { font-size: 0.875rem; color: #2563eb; font-weight: 600; margin-bottom: 0.5rem; }
          .copy-btn { background: #2563eb; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; font-size: 0.875rem; }
          .copy-btn:hover { background: #1d4ed8; }
          .copy-btn.copied { background: #16a34a; }
          .instructions { text-align: left; background: #fefce8; padding: 1rem; border-radius: 6px; margin-top: 1rem; font-size: 0.875rem; color: #854d0e; }
          .instructions ol { margin: 0.5rem 0 0 1rem; padding: 0; }
          .instructions li { margin: 0.25rem 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>&#128279; URL de Callback do RD Station CRM</h1>
          <p>Copie esta URL e cadastre no painel de desenvolvedores do RD Station:</p>

          <div class="callback-label">URL de Redirecionamento (Callback):</div>
          <div class="callback-url" id="callbackUrl">${callbackUrl}</div>
          <button class="copy-btn" id="copyBtn" onclick="copyUrl()">&#128203; Copiar URL</button>

          <div class="instructions">
            <strong>Como cadastrar:</strong>
            <ol>
              <li>Acesse <a href="https://appstore.rdstation.com/pt-BR/publisher" target="_blank">RD Station Developer</a></li>
              <li>Edite sua aplicacao</li>
              <li>Cole esta URL no campo "URL de Callback"</li>
              <li>Salve as alteracoes</li>
              <li>Volte e tente autorizar novamente</li>
            </ol>
          </div>
        </div>
        <script>
          function copyUrl() {
            const url = document.getElementById('callbackUrl').textContent;
            navigator.clipboard.writeText(url).then(() => {
              const btn = document.getElementById('copyBtn');
              btn.innerHTML = '&#10004; Copiado!';
              btn.classList.add('copied');
              setTimeout(() => {
                btn.innerHTML = '&#128203; Copiar URL';
                btn.classList.remove('copied');
              }, 2000);
            });
          }
        </script>
      </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
