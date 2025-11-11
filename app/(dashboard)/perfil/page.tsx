"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Camera,
  Save,
  Loader2,
  Key,
  Database
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

export default function PerfilPage() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [publicMetadata, setPublicMetadata] = useState("{}");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setPublicMetadata(JSON.stringify(user.publicMetadata || {}, null, 2));
    }
  }, [user]);

  const editorTheme = mounted ? (resolvedTheme === "dark" ? "vs-dark" : "light") : "light";

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  const handleSaveMetadata = async () => {
    setLoading(true);
    try {
      const parsedMetadata = JSON.parse(publicMetadata);
      await user.update({
        publicMetadata: parsedMetadata,
      });
      toast.success("Metadata atualizado com sucesso!");
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error("JSON inválido no metadata");
      } else {
        console.error("Error updating metadata:", error);
        toast.error("Erro ao atualizar metadata");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }

    setUploadingPhoto(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Não disponível";
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
        </div>
      </div>

      {/* Header com Avatar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">{user.fullName || "Usuário"}</h2>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.primaryEmailAddress?.emailAddress || "Email não disponível"}
              </p>
              <div className="flex gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {user.publicMetadata?.role || "Usuário"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Desde {formatDate(user.createdAt)}
                </Badge>
              </div>
            </div>

            <Button variant="outline" onClick={() => openUserProfile()}>
              Configurações Avançadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 dark:bg-muted">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="metadata">Public Metadata</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* Informações Básicas */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações básicas de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <p className="text-sm font-medium">{user.firstName || "Não definido"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Sobrenome</Label>
                    <p className="text-sm font-medium">{user.lastName || "Não definido"}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para alterar nome e sobrenome, use o botão "Editar no Clerk" abaixo
                </p>
              </div>

              <Separator />

              <Separator />

              <div className="space-y-2">
                <Label>Email Principal</Label>
                <Input
                  value={user.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Para alterar o email, use as Configurações Avançadas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={user.username || "Não definido"}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  ID do Usuário: <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => openUserProfile()}>
                  <User className="mr-2 h-4 w-4" />
                  Editar Informações no Clerk
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Metadata */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Public Metadata
              </CardTitle>
              <CardDescription>
                Dados públicos customizados do seu perfil (formato JSON)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dados Públicos (JSON)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Editor
                    key={`metadata-${editorTheme}`}
                    height="300px"
                    defaultLanguage="json"
                    value={publicMetadata}
                    onChange={(value) => setPublicMetadata(value || "{}")}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Exemplo: role, preferences, settings customizados, etc.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveMetadata} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Metadata
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Gerencie senha, autenticação de dois fatores e sessões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Senha</h4>
                    <p className="text-sm text-muted-foreground">
                      Última atualização: {formatDate(user.passwordEnabled ? user.updatedAt : null)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => openUserProfile()}>
                    Alterar Senha
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.twoFactorEnabled ? "Ativada" : "Desativada"}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => openUserProfile()}>
                    Configurar 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sessões Ativas</h4>
                    <p className="text-sm text-muted-foreground">
                      Gerencie dispositivos conectados
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => openUserProfile()}>
                    Ver Sessões
                  </Button>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Informações da Conta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID do Usuário:</span>
                      <code className="text-xs bg-background px-2 py-1 rounded">{user.id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última atualização:</span>
                      <span>{formatDate(user.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
