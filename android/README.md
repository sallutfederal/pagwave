# Pagwave Android App

Aplicativo Android nativo (**Kotlin + Jetpack Compose + Material 3**) espelhando o design, cores (`Obsidian Dark #08090C` e `Mist Light #ECEEE9`, destaque dourado `#E2BE72` e cards em vidro fosco) e todas as funcionalidades reais da infraestrutura web da **pagwave**.

## Estrutura do Projeto

- `core/designsystem/`: Paleta exata Pagwave (`Theme.kt`), logotipo vetorial animado/gradiente (`PagwaveLogo.kt`), ícones monocromáticos P&B (`PagwaveIcons.kt`) e componentes reutilizáveis (`Components.kt`).
- `core/model/`: Contratos DTO `@Serializable` idênticos aos endpoints da API web (`/api/auth/*`, `/api/dashboard/*`, `/api/wallet/*`, `/api/notifications`, `/api/integrations/*`).
- `core/network/`: `PersistentCookieJar` criptografado com `EncryptedSharedPreferences` (`pw_access` / `pw_refresh`) + `TokenRefreshAuthenticator` para renovação automática de sessão 401 via `/api/auth/refresh`.
- `core/i18n/`: Traduções em 6 idiomas (`PT`, `EN`, `ES`, `AR` com suporte RTL, `FR`, `DE`) sincronizadas com PostgreSQL via `/api/auth/locale`.
- `data/`: `PagwaveRepository` centralizando tratamento tipado de erros HTTP.
- `ui/state/` & `ui/screens/`:
  - **Auth (`AuthScreens.kt`)**: Login com 2FA, Criação de conta (Pessoal / Empresarial) e Recuperação de senha.
  - **Painel (`DashboardScreen.kt`)**: Saudação, carrossel multi-moeda, ações rápidas, gráfico de estatísticas e transações recentes.
  - **Carteira (`WalletScreen.kt`)**: Depósito/Cobrança (Pix Copia e Cola, SPEI, TRON/Solana), Transferência P2P instantânea, Conversão FX com cotação ao vivo e Saque com gerenciamento de beneficiários salvos.
  - **Transações (`TransactionsScreen.kt`)**: 4 cards de resumo KPI em preto e branco moderno, busca, filtros e recibo detalhado.
  - **Ajustes & Notificações (`SettingsScreen.kt` + `PagwaveApp.kt`)**: Edição de perfil + badge KYC, 4 chaves de preferência de notificação sincronizadas, sino de alertas com canal nativo Android (`POST_NOTIFICATIONS`), 2FA, troca de senha e credenciais API.

## Como compilar o APK

1. Abra a pasta `android/` no **Android Studio** ou execute no terminal dentro de `android/`:

```bash
./gradlew assembleDebug
```

2. O APK estará em `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Para apontar para um servidor de staging/local em vez de `https://www.pagwave.com`, altere `PAGWAVE_BASE_URL` em `app/build.gradle.kts`.
