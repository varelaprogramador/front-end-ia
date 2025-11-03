"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Credential, CredentialType } from "@/types/credential";
import { Calendar, MessageSquare, Workflow, Key } from "lucide-react";

interface CredentialFormProps {
  credential?: Credential | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const credentialTypes: { value: CredentialType; label: string; icon: any }[] = [
  { value: "GOOGLE_CALENDAR", label: "Google Calendar", icon: Calendar },
  { value: "CHATGPT", label: "ChatGPT", icon: MessageSquare },
  { value: "N8N", label: "N8N", icon: Workflow },
  { value: "CUSTOM", label: "Personalizada", icon: Key },
];

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function CredentialForm({ credential, onSuccess, onCancel }: CredentialFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: credential?.name || "",
    type: credential?.type || "CUSTOM" as CredentialType,
    url: credential?.url || "",
    method: credential?.method || "POST",
    authHeaderKey: credential?.authHeaderKey || "X-N8N-API-KEY",
    authHeaderValue: credential?.authHeaderValue || "",
    customHeaders: JSON.stringify(credential?.customHeaders || {}, null, 2),
    awaitResponse: credential?.awaitResponse || false,
    successModel: JSON.stringify(credential?.successModel || {}, null, 2),
    data: JSON.stringify(credential?.data || {}, null, 2),
    isActive: credential?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar JSONs
      let customHeaders = null;
      let successModel = null;
      let data = null;

      if (formData.customHeaders.trim()) {
        try {
          customHeaders = JSON.parse(formData.customHeaders);
        } catch {
          toast.error("Headers customizados devem ser um JSON válido");
          setLoading(false);
          return;
        }
      }

      if (formData.successModel.trim()) {
        try {
          successModel = JSON.parse(formData.successModel);
        } catch {
          toast.error("Modelo de sucesso deve ser um JSON válido");
          setLoading(false);
          return;
        }
      }

      if (formData.data.trim()) {
        try {
          data = JSON.parse(formData.data);
        } catch {
          toast.error("Dados devem ser um JSON válido");
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        url: formData.url,
        method: formData.method,
        authHeaderKey: formData.authHeaderKey || undefined,
        authHeaderValue: formData.authHeaderValue || undefined,
        customHeaders,
        awaitResponse: formData.awaitResponse,
        successModel,
        data,
        isActive: formData.isActive,
      };

      const { createCredential, updateCredential } = await import("@/lib/credentials-api");

      if (credential) {
        await updateCredential(credential.id, payload);
        toast.success("Credencial atualizada com sucesso");
      } else {
        await createCredential(payload);
        toast.success("Credencial criada com sucesso");
      }

      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar credencial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {/* Nome e Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Credencial *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Minha API N8N"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: CredentialType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {credentialTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* URL e Método */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="url">URL da API *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.exemplo.com/endpoint"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método HTTP *</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {httpMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs para configurações avançadas */}
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 dark:bg-muted">
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="response">Resposta</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>
                  Configure a chave de autenticação da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authHeaderKey">Nome do Header</Label>
                    <Input
                      id="authHeaderKey"
                      value={formData.authHeaderKey}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderKey: e.target.value })
                      }
                      placeholder="X-N8N-API-KEY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authHeaderValue">Valor da Chave</Label>
                    <Input
                      id="authHeaderValue"
                      type="password"
                      value={formData.authHeaderValue}
                      onChange={(e) =>
                        setFormData({ ...formData, authHeaderValue: e.target.value })
                      }
                      placeholder="sua-chave-api-aqui"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Headers Customizados</CardTitle>
                <CardDescription>
                  Headers adicionais em formato JSON (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.customHeaders}
                  onChange={(e) =>
                    setFormData({ ...formData, customHeaders: e.target.value })
                  }
                  placeholder='{\n  "Content-Type": "application/json",\n  "Custom-Header": "valor"\n}'
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Requisição</CardTitle>
                <CardDescription>
                  Body da requisição em formato JSON (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  placeholder='{\n  "key": "value",\n  "nested": {\n    "data": "example"\n  }\n}'
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Resposta</CardTitle>
                <CardDescription>
                  Como a API deve responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="awaitResponse">Aguardar Resposta</Label>
                    <p className="text-sm text-muted-foreground">
                      Esperar pela resposta da API antes de continuar
                    </p>
                  </div>
                  <Switch
                    id="awaitResponse"
                    checked={formData.awaitResponse}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, awaitResponse: checked })
                    }
                  />
                </div>

                {formData.awaitResponse && (
                  <div className="space-y-2">
                    <Label htmlFor="successModel">Modelo de Sucesso</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Formato esperado da resposta quando bem-sucedida (JSON)
                    </p>
                    <Textarea
                      id="successModel"
                      value={formData.successModel}
                      onChange={(e) =>
                        setFormData({ ...formData, successModel: e.target.value })
                      }
                      placeholder='{\n  "success": true,\n  "data": {\n    "id": "string",\n    "status": "completed"\n  }\n}'
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Credencial Ativa</Label>
            <p className="text-sm text-muted-foreground">
              Desative para manter a credencial salva mas não utilizável
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : credential ? "Atualizar" : "Criar Credencial"}
        </Button>
      </div>
    </form>
  );
}
