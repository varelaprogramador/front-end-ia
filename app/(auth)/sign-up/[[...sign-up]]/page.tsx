import { SignIn, SignUp } from "@clerk/nextjs"

export default function HomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg">
                            <svg className="h-10 w-10 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-balance text-foreground mb-3">Sistema de Agentes IA</h1>
                    <p className="text-pretty text-muted-foreground text-lg">Crie sua conta agora</p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1 shadow-xl">
                    <SignUp
                        appearance={{
                            elements: {
                                formButtonPrimary:
                                    "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl",
                                card: "bg-card/80 backdrop-blur border-0 shadow-none rounded-xl",
                                headerTitle: "text-foreground font-bold text-xl",
                                headerSubtitle: "text-muted-foreground",
                                socialButtonsBlockButton:
                                    "border-border/50 text-foreground hover:bg-accent/50 transition-all duration-200 backdrop-blur-sm",
                                formFieldLabel: "text-foreground font-medium",
                                formFieldInput:
                                    "bg-background/50 border-border/50 text-foreground backdrop-blur-sm focus:border-primary/50 transition-all duration-200",
                                footerActionLink: "text-primary hover:text-primary/80 font-medium",
                                dividerLine: "bg-border/30",
                                dividerText: "text-muted-foreground/70",
                            },
                        }}
                        redirectUrl="/workspace"
                        signInUrl="/sign-in"
                    />
                </div>
            </div>
        </div>
    )
}
