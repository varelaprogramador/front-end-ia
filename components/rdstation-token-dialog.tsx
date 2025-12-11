"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Agent } from "@/lib/agents-real";
import { configIAService } from "@/lib/config-ia-api";

interface RdStationTokenDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode: "generate" | "refresh"; // generate = precisa gerar novo token, refresh = atualizar existente
}

export function RdStationTokenDialog({
  agent,
  open,
  onOpenChange,
  onSuccess,
  mode,
}: RdStationTokenDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"idle" | "waiting" | "exchanging" | "success" | "error">("idle");

  // Função para trocar código por access_token
  const exchangeCodeForToken = useCallback(async (code: string) => {
    if (!agent?.rdstationClientId || !agent?.rdstationClientSecret) {
      toast.error("Client ID e Client Secret são necessários");
      return false;
    }

    setStep("exchanging");
    const loadingToast = toast.loading("Gerando access token...");

    try {
      const response = await axios.post("/api/rdstation/exchange", {
        code,
        clientId: agent.rdstationClientId,
        clientSecret: agent.rdstationClientSecret,
      });

      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;

        // Atualizar o agente no backend
        await configIAService.updateConfig(agent.id, {
          rdstationCode: code,
          rdstationAccessToken: accessToken,
          rdstationRefreshToken: refreshToken,
        });

        toast.success("Token gerado com sucesso!", { id: loadingToast });
        setStep("success");
        onSuccess?.();

        // Fechar dialog após sucesso
        setTimeout(() => {
          onOpenChange(false);
          setStep("idle");
        }, 1500);

        return true;
      } else {
        toast.error("Erro ao gerar token", {
          id: loadingToast,
          description: response.data.error,
        });
        setStep("error");
        return false;
      }
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      let errorMessage = "Erro desconhecido";

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data?.error || "";
        if (apiError.includes("invalid_client") || apiError.includes("Invalid client")) {
          errorMessage = "Credenciais inválidas. Verifique o Client ID e Client Secret.";
        } else if (apiError.includes("invalid_grant") || apiError.includes("expired")) {
          errorMessage = "Código expirado ou já utilizado. Tente gerar novamente.";
        } else {
          errorMessage = apiError || "Erro ao gerar token";
        }
      }

      toast.error("Erro ao gerar token", {
        id: loadingToast,
        description: errorMessage,
      });
      setStep("error");
      return false;
    }
  }, [agent, onSuccess, onOpenChange]);

  // Função para atualizar token usando refresh_token
  const refreshToken = useCallback(async () => {
    if (!agent?.rdstationClientId || !agent?.rdstationClientSecret || !agent?.rdstationRefreshToken) {
      toast.error("Configuração incompleta para atualização");
      return;
    }

    setIsProcessing(true);
    setStep("exchanging");
    const loadingToast = toast.loading("Atualizando token...");

    try {
      const response = await axios.post("/api/rdstation/refresh", {
        refreshToken: agent.rdstationRefreshToken,
        clientId: agent.rdstationClientId,
        clientSecret: agent.rdstationClientSecret,
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Atualizar o agente no backend
        await configIAService.updateConfig(agent.id, {
          rdstationAccessToken: accessToken,
          rdstationRefreshToken: newRefreshToken || agent.rdstationRefreshToken,
        });

        toast.success("Token atualizado com sucesso!", { id: loadingToast });
        setStep("success");
        onSuccess?.();

        // Fechar dialog após sucesso
        setTimeout(() => {
          onOpenChange(false);
          setStep("idle");
        }, 1500);
      } else {
        toast.error("Erro ao atualizar token", {
          id: loadingToast,
          description: response.data.error,
        });
        setStep("error");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      let errorMessage = "Erro desconhecido";

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data?.error || "";
        if (apiError.includes("invalid_grant") || apiError.includes("expired")) {
          errorMessage = "Refresh token expirado. Regenere a autorização.";
        } else {
          errorMessage = apiError || "Erro ao atualizar token";
        }
      }

      toast.error("Erro ao atualizar token", {
        id: loadingToast,
        description: errorMessage,
      });
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  }, [agent, onSuccess, onOpenChange]);

  // Listener para receber código de autorização do RD Station via postMessage
  useEffect(() => {
    if (!open || mode !== "generate") return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "RDSTATION_AUTH_CODE" && event.data?.code) {
        const code = event.data.code;
        toast.success("Código de autorização obtido!");
        await exchangeCodeForToken(code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [open, mode, exchangeCodeForToken]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setStep("idle");
      setIsProcessing(false);
    }
  }, [open]);

  const openAuthPopup = () => {
    if (!agent?.rdstationClientId) {
      toast.error("Client ID não configurado");
      return;
    }

    const frontendUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUri = encodeURIComponent(`${frontendUrl}/api/rdstation/callback`);
    const authUrl = `https://accounts.rdstation.com/oauth/authorize?response_type=code&client_id=${agent.rdstationClientId}&redirect_uri=${redirectUri}`;

    window.open(authUrl, "_blank", "width=600,height=700");
    setStep("waiting");
    toast.info("Uma nova janela foi aberta para autorização", {
      description: "Após autorizar, o token será gerado automaticamente.",
    });
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "generate" ? "Gerar Token RD Station" : "Atualizar Token RD Station"}
          </DialogTitle>
          <DialogDescription>
            {mode === "generate"
              ? `Autorize o acesso do agente "${agent.name}" ao RD Station CRM.`
              : `Atualize o token de acesso do agente "${agent.name}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "generate" ? (
            <>
              {step === "idle" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para abrir a página de autorização do RD Station.
                    Após autorizar, o token será gerado automaticamente.
                  </p>
                  <Button onClick={openAuthPopup} className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Autorizar no RD Station
                  </Button>
                </div>
              )}

              {step === "waiting" && (
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-sm text-muted-foreground">
                    Aguardando autorização no RD Station...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complete a autorização na janela aberta.
                  </p>
                </div>
              )}

              {step === "exchanging" && (
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-sm text-muted-foreground">Gerando access token...</p>
                </div>
              )}

              {step === "success" && (
                <div className="text-center space-y-3">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-sm text-green-600 font-medium">Token gerado com sucesso!</p>
                </div>
              )}

              {step === "error" && (
                <div className="text-center space-y-3">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                  <p className="text-sm text-red-600">Erro ao gerar token</p>
                  <Button onClick={openAuthPopup} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {step === "idle" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O token do RD Station será atualizado usando o refresh token existente.
                    Isso renovará a conexão sem precisar autorizar novamente.
                  </p>
                  <Button
                    onClick={refreshToken}
                    className="w-full gap-2"
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar Token
                  </Button>
                </div>
              )}

              {step === "exchanging" && (
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-sm text-muted-foreground">Atualizando token...</p>
                </div>
              )}

              {step === "success" && (
                <div className="text-center space-y-3">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-sm text-green-600 font-medium">Token atualizado com sucesso!</p>
                </div>
              )}

              {step === "error" && (
                <div className="text-center space-y-3">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                  <p className="text-sm text-red-600">Erro ao atualizar token</p>
                  <p className="text-xs text-muted-foreground">
                    O refresh token pode ter expirado. Tente regenerar a autorização.
                  </p>
                  <Button onClick={refreshToken} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
