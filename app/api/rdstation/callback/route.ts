import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // Redirecionar com erro
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro na Autorização</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fef2f2; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #dc2626; margin-bottom: 1rem; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Erro na Autorização</h1>
            <p>Não foi possível autorizar a integração com RD Station.</p>
            <p>Erro: ${error}</p>
            <p>Esta janela será fechada em 3 segundos...</p>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (code) {
    // Sucesso - enviar código para a janela pai e fechar
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autorização Concluída</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #16a34a; margin-bottom: 1rem; }
            p { color: #6b7280; }
            .code { font-family: monospace; background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 4px; margin: 1rem 0; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Autorização Concluída!</h1>
            <p>Código de autorização obtido com sucesso.</p>
            <p class="code">${code}</p>
            <p>Esta janela será fechada automaticamente...</p>
          </div>
          <script>
            // Enviar código para a janela pai
            if (window.opener) {
              window.opener.postMessage({ type: 'RDSTATION_AUTH_CODE', code: '${code}' }, '*');
            }
            // Fechar janela após 2 segundos
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Sem código nem erro
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Erro</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fef3c7; }
          .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #d97706; margin-bottom: 1rem; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Parâmetros Inválidos</h1>
          <p>Nenhum código de autorização foi recebido.</p>
          <p>Esta janela será fechada em 3 segundos...</p>
        </div>
        <script>
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
