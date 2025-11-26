"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react";
import { Credential } from "@/types/credential";
import { resendCredential } from "@/lib/credentials-api";
import { toast } from "sonner";

interface ResendCredentialDialogProps {
  credential: Credential | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ResendState = "idle" | "loading" | "success" | "error";

interface ResendResponse {
  success: boolean;
  message: string;
  data?: {
    success: boolean;
    credential: Credential;
    n8nResponse: any;
  };
  error?: string;
}

export function ResendCredentialDialog({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: ResendCredentialDialogProps) {
  const [state, setState] = useState<ResendState>("idle");
  const [response, setResponse] = useState<ResendResponse | null>(null);

  const handleResend = async () => {
    if (!credential) return;

    setState("loading");
    setResponse(null);

    try {
      const result = await resendCredential(credential.id);
      setResponse(result);

      if (result.success) {
        setState("success");
        toast.success("Credencial reenviada com sucesso!");
        onSuccess?.();
      } else {
        setState("error");
        toast.error("Erro ao reenviar credencial");
      }
    } catch (error: any) {
      setState("error");
      setResponse({
        success: false,
        message: "Erro ao reenviar credencial",
        error: error.message || "Erro desconhecido",
      });
      toast.error("Erro ao reenviar credencial");
    }
  };

  const handleClose = () => {
    setState("idle");
    setResponse(null);
    onOpenChange(false);
  };

  const handleCopyJSON = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast.success("JSON copiado para a área de transferência");
    }
  };

  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reenviar para N8N</DialogTitle>
          <DialogDescription>
            Credencial: <span className="font-semibold">{credential.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Estado Idle - Botão para iniciar */}
          {state === "idle" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <RefreshCw className="h-12 w-12 mx-auto text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Reenviar Credencial para N8N
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Isso enviará a credencial para o webhook do N8N e aguardará a resposta.
                O ID do N8N será atualizado no banco de dados.
              </p>
              <Button onClick={handleResend} className="w-full max-w-xs">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Agora
              </Button>
            </div>
          )}

          {/* Estado Loading - Aguardando resposta */}
          {state === "loading" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <Loader2 className="h-12 w-12 mx-auto text-purple-600 dark:text-purple-400 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aguardando resposta do N8N...</h3>
              <p className="text-sm text-muted-foreground">
                Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Estado Success - Resposta recebida */}
          {state === "success" && response && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Credencial reenviada com sucesso!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {response.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resposta JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Resposta do N8N:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJSON}
                    className="h-7 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar JSON
                  </Button>
                </div>
                <div className="rounded-lg bg-gray-900 dark:bg-gray-950 p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-100 dark:text-gray-300">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Informações da credencial atualizada */}
              {response.data?.credential && (
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Credencial Atualizada:
                  </h4>
                  <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
                    <div className="flex justify-between">
                      <span className="font-medium">ID Local:</span>
                      <span className="font-mono">{response.data.credential.id}</span>
                    </div>
                    {response.data.credential.id_n8n && (
                      <div className="flex justify-between">
                        <span className="font-medium">ID N8N:</span>
                        <span className="font-mono">{response.data.credential.id_n8n}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Nome:</span>
                      <span>{response.data.credential.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tipo:</span>
                      <span>{response.data.credential.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estado Error - Erro na resposta */}
          {state === "error" && response && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                      Erro ao reenviar credencial
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {response.error || response.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resposta JSON do erro */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Resposta Completa:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJSON}
                    className="h-7 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar JSON
                  </Button>
                </div>
                <div className="rounded-lg bg-gray-900 dark:bg-gray-950 p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-100 dark:text-gray-300">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Botão para tentar novamente */}
              <Button onClick={handleResend} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
