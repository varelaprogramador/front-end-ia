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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Credential, TestCredentialResponse } from "@/types/credential";
import { Loader2, CheckCircle2, XCircle, TestTube } from "lucide-react";

interface TestCredentialDialogProps {
  credential: Credential;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestCredentialDialog({
  credential,
  open,
  onOpenChange,
}: TestCredentialDialogProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestCredentialResponse | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { testCredential } = await import("@/lib/credentials-api");
      const data = await testCredential(credential.id);
      setResult(data);

      if (data.success) {
        toast.success("Teste realizado com sucesso!");
      } else {
        toast.error("Erro no teste da credencial");
      }
    } catch (error) {
      toast.error("Erro ao testar credencial");
      setResult({
        success: false,
        status: 0,
        statusText: "Network Error",
        data: { message: "Erro de conexão" },
        error: "Erro de conexão com o servidor",
      });
    } finally {
      setTesting(false);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testar Credencial: {credential.name}
          </DialogTitle>
          <DialogDescription>
            Execute um teste real da credencial para verificar se está funcionando
            corretamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Requisição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes da Requisição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">URL</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {credential.url}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Método</p>
                  <Badge variant="secondary">{credential.method}</Badge>
                </div>
                {credential.authHeaderKey && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Header de Auth</p>
                      <p className="text-sm text-muted-foreground">
                        {credential.authHeaderKey}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aguardar Resposta</p>
                      <Badge variant={credential.awaitResponse ? "default" : "secondary"}>
                        {credential.awaitResponse ? "Sim" : "Não"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botão de Teste */}
          <Button
            onClick={handleTest}
            disabled={testing}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Executar Teste
              </>
            )}
          </Button>

          {/* Resultado do Teste */}
          {result && (
            <Card className={result.success ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-700">Teste Bem-Sucedido</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">Teste Falhou</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status Code</p>
                    <Badge
                      variant={
                        result.status >= 200 && result.status < 300
                          ? "default"
                          : "destructive"
                      }
                    >
                      {result.status} - {result.statusText}
                    </Badge>
                  </div>
                  {result.error && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-red-600">Erro</p>
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  )}
                </div>

                {/* Tabs para Response */}
                <Tabs defaultValue="data" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="data">Dados da Resposta</TabsTrigger>
                    <TabsTrigger value="headers">Headers da Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="data" className="space-y-2">
                    <div className="rounded-lg bg-muted p-4">
                      <pre className="text-xs overflow-auto max-h-96">
                        {formatJson(result.data)}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="headers" className="space-y-2">
                    {result.headers ? (
                      <div className="rounded-lg bg-muted p-4">
                        <pre className="text-xs overflow-auto max-h-96">
                          {formatJson(result.headers)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum header disponível
                      </p>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Validação contra Success Model */}
                {credential.successModel && result.success && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Modelo de Sucesso Esperado
                    </p>
                    <pre className="text-xs text-blue-800 overflow-auto max-h-40">
                      {formatJson(credential.successModel)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
