import { NextRequest, NextResponse } from "next/server";

const RDSTATION_TOKEN_URL = "https://api.rd.services/oauth2/token";

interface RefreshTokenRequest {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshTokenRequest = await request.json();
    const { refreshToken, clientId, clientSecret } = body;

    if (!refreshToken || !clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros obrigatórios ausentes: refreshToken, clientId, clientSecret",
        },
        { status: 400 }
      );
    }

    console.log("🔄 [RD Station Refresh] Renovando token:", {
      clientId: clientId.substring(0, 10) + "...",
      hasRefreshToken: !!refreshToken,
    });

    // Fazer a requisição para renovar o access_token
    const tokenResponse = await fetch(RDSTATION_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error("❌ [RD Station Refresh] Erro na renovação:", {
        status: tokenResponse.status,
        response: responseText,
      });

      let errorMessage = "Erro ao renovar token";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error_description || errorData.error || errorMessage;
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

    const tokenData: RefreshTokenResponse = JSON.parse(responseText);

    console.log("✅ [RD Station Refresh] Token renovado com sucesso:", {
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
      },
    });
  } catch (error) {
    console.error("❌ [RD Station Refresh] Erro interno:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
