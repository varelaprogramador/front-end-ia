import { NextRequest, NextResponse } from "next/server";

const RDSTATION_TOKEN_URL = "https://api.rd.services/oauth2/token";

interface TokenExchangeRequest {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenExchangeRequest = await request.json();
    const { code, clientId, clientSecret, redirectUri } = body;

    if (!code || !clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Parâmetros obrigatórios ausentes: code, clientId, clientSecret",
        },
        { status: 400 }
      );
    }

    // Determinar redirectUri
    const finalRedirectUri =
      redirectUri ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/rdstation/callback`;

    console.log("🔑 [RD Station Exchange] Iniciando troca de token:", {
      code: code.substring(0, 10) + "...",
      clientId: clientId.substring(0, 10) + "...",
      redirectUri: finalRedirectUri,
    });

    // Fazer a requisição para trocar o code pelo access_token
    const tokenResponse = await fetch(RDSTATION_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: finalRedirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error("❌ [RD Station Exchange] Erro na troca:", {
        status: tokenResponse.status,
        response: responseText,
      });

      let errorMessage = "Erro ao trocar código por token";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage =
          errorData.error_description || errorData.error || errorMessage;
      } catch {
        // Usar mensagem padrão
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: responseText,
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData: TokenExchangeResponse = JSON.parse(responseText);

    console.log("✅ [RD Station Exchange] Token obtido com sucesso:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        tokenUpdatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [RD Station Exchange] Erro interno:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
